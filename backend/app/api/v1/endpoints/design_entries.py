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

    client = Groq(api_key=settings.GROQ_API_KEY)

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
        text_clean = clean_llm_text(text)
        warp_rows = []
        weft_rows = []
        lines = text_clean.split("\n")
        current_section = "warp"
        
        for line in lines:
            line_lower = line.lower()
            if "weft" in line_lower:
                current_section = "weft"
            elif "warp" in line_lower:
                current_section = "warp"
                
            m = re.search(r"(navy|nany|white|red|olive|l\.brown|brown|blue|black|green|yellow|d\.blue|h\.white)\s*[-:]?\s*(\d+)(?:\s*x\s*(\d+))?", line, re.IGNORECASE)
            if m:
                raw_color = m.group(1).lower()
                color = "Navy" if raw_color in ["navy", "nany"] else m.group(1).title()
                threads = int(m.group(2))
                times = m.group(3) if m.group(3) else "1"
                row = {"yarn_count": "20s CTN", "color": color, "threads": threads, "times": times}
                if current_section == "warp":
                    warp_rows.append(row)
                else:
                    weft_rows.append(row)
        return {"warp": warp_rows[:20], "weft": weft_rows[:20]}

    def normalize_extracted_times(warp_list, weft_list, raw_text=""):
        for r in warp_list or []:
            if not r.get("times") or str(r.get("times")).strip() in ["", "None"]:
                r["times"] = "1"
                    
        for r in weft_list or []:
            if not r.get("times") or str(r.get("times")).strip() in ["", "None"]:
                r["times"] = "1"
                
        return warp_list, weft_list

    def parse_json_from_llm(raw_content: str) -> dict:
        if not raw_content:
            return {}
        
        text_to_parse = clean_llm_text(raw_content)
        cleaned = re.sub(r'```(?:json)?', '', text_to_parse).strip()
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            try:
                data = json.loads(match.group(0))
                if isinstance(data, dict) and ("warp" in data or "weft" in data):
                    w = data.get("warp", [])
                    wf = data.get("weft", [])
                    w_norm, wf_norm = normalize_extracted_times(w[:20], wf[:20], raw_content)
                    return {"warp": w_norm, "weft": wf_norm}
            except Exception as e:
                print(f"[EXTRACT WARNING] Direct JSON parse failed: {e}")
        
        print("[EXTRACT INFO] Running fallback text parser on raw LLM output...")
        res = extract_fallback_from_raw_text(raw_content)
        w_norm, wf_norm = normalize_extracted_times(res.get("warp", []), res.get("weft", []), raw_content)
        return {"warp": w_norm, "weft": wf_norm}

    def call_llm_with_retry(groq_client, **kwargs):
        for attempt in range(3):
            try:
                return groq_client.chat.completions.create(**kwargs)
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "rate limit" in err_msg or "too many requests" in err_msg or "413" in err_msg:
                    if attempt < 2:
                        time.sleep(2 * (attempt + 1))
                        continue
                raise e

    extraction_prompt = """
You are analyzing a handwritten textile design sheet image.
Your job is to extract ALL yarn specification entries from BOTH the WARP and WEFT sections.

IMPORTANT RULES:
1. Read the EXACT yarn count written in the image (e.g. "20s", "40s", "2/40s"). Do NOT assume or default.
2. WARP section comes first. WEFT section follows (may be labeled "WEFT", "WEFTS", or listed after a dividing line).
3. For each entry extract:
   - yarn_count: read exactly from image (e.g. "20s CTN", "40s CTN", "2/40s CTN"). Default: "20s CTN"
   - color: exact color name (e.g. "Navy", "White", "Red", "Olive"). Note: "NANY" or "NAVY" both mean "Navy".
   - threads: the integer thread count next to the color (e.g. "68", "300", "84").
   - times: multiplier value if written (e.g. "11" from "370x11R" or "x11"). Default: "1" if not shown.
4. Extract ALL rows - do not skip any color/thread entries.
5. Maximum 20 rows for WARP, 20 rows for WEFT.
6. Keep any <think> reasoning under 30 words.

Return ONLY valid JSON (no markdown, no explanation):
{
  "warp": [
    {"yarn_count": "20s CTN", "color": "Navy", "threads": 68, "times": "1"}
  ],
  "weft": [
    {"yarn_count": "20s CTN", "color": "Navy", "threads": 84, "times": "1"}
  ]
}
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
            completion = call_llm_with_retry(
                client,
                model="qwen/qwen3.6-27b",
                messages=[
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
                ],
                temperature=0.0,
                max_tokens=4000
            )
            if completion and hasattr(completion, 'choices') and completion.choices:
                raw_text = completion.choices[0].message.content or ""
                print(f"[EXTRACT DEBUG] File {fname} raw response length: {len(raw_text)}")
                res_data = parse_json_from_llm(raw_text)
                
                warp_list = res_data.get("warp", [])[:20]
                weft_list = res_data.get("weft", [])[:20]
                if not warp_list and not weft_list:
                    fallback_res = extract_fallback_from_raw_text(raw_text)
                    warp_list = fallback_res.get("warp", [])[:20]
                    weft_list = fallback_res.get("weft", [])[:20]

                print(f"[EXTRACT DEBUG] Extracted warp count: {len(warp_list)}, weft count: {len(weft_list)}")
                combined_warp.extend(warp_list)
                combined_weft.extend(weft_list)
        except Exception as e:
            err_str = str(e)
            print(f"[EXTRACT ERROR] AI call error for file {fname}: {err_str}")
            if "rate_limit" in err_str.lower() or "429" in err_str or "tokens per day" in err_str.lower() or "tpd" in err_str.lower():
                # Extract retry time if available
                retry_info = ""
                import re as _re
                m = _re.search(r"try again in ([^\.']+)", err_str)
                if m:
                    retry_info = f" Please try again in {m.group(1).strip()}."
                raise HTTPException(
                    status_code=503,
                    detail=f"AI extraction API daily limit reached.{retry_info} The Groq free tier allows 200,000 tokens/day. Please try again after midnight (IST) when the quota resets."
                )
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
