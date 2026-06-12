# router.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
import traceback
import os
import io
import weasyprint
from jinja2 import Environment, FileSystemLoader
from app.design_ai.image_analyzer import extract_colors_and_pipeline, classify_weave

router = APIRouter(prefix="/design-ai", tags=["Design AI"])

@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    num_colors: str = Form("auto")
):
    try:
        content = await file.read()
        
        # Save a copy to uploads/debug for inspection and analysis debugging
        os.makedirs("uploads/debug", exist_ok=True)
        debug_path = os.path.join("uploads/debug", file.filename)
        with open(debug_path, "wb") as f_debug:
            f_debug.write(content)
            
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

@router.post("/generate-pdf")
async def generate_pdf(payload: dict):
    try:
        # Load template
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("design_sheet.html")
        
        # Render HTML
        html_out = template.render(
            company_name=payload.get("company_name", ""),
            design_no=payload.get("design_no", ""),
            weave_type=payload.get("weave_type", ""),
            reed=payload.get("reed", 0),
            pick=payload.get("pick", 0),
            width=payload.get("width", 0.0),
            order_length=payload.get("order_length", 0),
            warp_count=payload.get("warp_count", ""),
            weft_count=payload.get("weft_count", ""),
            wastage=payload.get("wastage", 1.08),
            total_ends=payload.get("total_ends", 0),
            warp_design=payload.get("warp_design", []),
            weft_design=payload.get("weft_design", []),
            warp_design_sum=payload.get("warp_design_sum", 0),
            weft_design_sum=payload.get("weft_design_sum", 0),
            summary=payload.get("summary", []),
            summary_total_repeat_ends=payload.get("summary_total_repeat_ends", 0),
            summary_total_ends=payload.get("summary_total_ends", 0),
            summary_total_kg=payload.get("summary_total_kg", 0.0),
            noD=payload.get("noD", 0),
            repeatEnds=payload.get("repeatEnds", 0),
            balance=payload.get("balance", 0),
            selvage=payload.get("selvage", 0),
            warp_summary=payload.get("warp_summary", []),
            weft_summary=payload.get("weft_summary", []),
            warp_total_ends=payload.get("warp_total_ends", 0),
            warp_total_kg=payload.get("warp_total_kg", 0.0),
            weft_total_ends=payload.get("weft_total_ends", 0),
            weft_total_kg=payload.get("weft_total_kg", 0.0),
            grand_total_kg=payload.get("grand_total_kg", 0.0)
        )
        
        # Compile HTML to PDF using Weasyprint
        pdf_bytes = weasyprint.HTML(string=html_out).write_pdf()
        
        filename = payload.get("design_no", "design").replace(" ", "_")
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}_sheet.pdf"}
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF Generation failed: {str(e)}")
