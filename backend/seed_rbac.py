import asyncio
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal
from app.models.rbac import Role, PermissionAction, Module, RolePermission, UserRole
from app.models.employee import Employee

async def seed_data():
    async with AsyncSessionLocal() as session:
        # 1. Seed Permissions
        actions = ["View", "Create", "Edit", "Delete", "Approve", "Reject", "Export Excel", "Export PDF", "Print", "Upload", "Download"]
        for action_name in actions:
            existing = await session.execute(select(PermissionAction).where(PermissionAction.name == action_name))
            if not existing.scalar_one_or_none():
                session.add(PermissionAction(name=action_name, description=f"{action_name} permission"))
        await session.commit()

        # 2. Seed Roles
        roles = [
            {"name": "Super Admin", "desc": "Full unrestricted access", "sys": True},
            {"name": "Admin", "desc": "All operational modules, no system admin", "sys": True},
            {"name": "Module Manager", "desc": "Full control of assigned modules", "sys": True},
            {"name": "Module Assistant", "desc": "Operates under manager, no approval", "sys": True},
            {"name": "User", "desc": "Standard employee", "sys": True},
        ]
        for role_data in roles:
            existing = await session.execute(select(Role).where(Role.name == role_data["name"]))
            if not existing.scalar_one_or_none():
                session.add(Role(name=role_data["name"], description=role_data["desc"], is_system=role_data["sys"]))
        await session.commit()

        # 3. Seed Modules (Top level only for now to test)
        modules = [
            {"name": "Dashboard", "key": "dashboard"},
            {"name": "Textile Operations", "key": "textile_operations"},
            {"name": "Accounts & Finance", "key": "finance"},
            {"name": "Production Planning (PPC)", "key": "ppc"},
            {"name": "Human Resources", "key": "hr"},
            {"name": "Vehicle Management", "key": "vehicle"},
            {"name": "Stores & Consumables", "key": "stores"},
            {"name": "Administration & Security", "key": "admin"},
        ]
        for mod_data in modules:
            existing = await session.execute(select(Module).where(Module.key == mod_data["key"]))
            if not existing.scalar_one_or_none():
                session.add(Module(name=mod_data["name"], key=mod_data["key"], sort_order=modules.index(mod_data)))
        await session.commit()

        # 4. Assign Super Admin to a user (first user found)
        first_user = await session.execute(select(Employee).order_by(Employee.id).limit(1))
        user = first_user.scalar_one_or_none()
        
        super_admin_role = await session.execute(select(Role).where(Role.name == "Super Admin"))
        sa_role = super_admin_role.scalar_one()

        if user:
            existing_ur = await session.execute(
                select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == sa_role.id)
            )
            if not existing_ur.scalar_one_or_none():
                session.add(UserRole(user_id=user.id, role_id=sa_role.id))
            
            # Since they are super admin, we don't strictly need to map every module, 
            # but let's give them admin module just in case
            admin_mod = await session.execute(select(Module).where(Module.key == "admin"))
            mod = admin_mod.scalar_one()
            
            # We don't map user modules for super admin usually, backend check will bypass.
            
        await session.commit()
        print("RBAC seeded successfully")

if __name__ == "__main__":
    asyncio.run(seed_data())
