"""
Dinesh Textile ERP — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
                department="IT",
                designation="System Admin",
                status="Active",
                password_hash=get_password_hash("admin123")
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
