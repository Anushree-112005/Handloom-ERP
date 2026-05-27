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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Dinesh Textile ERP API", "version": "1.0.0", "docs": "/docs"}
