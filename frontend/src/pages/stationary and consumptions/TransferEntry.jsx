import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  Plus, Trash2, Search, RefreshCw, CheckCircle, AlertCircle,
  Loader2, Package, ArrowRightLeft, Warehouse, Users, Save, X, ArrowLeft
} from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

const statusColors = {
  'Completed': 'bg-emerald-50 text-emerald-600',
  'Pending': 'bg-amber-50 text-amber-600',
  'Cancelled': 'bg-slate-100 text-slate-500',
};

export default function TransferEntry() {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });

  const [formData, setFormData] = useState({
    source_warehouse_id: '',
    destination_warehouse_id: '',
    transferred_by_id: '',
    items: []
  });

  const showToast = (msg, ok = true) => {
    if (!ok) alert(msg);
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
    finally { setLoading(false); }
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
    const srcId = parseInt(formData.source_warehouse_id);
    const dstId = parseInt(formData.destination_warehouse_id);
    const trfId = parseInt(formData.transferred_by_id);

    if (!srcId || isNaN(srcId) || !dstId || isNaN(dstId) || !trfId || isNaN(trfId)) {
      showToast('Please select valid options from the dropdowns for all required fields.', false); return;
    }
    if (srcId === dstId) {
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
      loadData();
    } catch (err) {
      console.error(err);
      console.error(err.response?.data);
      alert(JSON.stringify(err.response?.data, null, 2));
      showToast('Failed to execute stock transfer.', false);
    }
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
    {
      label: 'Total Transfers', value: transfers.length,
      icon: <ArrowRightLeft size={24} />, color: '#0ea5e9'
    },
    {
      label: 'Completed', value: transfers.filter(t => t.status === 'Completed').length,
      icon: <CheckCircle size={24} />, color: '#10b981'
    },
    {
      label: 'Warehouses', value: warehouses.length,
      icon: <Warehouse size={24} />, color: '#3b82f6'
    },
    {
      label: 'Items Available', value: itemsList.length,
      icon: <Package size={24} />, color: '#8b5cf6'
    },
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-sky-600 text-white' : 'bg-red-600 text-white'}`}>
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
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Store Transfer</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Move stocks between warehouses or production sub-depots.</p>
            </div>
          </div>
          <button onClick={() => { setFormData({ source_warehouse_id: '', destination_warehouse_id: '', transferred_by_id: '', items: [] }); setView('form'); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New Transfer
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
                <input type="text" placeholder="Search Transfer No or Warehouse…" value={searchTerm}
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
                      <th>Transfer No</th>
                      <th>Date</th>
                      <th>From Warehouse</th>
                      <th>To Warehouse</th>
                      <th>Transferred By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                    ) : filteredTransfers.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No stock transfers recorded yet.</td></tr>
                    ) : (
                      filteredTransfers.map(t => (
                        <tr key={t.id}>
                          <td>{t.transfer_no}</td>
                          <td>{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString('en-IN') : '-'}</td>
                          <td>{t.source_warehouse_name || '-'}</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{t.destination_warehouse_name || '-'}</td>
                          <td>{t.transferred_by_name || '-'}</td>
                          <td>
                            <span className={`status-badge ${t.status?.toLowerCase().replace(' ', '-') || 'completed'}`}>
                              {t.status || 'Completed'}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleDelete(t.id)} className="icon-btn delete-btn">
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
              New Warehouse Transfer
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
                Transfer Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">

                    {sameSrc && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', fontSize: '13px', fontWeight: '500', marginBottom: '20px' }}>
                        <AlertCircle size={16} /> Source and destination warehouses cannot be the same.
                      </div>
                    )}

                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>From Warehouse *</label>
                        <MasterDropdown
                          label=""
                          name="source_warehouse_id"
                          value={formData.source_warehouse_id}
                          options={warehouses.map(w => ({ ...w, name: w.warehouse_name }))}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>To Warehouse *</label>
                        <MasterDropdown
                          label=""
                          name="destination_warehouse_id"
                          value={formData.destination_warehouse_id}
                          options={warehouses.filter(w => w.id !== parseInt(formData.source_warehouse_id)).map(w => ({ ...w, name: w.warehouse_name }))}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Transferred By *</label>
                        <MasterDropdown
                          label=""
                          name="transferred_by_id"
                          value={formData.transferred_by_id}
                          options={employees}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                        Transfer Items
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
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>No items added. Click 'Add Item' to begin.</p>
                        </div>
                      ) : (
                        <table className="data-table" style={{ width: '100%', marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 40 }}>#</th>
                              <th>Item</th>
                              <th style={{ textAlign: 'center', width: 140 }}>Available Stock</th>
                              <th style={{ textAlign: 'center', width: 140 }}>Qty to Transfer</th>
                              <th>Remarks</th>
                              <th style={{ width: 50, textAlign: 'center' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item, idx) => {
                              const db = itemsList.find(x => x.id === parseInt(item.item_id));
                              const insufficient = db && db.current_stock < item.quantity;
                              return (
                                <tr key={idx} style={{ background: insufficient ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
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
                                  <td style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '700', background: db?.current_stock > 0 ? '#ecfdf5' : '#fef2f2', color: db?.current_stock > 0 ? '#059669' : '#dc2626' }}>
                                      {db?.current_stock ?? '—'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <input type="number" min="1" value={item.quantity}
                                      onChange={e => setItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="form-control" style={{ width: 100, margin: 0, display: 'inline-block', borderColor: insufficient ? '#fca5a5' : undefined }} />
                                    {insufficient && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Exceeds stock!</div>}
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
                            <tr style={{ background: 'rgba(14, 165, 233, 0.05)', borderTop: '2px solid rgba(14, 165, 233, 0.2)' }}>
                              <td colSpan={3} style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', padding: '12px 16px' }}>Total Qty to Move</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1', padding: '12px 16px' }}>{formData.items.reduce((s, i) => s + (i.quantity || 0), 0)} units</td>
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
                      <button type="submit" className="btn btn-primary" disabled={submitLoading || formData.items.length === 0 || sameSrc}>
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


