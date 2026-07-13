import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Package, RotateCcw, Users, ArrowDownLeft, Save
} from 'lucide-react';

const conditionColors = {
  'Good':    'bg-emerald-50 text-emerald-600',
  'Damaged': 'bg-red-50 text-red-500',
  'Partial': 'bg-amber-50 text-amber-600',
};

const statusColors = {
  'Received':  'bg-emerald-50 text-emerald-600',
  'Pending':   'bg-amber-50 text-amber-600',
  'Cancelled': 'bg-slate-100 text-slate-500',
};

export default function ReturnEntry() {
  const [view, setView]               = useState('list');
  const [loading, setLoading]         = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [returns, setReturns]         = useState([]);
  const [itemsList, setItemsList]     = useState([]);
  const [issuesList, setIssuesList]   = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [toast, setToast]             = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    issue_id: '', returned_by_id: '', received_by_id: '', items: []
  });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: '', ok: true }), 3500);
  };

  useEffect(() => { loadData(); }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [returnData, itms, iss, emps] = await Promise.all([
        storesService.getReturnsToStore(),
        storesService.getItems(),
        storesService.getDepartmentIssues(),
        storesService.getEmployees()
      ]);
      setReturns(returnData || []);
      setItemsList(itms    || []);
      setIssuesList(iss   || []);
      setEmployees(emps   || []);
    } catch (err) { console.error(err); }
    finally       { setLoading(false); }
  };

  const handleIssueChange = (issueId) => {
    const sel = issuesList.find(i => i.id === parseInt(issueId));
    if (sel) {
      setFormData(prev => ({
        ...prev,
        issue_id: issueId,
        items: sel.items.map(i => ({
          item_id: i.item_id, category_id: i.category_id, uom_id: i.uom_id,
          quantity_returned: i.quantity_issued,
          reason: 'Excess Stock', condition: 'Good', remarks: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.returned_by_id) {
      showToast('Please select who is returning the items.', false); return;
    }
    if (formData.items.length === 0) {
      showToast('Return entry must contain at least one item.', false); return;
    }
    setSubmitLoading(true);
    try {
      await storesService.createReturnToStore({
        issue_id: formData.issue_id ? parseInt(formData.issue_id) : null,
        returned_by_id: parseInt(formData.returned_by_id),
        received_by_id: formData.received_by_id ? parseInt(formData.received_by_id) : null,
        items: formData.items.map(i => ({
          item_id: parseInt(i.item_id), category_id: parseInt(i.category_id), uom_id: parseInt(i.uom_id),
          quantity_returned: i.quantity_returned, reason: i.reason, condition: i.condition, remarks: i.remarks
        }))
      });
      showToast('Return recorded! Stock levels updated.');
      setView('list');
    } catch (err) { console.error(err); showToast('Failed to log return.', false); }
    finally { setSubmitLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this return record?')) return;
    try { await storesService.deleteReturnToStore(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const filteredReturns = returns.filter(r =>
    r.return_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.returned_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkedIssue = issuesList.find(i => i.id === parseInt(formData.issue_id));

  const stats = [
    { label: 'Total Returns',     value: returns.length,
      icon: <RotateCcw size={24} />,   color: '#f97316' },
    { label: 'Good Condition',    value: returns.filter(r => r.status === 'Received').length,
      icon: <CheckCircle size={24} />, color: '#10b981' },
    { label: 'Dept. Issues',       value: issuesList.length,
      icon: <Package size={24} />,     color: '#3b82f6' },
    { label: 'Employees',          value: employees.length,
      icon: <Users size={24} />,       color: '#8b5cf6' },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Header */}
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
            <RotateCcw size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Return to Store</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Deposit unused, excess or damaged material back to main stores.</p>
          </div>
        </div>
        {view === 'list' ? (
          <button onClick={() => { setFormData({ issue_id: '', returned_by_id: '', received_by_id: '', items: [] }); setView('form'); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New Return Entry
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            ← Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <>
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

          <div className="card overflow-hidden flex-1 flex flex-col mt-4">
            <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center gap-4 bg-slate-50/40">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" placeholder="Search Return No or Employee…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-control" style={{ paddingLeft: '36px' }} />
              </div>
              <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2"><RefreshCw size={16} /></button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-orange-400" />
                  <span className="text-xs">Loading return records…</span>
                </div>
              ) : filteredReturns.length === 0 ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <div className="p-5 bg-orange-50 rounded-2xl"><RotateCcw size={38} className="text-orange-300" /></div>
                  <span className="text-sm font-bold text-slate-600">No returns logged yet.</span>
                  <span className="text-xs text-slate-400">Click "New Return Entry" to record materials returned to store.</span>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">Return No</th>
                      <th className="px-5 py-3">Return Date</th>
                      <th className="px-5 py-3">Returned By</th>
                      <th className="px-5 py-3">Received By</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredReturns.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800 font-mono">{r.return_no}</td>
                        <td className="px-5 py-3">{r.return_date ? new Date(r.return_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{r.returned_by_name || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{r.received_by_name || '—'}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${statusColors[r.status] || 'bg-slate-100 text-slate-500'}`}>{r.status || 'Received'}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div style={{ padding: '12px', background: 'rgba(249, 115, 22, 0.1)', color: 'rgb(249, 115, 22)', borderRadius: '12px' }}>
                <ArrowDownLeft size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>New Return to Store Entry</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Record materials being returned from a department back to the main store.</p>
              </div>
            </div>

            <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
              <legend style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Return Details</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Link Issue Reference <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(optional)</span>
                  </label>
                  <select value={formData.issue_id} onChange={e => handleIssueChange(e.target.value)}
                    className="form-control">
                    <option value="">Select Issue (auto-fills items)</option>
                    {issuesList.map(iss => <option key={iss.id} value={iss.id}>{iss.issue_no} — {iss.requesting_department_name || 'Unknown'}</option>)}
                  </select>
                  {linkedIssue && (
                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#ea580c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> {linkedIssue.items?.length || 0} item(s) from issue
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Returned By <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select value={formData.returned_by_id} onChange={e => setFormData({ ...formData, returned_by_id: e.target.value })} required
                    className="form-control">
                    <option value="">Select Employee</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Received By Storekeeper</label>
                  <select value={formData.received_by_id} onChange={e => setFormData({ ...formData, received_by_id: e.target.value })}
                    className="form-control">
                    <option value="">Select Receiver (optional)</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>
          </div>

          {formData.items.length > 0 ? (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} style={{ color: 'var(--primary)' }} /> Items Being Returned
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formData.items.length} item(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Qty to Return</th>
                      <th className="px-5 py-3">Condition</th>
                      <th className="px-5 py-3">Reason</th>
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
                            <input type="number" min="0" value={item.quantity_returned}
                              onChange={e => setItemField(idx, 'quantity_returned', parseFloat(e.target.value) || 0)}
                              className="form-control" style={{ width: '100px' }} />
                          </td>
                          <td className="px-5 py-3">
                            <select value={item.condition} onChange={e => setItemField(idx, 'condition', e.target.value)}
                              className="form-control" style={{ minWidth: '140px' }}>
                              <option value="Good">Good (Restockable)</option>
                              <option value="Damaged">Damaged</option>
                              <option value="Partial">Partial</option>
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <input type="text" value={item.reason} onChange={e => setItemField(idx, 'reason', e.target.value)}
                              placeholder="Excess Stock"
                              className="form-control" style={{ minWidth: '120px' }} />
                          </td>
                          <td className="px-5 py-3">
                            <input type="text" value={item.remarks} onChange={e => setItemField(idx, 'remarks', e.target.value)}
                              placeholder="Notes…"
                              className="form-control" style={{ minWidth: '120px' }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-orange-50/60 border-t-2 border-orange-100">
                      <td colSpan={2} className="px-5 py-2.5 text-xs font-bold text-orange-700">Total Qty Returned</td>
                      <td className="px-5 py-2.5 font-extrabold text-orange-700">{formData.items.reduce((s, i) => s + (i.quantity_returned || 0), 0)} units</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <RotateCcw size={36} style={{ color: 'var(--border)' }} />
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Select an issue reference above to auto-fill items, or they will be added manually.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitLoading || !formData.returned_by_id}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {submitLoading ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Submit Return</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
