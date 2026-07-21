import asyncio
from app.core.database import engine
from app.models.rbac import Base

async def init_models():
    async with engine.begin() as conn:
        # This will create tables that don't exist yet, but not touch existing ones
        await conn.run_sync(Base.metadata.create_all)
    
if __name__ == "__main__":
    asyncio.run(init_models())
    print("RBAC tables created successfully")
