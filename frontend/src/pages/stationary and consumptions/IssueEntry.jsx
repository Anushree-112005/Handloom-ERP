import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, FileText, CheckCircle,
  AlertCircle, Package, Users, Building2, Loader2, Save, X, ArrowLeft
} from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

export default function IssueEntry() {
  const [view, setView] = useState('list');
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
      await storesService.createDepartmentIssue(payload);
      alert('Stock issued successfully! Stock levels updated.');
      setView('list');
      await loadData();
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

          <button
            onClick={() => {
              setFormData({ requesting_department_id: '', issued_by_id: '', received_by_id: '', purpose: '', items: [] });
              setDeptSearch('');
              setView('form');
            }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            <Plus size={16} /> New Issue
          </button>
        </div>
      )}
      {/* ══════════ LIST VIEW ══════════ */}
      {view === 'list' ? (
        <>
          {/* Stat cards */}
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
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
                      <tr key={i.id}>
                        <td>{i.issue_no}</td>
                        <td>{i.issue_date ? new Date(i.issue_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td>{i.requesting_department_name || '-'}</td>
                        <td>{i.issued_by_name || '-'}</td>
                        <td>{i.status}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(i.id)}
                            className="icon-btn delete-btn"
                            title="Cancel Issue"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
    </div>
  );
}
