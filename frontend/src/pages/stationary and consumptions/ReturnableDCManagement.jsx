import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, FileText, CheckCircle,
  AlertCircle, Loader2, CalendarClock, Building2, Users,
  ClipboardList, ArrowLeftRight, Clock, Package, Tag, Save
} from 'lucide-react';

/* ── status colour mapping ── */
const statusColor = {
  'Active':    'bg-blue-50 text-blue-600',
  'Overdue':   'bg-red-50 text-red-600',
  'Returned':  'bg-emerald-50 text-emerald-600',
  'Cancelled': 'bg-slate-100 text-slate-500',
};

/* ── how many days until return date ── */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
  return diff;
}

export default function ReturnableDCManagement() {
  const [view, setView]               = useState('list');
  const [loading, setLoading]         = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dcs, setDcs]                 = useState([]);
  const [issuesList, setIssuesList]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [itemsList, setItemsList]     = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [toast, setToast]             = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    issue_id: '',
    expected_return_date: '',
    issued_to_department_id: '',
    issued_by_id: '',
    items: []
  });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: '', ok: true }), 3500);
  };

  /* ─── load ─── */
  useEffect(() => { loadData(); }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dcData, issues, depts, emps, itms] = await Promise.all([
        storesService.getReturnableDCs(),
        storesService.getDepartmentIssues(),
        storesService.getDepartments(),
        storesService.getEmployees(),
        storesService.getItems()
      ]);
      setDcs(dcData        || []);
      setIssuesList(issues || []);
      setDepartments(depts || []);
      setEmployees(emps    || []);
      setItemsList(itms    || []);
    } catch (err) { console.error(err); }
    finally       { setLoading(false); }
  };

  /* ─── link issue → auto-fill ─── */
  const handleIssueChange = (issueId) => {
    const sel = issuesList.find(i => i.id === parseInt(issueId));
    if (sel) {
      setFormData(prev => ({
        ...prev,
        issue_id: issueId,
        issued_to_department_id: sel.requesting_department_id || prev.issued_to_department_id,
        items: sel.items.map(i => ({
          item_id: i.item_id,
          category_id: i.category_id,
          uom_id: i.uom_id,
          quantity: i.quantity_issued,
          serial_batch_no: '',
          return_terms: 'Returnable in 7 Days',
          remarks: ''
        }))
      }));
    } else {
      setFormData(prev => ({ ...prev, issue_id: issueId, items: [] }));
    }
  };

  const setItemField = (idx, field, val) => {
    const updated = [...formData.items];
    updated[idx][field] = val;
    setFormData({ ...formData, items: updated });
  };

  /* ─── submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.expected_return_date || !formData.issued_to_department_id || !formData.issued_by_id) {
      showToast('Please fill all required fields.', false);
      return;
    }
    if (formData.items.length === 0) {
      showToast('Add at least one item to the Returnable DC.', false);
      return;
    }
    setSubmitLoading(true);
    try {
      await storesService.createReturnableDC({
        issue_id: formData.issue_id ? parseInt(formData.issue_id) : null,
        expected_return_date: new Date(formData.expected_return_date).toISOString(),
        issued_to_department_id: parseInt(formData.issued_to_department_id),
        issued_by_id: parseInt(formData.issued_by_id),
        items: formData.items.map(item => ({
          item_id:        parseInt(item.item_id),
          category_id:    parseInt(item.category_id),
          uom_id:         parseInt(item.uom_id),
          quantity:       item.quantity,
          serial_batch_no: item.serial_batch_no,
          return_terms:   item.return_terms,
          remarks:        item.remarks
        }))
      });
      showToast('Returnable DC created successfully!');
      setView('list');
    } catch (err) {
      console.error(err);
      showToast('Failed to create Returnable DC.', false);
    } finally { setSubmitLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this Returnable DC record?')) return;
    try { await storesService.deleteReturnableDC(id); loadData(); }
    catch (err) { console.error(err); }
  };

  /* ─── derived ─── */
  const filteredDcs = dcs.filter(dc =>
    dc.dc_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dc.issued_to_department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkedIssue   = issuesList.find(i => i.id === parseInt(formData.issue_id));
  const selectedDept  = departments.find(d => d.id === parseInt(formData.issued_to_department_id));
  const overdueCount  = dcs.filter(dc => {
    const d = daysUntil(dc.expected_return_date);
    return d !== null && d < 0 && dc.status !== 'Returned' && dc.status !== 'Cancelled';
  }).length;

  const stats = [
    { label: 'Total Challans',    value: dcs.length,
      icon: <ClipboardList size={24} />, color: '#0d9488' },
    { label: 'Active / Open',     value: dcs.filter(d => d.status === 'Active').length,
      icon: <ArrowLeftRight size={24} />, color: '#3b82f6' },
    { label: 'Overdue Returns',   value: overdueCount,
      icon: <CalendarClock size={24} />, color: '#ef4444' },
    { label: 'Returned / Closed', value: dcs.filter(d => d.status === 'Returned').length,
      icon: <CheckCircle size={24} />, color: '#10b981' },
  ];

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
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
            <ArrowLeftRight size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Returnable Delivery Challan (DC)</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Track returnable assets, tools, or materials dispatched to departments with an expected return date.</p>
          </div>
        </div>

        {view === 'list' ? (
          <button
            onClick={() => {
              setFormData({ issue_id: '', expected_return_date: '', issued_to_department_id: '', issued_by_id: '', items: [] });
              setView('form');
            }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            <Plus size={16} /> New Returnable DC
          </button>
        ) : (
          <button
            onClick={() => setView('list')}
            className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            ← Back to List
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
            {/* Toolbar */}
            <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center gap-4 bg-slate-50/40">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search DC No or Department…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-control" style={{ paddingLeft: '36px' }}
                />
              </div>
              <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2">
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-teal-400" />
                  <span className="text-xs">Loading challans…</span>
                </div>
              ) : filteredDcs.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="p-5 bg-teal-50 rounded-2xl">
                    <ArrowLeftRight size={38} className="text-teal-300" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">No Returnable DC records logged yet.</span>
                  <span className="text-xs text-slate-400">Click "New Returnable DC" to create the first challan.</span>
                  <button
                    onClick={() => {
                      setFormData({ issue_id: '', expected_return_date: '', issued_to_department_id: '', issued_by_id: '', items: [] });
                      setView('form');
                    }}
                    className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', marginTop: '8px' }}
                  >
                    <Plus size={16} /> New Returnable DC
                  </button>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">DC Number</th>
                      <th className="px-5 py-3">Issued To</th>
                      <th className="px-5 py-3">Issued By</th>
                      <th className="px-5 py-3">Expected Return</th>
                      <th className="px-5 py-3 text-center">Due In</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredDcs.map(dc => {
                      const days   = daysUntil(dc.expected_return_date);
                      const isOver = days !== null && days < 0 && dc.status !== 'Returned';
                      return (
                        <tr key={dc.id} className={`hover:bg-slate-50/60 transition-colors ${isOver ? 'bg-red-50/30' : ''}`}>
                          <td className="px-5 py-3 font-bold text-slate-800 font-mono">{dc.dc_no}</td>
                          <td className="px-5 py-3 font-semibold text-slate-700">{dc.issued_to_department_name || '—'}</td>
                          <td className="px-5 py-3 text-slate-500">{dc.issued_by_name || '—'}</td>
                          <td className="px-5 py-3 font-semibold">
                            {dc.expected_return_date ? new Date(dc.expected_return_date).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {days !== null && dc.status !== 'Returned' ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                isOver ? 'bg-red-100 text-red-600' :
                                days <= 3 ? 'bg-amber-50 text-amber-600' :
                                'bg-teal-50 text-teal-600'
                              }`}>
                                {isOver ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full font-bold text-xs ${statusColor[dc.status] || 'bg-slate-100 text-slate-500'}`}>
                              {dc.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => handleDelete(dc.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              title="Cancel DC"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>

      /* ══════════ FORM VIEW ══════════ */
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">

          {/* Form card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Form header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div style={{ padding: '12px', background: 'rgba(13, 148, 136, 0.1)', color: 'rgb(13, 148, 136)', borderRadius: '12px' }}>
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>New Returnable Delivery Challan</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Issue returnable assets with a mandatory return-by date.</p>
              </div>
            </div>

            <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
              <legend style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Challan Details</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

                {/* Link Issue (optional — auto-fill items) */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Link Dept. Issue <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(optional)</span>
                  </label>
                  <select
                    value={formData.issue_id}
                    onChange={e => handleIssueChange(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select Issue Reference</option>
                    {issuesList.map(iss => (
                      <option key={iss.id} value={iss.id}>
                        {iss.issue_no} — {iss.requesting_department_name || 'Unknown Dept'}
                      </option>
                    ))}
                  </select>
                  {linkedIssue && (
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#0d9488', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} />
                      {linkedIssue.items?.length || 0} item(s) loaded from issue
                    </p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Issued To Department <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.issued_to_department_id}
                    onChange={e => setFormData({ ...formData, issued_to_department_id: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.department_name}</option>
                    ))}
                  </select>
                  {selectedDept && (
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#0d9488', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> {selectedDept.department_name}
                    </p>
                  )}
                </div>

                {/* Issued By */}
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
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* ── Expected Return Date (highlighted) ── */}
            <div style={{ padding: '16px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <CalendarClock size={20} style={{ color: '#d97706' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#b45309', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Expected Return Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={e => setFormData({ ...formData, expected_return_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="form-control" style={{ maxWidth: '300px', backgroundColor: 'white' }}
                />
                {formData.expected_return_date && (
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#d97706', fontWeight: '600' }}>
                    ⏰ Assets must be returned by {new Date(formData.expected_return_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {' · '}
                    <span style={{ color: daysUntil(formData.expected_return_date) <= 3 ? '#ef4444' : 'inherit' }}>
                      {daysUntil(formData.expected_return_date)} day(s) from today
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          {formData.items.length > 0 ? (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} style={{ color: 'var(--primary)' }} /> Returnable Items
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formData.items.length} item(s) — all must be returned</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Qty Dispatched</th>
                      <th className="px-5 py-3">Serial / Batch No</th>
                      <th className="px-5 py-3">Return Terms</th>
                      <th className="px-5 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {formData.items.map((item, idx) => {
                      const obj = itemsList.find(i => i.id === item.item_id);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">{obj?.item_name || `Item #${item.item_id}`}</p>
                            {obj?.item_code && <p className="text-xs text-slate-400 font-mono">{obj.item_code}</p>}
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number" min="0" value={item.quantity}
                              onChange={e => setItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="form-control" style={{ width: '100px' }}
                            />
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="text" value={item.serial_batch_no}
                              onChange={e => setItemField(idx, 'serial_batch_no', e.target.value)}
                              placeholder="Batch #2026A"
                              className="form-control" style={{ minWidth: '140px' }}
                            />
                          </td>
                          <td className="px-5 py-3">
                            <select
                              value={item.return_terms}
                              onChange={e => setItemField(idx, 'return_terms', e.target.value)}
                              className="form-control" style={{ minWidth: '160px' }}
                            >
                              {['Returnable in 7 Days', 'Returnable in 15 Days', 'Returnable in 30 Days', 'Return on Demand', 'Permanent Transfer'].map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="text" value={item.remarks}
                              onChange={e => setItemField(idx, 'remarks', e.target.value)}
                              placeholder="Notes…"
                              className="form-control" style={{ minWidth: '140px' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-teal-50/60 border-t-2 border-teal-100">
                      <td colSpan={2} className="px-5 py-2.5 text-xs font-bold text-teal-700">
                        Total items dispatched on returnable basis
                      </td>
                      <td className="px-5 py-2.5 text-xs font-extrabold text-teal-700">
                        {formData.items.reduce((s, i) => s + (i.quantity || 0), 0)} units
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Tag size={36} style={{ color: 'var(--border)' }} />
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
                {formData.issue_id
                  ? 'No items found in selected issue.'
                  : 'Select a Department Issue above to auto-populate returnable items.'}
              </p>
            </div>
          )}

          {/* ── Footer buttons ── */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setView('list')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || formData.items.length === 0}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {submitLoading
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : <><Save size={16} /> Submit Challan</>
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
