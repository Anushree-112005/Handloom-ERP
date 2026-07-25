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

    def call_vision_with_key_rotation(messages: list, max_tokens: int = 4800):
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
        for candidate_text in candidates:
            if not candidate_text:
                continue
            
            json_blocks = re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", candidate_text, re.IGNORECASE)
            if not json_blocks:
                json_blocks = re.findall(r"(\{[\s\S]*\"warp\"[\s\S]*\})", candidate_text, re.IGNORECASE)

            # Inspect from last block to first block (last block is final output after reasoning)
            for raw_json_str in reversed(json_blocks):
                try:
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
                                drawing_order = str(item.get("drawing_order") or item.get("line") or "").strip()
                                yc = str(item.get("yarn_count", "20S CTN")).strip()
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
                        
                        # Only balance if explicit target sum labels are present in the json
                        warp_target = data.get("warp_target") or data.get("warp_total")
                        weft_target = data.get("weft_target") or data.get("weft_total")
                        if warp_target and isinstance(warp_target, int):
                            warp_rows = auto_balance_rows(warp_rows, warp_target)
                        if weft_target and isinstance(weft_target, int):
                            weft_rows = auto_balance_rows(weft_rows, weft_target)
                        break
                except Exception as e:
                    print(f"[EXTRACT WARNING] JSON parse failed: {e}")
            
            if parsed_json_success:
                break

        # If JSON parse failed or produced no rows, execute fallback line parser on cleaned text
        if not parsed_json_success:
            print("[EXTRACT INFO] Running fallback text parser on cleaned LLM output...")
            fb = extract_fallback_from_raw_text(cleaned)
            warp_rows = fb.get("warp", [])
            weft_rows = fb.get("weft", [])

        return {"warp": warp_rows[:50], "weft": weft_rows[:50]}

    def parse_text_from_llm(raw_content: str) -> dict:
        # 1. First try parsing as JSON (if model output JSON format)
        j_res = parse_json_from_llm(raw_content)
        if j_res and (j_res.get("warp") or j_res.get("weft")):
            return j_res
            
        # 2. Otherwise parse clean plain text line by line
        cleaned = clean_llm_text(raw_content)
        fb_res = extract_fallback_from_raw_text(cleaned)
        return fb_res or {"warp": [], "weft": []}

    extraction_prompt = """Extract ALL yarn specification rows from this handwritten/printed textile design sheet into JSON format.

Sheet Structure Guide:
1. WARP DESIGN:- (Left column section):
   - Contains color pattern rows (e.g. 20's H. White - 27, Navy - 27, L.Brown - 27).
   - Below pattern rows, there is often a Repeat Size x Multiplier line like "81 x 56 = 4536" or "81 x 56".
   - "81" is the sum of repeat threads (27+27+27=81). "56" is the repeat multiplier! Set "times": "56" for these warp rows (or "1" if no multiplier is shown).
   - Do NOT treat "81 x 56", "81", or "4536" as a color row!

2. WEFT DESIGN:- (Right column section):
   - Contains weft color pattern rows (e.g. 20's H. White - 23, Navy - 23, L.Brown - 23).
   - Extract EVERY row line-by-line into the "weft" array!

3. DO NOT EXTRACT FROM SUMMARY TABLES BELOW:
   - Below the pattern blocks, there are calculation summary tables labeled "WARP:-" and "WEFT:-" (showing totals like 1512, 216.000 MTR, 189.000).
   - Do NOT extract rows from these bottom summary tables, as they repeat the color names and will cause duplicate rows!

4. COLOR NAMES:
   - Preserve exact color names with prefixes as written on the sheet (e.g. "H. White" / "Half White", "L.Brown" / "Light Brown", "D.Grey" / "Dark Grey", "Navy", "Black").

Return ONLY a JSON object of this exact structure inside a ```json ... ``` codeblock:
```json
{
  "warp": [
    {"yarn_count": "20S CTN", "color": "H. White", "threads": 27, "times": "56", "drawing_order": "Base"},
    {"yarn_count": "20S CTN", "color": "Navy", "threads": 27, "times": "56", "drawing_order": "Base"},
    {"yarn_count": "20S CTN", "color": "L.Brown", "threads": 27, "times": "56", "drawing_order": "Base"}
  ],
  "weft": [
    {"yarn_count": "20S CTN", "color": "H. White", "threads": 23, "times": "1"},
    {"yarn_count": "20S CTN", "color": "Navy", "threads": 23, "times": "1"},
    {"yarn_count": "20S CTN", "color": "L.Brown", "threads": 23, "times": "1"}
  ]
}
```

STRICT RULES:
1. Extract ALL pattern rows from WARP DESIGN into "warp" and ALL pattern rows from WEFT DESIGN into "weft".
2. "yarn_count": The count specified (e.g. "20S CTN", "40S CTN", "2/40S CTN") or default "20S CTN".
3. "color": Exact color name written (e.g., "H. White", "Navy", "L.Brown", "Black").
4. "threads": Exact integer thread count (e.g., 27, 23).
5. "times": Repeat multiplier if indicated (e.g. "56" from "81 x 56"), else "1".
6. Do NOT output markdown or text outside the json codeblock.
"""

    combined_warp = []
    combined_weft = []

    # Process ALL uploaded files — pure Groq AI extraction, no hardcoded data
    for file in files:
        content = await file.read()
        if not content:
            continue
            
        fname = file.filename or "debug_image.png"
        # Save a copy of the raw content for inspection
        os.makedirs("uploads/debug_extract", exist_ok=True)
        with open(os.path.join("uploads/debug_extract", fname), "wb") as f_debug:
            f_debug.write(content)

        # Resize image to (800, 800) for optimal token efficiency & low latency
        try:
            im = Image.open(io.BytesIO(content))
            im.thumbnail((800, 800))
            im = im.convert("RGB")
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=82)
            encoded_file = base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception:
            encoded_file = base64.b64encode(content).decode("utf-8")

        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are a strict, highly accurate textile OCR engine. In your thinking block write at most 2 short sentences, then output the JSON codeblock immediately."
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
            completion = call_vision_with_key_rotation(messages, max_tokens=4800)
            if completion and hasattr(completion, 'choices') and completion.choices:
                raw_text = completion.choices[0].message.content or ""
                print(f"[EXTRACT DEBUG] File {fname} raw response length: {len(raw_text)}")
                
                # Save LLM raw response
                with open(os.path.join("uploads/debug_extract", f"{fname}.txt"), "w") as f_res:
                    f_res.write(raw_text)

                res_data = parse_text_from_llm(raw_text)
                
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
            
        formatted_rows.append({
            "type": "Warp",
            "yarn_count": yarn_count,
            "color": color_val,
            "threads": int(item.get("threads") or 1),
            "times": str(item.get("times") or "1"),
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
            "times": str(item.get("times") or "1"),
            "line": drawing_order,
            "pick": "",
            "drawing_order": drawing_order,
            "dents": "",
            "line_val": "",
            "ends_for_dents": ""
        })

    return {"rows": formatted_rows}


