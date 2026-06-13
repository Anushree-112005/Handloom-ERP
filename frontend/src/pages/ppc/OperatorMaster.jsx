import React, { useState, useEffect } from 'react';
import { Save, Search, Trash2, Edit2, X, Users, Briefcase, Calendar, Phone, ArrowLeft } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../services/api';

export default function OperatorMaster() {
  const [operators, setOperators] = useState([]);
  const [looms, setLooms] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    operator_id: '',
    operator_name: '',
    department: 'Weaving',
    designation: 'Weaver',
    skill_level: 'Junior',
    assigned_loom: '',
    assigned_shift: '',
    join_date: '',
    contact_number: '',
    status: true
  });

  useEffect(() => {
    fetchOperators();
    fetchDependencies();
  }, []);

  const fetchOperators = async () => {
    try {
      const { data } = await ppcAPI.getOperators();
      setOperators(data);
    } catch (error) {
      if (error?.message === 'Request aborted' || error?.code === 'ERR_CANCELED') return;
      console.error("Failed to fetch operators", error);
    }
  };

  const fetchDependencies = async () => {
    try {
      const loomRes = await ppcAPI.getLooms();
      setLooms(loomRes.data);
      
      const shiftRes = await subMasterAPI.list('ppc_shift_master');
      setShifts(shiftRes.data);
    } catch (error) {
      if (error?.message === 'Request aborted' || error?.code === 'ERR_CANCELED') return;
      console.error("Failed to fetch dependencies", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await ppcAPI.updateOperator(editingId, formData);
      } else {
        await ppcAPI.createOperator(formData);
      }
      setFormData({
        operator_id: '',
        operator_name: '',
        department: 'Weaving',
        designation: 'Weaver',
        skill_level: 'Junior',
        assigned_loom: '',
        assigned_shift: '',
        join_date: '',
        contact_number: '',
        status: true
      });
      setEditingId(null);
      setIsFormOpen(false);
      fetchOperators();
    } catch (error) {
      console.error("Failed to save operator", error);
    }
  };

  const handleEdit = (operator) => {
    setEditingId(operator.id);
    setFormData({
      operator_id: operator.operator_id || '',
      operator_name: operator.operator_name || '',
      department: operator.department || 'Weaving',
      designation: operator.designation || 'Weaver',
      skill_level: operator.skill_level || 'Junior',
      assigned_loom: operator.assigned_loom || '',
      assigned_shift: operator.assigned_shift || '',
      join_date: operator.join_date ? operator.join_date.split('T')[0] : '',
      contact_number: operator.contact_number || '',
      status: operator.status ?? true
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this operator?")) return;
    try {
      await ppcAPI.deleteOperator(id);
      fetchOperators();
    } catch (error) {
      console.error("Failed to delete operator", error);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--primary)" />
            Operator Master
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Manage your workforce and shift assignments</p>
        </div>
        {!isFormOpen && (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingId(null);
              setFormData({
                operator_id: '', operator_name: '', department: 'Weaving', designation: 'Weaver',
                skill_level: 'Junior', assigned_loom: '', assigned_shift: '', join_date: '',
                contact_number: '', status: true
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <Users size={16} /> Add Operator
          </button>
        )}
        {isFormOpen && (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: 'var(--primary-light)', borderRadius: 10, color: 'white' }}>
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editingId ? 'Edit Operator' : 'Add Operator'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Operator Master Data</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Operator ID *</label>
                <input type="text" className="form-control" name="operator_id" value={formData.operator_id} onChange={handleInputChange} required placeholder="e.g. OP-001" />
              </div>
              <div className="form-group">
                <label>Operator Name *</label>
                <input type="text" className="form-control" name="operator_name" value={formData.operator_name} onChange={handleInputChange} required placeholder="e.g. Ramesh" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Department</label>
                <input type="text" className="form-control" name="department" value={formData.department} onChange={handleInputChange} placeholder="e.g. Weaving" />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <select className="form-control" name="designation" value={formData.designation} onChange={handleInputChange}>
                  <option value="Weaver">Weaver</option>
                  <option value="Assistant">Assistant</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Skill Level</label>
                <select className="form-control" name="skill_level" value={formData.skill_level} onChange={handleInputChange}>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input type="text" className="form-control" name="contact_number" value={formData.contact_number} onChange={handleInputChange} placeholder="Phone No." />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Assigned Loom</label>
                <select className="form-control" name="assigned_loom" value={formData.assigned_loom} onChange={handleInputChange}>
                  <option value="">-- Select Loom --</option>
                  {looms.map(loom => (
                    <option key={loom.id} value={loom.loom_name}>{loom.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Shift</label>
                <select className="form-control" name="assigned_shift" value={formData.assigned_shift} onChange={handleInputChange}>
                  <option value="">-- Select Shift --</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.name}>{shift.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Join Date</label>
              <input type="date" className="form-control" name="join_date" value={formData.join_date} onChange={handleInputChange} />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 24 }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Status Active</label>
              <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} style={{ marginRight: 8 }} /> {editingId ? 'Update Operator' : 'Save Operator'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Operator List</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Operators: {operators.length}</p>
            </div>
            
            <div className="search-bar" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search operators..." className="form-control" style={{ paddingLeft: 36, width: 250 }} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Role & Skill</th>
                  <th>Assignment</th>
                  <th>Contact & Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.map(op => (
                  <tr key={op.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{op.operator_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{op.operator_id}</div>
                    </td>
                    <td>
                      <div>{op.designation}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{op.department} • {op.skill_level}</div>
                    </td>
                    <td>
                      <div>{op.assigned_loom || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{op.assigned_shift || '-'}</div>
                    </td>
                    <td>
                      <div>{op.contact_number || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {op.join_date ? new Date(op.join_date).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${op.status ? 'status-active' : 'status-inactive'}`} style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: op.status ? '#dcfce7' : '#fee2e2', color: op.status ? '#166534' : '#991b1b'
                      }}>
                        {op.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-icon" onClick={() => handleEdit(op)}><Edit2 size={16} color="var(--primary)" /></button>
                        <button className="btn btn-icon" onClick={() => handleDelete(op.id)}><Trash2 size={16} color="var(--danger)" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {operators.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                      No operators registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
