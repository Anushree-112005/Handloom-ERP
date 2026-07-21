from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.models.employee import Employee
from app.models.rbac import Role, Module, PermissionAction, RolePermission
from app.api.v1.endpoints.auth import get_current_user
from app.core.authorization import require_permission

class RolePermissionUpdate(BaseModel):
    permissions: dict # module_id -> list of action_ids

router = APIRouter(prefix="/rbac", tags=["RBAC Management"])

class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_system: bool

    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class RoleUpdate(BaseModel):
    name: str
    description: Optional[str] = None

class ModuleOut(BaseModel):
    id: int
    name: str
    key: str
    sort_order: int

    class Config:
        from_attributes = True

class ActionOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

@router.get("/roles", response_model=List[RoleOut])
async def get_roles(db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "View"))):
    result = await db.execute(select(Role))
    return result.scalars().all()

@router.post("/roles", response_model=RoleOut)
async def create_role(role_in: RoleCreate, db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "Create"))):
    new_role = Role(name=role_in.name, description=role_in.description, is_system=False)
    db.add(new_role)
    try:
        await db.commit()
        await db.refresh(new_role)
        return new_role
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create role. Name might be a duplicate.")

@router.put("/roles/{role_id}", response_model=RoleOut)
async def update_role(role_id: int, role_in: RoleUpdate, db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "Edit"))):
    role_res = await db.execute(select(Role).where(Role.id == role_id))
    role = role_res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    role.name = role_in.name
    role.description = role_in.description
    
    try:
        await db.commit()
        await db.refresh(role)
        return role
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update role. Name might be a duplicate.")

@router.delete("/roles/{role_id}")
async def delete_role(role_id: int, db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "Delete"))):
    role_res = await db.execute(select(Role).where(Role.id == role_id))
    role = role_res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    await db.delete(role)
    await db.commit()
    return {"message": "Role deleted successfully"}

@router.get("/modules", response_model=List[ModuleOut])
async def get_modules(db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "View"))):
    result = await db.execute(select(Module).order_by(Module.sort_order))
    return result.scalars().all()

@router.get("/actions", response_model=List[ActionOut])
async def get_actions(db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "View"))):
    result = await db.execute(select(PermissionAction))
    return result.scalars().all()

@router.get("/roles/{role_id}/permissions")
async def get_role_permissions(role_id: int, db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "View"))):
    result = await db.execute(select(RolePermission).where(RolePermission.role_id == role_id))
    perms = result.scalars().all()
    # Return structured dict: module_id -> [action_id]
    perm_dict = {}
    for p in perms:
        if p.module_id not in perm_dict:
            perm_dict[p.module_id] = []
        perm_dict[p.module_id].append(p.action_id)
    return perm_dict

@router.put("/roles/{role_id}/permissions")
async def update_role_permissions(role_id: int, payload: RolePermissionUpdate, db: AsyncSession = Depends(get_db), current_user: Employee = Depends(require_permission("admin", "Edit"))):
    # First verify role exists and is not super admin system role (optional guard, but good practice)
    role_res = await db.execute(select(Role).where(Role.id == role_id))
    role = role_res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    # Delete existing role permissions
    await db.execute(RolePermission.__table__.delete().where(RolePermission.role_id == role_id))
    
    # Insert new permissions
    new_perms = []
    for module_id_str, action_ids in payload.permissions.items():
        module_id = int(module_id_str)
        for action_id in action_ids:
            new_perms.append(RolePermission(
                role_id=role_id,
                module_id=module_id,
                action_id=action_id
            ))
            
    if new_perms:
        db.add_all(new_perms)
        
    await db.commit()
    return {"message": "Permissions updated successfully"}
