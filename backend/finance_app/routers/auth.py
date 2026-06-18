from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
from finance_app.database import get_db
from finance_app.models.user import User

router = APIRouter()

# ── JWT / Crypto helpers ────────────────────────────────────────────────────
SECRET_KEY = "cubebook-super-secret-jwt-key-2026"
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

def _hash_password(password: str) -> str:
    try:
        import bcrypt
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except Exception:
        try:
            from passlib.context import CryptContext
            ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return ctx.hash(password)
        except Exception:
            # Fallback if bcrypt and passlib are not working: simple hash (not for production)
            import hashlib
            return "hashed:" + hashlib.sha256(password.encode()).hexdigest()

def _verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("hashed:"):
        import hashlib
        return hashed == "hashed:" + hashlib.sha256(plain.encode()).hexdigest()
    try:
        import bcrypt
        plain_bytes = plain.encode('utf-8')
        hashed_bytes = hashed.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        try:
            from passlib.context import CryptContext
            ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return ctx.verify(plain, hashed)
        except Exception:
            import hashlib
            return hashed == "hashed:" + hashlib.sha256(plain.encode()).hexdigest()

def _create_token(data: dict) -> str:
    try:
        from jose import jwt  # type: ignore
        payload = data.copy()
        payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    except ImportError:
        # Fallback: base64 "token" (not cryptographically secure)
        import base64, json
        payload = data.copy()
        payload["exp"] = (datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).isoformat()
        return base64.b64encode(json.dumps(payload).encode()).decode()

def _decode_token(token: str) -> Optional[dict]:
    try:
        from jose import jwt, JWTError  # type: ignore
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        try:
            import base64, json
            return json.loads(base64.b64decode(token.encode()).decode())
        except Exception:
            return None

def ensure_admin_user(db: Session):
    """Auto-seed admin user if no users exist."""
    if db.query(User).count() == 0:
        admin = User(
            username="admin",
            full_name="Administrator",
            email="admin@cubebooks.com",
            hashed_password=_hash_password("CubeBook@2026"),
            role="Administrator",
            is_active=True,
        )
        db.add(admin)
        db.commit()

def migrate_default_passwords(db: Session):
    """One-time migration: update admin if still using old default password."""
    admin = db.query(User).filter(User.username == "admin").first()
    if admin and _verify_password("admin123", admin.hashed_password):
        admin.hashed_password = _hash_password("CubeBook@2026")
        db.commit()
        print("[Auth] Admin password migrated to new default.")

# ── Schemas ────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    full_name: str
    role: str

# ── Endpoints ──────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    ensure_admin_user(db)
    user = db.query(User).filter(
        User.username == payload.username,
        User.is_active == True
    ).first()
    if not user or not _verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    token = _create_token({"sub": user.username, "user_id": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
    )

@router.get("/me")
def get_me(db: Session = Depends(get_db)):
    """Returns current user info — token decoded on frontend."""
    return {"message": "Use JWT token to identify user"}

@router.post("/seed-admin")
def seed_admin(db: Session = Depends(get_db)):
    ensure_admin_user(db)
    return {"message": "Admin user ensured"}
