import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, Briefcase, CheckCircle, Clock, Download, Edit2, Eye, FileText, IndianRupee, Loader, MapPin, Phone, Plus, Save, Search, Trash2, User, X, Users, Filter, Globe, Mail } from 'lucide-react';

import { storesService } from '../../services/storesService';

import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function MaterialRequest() {
  const [view, setView] = useState('list');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [editingId, setEditingId] = useState(null);

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

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

  const handleOpenForm = (req = null) => {
    setError('');
    fetchDropdowns();
    if (req) {
      setFormData({
        department_id: req.department_id || '',
        category_id: req.category_id || '',
        item_id: req.item_id || '',
        uom_id: req.uom_id || '',
        vendor_id: req.vendor_id || '',
        quantity: req.quantity || '',
        requested_by: req.requested_by || '',
        priority: req.priority || 'Normal',
        remarks: req.remarks || ''
      });
      setEditingId(req.id);
    } else {
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
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = (id, name = 'this request', e = null) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
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
      if (editingId) {
        if (storesService.updateMaterialRequest) {
          await storesService.updateMaterialRequest(editingId, payload);
          alert('Material Request updated successfully!');
        } else {
          alert('Update endpoint not configured in storesService.');
        }
      } else {
        await storesService.createMaterialRequest(payload);
        alert('Material Request saved successfully!');
      }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={24} color="var(--primary)" /> Material Request
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Raise and monitor material requisitions for department consumables</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ExportButton
              data={requests}
              filename="Material_Request_Report"
              pdfTitle="Material Request Report"
              columns={[
                { header: 'Request ID', key: 'req_id' },
                { header: 'Date', key: 'request_date' },
                { header: 'Department', key: 'department_name' },
                { header: 'Item', key: 'item_name' },
                { header: 'Quantity', key: 'quantity', render: (row) => `${row.quantity} ${row.uom_symbol || ''}` },
                { header: 'Priority', key: 'priority' },
                { header: 'Status', key: 'status' }
              ]}
            />
            <button onClick={handleOpenForm} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Raise Request
            </button>
          </div>
        </div>
      )}

      {view === 'list' ? (
        <>
          {/* KPI Dashboard Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.length}</h3>
                <p>Total Requests</p>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.filter(r => r.status === 'Pending').length}</h3>
                <p>Pending Requests</p>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.filter(r => r.status === 'Approved').length}</h3>
                <p>Approved Requests</p>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div className="stat-info">
                <h3>{requests.filter(r => r.priority === 'High').length}</h3>
                <p>High Priority</p>
              </div>
            </div>
          </div>

          {/* Search Card */}
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search requests..."
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {loading && <Loader className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Filter size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
              </div>

              <select className="form-control" style={{ width: 150, margin: 0 }}>
                <option>All Types</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
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
                      <tr key={req.id}
                        onClick={() => setSelectedViewItem(req)}
                        style={{
                          cursor: 'pointer',
                          background: selectedViewItem?.id === req.id ? 'var(--bg-secondary)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
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
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleOpenForm(req)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setSelectedViewItem(req)}
                              title="Preview"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={(e) => handleDelete(req.id, req.request_no, e)}
                              title="Delete"
                            >
                              <Trash2 size={16} color="var(--danger, #ef4444)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
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
                          options={filteredItemsDropdown.map(i => ({ ...i, item_name: `${i.item_name} [${i.item_code}] (Stock: ${i.current_stock})` }))}
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

      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420,
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    setLoading(true);
                    await storesService.deleteMaterialRequest(id);
                    await fetchRequests();
                    if (typeof setSelectedViewItem === 'function' && selectedViewItem?.id === id) setSelectedViewItem(null);
                  } catch (err) {
                    alert("Error deleting record. It may be in use.");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Department Request Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>

                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>DEPARTMENT REQUEST</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                <div style={{ padding: '10px 40px 40px 40px' }}>
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(10, 20).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Handloom ERP</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br />Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5} /> 0424-1234567</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5} /> info@handloomerp.com</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5} /> www.handloomerp.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                    <FileText size={16} color="#1e3a8a" strokeWidth={2.5} /> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

