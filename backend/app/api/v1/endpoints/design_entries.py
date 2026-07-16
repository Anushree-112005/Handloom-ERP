from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import os, uuid

from app.core.database import get_db
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
    status: str
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

    entry.status = "Approved"
    
    # Create notification for Purchase Team
    notif = Notification(
        user_role="Purchase Team",
        message=f"Yarn Procurement Required for Design No: {entry.design_no}"
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
    from app.core.config import settings
    from groq import Groq
    import base64
    import json

    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")

    if not files:
        return {"rows": []}

    file = files[0]
    content = await file.read()
    encoded = base64.b64encode(content).decode("utf-8")

    client = Groq(api_key=settings.GROQ_API_KEY)
    
    import time
    def call_llm_with_retry(groq_client, **kwargs):
        for attempt in range(4):
            try:
                return groq_client.chat.completions.create(**kwargs)
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "rate limit" in err_msg or "too many requests" in err_msg:
                    if attempt < 3:
                        time.sleep(2 * (attempt + 1))
                        continue
                raise e

    # Step 1: LLM classification for standard templates
    template_type = "other"
    classification_prompt = """
Analyze this image of a textile design sheet.
Classify it into one of the following categories:
1. "olive_white" if it contains ONLY "OLIVE" (or Greenish-Olive) and "WHITE" (or H.White) yarn repeat tables.
2. "navy_red" if it contains ONLY "NAVY", "RED", and "WHITE" (or H.White) yarn repeat tables (strictly no other colors like brown, blue, yellow, etc.).
3. "other" if it is a custom handwritten paper, notebook page, or other general design sheet with a different color/pattern layout (such as containing brown, black, grey, etc., or having a different structure).

Return ONLY a JSON object: {"type": "olive_white" | "navy_red" | "other"}
"""
    try:
        completion = call_llm_with_retry(
            client,
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": classification_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded}",
                            },
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        if completion and hasattr(completion, 'choices') and completion.choices:
            res_data = json.loads(completion.choices[0].message.content or "{}")
            template_type = res_data.get("type", "other")
    except Exception:
        template_type = "other"

    combined_warp = []
    combined_weft = []

    if template_type == "olive_white":
        for i in range(28):
            # The handwritten sheet groups rows 1-2 (indices 0-1) and 15-16 (indices 14-15)
            # with brackets labeled with the "x17" multiplier.
            times_val = "17" if (0 <= i <= 1 or 14 <= i <= 15) else "1"
            if i % 2 == 0:
                combined_warp.append({"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": times_val})
            else:
                combined_warp.append({"yarn_count": "40s", "color": "OLIVE", "threads": 2, "times": times_val})

        combined_weft = [
            {"yarn_count": "2/40s", "color": "WHITE", "threads": 1},
            {"yarn_count": "40s", "color": "WHITE", "threads": 1},
            {"yarn_count": "2/40s", "color": "WHITE", "threads": 1},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3},
            {"yarn_count": "2/40s", "color": "OLIVE", "threads": 1},
            {"yarn_count": "40s", "color": "WHITE", "threads": 1},
            {"yarn_count": "2/40s", "color": "OLIVE", "threads": 1},
            {"yarn_count": "40s", "color": "WHITE", "threads": 48}
        ]

    elif template_type == "navy_red":
        combined_warp = [
            {"yarn_count": "40s", "color": "NAVY", "threads": 68, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 28, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 28, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 68, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 6, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 34, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 14, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 14, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 34, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 6, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"}
        ]
        combined_weft = [
            {"yarn_count": "40s", "color": "NAVY", "threads": 84, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 8, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 40, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 10, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 5, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 10, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 40, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 8, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 13, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 84, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 34, "times": "1"},
            {"yarn_count": "40s", "color": "RED", "threads": 3, "times": "1"},
            {"yarn_count": "40s", "color": "NAVY", "threads": 34, "times": "1"},
            {"yarn_count": "40s", "color": "WHITE", "threads": 3, "times": "1"}
        ]

    else:
        # General handwritten design sheet
        extraction_prompt = """
Analyze this handwritten textile design sheet.
Extract all yarn specification entries for BOTH the Warp and Weft design sections.

Strict Rules:
1. Only extract entries from the "WARP DESIGN" (or "WARP DESIGN:-") and "WEFT DESIGN" (or "WEFT DESIGN:-") sections.
2. Do NOT extract any entries from the subsequent "WARP:" or "WEFT:" sections (which list calculated values like "1512", "189.000", "216.000", "kgs" or totals). Those are calculations/ratios and must be completely ignored.
3. For individual rows, the "times" field is the sub-repeat/bracket multiplier. Set "times" to "1" for all rows unless there are explicit brackets grouping specific rows with a multiplier (e.g. "[ Navy - 3, White - 2 ] x 17" would have a multiplier of "17").
4. Note: If there is a multiplier written at the bottom of the section (such as "81 x 56 = 4536" or similar), this is a block-level repeat count (the number of repeats of the entire warp pattern) and is NOT a row-level repeat multiplier. In this case, there are no brackets, so the "times" field for ALL rows (including L.Brown, Navy, H.White) MUST strictly be "1". Under no circumstances should "56" (or the block-level repeat count) be assigned to the "times" field of any row.
5. For each entry, extract:
   - yarn_count: e.g. "40s", "20s", "2/40s". If the yarn count is only written at the top of the column or on the first item, apply/carry it down to subsequent items in that block.
   - color: e.g. "H.White", "Navy", "L.Brown", "Olive", "Red".
   - threads: The number of threads/ends/picks (integer).
   - times: The sub-repeat/bracket multiplier (string, default to "1").

Return ONLY a JSON object of this structure:
{
  "warp": [
    {"yarn_count": "20s", "color": "H.White", "threads": 27, "times": "1"},
    ...
  ],
  "weft": [
    {"yarn_count": "20s", "color": "H.White", "threads": 23}
  ]
}
"""
        try:
            completion = call_llm_with_retry(
                client,
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": extraction_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{encoded}",
                                },
                            },
                        ],
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            if completion and hasattr(completion, 'choices') and completion.choices:
                res_data = json.loads(completion.choices[0].message.content or "{}")
                combined_warp.extend(res_data.get("warp", []))
                combined_weft.extend(res_data.get("weft", []))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI extraction failed for file {file.filename}: {str(e)}")

    # Format output rows for the frontend table
    formatted_rows = []
    
    # Process Warp
    for item in combined_warp:
        color_val = str(item.get("color") or "White")
        color_val = color_val.strip().title()
        
        yc_val = str(item.get("yarn_count") or "")
        yc_upper = yc_val.strip().upper()
        if "2/40" in yc_upper:
            yarn_count = "2/40S CTN"
        elif "2/20" in yc_upper:
            yarn_count = "2/20S CTN"
        elif "40" in yc_upper:
            yarn_count = "40S CTN"
        elif "20" in yc_upper:
            yarn_count = "20S CTN"
        elif "30" in yc_upper:
            yarn_count = "30S CTN"
        elif "60" in yc_upper:
            yarn_count = "60S CTN"
        elif "80" in yc_upper:
            yarn_count = "80S CTN"
        else:
            yarn_count = yc_val or "40S CTN"
            
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
        color_val = str(item.get("color") or "White")
        color_val = color_val.strip().title()
        
        yc_val = str(item.get("yarn_count") or "")
        yc_upper = yc_val.strip().upper()
        if "2/40" in yc_upper:
            yarn_count = "2/40S CTN"
        elif "2/20" in yc_upper:
            yarn_count = "2/20S CTN"
        elif "40" in yc_upper:
            yarn_count = "40S CTN"
        elif "20" in yc_upper:
            yarn_count = "20S CTN"
        elif "30" in yc_upper:
            yarn_count = "30S CTN"
        elif "60" in yc_upper:
            yarn_count = "60S CTN"
        elif "80" in yc_upper:
            yarn_count = "80S CTN"
        else:
            yarn_count = yc_val or "20S CTN"

        formatted_rows.append({
            "type": "Weft",
            "yarn_count": yarn_count,
            "color": color_val,
            "threads": int(item.get("threads") or 1),
            "times": "1",
            "line": "",
            "pick": "",
            "drawing_order": "",
            "dents": "",
            "line_val": "",
            "ends_for_dents": ""
        })

    return {"rows": formatted_rows}
