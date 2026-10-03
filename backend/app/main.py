"""
Handloom ERP — FastAPI application entry point.
"""
import sys
import os

# Prevent OpenMP / BLAS threading deadlocks on Windows
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"


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
    

RESET_DATABASE = False       # Change to True to clear all data from tables on restart

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Check and create database if missing
        import asyncpg
        from app.core.config import settings
        db_url_str = str(settings.DATABASE_URL)
        if "handloom_erp" in db_url_str or "dinesh_textile_erp" in db_url_str:
            db_name = "handloom_erp" if "handloom_erp" in db_url_str else "dinesh_textile_erp"
            sys_url = db_url_str.replace(db_name, "postgres").replace("postgresql+asyncpg://", "postgresql://")
            try:
                sys_conn = await asyncpg.connect(sys_url)
                exists = await sys_conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
                if not exists:
                    logger.info(f"Creating database {db_name}...")
                    await sys_conn.execute(f'CREATE DATABASE {db_name}')
                await sys_conn.close()
            except Exception as db_e:
                logger.error(f"Failed to check/create database: {db_e}")

        # Create tables on startup
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            # Ensure state_code column exists in party_addresses table
            from sqlalchemy import text
            try:
                if "postgresql" in str(engine.url):
                    await conn.execute(text("ALTER TABLE party_addresses ADD COLUMN IF NOT EXISTS state_code VARCHAR(10)"))
                else:
                    try:
                        await conn.execute(text("ALTER TABLE party_addresses ADD COLUMN state_code VARCHAR(10)"))
                    except Exception:
                        pass
            except Exception as e:
                logger.info(f"Adding state_code column info: {e}")
            
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
                                default_obj = column.default
                                default_arg = getattr(default_obj, "arg", None) if default_obj is not None else None
                                if default_arg is not None and not callable(default_arg):
                                    val = default_arg
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
            
            if getattr(app, "RESET_DATABASE", False) or RESET_DATABASE:
                logger.info("RESET_DATABASE is True. Deleting all data from tables (keeping structure)...")
                for table in reversed(Base.metadata.sorted_tables):
                    await conn.execute(table.delete())

        # Seed default admin user
        from app.models.employee import Employee
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Employee).where((Employee.employee_code == "admin") | (Employee.username == "admin")))
            existing_admin = result.scalar_one_or_none()
            if not existing_admin:
                admin = Employee(
                    employee_code="admin",
                    username="admin",
                    name="Administrator",
                    user_type="Admin",
                    email="admin@handloom-erp.com",
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
            else:
                setattr(existing_admin, "username", "admin")
                setattr(existing_admin, "password_hash", get_password_hash("admin123"))
                setattr(existing_admin, "status", "Active")
                await session.commit()

            # Seed RBAC roles and permissions automatically
            try:
                from seed_rbac import seed_data
                await seed_data()
                logger.info("Successfully seeded RBAC data in lifespan.")
            except Exception as e:
                logger.error(f"Failed to seed RBAC data in lifespan: {e}")

            # Seed default departments and designations
            from app.models.sub_master import SubMaster
            
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

            desg_result = await session.execute(select(SubMaster).where(SubMaster.entity == "designation"))
            if not desg_result.scalars().first():
                logger.info("Seeding default designations...")
                default_designations = [
                    "Managing Director", "CEO", "General Manager", "AGM", "Manager", 
                    "Assistant Manager", "Team Leader", "Senior Executive", "Executive", 
                    "Coordinator", "Supervisor", "Incharge", "Officer", "Senior Officer", 
                    "Assistant", "Operator", "Technician", "Worker", "Trainee", "Driver"
                ]
                for desg_title in default_designations:
                    code = "".join([w[0] for w in desg_title.split() if w]).upper()[:6]
                    if len(code) < 2:
                        code = desg_title[:3].upper()
                    
                    # Generate some realistic dummy data for the new UI fields
                    grade = "L1" if "Operator" in desg_title or "Worker" in desg_title else "M1" if "Manager" in desg_title else "E1"
                    dept = "Management" if "Manager" in desg_title else "Production"
                    extra_data = {
                        "min_salary": 200000 if grade == "L1" else 600000,
                        "max_salary": 400000 if grade == "L1" else 1200000,
                        "experience": "1+ Years" if grade == "L1" else "5+ Years",
                        "skill_category": "Operations" if grade == "L1" else "Management"
                    }
                    import json
                    session.add(SubMaster(
                        entity="designation",
                        name=desg_title,
                        code=code,
                        is_active=True,
                        extra_field_1=dept,
                        extra_field_2=grade,
                        extra_field_3=json.dumps(extra_data)
                    ))
                await session.commit()
            else:
                driver_check = await session.execute(
                    select(SubMaster).where(SubMaster.entity == "designation", SubMaster.name == "Driver")
                )
                if not driver_check.scalars().first():
                    logger.info("Adding missing 'Driver' designation to database...")
                    session.add(SubMaster(
                        entity="designation",
                        name="Driver",
                        code="DRIVER",
                        is_active=True
                    ))
                    await session.commit()

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

            # from app.seed_ppc import seed_ppc_data
            # await seed_ppc_data(session)

            try:
                from finance_app.scripts.sync_realtime_data import sync_data
                sync_data()
                logger.info("Successfully completed initial Cubebook sync on startup.")
            except Exception as e:
                logger.error(f"Failed to run Cubebook sync on startup: {e}")
    except Exception as e:
        import traceback
        with open("lifespan_error.log", "w") as f:
            f.write(traceback.format_exc())
            f.flush()
        logger.error(f"LIFESPAN CRASH PREVENTED: {e}")

    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

from fastapi.staticfiles import StaticFiles
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")


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

async def log_audit_trail(method: str, path: str, auth_header: str | None = None):
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

@app.middleware("http")
async def fix_proxy_and_https_redirects(request: Request, call_next):
    forwarded_proto = request.headers.get("x-forwarded-proto")
    if forwarded_proto:
        request.scope["scheme"] = forwarded_proto
    elif request.headers.get("x-forwarded-ssl") == "on" or request.headers.get("x-scheme") == "https":
        request.scope["scheme"] = "https"
    
    response = await call_next(request)
    
    if response.status_code in (301, 302, 307, 308):
        location = response.headers.get("location")
        if location:
            is_https = (request.scope.get("scheme") == "https") or (forwarded_proto == "https") or (request.url.scheme == "https")
            if is_https and location.startswith("http://"):
                response.headers["location"] = location.replace("http://", "https://", 1)
                
    return response

app.add_middleware(AuditMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return {"message": "Handloom ERP API", "version": "1.0.0", "docs": "/docs"}

import sys
import shutil

# MIGRATION LOGIC (Runs once during Uvicorn reload)
try:
    # Dynamically find the project root path
    ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    BACKEND_SRC = os.path.join(ROOT, "backend", "cubebook-back", "app")
    BACKEND_DST = os.path.join(ROOT, "backend", "finance_app")
    FRONTEND_SRC = os.path.join(ROOT, "frontend", "cubebook-front", "src")
    FRONTEND_DST = os.path.join(ROOT, "frontend", "src", "finance_module")

    # Migrate Backend
    if not os.path.exists(BACKEND_DST) and os.path.exists(BACKEND_SRC):
        shutil.copytree(BACKEND_SRC, BACKEND_DST)
        for root_dir, _, files in os.walk(BACKEND_DST):
            for file in files:
                if file.endswith(".py"):
                    file_path = os.path.join(root_dir, file)
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    content = content.replace("from app.", "from finance_app.")
                    content = content.replace("import app.", "import finance_app.")
                    if file == "database.py":
                        import re
                        content = re.sub(
                            r'SQLALCHEMY_DATABASE_URL\s*=\s*".*?"',
                            'SQLALCHEMY_DATABASE_URL = "sqlite:///./cubebook.db"',
                            content
                        )
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)

    # Mount Finance API
    if os.path.exists(BACKEND_DST):
        sys.path.insert(0, os.path.join(ROOT, "backend"))
        from finance_app.main import app as finance_sub_app
        # Make sure CORS headers on sub-app don't conflict, though mount encapsulates it well
        app.mount("/api/finance", finance_sub_app)

    # Migrate Frontend
    if not os.path.exists(FRONTEND_DST) and os.path.exists(FRONTEND_SRC):
        shutil.copytree(FRONTEND_SRC, FRONTEND_DST)
    
    api_file = os.path.join(FRONTEND_DST, "api", "index.js")
    if os.path.exists(api_file):
        with open(api_file, "r", encoding="utf-8") as f:
            content = f.read()
        if '"/api/finance"' not in content and "'/api/finance'" not in content:
            import re
            content = re.sub(r"const API_URL\s*=\s*'.*?';", "const API_URL = '/api/finance';", content)
            content = re.sub(r'const API_URL\s*=\s*".*?";', 'const API_URL = "/api/finance";', content)
            with open(api_file, "w", encoding="utf-8") as f:
                f.write(content)

    cube_page = os.path.join(ROOT, "frontend", "src", "pages", "cubebook", "CubeBookPage.jsx")
    if os.path.exists(cube_page):
        with open(cube_page, "r", encoding="utf-8") as f:
            c_content = f.read()
        if 'FinanceApp' not in c_content:
            new_content = "import React from 'react';\nimport FinanceApp from '../../finance_module/App';\n\nexport default function CubeBookPage() {\n  return (\n    <div className=\"cubebook-native-wrapper\" style={{ height: '100%', width: '100%', overflow: 'auto' }}>\n      <FinanceApp />\n    </div>\n  );\n}\n"
            with open(cube_page, "w", encoding="utf-8") as f:
                f.write(new_content)
                
except Exception as e:
    import traceback
    with open("migration_error.txt", "w") as f:
        f.write(traceback.format_exc())



