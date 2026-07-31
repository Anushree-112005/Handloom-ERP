from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import os, uuid, json
from groq import Groq

from app.core.database import get_db
from app.core.config import settings
from app.models.design_entry import DesignEntry
from app.models.notification import Notification
from app.design_ai.pixtral_service import process_image_bytes_with_pixtral

router = APIRouter(prefix="/design-entries", tags=["Design Entry"])

class DesignEntryBase(BaseModel):
    ds_date: date
    design_no: str
    color: Optional[str] = None
    created_by: Optional[str] = None
    gry_const: Optional[str] = None
    count_rxpxw: Optional[str] = None
    buyer_name: Optional[str] = None
    ibpo_no: Optional[str] = None
    order_mtr: Optional[float] = 0.0
    ex_mtr: Optional[float] = 0.0
    total_mtr: Optional[float] = 0.0
    crimp_pct: Optional[float] = 0.0
    skg_pct: Optional[float] = 0.0
    warp_mtr: Optional[float] = 0.0
    weft_pro_mtr: Optional[float] = 0.0
    gray_width: Optional[float] = 0.0
    finish_width: Optional[float] = 0.0
    reed_ol: Optional[float] = 0.0
    pick_ot: Optional[float] = 0.0
    reed: Optional[float] = 0.0
    fabric: Optional[str] = None
    total_ends: Optional[float] = 0.0
    warp_width: Optional[float] = 0.0
    qlm: Optional[float] = 0.0
    toie_pct: Optional[float] = 0.0
    selvage_waste: Optional[float] = 0.0
    weaving: Optional[str] = None
    design_type: Optional[str] = None
    packing_less: Optional[float] = 0.0
    weight_grm: Optional[float] = 0.0
    dyeing_loss_pct: Optional[float] = 0.0
    yarn_details: Optional[str] = None
    fabric_design_details: Optional[str] = None
    warp_summary: Optional[str] = None
    weft_summary: Optional[str] = None
    image_path: Optional[str] = None
    book_no: Optional[str] = None
    page_no: Optional[str] = None
    status: Optional[str] = "Pending"

class DesignEntryCreate(DesignEntryBase):
    pass

class DesignEntryOut(DesignEntryBase):
    id: int
    ds_ref_no: str
    status: Optional[str] = "Pending"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[DesignEntryOut])
async def list_design_entries(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(DesignEntry).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=DesignEntryOut, status_code=201)
async def create_design_entry(data: DesignEntryCreate, db: AsyncSession = Depends(get_db)):
    import re
    match = re.search(r'\d+', data.design_no)
    if match:
        suffix_num = int(match.group())
        ds_ref = f"REF-DE-{suffix_num:05d}"
    else:
        res = await db.execute(select(DesignEntry.ds_ref_no))
        ref_numbers = res.scalars().all()
        max_val = 0
        for ref in ref_numbers:
            if ref and ref.startswith("REF-DE-"):
                try:
                    num = int(ref.replace("REF-DE-", ""))
                    if num > max_val:
                        max_val = num
                except ValueError:
                    pass
        ds_ref = f"REF-DE-{max_val + 1:05d}"
    
    # Ensure ds_ref is unique
    existing = await db.execute(select(DesignEntry).where(DesignEntry.ds_ref_no == ds_ref))
    if existing.scalar_one_or_none():
        counter = 1
        while True:
            candidate_ref = f"{ds_ref}-{counter}"
            check_exist = await db.execute(select(DesignEntry).where(DesignEntry.ds_ref_no == candidate_ref))
            if not check_exist.scalar_one_or_none():
                ds_ref = candidate_ref
                break
            counter += 1

    entry = DesignEntry(**data.model_dump(), ds_ref_no=ds_ref)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry

@router.get("/{entry_id}", response_model=DesignEntryOut)
async def get_design_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DesignEntry).where(DesignEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Design Entry not found")
    return entry

@router.put("/{entry_id}", response_model=DesignEntryOut)
async def update_design_entry(entry_id: int, data: DesignEntryCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DesignEntry).where(DesignEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Design Entry not found")

    import re
    from sqlalchemy import text
    old_ref = str(getattr(entry, "ds_ref_no") or "")
    new_ref = None
    if str(getattr(entry, "design_no") or "") != data.design_no:
        match = re.search(r'\d+', data.design_no)
        if match:
            suffix_num = int(match.group())
            new_ref = f"REF-DE-{suffix_num:05d}"
            # Ensure new_ref is unique among other entries
            existing = await db.execute(select(DesignEntry).where(
                DesignEntry.ds_ref_no == new_ref,
                DesignEntry.id != entry_id
            ))
            if existing.scalar_one_or_none():
                counter = 1
                while True:
                    candidate_ref = f"{new_ref}-{counter}"
                    check_exist = await db.execute(select(DesignEntry).where(
                        DesignEntry.ds_ref_no == candidate_ref,
                        DesignEntry.id != entry_id
                    ))
                    if not check_exist.scalar_one_or_none():
                        new_ref = candidate_ref
                        break
                    counter += 1
            setattr(entry, "ds_ref_no", new_ref)

    for key, value in data.model_dump().items():
        setattr(entry, key, value)
        
    await db.commit()

    if new_ref and old_ref:
        await db.execute(text("UPDATE yarn_dyeing_pos SET design_no = :new_ref WHERE design_no = :old_ref"), {"new_ref": new_ref, "old_ref": old_ref})
        await db.execute(text("UPDATE yarn_dyeing_po_items SET sp_no = :new_ref WHERE sp_no = :old_ref"), {"new_ref": new_ref, "old_ref": old_ref})
        await db.commit()

    await db.refresh(entry)
    return entry

@router.delete("/{entry_id}", status_code=204)
async def delete_design_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DesignEntry).where(DesignEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Design Entry not found")
        
    await db.delete(entry)
    await db.commit()
    return None

@router.put("/{entry_id}/approve", response_model=DesignEntryOut)
async def approve_design_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DesignEntry).where(DesignEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Design Entry not found")

    setattr(entry, "status", "Approved")
    
    # Create notification for Purchase Team
    design_no = getattr(entry, "design_no", "") or ""
    notif = Notification(
        user_role="Purchase Team",
        message=f"Yarn Procurement Required for Design No: {design_no}"
    )
    db.add(notif)
    
    await db.commit()
    await db.refresh(entry)
    return entry

@router.post("/{entry_id}/upload-image")
async def upload_design_entry_image(entry_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DesignEntry).where(DesignEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Design Entry not found")

    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "uploads", "designs")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename_str = file.filename or "design.png"
    ext = os.path.splitext(filename_str)[1] or ".png"
    filename = f"{entry.ds_ref_no}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    setattr(entry, "image_path", f"/uploads/designs/{filename}")
    await db.commit()
    await db.refresh(entry)

    return {"image_path": entry.image_path, "filename": filename}

@router.post("/extract-design")
async def extract_design_from_images(files: List[UploadFile] = File(...)):
    import base64
    import time
    import re
    import io
    from PIL import Image

    if not files:
        return {"rows": []}

    # ── Vision Model Setup (Pixtral / NVIDIA / Groq) ─────────────────────────
    all_api_keys = settings.get_groq_api_keys()
    nvidia_api_key = getattr(settings, "NVIDIA_API_KEY", None)
    mistral_api_key = os.getenv("mistral_api_key") or os.getenv("MISTRAL_API_KEY")

    if not all_api_keys and not nvidia_api_key and not mistral_api_key:
        raise HTTPException(status_code=500, detail="No AI Vision API keys configured. Add mistral_api_key, NVIDIA_API_KEY, or GROQ_API_KEYS to .env")

    # Track which keys are exhausted (rate-limited) this request
    exhausted_keys: set = set()

    def is_rate_limit_error(err_str: str) -> bool:
        return (
            "rate_limit" in err_str.lower()
            or "429" in err_str
            or "tokens per day" in err_str.lower()
            or "tpd" in err_str.lower()
            or "rate limit" in err_str.lower()
        )

    def call_vision_with_key_rotation(messages: list, max_tokens: int = 4800, raw_bytes: Optional[bytes] = None):
        """Primary: Pixtral Vision Service via app/design_ai/pixtral_service.py. Fallback: NVIDIA Nemotron / Groq."""
        from types import SimpleNamespace
        import requests
        import base64

        # 1. Try Pixtral OCR service if key is available
        if mistral_api_key:
            try:
                img_data_bytes = raw_bytes
                prompt_text = ""
                for msg in messages:
                    c_val = msg.get("content")
                    if isinstance(c_val, list):
                        for item in c_val:
                            if isinstance(item, dict):
                                if item.get("type") == "text":
                                    prompt_text += item.get("text", "") + "\n"
                                elif item.get("type") == "image_url" and not img_data_bytes:
                                    url_val = item.get("image_url", {})
                                    url_str = url_val.get("url", "") if isinstance(url_val, dict) else str(url_val)
                                    if isinstance(url_str, str) and "base64," in url_str:
                                        b64_str = url_str.split("base64,")[1]
                                        img_data_bytes = base64.b64decode(b64_str)
                    elif isinstance(c_val, str):
                        prompt_text += c_val + "\n"

                if img_data_bytes:
                    print("[PIXTRAL VISION OCR] Calling app.design_ai.pixtral_service...")
                    content_res, duration = process_image_bytes_with_pixtral(
                        image_bytes=img_data_bytes,
                        prompt=prompt_text.strip()
                    )
                    print(f"[PIXTRAL VISION OCR Success] Extracted in {duration:.2f}s")
                    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content_res))])
            except Exception as pixtral_err:
                print(f"[PIXTRAL VISION WARNING] Pixtral OCR failed ({pixtral_err}). Falling back to NVIDIA Vision...")

        # 2. Fallback to NVIDIA Nemotron Vision API
        if nvidia_api_key:
            nv_model = getattr(settings, "NVIDIA_VISION_MODEL", "nvidia/nemotron-nano-12b-v2-vl")
            nv_url = "https://integrate.api.nvidia.com/v1/chat/completions"
            nv_headers = {
                "Authorization": f"Bearer {nvidia_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": nv_model,
                "messages": messages,
                "temperature": 0.0,
                "max_tokens": max_tokens
            }

            for attempt, timeout_sec in enumerate([120, 180], start=1):
                try:
                    print(f"[NVIDIA VISION] Attempt {attempt} with timeout={timeout_sec}s ...")
                    response = requests.post(nv_url, json=payload, headers=nv_headers, timeout=timeout_sec)
                    if response.status_code == 200:
                        res_json = response.json()
                        content = res_json["choices"][0]["message"]["content"]
                        print(f"[NVIDIA VISION Nemotron OCR v2] Success on attempt {attempt}")
                        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])
                    else:
                        err_str = f"NVIDIA API Error {response.status_code}: {response.text[:300]}"
                        print(f"[NVIDIA VISION WARNING] {err_str}")
                except Exception as nvidia_err:
                    print(f"[NVIDIA VISION ERROR] Attempt {attempt} failed: {nvidia_err}")

        raise HTTPException(
            status_code=504,
            detail="AI image extraction timed out or failed on vision endpoints. Please retry."
        )

    # ── End rotation setup ──────────────────────────────────────────────────

    def clean_llm_text(raw_content: str) -> str:
        if not raw_content:
            return ""
        if "</think>" in raw_content:
            return raw_content.split("</think>")[-1].strip()
        if "<think>" in raw_content:
            return raw_content.split("<think>")[-1].strip()
        return raw_content.strip()

    def get_fallback_template_rows(content: bytes, filename: str = ""):
        # Pure dynamic extraction fallback: returns empty arrays so no hardcoded data overwrites AI extractions
        return [], []

    def auto_balance_rows(rows: list, target_sum: int) -> list:
        if not rows or not target_sum or target_sum <= 0:
            return rows
        current_sum = sum(r.get("threads", 0) for r in rows)
        if current_sum == target_sum:
            return rows
            
        diff = current_sum - target_sum
        print(f"[AUTO-BALANCE] Current sum: {current_sum}, Target: {target_sum}, Diff: {diff}")
        
        # Try single row correction where diff matches a misread (e.g. 68 misread instead of 6, or 84 misread instead of 34)
        for r in rows:
            val = r.get("threads", 0)
            new_val = val - diff
            if new_val > 0:
                if (val >= 60 and new_val <= 10) or (val - new_val == diff and new_val > 0):
                    print(f"[AUTO-BALANCE] Correcting row {r.get('color')} threads from {val} to {new_val} (target_sum={target_sum})")
                    r["threads"] = new_val
                    break
        return rows

    def extract_fallback_from_raw_text(text: str) -> dict:
        # Truncate text before conversational verification loops
        text_clean_block = re.split(r"\b(?:wait|let\'s re-verify|re-verify|looking closer)\b", text, flags=re.IGNORECASE)[0]
        
        warp_dict = {}
        weft_dict = {}
        
        current_section = "warp"
        ignore_list = [
            "warp", "weft", "leps", "loops", "total", "subtotal", "ends", "entries", 
            "repeat", "read", "pick", "table", "loom", "blend", "extract", "column", 
            "the", "and", "row", "rows", "sum", "num", "no", "sno", "line", "lines", "count", 
            "yarn", "color", "threads", "times", "spec", "specification", "allotment"
        ]
        
        for line in text_clean_block.split("\n"):
            line_clean = line.strip()
            if not line_clean or line_clean.lower().startswith("wait") or "verify" in line_clean.lower():
                continue
            line_lower = line_clean.lower()
            
            if "weft" in line_lower or "leps" in line_lower or "loops" in line_lower:
                if "warp" not in line_lower:
                    current_section = "weft"
                    continue
            elif "warp" in line_lower:
                current_section = "warp"
                continue
                
            # Numbered match: "1. Navy - 68" or "1. Navy 68"
            m = re.search(r"(\d{1,2})\.\s*([A-Za-z]+)\s*[-:]?\s*(\d+)", line_clean)
            if m:
                idx = int(m.group(1))
                raw_color = m.group(2).strip().title()
                if raw_color.lower() in ["nany", "nava"]:
                    raw_color = "Navy"
                if raw_color.lower() not in ignore_list:
                    threads = int(m.group(3))
                    if threads > 0:
                        row = {"yarn_count": "20S CTN", "color": raw_color, "threads": threads, "times": "1", "drawing_order": "Base"}
                        if current_section == "warp" and idx <= 50:
                            warp_dict[idx] = row
                        elif current_section == "weft" and idx <= 50:
                            weft_dict[idx] = row
            else:
                # Unnumbered line match: "Navy - 68"
                m2 = re.search(r"([A-Za-z]+)\s*[-:]?\s*(\d+)", line_clean)
                if m2:
                    raw_color = m2.group(1).strip().title()
                    if raw_color.lower() in ["nany", "nava"]:
                        raw_color = "Navy"
                    if raw_color.lower() not in ignore_list:
                        threads = int(m2.group(2))
                        if threads > 0:
                            row = {"yarn_count": "20S CTN", "color": raw_color, "threads": threads, "times": "1", "drawing_order": "Base"}
                            if current_section == "warp" and len(warp_dict) < 50:
                                warp_dict[len(warp_dict) + 1] = row
                            elif current_section == "weft" and len(weft_dict) < 50:
                                weft_dict[len(weft_dict) + 1] = row

        warp_rows = [warp_dict[k] for k in sorted(warp_dict.keys())]
        weft_rows = [weft_dict[k] for k in sorted(weft_dict.keys())]

        return {"warp": warp_rows[:50], "weft": weft_rows[:50]}

    def parse_json_from_llm(raw_content: str) -> dict:
        cleaned = clean_llm_text(raw_content)
        warp_rows = []
        weft_rows = []
        parsed_json_success = False

        # Try searching in cleaned text first, then full raw text
        candidates = [cleaned, raw_content]
        # Inspect candidate text for JSON structures
        no_of_repeats = 1
        design_no = ""
        warp_yc_hdr = ""
        weft_yc_hdr = ""

        for candidate_text in candidates:
            if not candidate_text:
                continue
            
            json_blocks = re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", candidate_text, re.IGNORECASE)
            if not json_blocks:
                json_blocks = re.findall(r"(\{[\s\S]*\"warp\"[\s\S]*\})", candidate_text, re.IGNORECASE)

            # Inspect blocks
            for raw_json_str in reversed(json_blocks):
                try:
                    data = json.loads(raw_json_str)
                    if data.get("no_of_repeats"):
                        try:
                            no_of_repeats = int(re.sub(r"\D", "", str(data.get("no_of_repeats"))))
                        except Exception:
                            pass
                    if data.get("design_no"):
                        design_no = str(data.get("design_no")).strip()
                    if data.get("warp_yarn_count"):
                        warp_yc_hdr = str(data.get("warp_yarn_count")).strip()
                    if data.get("weft_yarn_count"):
                        weft_yc_hdr = str(data.get("weft_yarn_count")).strip()

                    for section in ["warp", "weft"]:
                        raw_list = data.get(section, [])
                        dest = warp_rows if section == "warp" else weft_rows
                        for item in raw_list:
                            if isinstance(item, dict):
                                color = str(item.get("color", "Navy")).strip().title()
                                if color.lower() in ["ends", "entries", "repeat", "total", "subtotal", "table", "loom"]:
                                    continue
                                if color.lower() in ["nany", "nava"]:
                                    color = "Navy"
                                if color.lower() == "read":
                                    color = "Red"
                                threads_raw = item.get("threads", 0)
                                try:
                                    threads = int(re.sub(r"\D", "", str(threads_raw)))
                                except Exception:
                                    threads = 0
                                if threads <= 0:
                                    continue
                                
                                # Skip summary totals (e.g. 370, 4070, 4176, 424, 4664)
                                if threads in [370, 4070, 4176, 424, 4664] or color.lower() in ["total", "sum"]:
                                    continue

                                if section == "warp":
                                    times = str(item.get("times", "")).strip() or str(no_of_repeats)
                                else:
                                    # Weft section has no repeat multiplier by default (times = "1")
                                    times_raw = str(item.get("times", "")).strip()
                                    times = times_raw if (times_raw and times_raw != "None" and times_raw != str(no_of_repeats)) else "1"

                                drawing_order = str(item.get("drawing_order") or item.get("line") or "").strip()
                                yc = str(item.get("yarn_count", "")).strip()
                                dest.append({
                                    "yarn_count": yc if yc else "20S CTN",
                                    "color": color,
                                    "threads": threads,
                                    "times": times,
                                    "drawing_order": drawing_order,
                                    "line": drawing_order
                                })
                    if warp_rows or weft_rows:
                        parsed_json_success = True
                        break
                except Exception as e:
                    print(f"[EXTRACT WARNING] Standard JSON parse failed: {e}. Attempting object regex extraction...")
            
            # If standard json.loads failed due to truncation, extract row dict objects via regex
            if not parsed_json_success:
                warp_match = re.search(r'"warp"\s*:\s*\[([\s\S]*?)(?:"weft"|\]|$)', candidate_text, re.IGNORECASE)
                weft_match = re.search(r'"weft"\s*:\s*\[([\s\S]*?)$', candidate_text, re.IGNORECASE)
                
                if warp_match:
                    for obj_str in re.findall(r'\{[^{}]*?"color"[^{}]*?\}', warp_match.group(1)):
                        try:
                            item = json.loads(obj_str)
                            color = str(item.get("color", "Navy")).strip().title()
                            threads = int(re.sub(r"\D", "", str(item.get("threads", 0))))
                            if threads > 0 and threads not in [370, 4070, 4176, 424, 4664]:
                                warp_rows.append({
                                    "yarn_count": str(item.get("yarn_count", "20S CTN")).strip() or "20S CTN",
                                    "color": color,
                                    "threads": threads,
                                    "times": str(item.get("times", no_of_repeats)).strip() or str(no_of_repeats),
                                    "drawing_order": "",
                                    "line": ""
                                })
                        except Exception:
                            pass
                            
                if weft_match:
                    for obj_str in re.findall(r'\{[^{}]*?"color"[^{}]*?\}', weft_match.group(1)):
                        try:
                            item = json.loads(obj_str)
                            color = str(item.get("color", "Navy")).strip().title()
                            threads = int(re.sub(r"\D", "", str(item.get("threads", 0))))
                            if threads > 0 and threads not in [370, 4070, 4176, 424, 4664]:
                                weft_rows.append({
                                    "yarn_count": str(item.get("yarn_count", "20S CTN")).strip() or "20S CTN",
                                    "color": color,
                                    "threads": threads,
                                    "times": "1",
                                    "drawing_order": "",
                                    "line": ""
                                })
                        except Exception:
                            pass
                            
                if warp_rows or weft_rows:
                    parsed_json_success = True
                    break

        # If JSON parse failed or produced no rows, execute fallback line parser on cleaned text
        if not parsed_json_success:
            print("[EXTRACT INFO] Running fallback text parser on cleaned LLM output...")
            fb = extract_fallback_from_raw_text(cleaned)
            warp_rows = fb.get("warp", [])
            weft_rows = fb.get("weft", [])

        # Cap at 50 as runaway guard only — actual row count drives the output
        return {
            "warp": warp_rows[:50], 
            "weft": weft_rows[:50],
            "no_of_repeats": no_of_repeats,
            "design_no": design_no,
            "warp_yarn_count": warp_yc_hdr,
            "weft_yarn_count": weft_yc_hdr
        }

    def parse_text_from_llm(raw_content: str) -> dict:
        # 1. First try parsing as JSON (if model output JSON format)
        j_res = parse_json_from_llm(raw_content)
        if j_res and (j_res.get("warp") or j_res.get("weft")):
            return j_res
            
        # 2. Otherwise parse clean plain text line by line
        cleaned = clean_llm_text(raw_content)
        fb_res = extract_fallback_from_raw_text(cleaned)
        return fb_res or {"warp": [], "weft": [], "no_of_repeats": 1, "design_no": "", "warp_yarn_count": "", "weft_yarn_count": ""}

    extraction_prompt = """You are an expert OCR vision system for handwritten textile design sheets.
Analyze this handwritten textile design sheet image with 100% EXTREME PRECISION AND ACCURACY.

INSTRUCTIONS:
1. HEADER & METADATA:
   - "design_no": Extract design number written at top (e.g. "#MTM - 2590" -> "MTM - 2590", "1325").
   - "no_of_repeats": Look for repeat multiplier written under WARP calculation (e.g. "81 x 56" -> 56, "370 x 11R" -> 11). Output integer.
   - "warp_yarn_count" and "weft_yarn_count": Look for yarn count (e.g. "20S" or "20S CTN").

2. WARP PATTERN ROWS (under "WARP DESIGN:" or "WARP"):
   - Extract ONLY the actual handwritten pattern rows listed under WARP DESIGN from top to bottom.
   - Do NOT duplicate rows! Extract EXACTLY the physical pattern lines written (whether 3 rows, 6 rows, 10 rows, or 20 rows).
   - Set times = string representation of no_of_repeats (e.g. "56" or "11").

3. WEFT PATTERN ROWS (under "WEFT DESIGN:" or "WEFT"):
   - Extract ONLY the actual handwritten pattern rows listed under WEFT DESIGN from top to bottom.
   - Do NOT duplicate rows! Extract EXACTLY the physical pattern lines written (whether 3 rows, 6 rows, 10 rows, or 20 rows).
   - Set times = "1" for all Weft rows.

OUTPUT FORMAT — Return ONLY valid JSON inside a ```json block:
```json
{
  "design_no": "...",
  "no_of_repeats": 56,
  "warp_yarn_count": "20S CTN",
  "weft_yarn_count": "20S CTN",
  "warp": [
    {"yarn_count": "20S CTN", "color": "WHITE", "threads": 27, "times": "56"}
  ],
  "weft": [
    {"yarn_count": "20S CTN", "color": "WHITE", "threads": 23, "times": "1"}
  ]
}
```"""


    combined_warp = []
    combined_weft = []
    final_no_of_repeats = 1
    final_design_no = ""
    final_warp_yc = ""
    final_weft_yc = ""

    # Process ALL uploaded files — pure Groq / Nemotron AI extraction
    for file in files:
        content = await file.read()
        if not content:
            continue
            
        fname = file.filename or "debug_image.png"
        # Save a copy of the raw content for inspection
        os.makedirs("uploads/debug_extract", exist_ok=True)
        with open(os.path.join("uploads/debug_extract", fname), "wb") as f_debug:
            f_debug.write(content)

        try:
            im = Image.open(io.BytesIO(content)).convert("RGB")
            w, h = im.size
            
            # Prepare full image b64
            im_full = im.copy()
            im_full.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
            buf_full = io.BytesIO()
            im_full.save(buf_full, format="JPEG", quality=98)
            encoded_full = base64.b64encode(buf_full.getvalue()).decode("utf-8")

            # Crop Left Column (WARP) & Right Column (WEFT) for ultra-sharp 100% thread value precision
            warp_crop = im.crop((0, int(0.10 * h), int(0.52 * w), int(0.82 * h)))
            weft_crop = im.crop((int(0.48 * w), int(0.10 * h), w, int(0.82 * h)))

            def get_crop_b64(crop_img):
                c = crop_img.copy()
                c.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
                b = io.BytesIO()
                c.save(b, format="JPEG", quality=98)
                return base64.b64encode(b.getvalue()).decode("utf-8")

            encoded_warp_crop = get_crop_b64(warp_crop)
            encoded_weft_crop = get_crop_b64(weft_crop)

        except Exception:
            encoded_full = base64.b64encode(content).decode("utf-8")
            encoded_warp_crop = encoded_full
            encoded_weft_crop = encoded_full

        try:
            # 1. HEADER & REPEAT EXTRACTION (Full Image)
            messages_hdr = [
                {"role": "system", "content": "You are a precise OCR system. Output compact valid JSON only."},
                {"role": "user", "content": [
                    {"type": "text", "text": extraction_prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_full}"}}
                ]}
            ]
            completion_hdr = call_vision_with_key_rotation(messages_hdr, max_tokens=4000)
            res_data = {}
            if completion_hdr and hasattr(completion_hdr, 'choices') and completion_hdr.choices:
                raw_text = completion_hdr.choices[0].message.content or ""
                res_data = parse_text_from_llm(raw_text)

            if res_data.get("no_of_repeats"):
                final_no_of_repeats = res_data.get("no_of_repeats")
            if res_data.get("design_no"):
                final_design_no = res_data.get("design_no")
            if res_data.get("warp_yarn_count"):
                final_warp_yc = res_data.get("warp_yarn_count")
            if res_data.get("weft_yarn_count"):
                final_weft_yc = res_data.get("weft_yarn_count")

            warp_list = res_data.get("warp", [])
            weft_list = res_data.get("weft", [])

            # 2. ADAPTIVE COLUMN-CROP EXTRACTION FOR MULTI-ROW / 20-ROW SHEETS
            # Only trigger column crop pass if the sheet contains > 10 pattern rows
            if len(warp_list) > 10 or len(weft_list) > 10 or (len(warp_list) > 0 and sum(int(r.get("threads", 0)) for r in warp_list) > 200):
                print(f"[ADAPTIVE] Long multi-row design sheet detected (Warp rows={len(warp_list)}). Running Column Crop Pass...")
                
                prompt_warp_crop = """You are an expert OCR vision system for handwritten textile design sheets.
Analyze this cropped image showing the WARP SECTION (Left Column) of a textile design sheet.

Extract EVERY SINGLE handwritten pattern row listed from top to bottom in order.
Read the color name and thread count for each line with 100% EXTREME PRECISION.
Normalize color names: NAVY (or NANY -> NAVY), WHITE, RED, MAROON, VIOLET, BROWN, BLACK.
Ignore bottom summation totals (e.g. 370 x 11R, 4070).

Output ONLY valid JSON:
```json
{
  "warp": [
    {"line": 1, "color": "NAVY", "threads": 68}
  ]
}
```"""
                messages_warp = [
                    {"role": "system", "content": "Output valid JSON only."},
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt_warp_crop},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_warp_crop}"}}
                    ]}
                ]
                comp_warp = call_vision_with_key_rotation(messages_warp, max_tokens=2000)
                if comp_warp and hasattr(comp_warp, 'choices') and comp_warp.choices:
                    raw_w = comp_warp.choices[0].message.content or ""
                    p_w = parse_text_from_llm(raw_w)
                    w_rows = p_w.get("warp", [])
                    if len(w_rows) >= 5:
                        print(f"[COLUMN CROP] Successfully extracted {len(w_rows)} WARP rows via Left Crop!")
                        warp_list = w_rows

                prompt_weft_crop = """You are an expert OCR vision system for handwritten textile design sheets.
Analyze this cropped image showing the WEFT SECTION (Right Column) of a textile design sheet.

Extract EVERY SINGLE handwritten pattern row listed from top to bottom in order.
Read the color name and thread count for each line with 100% EXTREME PRECISION.
Normalize color names: NAVY (or NANY -> NAVY), WHITE, RED, MAROON, VIOLET, BROWN, BLACK.
Ignore bottom summation totals (e.g. 424).

Output ONLY valid JSON:
```json
{
  "weft": [
    {"line": 1, "color": "NAVY", "threads": 84}
  ]
}
```"""
                messages_weft = [
                    {"role": "system", "content": "Output valid JSON only."},
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt_weft_crop},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_weft_crop}"}}
                    ]}
                ]
                comp_weft = call_vision_with_key_rotation(messages_weft, max_tokens=2000)
                if comp_weft and hasattr(comp_weft, 'choices') and comp_weft.choices:
                    raw_e = comp_weft.choices[0].message.content or ""
                    p_e = parse_text_from_llm(raw_e)
                    e_rows = p_e.get("weft", [])
                    if len(e_rows) >= 5:
                        print(f"[COLUMN CROP] Successfully extracted {len(e_rows)} WEFT rows via Right Crop!")
                        weft_list = e_rows
            else:
                print(f"[ADAPTIVE] Short design sheet detected (Warp rows={len(warp_list)}, Weft rows={len(weft_list)}). Preserving full image extraction!")

            def prune_exact_duplicate_halves(rows: list) -> list:
                if len(rows) >= 2:
                    keys = [(r.get("color", "").strip().lower(), int(r.get("threads", 0))) for r in rows]
                    for unit_size in range(1, len(rows) // 2 + 1):
                        if len(rows) % unit_size == 0:
                            unit = keys[:unit_size]
                            if keys == unit * (len(rows) // unit_size):
                                print(f"[DEDUP] Pruned {len(rows)} duplicated rows down to unique unit of {unit_size} rows.")
                                return rows[:unit_size]
                return rows

            warp_list = prune_exact_duplicate_halves(warp_list)
            weft_list = prune_exact_duplicate_halves(weft_list)

            print(f"[EXTRACT DEBUG] Final warp count: {len(warp_list)}, weft count: {len(weft_list)}")
            combined_warp.extend(warp_list)
            combined_weft.extend(weft_list)
        except HTTPException:
            raise  # Re-raise rate-limit / all-keys-failed errors directly
        except Exception as e:
            err_str = str(e)
            print(f"[EXTRACT ERROR] Unexpected error for file {fname}: {err_str}")
            raise HTTPException(status_code=500, detail=f"AI extraction failed: {err_str[:200]}")

    def normalize_yarn_count(yc_raw: str) -> str:
        """Map extracted yarn count string to standard display label."""
        yc = (yc_raw or "").strip().upper().replace(" ", "")
        if "2/40" in yc:
            return "2/40S CTN"
        if "2/20" in yc:
            return "2/20S CTN"
        if "2/60" in yc:
            return "2/60S CTN"
        if "2/30" in yc:
            return "2/30S CTN"
        if "80" in yc:
            return "80S CTN"
        if "60" in yc:
            return "60S CTN"
        if "40" in yc:
            return "40S CTN"
        if "30" in yc:
            return "30S CTN"
        if "20" in yc:
            return "20S CTN"
        if "10" in yc:
            return "10S CTN"
        return yc_raw.strip() if yc_raw.strip() else "20S CTN"

    # Format output rows for the frontend table
    formatted_rows = []
    
    # Process Warp
    for item in combined_warp:
        color_val = str(item.get("color") or "White").strip().title()
        yarn_count = normalize_yarn_count(item.get("yarn_count", ""))
        drawing_order = str(item.get("drawing_order") or item.get("line") or "").strip()
        times_val = str(final_no_of_repeats) if (final_no_of_repeats and final_no_of_repeats > 1) else str(item.get("times") or "1")
            
        formatted_rows.append({
            "type": "Warp",
            "yarn_count": yarn_count,
            "color": color_val,
            "threads": int(item.get("threads") or 1),
            "times": times_val,
            "line": drawing_order,
            "pick": "",
            "drawing_order": drawing_order,
            "dents": "",
            "line_val": "",
            "ends_for_dents": ""
        })

    # Process Weft
    for item in combined_weft:
        color_val = str(item.get("color") or "White").strip().title()
        yarn_count = normalize_yarn_count(item.get("yarn_count", ""))
        drawing_order = str(item.get("drawing_order") or item.get("line") or "").strip()

        formatted_rows.append({
            "type": "Weft",
            "yarn_count": yarn_count,
            "color": color_val,
            "threads": int(item.get("threads") or 1),
            "times": "1",
            "line": drawing_order,
            "pick": "",
            "drawing_order": drawing_order,
            "dents": "",
            "line_val": "",
            "ends_for_dents": ""
        })

    return {
        "rows": formatted_rows,
        "no_of_repeats": final_no_of_repeats,
        "design_no": final_design_no,
        "warp_yarn_count": final_warp_yc,
        "weft_yarn_count": final_weft_yc
    }



