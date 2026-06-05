"""
Dinesh Textile ERP — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.api.v1.router import api_router

# Import all models so tables are registered with Base.metadata
import app.models  # noqa: F401


RESET_DATABASE = False  # Change to True to clear all data from tables on restart

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        if RESET_DATABASE:
            logger.info("RESET_DATABASE is True. Deleting all data from tables (keeping structure)...")
            # Delete data in reverse dependency order to prevent foreign key errors
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())

    # Seed default admin user
    from app.models.employee import Employee
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Employee).where(Employee.employee_code == "admin"))
        if not result.scalar_one_or_none():
            admin = Employee(
                employee_code="admin",
                name="Administrator",
                user_type="Admin",
                email="admin@dinesh-textile.com",
                department="IT",
                designation="System Admin",
                status="Active",
                web_access="Allow",
                password_hash=get_password_hash("admin123"),
                module_permissions={
                    "master": True, "buyer_order": True, "work_order": True,
                    "warping_sizing": True, "production": True, "processing": True,
                    "fabric": True, "yarn": True, "account": True, "report": True,
                },
            )
            session.add(admin)
            await session.commit()

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = exc.errors()
    body = await request.body()
    logger.error(f"422 Validation Error: {error_details}")
    logger.error(f"Body: {body}")
    with open("422_errors.log", "a") as f:
        f.write(f"Validation Error: {error_details}\nBody: {body}\n\n")
    return JSONResponse(
        status_code=422,
        content={"detail": error_details, "body": str(exc.body)},
    )

import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error: {exc}")
    with open("500_errors.log", "a") as f:
        f.write(f"Global Error on {request.url}: {exc}\n")
        f.write(traceback.format_exc())
        f.write("\n\n")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})



import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import decode_access_token

async def log_audit_trail(method: str, path: str, auth_header: str):
    if "auth/login" in path or "log-reports" in path:
        return
        
    user_id = "System"
    user_name = "System"
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = decode_access_token(token)
            if payload:
                user_id = payload.get("sub", "System")
                user_name = payload.get("sub", "System")
        except Exception:
            pass
            
    mode = "Save"
    if method == "PUT":
        mode = "Update"
    elif method == "DELETE":
        mode = "Delete"
        
    path_parts = path.strip("/").split("/")
    module = "Unknown Module"
    if len(path_parts) >= 3 and path_parts[1] == "v1":
        raw_mod = path_parts[2]
        module = " ".join([w.capitalize() for w in raw_mod.split("-")])
        
    remarks = f"Executed {mode} on {module} via API"
    
    from app.models.log_report import LogReport
    from app.core.database import AsyncSessionLocal
    
    try:
        async with AsyncSessionLocal() as session:
            log_entry = LogReport(
                user_name=user_name,
                user_id=user_id,
                mode=mode,
                module=module,
                remarks=remarks
            )
            session.add(log_entry)
            await session.commit()
    except Exception as e:
        logger.error(f"Failed to save audit log: {e}")

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method in ["POST", "PUT", "DELETE"]:
            if response.status_code < 400:
                asyncio.create_task(
                    log_audit_trail(
                        request.method,
                        request.url.path,
                        request.headers.get("Authorization")
                    )
                )
        return response

app.add_middleware(AuditMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve uploaded files (design images, etc.)
import os
from fastapi.staticfiles import StaticFiles
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
async def root():
    return {"message": "Dinesh Textile ERP API", "version": "1.0.0", "docs": "/docs"}
