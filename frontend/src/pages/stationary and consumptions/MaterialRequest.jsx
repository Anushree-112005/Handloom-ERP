import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Trash2, X, FileText, Clock, CheckCircle, AlertTriangle, Loader, AlertCircle, Search, ArrowLeft } from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

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
    quantity: '',
    requested_by: '',
    priority: '',
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
      quantity: '',
      requested_by: '',
      priority: '',
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
      alert('Material Request saved successfully!');
      setView('list');
      await fetchRequests();
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
      {view === 'list' && (
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
          <button onClick={handleOpenForm} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> Raise Request
          </button>
        </div>
      )}

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
        <div className="animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button 
              type="button"
              onClick={() => setView('list')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Add New Material Request
            </h2>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
              <button
                type="button"
                style={{
                  padding: '16px 24px', background: '#fff',
                  border: 'none', borderBottom: '3px solid var(--primary)',
                  fontWeight: 600, color: 'var(--primary)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Request Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
                  </div>
                )}

                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Requisition Info
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <MasterDropdown
                          label="Department"
                          name="department_id"
                          entityType="department"
                          value={formData.department_id}
                          options={departments}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Requested By *</label>
                        <input
                          type="text" required value={formData.requested_by}
                          onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                          placeholder="Enter Requester Name"
                          className="form-control"
                        />
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Material Details
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <MasterDropdown
                          label="Material Category"
                          name="category_id"
                          entityType="category"
                          value={formData.category_id}
                          options={categories}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, category_id: val, item_id: '' })}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Material/Item Requested"
                          name="item_id"
                          entityType="item"
                          value={formData.item_id}
                          options={filteredItemsDropdown.map(i => ({...i, item_name: `${i.item_name} [${i.item_code}] (Stock: ${i.current_stock})`}))}
                          required={true}
                          onChange={(name, val) => handleItemSelect(val)}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Unit of Measure (UOM)"
                          name="uom_id"
                          entityType="uom"
                          value={formData.uom_id}
                          options={uoms}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Suggested Supplier / Vendor"
                          name="vendor_id"
                          entityType="vendor"
                          value={formData.vendor_id}
                          options={vendors}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Priority"
                          name="priority"
                          value={formData.priority}
                          options={['Low', 'Medium', 'High']}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quantity Requested *</label>
                        <input
                          type="number" step="0.01" min="0.01" required value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          placeholder="Enter Quantity"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>Remarks / Reason for Request</label>
                        <textarea
                          value={formData.remarks}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                          placeholder="Enter Remarks"
                          className="form-control"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                    <X size={16} /> Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
