import React, { useState, useEffect } from 'react';
import { Shield, Key, Plus, Trash2, Edit2 } from 'lucide-react';
import api from '../../services/api';

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Permissions Modal State
  const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [rolePerms, setRolePerms] = useState({}); // module_id -> array of action_ids
  const [savingPerms, setSavingPerms] = useState(false);

  useEffect(() => {
    const fetchRBACData = async () => {
      try {
        const [rolesRes, modulesRes, actionsRes] = await Promise.all([
          api.get('/rbac/roles'),
          api.get('/rbac/modules'),
          api.get('/rbac/actions')
        ]);
        setRoles(rolesRes.data);
        setModules(modulesRes.data);
        setActions(actionsRes.data);
      } catch (err) {
        console.error('Error fetching RBAC data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRBACData();
  }, []);

  if (loading) {
    return <div className="page-layout"><div className="loading-state">Loading Roles & Permissions...</div></div>;
  }

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingRole) {
        const res = await api.put(`/rbac/roles/${editingRole.id}`, formData);
        setRoles(roles.map(r => r.id === editingRole.id ? res.data : r));
      } else {
        const res = await api.post('/rbac/roles', formData);
        setRoles([...roles, res.data]);
      }
      setIsModalOpen(false);
      setEditingRole(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/rbac/roles/${roleId}`);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete role');
    }
  };

  const openPermissionsModal = async (role) => {
    setActiveRole(role);
    setIsPermsModalOpen(true);
    try {
      const res = await api.get(`/rbac/roles/${role.id}/permissions`);
      setRolePerms(res.data || {});
    } catch (err) {
      console.error("Failed to fetch permissions", err);
      setRolePerms({});
    }
  };

  const handleTogglePermission = (moduleId, actionId) => {
    setRolePerms(prev => {
      const current = prev[moduleId] || [];
      if (current.includes(actionId)) {
        return { ...prev, [moduleId]: current.filter(id => id !== actionId) };
      } else {
        return { ...prev, [moduleId]: [...current, actionId] };
      }
    });
  };

  const handleToggleModuleAll = (moduleId, isSelected) => {
    setRolePerms(prev => {
      if (isSelected) {
        return { ...prev, [moduleId]: actions.map(a => a.id) };
      } else {
        return { ...prev, [moduleId]: [] };
      }
    });
  };

  const handleToggleGlobalAll = (isSelected) => {
    if (isSelected) {
      const newPerms = {};
      modules.forEach(mod => {
        newPerms[mod.id] = actions.map(a => a.id);
      });
      setRolePerms(newPerms);
    } else {
      setRolePerms({});
    }
  };

  const handleSavePermissions = async () => {
    if (!activeRole) return;
    setSavingPerms(true);
    try {
      await api.put(`/rbac/roles/${activeRole.id}/permissions`, { permissions: rolePerms });
      setIsPermsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="header-icon" style={{ background: 'var(--primary-color)', color: 'white' }}>
              <Shield size={24} />
            </div>
            <div>
              <h1 className="page-title">Role & Permission Management</h1>
              <p className="page-description">Configure system roles and fine-grained access controls</p>
            </div>
          </div>
          
          {/* Moved button to the left side */}
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingRole(null);
              setFormData({ name: '', description: '' });
              setIsModalOpen(true);
            }}
            style={{ marginLeft: '12px' }}
          >
            <Plus size={18} /> New Role
          </button>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th>System Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td style={{ fontWeight: 600 }}>{role.name}</td>
                <td>{role.description}</td>
                <td>
                  {role.is_system ? (
                    <span className="status-badge status-active">Yes</span>
                  ) : (
                    <span className="status-badge status-pending">No</span>
                  )}
                </td>
                <td className="text-right">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '4px 8px', fontSize: '12px', color: '#10b981', borderColor: '#e5e7eb' }}
                      onClick={() => openPermissionsModal(role)}
                      title="Configure permissions"
                    >
                      <Key size={14} style={{ marginRight: 4 }} /> Permissions
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px', 
                        color: '#3b82f6', 
                        borderColor: '#3b82f6',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleEditRole(role)}
                      title="Edit role"
                    >
                      <Edit2 size={14} />
                    </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '12px', 
                          color: '#ef4444', 
                          borderColor: '#ef4444',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleDeleteRole(role.id)}
                        title="Delete role"
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Available Modules</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {modules.map(mod => (
            <div key={mod.id} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: 'var(--bg-secondary)' }}>
              {mod.name} <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({mod.key})</span>
            </div>
          ))}
        </div>
      </div>

      {/* New Role Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ width: '400px' }}>
            <div className="modal-header">
              <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateRole} className="modal-body">
              <div className="form-group">
                <label>Role Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingRole ? 'Save Changes' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Permissions Modal */}
      {isPermsModalOpen && activeRole && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>Edit Permissions: {activeRole.name}</h3>
              <button className="icon-btn" onClick={() => setIsPermsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ flex: '1', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          onChange={(e) => handleToggleGlobalAll(e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        Module
                      </div>
                    </th>
                    {actions.map(a => (
                      <th key={a.id} className="text-center" style={{ fontSize: '11px', padding: '8px 4px' }}>
                        {a.name}
                      </th>
                    ))}
                    <th className="text-center" style={{ fontSize: '11px', padding: '8px 4px', width: '80px' }}>
                      Select All
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map(mod => {
                    const modPerms = rolePerms[mod.id] || [];
                    const isAllSelected = modPerms.length === actions.length && actions.length > 0;
                    return (
                      <tr key={mod.id}>
                        <td style={{ fontWeight: 500 }}>{mod.name}</td>
                        {actions.map(a => (
                          <td key={a.id} className="text-center">
                            <input 
                              type="checkbox" 
                              checked={modPerms.includes(a.id)}
                              onChange={() => handleTogglePermission(mod.id, a.id)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </td>
                        ))}
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            checked={isAllSelected}
                            onChange={(e) => handleToggleModuleAll(mod.id, e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsPermsModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSavePermissions} disabled={savingPerms}>
                {savingPerms ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
