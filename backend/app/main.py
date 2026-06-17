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
        
        def sync_database_schema(connection):
            from sqlalchemy import inspect, text
            try:
                inspector = inspect(connection)
                for table_name, table in Base.metadata.tables.items():
                    if not inspector.has_table(table_name):
                        continue
                    db_columns = {col["name"].lower() for col in inspector.get_columns(table_name)}
                    for col_name, column in table.columns.items():
                        if col_name.lower() not in db_columns:
                            type_str = str(column.type.compile(dialect=connection.dialect))
                            default_val = "NULL"
                            if column.default is not None and not callable(column.default.arg):
                                val = column.default.arg
                                if isinstance(val, str):
                                    escaped_val = val.replace("'", "''")
                                    default_val = f"'{escaped_val}'"
                                elif isinstance(val, bool):
                                    default_val = "TRUE" if val else "FALSE"
                                else:
                                    default_val = str(val)
                            elif "float" in type_str.lower() or "numeric" in type_str.lower():
                                default_val = "0.0"
                            elif "integer" in type_str.lower():
                                default_val = "0"
                            elif "boolean" in type_str.lower():
                                default_val = "FALSE"
                            
                            alter_query = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {type_str}"
                            if default_val != "NULL":
                                alter_query += f" DEFAULT {default_val}"
                            
                            try:
                                connection.execute(text(alter_query))
                                logger.info(f"Successfully added column {col_name} to table {table_name}.")
                            except Exception as ex:
                                logger.error(f"Failed to add column {col_name} to table {table_name}: {ex}")
            except Exception as e:
                logger.error(f"Error during schema synchronization: {e}")

        await conn.run_sync(sync_database_schema)
        
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

        # Seed default departments and designations
        from app.models.sub_master import SubMaster
        
        # Seed departments
        dept_result = await session.execute(select(SubMaster).where(SubMaster.entity == "department"))
        if not dept_result.scalars().first():
            logger.info("Seeding default departments...")
            default_departments = [
                "Management", "Merchandising", "Design", "Purchase", "Stores", 
                "Inventory", "Production", "Weaving", "Dyeing", "Quality", 
                "Dispatch", "Export Documentation", "Logistics", "Accounts", 
                "HR", "Payroll", "Maintenance", "IT", "Admin"
            ]
            for dept_name in default_departments:
                code = "".join([w[0] for w in dept_name.split() if w]).upper()[:6]
                if len(code) < 2:
                    code = dept_name[:3].upper()
                session.add(SubMaster(
                    entity="department",
                    name=dept_name,
                    code=code,
                    is_active=True
                ))
            await session.commit()

        # Seed designations
        desg_result = await session.execute(select(SubMaster).where(SubMaster.entity == "designation"))
        if not desg_result.scalars().first():
            logger.info("Seeding default designations...")
            default_designations = [
                "Managing Director", "CEO", "General Manager", "AGM", "Manager", 
                "Assistant Manager", "Team Leader", "Senior Executive", "Executive", 
                "Coordinator", "Supervisor", "Incharge", "Officer", "Senior Officer", 
                "Assistant", "Operator", "Technician", "Worker", "Trainee"
            ]
            for desg_title in default_designations:
                code = "".join([w[0] for w in desg_title.split() if w]).upper()[:6]
                if len(code) < 2:
                    code = desg_title[:3].upper()
                session.add(SubMaster(
                    entity="designation",
                    name=desg_title,
                    code=code,
                    is_active=True
                ))
            await session.commit()

        # Seed default yarn counts
        yc_result = await session.execute(select(SubMaster).where(SubMaster.entity == "yarn_count_master"))
        if not yc_result.scalars().first():
            logger.info("Seeding default yarn counts...")
            default_counts = [
                {"name": "10S CTN", "code": "10S CTN", "ply": "1 Ply"},
                {"name": "20S CTN", "code": "20S CTN", "ply": "1 Ply"},
                {"name": "30S CTN", "code": "30S CTN", "ply": "1 Ply"},
                {"name": "40S CTN", "code": "40S CTN", "ply": "1 Ply"},
                {"name": "60S CTN", "code": "60S CTN", "ply": "1 Ply"},
                {"name": "80S CTN", "code": "80S CTN", "ply": "1 Ply"},
                {"name": "2/20S CTN", "code": "2/20S CTN", "ply": "2 Ply"},
                {"name": "2/40S CTN", "code": "2/40S CTN", "ply": "2 Ply"},
                {"name": "2/60S CTN", "code": "2/60S CTN", "ply": "2 Ply"},
                {"name": "2/80S CTN", "code": "2/80S CTN", "ply": "2 Ply"},
            ]
            for item in default_counts:
                session.add(SubMaster(
                    entity="yarn_count_master",
                    name=item["name"],
                    code=item["code"],
                    extra_field_1=item["ply"],
                    is_active=True
                ))
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
    expose_headers=["Content-Disposition"],
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
