import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Package, BarChart3, TrendingDown, TrendingUp, ShieldAlert, Save, X, ArrowLeft
} from 'lucide-react';

const NEGATIVE_TYPES = ['Damage', 'Expired', 'Lost', 'Breakage'];

const typeColors = {
  'Damage': 'bg-red-50 text-red-600',
  'Expired': 'bg-rose-50 text-rose-600',
  'Lost': 'bg-red-50 text-red-500',
  'Breakage': 'bg-orange-50 text-orange-600',
  'Surplus': 'bg-emerald-50 text-emerald-600',
  'Audit Correction': 'bg-blue-50 text-blue-600',
};

export default function AdjustmentEntry() {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [adjustments, setAdjustments] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    adjusted_by_id: '', authorized_by_id: '',
    type: 'Damage', reason: '', items: []
  });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: '', ok: true }), 3500);
  };

  useEffect(() => { loadData(); }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adjData, itms, emps] = await Promise.all([
        storesService.getStockAdjustments(),
        storesService.getItems(),
        storesService.getEmployees()
      ]);
      setAdjustments(adjData || []);
      setItemsList(itms || []);
      setEmployees(emps || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const isNegative = NEGATIVE_TYPES.includes(formData.type);

  const handleAddItem = () => {
    const itm = itemsList[0];
    setFormData({
      ...formData,
      items: [...formData.items, {
        item_id: itm?.id || '',
        category_id: itm?.category_id || '',
        uom_id: itm?.uom_id || '',
        current_stock: itm?.current_stock || 0,
        quantity_adjusted: 0,
        new_stock: itm?.current_stock || 0,
        remarks: ''
      }]
    });
  };

  const handleItemChange = (idx, itemId) => {
    const sel = itemsList.find(x => x.id === parseInt(itemId));
    if (sel) {
      const updated = [...formData.items];
      updated[idx] = {
        ...updated[idx],
        item_id: sel.id, category_id: sel.category_id, uom_id: sel.uom_id,
        current_stock: sel.current_stock,
        new_stock: sel.current_stock + (updated[idx].quantity_adjusted * (isNegative ? -1 : 1))
      };
      setFormData({ ...formData, items: updated });
    }
  };

  const handleQtyChange = (idx, qty) => {
    const updated = [...formData.items];
    const factor = isNegative ? -1 : 1;
    updated[idx].quantity_adjusted = parseFloat(qty) || 0;
    updated[idx].new_stock = Math.max(0, updated[idx].current_stock + (updated[idx].quantity_adjusted * factor));
    setFormData({ ...formData, items: updated });
  };

  const setItemField = (idx, field, val) => {
    const updated = [...formData.items];
    updated[idx][field] = val;
    setFormData({ ...formData, items: updated });
  };

  const handleRemoveItem = (idx) => {
    const updated = [...formData.items];
    updated.splice(idx, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleTypeChange = (type) => {
    const neg = NEGATIVE_TYPES.includes(type);
    const items = formData.items.map(item => ({
      ...item,
      new_stock: Math.max(0, item.current_stock + (item.quantity_adjusted * (neg ? -1 : 1)))
    }));
    setFormData({ ...formData, type, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.adjusted_by_id || !formData.authorized_by_id) {
      showToast('Please select the auditor and authorizing manager.', false); return;
    }
    if (formData.items.length === 0) {
      showToast('Add at least one item to adjust.', false); return;
    }
    setSubmitLoading(true);
    try {
      const factor = isNegative ? -1 : 1;
      await storesService.createStockAdjustment({
        adjusted_by_id: parseInt(formData.adjusted_by_id),
        authorized_by_id: parseInt(formData.authorized_by_id),
        type: formData.type, reason: formData.reason,
        items: formData.items.map(i => ({
          item_id: parseInt(i.item_id), category_id: parseInt(i.category_id), uom_id: parseInt(i.uom_id),
          current_stock: i.current_stock, quantity_adjusted: i.quantity_adjusted * factor,
          new_stock: i.new_stock, remarks: i.remarks
        }))
      });
      showToast('Stock adjustment applied and ledger updated!');
      setView('list');
      loadData();
    } catch (err) { console.error(err); showToast('Failed to apply adjustment.', false); }
    finally { setSubmitLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this adjustment?')) return;
    try { await storesService.deleteStockAdjustment(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const filteredAdj = adjustments.filter(a =>
    a.adjustment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deductions = adjustments.filter(a => NEGATIVE_TYPES.includes(a.type)).length;
  const additions = adjustments.filter(a => !NEGATIVE_TYPES.includes(a.type)).length;

  const stats = [
    {
      label: 'Total Adjustments', value: adjustments.length,
      icon: <BarChart3 size={24} />, color: '#8b5cf6'
    },
    {
      label: 'Deductions', value: deductions,
      icon: <TrendingDown size={24} />, color: '#ef4444'
    },
    {
      label: 'Additions / Surplus', value: additions,
      icon: <TrendingUp size={24} />, color: '#10b981'
    },
    {
      label: 'Items in System', value: itemsList.length,
      icon: <Package size={24} />, color: '#3b82f6'
    },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-violet-600 text-white' : 'bg-red-600 text-white'}`}>
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
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Stock Adjustment</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Reconcile physical inventory counts with digital records — damage, loss, surplus, and audit corrections.</p>
            </div>
          </div>
          <button onClick={() => { setFormData({ adjusted_by_id: '', authorized_by_id: '', type: 'Damage', reason: '', items: [] }); setView('form'); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New Adjustment
          </button>
        </div>
      )}

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
                <input type="text" placeholder="Search Adjustment No or Type…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-control" style={{ paddingLeft: '36px' }} />
              </div>
              <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2"><RefreshCw size={16} /></button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-violet-400" />
                  <span className="text-xs">Loading adjustments…</span>
                </div>
              ) : filteredAdj.length === 0 ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <div className="p-5 bg-violet-50 rounded-2xl"><BarChart3 size={38} className="text-violet-300" /></div>
                  <span className="text-sm font-bold text-slate-600">No stock adjustments recorded yet.</span>
                  <span className="text-xs text-slate-400">Click "New Adjustment" to reconcile inventory discrepancies.</span>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">Adjustment No</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Adjusted By</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredAdj.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800 font-mono">{a.adjustment_no}</td>
                        <td className="px-5 py-3">{a.adjustment_date ? new Date(a.adjustment_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${typeColors[a.type] || 'bg-slate-100 text-slate-500'}`}>{a.type}</span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{a.adjusted_by_name || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{a.reason || 'Routine Audit'}</td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
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
              New Stock Adjustment Entry
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
                Adjustment Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Adjustment Type *</label>
                        <select value={formData.type} onChange={e => handleTypeChange(e.target.value)} required className="form-control">
                          <option value="Damage">Damage (Deduction)</option>
                          <option value="Expired">Expired (Deduction)</option>
                          <option value="Lost">Lost (Deduction)</option>
                          <option value="Breakage">Breakage (Deduction)</option>
                          <option value="Surplus">Surplus (Addition)</option>
                          <option value="Audit Correction">Audit Correction (Manual)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Adjusted By (Auditor) *</label>
                        <select value={formData.adjusted_by_id} onChange={e => setFormData({ ...formData, adjusted_by_id: e.target.value })} required className="form-control">
                          <option value="">-- Select Auditor --</option>
                          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Authorized By (Manager) *</label>
                        <select value={formData.authorized_by_id} onChange={e => setFormData({ ...formData, authorized_by_id: e.target.value })} required className="form-control">
                          <option value="">-- Select Manager --</option>
                          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Primary Reason</label>
                        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="" className="form-control" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                        Adjustment Lines
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddItem}
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
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Click 'Add Item' to add adjustment lines.</p>
                        </div>
                      ) : (
                        <table className="data-table" style={{ width: '100%', marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 40 }}>#</th>
                              <th>Item</th>
                              <th style={{ textAlign: 'center', width: 140 }}>Current Stock</th>
                              <th style={{ textAlign: 'center', width: 140 }}>Qty Adjusted</th>
                              <th style={{ textAlign: 'center', width: 140 }}>New Stock</th>
                              <th>Remarks</th>
                              <th style={{ width: 50, textAlign: 'center' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item, idx) => {
                              const diff = item.new_stock - item.current_stock;
                              return (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                                  <td>
                                    <select value={item.item_id} onChange={e => handleItemChange(idx, e.target.value)}
                                      className="form-control" style={{ margin: 0, minWidth: 200 }}>
                                      <option value="">-- Select Item --</option>
                                      {itemsList.map(i => <option key={i.id} value={i.id}>{i.item_code} — {i.item_name}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                    {item.current_stock}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <input type="number" min="0" value={item.quantity_adjusted}
                                      onChange={e => handleQtyChange(idx, e.target.value)}
                                      className="form-control" style={{ width: 100, margin: 0, display: 'inline-block' }} />
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                      <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '700', background: diff < 0 ? '#fef2f2' : diff > 0 ? '#ecfdf5' : 'var(--bg-secondary)', color: diff < 0 ? '#dc2626' : diff > 0 ? '#059669' : 'var(--text-muted)' }}>
                                        {item.new_stock}
                                      </span>
                                      {diff !== 0 && (
                                        <span style={{ fontSize: 12, fontWeight: 700, color: diff < 0 ? '#ef4444' : '#059669' }}>
                                          ({diff > 0 ? '+' : ''}{diff})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <input type="text" value={item.remarks} onChange={e => setItemField(idx, 'remarks', e.target.value)}
                                      placeholder=""
                                      className="form-control" style={{ margin: 0 }} />
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button type="button" onClick={() => handleRemoveItem(idx)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'rgba(139, 92, 246, 0.05)', borderTop: '2px solid rgba(139, 92, 246, 0.2)' }}>
                              <td colSpan={3} style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', padding: '12px 16px' }}>Net Stock Impact</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#6d28d9', padding: '12px 16px' }}>{formData.items.reduce((s, i) => s + (i.quantity_adjusted || 0), 0)} units</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: isNegative ? '#dc2626' : '#059669' }}>
                                  {isNegative ? '⬇ Deduction' : '⬆ Addition'}
                                </span>
                              </td>
                              <td colSpan={2} />
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
