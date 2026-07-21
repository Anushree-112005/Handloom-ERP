import asyncio
from sqlalchemy import text
from app.core.database import engine

async def drop_and_create():
    async with engine.begin() as conn:
        tables = [
            "audit_logs", "user_permissions", "user_modules", "user_roles",
            "role_permissions", "modules", "permission_actions", "roles"
        ]
        for t in tables:
            await conn.execute(text(f"DROP TABLE IF EXISTS {t} CASCADE"))
    
    from app.models.rbac import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    asyncio.run(drop_and_create())
    print("Tables dropped and recreated")
