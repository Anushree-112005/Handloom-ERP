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
    old_ref = entry.ds_ref_no
    new_ref = None
    if entry.design_no != data.design_no:
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

    # ── Multi-API-key rotation ──────────────────────────────────────────────
    # Load all keys from config; exhausted keys are tracked per-request
    all_api_keys = settings.get_groq_api_keys()
    if not all_api_keys:
        raise HTTPException(status_code=500, detail="No Groq API keys configured. Add GROQ_API_KEYS to .env")

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

    def call_vision_with_key_rotation(messages: list, max_tokens: int = 4000):
        """Try each API key in order; skip exhausted keys immediately."""
        last_error = None
        for api_key in all_api_keys:
            if api_key in exhausted_keys:
                print(f"[GROQ] Skipping exhausted key ...{api_key[-6:]}")
                continue
            try:
                c = Groq(api_key=api_key)
                result = c.chat.completions.create(
                    model="qwen/qwen3.6-27b",
                    messages=messages,
                    temperature=0.0,
                    max_tokens=max_tokens
                )
                print(f"[GROQ] Success with key ...{api_key[-6:]}")
                return result
            except Exception as e:
                err_str = str(e)
                if is_rate_limit_error(err_str):
                    print(f"[GROQ] Key ...{api_key[-6:]} rate-limited. Switching to next key.")
                    exhausted_keys.add(api_key)
                    last_error = err_str
                    continue  # immediately try next key
                else:
                    # Non-rate-limit error (bad request, network, etc) — raise immediately
                    raise
        # All keys exhausted
        retry_info = ""
        if last_error:
            m_obj = re.search(r"try again in ([^\.']+)", last_error)
            if m_obj:
                retry_info = f" Try again in {m_obj.group(1).strip()}."
        raise HTTPException(
            status_code=503,
            detail=f"All {len(all_api_keys)} Groq API key(s) have reached their daily token limit.{retry_info} Add more API keys to GROQ_API_KEYS in .env, or wait until midnight (IST) for quota reset."
        )
    # ── End rotation setup ──────────────────────────────────────────────────

    def clean_llm_text(raw_content: str) -> str:
        if not raw_content:
            return ""
        if "</think>" in raw_content:
            return raw_content.split("</think>")[-1].strip()
        return re.sub(r'<think>.*?(?:</think>|$)', '', raw_content, flags=re.DOTALL).strip()

    def get_fallback_template_rows(content: bytes, filename: str = ""):
        # Pure dynamic extraction fallback: returns empty arrays so no hardcoded data overwrites AI extractions
        return [], []

    def extract_fallback_from_raw_text(text: str) -> dict:
        warp_rows = []
        weft_rows = []
        current_section = "warp"
        
        for line in text.split("\n"):
            line_lower = line.lower()
            if "loops" in line_lower or "weft" in line_lower:
                current_section = "weft"
            elif "warp" in line_lower:
                current_section = "warp"
                
            m = re.search(r"([A-Za-z\.]+)\s*[-:]\s*(\d+)", line)
            if m:
                raw_color = m.group(1).strip().title()
                if raw_color.lower() in ["nany", "nava"]:
                    raw_color = "Navy"
                if raw_color.lower() not in ["warp", "weft", "loops", "total", "subtotal", "ends", "entries", "repeat", "read", "pick", "table", "loom", "blend", "extract", "column", "the", "and"]:
                    threads = int(m.group(2))
                    row = {"yarn_count": "20s CTN", "color": raw_color, "threads": threads, "times": "1"}
                    if current_section == "warp":
                        warp_rows.append(row)
                    else:
                        weft_rows.append(row)
        return {"warp": warp_rows[:50], "weft": weft_rows[:50]}

    def parse_json_from_llm(raw_content: str) -> dict:
        if not raw_content:
            return {"warp": [], "weft": []}
        
        warp_rows = []
        weft_rows = []

        # 1. Look for ```json ... ``` code block
        json_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw_content, re.IGNORECASE)
        if not json_match:
            # 2. Look for raw JSON object containing "warp"
            json_match = re.search(r"(\{[\s\S]*\"warp\"[\s\S]*\})", raw_content, re.IGNORECASE)

        if json_match:
            try:
                raw_json_str = json_match.group(1)
                data = json.loads(raw_json_str)
                for section in ["warp", "weft"]:
                    raw_list = data.get(section, [])
                    dest = warp_rows if section == "warp" else weft_rows
                    for item in raw_list:
                        if isinstance(item, dict):
                            color = str(item.get("color", "Navy")).strip().title()
                            if color.lower() in ["ends", "entries", "repeat", "read", "pick", "total", "subtotal", "table", "loom"]:
                                continue
                            if color.lower() in ["nany", "nava"]:
                                color = "Navy"
                            threads_raw = item.get("threads", 0)
                            try:
                                threads = int(re.sub(r"\D", "", str(threads_raw)))
                            except Exception:
                                threads = 0
                            if threads <= 0:
                                continue
                            times = str(item.get("times", "1")).strip()
                            if not times or times == "None":
                                times = "1"
                            yc = str(item.get("yarn_count", "20s CTN")).strip()
                            dest.append({
                                "yarn_count": yc if yc else "20s CTN",
                                "color": color,
                                "threads": threads,
                                "times": times
                            })
            except Exception as e:
                print(f"[EXTRACT WARNING] JSON parse failed: {e}")

        # 3. If JSON parse produced no rows, execute fallback line parser on whole text
        if not warp_rows and not weft_rows:
            print("[EXTRACT INFO] Running fallback text parser on raw LLM output...")
            fb = extract_fallback_from_raw_text(raw_content)
            warp_rows = fb.get("warp", [])
            weft_rows = fb.get("weft", [])

        return {"warp": warp_rows[:50], "weft": weft_rows[:50]}

    extraction_prompt = """DO NOT REASON OR THINK. OUTPUT JSON DIRECTLY.
Extract ALL design rows ONLY from the WARP DESIGN and WEFT DESIGN sections of the textile sheet image.

CRITICAL INSTRUCTIONS:
1. Locate the section titled "WARP DESIGN" (or WARP DESIGN table/column). Extract each yarn color and thread count row (e.g. 20s H.White - 27, Navy - 27, L.Brown - 27).
2. Locate the section titled "WEFT DESIGN" (or WEFT DESIGN table/column). Extract each yarn color and thread count row (e.g. 20s H.White - 23, Navy - 23, L.Brown - 23).
3. IGNORE and DO NOT extract rows from lower calculation/requirement summary sections (such as "WARP:- 1512 - 216.000 KGS" or "WEFT:- 189.000" or footer totals like "81 x 56 = 4536", "69", "Weft Ends", "Total Ends").
4. Extract the yarn count if written next to the color (e.g., "20s", "20S CTN", "2/40S CTN").

Return ONLY valid JSON in this exact structure:
{
  "warp": [
    {"yarn_count": "20S CTN", "color": "H.White", "threads": 27, "times": "1"}
  ],
  "weft": [
    {"yarn_count": "20S CTN", "color": "H.White", "threads": 23, "times": "1"}
  ]
}
RULES:
1. Extract ONLY rows under WARP DESIGN and WEFT DESIGN. Do not double-count or extract lower yarn requirement calculation rows.
2. Read the integer thread count (e.g. 27, 23, 60, 12) next to each color name.
3. Clean color names nicely (e.g. "H.White" -> "H.White", "L.Brown" -> "L.Brown", "Navy" -> "Navy").
4. Return up to 50 rows for WARP and 50 rows for WEFT.
"""

    combined_warp = []
    combined_weft = []

    # Process ALL uploaded files — pure Groq AI extraction, no hardcoded data
    for file in files:
        content = await file.read()
        if not content:
            continue
            
        fname = file.filename or ""
        # Resize image to (1024, 1024) to preserve handwriting clarity
        try:
            im = Image.open(io.BytesIO(content))
            im.thumbnail((1024, 1024))
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=92)
            encoded_file = base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception:
            encoded_file = base64.b64encode(content).decode("utf-8")

        try:
            messages = [
                {
                    "role": "system",
                    "content": "/no_think\nOutput strictly raw valid JSON. Do not perform long math calculations."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": extraction_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_file}",
                            },
                        },
                    ],
                }
            ]
            # call_vision_with_key_rotation automatically tries each API key,
            # skips exhausted keys, and raises HTTPException only when all keys fail
            completion = call_vision_with_key_rotation(messages)
            if completion and hasattr(completion, 'choices') and completion.choices:
                raw_text = completion.choices[0].message.content or ""
                print(f"[EXTRACT DEBUG] File {fname} raw response length: {len(raw_text)}")
                res_data = parse_json_from_llm(raw_text)
                
                warp_list = res_data.get("warp", [])[:50]
                weft_list = res_data.get("weft", [])[:50]

                print(f"[EXTRACT DEBUG] Extracted warp count: {len(warp_list)}, weft count: {len(weft_list)}")
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
        yc = str(yc_raw or "").strip().upper().replace(" ", "")
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
            
        formatted_rows.append({
            "type": "Warp",
            "yarn_count": yarn_count,
            "color": color_val,
            "threads": int(item.get("threads") or 1),
            "times": str(item.get("times") or "1"),
            "line": "",
            "pick": "",
            "drawing_order": "",
            "dents": "",
            "line_val": "",
            "ends_for_dents": ""
        })

    # Process Weft
    for item in combined_weft:
        color_val = str(item.get("color") or "White").strip().title()
        yarn_count = normalize_yarn_count(item.get("yarn_count", ""))

        formatted_rows.append({
            "type": "Weft",
            "yarn_count": yarn_count,
            "color": color_val,
            "threads": int(item.get("threads") or 1),
            "times": str(item.get("times") or "1"),
            "line": "",
            "pick": "",
            "drawing_order": "",
            "dents": "",
            "line_val": "",
            "ends_for_dents": ""
        })

    return {"rows": formatted_rows}
