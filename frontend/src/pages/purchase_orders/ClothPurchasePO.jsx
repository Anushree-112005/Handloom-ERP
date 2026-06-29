import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, FileText, Layers, IndianRupee, Download, Table } from 'lucide-react';
import { clothPurchasePOAPI, partyAPI, dropdownAPI, buyerOrderAPI, designEntryAPI } from '../../services/api';
import CustomPODocumentPreview from '../../components/CustomPODocumentPreview';

export default function ClothPurchasePO() {
  const title = 'Cloth Purchase PO';
  const description = 'Manage raw cloth purchases from suppliers';
  const Icon = Package;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeSection, setActiveSection] = useState('info');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  
  const initialForm = {
    po_no: '',
    po_date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    supplier_code: '',
    contact_person: '',
    mobile_no: '',
    gst_no: '',
    delivery_date: '',
    payment_terms: '',
    status: 'Active',
    remarks: '',

    indent_no: '',
    requisition_no: '',
    buyer_order_no: '',
    design_no: '',
    department: '',
    purchase_type: 'Local',

    tax_type: 'GST',
    taxable_value: 0,
    discount_pct: 0,
    discount_amount: 0,
    packing_charges: 0,
    freight_charges: 0,
    loading_charges: 0,
    unloading_charges: 0,
    other_charges: 0,
    cgst_pct: 2.5,
    cgst_amount: 0,
    sgst_pct: 2.5,
    sgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    round_off: 0,
    net_amount: 0,

    delivery_address: '',
    delivery_location: '',
    transport_name: '',
    lr_no: '',
    vehicle_no: '',
    expected_delivery_date: '',
    delivery_instructions: '',
    terms_conditions: [
      "Material not meeting our specification and standards will be returned",
      "Demanded Qty to be supplied in whole and excess/short supply will not be accepted.",
      "Send Invoice along with Material.",
      "Defective and damage pieces will not be accepted.",
      "Subject to Namakkal Jurisdiction."
    ],

    items: [{
      fabric_code: '', fabric_name: '', design_no: '', fabric_type: '', construction: '', composition: '', gsm: '', width: '', color: '', uom: 'MTRS', quantity: 0, rate: 0, amount: 0
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
  const [designEntries, setDesignEntries] = useState([]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes, dsRes] = await Promise.all([
        clothPurchasePOAPI.list(),
        partyAPI.list(),
        dropdownAPI.getAll(),
        buyerOrderAPI.list(),
        designEntryAPI.list()
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setBuyerOrders(buyerOrdRes.data || []);
      setDesignEntries(dsRes.data || []);
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
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return { ...item, amount: parseFloat((qty * rate).toFixed(2)) };
    });

    const itemsAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const discountPct = parseFloat(updatedForm.discount_pct) || 0;
    const discountAmount = parseFloat(((discountPct / 100) * itemsAmount).toFixed(2));
    
    const packingCharges = parseFloat(updatedForm.packing_charges) || 0;
    const freightCharges = parseFloat(updatedForm.freight_charges) || 0;
    const loadingCharges = parseFloat(updatedForm.loading_charges) || 0;
    const unloadingCharges = parseFloat(updatedForm.unloading_charges) || 0;
    const otherCharges = parseFloat(updatedForm.other_charges) || 0;

    const taxableValue = (itemsAmount - discountAmount) + packingCharges + freightCharges + loadingCharges + unloadingCharges + otherCharges;
    const taxType = updatedForm.tax_type || 'GST';
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxType === 'GST') {
      cgstAmount = parseFloat(((cgstPct / 100) * taxableValue).toFixed(2));
      sgstAmount = parseFloat(((sgstPct / 100) * taxableValue).toFixed(2));
    } else if (taxType === 'IGST') {
      igstAmount = parseFloat(((igstPct / 100) * taxableValue).toFixed(2));
    }

    let netAmountRaw = taxableValue + cgstAmount + sgstAmount + igstAmount;
    const netAmountRounded = Math.round(netAmountRaw);
    const roundOff = parseFloat((netAmountRounded - netAmountRaw).toFixed(2));

    return {
      ...updatedForm,
      items: updatedItems,
      discount_amount: discountAmount,
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

    if (name === 'tax_type') {
      let taxUpdates = { tax_type: value };
      if (value === 'GST') {
        taxUpdates = { ...taxUpdates, sgst_pct: 2.5, cgst_pct: 2.5, igst_pct: 0 };
      } else if (value === 'IGST') {
        taxUpdates = { ...taxUpdates, sgst_pct: 0, cgst_pct: 0, igst_pct: 5.0 };
      } else if (value === 'Exempt') {
        taxUpdates = { ...taxUpdates, sgst_pct: 0, cgst_pct: 0, igst_pct: 0 };
      }
      setForm(recalculate({ ...form, ...taxUpdates }));
      return;
    }

    if (name === 'design_no') {
      const de = designEntries.find(d => d.ds_ref_no === value || d.design_no === value);
      const updatedItems = [...form.items];
      if (updatedItems[0]) {
        updatedItems[0].design_no = value;
      }
      setForm(recalculate({
        ...form,
        design_no: value,
        contact_person: de?.buyer_name || form.contact_person,
        items: updatedItems
      }));
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['quantity', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
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
      const payload = { ...form };
      if (!payload.delivery_date) payload.delivery_date = null;

      if (form.id) {
        await clothPurchasePOAPI.update(form.id, payload);
      } else {
        await clothPurchasePOAPI.create(payload);
      }
      setShowForm(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message));
    }
  };

  const handleEdit = (order) => {
    setForm(order);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await clothPurchasePOAPI.delete(id);
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
      o.supplier_name || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit || '-',
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
      "Supplier": o.supplier_name || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit,
      "Amount": o.net_amount,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchTerm === '' ||
      o.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All Status' || o.status === statusFilter;
    
    let matchesDate = true;
    if (o.po_date) {
      const entryDate = new Date(o.po_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="animate-fade">
      {!showForm && !selectedViewOrder ? (
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

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search PO or Supplier..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option><option>Active</option><option>Closed</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO NO</th>
                  <th>DATE</th>
                  <th>SUPPLIER NAME</th>
                  <th>PURCHASE TYPE</th>
                  <th>TOTAL AMOUNT</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No orders found</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{order.po_no}</td>
                      <td>{order.po_date}</td>
                      <td style={{ fontWeight: 500 }}>{order.supplier_name}</td>
                      <td>{order.purchase_type}</td>
                      <td style={{ fontWeight: 600 }}>₹{order.net_amount?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className={`badge ${order.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>
                          {order.status === 'Active' ? 'Open' : order.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setSelectedViewOrder(order)}
                            title="Full View"
                          >
                            <Eye size={14} color="var(--primary)" />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(order)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleDelete(order.id)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedViewOrder ? (
          <CustomPODocumentPreview
            isOpen={!!selectedViewOrder}
            onClose={() => setSelectedViewOrder(null)}
            title="CLOTH PURCHASE ORDER"
            poNumber={selectedViewOrder?.po_no}
            poDate={selectedViewOrder?.po_date}
            deliveryAt={selectedViewOrder?.delivery_at || '1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008.'}
            supplierName={selectedViewOrder?.supplier_name}
            agentName=""
            designNo={selectedViewOrder?.against_ref || '-'}
            commission="0.00"
            terms={selectedViewOrder?.terms_conditions || []}
            taxes={{
              cgst_pct: selectedViewOrder?.cgst_pct || 0, cgst_amt: selectedViewOrder?.cgst_amount || 0,
              sgst_pct: selectedViewOrder?.sgst_pct || 0, sgst_amt: selectedViewOrder?.sgst_amount || 0,
              igst_pct: selectedViewOrder?.igst_pct || 0, igst_amt: selectedViewOrder?.igst_amount || 0
            }}
            freightChg={parseFloat(selectedViewOrder?.transport_charge || 0) + parseFloat(selectedViewOrder?.loading_charge || 0) + parseFloat(selectedViewOrder?.unloading_charge || 0)}
            insuranceChg={parseFloat(selectedViewOrder?.packing_charge || 0) + parseFloat(selectedViewOrder?.other_charges || 0)}
            netAmount={selectedViewOrder?.net_amount || 0}
            logistics={{
              freight_type: "-",
              transport: selectedViewOrder?.dispatch_through || "-",
              delivery_date: "-",
              payment_terms: selectedViewOrder?.payment_terms || "-"
            }}
            tableHeaders={[
              { label: 'Fabric Name', align: 'left', width: '30%' },
              { label: 'Color', align: 'left', width: '15%' },
              { label: 'GSM / Width', align: 'center', width: '15%' },
              { label: 'Qty Mtrs', align: 'right', width: '15%' },
              { label: 'Rate/Mtr', align: 'right', width: '10%' },
              { label: 'Amount', align: 'right', width: '15%' }
            ]}
            tableRows={(selectedViewOrder?.items || []).map(i => ({
              rowData: [
                i.fabric_name || '-',
                i.color || '-',
                `${i.gsm || '-'} / ${i.width || '-'}`,
                parseFloat(i.qty_mtrs || 0).toFixed(2),
                parseFloat(i.rate_per_mtr || 0).toFixed(2),
                parseFloat(i.amount || 0).toFixed(2)
              ],
              rowNote: i.fabric_code ? `Fabric Code: ${i.fabric_code} | Design No: ${i.design_no || '-'}` : null
            }))}
          />
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Edit2 size={20} color="var(--primary)" /> {form.id ? 'Edit' : 'Create'} {title}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              <button type="submit" form="cloth-purchase-po-form" className="btn btn-primary"><Save size={16} /> Save Order</button>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[
              { id: 'info', label: 'Order Info', icon: FileText }, 
              { id: 'ref', label: 'Reference Info', icon: Layers }, 
              { id: 'items', label: 'Fabric Details', icon: Package }, 
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

          <form id="cloth-purchase-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
            {/* Section: Order Info */}
            <div id="section-info" className="animate-fade">
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="form-group"><label>PO No *</label><input type="text" className="form-control" name="po_no" value={form.po_no} onChange={handleChange} required /></div>
                <div className="form-group"><label>PO Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Supplier Name</label>
                  <select className="form-control" name="supplier_name" value={form.supplier_name} onChange={handleChange}>
                    <option value="">Select Supplier...</option>
                    {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Supplier Code</label><input type="text" className="form-control" name="supplier_code" value={form.supplier_code} onChange={handleChange} /></div>
                
                <div className="form-group"><label>Contact Person</label><input type="text" className="form-control" name="contact_person" value={form.contact_person} onChange={handleChange} /></div>
                <div className="form-group"><label>Mobile No</label><input type="text" className="form-control" name="mobile_no" value={form.mobile_no} onChange={handleChange} /></div>
                <div className="form-group"><label>GST No</label><input type="text" className="form-control" name="gst_no" value={form.gst_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Delivery Date</label><input type="date" className="form-control" name="delivery_date" value={form.delivery_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Payment Terms</label><input type="text" className="form-control" name="payment_terms" value={form.payment_terms} onChange={handleChange} /></div>
                
                <div className="form-group"><label>Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option><option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><input type="text" className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
              </div>
            </div>

            {/* Section: Reference Info */}
            <div id="section-ref" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Reference Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                <div className="form-group"><label>Indent No</label><input type="text" className="form-control" name="indent_no" value={form.indent_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Requisition No</label><input type="text" className="form-control" name="requisition_no" value={form.requisition_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Buyer Order No *</label>
                  <select className="form-control" name="buyer_order_no" value={form.buyer_order_no || ''} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {buyerOrders.map(bo => (
                      <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Design No *</label>
                  <select className="form-control" name="design_no" value={form.design_no || ''} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {designEntries.map(de => (
                      <option key={de.id} value={de.ds_ref_no}>{de.ds_ref_no} ({de.design_no})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Department</label>
                  <select className="form-control" name="department" value={form.department} onChange={handleChange}>
                    <option value="">Select...</option>
                    {options.masters?.department?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Purchase Type</label>
                  <select className="form-control" name="purchase_type" value={form.purchase_type} onChange={handleChange}>
                    <option value="Local">Local</option><option value="Import">Import</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Fabric Details */}
            <div id="section-items" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabric Details</h4>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Row</button>
              </div>
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                <table className="data-table" style={{ minWidth: '1600px' }}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Fabric Code</th>
                      <th>Fabric Name</th>
                      <th>Design No</th>
                      <th>Fabric Type</th>
                      <th>Construction</th>
                      <th>Composition</th>
                      <th>GSM</th>
                      <th>Width</th>
                      <th>Color</th>
                      <th>UOM</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.fabric_code} onChange={e => updateItem(idx, 'fabric_code', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ minWidth: 140, padding: 6, margin: 0 }} value={item.fabric_name} onChange={e => updateItem(idx, 'fabric_name', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.design_no} onChange={e => updateItem(idx, 'design_no', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.fabric_type} onChange={e => updateItem(idx, 'fabric_type', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.construction} onChange={e => updateItem(idx, 'construction', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.composition} onChange={e => updateItem(idx, 'composition', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.gsm} onChange={e => updateItem(idx, 'gsm', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.width} onChange={e => updateItem(idx, 'width', e.target.value)} /></td>
                        <td>
                          <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)}>
                            <option value="">Select...</option>
                            {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td>
                          <select className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.uom} onChange={e => updateItem(idx, 'uom', e.target.value)}>
                            <option>MTRS</option><option>KGS</option><option>PCS</option>
                          </select>
                        </td>
                        <td><input type="number" className="form-control" style={{ width: 90, padding: 6, margin: 0 }} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 90, padding: 6, margin: 0 }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
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
                      <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Delivery Address</label><input type="text" className="form-control" name="delivery_address" value={form.delivery_address} onChange={handleChange} /></div>
                        <div className="form-group"><label>Delivery Location</label><input type="text" className="form-control" name="delivery_location" value={form.delivery_location} onChange={handleChange} /></div>
                        <div className="form-group"><label>Transport Name</label>
                          <select className="form-control" name="transport_name" value={form.transport_name} onChange={handleChange}>
                            <option value="">Select...</option>
                            {options.masters?.transport_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="form-group"><label>LR No</label><input type="text" className="form-control" name="lr_no" value={form.lr_no} onChange={handleChange} /></div>
                        <div className="form-group"><label>Vehicle No</label><input type="text" className="form-control" name="vehicle_no" value={form.vehicle_no} onChange={handleChange} /></div>
                        <div className="form-group"><label>Expected Delivery Date</label><input type="date" className="form-control" name="expected_delivery_date" value={form.expected_delivery_date} onChange={handleChange} /></div>
                        <div className="form-group"><label>Delivery Instructions</label><input type="text" className="form-control" name="delivery_instructions" value={form.delivery_instructions} onChange={handleChange} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Tax Details */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff', marginBottom: 24 }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TAX DETAILS</span>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      <div className="form-row" style={{ 
                        gridTemplateColumns: form.tax_type === 'GST' ? 'repeat(3, 1fr)' : form.tax_type === 'IGST' ? 'repeat(2, 1fr)' : '1fr', 
                        margin: 0 
                      }}>
                        <div className="form-group"><label>Tax Type</label>
                          <select className="form-control" name="tax_type" value={form.tax_type || 'GST'} onChange={handleChange}>
                            <option value="GST">GST</option>
                            <option value="IGST">IGST</option>
                            <option value="Exempt">Exempt</option>
                          </select>
                        </div>
                        {(form.tax_type === 'GST' || !form.tax_type) && (
                          <>
                            <div className="form-group"><label>SGST %</label><input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} /></div>
                            <div className="form-group"><label>CGST %</label><input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} /></div>
                          </>
                        )}
                        {form.tax_type === 'IGST' && (
                          <div className="form-group"><label>IGST %</label><input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} /></div>
                        )}
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
                
                {/* ORDER SUMMARY */}
                <div style={{ width: 350, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ORDER SUMMARY</span>
                    </div>
                    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Base Items Amount</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {(form.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Discount</span>
                          <input 
                            type="number" 
                            name="discount_pct" 
                            value={form.discount_pct} 
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
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>- {(form.discount_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Value</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>INR {(form.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Packing Charges</span>
                        <input 
                          type="number" 
                          name="packing_charges" 
                          value={form.packing_charges} 
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Charges</span>
                        <input 
                          type="number" 
                          name="freight_charges" 
                          value={form.freight_charges} 
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading Charges</span>
                        <input 
                          type="number" 
                          name="loading_charges" 
                          value={form.loading_charges} 
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Unloading Charges</span>
                        <input 
                          type="number" 
                          name="unloading_charges" 
                          value={form.unloading_charges} 
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

                      {(form.tax_type === 'GST' || !form.tax_type) && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST ({form.cgst_pct || 0}%)</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST ({form.sgst_pct || 0}%)</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}

                      {form.tax_type === 'IGST' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST ({form.igst_pct || 0}%)</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      
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
