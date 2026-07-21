from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    is_system = Column(Boolean, default=False)  # Super Admin, Admin, User are system roles
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")


class PermissionAction(Base):
    """
    Catalog of available actions: View, Create, Edit, Delete, Approve, Reject, Export Excel, Export PDF, Print, Upload, Download
    """
    __tablename__ = "permission_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)


class Module(Base):
    """
    Catalog of ERP modules and their sub-pages.
    Structured hierarchically.
    """
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    key = Column(String(100), unique=True, index=True, nullable=False) # e.g., "production", "production.loom_planning"
    parent_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    icon = Column(String(100), nullable=True)
    path = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    
    # Relationships
    parent = relationship("Module", remote_side=[id], backref="children")
    role_permissions = relationship("RolePermission", back_populates="module", cascade="all, delete-orphan")
    user_modules = relationship("UserModule", back_populates="module", cascade="all, delete-orphan")
    user_permissions = relationship("UserPermission", back_populates="module", cascade="all, delete-orphan")


class RolePermission(Base):
    """Maps Role -> Module -> Action"""
    __tablename__ = "role_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(Integer, ForeignKey("permission_actions.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    role = relationship("Role", back_populates="role_permissions")
    module = relationship("Module", back_populates="role_permissions")
    action = relationship("PermissionAction")


class UserRole(Base):
    """Maps User -> Role"""
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    role = relationship("Role", back_populates="user_roles")


class UserModule(Base):
    """Maps User -> Module (explicit assignment)"""
    __tablename__ = "user_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    module = relationship("Module", back_populates="user_modules")


class UserPermission(Base):
    """Optional per-user permission overrides"""
    __tablename__ = "user_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(Integer, ForeignKey("permission_actions.id", ondelete="CASCADE"), nullable=False)
    is_allowed = Column(Boolean, default=True) # True = allow (override deny), False = deny (override allow)
    
    # Relationships
    module = relationship("Module", back_populates="user_permissions")
    action = relationship("PermissionAction")


class AuditLog(Base):
    """Records every access-relevant action for traceability"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
