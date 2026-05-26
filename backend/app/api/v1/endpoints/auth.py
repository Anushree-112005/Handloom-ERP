"""Authentication endpoints — login & current-user."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, decode_access_token
from app.models.employee import Employee

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    user_name: str
    user_type: str


class UserOut(BaseModel):
    id: int
<<<<<<< HEAD
    employee_code: str
    name: str
=======
    user_id: str
    user_name: str
>>>>>>> 048802c6a0e838215281295d658f4e749ede1691
    user_type: str
    department: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    module_permissions: Optional[dict] = {}

    class Config:
        from_attributes = True


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Employee:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    uid = payload.get("sub")
<<<<<<< HEAD
    result = await db.execute(select(Employee).where(Employee.employee_code == uid))
=======
    result = await db.execute(select(Employee).where(Employee.user_id == uid))
>>>>>>> 048802c6a0e838215281295d658f4e749ede1691
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
<<<<<<< HEAD
    result = await db.execute(select(Employee).where(Employee.employee_code == form.username))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.status != "Active":
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": user.employee_code})
    return TokenResponse(
        access_token=token, user_id=user.employee_code,
        user_name=user.name, user_type=user.designation or "Staff",
=======
    result = await db.execute(select(Employee).where(Employee.user_id == form.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.status != "Enable":
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token({"sub": user.user_id})
    return TokenResponse(
        access_token=token, user_id=user.user_id,
        user_name=user.user_name, user_type=user.user_type,
>>>>>>> 048802c6a0e838215281295d658f4e749ede1691
    )


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: Employee = Depends(get_current_user)):
    return current_user
