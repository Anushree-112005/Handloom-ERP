import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Package, RotateCcw, Users, ArrowDownLeft, Save, X, ArrowLeft
} from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

const conditionColors = {
  'Good': 'bg-emerald-50 text-emerald-600',
  'Damaged': 'bg-red-50 text-red-500',
  'Partial': 'bg-amber-50 text-amber-600',
};

const statusColors = {
  'Received': 'bg-emerald-50 text-emerald-600',
  'Pending': 'bg-amber-50 text-amber-600',
  'Cancelled': 'bg-slate-100 text-slate-500',
};

export default function ReturnEntry() {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    issue_id: '', returned_by_id: '', received_by_id: '', items: []
  });

  const showToast = (msg, ok = true) => {
    if (!ok) alert(msg);
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
      setItemsList(itms || []);
      setIssuesList(iss || []);
      setEmployees(emps || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
      loadData();
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
    {
      label: 'Total Returns', value: returns.length,
      icon: <RotateCcw size={24} />, color: '#f97316'
    },
    {
      label: 'Good Condition', value: returns.filter(r => r.status === 'Received').length,
      icon: <CheckCircle size={24} />, color: '#10b981'
    },
    {
      label: 'Dept. Issues', value: issuesList.length,
      icon: <Package size={24} />, color: '#3b82f6'
    },
    {
      label: 'Employees', value: employees.length,
      icon: <Users size={24} />, color: '#8b5cf6'
    },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-orange-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Header */}
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
              <RotateCcw size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Return to Store</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Deposit unused, excess or damaged material back to main stores.</p>
            </div>
          </div>
          <button onClick={() => { setFormData({ issue_id: '', returned_by_id: '', received_by_id: '', items: [] }); setView('form'); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New Return Entry
          </button>
        </div>
      )}

      {view === 'list' ? (
        <>
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
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Return No</th>
                    <th>Return Date</th>
                    <th>Returned By</th>
                    <th>Received By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                  ) : filteredReturns.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No returns logged yet.</td></tr>
                  ) : (
                    filteredReturns.map(r => (
                      <tr key={r.id}>
                        <td>{r.return_no}</td>
                        <td>{r.return_date ? new Date(r.return_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td>{r.returned_by_name || '-'}</td>
                        <td>{r.received_by_name || '-'}</td>
                        <td>
                          <span className={`status-badge ${r.status?.toLowerCase().replace(' ', '-') || 'received'}`}>
                            {r.status || 'Received'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDelete(r.id)} className="icon-btn delete-btn">
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
              New Return to Store Entry
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
                Return Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Link Issue Reference (optional)</label>
                        <MasterDropdown
                          label=""
                          name="issue_id"
                          value={formData.issue_id}
                          options={issuesList.map(iss => ({ ...iss, name: `${iss.issue_no} — ${iss.requesting_department_name || 'Unknown'}`, id: iss.id.toString() }))}
                          onChange={(name, val) => handleIssueChange(val)}
                        />
                        {linkedIssue && (
                          <p style={{ marginTop: '8px', fontSize: '12px', color: '#ea580c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> {linkedIssue.items?.length || 0} item(s) from issue
                          </p>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Returned By *</label>
                        <MasterDropdown
                          label=""
                          name="returned_by_id"
                          value={formData.returned_by_id}
                          options={employees}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Received By Storekeeper</label>
                        <MasterDropdown
                          label=""
                          name="received_by_id"
                          value={formData.received_by_id}
                          options={employees}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                    </div>

                    {formData.items.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                          <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                            Items Being Returned
                          </h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formData.items.length} item(s)</span>
                        </div>
                        <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                          <table className="data-table" style={{ width: '100%', marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th>Item</th>
                                <th style={{ textAlign: 'center', width: 140 }}>Qty to Return</th>
                                <th style={{ width: 160 }}>Condition</th>
                                <th>Reason</th>
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
                                      <input type="number" min="0" value={item.quantity_returned}
                                        onChange={e => setItemField(idx, 'quantity_returned', parseFloat(e.target.value) || 0)}
                                        className="form-control" style={{ width: 100, margin: 0, display: 'inline-block' }} />
                                    </td>
                                    <td>
                                      <MasterDropdown
                                        label=""
                                        name="condition"
                                        value={item.condition}
                                        options={[
                                          { id: 'Good', name: 'Good (Restockable)' },
                                          { id: 'Damaged', name: 'Damaged' },
                                          { id: 'Partial', name: 'Partial' }
                                        ]}
                                        onChange={(name, val) => setItemField(idx, name, val)}
                                      />
                                    </td>
                                    <td>
                                      <input type="text" value={item.reason} onChange={e => setItemField(idx, 'reason', e.target.value)}
                                        placeholder=""
                                        className="form-control" style={{ margin: 0 }} />
                                    </td>
                                    <td>
                                      <input type="text" value={item.remarks} onChange={e => setItemField(idx, 'remarks', e.target.value)}
                                        placeholder=""
                                        className="form-control" style={{ margin: 0 }} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: 'rgba(249, 115, 22, 0.05)', borderTop: '2px solid rgba(249, 115, 22, 0.2)' }}>
                                <td colSpan={2} style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', padding: '12px 16px' }}>Total Qty Returned</td>
                                <td style={{ textAlign: 'center', fontWeight: 800, color: '#c2410c', padding: '12px 16px' }}>{formData.items.reduce((s, i) => s + (i.quantity_returned || 0), 0)} units</td>
                                <td colSpan={3} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '1px dashed var(--border)', borderRadius: 12, marginTop: 24, background: 'var(--bg-secondary)' }}>
                        <RotateCcw size={36} style={{ color: 'var(--text-muted)' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Select an issue reference above to auto-fill items, or they will be added manually.</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitLoading || !formData.returned_by_id}>
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
