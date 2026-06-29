import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, FileText, Layers, IndianRupee, Factory, Download, Table } from 'lucide-react';
import { warpingSizingPOAPI, partyAPI, dropdownAPI, buyerOrderAPI, designEntryAPI } from '../../services/api';
import CustomPODocumentPreview from '../../components/CustomPODocumentPreview';

export default function WarpingSizingPO() {
  const title = 'Warping / Sizing PO';
  const description = 'Manage warping and sizing purchase orders';
  const Icon = Factory;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeSection, setActiveSection] = useState('info');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  
  const initialForm = {
    org_name: '', ref_no_1: '', ref_no_2: '', order_no: '', order_date: new Date().toISOString().split('T')[0],
    completion_date: '', order_type: '', party_name: '',
    design_no: '', beam_type: '', fabric: '',
    reed: '', pick: '', warp_width: '', warp_ends: '',
    warp_meters: '', weft_meters: '', fabric_width: '', finished_width: '',
    wages_input: '', wages_type: '', selected_count: '',
    merchandiser: '', payment_terms: '', certificate_type: '', loom_type: '',
    items: [{ weaver_name: '', no_of_beam: '' }],
    tax_type: '', gross_amt: 0, cgst_pct: 0, cgst_amount: 0, sgst_pct: 0, sgst_amount: 0, igst_pct: 0, igst_amount: 0,
    remarks: '', total_beam_kgs: '', net_amount: 0
  };

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes, dsRes] = await Promise.all([
        warpingSizingPOAPI.list(),
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
    const grossAmt = parseFloat(updatedForm.gross_amt) || 0;
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;
    const cgstAmount = parseFloat(((cgstPct / 100) * grossAmt).toFixed(2));
    const sgstAmount = parseFloat(((sgstPct / 100) * grossAmt).toFixed(2));
    const igstAmount = parseFloat(((igstPct / 100) * grossAmt).toFixed(2));
    const netAmount = grossAmt + cgstAmount + sgstAmount + igstAmount;
    return { ...updatedForm, cgst_amount: cgstAmount, sgst_amount: sgstAmount, igst_amount: igstAmount, net_amount: netAmount };
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
      setForm(recalculate({
        ...form,
        design_no: value,
        merchandiser: de?.buyer_name || form.merchandiser
      }));
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['no_of_beam'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    setForm(recalculate({ ...form, items: newItems }));
  };

  const addItem = () => setForm(recalculate({ ...form, items: [...form.items, initialForm.items[0]] }));
  const removeItem = (index) => setForm(recalculate({ ...form, items: form.items.filter((_, i) => i !== index) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.delivery_date) payload.delivery_date = null;

      if (form.id) {
        await warpingSizingPOAPI.update(form.id, payload);
      } else {
        await warpingSizingPOAPI.create(payload);
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
    const matchesSearch = searchTerm === '' ||
      o.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier_job_worker?.toLowerCase().includes(searchTerm.toLowerCase());
      
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
                      <td style={{ fontWeight: 500 }}>{order.supplier_job_worker}</td>
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
            title="WARPING / SIZING PO"
            poNumber={selectedViewOrder?.po_no}
            poDate={selectedViewOrder?.po_date}
            deliveryAt="1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008."
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
              { label: 'Yarn Name', align: 'left', width: '25%' },
              { label: 'Count / Type', align: 'center', width: '15%' },
              { label: 'Lot / Shade', align: 'left', width: '15%' },
              { label: 'Qty (Kg)', align: 'right', width: '15%' },
              { label: 'Rate/Kg', align: 'right', width: '10%' },
              { label: 'Amount', align: 'right', width: '20%' }
            ]}
            tableRows={(selectedViewOrder?.items || []).map(i => ({
              rowData: [
                i.yarn_name || '-',
                `${i.yarn_count || '-'} / ${i.yarn_type || '-'}`,
                `${i.lot_no || '-'} / ${i.shade || '-'}`,
                parseFloat(i.qty_kg || 0).toFixed(2),
                parseFloat(i.rate_per_kg || 0).toFixed(2),
                parseFloat(i.amount || 0).toFixed(2)
              ],
              rowNote: i.yarn_code ? `Yarn Code: ${i.yarn_code}` : null
            }))}
          />
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
              { id: 'items', label: 'Weaver Details', icon: Package }, 
              { id: 'tax', label: 'Tax & Summary', icon: IndianRupee }
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
                <div className="form-group"><label>Org.Name</label><input type="text" className="form-control" name="org_name" value={form.org_name} onChange={handleChange} /></div>
                <div className="form-group"><label>Ref No</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" className="form-control" name="ref_no_1" value={form.ref_no_1} onChange={handleChange} style={{ width: '50%' }} />
                    <input type="text" className="form-control" name="ref_no_2" value={form.ref_no_2} onChange={handleChange} style={{ width: '50%' }} />
                  </div>
                </div>
                <div className="form-group"><label>Order No *</label>
                  <select className="form-control" name="order_no" value={form.order_no} onChange={handleChange} required>
                    <option value="">Select Order...</option>
                    {buyerOrders.map(bo => (
                      <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Order Date</label><input type="date" className="form-control" name="order_date" value={form.order_date} onChange={handleChange} required /></div>
                
                <div className="form-group"><label>Completion Date</label><input type="date" className="form-control" name="completion_date" value={form.completion_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Order Type</label>
                  <select className="form-control" name="order_type" value={form.order_type} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Against SP No.">Against SP No.</option>
                    <option value="Direct">Direct</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                  <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                    <option value="">Select...</option>
                    {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                  </select>
                </div>

                <div className="form-group"><label>Design No *</label>
                  <select className="form-control" name="design_no" value={form.design_no} onChange={handleChange} required>
                    <option value="">Select Design...</option>
                    {designEntries.map(de => (
                      <option key={de.id} value={de.ds_ref_no}>{de.ds_ref_no} ({de.design_no})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Beam Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }}>Insert</button>
                    <select className="form-control" name="beam_type" value={form.beam_type} onChange={handleChange} style={{ flex: 1 }}>
                      <option value="">Select...</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Fabric</label><input type="text" className="form-control" name="fabric" value={form.fabric} onChange={handleChange} /></div>

                <div className="form-group"><label>Reed</label><input type="text" className="form-control" name="reed" value={form.reed} onChange={handleChange} /></div>
                <div className="form-group"><label>Pick</label><input type="text" className="form-control" name="pick" value={form.pick} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Width</label><input type="text" className="form-control" name="warp_width" value={form.warp_width} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Ends</label><input type="text" className="form-control" name="warp_ends" value={form.warp_ends} onChange={handleChange} /></div>

                <div className="form-group"><label>Warp Meters</label><input type="text" className="form-control" name="warp_meters" value={form.warp_meters} onChange={handleChange} /></div>
                <div className="form-group"><label>Weft Meters</label><input type="text" className="form-control" name="weft_meters" value={form.weft_meters} onChange={handleChange} /></div>
                <div className="form-group"><label>Fabric Width</label><input type="text" className="form-control" name="fabric_width" value={form.fabric_width} onChange={handleChange} /></div>
                <div className="form-group"><label>Finished Width</label><input type="text" className="form-control" name="finished_width" value={form.finished_width} onChange={handleChange} /></div>

                <div className="form-group"><label>Wages / Mtr / Kgs</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" className="form-control" name="wages_input" value={form.wages_input} onChange={handleChange} style={{ width: '50%' }} />
                    <select className="form-control" name="wages_type" value={form.wages_type} onChange={handleChange} style={{ width: '50%' }}>
                      <option value="">Select...</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Selected Count</label><input type="text" className="form-control" name="selected_count" value={form.selected_count} onChange={handleChange} /></div>

                <div className="form-group"><label>Merchandiser</label><input type="text" className="form-control" name="merchandiser" value={form.merchandiser} onChange={handleChange} /></div>
                <div className="form-group"><label>Payment Terms</label><input type="text" className="form-control" name="payment_terms" value={form.payment_terms} onChange={handleChange} /></div>
                <div className="form-group"><label>Certificate Type</label>
                  <select className="form-control" name="certificate_type" value={form.certificate_type} onChange={handleChange}>
                    <option value="">Select...</option>
                  </select>
                </div>
                <div className="form-group"><label>Loom Type</label>
                  <select className="form-control" name="loom_type" value={form.loom_type} onChange={handleChange}>
                    <option value="">Select...</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Weaver Details */}
            <div id="section-items" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Weaver Details</h4>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add</button>
              </div>
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                <table className="data-table" style={{ minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Weaver Name</th>
                      <th>No.of Beam</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <select className="form-control" style={{ margin: 0 }} value={item.weaver_name} onChange={e => updateItem(idx, 'weaver_name', e.target.value)}>
                            <option value="">Select...</option>
                          </select>
                        </td>
                        <td><input type="number" className="form-control" style={{ width: 120, margin: 0 }} value={item.no_of_beam} onChange={e => updateItem(idx, 'no_of_beam', e.target.value)} /></td>
                        <td><button type="button" className="icon-btn" onClick={() => removeItem(idx)} style={{ color: 'red' }}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Tax & Summary */}
            <div id="section-tax" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Summary</h4>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TAX & SUMMARY</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>Tax Type</label>
                      <select className="form-control" name="tax_type" value={form.tax_type} onChange={handleChange}>
                        <option value="">Select...</option>
                        <option value="GST">GST</option>
                        <option value="IGST">IGST</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Gross Amt</label><input type="number" className="form-control" name="gross_amt" value={form.gross_amt} onChange={handleChange} /></div>
                    <div className="form-group"><label>CGST %</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} style={{ width: '40%' }} />
                        <input type="number" className="form-control" value={form.cgst_amount} disabled style={{ width: '60%', background: '#f1f5f9' }} />
                      </div>
                    </div>
                    <div className="form-group"><label>SGST %</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} style={{ width: '40%' }} />
                        <input type="number" className="form-control" value={form.sgst_amount} disabled style={{ width: '60%', background: '#f1f5f9' }} />
                      </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Remarks</label><input type="text" className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total Beam / Kgs</label><input type="text" className="form-control" name="total_beam_kgs" value={form.total_beam_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>IGST %</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} style={{ width: '40%' }} />
                        <input type="number" className="form-control" value={form.igst_amount} disabled style={{ width: '60%', background: '#f1f5f9' }} />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>NET AMOUNT</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px', background: '#fdf4ff', padding: '4px 16px', borderRadius: 4, border: '1px solid #fbcfe8' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
