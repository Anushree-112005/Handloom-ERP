from sqlalchemy import Integer, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime, timezone
from typing import Optional


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int]                      = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int]              = mapped_column(Integer, nullable=False, index=True)
    table_name: Mapped[str]             = mapped_column(String, nullable=False)
    record_id: Mapped[int]              = mapped_column(Integer, nullable=False, index=True)
    action: Mapped[str]                 = mapped_column(String, nullable=False)
    # action: Created | Updated | Cancelled | Deleted
    field_name: Mapped[Optional[str]]   = mapped_column(String, nullable=True)
    old_value: Mapped[Optional[str]]    = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]]    = mapped_column(Text, nullable=True)
    changed_by: Mapped[str]             = mapped_column(String, default="system")
    changed_at: Mapped[datetime]        = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    description: Mapped[Optional[str]]  = mapped_column(Text, nullable=True)
    previous_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hash: Mapped[Optional[str]]         = mapped_column(String, nullable=True)

    def compute_hash(self):
        import hashlib
        import json
        
        data = {
            "company_id": self.company_id,
            "table_name": self.table_name,
            "record_id": self.record_id,
            "action": self.action,
            "field_name": self.field_name,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "changed_by": self.changed_by,
            "changed_at": self.changed_at.isoformat() if self.changed_at else None,
            "description": self.description,
            "previous_hash": self.previous_hash
        }
        
        # Create SHA-256 hash
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode('utf-8')).hexdigest()
