# router.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import cv2
import numpy as np
import traceback
from app.design_ai.image_analyzer import extract_colors_and_pipeline, classify_weave

router = APIRouter(prefix="/design-ai", tags=["Design AI"])

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    num_colors: str = Form("auto")
):
    try:
        content = await file.read()
        file_bytes = np.frombuffer(content, dtype=np.uint8)
        cv_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if cv_img is None:
            raise HTTPException(status_code=400, detail="Could not decode image. Please upload a valid JPEG or PNG.")
            
        num_colors_input = "auto" if num_colors == "auto" else int(num_colors)
        pipeline_result = extract_colors_and_pipeline(cv_img, num_colors=num_colors_input)
        dominant_colors = pipeline_result["dominant_colors"]
        repeating_sequence = pipeline_result["repeating_sequence"]
        orientation = pipeline_result["orientation"]
        
        weave_label, _ = classify_weave(cv_img)
        
        return {
            "weave_type": weave_label,
            "orientation": orientation,
            "dominant_colors": dominant_colors,
            "repeating_sequence": repeating_sequence
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
