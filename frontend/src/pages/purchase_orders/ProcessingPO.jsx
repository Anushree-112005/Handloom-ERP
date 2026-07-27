import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, FileText, Layers, IndianRupee, Scissors, Download, Table, ArrowLeft } from 'lucide-react';
import { processingPOAPI, partyAPI, dropdownAPI, buyerOrderAPI, designEntryAPI } from '../../services/api';
import CustomPODocumentPreview from '../../components/CustomPODocumentPreview';

export default function ProcessingPO() {
  const title = 'Processing PO';
  const description = 'Manage processing purchase orders';
  const Icon = Scissors;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeSection, setActiveSection] = useState('info');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  
  const initialForm = {
    po_s_no: '',
    po_date: new Date().toISOString().split('T')[0],
    party_name: '',
    po_no: '',
    delivery_date: '',
    buyer_order_no: '',
    design_no: '',
    
    merchandiser: '',
    merchandiser_ext: '',
    fob_point: '',
    glm: '',
    
    process_sequence: '',
    process_sequence_ext: '',
    grey_rate: 0,
    
    order_type: '',
    order_type_ext: '',
    
    status: 'Active',
    remarks: '',

    total_mtr: 0,
    gross_amt: 0,
    
    tax_type: '',
    cgst_pct: 0,
    cgst: 0,
    sgst_pct: 0,
    sgst: 0,
    igst_pct: 0,
    igst: 0,
    total_gst: 0,
    
    payment: '',
    packing: '',
    ship_pack_chg: 0,
    add_other: 0,
    tax_value: 0,
    
    delivery_instruction: '',
    round_off: 0,
    net_amount: 0,
    terms_conditions: [
      "Material not meeting our specification and standards will be returned",
      "Demanded Qty to be supplied in whole and excess/short supply will not be accepted.",
      "Send Invoice along with Material.",
      "Defective and damage pieces will not be accepted.",
      "Start bulk production only after getting the sample Approval.",
      "Subject to Namakkal Jurisdiction."
    ],

    items: [{
      design_no: '', ibpo_no: '', fabric_construction: '', colour_process: '', mtr: 0, kgs: 0, rate: 0, amount: 0
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
        processingPOAPI.list(),
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
      const mtr = parseFloat(item.mtr) || 0;
      const rate = parseFloat(item.rate) || 0;
      return { ...item, amount: parseFloat((mtr * rate).toFixed(2)) };
    });

    const itemsAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalMtr = updatedItems.reduce((sum, item) => sum + (parseFloat(item.mtr) || 0), 0);
    
    const grossAmt = itemsAmount;
    const shipPackChg = parseFloat(updatedForm.ship_pack_chg) || 0;
    const addOther = parseFloat(updatedForm.add_other) || 0;
    
    const preTaxTotal = grossAmt + shipPackChg + addOther;
    
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;
    
    const cgstAmount = parseFloat(((cgstPct / 100) * preTaxTotal).toFixed(2));
    const sgstAmount = parseFloat(((sgstPct / 100) * preTaxTotal).toFixed(2));
    const igstAmount = parseFloat(((igstPct / 100) * preTaxTotal).toFixed(2));
    
    const totalGst = cgstAmount + sgstAmount + igstAmount;
    const taxValue = totalGst;
    
    let netAmountRaw = preTaxTotal + totalGst;
    const netAmountRounded = Math.round(netAmountRaw);
    const roundOff = parseFloat((netAmountRounded - netAmountRaw).toFixed(2));

    return {
      ...updatedForm,
      items: updatedItems,
      total_mtr: totalMtr,
      gross_amt: grossAmt,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      total_gst: totalGst,
      tax_value: taxValue,
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
        merchandiser: de?.buyer_name || form.merchandiser,
        items: updatedItems
      }));
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['mtr', 'kgs', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
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
        await processingPOAPI.update(form.id, payload);
      } else {
        await processingPOAPI.create(payload);
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
        await processingPOAPI.delete(id);
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
      o.supplier_processing_unit?.toLowerCase().includes(searchTerm.toLowerCase());
      
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
            <div className="card stat-card" onClick={() => setStatusFilter('All Status')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Package size={24} /></div>
              <div className="stat-details"><h3>Total POs</h3><div className="value">{orders.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active POs</h3><div className="value">{orders.filter(o => o.status === 'Active').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setStatusFilter('Closed')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Closed POs</h3><div className="value">{orders.filter(o => o.status === 'Closed').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search PO or Processing Unit..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                  <th>PROCESSING UNIT</th>
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
                      <td style={{ fontWeight: 500 }}>{order.supplier_processing_unit}</td>
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
            title="PROCESSING PURCHASE ORDER"
            poNumber={selectedViewOrder?.po_no}
            poDate={selectedViewOrder?.po_date}
            deliveryAt={selectedViewOrder?.delivery_at || '1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008.'}
            supplierName={selectedViewOrder?.supplier_processing_unit}
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
              { label: 'Fabric Code', align: 'left', width: '25%' },
              { label: 'Process Type', align: 'left', width: '20%' },
              { label: 'Color', align: 'left', width: '15%' },
              { label: 'Qty Mtrs', align: 'right', width: '15%' },
              { label: 'Rate', align: 'right', width: '10%' },
              { label: 'Amount', align: 'right', width: '15%' }
            ]}
            tableRows={(selectedViewOrder?.items || []).map(i => ({
              rowData: [
                i.fabric_code || '-',
                i.process_type || '-',
                i.color || '-',
                parseFloat(i.qty_mtrs || 0).toFixed(2),
                parseFloat(i.rate || 0).toFixed(2),
                parseFloat(i.amount || 0).toFixed(2)
              ]
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

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            <button
              type="button"
              style={{
                padding: '16px 24px',
                background: '#fff',
                border: 'none',
                borderBottom: '3px solid var(--primary)',
                fontWeight: 600,
                color: 'var(--primary)',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={18} /> Order Details
            </button>
          </div>

          <form id="processing-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
            {/* Section: Order Info */}
            <div id="section-info" className="animate-fade">
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="form-group"><label>PO Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                  <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                    <option value="">Select...</option>
                    {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>PO No *</label><input type="text" className="form-control" name="po_no" value={form.po_no} onChange={handleChange} required /></div>
                <div className="form-group"><label>Dely Date</label><input type="date" className="form-control" name="delivery_date" value={form.delivery_date} onChange={handleChange} /></div>
                
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
                
                <div className="form-group"><label>Merchandiser</label><input type="text" className="form-control" name="merchandiser" value={form.merchandiser} onChange={handleChange} /></div>
                <div className="form-group"><label>&nbsp;</label>
                  <select className="form-control" name="merchandiser_ext" value={form.merchandiser_ext} onChange={handleChange}>
                    <option value="">Select...</option>
                  </select>
                </div>
                <div className="form-group"><label>FOB Point</label><input type="text" className="form-control" name="fob_point" value={form.fob_point} onChange={handleChange} /></div>
                <div className="form-group"><label>GLM</label><input type="text" className="form-control" name="glm" value={form.glm} onChange={handleChange} /></div>
                <div className="form-group"><label>Order Type</label><input type="text" className="form-control" name="order_type" value={form.order_type} onChange={handleChange} /></div>
                
                <div className="form-group"><label>Process Sequence</label><input type="text" className="form-control" name="process_sequence" value={form.process_sequence} onChange={handleChange} /></div>
                <div className="form-group"><label>&nbsp;</label>
                  <select className="form-control" name="process_sequence_ext" value={form.process_sequence_ext} onChange={handleChange}>
                    <option value="">Select...</option>
                  </select>
                </div>
                <div className="form-group"><label>Grey Rate</label><input type="number" className="form-control" name="grey_rate" value={form.grey_rate} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option><option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="form-group"><label>Remarks</label><input type="text" className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
              </div>
            </div>

            {/* Section: Fabric Details */}
            <div id="section-items" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabric Details</h4>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Row</button>
              </div>
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                <table className="data-table" style={{ minWidth: '1000px' }}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Design No.</th>
                      <th>IBPO No.</th>
                      <th>Fabric Construction</th>
                      <th>Colour / Process</th>
                      <th>Mtr</th>
                      <th>Kgs</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><input type="text" className="form-control" style={{ minWidth: 100, padding: 6, margin: 0 }} value={item.design_no} onChange={e => updateItem(idx, 'design_no', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ minWidth: 100, padding: 6, margin: 0 }} value={item.ibpo_no} onChange={e => updateItem(idx, 'ibpo_no', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ minWidth: 140, padding: 6, margin: 0 }} value={item.fabric_construction} onChange={e => updateItem(idx, 'fabric_construction', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ minWidth: 120, padding: 6, margin: 0 }} value={item.colour_process} onChange={e => updateItem(idx, 'colour_process', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.mtr} onChange={e => updateItem(idx, 'mtr', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.kgs} onChange={e => updateItem(idx, 'kgs', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 100, padding: 6, margin: 0, background: '#f1f5f9', fontWeight: 'bold' }} value={item.amount} disabled /></td>
                        <td><button type="button" className="icon-btn" onClick={() => removeItem(idx)} style={{ color: 'red' }}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Tax & Logistics */}
            <div id="section-tax" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Tax Type</span>
                        <select className="form-control" name="tax_type" value={form.tax_type || 'GST'} onChange={handleChange} style={{ width: 100, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }}>
                          <option value="GST">GST</option>
                          <option value="IGST">IGST</option>
                          <option value="Exempt">Exempt</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Amount</span>
                        <input type="number" value={form.gross_amt} disabled style={{ width: '100px', textAlign: 'right', border: '1px solid transparent', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', background: 'transparent' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Ship/Pack Chg</span>
                        <input type="number" name="ship_pack_chg" value={form.ship_pack_chg} onChange={handleChange} style={{ width: '100px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', background: 'transparent' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Add Other</span>
                        <input type="number" name="add_other" value={form.add_other} onChange={handleChange} style={{ width: '100px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', background: 'transparent' }} />
                      </div>

                      <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }}></div>

                      {(form.tax_type === 'GST' || !form.tax_type) && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                              <input type="number" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                              <input type="number" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}

                      {form.tax_type === 'IGST' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                            <input type="number" name="igst_pct" value={form.igst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Mtr</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.total_mtr || 0}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Round Off</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.round_off?.toFixed(2)}</span>
                      </div>
                      
                      <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>GRAND TOTAL</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
