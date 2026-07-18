import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, ShoppingCart, FileText, Download, Filter, ArrowLeft, Printer, Mail, DollarSign, Send, CheckCircle, Clock } from 'lucide-react';
import { buyerOrderAPI, proformaInvoiceAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ProformaInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');
  const [newTermVal, setNewTermVal] = useState('');
  
  const defaultTerms = [
    "Invoice valid for specified validity period.",
    "Goods once dispatched cannot be cancelled.",
    "Delivery subject to production completion.",
    "Payment as per agreed payment terms.",
    "Quality inspection before shipment.",
    "Taxes applicable as per government regulations."
  ];
  
  const initialForm = {
    pi_number: '',
    pi_date: '',
    payment_mode: '',
    revised_on: '',
    consignee: '',
    delivery_at: '',
    billing_address: '',
    delivery_address: '',
    revision_notes: '',
    special_instructions: '',
    items: [
      { ibpo_no: '', style: '', description: '', pattern: '', composition: '', po_number: '', delivery_date: '', quantity: 0, rate: 0, amount: 0 }
    ],
    total_quantity: 0,
    total_bale: 0,
    other_charges: 0,
    less_pct: 0,
    freight_charges: 0,
    packing_charges: 0,
    insurance_charges: 0,
    tax_type: 'GST',
    cgst_pct: 0,
    sgst_pct: 0,
    igst_pct: 0,
    tcs_amount: 0,
    discount_pct: 0,
    taxable_amount: 0,
    tax_amount: 0,
    gst_amount: 0,
    gross_amount: 0,
    rounded_off: 0,
    net_amount: 0,
    terms_conditions: [...defaultTerms],
    approval_status: 'Pending'
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchBuyerOrders();
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await proformaInvoiceAPI.list();
      setInvoices(res.data || []);
    } catch (e) {
      console.error('Failed to fetch proforma invoices', e);
    }
  };

  const fetchBuyerOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrders(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const getNextPINumber = () => {
    return `PI-${String(invoices.length + 1).padStart(4, '0')}`;
  };

  const handleOpenForm = (invoice = null, readOnly = false) => {
    if (invoice) {
      setForm(invoice);
      setEditingId(invoice.id);
    } else {
      setForm({ ...initialForm, pi_number: getNextPINumber(), pi_date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setShowForm(true);
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      return calculateSummary(newForm);
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['quantity', 'rate'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;
    newItems[index].amount = (newItems[index].quantity * newItems[index].rate) || 0;
    
    // Auto-fill logic when IBPO No is selected
    if (field === 'ibpo_no') {
      const bo = buyerOrders.find(b => b.ibpo_number === val);
      if (bo) {
        newItems[index].style = bo.style_no || '';
        newItems[index].description = bo.description || '';
        newItems[index].pattern = bo.pattern || '';
        newItems[index].composition = bo.composition || '';
        newItems[index].po_number = bo.buyer_po_number || '';
        newItems[index].delivery_date = bo.delivery_date || '';
        if (!form.consignee) {
          setForm(prev => ({ ...prev, consignee: bo.buyer_name || bo.party_name || '' }));
        }
      }
    }

    setForm(prev => calculateSummary({ ...prev, items: newItems }));
  };

  const calculateSummary = (currentForm) => {
    const subtotal = currentForm.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const total_quantity = currentForm.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const taxable_amount = subtotal + 
      (parseFloat(currentForm.other_charges) || 0) + 
      (parseFloat(currentForm.freight_charges) || 0) + 
      (parseFloat(currentForm.packing_charges) || 0) + 
      (parseFloat(currentForm.insurance_charges) || 0) - 
      (parseFloat(currentForm.less_pct) || 0) - 
      (parseFloat(currentForm.discount_pct) || 0);

    const gross_amount = taxable_amount;

    let cgst_amt = 0;
    let sgst_amt = 0;
    let igst_amt = 0;

    if (currentForm.tax_type === 'GST') {
      cgst_amt = (parseFloat(currentForm.cgst_pct) || 0) / 100 * taxable_amount;
      sgst_amt = (parseFloat(currentForm.sgst_pct) || 0) / 100 * taxable_amount;
    } else if (currentForm.tax_type === 'IGST') {
      igst_amt = (parseFloat(currentForm.igst_pct) || 0) / 100 * taxable_amount;
    }

    const gst_amount = cgst_amt + sgst_amt + igst_amt;
    const tax_amount = gst_amount + (parseFloat(currentForm.tcs_amount) || 0);
    const raw_net = taxable_amount + tax_amount;
    const rounded_off = Math.round(raw_net) - raw_net;
    const net_amount = Math.round(raw_net);

    return { 
      ...currentForm, 
      total_quantity,
      taxable_amount, 
      gross_amount,
      tax_amount, 
      gst_amount, 
      rounded_off: rounded_off.toFixed(2), 
      net_amount 
    };
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm(prev => calculateSummary({ ...prev, items: newItems }));
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await proformaInvoiceAPI.update(editingId, form);
      } else {
        await proformaInvoiceAPI.create(form);
      }
      await fetchInvoices();
      setShowForm(false);
    } catch (e) {
      console.error('Failed to save invoice', e);
      alert('Failed to save invoice. Please check the form fields.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await proformaInvoiceAPI.delete(id);
        await fetchInvoices();
      } catch (e) {
        console.error('Failed to delete invoice', e);
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Proforma Invoice: ${form.pi_number}`, 14, 15);
    doc.text(`Consignee: ${form.consignee} | Date: ${form.pi_date}`, 14, 22);
    
    const headers = [["IBPO", "Style", "Description", "Qty", "Rate", "Amount"]];
    const rows = form.items.map(it => [
      it.ibpo_no, it.style, it.description, it.quantity, it.rate, it.amount
    ]);
    
    autoTable(doc, { head: headers, body: rows, startY: 30 });
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.text(`Taxable Amt: ${form.taxable_amount}`, 140, finalY);
    doc.text(`Tax Amt: ${form.tax_amount}`, 140, finalY + 7);
    doc.text(`Grand Total: ${form.net_amount}`, 140, finalY + 14);
    
    doc.save(`Proforma_Invoice_${form.pi_number}.pdf`);
  };

  const exportExcel = () => {
    const data = invoices.map(inv => ({
      "PI No": inv.pi_number,
      "Consignee": inv.consignee,
      "PI Date": inv.pi_date,
      "Amount": inv.net_amount,
      "Approval Status": inv.approval_status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proforma Invoices");
    XLSX.writeFile(wb, `Proforma_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredInvoices = invoices.filter(inv => 
    (inv.pi_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.consignee || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={24} color="var(--primary)" /> Proforma Invoice
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Create and manage buyer proforma invoices before shipment confirmation.</p>
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
                        <Download size={16} color="#10b981" /> Excel Sheet
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => handleOpenForm(null)}>
                <Plus size={16} /> New Proforma Invoice
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Total PI</h3><div className="value">{invoices.length}</div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><DollarSign size={24} /></div>
              <div className="stat-details"><h3>Invoice Value</h3><div className="value">INR {invoices.reduce((sum, inv) => sum + (inv.net_amount || 0), 0)}</div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><Send size={24} /></div>
              <div className="stat-details"><h3>Sent to Buyer</h3><div className="value">{invoices.filter(i => i.approval_status === 'Sent').length}</div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Pending Approval</h3><div className="value">{invoices.filter(i => i.approval_status === 'Pending').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search by PI No, Buyer, IBPO, Invoice Date..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><Filter size={16} /><span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span></div>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option>
              </select>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Pending</option>
                <option>Sent</option>
                <option>Approved</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PI Number</th>
                    <th>Consignee</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No invoices found.</td></tr>
                  ) : filteredInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.pi_number}</td>
                      <td>{inv.consignee}</td>
                      <td>{inv.pi_date}</td>
                      <td>INR {inv.net_amount}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(inv, true)} title="View"><Eye size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(inv, false)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleDelete(inv.id)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button 
                type="button"
                onClick={() => setShowForm(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)' }}
              >
                <ArrowLeft size={24} />
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {isReadOnly ? 'View Proforma Invoice' : editingId ? 'Edit Proforma Invoice' : 'New Proforma Invoice'}
              </h2>
            </div>
            {isReadOnly && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={exportPDF}><Printer size={16} /> Print / PDF</button>
                <button className="btn btn-secondary"><Mail size={16} /> Email Buyer</button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            <button 
              type="button"
              style={{
                padding: '16px 24px', background: '#fff',
                border: 'none', borderBottom: '3px solid var(--primary)',
                fontWeight: 600, color: 'var(--primary)',
                cursor: 'default', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
              }}
            >
              <FileText size={16}/> Proforma Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
              <div className="animate-fade">
                {/* Section 1: Proforma Invoice Information */}
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Proforma Invoice Information</h4>
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="form-group">
                    <label>PI Number *</label>
                    <input type="text" className="form-control" name="pi_number" value={form.pi_number} disabled style={{ background: '#f8fafc', fontWeight: 'bold' }} />
                  </div>
                  <div className="form-group">
                    <label>PI Date *</label>
                    <input type="date" className="form-control" name="pi_date" value={form.pi_date} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Payment Mode</label>
                    <input type="text" className="form-control" name="payment_mode" value={form.payment_mode} onChange={handleChange} />
                  </div>
                  
                  <div className="form-group">
                    <label>Revised On</label>
                    <input type="date" className="form-control" name="revised_on" value={form.revised_on} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Consignee</label>
                    <input type="text" className="form-control" name="consignee" value={form.consignee} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Delivery At</label>
                    <input type="text" className="form-control" name="delivery_at" value={form.delivery_at} onChange={handleChange} />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Billing Address</label>
                    <textarea className="form-control" name="billing_address" value={form.billing_address} onChange={handleChange} rows={2} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Delivery Address</label>
                    <textarea className="form-control" name="delivery_address" value={form.delivery_address} onChange={handleChange} rows={2} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Revision Notes</label>
                    <textarea className="form-control" name="revision_notes" value={form.revision_notes} onChange={handleChange} rows={2} style={{ width: '100%', resize: 'vertical' }} />
                  </div>
                </div>

                {/* Section 2: Invoice Items */}
                <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Invoice Items</h4>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  {!isReadOnly && <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Invoice Item</button>}
                </div>
                <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                  <table className="data-table" style={{ minWidth: '1600px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>SNo</th>
                        <th style={{ minWidth: 150 }}>IBPO No</th>
                        <th style={{ minWidth: 120 }}>Style</th>
                        <th style={{ minWidth: 200 }}>Description / Quality</th>
                        <th style={{ minWidth: 120 }}>Pattern</th>
                        <th style={{ minWidth: 150 }}>Composition</th>
                        <th style={{ minWidth: 150 }}>PO Number</th>
                        <th style={{ minWidth: 150 }}>Delivery Date</th>
                        <th style={{ minWidth: 120 }}>Quantity</th>
                        <th style={{ minWidth: 120 }}>Rate</th>
                        <th style={{ minWidth: 150 }}>Amount</th>
                        {!isReadOnly && <th style={{ width: 40 }}>X</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <select className="form-control" style={{ width: '100%' }} value={item.ibpo_no || ''} onChange={e => updateItem(idx, 'ibpo_no', e.target.value)}>
                              <option value="">Select IBPO...</option>
                              {buyerOrders.map(bo => (
                                <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number}</option>
                              ))}
                            </select>
                          </td>
                          <td><input type="text" className="form-control" style={{ width: '100%' }} value={item.style} onChange={e => updateItem(idx, 'style', e.target.value)} /></td>
                          <td><input type="text" className="form-control" style={{ width: '100%' }} value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} /></td>
                          <td><input type="text" className="form-control" style={{ width: '100%' }} value={item.pattern} onChange={e => updateItem(idx, 'pattern', e.target.value)} /></td>
                          <td><input type="text" className="form-control" style={{ width: '100%' }} value={item.composition} onChange={e => updateItem(idx, 'composition', e.target.value)} /></td>
                          <td><input type="text" className="form-control" style={{ width: '100%' }} value={item.po_number} onChange={e => updateItem(idx, 'po_number', e.target.value)} /></td>
                          <td><input type="date" className="form-control" style={{ width: '100%' }} value={item.delivery_date} onChange={e => updateItem(idx, 'delivery_date', e.target.value)} /></td>
                          <td><input type="number" className="form-control" style={{ width: '100%' }} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                          <td><input type="number" className="form-control" style={{ width: '100%' }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                          <td><input type="number" className="form-control" style={{ width: '100%', fontWeight: 'bold', background: '#f1f5f9' }} value={item.amount} readOnly /></td>
                          {!isReadOnly && (
                            <td>
                              <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sections 3-6: Tax, Logistics, T&C, and Summary Sidebar */}
                <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax, Logistics & Summary</h4>
                
                {/* Special Instructions (Moved up) */}
                <div style={{ marginBottom: 24 }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700 }}>Special Instructions</h5>
                  <textarea className="form-control" name="special_instructions" value={form.special_instructions} onChange={handleChange} rows={3} placeholder="Enter buyer-specific instructions, shipment notes, or additional remarks..." style={{ width: '100%', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  
                  {/* LEFT SIDE — Terms & Conditions Only */}
                  <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Terms & Conditions */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Terms & Conditions</span>
                      </div>
                      <div style={{ padding: '16px 18px' }}>
                        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(form.terms_conditions || []).map((term, idx) => (
                            <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {editingTermIdx === idx ? (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13 }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm(prev => calculateSummary({ ...prev, terms_conditions: updated })); setEditingTermIdx(null); }}} />
                                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm(prev => calculateSummary({ ...prev, terms_conditions: updated })); setEditingTermIdx(null); }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingTermIdx(null)}><X size={14} /></button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                  <span>{term}</span>
                                  {!isReadOnly && (
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm(prev => calculateSummary({ ...prev, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) }))} title="Delete"><Trash2 size={13} /></button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                        {!isReadOnly && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13 }} placeholder="Add new term or condition..." value={newTermVal} onChange={e => setNewTermVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTermVal.trim()) { setForm(prev => calculateSummary({ ...prev, terms_conditions: [...(form.terms_conditions || []), newTermVal.trim()] })); setNewTermVal(''); }}} />
                            <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { if (newTermVal.trim()) { setForm(prev => calculateSummary({ ...prev, terms_conditions: [...(form.terms_conditions || []), newTermVal.trim()] })); setNewTermVal(''); }}}><Plus size={14} /> Add</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE — Order Summary (Sticky Sidebar) */}
                  <div style={{ flex: '0 0 550px', position: 'sticky', top: 24 }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Invoice Summary</span>
                      </div>
                      <div style={{ padding: '20px 18px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                          {/* LEFT COLUMN */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Amount</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{(form.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Other Charges</span>
                              <input type="number" className="form-control" name="other_charges" value={form.other_charges} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Less %</span>
                              <input type="number" className="form-control" name="less_pct" value={form.less_pct} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Charges</span>
                              <input type="number" className="form-control" name="freight_charges" value={form.freight_charges} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Packing Charges</span>
                              <input type="number" className="form-control" name="packing_charges" value={form.packing_charges} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance Charges</span>
                              <input type="number" className="form-control" name="insurance_charges" value={form.insurance_charges} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Quantity</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{form.total_quantity}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Bale</span>
                              <input type="number" className="form-control" name="total_bale" value={form.total_bale} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                          </div>

                          {/* RIGHT COLUMN */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Tax Type</span>
                              <select className="form-control" name="tax_type" value={form.tax_type} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, margin: 0, padding: '4px 8px' }}>
                                <option value="GST">GST</option>
                                <option value="IGST">IGST</option>
                                <option value="None">None</option>
                              </select>
                            </div>
                            {form.tax_type === 'GST' && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST %</span>
                                  <input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST %</span>
                                  <input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                                </div>
                              </>
                            )}
                            {form.tax_type === 'IGST' && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST %</span>
                                <input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>TCS Amount</span>
                              <input type="number" className="form-control" name="tcs_amount" value={form.tcs_amount} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Discount %</span>
                              <input type="number" className="form-control" name="discount_pct" value={form.discount_pct} onChange={handleChange} disabled={isReadOnly} style={{ width: 100, textAlign: 'right', margin: 0, padding: '4px 8px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Tax Amount</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{(form.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>GST Amount</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{(form.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        {/* BOTTOM TOTALS */}
                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Gross Amount</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{(form.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Rounded Off</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{form.rounded_off}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Net Amount</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          
                          <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Grand Total</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px' }}>{(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Close
              </button>
              {!isReadOnly && (
                <button type="button" className="btn btn-primary" onClick={handleSave}>
                  <Save size={16} /> {editingId ? 'Update PI' : 'Save PI'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
