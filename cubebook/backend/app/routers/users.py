from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.routers.auth import _hash_password

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    username:  str
    full_name: str
    email:     str
    password:  str
    role:      str = "Accountant"
    is_active: bool = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email:     Optional[str] = None
    role:      Optional[str] = None
    is_active: Optional[bool] = None
    password:  Optional[str] = None

def _user_out(u: User):
    return {
        "id":         u.id,
        "username":   u.username,
        "full_name":  u.full_name,
        "email":      u.email,
        "role":       u.role,
        "is_active":  u.is_active,
        "created_at": str(u.created_at),
    }

# ── Endpoints ──────────────────────────────────────────────────────────────
@router.get("/")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at).all()
    return [_user_out(u) for u in users]

@router.post("/")
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(400, "Username already exists")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already exists")
    user = User(
        username=payload.username,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=_hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_out(user)

@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if payload.full_name is not None: user.full_name = payload.full_name
    if payload.email is not None:     user.email     = payload.email
    if payload.role is not None:      user.role      = payload.role
    if payload.is_active is not None: user.is_active = payload.is_active
    if payload.password:              user.hashed_password = _hash_password(payload.password)
    db.commit()
    return _user_out(user)

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
