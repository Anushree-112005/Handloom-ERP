import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Search, Edit2, Eye, FileCheck, Globe, Filter, CheckCircle, FilePlus, X, Trash2 } from 'lucide-react';
import { salesInvoiceAPI, buyerOrderAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function IPOInvoice() {
  const [activeCard, setActiveCard] = useState('Proforma Invoice');
  
  const [filters, setFilters] = useState({
    partyName: '', buyerName: '', dateFrom: '', dateTo: '', status: 'All', type: 'All', designNo: ''
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
    
    // 1. Company Details (Header)
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Primary blue
    doc.setFont(undefined, 'bold');
    doc.text("DINESH EXPORTS", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text("THE HOUSE OF FABRICS", 14, 26);
    doc.text("123 Textile Avenue, Tirupur, Tamil Nadu - 641604", 14, 32);
    doc.text("GSTIN: 33ABCDE1234F1Z5 | Email: info@dineshexports.com", 14, 38);

    // 2. Document Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    const title = (inv.invoice_type || 'Proforma Invoice').toUpperCase();
    doc.text(title, 105, 50, { align: 'center' });

    // 3. Invoice & Order Details
    doc.setFontSize(11);
    doc.text(`Invoice No:`, 14, 65);
    doc.setFont(undefined, 'normal');
    doc.text(`${inv.invoice_no}`, 45, 65);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Date:`, 14, 72);
    doc.setFont(undefined, 'normal');
    doc.text(`${inv.invoice_date || '-'}`, 45, 72);

    doc.setFont(undefined, 'bold');
    doc.text(`IBPO Ref:`, 140, 65);
    doc.setFont(undefined, 'normal');
    doc.text(`${inv.ibpo || '-'}`, 165, 65);

    doc.setFont(undefined, 'bold');
    doc.text(`Status:`, 140, 72);
    doc.setFont(undefined, 'normal');
    doc.text(`${inv.status || 'Draft'}`, 165, 72);

    // 4. Buyer Details
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 80, 85, 8, 'F');
    doc.rect(110, 80, 85, 8, 'F');
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Billed To (Buyer)", 16, 85);
    doc.text("Shipping Details", 112, 85);

    doc.setFont(undefined, 'normal');
    // Billed To
    doc.setFont(undefined, 'bold');
    doc.text(`${inv.party_name || 'N/A'}`, 14, 95);
    doc.setFont(undefined, 'normal');
    doc.text(`${inv.billing_address || 'Address not provided'}`, 14, 101, { maxWidth: 85 });
    
    // Shipped To / Export Info
    if (inv.invoice_type === 'Export Proforma Invoice') {
      doc.text(`Currency: ${inv.currency || 'USD'}`, 110, 95);
      doc.text(`IEC No: ${inv.iec_number || '-'}`, 110, 101);
      doc.text(`AD Code: ${inv.ad_code || '-'}`, 110, 107);
    } else {
      doc.text(`Delivery Place: ${inv.delivery_address || 'Same as billing'}`, 110, 95, { maxWidth: 85 });
    }

    // 5. Items Table
    autoTable(doc, {
      startY: 120,
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      head: [['S.No', 'Design No / Description', 'HSN Code', 'Qty', 'Rate', 'Amount']],
      body: [
        ['1', inv.design_no || 'Textile Fabric', inv.hsn_code || '-', inv.total_qty || '0', `${inv.currency || 'INR'} 0.00`, `${inv.currency || 'INR'} ${parseFloat(inv.net_amount || 0).toFixed(2)}`]
      ],
      foot: [
        [{ content: 'Total Net Amount', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, `${inv.currency || 'INR'} ${parseFloat(inv.net_amount || 0).toFixed(2)}`]
      ],
      theme: 'grid'
    });

    // 6. Footer (Remarks & Signature)
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Remarks:", 14, finalY + 15);
    doc.setFont(undefined, 'normal');
    doc.text(inv.remarks || "No specific remarks.", 14, finalY + 21, { maxWidth: 100 });

    doc.setFont(undefined, 'bold');
    doc.text("For DINESH EXPORTS", 140, finalY + 30);
    doc.setFont(undefined, 'normal');
    doc.text("Authorized Signatory", 145, finalY + 50);

    doc.save(`${inv.invoice_no}.pdf`);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedIbpo) return alert("Please select a Buyer Order.");

    try {
      const targetOrder = buyerOrdersList.find(o => o.ibpo_number === selectedIbpo);
      if (!targetOrder) return alert("Buyer Order not found.");

      // Create new sales invoice from this order
      const newInvoice = {
        invoice_no: `PI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random()*9000)}`,
        invoice_date: new Date().toISOString().split('T')[0],
        party_name: targetOrder.party_name || '',
        party_id: targetOrder.party_id || null,
        ibpo: targetOrder.ibpo_number || '',
        design_no: targetOrder.items && targetOrder.items.length > 0 ? targetOrder.items[0].design_no : '',
        invoice_type: activeCard,
        status: 'Draft'
      };

      await salesInvoiceAPI.create(newInvoice);
      alert("Invoice generated successfully from Buyer Order!");
      setShowAutoPullModal(false);
      setSelectedIbpo('');
      fetchInvoices();
    } catch (e) {
      console.error(e);
      alert("Failed to generate invoice.");
    }
  };


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
            <button className="btn btn-primary" onClick={() => setShowAutoPullModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilePlus size={16} /> Generate Invoice from Order
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Party Name</label>
            <input type="text" className="form-control" placeholder="Search party..." style={{ margin: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Buyer Name</label>
            <input type="text" className="form-control" placeholder="Search buyer..." style={{ margin: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Design No.</label>
            <input type="text" className="form-control" placeholder="Search design..." style={{ margin: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Invoice Status</label>
            <select className="form-control" style={{ margin: 0 }}>
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Confirmed</option>
              <option>Completed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Invoice Type</label>
            <select className="form-control" style={{ margin: 0 }}>
              <option>All Types</option>
              <option>Regular</option>
              <option>Special</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Date From</label>
              <input type="date" className="form-control" style={{ margin: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Date To</label>
              <input type="date" className="form-control" style={{ margin: 0 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-secondary" style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff' }}>
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
                <th style={{ padding: '12px 16px' }}>Design No</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.filter(inv => inv.invoice_type === activeCard).length > 0 ? invoices.filter(inv => inv.invoice_type === activeCard).map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_no}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{inv.ibpo || inv.order_ref}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.invoice_date || inv.date}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.party_name}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.design_no}</td>
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <FileCheck size={48} style={{ opacity: 0.2, color: 'var(--primary)' }} />
                      <p style={{ margin: 0, fontSize: 14 }}>No {activeCard}s found matching the current filters.</p>
                      <button className="btn btn-primary" onClick={() => setShowAutoPullModal(true)} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
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

              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
              
              <div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Item specifics</p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Design No:</strong> {selectedInvoice.design_no}</p>
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
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Select a Buyer Order to automatically generate a pre-filled {activeCard}.</p>
            
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
                    <input type="text" className="form-control" placeholder="Authorized Dealer Code" value={editForm.ad_code || ''} onChange={e => setEditForm({...editForm, ad_code: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>IEC Number</label>
                    <input type="text" className="form-control" placeholder="Import Export Code" value={editForm.iec_number || ''} onChange={e => setEditForm({...editForm, iec_number: e.target.value})} />
                  </div>
                </>
              )}
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
