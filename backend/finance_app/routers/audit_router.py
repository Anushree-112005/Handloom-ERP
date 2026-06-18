from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from finance_app.database import get_db
from finance_app.models.audit import AuditLog

router = APIRouter()

def _log_out(log: AuditLog):
    return {
        "id":          log.id,
        "company_id":  log.company_id,
        "table_name":  log.table_name,
        "record_id":   log.record_id,
        "action":      log.action,
        "field_name":  log.field_name,
        "old_value":   log.old_value,
        "new_value":   log.new_value,
        "changed_by":  log.changed_by,
        "changed_at":  str(log.changed_at),
        "description": log.description,
        "previous_hash": log.previous_hash,
        "hash": log.hash,
    }

@router.get("/")
def list_audit_logs(
    company_id: int,
    table_name: Optional[str] = None,
    record_id:  Optional[int] = None,
    action:     Optional[str] = None,
    from_date:  Optional[date] = None,
    to_date:    Optional[date] = None,
    skip:  int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog).filter(AuditLog.company_id == company_id)
    if table_name: q = q.filter(AuditLog.table_name == table_name)
    if record_id:  q = q.filter(AuditLog.record_id == record_id)
    if action:     q = q.filter(AuditLog.action == action)
    if from_date:  q = q.filter(AuditLog.changed_at >= from_date)
    if to_date:    q = q.filter(AuditLog.changed_at <= to_date)
    logs = q.order_by(AuditLog.changed_at.desc()).offset(skip).limit(limit).all()
    return [_log_out(l) for l in logs]
