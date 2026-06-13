"""Chat API endpoints — universal chatbot interface."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.employee import Employee
from app.modules.chatbot.service import handle_chat_message, get_chat_history

router = APIRouter(prefix="/chat", tags=["Chatbot"])


class ChatRequest(BaseModel):
    thread_id: Optional[str] = None
    message: str
    context: Optional[dict] = {}


class ChatAttachment(BaseModel):
    type: str
    label: str
    format: str
    download_url: str
    job_id: Optional[int] = None


class ChatResponse(BaseModel):
    thread_id: str
    reply: str
    attachments: list = []
    suggestions: list = []


@router.post("/messages", response_model=ChatResponse)
async def send_message(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    """Send a message to the chatbot and receive an AI response with optional report attachments."""
    thread_id = req.thread_id or f"thread-{uuid.uuid4().hex[:12]}"

    result = await handle_chat_message(
        db=db,
        thread_id=thread_id,
        user_id=current_user.employee_code,
        message=req.message,
        context=req.context or {},
    )

    return ChatResponse(
        thread_id=thread_id,
        reply=result["reply"],
        attachments=result.get("attachments", []),
        suggestions=result.get("suggestions", []),
    )


class ChatHistoryItem(BaseModel):
    id: int
    sender: str
    message: str
    attachments: list = []
    created_at: Optional[str] = None


@router.get("/threads/{thread_id}", response_model=list[ChatHistoryItem])
async def get_thread_history(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
):
    """Retrieve chat history for a specific thread."""
    messages = await get_chat_history(db, thread_id)
    return messages
