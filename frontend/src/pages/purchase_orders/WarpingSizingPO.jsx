import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, FileText, Layers, IndianRupee, Factory, Download, Table } from 'lucide-react';
import { warpingSizingPOAPI, partyAPI, dropdownAPI, buyerOrderAPI } from '../../services/api';

export default function WarpingSizingPO() {
  const title = 'Warping / Sizing PO';
  const description = 'Manage warping and sizing purchase orders';
  const Icon = Factory;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [activeSection, setActiveSection] = useState('info');
  
  const initialForm = {
    po_no: '',
    po_date: new Date().toISOString().split('T')[0],
    supplier_job_worker: '',
    supplier_code: '',
    delivery_date: '',
    payment_terms: '',
    buyer_name: '',
    status: 'Active',
    remarks: '',

    indent_no: '',
    sales_order_no: '',
    production_order_no: '',
    buyer_order_no: '',
    department: '',

    taxable_value: 0,
    warping_charge: 0,
    sizing_charge: 0,
    packing_charge: 0,
    loading_charge: 0,
    unloading_charge: 0,
    transport_charge: 0,
    other_charges: 0,
    cgst_pct: 0,
    cgst_amount: 0,
    sgst_pct: 0,
    sgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    round_off: 0,
    net_amount: 0,

    delivery_location: '',
    dispatch_mode: '',
    transport_name: '',
    vehicle_no: '',
    delivery_instructions: '',
    terms_conditions: [
      "Material not meeting our specification and standards will be returned",
      "Demanded Qty to be supplied in whole and excess/short supply will not be accepted.",
      "Send Invoice along with Material.",
      "Defective and damage pieces will not be accepted.",
      "Subject to Namakkal Jurisdiction."
    ],

    items: [{
      yarn_code: '', yarn_name: '', yarn_count: '', yarn_type: '', mill_name: '', lot_no: '', shade: '', uom: 'KGS', qty_kg: 0, rate_per_kg: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);
  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes] = await Promise.all([
        warpingSizingPOAPI.list(),
        partyAPI.list(),
        dropdownAPI.getAll(),
        buyerOrderAPI.list()
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setBuyerOrders(buyerOrdRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const recalculate = (updatedForm) => {
    const updatedItems = (updatedForm.items || []).map(item => {
      const qty = parseFloat(item.qty_kg) || 0;
      const rate = parseFloat(item.rate_per_kg) || 0;
      return { ...item, amount: parseFloat((qty * rate).toFixed(2)) };
    });

    const itemsAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const warpingCharge = parseFloat(updatedForm.warping_charge) || 0;
    const sizingCharge = parseFloat(updatedForm.sizing_charge) || 0;
    const packingCharge = parseFloat(updatedForm.packing_charge) || 0;
    const loadingCharge = parseFloat(updatedForm.loading_charge) || 0;
    const unloadingCharge = parseFloat(updatedForm.unloading_charge) || 0;
    const transportCharge = parseFloat(updatedForm.transport_charge) || 0;
    const otherCharges = parseFloat(updatedForm.other_charges) || 0;

    const taxableValue = itemsAmount + warpingCharge + sizingCharge + packingCharge + loadingCharge + unloadingCharge + transportCharge + otherCharges;
    
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;

    const cgstAmount = parseFloat(((cgstPct / 100) * taxableValue).toFixed(2));
    const sgstAmount = parseFloat(((sgstPct / 100) * taxableValue).toFixed(2));
    const igstAmount = parseFloat(((igstPct / 100) * taxableValue).toFixed(2));

    let netAmountRaw = taxableValue + cgstAmount + sgstAmount + igstAmount;
    const netAmountRounded = Math.round(netAmountRaw);
    const roundOff = parseFloat((netAmountRounded - netAmountRaw).toFixed(2));

    return {
      ...updatedForm,
      items: updatedItems,
      taxable_value: taxableValue,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      round_off: roundOff,
      net_amount: netAmountRounded
    };
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['qty_kg', 'rate_per_kg', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    setForm(recalculate({ ...form, items: newItems }));
  };

  const addItem = () => setForm(recalculate({ ...form, items: [...form.items, initialForm.items[0]] }));
  const removeItem = (index) => setForm(recalculate({ ...form, items: form.items.filter((_, i) => i !== index) }));

  const addTerm = () => {
    if (!newTerm.trim()) return;
    setForm({ ...form, terms_conditions: [...(form.terms_conditions || []), newTerm.trim()] });
    setNewTerm('');
  };

  const removeTerm = (idx) => {
    const newTerms = [...(form.terms_conditions || [])];
    newTerms.splice(idx, 1);
    setForm({ ...form, terms_conditions: newTerms });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await warpingSizingPOAPI.update(form.id, form);
      } else {
        await warpingSizingPOAPI.create(form);
      }
      setShowForm(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (order) => {
    setForm(order);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await warpingSizingPOAPI.delete(id);
        loadData();
      } catch (err) {
        alert("Error deleting order");
      }
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`Dinesh Textile - ${title}`, 14, 15);
    const headers = [["PO No", "Date", "Supplier", "Amount", "Status"]];
    const rows = filteredOrders.map(o => [
      o.po_no || o.po_number || '-',
      o.po_date || '-',
      o.supplier_name || o.supplier_job_worker || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit || '-',
      `Rs. ${o.net_amount?.toFixed(2) || '0.00'}`,
      o.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(o => ({
      "PO No": o.po_no || o.po_number,
      "Date": o.po_date,
      "Supplier": o.supplier_name || o.supplier_job_worker || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit,
      "Amount": o.net_amount,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredOrders = orders.filter(o => {
    return (searchTerm === '' || o.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) || o.supplier_job_worker?.toLowerCase().includes(searchTerm.toLowerCase())) &&
           (statusFilter === 'All Status' || o.status === statusFilter);
  });

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={24} color="var(--primary)" /> {title}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>{description}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Export
                </button>
                {showExportMenu && (
                  <>
                    <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                      <button onClick={() => { setShowExportMenu(false); exportPDF(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FileText size={16} color="#ef4444" /> PDF Report
                      </button>
                      <button onClick={() => { setShowExportMenu(false); exportExcel(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Table size={16} color="#10b981" /> Excel Export
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={18} /> New Order
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setStatusFilter('All Status')} style={{ cursor: 'pointer', border: statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Package size={24} /></div>
              <div className="stat-details"><h3>Total POs</h3><div className="value">{orders.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active POs</h3><div className="value">{orders.filter(o => o.status === 'Active').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setStatusFilter('Closed')} style={{ cursor: 'pointer', border: statusFilter === 'Closed' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Closed POs</h3><div className="value">{orders.filter(o => o.status === 'Closed').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search PO or Supplier..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All Status</option><option>Active</option><option>Closed</option>
            </select>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO No</th>
                  <th>Date</th>
                  <th>Supplier / Job Worker</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No orders found</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.po_no}</td>
                      <td>{order.po_date}</td>
                      <td>{order.supplier_job_worker}</td>
                      <td>₹{order.net_amount?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${order.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" style={{ color: 'var(--primary)' }} onClick={() => handleEdit(order)}><Edit2 size={16} /></button>
                        <button className="icon-btn" style={{ color: '#ef4444' }} onClick={() => handleDelete(order.id)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Edit2 size={20} color="var(--primary)" /> {form.id ? 'Edit' : 'Create'} {title}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              <button type="submit" form="warping-sizing-po-form" className="btn btn-primary"><Save size={16} /> Save Order</button>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[
              { id: 'info', label: 'Order Info', icon: FileText }, 
              { id: 'ref', label: 'Reference Info', icon: Layers }, 
              { id: 'items', label: 'Yarn Details', icon: Package }, 
              { id: 'tax', label: 'Tax & Logistics', icon: IndianRupee }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSection(tab.id);
                  const el = document.getElementById(`section-${tab.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  padding: '16px 24px', 
                  background: activeSection === tab.id ? '#fff' : 'transparent',
                  border: 'none', 
                  borderBottom: activeSection === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, 
                  color: activeSection === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <form id="warping-sizing-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
            {/* Section: Order Info */}
            <div id="section-info" className="animate-fade">
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group"><label>PO No *</label><input type="text" className="form-control" name="po_no" value={form.po_no} onChange={handleChange} required /></div>
                <div className="form-group"><label>PO Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Supplier / Job Worker</label>
                  <select className="form-control" name="supplier_job_worker" value={form.supplier_job_worker} onChange={handleChange}>
                    <option value="">Select Supplier...</option>
                    {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Supplier Code</label><input type="text" className="form-control" name="supplier_code" value={form.supplier_code} onChange={handleChange} /></div>
                <div className="form-group"><label>Delivery Date</label><input type="date" className="form-control" name="delivery_date" value={form.delivery_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Payment Terms</label><input type="text" className="form-control" name="payment_terms" value={form.payment_terms} onChange={handleChange} /></div>
                <div className="form-group"><label>Buyer Name</label><input type="text" className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option><option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Remarks</label><input type="text" className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
              </div>
            </div>

            {/* Section: Reference Info */}
            <div id="section-ref" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Reference Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="form-group"><label>Indent No</label><input type="text" className="form-control" name="indent_no" value={form.indent_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Sales Order No</label><input type="text" className="form-control" name="sales_order_no" value={form.sales_order_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Production Order No</label><input type="text" className="form-control" name="production_order_no" value={form.production_order_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Buyer Order No</label>
                  <select className="form-control" name="buyer_order_no" value={form.buyer_order_no || ''} onChange={handleChange}>
                    <option value="">Select...</option>
                    {buyerOrders.map(bo => (
                      <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Department</label>
                  <select className="form-control" name="department" value={form.department} onChange={handleChange}>
                    <option value="">Select...</option>
                    {options.masters?.department?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Yarn Details */}
            <div id="section-items" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn Details</h4>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Row</button>
              </div>
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                <table className="data-table" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Yarn Code</th>
                      <th>Yarn Name</th>
                      <th>Count</th>
                      <th>Yarn Type</th>
                      <th>Lot No</th>
                      <th>Shade</th>
                      <th>Qty (Kg)</th>
                      <th>Rate/Kg</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.yarn_code} onChange={e => updateItem(idx, 'yarn_code', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ minWidth: 140, padding: 6, margin: 0 }} value={item.yarn_name} onChange={e => updateItem(idx, 'yarn_name', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                        <td>
                          <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.yarn_type} onChange={e => updateItem(idx, 'yarn_type', e.target.value)}>
                            <option value="">Select...</option>
                            {options.masters?.yarn_type?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.lot_no} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                        <td>
                          <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.shade} onChange={e => updateItem(idx, 'shade', e.target.value)}>
                            <option value="">Select...</option>
                            {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td><input type="number" className="form-control" style={{ width: 90, padding: 6, margin: 0 }} value={item.qty_kg} onChange={e => updateItem(idx, 'qty_kg', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 90, padding: 6, margin: 0 }} value={item.rate_per_kg} onChange={e => updateItem(idx, 'rate_per_kg', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 100, padding: 6, margin: 0, background: '#f1f5f9', fontWeight: 'bold' }} value={item.amount} disabled /></td>
                        <td><button type="button" className="icon-btn" onClick={() => removeItem(idx)} style={{ color: 'red' }}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Tax Details & Delivery */}
            <div id="section-tax" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Delivery Details */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>DELIVERY DETAILS</span>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        <div className="form-group"><label>Delivery Location</label><input type="text" className="form-control" name="delivery_location" value={form.delivery_location} onChange={handleChange} /></div>
                        <div className="form-group"><label>Dispatch Mode</label><input type="text" className="form-control" name="dispatch_mode" value={form.dispatch_mode} onChange={handleChange} /></div>
                        <div className="form-group"><label>Transport Name</label>
                          <select className="form-control" name="transport_name" value={form.transport_name} onChange={handleChange}>
                            <option value="">Select...</option>
                            {options.masters?.transport_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="form-group"><label>Vehicle No</label><input type="text" className="form-control" name="vehicle_no" value={form.vehicle_no} onChange={handleChange} /></div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Delivery Instructions</label><input type="text" className="form-control" name="delivery_instructions" value={form.delivery_instructions} onChange={handleChange} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TERMS & CONDITIONS</span>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(form.terms_conditions || []).map((term, idx) => (
                          <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {editingTermIdx === idx ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13, border: '1px solid var(--primary)' }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}} />
                                <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={14} /></button>
                                <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingTermIdx(null)}><X size={14} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span>{term}</span>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm({ ...form, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) })} title="Delete"><Trash2 size={13} /></button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input type="text" className="form-control" placeholder="Add new term or condition..." style={{ margin: 0 }} value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTerm())} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={addTerm}>
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tax & Charges Details */}
                <div style={{ width: 350, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ORDER SUMMARY</span>
                    </div>
                    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Value</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>INR {(form.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Warping Charge</span>
                        <input 
                          type="number" 
                          name="warping_charge" 
                          value={form.warping_charge} 
                          onChange={handleChange} 
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Sizing Charge</span>
                        <input 
                          type="number" 
                          name="sizing_charge" 
                          value={form.sizing_charge} 
                          onChange={handleChange} 
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Packing Charge</span>
                        <input 
                          type="number" 
                          name="packing_charge" 
                          value={form.packing_charge} 
                          onChange={handleChange} 
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading Charge</span>
                        <input 
                          type="number" 
                          name="loading_charge" 
                          value={form.loading_charge} 
                          onChange={handleChange} 
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Unloading Charge</span>
                        <input 
                          type="number" 
                          name="unloading_charge" 
                          value={form.unloading_charge} 
                          onChange={handleChange} 
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Transport Charge</span>
                        <input 
                          type="number" 
                          name="transport_charge" 
                          value={form.transport_charge} 
                          onChange={handleChange} 
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Other Charges</span>
                        <input 
                          type="number" 
                          name="other_charges" 
                          value={form.other_charges} 
                          onChange={handleChange} 
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST</span>
                          <input 
                            type="number" 
                            name="cgst_pct" 
                            value={form.cgst_pct} 
                            onChange={handleChange} 
                            style={{
                              width: '60px',
                              textAlign: 'right',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              background: 'transparent'
                            }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>%</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST</span>
                          <input 
                            type="number" 
                            name="sgst_pct" 
                            value={form.sgst_pct} 
                            onChange={handleChange} 
                            style={{
                              width: '60px',
                              textAlign: 'right',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              background: 'transparent'
                            }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>%</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST</span>
                          <input 
                            type="number" 
                            name="igst_pct" 
                            value={form.igst_pct} 
                            onChange={handleChange} 
                            style={{
                              width: '60px',
                              textAlign: 'right',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                              background: 'transparent'
                            }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>%</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Round Off</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.round_off?.toFixed(2)}</span>
                      </div>
                      <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Net Amount</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
