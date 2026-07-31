import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.stock import CurrentStock
from app.schemas.stock import CurrentStock as CurrentStockSchema

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test():
    async with async_session() as session:
        stmt = select(CurrentStock).where(CurrentStock.item_id.startswith('CON'))
        result = await session.execute(stmt)
        stocks = result.scalars().all()
        for stock in stocks:
            try:
                # Attempt pydantic validation
                if hasattr(CurrentStockSchema, 'model_validate'):
                    CurrentStockSchema.model_validate(stock)
                else:
                    CurrentStockSchema.from_orm(stock)
                print(f"Stock {stock.id} validated successfully")
            except Exception as e:
                print(f"Error validating stock {stock.id}: {e}")

asyncio.run(test())
