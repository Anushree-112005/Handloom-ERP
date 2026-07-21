from typing import Optional, List
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.employee import Employee
from app.models.rbac import Role, UserRole, RolePermission, UserPermission, Module, PermissionAction

def require_permission(module_key: str, action_name: str):
    """
    Dependency that enforces RBAC.
    Checks if the current user has the specified action permission for the specified module.
    Super Admins are bypassed.
    """
    from app.api.v1.endpoints.auth import get_current_user
    async def dependency(
        current_user: Employee = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        # Get module ID and Action ID
        module_res = await db.execute(select(Module).where(Module.key == module_key))
        module = module_res.scalar_one_or_none()
        if not module:
            raise HTTPException(status_code=403, detail=f"Module {module_key} not found in RBAC catalog.")
            
        action_res = await db.execute(select(PermissionAction).where(PermissionAction.name == action_name))
        action = action_res.scalar_one_or_none()
        if not action:
            raise HTTPException(status_code=403, detail=f"Action {action_name} not found in RBAC catalog.")

        # Check UserPermissions (Overrides) first
        user_perm_res = await db.execute(
            select(UserPermission)
            .where(
                UserPermission.user_id == current_user.id,
                UserPermission.module_id == module.id,
                UserPermission.action_id == action.id
            )
        )
        user_perm = user_perm_res.scalar_one_or_none()
        
        if user_perm:
            if user_perm.is_allowed:
                return current_user
            else:
                raise HTTPException(status_code=403, detail="Permission denied (User override).")
                
        # Check RolePermissions
        user_roles = await db.execute(
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == current_user.id)
        )
        roles = user_roles.scalars().all()
        
        role_ids = [r.id for r in roles]
        if not role_ids:
            raise HTTPException(status_code=403, detail="No roles assigned.")
            
        role_perm_res = await db.execute(
            select(RolePermission)
            .where(
                RolePermission.role_id.in_(role_ids),
                RolePermission.module_id == module.id,
                RolePermission.action_id == action.id
            )
        )
        role_perm = role_perm_res.scalar_one_or_none()
        
        if not role_perm:
            raise HTTPException(status_code=403, detail=f"Permission denied. Required: {module_key}:{action_name}")
            
        return current_user
        
    return dependency

async def get_user_rbac_context(user_id: int, db: AsyncSession):
    # Get Roles
    user_roles_res = await db.execute(
        select(Role).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user_id)
    )
    roles = user_roles_res.scalars().all()
    is_super_admin = any(r.name == "Super Admin" for r in roles)
    
    # Get Modules
    modules_res = await db.execute(select(Module))
    all_modules = modules_res.scalars().all()
    
    assigned_modules = []
    # Get modules explicitly assigned via UserPermission
    um_res = await db.execute(
        select(Module)
        .join(UserPermission, UserPermission.module_id == Module.id)
        .where(UserPermission.user_id == user_id)
        .distinct()
    )
    user_assigned = um_res.scalars().all()
        
    role_assigned = []
    if roles:
        rm_res = await db.execute(
            select(Module)
            .join(RolePermission, RolePermission.module_id == Module.id)
            .where(RolePermission.role_id.in_([r.id for r in roles]))
            .distinct()
        )
        role_assigned = rm_res.scalars().all()
    
    assigned_modules = list(set([m.key for m in user_assigned + role_assigned]))
        
    # Build Permissions mapping: module_key -> action -> boolean
    permissions_map = {}
    actions_res = await db.execute(select(PermissionAction))
    all_actions = actions_res.scalars().all()
    action_dict = {a.id: a.name for a in all_actions}
    
    # role permissions
    rp_res = await db.execute(
        select(RolePermission, Module)
        .join(Module)
        .where(RolePermission.role_id.in_([r.id for r in roles]))
    )
    for rp, mod in rp_res.all():
        if mod.key not in permissions_map:
            permissions_map[mod.key] = {}
        permissions_map[mod.key][action_dict[rp.action_id]] = True
        
    # user overrides
    up_res = await db.execute(
        select(UserPermission, Module)
        .join(Module)
        .where(UserPermission.user_id == user_id)
    )
    for up, mod in up_res.all():
        if mod.key not in permissions_map:
            permissions_map[mod.key] = {}
        permissions_map[mod.key][action_dict[up.action_id]] = up.is_allowed

    return {
        "roles": [r.name for r in roles],
        "is_super_admin": is_super_admin,
        "assigned_modules": assigned_modules,
        "permissions": permissions_map
    }

