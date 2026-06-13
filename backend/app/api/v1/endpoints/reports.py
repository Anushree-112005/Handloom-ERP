"""Report API endpoints — report catalog, generation, and download."""
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.employee import Employee
from app.models.report_job import ReportJob
from app.modules.reports.registry import get_report_templates, get_report_definition
from app.modules.reports.service import generate_report

router = APIRouter(prefix="/reports", tags=["Reports"])


# ── Schemas ───────────────────────────────────────────────────────

class ReportTemplate(BaseModel):
    id: str
    title: str
    module: str
    formats: list
    filters: list


class GenerateRequest(BaseModel):
    report_id: str
    format: str = "pdf"
    filters: Optional[dict] = {}


class ReportJobOut(BaseModel):
    job_id: int
    report_id: str
    title: str
    format: str
    status: str
    filename: Optional[str] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────

@router.get("/templates", response_model=list[ReportTemplate])
async def list_report_templates(
    current_user: Employee = Depends(get_current_user),
):
    """Get the catalog of all available report templates."""
    return get_report_templates()


@router.post("/generate", response_model=ReportJobOut)
async def generate_report_endpoint(
    req: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    """Generate a report. Returns job metadata with download URL."""
    defn = get_report_definition(req.report_id)
    if not defn:
        raise HTTPException(status_code=400, detail=f"Unknown report: {req.report_id}")

    if req.format not in defn["formats"]:
        raise HTTPException(
            status_code=400,
            detail=f"Format '{req.format}' not supported. Allowed: {defn['formats']}",
        )

    try:
        job = await generate_report(
            db=db,
            report_id=req.report_id,
            fmt=req.format,
            filters=req.filters or {},
            user_id=current_user.employee_code,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

    return ReportJobOut(
        job_id=job.id,
        report_id=job.report_id,
        title=job.title,
        format=job.format,
        status=job.status,
        filename=job.filename,
        download_url=f"/api/v1/reports/jobs/{job.id}/download" if job.status == "completed" else None,
        error=job.error,
        created_at=job.created_at.isoformat() if job.created_at else None,
    )


@router.get("/jobs/{job_id}", response_model=ReportJobOut)
async def get_report_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    """Check status of a report generation job."""
    result = await db.execute(select(ReportJob).where(ReportJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Report job not found")

    return ReportJobOut(
        job_id=job.id,
        report_id=job.report_id,
        title=job.title,
        format=job.format,
        status=job.status,
        filename=job.filename,
        download_url=f"/api/v1/reports/jobs/{job.id}/download" if job.status == "completed" else None,
        error=job.error,
        created_at=job.created_at.isoformat() if job.created_at else None,
    )


@router.get("/jobs/{job_id}/download")
async def download_report(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    """Download a generated report file."""
    result = await db.execute(select(ReportJob).where(ReportJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Report job not found")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail=f"Report is not ready. Status: {job.status}")
    if not job.file_path or not os.path.exists(job.file_path):
        raise HTTPException(status_code=404, detail="Report file not found on disk")

    # Determine content type
    content_types = {
        "pdf": "application/pdf",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv",
    }
    media_type = content_types.get(job.format, "application/octet-stream")

    return FileResponse(
        path=job.file_path,
        filename=job.filename,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{job.filename}"'},
    )
