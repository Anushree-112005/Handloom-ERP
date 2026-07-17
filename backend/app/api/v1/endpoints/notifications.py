import asyncio
import json
from collections import deque
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.notification import Notification

router = APIRouter()

# Keep the last 100 notifications in memory
notification_history = deque(maxlen=100)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send recent history to new client
        if len(notification_history) > 0:
            history = list(notification_history)
            await websocket.send_json({"type": "history", "data": history})

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        notification_history.appendleft(message)
        payload = json.dumps({"type": "new_notification", "data": message})
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except RuntimeError:
                pass

manager = ConnectionManager()

class NotificationCreate(BaseModel):
    ibpo_id: str
    buyer_order_no: str
    buyer_name: str
    updated_by: str
    stage: str
    status: str
    date_time: str

@router.get("/")
async def get_notifications(user_role: Optional[str] = None, db: AsyncSession = Depends(get_db)):
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

@router.post("/")
async def create_notification(notif: NotificationCreate):
    print("RECEIVED NOTIFICATION POST:", notif.dict())
    title = f"{notif.ibpo_id} - {notif.buyer_name}"
    message = f"Updated By: {notif.updated_by}\n{notif.stage} - {notif.status}"
    
    data = {
        "id": int(datetime.utcnow().timestamp() * 1000), 
        "title": title,
        "message": message,
        "time": notif.date_time, 
        "raw_time": datetime.utcnow().isoformat() + "Z",
        "unread": True,
        "category": "status_update", 
        "link": "/status-update/dashboard", 
        "ibpo_id": notif.ibpo_id,
        "buyer_order_no": notif.buyer_order_no,
        "buyer_name": notif.buyer_name,
        "updated_by": notif.updated_by,
        "stage": notif.stage,
        "status": notif.status
    }
    
    print("BROADCASTING DATA:", data)
    await manager.broadcast(data)
    return {"status": "success", "data": data}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("NEW WEBSOCKET CONNECTION ATTEMPT")
    await manager.connect(websocket)
    print("WEBSOCKET CONNECTED")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("WEBSOCKET DISCONNECTED")
        manager.disconnect(websocket)
