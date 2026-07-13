import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Package, TrendingUp, Warehouse, ClipboardCheck, ShieldCheck, Save
} from 'lucide-react';

const inspectionColors = {
  'Accepted':  'bg-emerald-50 text-emerald-600',
  'Rejected':  'bg-red-50 text-red-500',
  'Partial':   'bg-amber-50 text-amber-600',
  'Pending':   'bg-slate-100 text-slate-500',
};

export default function GRNStockInward() {
  const [view, setView]               = useState('list');
  const [loading, setLoading]         = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [grns, setGrns]               = useState([]);
  const [pos, setPOs]                 = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [warehouses, setWarehouses]   = useState([]);
  const [itemsList, setItemsList]     = useState([]);
  const [searchTerm, setSearchTerm]   = useState('');
  const [toast, setToast]             = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    po_id: '', received_by_id: '', warehouse_id: '', items: []
  });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: '', ok: true }), 3500);
  };

  useEffect(() => { loadData(); }, [view]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load reference data (POs, employees, warehouses, items) independently
      // so that even if GRN list fails, dropdowns still populate.
      const [poData, emps, whs, itms] = await Promise.all([
        storesService.getPurchaseOrders().catch(e => { console.warn('PO load failed:', e); return []; }),
        storesService.getEmployees().catch(e => { console.warn('Employees load failed:', e); return []; }),
        storesService.getWarehouses().catch(e => { console.warn('Warehouses load failed:', e); return []; }),
        storesService.getItems().catch(e => { console.warn('Items load failed:', e); return []; }),
      ]);
      setPOs(poData || []);
      setEmployees(emps || []);
      setWarehouses(whs || []);
      setItemsList(itms || []);

      // Load GRNs separately — a failure here should not affect dropdowns
      try {
        const grnData = await storesService.getStockInwards();
        setGrns(grnData || []);
      } catch (grnErr) {
        console.error('GRN list load failed:', grnErr);
        showToast('Could not load GRN records. Other data loaded successfully.', false);
        setGrns([]);
      }
    } catch (err) {
      console.error('Critical load failure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePOChange = (poId) => {
    const sel = pos.find(p => p.id === parseInt(poId));
    if (sel) {
      setFormData(prev => ({
        ...prev,
        po_id: poId,
        warehouse_id: sel.delivery_warehouse_id || prev.warehouse_id,
        items: sel.items.map(i => ({
          item_id: i.item_id, 
          item_name: i.item_name,
          category_id: i.category_id, 
          uom_id: i.uom_id,
          ordered_quantity: i.quantity, 
          received_quantity: i.quantity,
          inspection_status: 'Accepted', 
          rack_bin: '', 
          room: '', 
          rack: '', 
          rack_no: '', 
          remarks: ''
        }))
      }));
    } else {
      setFormData(prev => ({ ...prev, po_id: poId, items: [] }));
    }
  };

  const setItemField = (idx, field, val) => {
    const updated = [...formData.items];
    updated[idx][field] = val;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.po_id || !formData.received_by_id || !formData.warehouse_id) {
      showToast('Please fill all required fields.', false); return;
    }
    if (formData.items.length === 0) {
      showToast('GRN must contain at least one item.', false); return;
    }
    setSubmitLoading(true);
    try {
      await storesService.createStockInward({
        po_id: parseInt(formData.po_id),
        received_by_id: parseInt(formData.received_by_id),
        warehouse_id: parseInt(formData.warehouse_id),
        items: formData.items.map(i => ({
          item_id: i.item_id ? parseInt(i.item_id) : null,
          item_name: i.item_name || null,
          category_id: i.category_id ? parseInt(i.category_id) : null,
          uom_id: i.uom_id ? parseInt(i.uom_id) : null,
          ordered_quantity: parseFloat(i.ordered_quantity) || 0,
          received_quantity: parseFloat(i.received_quantity) || 0,
          inspection_status: i.inspection_status || 'Accepted',
          rack_bin: i.rack_bin || null,
          room: i.room || null,
          rack: i.rack || null,
          rack_no: i.rack_no || null,
          remarks: i.remarks || null
        }))
      });
      showToast('GRN logged successfully! Stock levels updated.');
      setView('list');
    } catch (err) { console.error(err); showToast('Failed to log GRN.', false); }
    finally { setSubmitLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this GRN entry?')) return;
    try { await storesService.deleteStockInward(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const filteredGrns = grns.filter(g =>
    g.grn_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.po_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkedPO = pos.find(p => p.id === parseInt(formData.po_id));

  const stats = [
    { label: 'Total GRNs',       value: grns.length,
      icon: <ClipboardCheck size={24} />, color: '#10b981' },
    { label: 'Pending POs',      value: pos.filter(p => p.status === 'Approved' || p.status === 'Pending').length,
      icon: <Package size={24} />,        color: '#f59e0b' },
    { label: 'Warehouses',        value: warehouses.length,
      icon: <Warehouse size={24} />,      color: '#3b82f6' },
    { label: 'Items Tracked',     value: itemsList.length,
      icon: <TrendingUp size={24} />,     color: '#8b5cf6' },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
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
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Stock Inward (GRN)</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Receive, inspect and register newly arrived material shipments from vendors.</p>
          </div>
        </div>
        {view === 'list' ? (
          <button onClick={() => { setFormData({ po_id: '', received_by_id: '', warehouse_id: '', items: [] }); setView('form'); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New GRN
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
                <input type="text" placeholder="Search GRN No or PO No…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-control" style={{ paddingLeft: '36px' }} />
              </div>
              <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2"><RefreshCw size={16} /></button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-emerald-400" />
                  <span className="text-xs">Loading GRN records…</span>
                </div>
              ) : filteredGrns.length === 0 ? (
                <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                  <div className="p-5 bg-emerald-50 rounded-2xl"><ClipboardCheck size={38} className="text-emerald-300" /></div>
                  <span className="text-sm font-bold text-slate-600">No GRN entries recorded yet.</span>
                  <span className="text-xs text-slate-400">Click "New GRN" to register the first shipment receipt.</span>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">GRN No</th>
                      <th className="px-5 py-3">Inward Date</th>
                      <th className="px-5 py-3">PO Reference</th>
                      <th className="px-5 py-3">Warehouse</th>
                      <th className="px-5 py-3">Received By</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {filteredGrns.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800 font-mono">{g.grn_no}</td>
                        <td className="px-5 py-3">{g.inward_date ? new Date(g.inward_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-5 py-3 text-emerald-600 font-semibold">{g.po_number || '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{g.warehouse_name || '—'}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{g.received_by_name || '—'}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-3 py-1 rounded-full font-bold text-xs bg-emerald-50 text-emerald-600">{g.status || 'Received'}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleDelete(g.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
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
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'rgb(16, 185, 129)', borderRadius: '12px' }}>
                <ClipboardCheck size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>New GRN — Stock Inward Entry</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Select the PO to auto-populate items. Verify quantities and inspection status.</p>
              </div>
            </div>

            <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
              <legend style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Receipt Details</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Purchase Order <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select value={formData.po_id} onChange={e => handlePOChange(e.target.value)} required
                    className="form-control">
                    <option value="">Select PO Number</option>
                    {pos.map(po => <option key={po.id} value={po.id}>{po.po_no} — {po.vendor_name}</option>)}
                  </select>
                  {linkedPO && (
                    <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgb(5, 150, 105)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> {linkedPO.items?.length || 0} item(s) loaded from PO
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Received By <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select value={formData.received_by_id} onChange={e => setFormData({ ...formData, received_by_id: e.target.value })} required
                    className="form-control">
                    <option value="">Select Receiver</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Storage Warehouse <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select value={formData.warehouse_id} onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })} required
                    className="form-control">
                    <option value="">Select Warehouse</option>
                    {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.warehouse_name}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>
          </div>

          {formData.items.length > 0 ? (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--primary)' }} /> Inward Inspection Checklist
                </h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formData.items.length} item(s) from PO</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3 text-right">Ordered</th>
                      <th className="px-5 py-3">Received Qty</th>
                      <th className="px-5 py-3">Inspection</th>
                      <th className="px-5 py-3">Room</th>
                      <th className="px-5 py-3">Rack</th>
                      <th className="px-5 py-3">Rack No</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {formData.items.map((item, idx) => {
                      const obj = itemsList.find(i => i.id === item.item_id);
                      const short = item.received_quantity < item.ordered_quantity;
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/50 ${short ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-5 py-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">{obj?.item_name || `Item #${item.item_id}`}</p>
                            {obj?.item_code && <p className="text-xs text-slate-400 font-mono">{obj.item_code}</p>}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-600">{item.ordered_quantity}</td>
                          <td className="px-5 py-3">
                            <input type="number" min="0" value={item.received_quantity}
                              onChange={e => setItemField(idx, 'received_quantity', parseFloat(e.target.value) || 0)}
                              className={`form-control ${short ? 'border-amber-300 bg-amber-50' : ''}`}
                              style={{ width: '90px', padding: '6px 10px' }} />
                            {short && <p className="text-xs text-amber-600 mt-1">Short by {item.ordered_quantity - item.received_quantity}</p>}
                          </td>
                          <td className="px-5 py-3">
                            <select value={item.inspection_status} onChange={e => setItemField(idx, 'inspection_status', e.target.value)}
                              className="form-control" style={{ minWidth: '110px' }}>
                              {['Accepted', 'Rejected', 'Partial', 'Pending'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <input type="text" value={item.room || ''} onChange={e => setItemField(idx, 'room', e.target.value)}
                              placeholder="e.g. Room A"
                              className="form-control" style={{ minWidth: '100px' }} />
                          </td>
                          <td className="px-5 py-3">
                            <input type="text" value={item.rack || ''} onChange={e => setItemField(idx, 'rack', e.target.value)}
                              placeholder="e.g. Rack 3"
                              className="form-control" style={{ minWidth: '100px' }} />
                          </td>
                          <td className="px-5 py-3">
                            <input type="text" value={item.rack_no || ''} onChange={e => setItemField(idx, 'rack_no', e.target.value)}
                              placeholder="e.g. R-12"
                              className="form-control" style={{ minWidth: '100px' }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-50/60 border-t-2 border-emerald-100">
                      <td colSpan={2} className="px-5 py-2.5 text-xs font-bold text-emerald-700">Total Received</td>
                      <td className="px-5 py-2.5 text-right font-bold text-slate-600">{formData.items.reduce((s, i) => s + (i.ordered_quantity || 0), 0)}</td>
                      <td className="px-5 py-2.5 font-extrabold text-emerald-700">{formData.items.reduce((s, i) => s + (i.received_quantity || 0), 0)} units</td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Package size={36} style={{ color: 'var(--border)' }} />
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Select a Purchase Order above to load items for inspection.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={submitLoading || formData.items.length === 0}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {submitLoading ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Record GRN Inward</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
