import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, FileText, CheckCircle,
  AlertCircle, Loader2, CalendarClock, Building2, Users,
  ClipboardList, ArrowLeftRight, Clock, Package, Tag, Save, X, ArrowLeft
} from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

/* ── status colour mapping ── */
const statusColor = {
  'Active': 'bg-blue-50 text-blue-600',
  'Overdue': 'bg-red-50 text-red-600',
  'Returned': 'bg-emerald-50 text-emerald-600',
  'Cancelled': 'bg-slate-100 text-slate-500',
};

/* ── how many days until return date ── */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
  return diff;
}

export default function ReturnableDCManagement() {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dcs, setDcs] = useState([]);
  const [issuesList, setIssuesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });

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
      setDcs(dcData || []);
      setIssuesList(issues || []);
      setDepartments(depts || []);
      setEmployees(emps || []);
      setItemsList(itms || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
          item_id: parseInt(item.item_id),
          category_id: parseInt(item.category_id),
          uom_id: parseInt(item.uom_id),
          quantity: item.quantity,
          serial_batch_no: item.serial_batch_no,
          return_terms: item.return_terms,
          remarks: item.remarks
        }))
      });
      showToast('Returnable DC created successfully!');
      setView('list');
      loadData();
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

  const linkedIssue = issuesList.find(i => i.id === parseInt(formData.issue_id));
  const selectedDept = departments.find(d => d.id === parseInt(formData.issued_to_department_id));
  const overdueCount = dcs.filter(dc => {
    const d = daysUntil(dc.expected_return_date);
    return d !== null && d < 0 && dc.status !== 'Returned' && dc.status !== 'Cancelled';
  }).length;

  const stats = [
    {
      label: 'Total Challans', value: dcs.length,
      icon: <ClipboardList size={24} />, color: '#0d9488'
    },
    {
      label: 'Active / Open', value: dcs.filter(d => d.status === 'Active').length,
      icon: <ArrowLeftRight size={24} />, color: '#3b82f6'
    },
    {
      label: 'Overdue Returns', value: overdueCount,
      icon: <CalendarClock size={24} />, color: '#ef4444'
    },
    {
      label: 'Returned / Closed', value: dcs.filter(d => d.status === 'Returned').length,
      icon: <CheckCircle size={24} />, color: '#10b981'
    },
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
      {/* ── Page Header ── */}
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
              <ArrowLeftRight size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Returnable Delivery Challan (DC)</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Track returnable assets, tools, or materials dispatched to departments with an expected return date.</p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormData({ issue_id: '', expected_return_date: '', issued_to_department_id: '', issued_by_id: '', items: [] });
              setView('form');
            }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            <Plus size={16} /> New Returnable DC
          </button>
        </div>
      )}

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
                      const days = daysUntil(dc.expected_return_date);
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
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOver ? 'bg-red-100 text-red-600' :
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
              New Returnable Delivery Challan
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
                Challan Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Link Dept. Issue (optional)</label>
                        <MasterDropdown
                          label=""
                          name="issue_id"
                          value={formData.issue_id}
                          options={issuesList.map(iss => ({...iss, name: `${iss.issue_no} — ${iss.requesting_department_name || 'Unknown Dept'}`, id: iss.id.toString()}))}
                          onChange={(name, val) => handleIssueChange(val)}
                        />
                        {linkedIssue && (
                          <p style={{ marginTop: '8px', fontSize: '12px', color: '#0d9488', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} />
                            {linkedIssue.items?.length || 0} item(s) loaded from issue
                          </p>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Issued To Department *</label>
                        <MasterDropdown
                          label=""
                          name="issued_to_department_id"
                          value={formData.issued_to_department_id}
                          options={departments.map(d => ({...d, name: d.department_name}))}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                        {selectedDept && (
                          <p style={{ marginTop: '8px', fontSize: '12px', color: '#0d9488', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> {selectedDept.department_name}
                          </p>
                        )}
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
                        <label>Expected Return Date *</label>
                        <input
                          type="date"
                          value={formData.expected_return_date}
                          onChange={e => setFormData({ ...formData, expected_return_date: e.target.value })}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className="form-control" 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                        Returnable Items
                      </h4>
                    </div>

                    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                      {formData.items.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                          <Tag size={36} style={{ color: 'var(--text-muted)' }} />
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                            {formData.issue_id
                              ? 'No items found in selected issue.'
                              : 'Select a Department Issue above to auto-populate returnable items, or manually add items.'}
                          </p>
                        </div>
                      ) : (
                        <table className="data-table" style={{ width: '100%', marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 40 }}>#</th>
                              <th>Item</th>
                              <th style={{ textAlign: 'center', width: 140 }}>Qty Dispatched</th>
                              <th style={{ width: 160 }}>Serial / Batch No</th>
                              <th style={{ width: 180 }}>Return Terms</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item, idx) => {
                              const obj = itemsList.find(i => i.id === item.item_id);
                              return (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                                  <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{obj?.item_name || `Item #${item.item_id}`}</div>
                                    {obj?.item_code && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{obj.item_code}</div>}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <input
                                      type="number" min="0" value={item.quantity}
                                      onChange={e => setItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="form-control" style={{ width: 100, margin: 0, display: 'inline-block' }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text" value={item.serial_batch_no}
                                      onChange={e => setItemField(idx, 'serial_batch_no', e.target.value)}
                                      placeholder=""
                                      className="form-control" style={{ margin: 0 }}
                                    />
                                  </td>
                                  <td>
                                      <MasterDropdown
                                        label=""
                                        name="return_terms"
                                        value={item.return_terms}
                                        options={['Returnable in 7 Days', 'Returnable in 15 Days', 'Returnable in 30 Days', 'Return on Demand', 'Permanent Transfer'].map(t => ({ id: t, name: t }))}
                                        onChange={(name, val) => setItemField(idx, name, val)}
                                      />
                                  </td>
                                  <td>
                                    <input
                                      type="text" value={item.remarks}
                                      onChange={e => setItemField(idx, 'remarks', e.target.value)}
                                      placeholder=""
                                      className="form-control" style={{ margin: 0 }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'rgba(20, 184, 166, 0.05)', borderTop: '2px solid rgba(20, 184, 166, 0.2)' }}>
                              <td colSpan={2} style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', padding: '12px 16px' }}>
                                Total items dispatched on returnable basis
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f766e', padding: '12px 16px' }}>
                                {formData.items.reduce((s, i) => s + (i.quantity || 0), 0)} units
                              </td>
                              <td colSpan={4} />
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitLoading || formData.items.length === 0}>
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
