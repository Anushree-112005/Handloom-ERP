"""
AI-Assisted Textile Design endpoints.
Full CRUD + image upload + AI analysis proxy + yarn calculation.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os, uuid, logging

logger = logging.getLogger("app.api.v1.endpoints.textile_designs")

from app.core.database import get_db
from app.models.textile_design import TextileDesign, WarpDesignItem, WeftDesignItem

router = APIRouter(prefix="/textile-designs", tags=["Textile Design AI"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "uploads", "designs")
AI_SERVICE_URL = "http://localhost:8001"

# ─── Pydantic Schemas ───

class WarpItemSchema(BaseModel):
    sno: Optional[int] = 0
    yarn_count: Optional[str] = ""
    color: Optional[str] = ""
    threads: Optional[int] = 0
    ratio_pct: Optional[float] = 0.0
    req_kg: Optional[float] = 0.0

class WeftItemSchema(BaseModel):
    sno: Optional[int] = 0
    yarn_count: Optional[str] = ""
    color: Optional[str] = ""
    threads: Optional[int] = 0
    ratio_pct: Optional[float] = 0.0
    req_kg: Optional[float] = 0.0

class TextileDesignCreate(BaseModel):
    design_name: Optional[str] = ""
    weave_type: Optional[str] = "Plain"
    loom_width: Optional[float] = 0.0
    finished_width: Optional[float] = 0.0
    reed: Optional[float] = 0.0
    pick: Optional[float] = 0.0
    total_ends: Optional[float] = 0.0
    total_picks: Optional[float] = 0.0
    ppi: Optional[float] = 0.0
    epi: Optional[float] = 0.0
    fabric_length: Optional[float] = 0.0
    warp_wastage_pct: Optional[float] = 5.0
    weft_wastage_pct: Optional[float] = 3.0
    created_by: Optional[str] = ""
    status: Optional[str] = "Draft"
    image_path: Optional[str] = None
    ai_detected_weave: Optional[str] = None
    ai_confidence: Optional[float] = 0.0
    ai_color_clusters: Optional[list] = []
    ai_stripe_repeat: Optional[list] = []
    ai_fft_profile: Optional[dict] = {}
    ai_estimated_ends: Optional[list] = []
    ai_analysis_status: Optional[str] = None
    warp_kg: Optional[float] = 0.0
    weft_kg: Optional[float] = 0.0
    total_kg: Optional[float] = 0.0

    warp_items: Optional[List[WarpItemSchema]] = []
    weft_items: Optional[List[WeftItemSchema]] = []

class WarpItemOut(WarpItemSchema):
    id: int
    class Config:
        from_attributes = True

class WeftItemOut(WeftItemSchema):
    id: int
    class Config:
        from_attributes = True

class TextileDesignOut(BaseModel):
    id: int
    design_no: str
    design_name: Optional[str] = ""
    status: Optional[str] = "Draft"
    weave_type: Optional[str] = ""
    loom_width: Optional[float] = 0.0
    finished_width: Optional[float] = 0.0
    reed: Optional[float] = 0.0
    pick: Optional[float] = 0.0
    total_ends: Optional[float] = 0.0
    total_picks: Optional[float] = 0.0
    ppi: Optional[float] = 0.0
    epi: Optional[float] = 0.0
    fabric_length: Optional[float] = 0.0
    image_path: Optional[str] = None
    ai_detected_weave: Optional[str] = None
    ai_confidence: Optional[float] = 0.0
    ai_color_clusters: Optional[list] = []
    ai_stripe_repeat: Optional[list] = []
    ai_fft_profile: Optional[dict] = {}
    ai_estimated_ends: Optional[list] = []
    ai_analysis_status: Optional[str] = None
    warp_kg: Optional[float] = 0.0
    weft_kg: Optional[float] = 0.0
    total_kg: Optional[float] = 0.0
    warp_wastage_pct: Optional[float] = 5.0
    weft_wastage_pct: Optional[float] = 3.0
    created_by: Optional[str] = ""
    verified_by: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    warp_items: List[WarpItemOut] = []
    weft_items: List[WeftItemOut] = []

    class Config:
        from_attributes = True


# ─── CRUD Endpoints ───

@router.get("/", response_model=List[TextileDesignOut])
async def list_textile_designs(skip: int = 0, limit: int = 200, db: AsyncSession = Depends(get_db)):
    q = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).order_by(TextileDesign.id.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=TextileDesignOut, status_code=201)
async def create_textile_design(data: TextileDesignCreate, db: AsyncSession = Depends(get_db)):
    # Auto-generate design number
    max_id_q = await db.execute(select(func.max(TextileDesign.id)))
    max_id = max_id_q.scalar() or 0
    design_no = f"DEPL{max_id + 1:04d}"

    payload = data.model_dump(exclude={"warp_items", "weft_items"})
    design = TextileDesign(**payload, design_no=design_no)
    db.add(design)
    await db.flush()

    # Add warp items
    for i, item in enumerate(data.warp_items or []):
        warp = WarpDesignItem(**item.model_dump(exclude={"sno"}), design_id=design.id, sno=i+1)
        db.add(warp)

    # Add weft items
    for i, item in enumerate(data.weft_items or []):
        weft = WeftDesignItem(**item.model_dump(exclude={"sno"}), design_id=design.id, sno=i+1)
        db.add(weft)

    await db.commit()

    # Reload with relationships
    q = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).where(TextileDesign.id == design.id)
    result = await db.execute(q)
    return result.scalar_one()


@router.get("/{design_id}", response_model=TextileDesignOut)
async def get_textile_design(design_id: int, db: AsyncSession = Depends(get_db)):
    q = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).where(TextileDesign.id == design_id)
    result = await db.execute(q)
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Textile Design not found")
    return design


@router.put("/{design_id}", response_model=TextileDesignOut)
async def update_textile_design(design_id: int, data: TextileDesignCreate, db: AsyncSession = Depends(get_db)):
    q = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).where(TextileDesign.id == design_id)
    result = await db.execute(q)
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Textile Design not found")

    payload = data.model_dump(exclude={"warp_items", "weft_items"})
    for key, value in payload.items():
        setattr(design, key, value)

    # Replace warp items
    for item in design.warp_items:
        await db.delete(item)
    for i, item in enumerate(data.warp_items or []):
        warp = WarpDesignItem(**item.model_dump(exclude={"sno"}), design_id=design.id, sno=i+1)
        db.add(warp)

    # Replace weft items
    for item in design.weft_items:
        await db.delete(item)
    for i, item in enumerate(data.weft_items or []):
        weft = WeftDesignItem(**item.model_dump(exclude={"sno"}), design_id=design.id, sno=i+1)
        db.add(weft)

    await db.commit()

    q2 = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).where(TextileDesign.id == design_id)
    result2 = await db.execute(q2)
    return result2.scalar_one()


@router.delete("/{design_id}", status_code=204)
async def delete_textile_design(design_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TextileDesign).where(TextileDesign.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Textile Design not found")
    await db.delete(design)
    await db.commit()
    return None


@router.post("/analyze-image")
async def analyze_image_only(file: UploadFile = File(...)):
    """Upload a fabric image and return the AI vision analysis result immediately without database record."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".png"
    filename = f"temp_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    image_relative_path = f"/uploads/designs/{filename}"

    try:
        from PIL import Image
        import numpy as np
        from app.modules import ai_vision

        img = Image.open(filepath).convert("RGB")
        img_array = np.array(img)

        # Run direct analysis
        colors = ai_vision.detect_colors(img_array)
        stripes, repeat_pattern = ai_vision.detect_stripes(img_array)
        weave, confidence, fft_profile = ai_vision.analyze_weave_fft(img_array)

        # Estimate warp ends from stripe data
        estimated_ends = []
        for s in stripes[:10]:
            estimated_ends.append({
                "color": s["color"],
                "estimated_threads": max(4, s["width_px"] // 3)
            })

        # Calculate estimated total ends if possible, otherwise default to 3120/3248
        sum_estimated_threads = sum(e["estimated_threads"] for e in estimated_ends)
        if sum_estimated_threads > 0:
            total_ends = sum_estimated_threads
        else:
            total_ends = 3248

        return {
            "image_path": image_relative_path,
            "weave_type": weave,
            "ai_detected_weave": weave,
            "ai_confidence": confidence,
            "ai_color_clusters": colors,
            "ai_stripe_repeat": repeat_pattern,
            "ai_fft_profile": fft_profile,
            "ai_estimated_ends": estimated_ends,
            "epi": 52.0,
            "ppi": 52.0,
            "total_ends": float(total_ends),
            "total_picks": 52000.0,
            "status": "Draft"
        }

    except Exception as e:
        logger.error(f"Temporary image analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


# ─── Image Upload ───

@router.post("/{design_id}/upload-image")
async def upload_fabric_image(design_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TextileDesign).where(TextileDesign.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Textile Design not found")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".png"
    filename = f"{design.design_no}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    design.image_path = f"/uploads/designs/{filename}"
    await db.commit()
    await db.refresh(design)

    return {"image_path": design.image_path, "filename": filename}


# ─── AI Analysis Proxy ───

@router.post("/{design_id}/analyze")
async def analyze_fabric(design_id: int, db: AsyncSession = Depends(get_db)):
    """Proxy request to the Python AI service to analyze the uploaded fabric image."""
    q = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).where(TextileDesign.id == design_id)
    result = await db.execute(q)
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Textile Design not found")
    if not design.image_path:
        raise HTTPException(status_code=400, detail="No image uploaded for analysis")

    design.ai_analysis_status = "pending"
    await db.commit()

    try:
        image_full_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..",
            design.image_path.lstrip("/")
        )
        image_full_path = os.path.normpath(image_full_path)

        if not os.path.exists(image_full_path):
            raise HTTPException(status_code=400, detail="Image file not found on disk")

        # Import locally to avoid issues if numpy/Pillow are not fully installed during startup
        from PIL import Image
        import numpy as np
        from app.modules import ai_vision

        img = Image.open(image_full_path).convert("RGB")
        img_array = np.array(img)

        # Run direct analysis
        colors = ai_vision.detect_colors(img_array)
        stripes, repeat_pattern = ai_vision.detect_stripes(img_array)
        weave, confidence, fft_profile = ai_vision.analyze_weave_fft(img_array)

        # Estimate warp ends from stripe data
        estimated_ends = []
        for s in stripes[:10]:
            estimated_ends.append({
                "color": s["color"],
                "estimated_threads": max(4, s["width_px"] // 3)
            })

        design.ai_detected_weave = weave
        design.ai_confidence = confidence
        design.ai_color_clusters = colors
        design.ai_stripe_repeat = repeat_pattern
        design.ai_fft_profile = fft_profile
        design.ai_estimated_ends = estimated_ends
        design.ai_analysis_status = "completed"

        # Auto-fill weave type if not set
        if not design.weave_type and weave:
            design.weave_type = weave

        await db.commit()
        await db.refresh(design)

        return {
            "weave": weave,
            "confidence": confidence,
            "colors": colors,
            "stripe_repeat": repeat_pattern,
            "stripes": stripes,
            "fft_profile": fft_profile,
            "estimated_ends": estimated_ends
        }

    except Exception as e:
        design.ai_analysis_status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


# ─── Yarn Requirement Calculation ───

@router.post("/{design_id}/calculate-requirement")
async def calculate_requirement(design_id: int, db: AsyncSession = Depends(get_db)):
    """Calculate yarn requirement based on warp/weft design + design parameters."""
    q = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).where(TextileDesign.id == design_id)
    result = await db.execute(q)
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Textile Design not found")

    # Parse count number from strings like "2/40S CTN" -> 40, "30S Slub" -> 30
    def parse_count(count_str):
        if not count_str:
            return 40.0  # default
        import re
        parts = count_str.upper().replace("S", "").split("/")
        nums = []
        for p in parts:
            match = re.search(r"(\d+\.?\d*)", p)
            if match:
                nums.append(float(match.group(1)))
        if len(nums) >= 2:
            return nums[0] * nums[1]  # e.g., 2/40 = 80 effective count
        elif len(nums) == 1:
            return nums[0]
        return 40.0

    fabric_length = design.fabric_length or 1000.0  # meters
    loom_width = design.loom_width or 60.0  # inches
    wastage_warp = 1 + (design.warp_wastage_pct or 5) / 100
    wastage_weft = 1 + (design.weft_wastage_pct or 3) / 100

    # Warp: Weight = (Ends × Length) / (Count × 840) × Wastage  (in lbs, convert to kg)
    total_warp_kg = 0.0
    for item in design.warp_items:
        count = parse_count(item.yarn_count)
        ends = item.threads or 0
        length_yards = fabric_length * 1.09361  # meters to yards
        weight_lbs = (ends * length_yards) / (count * 840) * wastage_warp
        weight_kg = weight_lbs * 0.453592
        item.req_kg = round(weight_kg, 2)
        total_warp_kg += weight_kg

    # Weft: Weight = (PPI × Width × Length) / (Count × 840) × Wastage
    total_weft_kg = 0.0
    ppi = design.ppi or design.pick or 52.0
    width_inches = loom_width
    for item in design.weft_items:
        count = parse_count(item.yarn_count)
        threads = item.threads or 0
        # If threads provided as total picks, use them directly
        total_picks = threads if threads > 100 else ppi * fabric_length * 1.09361
        length_yards = fabric_length * 1.09361
        weight_lbs = (total_picks * width_inches) / (count * 840) * wastage_weft
        weight_kg = weight_lbs * 0.453592
        item.req_kg = round(weight_kg, 2)
        total_weft_kg += weight_kg

    design.warp_kg = round(total_warp_kg, 2)
    design.weft_kg = round(total_weft_kg, 2)
    design.total_kg = round(total_warp_kg + total_weft_kg, 2)

    await db.commit()

    # Reload
    q2 = select(TextileDesign).options(
        selectinload(TextileDesign.warp_items),
        selectinload(TextileDesign.weft_items)
    ).where(TextileDesign.id == design_id)
    result2 = await db.execute(q2)
    updated = result2.scalar_one()

    return {
        "warp_kg": updated.warp_kg,
        "weft_kg": updated.weft_kg,
        "total_kg": updated.total_kg,
        "warp_items": [{"color": w.color, "threads": w.threads, "req_kg": w.req_kg} for w in updated.warp_items],
        "weft_items": [{"color": w.color, "threads": w.threads, "req_kg": w.req_kg} for w in updated.weft_items],
    }


# ─── Status Update ───

@router.patch("/{design_id}/status")
async def update_status(design_id: int, status: str, verified_by: Optional[str] = None, approved_by: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TextileDesign).where(TextileDesign.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Textile Design not found")

    design.status = status
    if verified_by:
        design.verified_by = verified_by
    if approved_by:
        design.approved_by = approved_by
    await db.commit()
    return {"status": design.status}
