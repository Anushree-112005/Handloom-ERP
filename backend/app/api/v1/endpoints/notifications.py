import asyncio
import json
from collections import deque
from datetime import datetime
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

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
            # Reversing so the newest are processed correctly on the client side
            # (or we can just send as-is depending on how the frontend handles it)
            await websocket.send_json({"type": "history", "data": history})

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # We append to history
        notification_history.appendleft(message)
        payload = json.dumps({"type": "new_notification", "data": message})
        
        # Broadcast to all connected clients
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except RuntimeError:
                # Catch closed connections
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
    
    # We map this to the Header format on the frontend
    # but we will also pass these raw fields for maximum flexibility

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
        "link": f"/status-update/dashboard", 
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
