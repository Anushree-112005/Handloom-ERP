import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, BarChart3, Briefcase, CheckCircle, Download, Edit2, Eye, FileText, IndianRupee, Loader2, MapPin, Package, Phone, Plus, RefreshCw, Save, Search, ShieldAlert, Trash2, TrendingDown, TrendingUp, User, X, Filter, Globe, Mail, ClipboardList } from 'lucide-react';

import storesService from '../../services/storesService';

import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';

const NEGATIVE_TYPES = ['Damage', 'Expired', 'Lost', 'Breakage'];

const typeColors = {
  'Damage': 'bg-red-50 text-red-600',
  'Expired': 'bg-rose-50 text-rose-600',
  'Lost': 'bg-red-50 text-red-500',
  'Breakage': 'bg-orange-50 text-orange-600',
  'Surplus': 'bg-emerald-50 text-emerald-600',
  'Audit Correction': 'bg-blue-50 text-blue-600',
};

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function AdjustmentEntry() {
  const [view, setView] = useState('list');

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

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
    if (!ok) alert(msg);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={24} color="var(--primary)" /> Stock Adjustment
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Reconcile physical inventory counts with digital records — damage, loss, surplus, and audit corrections.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ExportButton
              data={filteredAdj}
              filename="Stock_Adjustment_Report"
              pdfTitle="Stock Adjustment Report"
              columns={[
                { header: 'Adjustment No', key: 'adjustment_no' },
                { header: 'Date', key: 'adjustment_date', render: (row) => new Date(row.adjustment_date).toLocaleDateString() },
                { header: 'Type', key: 'type' },
                { header: 'Adjusted By', key: 'adjusted_by_name' },
                { header: 'Authorized By', key: 'authorized_by_name' },
                { header: 'Reason', key: 'reason' }
              ]}
            />
            <button onClick={() => { setFormData({ adjusted_by_id: '', authorized_by_id: '', type: 'Damage', reason: '', items: [] }); setView('form'); }}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
              <Plus size={16} /> New Adjustment
            </button>
          </div>
        </div>
      )}

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
                <input type="text" className="form-control" placeholder="Search Adjustment No or Type…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
                {loading && <Loader2 className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
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
          </div>

          <div className="overflow-x-auto flex-1">
              <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adjustment No</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Adjusted By</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                  ) : filteredAdj.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No stock adjustments recorded yet.</td></tr>
                  ) : (
                    filteredAdj.map(a => (
                      <tr 
                        key={a.id}
                        onClick={async () => {
                          const detailedAdjustment = await storesService.getStockAdjustment(a.id);
                          setSelectedViewItem(detailedAdjustment);
                        }}
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === a.id ? 'var(--bg-secondary)' : 'transparent' }}
                      >
                        <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{a.adjustment_no}</td>
                        <td>{a.adjustment_date ? new Date(a.adjustment_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td>
                          <span className={`status-badge ${a.type?.toLowerCase().replace(' ', '-') || 'addition'}`}>
                            {a.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{a.adjusted_by_name || '-'}</td>
                        <td>{a.reason || 'Routine Audit'}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={async () => {
                                const detailedAdjustment = await storesService.getStockAdjustment(a.id);
                                setSelectedViewItem(detailedAdjustment);
                              }}
                              title="Preview"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button onClick={() => handleDelete(a.id)} className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Adjustment">
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
                        <MasterDropdown
                          label=""
                          name="type"
                          value={formData.type}
                          options={[
                            { id: 'Damage', name: 'Damage (Deduction)' },
                            { id: 'Expired', name: 'Expired (Deduction)' },
                            { id: 'Lost', name: 'Lost (Deduction)' },
                            { id: 'Breakage', name: 'Breakage (Deduction)' },
                            { id: 'Surplus', name: 'Surplus (Addition)' },
                            { id: 'Audit Correction', name: 'Audit Correction (Manual)' }
                          ]}
                          onChange={(name, val) => handleTypeChange(val)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Adjusted By (Auditor) *</label>
                        <MasterDropdown
                          label=""
                          name="adjusted_by_id"
                          value={formData.adjusted_by_id}
                          options={employees}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Authorized By (Manager) *</label>
                        <MasterDropdown
                          label=""
                          name="authorized_by_id"
                          value={formData.authorized_by_id}
                          options={employees}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
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
                        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
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
                                    <MasterDropdown
                                      label=""
                                      name="item_id"
                                      value={item.item_id}
                                      options={itemsList.map(i => ({ ...i, name: `${i.item_code} — ${i.item_name}` }))}
                                      onChange={(name, val) => handleItemChange(idx, val)}
                                    />
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
                        </div>
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

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Stock Adjustment Preview</h3>
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
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>STOCK ADJUSTMENT</h2>
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
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Dinesh Exports</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@dineshexports.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.dineshexports.com</div>
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
    </div>
  );
}

