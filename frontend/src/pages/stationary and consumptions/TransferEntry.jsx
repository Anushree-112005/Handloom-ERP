import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Package, ArrowRightLeft, Warehouse, Users, Save
} from 'lucide-react';

const statusColors = {
  'Completed': 'bg-emerald-50 text-emerald-600',
  'Pending':   'bg-amber-50 text-amber-600',
  'Cancelled': 'bg-slate-100 text-slate-500',
};

export default function TransferEntry() {
  const [view, setView]               = useState('list');
  const [loading, setLoading]         = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [transfers, setTransfers]     = useState([]);
  const [itemsList, setItemsList]     = useState([]);
  const [warehouses, setWarehouses]   = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [toast, setToast]             = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    source_warehouse_id: '',
    destination_warehouse_id: '',
    transferred_by_id: '',
    items: []
  });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: '', ok: true }), 3500);
  };

  useEffect(() => { loadData(); }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transData, itms, whs, emps] = await Promise.all([
        storesService.getStoreTransfers(),
        storesService.getItems(),
        storesService.getWarehouses(),
        storesService.getEmployees()
      ]);
      setTransfers(transData || []);
      setItemsList(itms || []);
      setWarehouses(whs || []);
      setEmployees(emps || []);
    } catch (err) { console.error(err); }
    finally       { setLoading(false); }
  };

  const handleAddItem = () => {
    const itm = itemsList[0];
    setFormData({
      ...formData,
      items: [...formData.items, {
        item_id: itm?.id || '',
        category_id: itm?.category_id || '',
        uom_id: itm?.uom_id || '',
        quantity: 1, remarks: ''
      }]
    });
  };

  const handleItemChange = (idx, itemId) => {
    const sel = itemsList.find(x => x.id === parseInt(itemId));
    if (sel) {
      const updated = [...formData.items];
      updated[idx] = { ...updated[idx], item_id: sel.id, category_id: sel.category_id, uom_id: sel.uom_id };
      setFormData({ ...formData, items: updated });
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.source_warehouse_id || !formData.destination_warehouse_id || !formData.transferred_by_id) {
      showToast('Please fill all required fields.', false); return;
    }
    if (formData.source_warehouse_id === formData.destination_warehouse_id) {
      showToast('Source and destination warehouses must be different.', false); return;
    }
    if (formData.items.length === 0) {
      showToast('Add at least one item to transfer.', false); return;
    }
    for (let item of formData.items) {
      const db = itemsList.find(x => x.id === parseInt(item.item_id));
      if (db && db.current_stock < item.quantity) {
        showToast(`Insufficient stock for '${db.item_name}'. Available: ${db.current_stock}`, false); return;
      }
    }
    setSubmitLoading(true);
    try {
      await storesService.createStoreTransfer({
        source_warehouse_id: parseInt(formData.source_warehouse_id),
        destination_warehouse_id: parseInt(formData.destination_warehouse_id),
        transferred_by_id: parseInt(formData.transferred_by_id),
        items: formData.items.map(i => ({
          item_id: parseInt(i.item_id), category_id: parseInt(i.category_id),
          uom_id: parseInt(i.uom_id), quantity: i.quantity, remarks: i.remarks
        }))
      });
      showToast('Stock transfer completed successfully!');
      setView('list');
    } catch (err) { console.error(err); showToast('Failed to execute stock transfer.', false); }
    finally { setSubmitLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transfer?')) return;
    try { await storesService.deleteStoreTransfer(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const filteredTransfers = transfers.filter(t =>
    t.transfer_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.source_warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const srcWarehouse = warehouses.find(w => w.id === parseInt(formData.source_warehouse_id));
  const dstWarehouse = warehouses.find(w => w.id === parseInt(formData.destination_warehouse_id));
  const sameSrc = formData.source_warehouse_id && formData.source_warehouse_id === formData.destination_warehouse_id;

  const stats = [
    { label: 'Total Transfers', value: transfers.length,
      icon: <ArrowRightLeft size={24} />, color: '#0ea5e9' },
    { label: 'Completed',       value: transfers.filter(t => t.status === 'Completed').length,
      icon: <CheckCircle size={24} />,   color: '#10b981' },
    { label: 'Warehouses',       value: warehouses.length,
      icon: <Warehouse size={24} />,     color: '#3b82f6' },
    { label: 'Items Available',  value: itemsList.length,
      icon: <Package size={24} />,       color: '#8b5cf6' },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-sky-600 text-white' : 'bg-red-600 text-white'}`}>
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
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Store Transfer</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Move stocks between warehouses or production sub-depots.</p>
          </div>
        </div>
        {view === 'list' ? (
          <button onClick={() => { setFormData({ source_warehouse_id: '', destination_warehouse_id: '', transferred_by_id: '', items: [] }); setView('form'); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New Transfer
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
                <input type="text" placeholder="Search Transfer No or Warehouse…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-control" style={{ paddingLeft: '36px' }} />
              </div>
              <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2"><RefreshCw size={16} /></button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-sky-400" />
                  <span className="text-xs">Loading transfers…</span>
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <div className="p-5 bg-sky-50 rounded-2xl"><ArrowRightLeft size={38} className="text-sky-300" /></div>
                  <span className="text-sm font-bold text-slate-600">No stock transfers recorded yet.</span>
                  <span className="text-xs text-slate-400">Click "New Transfer" to move stock between warehouses.</span>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">Transfer No</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">From Warehouse</th>
                      <th className="px-5 py-3">To Warehouse</th>
                      <th className="px-5 py-3">Transferred By</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredTransfers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800 font-mono">{t.transfer_no}</td>
                        <td className="px-5 py-3">{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{t.source_warehouse_name || '—'}</td>
                        <td className="px-5 py-3 font-semibold text-sky-600">{t.destination_warehouse_name || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{t.transferred_by_name || '—'}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full font-bold text-xs ${statusColors[t.status] || 'bg-slate-100 text-slate-500'}`}>{t.status || 'Completed'}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
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
              <div style={{ padding: '12px', background: 'rgba(2, 132, 199, 0.1)', color: 'rgb(2, 132, 199)', borderRadius: '12px' }}>
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>New Warehouse Transfer</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Move consumable stocks from one warehouse to another location.</p>
              </div>
            </div>

            {/* Route visualizer */}
            {(srcWarehouse || dstWarehouse) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(2, 132, 199, 0.05)', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.1)' }}>
                <div style={{ flex: 1, padding: '8px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid rgba(2, 132, 199, 0.1)', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'rgb(56, 189, 248)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</p>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px' }}>{srcWarehouse?.warehouse_name || '—'}</p>
                </div>
                <ArrowRightLeft size={16} style={{ color: 'rgb(56, 189, 248)', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '8px', backgroundColor: 'white', borderRadius: '8px', border: `1px solid ${sameSrc ? 'rgb(254, 202, 202)' : 'rgba(2, 132, 199, 0.1)'}`, textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'rgb(56, 189, 248)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</p>
                  <p style={{ fontWeight: '700', color: sameSrc ? '#ef4444' : 'var(--text-primary)', marginTop: '4px', fontSize: '13px' }}>{dstWarehouse?.warehouse_name || '—'}</p>
                </div>
              </div>
            )}
            {sameSrc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                <AlertCircle size={16} /> Source and destination warehouses cannot be the same.
              </div>
            )}

            <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
              <legend style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Transfer Details</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>From Warehouse <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={formData.source_warehouse_id} onChange={e => setFormData({ ...formData, source_warehouse_id: e.target.value })} required
                    className="form-control">
                    <option value="">Select Source</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.warehouse_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>To Warehouse <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={formData.destination_warehouse_id} onChange={e => setFormData({ ...formData, destination_warehouse_id: e.target.value })} required
                    className={`form-control ${sameSrc ? 'border-red-300 bg-red-50' : ''}`}>
                    <option value="">Select Destination</option>
                    {warehouses.filter(w => w.id !== parseInt(formData.source_warehouse_id)).map(w => <option key={w.id} value={w.id}>{w.warehouse_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Transferred By <span style={{ color: '#ef4444' }}>*</span></label>
                  <select value={formData.transferred_by_id} onChange={e => setFormData({ ...formData, transferred_by_id: e.target.value })} required
                    className="form-control">
                    <option value="">Select Operator</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Items */}
          {/* Items */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} style={{ color: 'var(--primary)' }} /> Transfer Items
              </h4>
              <button type="button" onClick={handleAddItem}
                className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Package size={36} style={{ color: 'var(--border)' }} />
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>No items added. Click "Add Item" to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Available Stock</th>
                      <th className="px-5 py-3">Qty to Transfer</th>
                      <th className="px-5 py-3">Remarks</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {formData.items.map((item, idx) => {
                      const db = itemsList.find(x => x.id === parseInt(item.item_id));
                      const insufficient = db && db.current_stock < item.quantity;
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/50 ${insufficient ? 'bg-red-50/30' : ''}`}>
                          <td className="px-5 py-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-5 py-3 w-56">
                            <select value={item.item_id} onChange={e => handleItemChange(idx, e.target.value)}
                              className="form-control" style={{ minWidth: '180px' }}>
                              <option value="">Select Item</option>
                              {itemsList.map(i => <option key={i.id} value={i.id}>{i.item_code} — {i.item_name}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${db?.current_stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                              {db?.current_stock ?? '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <input type="number" min="1" value={item.quantity}
                              onChange={e => setItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className={`form-control ${insufficient ? 'border-red-300 bg-red-50' : ''}`} style={{ width: '100px' }} />
                            {insufficient && <p className="text-[9px] text-red-500 mt-0.5">Exceeds stock!</p>}
                          </td>
                          <td className="px-5 py-3">
                            <input type="text" value={item.remarks} onChange={e => setItemField(idx, 'remarks', e.target.value)}
                              placeholder="Batch info…"
                              className="form-control" style={{ minWidth: '140px' }} />
                          </td>
                          <td className="px-5 py-3">
                            <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-sky-50/60 border-t-2 border-sky-100">
                      <td colSpan={3} className="px-5 py-2.5 text-xs font-bold text-sky-700">Total Qty to Move</td>
                      <td className="px-5 py-2.5 font-extrabold text-sky-700">{formData.items.reduce((s, i) => s + (i.quantity || 0), 0)} units</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitLoading || formData.items.length === 0 || sameSrc}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {submitLoading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><Save size={16} /> Confirm Transfer</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
