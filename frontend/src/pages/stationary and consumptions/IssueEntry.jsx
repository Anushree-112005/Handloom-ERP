import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, FileText, CheckCircle,
  AlertCircle, Package, Users, Building2, Loader2, Save
} from 'lucide-react';

export default function IssueEntry() {
  const [view, setView]                     = useState('list');
  const [loading, setLoading]               = useState(false);
  const [deptLoading, setDeptLoading]       = useState(false);
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [deptError, setDeptError]           = useState('');
  const [issues, setIssues]                 = useState([]);
  const [itemsList, setItemsList]           = useState([]);
  const [departments, setDepartments]       = useState([]);
  const [employees, setEmployees]           = useState([]);
  const [warehouses, setWarehouses]         = useState([]);
  const [deptSearch, setDeptSearch]         = useState('');

  const [formData, setFormData] = useState({
    requesting_department_id: '',
    issued_by_id: '',
    received_by_id: '',
    purpose: '',
    items: []
  });

  const [searchTerm, setSearchTerm] = useState('');

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
      setItemsList(itms    || []);
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
    updated[index].quantity_issued    = parseFloat(qty) || 0;
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
        issued_by_id:  parseInt(formData.issued_by_id),
        received_by_id: formData.received_by_id ? parseInt(formData.received_by_id) : null,
        items: formData.items.map(item => ({
          item_id: parseInt(item.item_id),
          category_id: parseInt(item.category_id),
          uom_id: parseInt(item.uom_id),
          quantity_requested: item.quantity_requested,
          quantity_issued:    item.quantity_issued,
          warehouse_id: item.warehouse_id ? parseInt(item.warehouse_id) : null,
          remarks: item.remarks
        }))
      };
      await storesService.createDepartmentIssue(payload);
      alert('Stock issued successfully! Stock levels updated.');
      setView('list');
    } catch (err) {
      console.error(err);
      alert('Failed to execute stock issuance.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this issue record?')) return;
    try {
      await storesService.deleteDepartmentIssue(id);
      loadData();
    } catch (err) { console.error(err); }
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
    'Issued':    'bg-blue-50 text-blue-600',
    'Received':  'bg-emerald-50 text-emerald-600',
    'Cancelled': 'bg-red-50 text-red-500',
    'Pending':   'bg-amber-50 text-amber-600'
  };

  /* ══════════════════════════════════════════════ RENDER ══════════════════════════════════════════════ */
  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: "24px",
        background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        marginBottom: "24px"
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
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Issue to Department</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Issue consumable items from store to departments. Department list is loaded live from Department Master.</p>
          </div>
        </div>

        {view === 'list' ? (
          <button
            onClick={() => {
              setFormData({ requesting_department_id: '', issued_by_id: '', received_by_id: '', purpose: '', items: [] });
              setDeptSearch('');
              setView('form');
            }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            <Plus size={16} /> New Issue Entry
          </button>
        ) : (
          <button
            onClick={() => setView('list')}
            className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            Back to List
          </button>
        )}
      </div>

      {/* ══════════ LIST VIEW ══════════ */}
      {view === 'list' ? (
        <>
          {/* Stat cards */}
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ '--stat-color': s.color }}>
                <div className="stat-icon" style={{ background: `${s.color}1a`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-info">
                  <h3>{loading ? '—' : s.value}</h3>
                  <p>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div className="card overflow-hidden flex-1 flex flex-col mt-4">
            <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center gap-4 bg-slate-50/40">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search Issue No or Department..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
              <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 size={28} className="animate-spin text-blue-400" />
                  <span className="text-xs">Loading issue records…</span>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                  <FileText size={44} className="text-slate-200" />
                  <span className="text-sm font-semibold">No issues logged yet.</span>
                  <span className="text-xs text-slate-300">Click "New Issue Entry" to get started.</span>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">Issue No</th>
                      <th className="px-5 py-3">Issue Date</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Issued By</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredIssues.map(i => (
                      <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800 font-mono">{i.issue_no}</td>
                        <td className="px-5 py-3">{i.issue_date ? new Date(i.issue_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{i.requesting_department_name || '—'}</td>
                        <td className="px-5 py-3">{i.issued_by_name || '—'}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${statusColors[i.status] || 'bg-slate-100 text-slate-500'}`}>
                            {i.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => handleDelete(i.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Cancel Issue"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>

      /* ══════════ FORM VIEW ══════════ */
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
          
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'rgb(59, 130, 246)', borderRadius: '12px' }}>
                <Plus size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>New Store Issue Entry</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Record items issued to an employee or department</p>
              </div>
            </div>

            <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
              <legend style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Issue Details</legend>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Department Selection <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                    {deptLoading && <Loader2 size={14} className="animate-spin text-blue-500" />}
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>
                      {departments.length > 0 ? `${departments.length} active department(s) loaded` : ''}
                    </span>
                  </div>

                  {deptError ? (
                    <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{deptError}</span>
                    </div>
                  ) : departments.length === 0 && !deptLoading ? (
                    <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#b45309', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} />
                      No departments available. Add departments in the Department Master first.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Search within dropdown */}
                      {departments.length > 5 && (
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search department..."
                            value={deptSearch}
                            onChange={e => setDeptSearch(e.target.value)}
                            className="form-control"
                            style={{ paddingLeft: '32px' }}
                          />
                        </div>
                      )}

                      <select
                        value={formData.requesting_department_id}
                        onChange={e => setFormData({ ...formData, requesting_department_id: e.target.value })}
                        required
                        disabled={deptLoading || departments.length === 0}
                        className="form-control"
                      >
                        <option value="">
                          {deptLoading ? 'Loading departments…' : '— Select a Department —'}
                        </option>
                        {filteredDepts.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.department_name}
                            {dept.department_code ? ` (${dept.department_code})` : ''}
                          </option>
                        ))}
                      </select>

                      {formData.requesting_department_id && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                          <CheckCircle size={14} />
                          Selected: <span style={{ fontWeight: '700' }}>{selectedDeptName}</span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(ID: {formData.requesting_department_id})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Issued By <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.issued_by_id}
                    onChange={e => setFormData({ ...formData, issued_by_id: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Issuer</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Received By</label>
                  <select
                    value={formData.received_by_id}
                    onChange={e => setFormData({ ...formData, received_by_id: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Receiver (optional)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Purpose / Remarks</label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Reason for issue..."
                    className="form-control"
                  />
                </div>
              </div>
            </fieldset>
          </div>

          {/* ── Line Items ── */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} style={{ color: 'var(--primary)' }} /> Items to Issue
              </h4>
              <button
                type="button"
                onClick={handleAddField}
                disabled={itemsList.length === 0}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            <div style={{ padding: '16px' }}>
              {formData.items.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Package size={36} style={{ color: 'var(--border)' }} />
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>No items added yet. Click 'Add Item'.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {formData.items.map((item, idx) => {
                  const dbItem = itemsList.find(x => x.id === parseInt(item.item_id));
                  const stockOk = !dbItem || dbItem.current_stock >= item.quantity_issued;
                  return (
                    <div
                      key={idx}
                      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '16px', padding: '16px', borderRadius: '12px', border: stockOk ? '1px solid var(--border)' : '1px solid #fecaca', background: stockOk ? 'var(--bg-secondary)' : '#fef2f2' }}
                    >
                      {/* Item selector */}
                      <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Item</label>
                        <select
                          value={item.item_id}
                          onChange={e => handleItemChange(idx, e.target.value)}
                          required
                          className="form-control"
                        >
                          <option value="">Select Item</option>
                          {itemsList.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.item_code} — {i.item_name} (Stock: {i.current_stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Available stock badge */}
                      {dbItem && (
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Available</label>
                          <div style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: dbItem.current_stock > 0 ? '#ecfdf5' : '#fef2f2', color: dbItem.current_stock > 0 ? '#059669' : '#dc2626' }}>
                            {dbItem.current_stock}
                          </div>
                        </div>
                      )}

                      {/* Qty */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Issue Qty</label>
                        <input
                          type="number"
                          min="1"
                          max={dbItem?.current_stock || undefined}
                          value={item.quantity_requested}
                          onChange={e => handleQtyChange(idx, e.target.value)}
                          required
                          className="form-control"
                          style={{ width: '100px', borderColor: stockOk ? '' : '#fca5a5' }}
                        />
                        {!stockOk && (
                          <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: '600' }}>Exceeds stock!</p>
                        )}
                      </div>

                      {/* Warehouse */}
                      <div style={{ width: '160px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Warehouse</label>
                        <select
                          value={item.warehouse_id}
                          onChange={e => {
                            const updated = [...formData.items];
                            updated[idx].warehouse_id = e.target.value;
                            setFormData({ ...formData, items: updated });
                          }}
                          className="form-control"
                        >
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.warehouse_name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Remarks */}
                      <div style={{ flex: '1', minWidth: '120px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Remarks</label>
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={e => {
                            const updated = [...formData.items];
                            updated[idx].remarks = e.target.value;
                            setFormData({ ...formData, items: updated });
                          }}
                          placeholder="Machine / reason..."
                          className="form-control"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '28px' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(idx)}
                          className="btn btn-secondary"
                          style={{ padding: '8px', color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setView('list')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || !formData.requesting_department_id}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {submitLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Saving…</>
              ) : (
                <><Save size={16} /> Confirm Issue</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
