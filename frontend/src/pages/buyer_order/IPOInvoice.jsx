import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Search, Edit2, Eye, FileCheck, Globe, Filter, CheckCircle, FilePlus, X, Trash2 } from 'lucide-react';
import { salesInvoiceAPI, buyerOrderAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function IPOInvoice() {
  const [activeCard, setActiveCard] = useState('Proforma Invoice');
  
  const [filters, setFilters] = useState({
    partyName: '', buyerName: '', dateFrom: '', dateTo: '', status: 'All Statuses', type: 'All Types'
  });

  const [appliedFilters, setAppliedFilters] = useState({
    partyName: '', buyerName: '', dateFrom: '', dateTo: '', status: 'All Statuses', type: 'All Types'
  });

  const cards = [
    { title: 'Proforma Invoice', icon: FileText, color: '#3b82f6', desc: 'Domestic pre-shipment invoices' },
    { title: 'Export Proforma Invoice', icon: Globe, color: '#8b5cf6', desc: 'International export invoices' },
    { title: 'Open Invoice', icon: FileCheck, color: '#10b981', desc: 'Finalized active invoices' }
  ];

  const [invoices, setInvoices] = useState([]);
  const [buyerOrdersList, setBuyerOrdersList] = useState([]);
  const [showAutoPullModal, setShowAutoPullModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [selectedIbpo, setSelectedIbpo] = useState('');
  const [generateType, setGenerateType] = useState('Proforma Invoice');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchBuyerOrders();
  }, []);

  const fetchBuyerOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrdersList(res.data);
    } catch(e) {
      console.error(e);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await salesInvoiceAPI.list();
      setInvoices(res.data);
    } catch (e) {
      console.error("Failed to fetch invoices", e);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this invoice?")) return;
    try {
      await salesInvoiceAPI.delete(id);
      fetchInvoices();
    } catch(e) { console.error(e); }
  };

  const handleUpdateInvoice = async () => {
    try {
      await salesInvoiceAPI.update(editForm.id, editForm);
      alert("Invoice updated successfully!");
      setShowEditModal(false);
      fetchInvoices();
    } catch(e) {
      console.error(e);
      alert("Failed to update invoice.");
    }
  };

  const handleFinalize = async (inv) => {
    try {
      await salesInvoiceAPI.update(inv.id, { ...inv, status: 'Confirmed' });
      fetchInvoices();
      alert("Invoice finalized successfully!");
    } catch(e) {
      console.error(e);
      alert("Failed to finalize invoice.");
    }
  };

  const handleExportPDF = (inv) => {
    const doc = new jsPDF();
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    
    const c = inv.currency || 'INR';
    const items = inv.items || [];
    const firstItem = items.length > 0 ? items[0] : {};
    
    const fAmt = (val) => parseFloat(val || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
    const formatMulti = (text, padLen) => {
      if (!text) return '-';
      const pad = ' '.repeat(padLen);
      return text.replace(/\n/g, '\n' + pad);
    };
    
    let text = '';
    
    if (inv.invoice_type === 'Export Proforma Invoice') {
      text = `==================================================================
                        DINESH EXPORTS
                    THE HOUSE OF FABRICS
==================================================================

Address    : 123, Textile Park Road,
             SIDCO Industrial Estate,
             Tiruppur - 641602, Tamil Nadu, India

Phone      : +91 98765 43210
Email      : exports@dineshexports.com
GSTIN      : 33ABCDE1234F1Z5
IEC No     : ${inv.iec_number || '-'}

------------------------------------------------------------------
                       EXPORT INVOICE
------------------------------------------------------------------

Invoice No         : ${inv.invoice_no || '-'}
Invoice Date       : ${inv.invoice_date || '-'}
IBPO No            : ${inv.ibpo || '-'}
Buyer PO No        : ${inv.buyer_po_no || '-'}

EXPORTER DETAILS
------------------------------------------------------------------
Dinesh Exports
Tiruppur, Tamil Nadu, India

BUYER DETAILS
------------------------------------------------------------------
${inv.party_name || '-'}
${formatMulti(inv.billing_address, 0)}

Country            : ${inv.country || '-'}
Currency           : ${c}

SHIPPING DETAILS
------------------------------------------------------------------
Port of Loading    : ${inv.port_of_loading || '-'}
Port of Discharge  : ${inv.port_of_discharge || '-'}
Incoterms          : ${inv.incoterms || 'FOB'}

PRODUCT DETAILS
------------------------------------------------------------------
HSN Code           : ${inv.hsn_code || '-'}
Design No          : ${firstItem.design_no || '-'}
Fabric Type        : ${firstItem.description || '-'}
Colour             : ${firstItem.color || '-'}

Quantity           : ${inv.total_qty || '0'} Mtrs
Rate               : ${c} ${firstItem.rate || '0.00'}
Amount             : ${c} ${fAmt(inv.gross_amount)}

Freight Charges    : ${c} ${fAmt(inv.other_charges)}
Insurance Charges  : ${c} ${fAmt(inv.insurance_charges || 0)}

TOTAL EXPORT VALUE : ${c} ${fAmt(inv.net_amount)}

BANK DETAILS
------------------------------------------------------------------
Bank Name          : HDFC Bank
Account No         : XXXXXXXXXXXX
SWIFT Code         : HDFCINBBXXX

Authorized Signatory`;
    } else if (inv.invoice_type === 'Open Invoice') {
      text = `==================================================================
                        DINESH EXPORTS
                    THE HOUSE OF FABRICS
==================================================================

Address    : 123, Textile Park Road,
             SIDCO Industrial Estate,
             Tiruppur - 641602, Tamil Nadu, India

Phone      : +91 98765 43210
Email      : accounts@dineshexports.com
GSTIN      : 33ABCDE1234F1Z5

------------------------------------------------------------------
                         TAX INVOICE
------------------------------------------------------------------

Invoice No         : ${inv.invoice_no || '-'}
Invoice Date       : ${inv.invoice_date || '-'}
IBPO No            : ${inv.ibpo || '-'}
Buyer PO No        : ${inv.buyer_po_no || '-'}

BUYER DETAILS
------------------------------------------------------------------
${inv.party_name || '-'}
${formatMulti(inv.billing_address, 0)}

GST No             : ${inv.gst_no || '-'}

DISPATCH DETAILS
------------------------------------------------------------------
Dispatch Date      : ${inv.dispatch_date || '-'}
Transporter        : ${inv.transporter_name || '-'}
LR No              : ${inv.lr_no || '-'}
Vehicle No         : ${inv.vehicle_no || '-'}
Delivery Place     : ${inv.delivery_address || '-'}

PRODUCT DETAILS
------------------------------------------------------------------
Design No          : ${firstItem.design_no || '-'}
Fabric Type        : ${firstItem.description || '-'}
Colour             : ${firstItem.color || '-'}

Quantity           : ${inv.total_qty || '0'} Mtrs
Rate               : ₹${firstItem.rate || '0.00'}
Amount             : ₹${fAmt(inv.gross_amount)}

TAX DETAILS
------------------------------------------------------------------
CGST @ 2.5%        : ₹${fAmt(inv.cgst)}
SGST @ 2.5%        : ₹${fAmt(inv.sgst)}

GRAND TOTAL        : ₹${fAmt(inv.net_amount)}

PAYMENT TERMS
------------------------------------------------------------------
${inv.payment_terms || '45 Days Credit'}

Remarks:
${inv.remarks || 'Goods dispatched as per buyer order and approved schedule.'}

For Dinesh Exports

Authorized Signatory`;
    } else {
      text = `==================================================================
                        DINESH EXPORTS
                    THE HOUSE OF FABRICS
==================================================================

Address    : 123, Textile Park Road,
             SIDCO Industrial Estate,
             Tiruppur - 641602, Tamil Nadu, India

Phone      : +91 98765 43210
Email      : sales@dineshexports.com
GSTIN      : 33ABCDE1234F1Z5
PAN No     : ABCDE1234F

------------------------------------------------------------------
                     PROFORMA INVOICE
------------------------------------------------------------------

PI No              : ${inv.invoice_no || '-'}
PI Date            : ${inv.invoice_date || '-'}
IBPO No            : ${inv.ibpo || '-'}
Buyer PO No        : ${inv.buyer_po_no || '-'}

BUYER DETAILS
------------------------------------------------------------------
Buyer Name         : ${inv.party_name || '-'}
Contact Person     : ${inv.contact_person || '-'}
Address            : ${formatMulti(inv.billing_address, 21)}

GST No             : ${inv.gst_no || '-'}
Phone              : ${inv.phone || '-'}
Email              : ${inv.email || '-'}

PRODUCT DETAILS
------------------------------------------------------------------
Design No          : ${firstItem.design_no || '-'}
Fabric Type        : ${firstItem.description || '-'}
Colour             : ${firstItem.color || '-'}
Pattern            : ${inv.pattern || 'Solid'}
Packing Type       : ${inv.packing_type || 'Roll Packing'}

Quantity           : ${inv.total_qty || '0'} Mtrs
Rate               : ₹${firstItem.rate || '0.00'}
Amount             : ₹${fAmt(inv.gross_amount)}

PAYMENT & DELIVERY
------------------------------------------------------------------
Payment Terms      : ${inv.payment_terms || '45 Days Credit'}
Delivery Terms     : ${inv.delivery_terms || 'FOB Tiruppur'}

TOTAL VALUE        : ₹${fAmt(inv.net_amount)}

Remarks:
${inv.remarks || 'This Proforma Invoice is issued for order confirmation only.'}

*** THIS IS NOT A TAX INVOICE ***

Prepared By                     Authorized Signatory`;
    }

    const lines = text.split('\n');
    doc.text(lines, 14, 16);
    
    doc.save(`${inv.invoice_no}.pdf`);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedIbpo) return alert("Please select a Buyer Order.");

    try {
      const targetOrder = buyerOrdersList.find(o => o.ibpo_number === selectedIbpo);
      if (!targetOrder) return alert("Buyer Order not found.");

      // 1. Fetch Fabric, Quantity, Rate, Amount (map items)
      const invoiceItems = (targetOrder.items || []).map(item => ({
        design_no: item.design_no || '',
        color: item.color || '',
        uom: item.uom || 'MTR',
        qty: parseFloat(item.order_mtrs || 0),
        rate: parseFloat(item.rate || 0),
        amount: parseFloat(item.amount || 0),
        description: item.fabric_type || ''
      }));

      // 2. Calculate Total Value
      const totalQty = invoiceItems.reduce((sum, it) => sum + it.qty, 0);
      const totalAmount = invoiceItems.reduce((sum, it) => sum + it.amount, 0);

      // 3. Create new sales invoice with automatic PI Number & Draft status
      const newInvoice = {
        invoice_no: `PI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random()*9000)}`,
        invoice_date: new Date().toISOString().split('T')[0],
        party_name: targetOrder.party_name || '',
        party_id: targetOrder.party_id || null,
        ibpo: targetOrder.ibpo_number || '',
        invoice_type: generateType,
        status: 'Draft',
        currency: targetOrder.currency || 'INR',
        total_qty: totalQty,
        gross_amount: totalAmount,
        net_amount: totalAmount,
        taxable_amount: totalAmount,
        items: invoiceItems
      };

      await salesInvoiceAPI.create(newInvoice);
      alert("Invoice generated successfully from Buyer Order!");
      setShowAutoPullModal(false);
      setSelectedIbpo('');
      setActiveCard(generateType);
      fetchInvoices();
    } catch (e) {
      console.error(e);
      alert("Failed to generate invoice.");
    }
  };


  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (inv.invoice_type !== activeCard) return false;
    
    if (appliedFilters.partyName && (!inv.party_name || !inv.party_name.toLowerCase().includes(appliedFilters.partyName.toLowerCase()))) return false;
    if (appliedFilters.buyerName && (!inv.buyer_name || !inv.buyer_name.toLowerCase().includes(appliedFilters.buyerName.toLowerCase()))) return false;
    if (appliedFilters.status !== 'All Statuses' && inv.status !== appliedFilters.status) return false;
    if (appliedFilters.type !== 'All Types' && inv.sub_type !== appliedFilters.type) return false;
    if (appliedFilters.dateFrom && inv.invoice_date < appliedFilters.dateFrom) return false;
    if (appliedFilters.dateTo && inv.invoice_date > appliedFilters.dateTo) return false;
    
    return true;
  });

  return (
    <div className="page-container animate-fade">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>IPO Invoicing System</h1>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage Proforma, Export, and Open Invoices linked directly to your Buyer Orders.</p>
      </div>

      {/* Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {cards.map(c => (
          <div 
            key={c.title} 
            className="card" 
            onClick={() => setActiveCard(c.title)}
            style={{ 
              padding: 24, 
              cursor: 'pointer', 
              border: activeCard === c.title ? `2px solid ${c.color}` : '1px solid transparent',
              background: activeCard === c.title ? `rgba(${c.color === '#3b82f6' ? '59,130,246' : c.color === '#8b5cf6' ? '139,92,246' : '16,185,129'}, 0.05)` : 'var(--bg-secondary)',
              transition: 'all 0.2s ease',
              transform: activeCard === c.title ? 'translateY(-2px)' : 'none',
              boxShadow: activeCard === c.title ? `0 10px 15px -3px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 12, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(0,0,0,0.15)` }}>
                <c.icon size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: 24, minHeight: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
            <Filter size={18} /> {activeCard} - Overview
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> Export View
            </button>
            <button className="btn btn-primary" onClick={() => { setGenerateType(activeCard === 'Open Invoice' ? 'Proforma Invoice' : activeCard); setShowAutoPullModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilePlus size={16} /> Generate Invoice from Order
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Party Name</label>
            <input type="text" className="form-control" placeholder="Search party..." style={{ margin: 0 }} value={filters.partyName} onChange={e => setFilters({...filters, partyName: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Buyer Name</label>
            <input type="text" className="form-control" placeholder="Search buyer..." style={{ margin: 0 }} value={filters.buyerName} onChange={e => setFilters({...filters, buyerName: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Invoice Status</label>
            <select className="form-control" style={{ margin: 0 }} value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Confirmed</option>
              <option>Completed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Invoice Type</label>
            <select className="form-control" style={{ margin: 0 }} value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option>All Types</option>
              <option>Regular</option>
              <option>Special</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Date From</label>
              <input type="date" className="form-control" style={{ margin: 0 }} value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Date To</label>
              <input type="date" className="form-control" style={{ margin: 0 }} value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={handleApplyFilters} style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff' }}>
              <Search size={16} /> Apply Filters
            </button>
          </div>
        </div>

        {/* Data Area */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div className="table-responsive" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table className="data-table">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>Invoice No</th>
                <th style={{ padding: '12px 16px' }}>Order Ref ID</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Party Name</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_no}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{inv.ibpo || inv.order_ref}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.invoice_date || inv.date}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.party_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${inv.status === 'Draft' ? 'badge-draft' : 'badge-active'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px' }} title="View" onClick={() => setSelectedInvoice(inv)}><Eye size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Edit" onClick={() => { setEditForm(inv); setShowEditModal(true); }}><Edit2 size={14} /></button>
                      {inv.status !== 'Confirmed' && <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#10b981' }} title="Finalize" onClick={() => handleFinalize(inv)}><CheckCircle size={14} /></button>}
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#3b82f6' }} title="Export PDF" onClick={() => handleExportPDF(inv)}><Download size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }} title="Delete" onClick={() => handleDelete(inv.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <FileCheck size={48} style={{ opacity: 0.2, color: 'var(--primary)' }} />
                      <p style={{ margin: 0, fontSize: 14 }}>No {activeCard}s found matching the current filters.</p>
                      <button className="btn btn-primary" onClick={() => { setGenerateType(activeCard === 'Open Invoice' ? 'Proforma Invoice' : activeCard); setShowAutoPullModal(true); }} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={16} /> Auto-pull from Buyer Order
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* QUICK VIEW SIDE PANE */}
        {selectedInvoice && (
          <div className="card animate-slide" style={{ width: 350, padding: 0, position: 'sticky', top: 100, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
                <FileText size={18} /> Invoice Details
              </h3>
              <button className="btn btn-secondary" style={{ padding: 4, border: 'none' }} onClick={() => setSelectedInvoice(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>General Info</p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Invoice No:</strong> <span style={{color: 'var(--primary)', fontWeight: 600}}>{selectedInvoice.invoice_no}</span></p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Order Ref:</strong> {selectedInvoice.ibpo || selectedInvoice.order_ref}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Date:</strong> {selectedInvoice.invoice_date}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Status:</strong> <span className={`badge ${selectedInvoice.status === 'Draft' ? 'badge-draft' : 'badge-active'}`}>{selectedInvoice.status}</span></p>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
              
              <div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Party Details</p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Party:</strong> {selectedInvoice.party_name}</p>
              </div>
              
              <button className="btn btn-primary" style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8 }} onClick={() => handleExportPDF(selectedInvoice)}>
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Auto-pull Modal */}
      {showAutoPullModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade" style={{ width: 400, padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Auto-pull from Buyer Order</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Select a Buyer Order to automatically generate a pre-filled invoice.</p>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Invoice Type</label>
              <select className="form-control" value={generateType} onChange={e => setGenerateType(e.target.value)}>
                <option value="Proforma Invoice">Proforma Invoice</option>
                <option value="Export Proforma Invoice">Export Proforma Invoice</option>
                <option value="Open Invoice">Open Invoice</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>Select Order (IBPO - Party Name)</label>
              <select className="form-control" value={selectedIbpo} onChange={e => setSelectedIbpo(e.target.value)}>
                <option value="">-- Choose Buyer Order --</option>
                {buyerOrdersList.map(o => (
                  <option key={o.id} value={o.ibpo_number}>{o.ibpo_number} - {o.party_name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setShowAutoPullModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGenerateInvoice}>Generate Invoice</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade" style={{ width: 600, padding: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Edit {editForm.invoice_type}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {/* General Details */}
              <div style={{ gridColumn: 'span 2' }}>
                <h4 style={{ margin: 0, fontSize: 13, color: '#8b5cf6' }}>General Details</h4>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Invoice Date</label>
                <input type="date" className="form-control" value={editForm.invoice_date || ''} onChange={e => setEditForm({...editForm, invoice_date: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Status</label>
                <select className="form-control" value={editForm.status || 'Draft'} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  <option>Draft</option>
                  <option>Confirmed</option>
                  <option>Completed</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Buyer PO No</label>
                <input type="text" className="form-control" placeholder="PO-1234" value={editForm.buyer_po_no || ''} onChange={e => setEditForm({...editForm, buyer_po_no: e.target.value})} />
              </div>
              {activeCard !== 'Export Proforma Invoice' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>GST No</label>
                  <input type="text" className="form-control" placeholder="33ABCDE1234Z5" value={editForm.gst_no || ''} onChange={e => setEditForm({...editForm, gst_no: e.target.value})} />
                </div>
              )}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Billing Address</label>
                <textarea className="form-control" rows={3} placeholder="Full Address" value={editForm.billing_address || ''} onChange={e => setEditForm({...editForm, billing_address: e.target.value})}></textarea>
              </div>

              {activeCard === 'Export Proforma Invoice' && (
                <>
                  <div style={{ gridColumn: 'span 2', margin: '8px 0', borderBottom: '1px solid var(--border)' }}></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <h4 style={{ margin: 0, fontSize: 13, color: '#8b5cf6' }}>Export Details</h4>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Currency</label>
                    <select className="form-control" value={editForm.currency || 'INR'} onChange={e => setEditForm({...editForm, currency: e.target.value})}>
                      <option>INR</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Exchange Rate</label>
                    <input type="number" className="form-control" value={editForm.exchange_rate || 1.0} onChange={e => setEditForm({...editForm, exchange_rate: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>AD Code</label>
                    <input type="text" className="form-control" value={editForm.ad_code || ''} onChange={e => setEditForm({...editForm, ad_code: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>IEC Number</label>
                    <input type="text" className="form-control" value={editForm.iec_number || ''} onChange={e => setEditForm({...editForm, iec_number: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Country</label>
                    <input type="text" className="form-control" value={editForm.country || ''} onChange={e => setEditForm({...editForm, country: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Incoterms</label>
                    <input type="text" className="form-control" placeholder="FOB, CIF..." value={editForm.incoterms || ''} onChange={e => setEditForm({...editForm, incoterms: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Port of Loading</label>
                    <input type="text" className="form-control" value={editForm.port_of_loading || ''} onChange={e => setEditForm({...editForm, port_of_loading: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Port of Discharge</label>
                    <input type="text" className="form-control" value={editForm.port_of_discharge || ''} onChange={e => setEditForm({...editForm, port_of_discharge: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Freight Charges</label>
                    <input type="number" className="form-control" value={editForm.other_charges || ''} onChange={e => setEditForm({...editForm, other_charges: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Insurance Charges</label>
                    <input type="number" className="form-control" value={editForm.insurance_charges || ''} onChange={e => setEditForm({...editForm, insurance_charges: e.target.value})} />
                  </div>
                </>
              )}

              {activeCard === 'Open Invoice' && (
                <>
                  <div style={{ gridColumn: 'span 2', margin: '8px 0', borderBottom: '1px solid var(--border)' }}></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <h4 style={{ margin: 0, fontSize: 13, color: '#8b5cf6' }}>Dispatch Details & Tax</h4>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Dispatch Date</label>
                    <input type="date" className="form-control" value={editForm.dispatch_date || ''} onChange={e => setEditForm({...editForm, dispatch_date: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Transporter Name</label>
                    <input type="text" className="form-control" value={editForm.transporter_name || ''} onChange={e => setEditForm({...editForm, transporter_name: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>LR No</label>
                    <input type="text" className="form-control" value={editForm.lr_no || ''} onChange={e => setEditForm({...editForm, lr_no: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Vehicle No</label>
                    <input type="text" className="form-control" value={editForm.vehicle_no || ''} onChange={e => setEditForm({...editForm, vehicle_no: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>CGST Amount (₹)</label>
                    <input type="number" className="form-control" value={editForm.cgst || ''} onChange={e => setEditForm({...editForm, cgst: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>SGST Amount (₹)</label>
                    <input type="number" className="form-control" value={editForm.sgst || ''} onChange={e => setEditForm({...editForm, sgst: e.target.value})} />
                  </div>
                </>
              )}

              <div style={{ gridColumn: 'span 2', margin: '8px 0', borderBottom: '1px solid var(--border)' }}></div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Payment Terms</label>
                <input type="text" className="form-control" placeholder="e.g. 45 Days Credit" value={editForm.payment_terms || ''} onChange={e => setEditForm({...editForm, payment_terms: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Remarks</label>
                <textarea className="form-control" rows={2} value={editForm.remarks || ''} onChange={e => setEditForm({...editForm, remarks: e.target.value})}></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateInvoice}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
