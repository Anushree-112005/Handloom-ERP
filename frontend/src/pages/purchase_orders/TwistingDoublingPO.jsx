import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, Layers, FileText, IndianRupee, Download, Table, ArrowLeft } from 'lucide-react';
import { twistingDoublingPOAPI, partyAPI, dropdownAPI, buyerOrderAPI, designEntryAPI } from '../../services/api';
import CustomPODocumentPreview from '../../components/CustomPODocumentPreview';

export default function TwistingDoublingPO() {
  const title = 'Twisting / Doubling PO';
  const description = 'Manage twisting and doubling orders';
  const Icon = Layers;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  
  const initialForm = {
    po_no: '',
    po_date: new Date().toISOString().split('T')[0],
    supplier_worker: '',
    supplier_code: '',
    delivery_date: '',
    payment_terms: '',
    buyer_name: '',
    status: 'Active',
    remarks: '',

    ref_no_1: '',
    buyer_order_no: '',
    design_no: '',
    entry_against: '',
    packing_type: '',

    tax_type: '',
    gross_amt: 0,
    transport_charge: 0,
    packing_charge: 0,
    taxable_amount: 0,
    total_order_kgs: 0,
    cgst_pct: 0,
    cgst_amount: 0,
    sgst_pct: 0,
    sgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    net_amount: 0,

    delivery_location: '',
    dispatch_mode: '',
    transport_name: '',
    vehicle_type: '',
    delivery_instructions: '',
    terms_conditions: [
      'Material not meeting our specification and standards will be returned',
      'Demanded Qty to be supplied in whole and excess/short supply will not be accepted.',
      'Send Invoice along with Material.',
      'Defective and damage pieces will not be accepted.',
      'Start bulk production only after getting the sample Approval.',
      'Subject to Namakkal Jurisdiction.'
    ],

    items: [{
      fibre_group: '', yarn_count: '', mill_name: '', design_no: '', colour: '', conversion_count: '', order_kgs: 0, job_work_charge: 0, tolerance_pct: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);
  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('info');
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes, dsRes] = await Promise.all([
        twistingDoublingPOAPI.list(),
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

  const generateNextPONo = (existingOrders) => {
    let maxNum = 0;
    const prefix = 'TD-';
    (existingOrders || []).forEach(o => {
      const poStr = o.po_no || '';
      if (poStr.toUpperCase().startsWith(prefix)) {
        const numPart = poStr.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(4, '0');
    return `${prefix}${padded}`;
  };

  const handleNewOrder = () => {
    const nextPONo = generateNextPONo(orders);
    setForm({
      ...initialForm,
      po_no: nextPONo,
      delivery_location: '1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008.'
    });
    setShowForm(true);
  };

  const recalculate = (updatedForm) => {
    const updatedItems = (updatedForm.items || []).map(item => {
      const qty = parseFloat(item.order_kgs) || 0;
      const charge = parseFloat(item.job_work_charge) || 0;
      return { ...item, amount: parseFloat((qty * charge).toFixed(2)) };
    });

    const itemsAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const grossAmt = itemsAmount;
    const freight = parseFloat(updatedForm.transport_charge) || 0;
    const insurance = parseFloat(updatedForm.packing_charge) || 0;
    const taxableValue = grossAmt + freight + insurance;
    const totalOrderKgs = updatedItems.reduce((sum, item) => sum + (item.order_kgs || 0), 0);

    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;

    const cgstAmount = parseFloat(((cgstPct / 100) * taxableValue).toFixed(2));
    const sgstAmount = parseFloat(((sgstPct / 100) * taxableValue).toFixed(2));
    const igstAmount = parseFloat(((igstPct / 100) * taxableValue).toFixed(2));

    let netAmountRaw = taxableValue + cgstAmount + sgstAmount + igstAmount;
    const netAmountRounded = Math.round(netAmountRaw);

    return {
      ...updatedForm,
      items: updatedItems,
      gross_amt: grossAmt,
      taxable_amount: taxableValue,
      total_order_kgs: totalOrderKgs,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      net_amount: netAmountRounded
    };
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;

    if (name === 'buyer_order_no') {
      const bo = buyerOrders.find(b => b.ibpo_number === value);
      const de = designEntries.find(d => d.ibpo_no === value || d.design_no === bo?.design_no);
      
      let yarnCountVal = '';
      if (de && de.yarn_details) {
        try {
          const parsedYarn = typeof de.yarn_details === 'string' ? JSON.parse(de.yarn_details) : de.yarn_details;
          if (Array.isArray(parsedYarn) && parsedYarn.length > 0) yarnCountVal = parsedYarn[0].yarn_count || '';
        } catch (err) {}
      }

      const updatedItems = [...form.items];
      if (updatedItems[0]) {
        updatedItems[0].design_no = de?.design_no || bo?.design_no || '';
        updatedItems[0].yarn_count = yarnCountVal || updatedItems[0].yarn_count;
        updatedItems[0].colour = bo?.fabric_color || de?.fabric_color || de?.color || updatedItems[0].colour;
      }
      setForm(recalculate({
        ...form,
        buyer_order_no: value,
        buyer_name: bo?.party_name || bo?.buyer_name || de?.buyer_name || form.buyer_name,
        design_no: de?.ds_ref_no || form.design_no,
        items: updatedItems
      }));
      return;
    }

    if (name === 'design_no') {
      const de = designEntries.find(d => d.ds_ref_no === value || d.design_no === value);
      
      let yarnCountVal = '';
      if (de && de.yarn_details) {
        try {
          const parsedYarn = typeof de.yarn_details === 'string' ? JSON.parse(de.yarn_details) : de.yarn_details;
          if (Array.isArray(parsedYarn) && parsedYarn.length > 0) yarnCountVal = parsedYarn[0].yarn_count || '';
        } catch (err) {}
      }

      const updatedItems = [...form.items];
      if (updatedItems[0]) {
        updatedItems[0].design_no = de?.design_no || value;
        updatedItems[0].yarn_count = yarnCountVal || updatedItems[0].yarn_count;
        updatedItems[0].colour = de?.fabric_color || de?.color || updatedItems[0].colour;
      }
      setForm(recalculate({
        ...form,
        design_no: value,
        buyer_name: de?.buyer_name || form.buyer_name,
        items: updatedItems
      }));
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['order_kgs', 'job_work_charge', 'tolerance_pct', 'amount'].includes(field)) val = parseFloat(value) || 0;
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
        await twistingDoublingPOAPI.update(form.id, payload);
      } else {
        await twistingDoublingPOAPI.create(payload);
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
        await twistingDoublingPOAPI.delete(id);
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
    const matchesSearch = searchTerm === '' ||
      o.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier_worker?.toLowerCase().includes(searchTerm.toLowerCase());
      
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
              <button className="btn btn-primary" onClick={handleNewOrder}>
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
                  <th>SUPPLIER / JOB WORKER</th>
                  <th>TOTAL AMOUNT</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No orders found</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{order.po_no}</td>
                      <td>{order.po_date}</td>
                      <td style={{ fontWeight: 500 }}>{order.supplier_worker}</td>
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
            title="TWISTING/DOUBLING PO"
            poNumber={selectedViewOrder?.po_no}
            poDate={selectedViewOrder?.po_date}
            deliveryAt={selectedViewOrder?.delivery_location || "1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008."}
            supplierName={selectedViewOrder?.supplier_worker}
            agentName=""
            designNo={selectedViewOrder?.sales_order_no || '-'}
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
              transport: "-",
              delivery_date: selectedViewOrder?.delivery_date || "-",
              payment_terms: selectedViewOrder?.payment_terms || "-"
            }}
            tableHeaders={[
              { label: 'Fibre Group', align: 'left', width: '15%' },
              { label: 'Yarn Count', align: 'left', width: '15%' },
              { label: 'Design/Color', align: 'left', width: '20%' },
              { label: 'Conv. Count', align: 'left', width: '15%' },
              { label: 'Kgs', align: 'right', width: '10%' },
              { label: 'Charge', align: 'right', width: '10%' },
              { label: 'Amount', align: 'right', width: '15%' }
            ]}
            tableRows={(selectedViewOrder?.items || []).map(i => ({
              rowData: [
                i.fibre_group || '-',
                i.yarn_count || '-',
                `${i.design_no || '-'} / ${i.colour || '-'}`,
                i.conversion_count || '-',
                parseFloat(i.order_kgs || 0).toFixed(2),
                parseFloat(i.job_work_charge || 0).toFixed(2),
                parseFloat(i.amount || 0).toFixed(2)
              ],
              rowNote: i.mill_name ? `Mill: ${i.mill_name} | Tol: ${i.tolerance_pct}%` : null
            }))}
          />
      ) : (
        <div className="card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => setShowForm(false)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {form.id ? 'Edit' : 'Create'} {title}
            </h2>
          </div>



          <form id="td-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
            {/* Header Section */}
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 24, gap: '12px 24px' }}>
              <div className="form-group"><label>Ref. No</label><input type="text" className="form-control" name="ref_no_1" value={form.ref_no_1} onChange={handleChange} /></div>
              <div className="form-group"><label>Order Date</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
              <div className="form-group"><label>Org. Name</label><input type="text" className="form-control" value="DEPL" disabled /></div>
              <div className="form-group"><label>PO No *</label><input type="text" className="form-control" name="po_no" value={form.po_no} onChange={handleChange} required /></div>
              <div className="form-group"><label>Order No *</label>
                <select className="form-control" name="buyer_order_no" value={form.buyer_order_no || ''} onChange={handleChange} required>
                  <option value="">Select Order...</option>
                  {buyerOrders.map(bo => (
                    <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>Design Entry ID *</label>
                <select className="form-control" name="design_no" value={form.design_no || ''} onChange={handleChange} required>
                  <option value="">Select Design...</option>
                  {designEntries.map(de => (
                    <option key={de.id} value={de.ds_ref_no}>{de.ds_ref_no} ({de.design_no})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}><label>JobWorker Name</label>
                <select className="form-control" name="supplier_worker" value={form.supplier_worker} onChange={handleChange}>
                  <option value="-">-</option>
                  {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Delivery At</label>
                <input type="text" className="form-control" name="delivery_location" value={form.delivery_location} onChange={handleChange} />
              </div>
            </div>

            {/* Middle Section: Yarn Count Details */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff', marginBottom: 24 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Yarn Count Details</span>
              </div>
              <div style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex' }}>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '130px 1fr 100px 1fr', gap: '14px 16px', alignItems: 'center' }}>
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>FIBRE GROUP</label>
                    <select className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13, gridColumn: 'span 3' }} value={form.items[0]?.fibre_group || ''} onChange={e => updateItem(0, 'fibre_group', e.target.value)}>
                      <option value="-">-</option>
                      {options.masters?.department?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>YARN COUNT</label>
                    <select className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13, gridColumn: 'span 3' }} value={form.items[0]?.yarn_count || ''} onChange={e => updateItem(0, 'yarn_count', e.target.value)}>
                      <option value="-">-</option>
                      {options.masters?.yarn_count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                      {options.masters?.count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>MILL NAME</label>
                    <input type="text" className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13, gridColumn: 'span 3' }} value={form.items[0]?.mill_name || ''} onChange={e => updateItem(0, 'mill_name', e.target.value)} />
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>DESIGN NO</label>
                    <select className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13 }} value={form.items[0]?.design_no || ''} onChange={e => updateItem(0, 'design_no', e.target.value)}>
                      <option value="-">-</option>
                      {options.masters?.design_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>COLOUR</label>
                    <select className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13 }} value={form.items[0]?.colour || ''} onChange={e => updateItem(0, 'colour', e.target.value)}>
                      <option value="-">-</option>
                      {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>CONVERSION<br/>COUNT</label>
                    <select className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13, gridColumn: 'span 3' }} value={form.items[0]?.conversion_count || ''} onChange={e => updateItem(0, 'conversion_count', e.target.value)}>
                      <option value="-">-</option>
                      {options.masters?.yarn_count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                      {options.masters?.count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>ORDER KGS</label>
                    <input type="number" className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13 }} value={form.items[0]?.order_kgs || ''} onChange={e => updateItem(0, 'order_kgs', e.target.value)} />
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>JOBWORK<br/>CHARGE</label>
                    <input type="number" className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13 }} value={form.items[0]?.job_work_charge || ''} onChange={e => updateItem(0, 'job_work_charge', e.target.value)} />
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>TOLERENCE %</label>
                    <input type="number" className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13 }} value={form.items[0]?.tolerance_pct || ''} onChange={e => updateItem(0, 'tolerance_pct', e.target.value)} />
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>AMOUNT</label>
                    <input type="number" className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13, background: '#f1f5f9' }} value={form.items[0]?.amount || ''} disabled />
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px', lineHeight: 1.2 }}>TOTAL STOCK KGS</label>
                    <input type="text" className="form-control" style={{ margin: 0, padding: '6px 12px', fontSize: 13, background: '#f1f5f9' }} disabled />
                    
                    <label style={{ margin: 0, fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px', lineHeight: 1.2 }}>ENTRY AGAINST</label>
                    <select className="form-control" name="entry_against" value={form.entry_against} onChange={handleChange} style={{ margin: 0, padding: '6px 12px', fontSize: 13 }}>
                      <option value="-">-</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Tax & Logistics */}
            <div id="section-tax" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Terms and Conditions */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TERMS & CONDITIONS</span>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a32fa', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm({ ...form, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) })} title="Delete"><Trash2 size={13} /></button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input type="text" className="form-control" placeholder="Add new term or condition..." style={{ margin: 0 }} value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTerm())} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px 16px', background: '#5a32fa', borderColor: '#5a32fa' }} onClick={addTerm}>
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ORDER SUMMARY */}
                <div style={{ flex: '0 0 350px', position: 'sticky', top: 24 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ORDER SUMMARY</span>
                    </div>
                    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Amount</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>INR {(form.gross_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Charges</span>
                        <input type="number" className="form-control" name="transport_charge" value={form.transport_charge} onChange={handleChange} style={{ width: 80, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance</span>
                        <input type="number" className="form-control" name="packing_charge" value={form.packing_charge} onChange={handleChange} style={{ width: 80, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                          <input type="number" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                          <input type="number" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                          <input type="number" name="igst_pct" value={form.igst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Order Kgs</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.total_order_kgs || 0).toFixed(2)}</span>
                      </div>

                      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>GRAND TOTAL</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#5a32fa' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Close
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
