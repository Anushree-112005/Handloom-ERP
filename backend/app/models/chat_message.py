"""Chat message model for persisting chatbot conversations."""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, func
from app.core.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(String(100), index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)
    sender = Column(String(10), nullable=False)  # "user" or "ai"
    message = Column(Text, nullable=False)
    context = Column(JSON, default={})  # route, filters, active report, etc.
    attachments = Column(JSON, default=[])  # [{type, label, format, download_url}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
