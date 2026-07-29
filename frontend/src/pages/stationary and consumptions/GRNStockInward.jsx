import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Package, TrendingUp, Warehouse, ClipboardCheck, ShieldCheck, Save, X, ArrowLeft
} from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

const inspectionColors = {
  'Accepted': 'bg-emerald-50 text-emerald-600',
  'Rejected': 'bg-red-50 text-red-500',
  'Partial': 'bg-amber-50 text-amber-600',
  'Pending': 'bg-slate-100 text-slate-500',
};

export default function GRNStockInward() {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [grns, setGrns] = useState([]);
  const [pos, setPOs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    po_id: '', received_by_id: '', warehouse_id: '', items: []
  });

  const showToast = (msg, ok = true) => {
    if (!ok) alert(msg);
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
      loadData();
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
    {
      label: 'Total GRNs', value: grns.length,
      icon: <ClipboardCheck size={24} />, color: '#10b981'
    },
    {
      label: 'Pending POs', value: pos.filter(p => p.status === 'Approved' || p.status === 'Pending').length,
      icon: <Package size={24} />, color: '#f59e0b'
    },
    {
      label: 'Warehouses', value: warehouses.length,
      icon: <Warehouse size={24} />, color: '#3b82f6'
    },
    {
      label: 'Items Tracked', value: itemsList.length,
      icon: <TrendingUp size={24} />, color: '#8b5cf6'
    },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
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
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Stock Inward (GRN)</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Receive, inspect and register newly arrived material shipments from vendors.</p>
            </div>
          </div>
          <button onClick={() => { setFormData({ po_id: '', received_by_id: '', warehouse_id: '', items: [] }); setView('form'); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New GRN
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

          {/* Filters Card */}
          <div className="card" style={{ marginBottom: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" placeholder="Search GRN No or PO No…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-control" style={{ paddingLeft: '36px', margin: 0 }} />
              </div>
              <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2" style={{ height: 'fit-content' }}>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>GRN No</th>
                    <th>Inward Date</th>
                    <th>PO Reference</th>
                    <th>Warehouse</th>
                    <th>Received By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                  ) : filteredGrns.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No GRN entries recorded yet.</td></tr>
                  ) : (
                    filteredGrns.map(g => (
                      <tr key={g.id}>
                        <td>{g.grn_no}</td>
                        <td>{g.inward_date ? new Date(g.inward_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{g.po_number || '-'}</td>
                        <td>{g.warehouse_name || '-'}</td>
                        <td>{g.received_by_name || '-'}</td>
                        <td>
                          <span className={`status-badge ${g.status?.toLowerCase().replace(' ', '-') || 'received'}`}>
                            {g.status || 'Received'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDelete(g.id)} className="icon-btn delete-btn">
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
              New GRN — Stock Inward Entry
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
                Stock Inward Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Purchase Order *</label>
                        <MasterDropdown
                          label=""
                          name="po_id"
                          value={formData.po_id}
                          options={pos.map(po => ({...po, name: `${po.po_no} — ${po.vendor_name}`, id: po.id.toString()}))}
                          required={true}
                          onChange={(name, val) => handlePOChange(val)}
                        />
                        {linkedPO && (
                          <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgb(5, 150, 105)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> {linkedPO.items?.length || 0} item(s) loaded from PO
                          </p>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Received By *</label>
                        <MasterDropdown
                          label=""
                          name="received_by_id"
                          value={formData.received_by_id}
                          options={employees}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Storage Warehouse *</label>
                        <MasterDropdown
                          label=""
                          name="warehouse_id"
                          value={formData.warehouse_id}
                          options={warehouses.map(wh => ({...wh, name: wh.warehouse_name}))}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                    </div>

                    {formData.items.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                          <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                            Inward Inspection Checklist
                          </h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formData.items.length} item(s) from PO</span>
                        </div>
                        <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                          <table className="data-table" style={{ width: '100%', marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th>Item</th>
                                <th style={{ textAlign: 'right' }}>Ordered</th>
                                <th style={{ textAlign: 'center' }}>Received Qty</th>
                                <th>Inspection</th>
                                <th>Room</th>
                                <th>Rack</th>
                                <th>Rack No</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formData.items.map((item, idx) => {
                                const obj = itemsList.find(i => i.id === item.item_id);
                                const short = item.received_quantity < item.ordered_quantity;
                                return (
                                  <tr key={idx} style={{ background: short ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{obj?.item_name || `Item #${item.item_id}`}</div>
                                      {obj?.item_code && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{obj.item_code}</div>}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.ordered_quantity}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <input type="number" min="0" value={item.received_quantity}
                                        onChange={e => setItemField(idx, 'received_quantity', parseFloat(e.target.value) || 0)}
                                        className="form-control"
                                        style={{ width: 100, display: 'inline-block', borderColor: short ? '#fcd34d' : undefined, background: short ? '#fffbeb' : undefined, margin: 0 }} />
                                      {short && <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>Short by {item.ordered_quantity - item.received_quantity}</div>}
                                    </td>
                                    <td>
                                      <MasterDropdown
                                        label=""
                                        name="inspection_status"
                                        value={item.inspection_status}
                                        options={['Accepted', 'Rejected', 'Partial', 'Pending']}
                                        onChange={(name, val) => setItemField(idx, name, val)}
                                      />
                                    </td>
                                    <td>
                                      <input type="text" value={item.room || ''} onChange={e => setItemField(idx, 'room', e.target.value)} placeholder="e.g. Room A" className="form-control" style={{ minWidth: 90, margin: 0 }} />
                                    </td>
                                    <td>
                                      <input type="text" value={item.rack || ''} onChange={e => setItemField(idx, 'rack', e.target.value)} placeholder="e.g. Rack 3" className="form-control" style={{ minWidth: 90, margin: 0 }} />
                                    </td>
                                    <td>
                                      <input type="text" value={item.rack_no || ''} onChange={e => setItemField(idx, 'rack_no', e.target.value)} placeholder="e.g. R-12" className="form-control" style={{ minWidth: 90, margin: 0 }} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: 'rgba(16, 185, 129, 0.05)', borderTop: '2px solid rgba(16, 185, 129, 0.2)' }}>
                                <td colSpan={2} style={{ fontSize: 12, fontWeight: 700, color: '#047857', padding: '12px 16px' }}>Total Received</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>{formData.items.reduce((s, i) => s + (i.ordered_quantity || 0), 0)}</td>
                                <td style={{ textAlign: 'center', fontWeight: 800, color: '#047857', padding: '12px 16px' }}>{formData.items.reduce((s, i) => s + (i.received_quantity || 0), 0)} units</td>
                                <td colSpan={4} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, border: '1px dashed var(--border)', borderRadius: 12, marginTop: 24, background: 'var(--bg-secondary)' }}>
                        <Package size={36} style={{ color: 'var(--text-muted)' }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Select a Purchase Order above to load items for inspection.</p>
                      </div>
                    )}

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

