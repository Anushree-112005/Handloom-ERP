from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
async def get_notifications(user_role: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Notification).order_by(Notification.created_at.desc())
    if user_role:
        query = query.where(Notification.user_role == user_role)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/{notif_id}/read")
async def mark_read(notif_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"success": True}
