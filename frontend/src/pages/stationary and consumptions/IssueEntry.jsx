import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, Building2, CheckCircle, Download, Edit2, Eye, FileText, IndianRupee, Loader2, MapPin, Package, Phone, Plus, RefreshCw, Save, Search, Trash2, User, Users, X, Filter, Globe, Mail, ClipboardList } from 'lucide-react';

import storesService from '../../services/storesService';

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

export default function IssueEntry() {
  const [view, setView] = useState('list');

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

  const [loading, setLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deptError, setDeptError] = useState('');
  const [issues, setIssues] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');

  const [formData, setFormData] = useState({
    requesting_department_id: '',
    issued_by_id: '',
    received_by_id: '',
    purpose: '',
    items: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [editingId, setEditingId] = useState(null);

  /* ─── initial load ─── */
  useEffect(() => { loadData(); }, [view]);

  const loadData = async () => {
    setLoading(true);
    setDeptLoading(true);
    setDeptError('');
    try {
      const [issueData, itms, depts, emps, whs] = await Promise.all([
        storesService.getDepartmentIssues(),
        storesService.getItems(),
        storesService.getDepartments(),
        storesService.getEmployees(),
        storesService.getWarehouses()
      ]);
      setIssues(issueData || []);
      setItemsList(itms || []);
      /* sort alphabetically */
      setDepartments((depts || []).slice().sort((a, b) =>
        (a.department_name || '').localeCompare(b.department_name || '')
      ));
      setEmployees(emps || []);
      setWarehouses(whs || []);
      if (!depts || depts.length === 0) {
        setDeptError('No active departments found. Please add departments in the Department Master first.');
      }
    } catch (err) {
      console.error(err);
      setDeptError('Failed to load departments. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setDeptLoading(false);
    }
  };

  /* ─── item helpers ─── */
  const handleAddField = () => {
    const itm = itemsList[0];
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_id: itm?.id || '',
          category_id: itm?.category_id || '',
          uom_id: itm?.uom_id || '',
          quantity_requested: 1,
          quantity_issued: 1,
          warehouse_id: warehouses[0]?.id || '',
          remarks: ''
        }
      ]
    });
  };

  const handleItemChange = (index, itemId) => {
    const selected = itemsList.find(x => x.id === parseInt(itemId));
    if (selected) {
      const updated = [...formData.items];
      updated[index] = {
        ...updated[index],
        item_id: selected.id,
        category_id: selected.category_id,
        uom_id: selected.uom_id,
        warehouse_id: warehouses[0]?.id || ''
      };
      setFormData({ ...formData, items: updated });
    }
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...formData.items];
    updated[index].quantity_requested = parseFloat(qty) || 0;
    updated[index].quantity_issued = parseFloat(qty) || 0;
    setFormData({ ...formData, items: updated });
  };

  const handleRemoveField = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  /* ─── submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.requesting_department_id) {
      alert('Please select a Department before submitting.');
      return;
    }
    if (!formData.issued_by_id) {
      alert('Please select who is issuing the stock.');
      return;
    }
    if (formData.items.length === 0) {
      alert('Add at least one item to issue.');
      return;
    }
    /* stock check */
    for (let item of formData.items) {
      const dbItem = itemsList.find(x => x.id === parseInt(item.item_id));
      if (dbItem && dbItem.current_stock < item.quantity_issued) {
        alert(`Insufficient stock for '${dbItem.item_name}'. Available: ${dbItem.current_stock}`);
        return;
      }
    }

    setSubmitLoading(true);
    try {
      const payload = {
        requesting_department_id: parseInt(formData.requesting_department_id),
        issued_by_id: parseInt(formData.issued_by_id),
        received_by_id: formData.received_by_id ? parseInt(formData.received_by_id) : null,
        purpose: formData.purpose || '',
        items: formData.items.map(item => ({
          item_id: parseInt(item.item_id),
          category_id: parseInt(item.category_id),
          uom_id: parseInt(item.uom_id),
          quantity_requested: item.quantity_requested,
          quantity_issued: item.quantity_issued,
          warehouse_id: item.warehouse_id ? parseInt(item.warehouse_id) : null,
          remarks: item.remarks
        }))
      };

      if (editingId) {
        if (storesService.updateDepartmentIssue) {
          await storesService.updateDepartmentIssue(editingId, payload);
          alert('Stock issue updated successfully!');
        } else {
          alert('Update endpoint missing in storesService.');
        }
      } else {
        await storesService.createDepartmentIssue(payload);
        alert('Stock issued successfully! Stock levels updated.');
      }
      setView('list');
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to execute stock issuance.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (issue) => {
    const detailedIssue = await storesService.getDepartmentIssue(issue.id);
    setFormData({
      requesting_department_id: detailedIssue.requesting_department_id ? detailedIssue.requesting_department_id.toString() : '',
      issued_by_id: detailedIssue.issued_by_id ? detailedIssue.issued_by_id.toString() : '',
      received_by_id: detailedIssue.received_by_id ? detailedIssue.received_by_id.toString() : '',
      purpose: detailedIssue.purpose || '',
      items: detailedIssue.items || []
    });
    setEditingId(issue.id);
    setView('form');
  };

  const handleDelete = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
  };

  /* ─── computed ─── */
  const filteredIssues = issues.filter(iss =>
    iss.issue_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (iss.requesting_department_name && iss.requesting_department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDepts = departments.filter(d =>
    d.department_name?.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const selectedDeptName = departments.find(
    d => d.id === parseInt(formData.requesting_department_id)
  )?.department_name || '';

  /* ─── stat cards ─── */
  const stats = [
    {
      label: 'Total Issues',
      value: issues.length,
      icon: <FileText size={24} />,
      color: '#3b82f6'
    },
    {
      label: 'Departments Served',
      value: new Set(issues.map(i => i.requesting_department_id)).size,
      icon: <Building2 size={24} />,
      color: '#8b5cf6'
    },
    {
      label: 'Active Departments',
      value: departments.length,
      icon: <Users size={24} />,
      color: '#10b981'
    },
    {
      label: 'Items Tracked',
      value: itemsList.length,
      icon: <Package size={24} />,
      color: '#f59e0b'
    }
  ];

  const statusColors = {
    'Issued': 'bg-blue-50 text-blue-600',
    'Received': 'bg-emerald-50 text-emerald-600',
    'Cancelled': 'bg-red-50 text-red-500',
    'Pending': 'bg-amber-50 text-amber-600'
  };

  /* ══════════════════════════════════════════════ RENDER ══════════════════════════════════════════════ */
  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      {view === 'list' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={24} color="var(--primary)" /> Issue to Department
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Issue consumable items from store to departments. Department list is loaded live from Department Master.</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ExportButton
              data={filteredIssues}
              filename="Department_Issue_Report"
              pdfTitle="Department Issue Report"
              columns={[
                { header: 'Issue No', key: 'issue_no' },
                { header: 'Date', key: 'issue_date', render: (row) => new Date(row.issue_date).toLocaleDateString() },
                { header: 'Department', key: 'requesting_department_name' },
                { header: 'Issued By', key: 'issued_by_name' },
                { header: 'Purpose', key: 'purpose' },
                { header: 'Status', key: 'status' }
              ]}
            />
            <button onClick={() => { setFormData({ requesting_department_id: '', issued_by_id: '', received_by_id: '', purpose: '', items: [] }); setEditingId(null); setView('form'); }}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
              <Plus size={16} /> New Issue
            </button>
          </div>
        </div>
      )}
      {/* ══════════ LIST VIEW ══════════ */}
      {view === 'list' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20, marginBottom: 24 }}>
            {stats.map(stat => (
              <div key={stat.label} className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
                <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-details">
                  <h3>{stat.label}</h3>
                  <div className="value">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
            {/* Search Card */}
            <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Issue No or Department..."
                  style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {loading && <Loader2 className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <Filter size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
                </div>
                <select className="form-control" style={{ width: 150, margin: 0 }}>
                  <option>All Departments</option>
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

            <div className="overflow-x-auto flex-1">
              <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Issue No</th>
                    <th>Issue Date</th>
                    <th>Department</th>
                    <th>Issued By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                  ) : filteredIssues.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No issues found matching criteria.</td></tr>
                  ) : (
                    filteredIssues.map(i => (
                      <tr 
                        key={i.id}
                        onClick={async () => {
                          const detailedIssue = await storesService.getDepartmentIssue(i.id);
                          setSelectedViewItem(detailedIssue);
                        }}
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === i.id ? 'var(--bg-secondary)' : 'transparent' }}
                      >
                        <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{i.issue_no}</td>
                        <td>{i.issue_date ? new Date(i.issue_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td style={{ fontWeight: 600 }}>{i.requesting_department_name || '-'}</td>
                        <td>{i.issued_by_name || '-'}</td>
                        <td>{i.status}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleEdit(i)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={async () => {
                                const detailedIssue = await storesService.getDepartmentIssue(i.id);
                                setSelectedViewItem(detailedIssue);
                              }}
                              title="Preview"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(i.id, i.issue_no, e)}
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Cancel Issue"
                            >
                              <Trash2 size={16} color="var(--danger, #ef4444)" />
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
          </div>
        </>

        /* ══════════ FORM VIEW ══════════ */
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
              New Store Issue Entry
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
                Issue Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Department Selection *</label>
                        <MasterDropdown
                          label=""
                          name="requesting_department_id"
                          value={formData.requesting_department_id}
                          options={filteredDepts.map(dept => ({ ...dept, name: `${dept.department_name}${dept.department_code ? ` (${dept.department_code})` : ''}` }))}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Issued By *</label>
                        <MasterDropdown
                          label=""
                          name="issued_by_id"
                          value={formData.issued_by_id}
                          options={employees}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Received By</label>
                        <MasterDropdown
                          label=""
                          name="received_by_id"
                          value={formData.received_by_id}
                          options={employees}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>Purpose / Remarks</label>
                        <input
                          type="text"
                          value={formData.purpose}
                          onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                          placeholder=""
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                        Items to Issue
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddField}
                        disabled={itemsList.length === 0}
                        className="btn btn-secondary"
                        style={{ padding: '4px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                      {formData.items.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                          <Package size={36} style={{ color: 'var(--text-muted)' }} />
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>No items added yet. Click 'Add Item'.</p>
                        </div>
                      ) : (
                        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
                        <table className="data-table" style={{ width: '100%', marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 40 }}>#</th>
                              <th>Item</th>
                              <th style={{ textAlign: 'center', width: 100 }}>Available</th>
                              <th style={{ textAlign: 'center', width: 120 }}>Issue Qty</th>
                              <th style={{ width: 160 }}>Warehouse</th>
                              <th>Remarks</th>
                              <th style={{ width: 50, textAlign: 'center' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item, idx) => {
                              const dbItem = itemsList.find(x => x.id === parseInt(item.item_id));
                              const stockOk = !dbItem || dbItem.current_stock >= item.quantity_requested;
                              return (
                                <tr key={idx} style={{ background: stockOk ? 'transparent' : 'rgba(245, 158, 11, 0.05)' }}>
                                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                                  <td>
                                    <MasterDropdown
                                      label=""
                                      name="item_id"
                                      value={item.item_id}
                                      options={itemsList.map(i => ({ ...i, name: `${i.item_code} — ${i.item_name}` }))}
                                      required={true}
                                      onChange={(name, val) => handleItemChange(idx, val)}
                                    />
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {dbItem ? (
                                      <div style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '700', background: dbItem.current_stock > 0 ? '#ecfdf5' : '#fef2f2', color: dbItem.current_stock > 0 ? '#059669' : '#dc2626', display: 'inline-block' }}>
                                        {dbItem.current_stock}
                                      </div>
                                    ) : '-'}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <input
                                      type="number"
                                      min="1"
                                      max={dbItem?.current_stock || undefined}
                                      value={item.quantity_requested}
                                      onChange={e => handleQtyChange(idx, e.target.value)}
                                      required
                                      className="form-control"
                                      style={{ width: 100, margin: 0, borderColor: stockOk ? undefined : '#fca5a5' }}
                                    />
                                    {!stockOk && (
                                      <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Exceeds stock!</div>
                                    )}
                                  </td>
                                  <td>
                                    <MasterDropdown
                                      label=""
                                      name="warehouse_id"
                                      value={item.warehouse_id}
                                      options={warehouses.map(w => ({ ...w, name: w.warehouse_name }))}
                                      onChange={(name, val) => {
                                        const updated = [...formData.items];
                                        updated[idx].warehouse_id = val;
                                        setFormData({ ...formData, items: updated });
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      value={item.remarks}
                                      onChange={e => {
                                        const updated = [...formData.items];
                                        updated[idx].remarks = e.target.value;
                                        setFormData({ ...formData, items: updated });
                                      }}
                                      placeholder=""
                                      className="form-control"
                                      style={{ margin: 0 }}
                                    />
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveField(idx)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitLoading || !formData.requesting_department_id}>
                        Save
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
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
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Issue to Dept Preview</h3>
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
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>ISSUE TO DEPT</h2>
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
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@handloomerp.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.handloomerp.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                      <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>
              </div>
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
                    await storesService.deleteDepartmentIssue(id);
                    loadData();
                    if (typeof setSelectedViewItem === 'function' && selectedViewItem?.id === id) setSelectedViewItem(null);
                  } catch (err) {
                    alert("Error deleting issue. It may be in use.");
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

