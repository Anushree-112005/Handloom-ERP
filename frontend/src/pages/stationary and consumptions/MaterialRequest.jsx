import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Trash2, X, FileText, Clock, CheckCircle, AlertTriangle, Loader, AlertCircle, Search } from 'lucide-react';

export default function MaterialRequest() {
  const [view, setView] = useState('list');
  const [requests, setRequests] = useState([]);
  
  // Master lists for dropdowns
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [allItems, setAllItems] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    department_id: '',
    category_id: '',
    item_id: '',
    uom_id: '',
    vendor_id: '',
    quantity: 1.0,
    requested_by: '',
    priority: 'Medium',
    remarks: ''
  });

  const fetchDropdowns = async () => {
    setDropdownsLoading(true);
    try {
      const [depts, cats, units, vens, items] = await Promise.all([
        storesService.getDepartments(),
        storesService.getCategories(),
        storesService.getUOMs(),
        storesService.getVendors(),
        storesService.getItems()
      ]);
      
      // Filter out deleted/inactive masters if status exists
      setDepartments(depts.filter(d => d.status !== 'Inactive'));
      setCategories(cats.filter(c => c.status !== 'Inactive'));
      setUoms(units);
      setVendors(vens.filter(v => v.status !== 'Inactive'));
      setAllItems(items.filter(i => i.status !== 'Inactive'));
    } catch (err) {
      console.error("Failed to load request dropdown data:", err);
      setError("Failed to load options for Department/Category dropdowns. Please refresh.");
    } finally {
      setDropdownsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storesService.getMaterialRequests(searchTerm);
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch material requests:", err);
      setError("Failed to load material requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [searchTerm, view]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Filter items in dropdown by selected category
  const filteredItemsDropdown = allItems.filter(item => {
    if (!formData.category_id) return true;
    return item.category_id === Number(formData.category_id);
  });

  // Automatically update UOM and Vendor defaults when user selects an item
  const handleItemSelect = (itemId) => {
    const selectedItem = allItems.find(i => i.id === Number(itemId));
    if (selectedItem) {
      setFormData(prev => ({
        ...prev,
        item_id: itemId,
        category_id: selectedItem.category_id, // Match category
        uom_id: selectedItem.uom_id,           // Match UOM
        vendor_id: selectedItem.vendor_id || '' // Preferred supplier
      }));
    } else {
      setFormData(prev => ({ ...prev, item_id: itemId }));
    }
  };

  const handleOpenForm = () => {
    setError('');
    fetchDropdowns();
    setFormData({
      department_id: '',
      category_id: '',
      item_id: '',
      uom_id: '',
      vendor_id: '',
      quantity: 1.0,
      requested_by: '',
      priority: 'Medium',
      remarks: ''
    });
    setView('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel/delete this material request?')) {
      try {
        setLoading(true);
        await storesService.deleteMaterialRequest(id);
        await fetchRequests();
      } catch (err) {
        console.error(err);
        alert('Failed to delete material request.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_id || !formData.category_id || !formData.item_id || !formData.uom_id) {
      setError('Department, Category, Item, and UOM are required.');
      return;
    }
    if (!formData.requested_by.trim()) {
      setError('Please specify who is requesting the material.');
      return;
    }
    if (Number(formData.quantity) <= 0) {
      setError('Requested quantity must be greater than 0.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      department_id: Number(formData.department_id),
      category_id: Number(formData.category_id),
      item_id: Number(formData.item_id),
      uom_id: Number(formData.uom_id),
      vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
      quantity: Number(formData.quantity),
      requested_by: formData.requested_by.trim(),
      priority: formData.priority,
      remarks: formData.remarks || '',
      status: 'Pending'
    };

    try {
      await storesService.createMaterialRequest(payload);
      setView('list');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while submitting the request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: "24px",
        background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)",
        border: "1px solid var(--border)",
        borderRadius: "12px"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'rgb(99, 102, 241)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Material Request</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Raise and monitor material requisitions for department consumables</p>
          </div>
        </div>
        {view === 'list' ? (
          <button onClick={handleOpenForm} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> Raise Request
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <>
          {/* KPI Dashboard Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            <div className="card stat-card" style={{ '--stat-color': '#6366f1' }}>
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.length}</h3>
                <p>Total Requests</p>
              </div>
            </div>

            <div className="card stat-card" style={{ '--stat-color': '#f59e0b' }}>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.filter(r => r.status === 'Pending').length}</h3>
                <p>Pending Requests</p>
              </div>
            </div>

            <div className="card stat-card" style={{ '--stat-color': '#10b981' }}>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.filter(r => r.status === 'Approved').length}</h3>
                <p>Approved Requests</p>
              </div>
            </div>

            <div className="card stat-card" style={{ '--stat-color': '#ef4444' }}>
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.filter(r => r.priority === 'High').length}</h3>
                <p>High Priority</p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', alignItems: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Requests ({requests.length})</h3>
              <div className="search-bar" style={{ position: 'relative', width: 280 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: 14 }}>{error}</span>
              </div>
            )}

            <div className="table-responsive" style={{ flex: 1 }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Date Raised</th>
                    <th>Department</th>
                    <th>Material/Item Requested</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Qty Requested</th>
                    <th>UOM</th>
                    <th>Suggested Vendor</th>
                    <th>Requested By</th>
                    <th style={{ textAlign: "center" }}>Priority</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="12" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        {loading ? 'Loading material requests...' : 'No requests recorded yet. Click Raise Request to add.'}
                      </td>
                    </tr>
                  ) : requests.map(req => (
                    <tr key={req.id}>
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{req.request_no}</td>
                      <td>{new Date(req.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{req.department_name || '-'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.item_name || '-'}</td>
                      <td>
                        <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: 12, fontWeight: 500 }}>
                          {req.category_name || '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{req.quantity}</td>
                      <td>{req.uom_name || '-'}</td>
                      <td>{req.vendor_name || '-'}</td>
                      <td>{req.requested_by}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${req.priority === 'High' ? 'bg-red-100 text-red-800' : req.priority === 'Low' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ 
                          color: req.status === 'Pending' ? '#d97706' : req.status === 'Approved' ? '#047857' : '#ef4444', 
                          fontWeight: 700, 
                          backgroundColor: req.status === 'Pending' ? '#fef3c7' : req.status === 'Approved' ? '#d1fae5' : '#fef2f2', 
                          padding: '4px 10px', borderRadius: 12, fontSize: 12 
                        }}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => handleDelete(req.id)} style={{ padding: 6, borderRadius: 8, color: '#ef4444', background: '#fef2f2', cursor: "pointer", border: "none" }} title="Delete/Cancel Request">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>Raise New Material Requisition</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting || dropdownsLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                Submit Request
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Section 1: Department Coordinates */}
            <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Requisition Info
              </legend>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Department *</label>
                  <select 
                    value={formData.department_id} 
                    required
                    onChange={(e) => setFormData({...formData, department_id: e.target.value})} 
                    className="form-control"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Requested By *</label>
                  <input 
                    type="text" required value={formData.requested_by} 
                    onChange={(e) => setFormData({...formData, requested_by: e.target.value})} 
                    placeholder="E.g. Dinesh Kumar"
                    className="form-control" 
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 2: Material Selection */}
            <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Material Details
              </legend>
              
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Material Category *</label>
                  <select 
                    value={formData.category_id} 
                    required
                    onChange={(e) => setFormData({...formData, category_id: e.target.value, item_id: ''})} 
                    className="form-control"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Material/Item Requested *</label>
                  <select 
                    value={formData.item_id} 
                    required
                    onChange={(e) => handleItemSelect(e.target.value)} 
                    className="form-control"
                  >
                    <option value="">-- Choose Item --</option>
                    {filteredItemsDropdown.map(i => (
                      <option key={i.id} value={i.id}>{i.item_name} [{i.item_code}] (Stock: {i.current_stock})</option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Showing active items from the Item Master</small>
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Unit of Measure (UOM) *</label>
                  <select 
                    value={formData.uom_id} 
                    required
                    onChange={(e) => setFormData({...formData, uom_id: e.target.value})} 
                    className="form-control"
                  >
                    <option value="">-- Select UOM --</option>
                    {uoms.map(u => <option key={u.id} value={u.id}>{u.uom_name} ({u.symbol || u.uom_code})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Suggested Supplier / Vendor</label>
                  <select 
                    value={formData.vendor_id} 
                    onChange={(e) => setFormData({...formData, vendor_id: e.target.value})} 
                    className="form-control"
                  >
                    <option value="">-- Select Vendor (Optional) --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Priority *</label>
                  <select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({...formData, priority: e.target.value})} 
                    className="form-control"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 2fr', gap: 20, marginTop: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Quantity Requested *</label>
                  <input 
                    type="number" step="0.01" min="0.01" required value={formData.quantity} 
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})} 
                    className="form-control" 
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Remarks / Reason for Request</label>
                  <input 
                    type="text" value={formData.remarks} 
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
                    placeholder="E.g. Urgent loom maintenance replacement..."
                    className="form-control" 
                  />
                </div>
              </div>
            </fieldset>
          </div>
        </form>
      )}
    </div>
  );
}
