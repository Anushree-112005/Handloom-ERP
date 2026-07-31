import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, CheckCircle, ClipboardCheck, Download, Edit2, Eye, FileText, IndianRupee, Loader2, MapPin, Package, Phone, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, TrendingUp, User, Warehouse, X, Filter, Globe, Mail, ClipboardList } from 'lucide-react';

import storesService from '../../services/storesService';

import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';

const inspectionColors = {
  'Accepted': 'bg-emerald-50 text-emerald-600',
  'Rejected': 'bg-red-50 text-red-500',
  'Partial': 'bg-amber-50 text-amber-600',
  'Pending': 'bg-slate-100 text-slate-500',
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

export default function GRNStockInward() {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardCheck size={24} color="var(--primary)" /> Stock Inward (GRN)
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Receive, inspect and register newly arrived material shipments from vendors.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ExportButton
              data={filteredGrns}
              filename="GRN_Stock_Inward_Report"
              pdfTitle="GRN Stock Inward Report"
              columns={[
                { header: 'GRN No', key: 'grn_no' },
                { header: 'PO No', key: 'po_number' },
                { header: 'Date', key: 'date_received', render: (row) => new Date(row.date_received).toLocaleDateString() },
                { header: 'Warehouse', key: 'warehouse_name' },
                { header: 'Received By', key: 'received_by_name' }
              ]}
            />
            <button onClick={() => { setFormData({ po_id: '', received_by_id: '', warehouse_id: '', items: [] }); setView('form'); }}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
              <Plus size={16} /> New GRN
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
                <input type="text" className="form-control" placeholder="Search GRN No or PO No…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
                {loading && <Loader2 className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <Filter size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
                </div>
                <select className="form-control" style={{ width: 150, margin: 0 }}>
                  <option>All Statuses</option>
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
                        <tr 
                          key={g.id}
                          onClick={async () => {
                            const detailedGRN = await storesService.getStockInward(g.id);
                            setSelectedViewItem(detailedGRN);
                          }}
                          style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === g.id ? 'var(--bg-secondary)' : 'transparent' }}
                        >
                          <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{g.grn_no}</td>
                          <td>{g.inward_date ? new Date(g.inward_date).toLocaleDateString('en-IN') : '-'}</td>
                          <td style={{ fontWeight: 600 }}>{g.po_number || '-'}</td>
                          <td>{g.warehouse_name || '-'}</td>
                          <td>{g.received_by_name || '-'}</td>
                          <td>
                            <span className={`status-badge ${g.status?.toLowerCase().replace(' ', '-') || 'received'}`}>
                              {g.status || 'Received'}
                            </span>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={async () => {
                                  const detailedGRN = await storesService.getStockInward(g.id);
                                  setSelectedViewItem(detailedGRN);
                                }}
                                title="Preview"
                              >
                                <Eye size={16} color="var(--primary)" />
                              </button>
                              <button onClick={() => handleDelete(g.id)} className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete GRN">
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
                          options={pos.map(po => ({ ...po, name: `${po.po_no} — ${po.vendor_name}`, id: po.id.toString() }))}
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
                          options={warehouses.map(wh => ({ ...wh, name: wh.warehouse_name }))}
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
                          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
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

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Stock Inward (GRN) Preview</h3>
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
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>STOCK INWARD (GRN)</h2>
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

