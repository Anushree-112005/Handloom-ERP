import { useState, useEffect } from 'react';
import { Users, Plus, Save, ArrowLeft, Edit2, Search, Trash2, Key, Shield, CheckCircle, XCircle } from 'lucide-react';
import { employeeAPI } from '../../services/api';

export default function UserManagement() {
  const [view, setView] = useState('list');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialForm = {
    employee_code: '', name: '', user_type: 'User', status: 'Active',
    web_access: 'Allow', department: '', designation: '', email: '',
    mobile: '', password: '', company_depl: false, company_mtm: false,
    access_expiry_date: '', unit: '',
    module_permissions: {
      dashboard: false, overview: false,
      party_master: false, employee_master: false,
      design_entry: false, buyer_order: false,
      yarn_po: false, yarn_inward: false, grey_yarn_delivery: false, dyed_yarn_receipt: false, dyed_yarn_delivery: false,
      warp_beam_receipt: false, warp_delivery: false,
      cloth_inward: false, cloth_delivery: false, finished_fabric: false,
      quality_checking: false,
      packing_slip: false,
      gra: false, sales_invoice: false, despatch_planning: false,
      eway_bill: false,
      log_report: false
    }
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await employeeAPI.list();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (user = null) => {
    if (user) {
      setFormData({ 
        ...user, 
        password: '', 
        access_expiry_date: user.access_expiry_date ? user.access_expiry_date.substring(0, 10) : '',
        module_permissions: user.module_permissions || initialForm.module_permissions
      });
      setEditingId(user.id);
    } else {
      setFormData(initialForm);
      setEditingId(null);
    }
    setView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Data preparation
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password

      if (editingId) {
        payload.modified_by = "Admin"; // In a real app, from context
        await employeeAPI.update(editingId, payload);
      } else {
        payload.created_by = "Admin"; // In a real app, from context
        await employeeAPI.create(payload);
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

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      module_permissions: {
        ...prev.module_permissions,
        [name]: checked
      }
    }));
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="form-group">
                <label>User ID (Unique login ID) *</label>
                <input className="form-control" name="employee_code" value={formData.employee_code} onChange={handleChange} required disabled={!!editingId} />
              </div>
              <div className="form-group">
                <label>User Name (Full name) *</label>
                <input className="form-control" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>User Type (Role)</label>
                <select className="form-control" name="user_type" value={formData.user_type} onChange={handleChange}>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Operator</option>
                  <option>User</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email ID</label>
                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input className="form-control" name="mobile" value={formData.mobile} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Password {editingId && '(Leave blank to keep current)'}</label>
                <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input className="form-control" name="department" value={formData.department} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input className="form-control" name="designation" value={formData.designation} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Branch / Unit Access</label>
                <input className="form-control" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g. Unit 1" />
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  
                  {/* Row 1 */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="dashboard" checked={formData.module_permissions?.dashboard || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Dashboard
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="overview" checked={formData.module_permissions?.overview || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Overview
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="party_master" checked={formData.module_permissions?.party_master || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Party Master
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="employee_master" checked={formData.module_permissions?.employee_master || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Employee Master
                  </label>

                  {/* Row 2 */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="design_entry" checked={formData.module_permissions?.design_entry || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Design Entry
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="buyer_order" checked={formData.module_permissions?.buyer_order || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Buyer Order
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="yarn_po" checked={formData.module_permissions?.yarn_po || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Yarn Purchase Order
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="yarn_inward" checked={formData.module_permissions?.yarn_inward || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Yarn Inward
                  </label>

                  {/* Row 3 */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="grey_yarn_delivery" checked={formData.module_permissions?.grey_yarn_delivery || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Grey Yarn Delivery
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="dyed_yarn_receipt" checked={formData.module_permissions?.dyed_yarn_receipt || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Dyed Yarn Received
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="dyed_yarn_delivery" checked={formData.module_permissions?.dyed_yarn_delivery || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Dyed Yarn Delivery
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="warp_beam_receipt" checked={formData.module_permissions?.warp_beam_receipt || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Warp Beam Receipt
                  </label>

                  {/* Row 4 */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="warp_delivery" checked={formData.module_permissions?.warp_delivery || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Warp Delivery
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="cloth_inward" checked={formData.module_permissions?.cloth_inward || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Cloth Inward
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="cloth_delivery" checked={formData.module_permissions?.cloth_delivery || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Cloth Delivery
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="finished_fabric" checked={formData.module_permissions?.finished_fabric || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Finished Fabric
                  </label>

                  {/* Row 5 */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="quality_checking" checked={formData.module_permissions?.quality_checking || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    On-Table Checking
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="packing_slip" checked={formData.module_permissions?.packing_slip || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Packing Slip
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="gra" checked={formData.module_permissions?.gra || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Goods Release (GRA)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="sales_invoice" checked={formData.module_permissions?.sales_invoice || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Sales Invoice
                  </label>

                  {/* Row 6 */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="despatch_planning" checked={formData.module_permissions?.despatch_planning || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Despatch Planning
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="eway_bill" checked={formData.module_permissions?.eway_bill || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    E-Way Bill
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="log_report" checked={formData.module_permissions?.log_report || false} onChange={handlePermissionChange} style={{ width: 16, height: 16 }} />
                    Log Report
                  </label>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={24} color="var(--primary)" /> User Management
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage portal access, roles, passwords, and module permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Create New User
        </button>
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
              <th>User ID</th>
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
                  <td style={{ fontWeight: 600 }}>{u.employee_code}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email || u.mobile || '-'}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{u.user_type}</span>
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
      </div>
    </div>
  );
}
