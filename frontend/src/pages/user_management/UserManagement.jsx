import { useState, useEffect } from 'react';
import { Users, Plus, Save, ArrowLeft, Edit2, Search, Trash2, Key, Shield, CheckCircle, XCircle } from 'lucide-react';
import { employeeAPI } from '../../services/api';

const SearchableSelect = ({ options, value, onChange, disabled, placeholder }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div style={{ position: 'relative' }}>
      <div 
        className="form-control" 
        style={{ 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          backgroundColor: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          minHeight: '38px', margin: 0
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: 10 }}>▼</span>
      </div>
      
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setIsOpen(false)} />
          <div style={{ 
            position: 'absolute', top: '100%', left: 0, right: 0, 
            zIndex: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)', 
            borderRadius: 4, marginTop: 4, maxHeight: 250, overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <input 
              type="text" 
              className="form-control" 
              style={{ margin: '8px', width: 'calc(100% - 16px)' }}
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
            {options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())).map(o => (
              <div 
                key={o.value} 
                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
              >
                {o.label}
              </div>
            ))}
            {options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <div style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>No employees found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default function UserManagement() {
  const [view, setView] = useState('list');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const [allEmployees, setAllEmployees] = useState([]);

  const initialForm = {
    id: '', employee_code: '', username: '', name: '', user_type: 'User', status: 'Active',
    web_access: 'Allow', department: '', designation: '', email: '',
    mobile: '', password: '', company_depl: false, company_mtm: false,
    access_expiry_date: '', unit: '', role_id: ''
  };


  const [formData, setFormData] = useState(initialForm);
  const [availableRoles, setAvailableRoles] = useState([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await employeeAPI.list({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined
      });
      if (data && data.data) {
        setUsers(data.data);
        setTotalRecords(data.total);
      } else {
        setUsers(data || []);
        setTotalRecords((data || []).length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      // Assuming api is configured in employeeAPI or import api
      const api = (await import('../../services/api')).default;
      const { data } = await api.get('/rbac/roles');
      setAvailableRoles(data);
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const { data } = await employeeAPI.list({ limit: 10000 });
      setAllEmployees(data?.data || data || []);
    } catch (err) {
      console.error("Failed to fetch all employees", err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAllEmployees();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]);

  // Debounced Search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenForm = (user = null) => {
    if (user) {
      setFormData({ 
        ...user, 
        password: '', 
        access_expiry_date: user.access_expiry_date ? user.access_expiry_date.substring(0, 10) : '',
        role_id: user.role_id || ''
      });
      setEditingId(user.id);
    } else {
      setFormData(initialForm);
      setEditingId(null);
      fetchAllEmployees();
    }
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Data preparation
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password
      if (!payload.access_expiry_date) payload.access_expiry_date = null; // Fix 422 Unprocessable Entity
      if (!payload.role_id) payload.role_id = null;

      if (editingId) {
        payload.modified_by = "Admin"; // In a real app, from context
        await employeeAPI.update(editingId, payload);
      } else {
        payload.created_by = "Admin"; // In a real app, from context
        if (!payload.id) {
          alert("Please select an employee.");
          return;
        }
        await employeeAPI.update(payload.id, payload);
      }
      setView('list');
      fetchUsers();
    } catch (err) {
      alert("Error saving user. " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete user ${name}?`)) {
      try {
        await employeeAPI.delete(id);
        fetchUsers();
      } catch (err) {
        alert("Error deleting user.");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // The filtering is now handled by the backend
  const filteredUsers = users;

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setView('list')} className="btn btn-secondary" style={{ padding: '8px' }}>
              <ArrowLeft size={20} />
            </button>
            {editingId ? 'Edit User Access' : 'Create New User'}
          </h2>
          <button type="submit" form="userForm" className="btn btn-primary">
            <Save size={18} /> {editingId ? 'Update' : 'Save'} User
          </button>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form id="userForm" onSubmit={handleSubmit}>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Employee Name *</label>
                <SearchableSelect 
                  options={allEmployees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.name}` }))}
                  value={formData.id}
                  onChange={(val) => {
                    if (!val) return;
                    const emp = allEmployees.find(x => x.id === val);
                    if (emp) {
                      if (emp.username) {
                        alert("A user account already exists for this employee.");
                        return;
                      }
                      setFormData(prev => ({
                        ...prev,
                        id: emp.id,
                        employee_code: emp.employee_code,
                        name: emp.name,
                        email: emp.email || '',
                        mobile: emp.mobile || '',
                        department: emp.department || '',
                        designation: emp.designation || '',
                      }));
                    }
                  }}
                  disabled={!!editingId}
                  placeholder="Select Employee..."
                />
              </div>
              <div className="form-group">
                <label>Login Username *</label>
                <input className="form-control" name="username" value={formData.username || ''} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>User Type (Role)</label>
                <select className="form-control" name="role_id" value={formData.role_id} onChange={handleChange}>
                  <option value="">Select a Role...</option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Email ID</label>
                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} readOnly />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input className="form-control" name="mobile" value={formData.mobile} onChange={handleChange} readOnly />
              </div>
              <div className="form-group">
                <label>Password {editingId && '(Leave blank to keep current)'}</label>
                <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input className="form-control" name="department" value={formData.department} onChange={handleChange} readOnly />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input className="form-control" name="designation" value={formData.designation} onChange={handleChange} readOnly />
              </div>
              <div className="form-group">
                <label>Branch / Unit Access</label>
                <input className="form-control" name="unit" value={formData.unit} onChange={handleChange} />
              </div>
            </div>

            <h3 style={{ marginTop: 32, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} /> Access Control & Companies
            </h3>
            
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="form-group">
                <label>Account Status</label>
                <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                  <option value="Active">Enable (Active)</option>
                  <option value="Disabled">Disable (Suspended)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Web Login Access</label>
                <select className="form-control" name="web_access" value={formData.web_access} onChange={handleChange}>
                  <option value="Allow">Allow Login</option>
                  <option value="Lock">Lock Account</option>
                </select>
              </div>
              <div className="form-group">
                <label>Access Expiry Date</label>
                <input type="date" className="form-control" name="access_expiry_date" value={formData.access_expiry_date} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginTop: 16 }}>
              <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Company Access</h4>
                <div style={{ display: 'flex', gap: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="company_depl" checked={formData.company_depl} onChange={handleChange} style={{ width: 18, height: 18 }} />
                    DEPL
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="company_mtm" checked={formData.company_mtm} onChange={handleChange} style={{ width: 18, height: 18 }} />
                    MTM
                  </label>
                </div>
              </div>

              <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none', gridColumn: 'span 2' }}>
                <h4 style={{ marginBottom: 16, fontWeight: 600 }}>Module Permissions</h4>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <p>Permissions are now managed via Roles. Assign a <strong>User Type (Role)</strong> above, and the permissions will automatically apply based on the Role's configuration.</p>
                  <p style={{ marginTop: '8px' }}>To modify what a Role can do, visit the <strong>Administration & Security → Role & Permission Management</strong> page.</p>
                </div>
              </div>
            </div>

            {editingId && (
              <div style={{ marginTop: 32, fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div><strong>Last Login:</strong> {formData.last_login ? new Date(formData.last_login).toLocaleString() : 'Never logged in'}</div>
                <div><strong>Created By:</strong> {formData.created_by || '-'}</div>
                <div><strong>Modified By:</strong> {formData.modified_by || '-'}</div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={24} color="var(--primary)" /> User Management
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage portal access, roles, passwords, and module permissions.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Create New User
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by User ID or Name..." 
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Emp Code & Username</th>
              <th>Name & Contact</th>
              <th>Role & Dept</th>
              <th>Web Access</th>
              <th>Companies</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No users found.</td></tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.employee_code}</div>
                    <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>@{u.username || '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email || u.mobile || '-'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{u.role_name || u.user_type || 'Unassigned'}</span>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{u.department || '-'}</div>
                  </td>
                  <td>
                    {u.web_access === 'Allow' ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}><CheckCircle size={14}/> Allowed</span>
                    ) : (
                      <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}><XCircle size={14}/> Locked</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {u.company_depl && <span className="badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>DEPL</span>}
                      {u.company_mtm && <span className="badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>MTM</span>}
                      {!u.company_depl && !u.company_mtm && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(u)} title="Edit User">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(e) => handleDelete(u.id, u.name, e)} title="Delete">
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        {!loading && totalRecords > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-primary)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 16px', fontSize: 13, fontWeight: 500, opacity: currentPage === 1 ? 0.6 : 1 }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 16px', fontSize: 13, fontWeight: 500, opacity: currentPage >= Math.ceil(totalRecords / pageSize) ? 0.6 : 1 }}
                  disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
              
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> results
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Items per page:</span>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
