import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, Truck, FileText, IndianRupee, Layers, Download, ChevronDown } from 'lucide-react';
import { yarnPurchaseOrderAPI, partyAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function YarnPurchaseOrder() {
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [editingId, setEditingId] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    po_date: new Date().toISOString().split('T')[0],
    org_name: '', internal_po_no: '', used_for: '', against_ref: '', agent_name: '',
    supplier_name: '', delivery_at: '',
    
    freight_type: '', freight_chg: 0, insurance_chg: 0, total_order_kgs: 0,
    transport: '', tax_type: '', taxable_amount: 0, dispatch_date: '',
    packing_type: '', sgst_pct: 0, cgst_pct: 0, igst_pct: 0, labeling: '',
    colour: '', net_amount: 0, due_days: 0, remarks: '', status: 'Active',
    
    count_details: [{
      supplier_name: '', fibre_group: '', yarn_count: '', yarn_csp: 0,
      min_cone_wgt: 0, order_kgs: 0, mill_name: '', print_name: '', tolerance_pct: 0
    }],
    indent_details: [{
      req_ind_no: '', design_no: '', ibpo_no: '', party_name: '', fabric_name: '',
      yarn_count: '', order_mtrs: 0, warp_qty: 0, weft_qty: 0, tot_reqd_qty: 0,
      appd_qty: 0, order_qty: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [ordRes, partRes] = await Promise.all([
        yarnPurchaseOrderAPI.list(), partyAPI.list()
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.dispatch_date) payload.dispatch_date = null;

      if (editingId) {
        await yarnPurchaseOrderAPI.update(editingId, payload);
      } else {
        await yarnPurchaseOrderAPI.create(payload);
      }
      
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving order');
      console.error(err);
    }
  };

  const handleOpenForm = async (order, readOnly = false) => {
    try {
      const { data } = await yarnPurchaseOrderAPI.get(order.id);
      if (data.po_date) data.po_date = data.po_date.substring(0, 10);
      if (data.dispatch_date) data.dispatch_date = data.dispatch_date.substring(0, 10);
      
      setForm({ ...initialForm, ...data });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('main');
      setShowForm(true);
      setSelectedViewOrder(null);
    } catch (err) {
      alert("Error loading order details.");
    }
  };

  const handleDelete = async (id, po, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${po}?`)) {
      try {
        await yarnPurchaseOrderAPI.delete(id);
        if (selectedViewOrder?.id === id) setSelectedViewOrder(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (order) => {
    try {
      const { data } = await yarnPurchaseOrderAPI.get(order.id);
      setSelectedViewOrder(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    setForm({ ...form, [name]: value });
  };

  // Dynamic Item Handlers
  const addCountDetail = () => setForm({ ...form, count_details: [...form.count_details, initialForm.count_details[0]] });
  const removeCountDetail = (index) => setForm({ ...form, count_details: form.count_details.filter((_, i) => i !== index) });
  const updateCountDetail = (index, field, value) => {
    const newItems = [...form.count_details];
    let val = value;
    if (['yarn_csp', 'min_cone_wgt', 'order_kgs', 'tolerance_pct'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    setForm({ ...form, count_details: newItems });
  };

  const addIndentDetail = () => setForm({ ...form, indent_details: [...form.indent_details, initialForm.indent_details[0]] });
  const removeIndentDetail = (index) => setForm({ ...form, indent_details: form.indent_details.filter((_, i) => i !== index) });
  const updateIndentDetail = (index, field, value) => {
    const newItems = [...form.indent_details];
    let val = value;
    if (['order_mtrs', 'warp_qty', 'weft_qty', 'tot_reqd_qty', 'appd_qty', 'order_qty'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    setForm({ ...form, indent_details: newItems });
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchTerm === '' ||
      o.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const totalPOs = orders.length;
  const activePOs = orders.filter(o => o.status === 'Active').length;
  const closedPOs = orders.filter(o => o.status === 'Closed').length;

  const handleCardClick = (type) => {
    if (type === 'Total') setStatusFilter('All Status');
    if (type === 'Active') setStatusFilter('Active');
    if (type === 'Closed') setStatusFilter('Closed');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Yarn Purchase Orders", 14, 15);
    const headers = [["PO No", "Date", "Supplier", "Amount", "Status"]];
    const rows = filteredOrders.map(o => [
      o.po_number || '-',
      o.po_date || '-',
      o.supplier_name || o.org_name || '-',
      `Rs. ${o.net_amount?.toFixed(2) || '0.00'}`,
      o.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Yarn_POs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(o => ({
      "PO No": o.po_number,
      "Date": o.po_date,
      "Internal PO No": o.internal_po_no,
      "Org Name": o.org_name,
      "Supplier": o.supplier_name,
      "Agent Name": o.agent_name,
      "Amount": o.net_amount,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yarn POs");
    XLSX.writeFile(wb, `Yarn_POs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tabs = [
    { id: 'main', label: 'Order Info', icon: FileText },
    { id: 'yarn', label: 'Yarn Count Details', icon: Package },
    { id: 'indent', label: 'Indent / Design', icon: Layers },
    { id: 'tax', label: 'Tax & Logistics', icon: IndianRupee }
  ];

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={24} color="var(--primary)" /> Yarn Purchase Orders
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage yarn procurement and indents.</p>
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
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setIsReadOnly(false); setShowForm(true); }}>
                <Plus size={18} /> New Order
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', border: statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Package size={24} /></div>
              <div className="stat-details"><h3>Total POs</h3><div className="value">{totalPOs}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active POs</h3><div className="value">{activePOs}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Closed')} style={{ cursor: 'pointer', border: statusFilter === 'Closed' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Closed POs</h3><div className="value">{closedPOs}</div></div>
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

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PO No</th><th>Date</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No POs found.</td></tr>
                    ) : filteredOrders.map(o => (
                      <tr key={o.id} onClick={() => handleRowClick(o)} style={{ cursor: 'pointer', background: selectedViewOrder?.id === o.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{o.po_number}</td>
                        <td>{o.po_date}</td>
                        <td style={{ fontWeight: 500 }}>{o.supplier_name || o.org_name || '-'}</td>
                        <td style={{ fontWeight: 600 }}>₹{o.net_amount?.toFixed(2) || '0.00'}</td>
                        <td><span className={`badge ${o.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{o.status}</span></td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(o.id, o.po_number, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedViewOrder && (
              <div style={{ flex: '0 0 350px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                      <Package size={18} /> {selectedViewOrder.po_number}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewOrder, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewOrder, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Date" value={selectedViewOrder.po_date} />
                    <DetailRow label="Internal PO No" value={selectedViewOrder.internal_po_no} />
                    <DetailRow label="Org Name" value={selectedViewOrder.org_name} />
                    <DetailRow label="Supplier" value={selectedViewOrder.supplier_name} />
                    <DetailRow label="Status" value={selectedViewOrder.status} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financials</h4>
                    <DetailRow label="Taxable Amt" value={`₹${selectedViewOrder.taxable_amount}`} />
                    <DetailRow label="IGST" value={`${selectedViewOrder.igst_pct}%`} />
                    <DetailRow label="Net Amount" value={<span style={{ color: 'var(--primary)', fontSize: 14 }}>₹{selectedViewOrder.net_amount}</span>} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items ({selectedViewOrder.count_details?.length || 0})</h4>
                    {selectedViewOrder.count_details?.map((c, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Count: {c.yarn_count}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Group: {c.fibre_group}</span>
                          <span>Kgs: {c.order_kgs}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View PO Details' : editingId ? 'Edit PO' : 'New Purchase Order'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update PO' : 'Save PO'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
                }}
              >
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              {activeTab === 'main' && (
                <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>Order Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Org. Name</label>
                    <select className="form-control" name="org_name" value={form.org_name} onChange={handleChange}>
                      <option value="">Select Org...</option><option>Dinesh Textile Main</option><option>Unit 2</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Internal PO No</label><input className="form-control" name="internal_po_no" value={form.internal_po_no} onChange={handleChange} /></div>
                  <div className="form-group"><label>Used For</label><input className="form-control" name="used_for" value={form.used_for} onChange={handleChange} /></div>
                  <div className="form-group"><label>Against Reference</label>
                    <select className="form-control" name="against_ref" value={form.against_ref} onChange={handleChange}>
                      <option value="">Select...</option><option>Direct</option><option>Buyer Order</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Agent Name</label><input className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Supplier Name</label>
                    <select className="form-control" name="supplier_name" value={form.supplier_name} onChange={handleChange}>
                      <option value="">Select Supplier...</option>
                      {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Delivery At</label><input className="form-control" name="delivery_at" value={form.delivery_at} onChange={handleChange} /></div>
                  <div className="form-group"><label>Status</label>
                    <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                      <option>Active</option><option>Closed</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'yarn' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addCountDetail}><Plus size={16} /> Add Yarn Count</button>
                  </div>
                  
                  {form.count_details.map((item, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border)', padding: 16, borderRadius: 8, marginBottom: 16, background: '#fafafa', position: 'relative' }}>
                      <button type="button" onClick={() => removeCountDetail(idx)} style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}><X size={14}/></button>
                      <h4 style={{ marginTop: 0, marginBottom: 12 }}>Yarn #{idx + 1}</h4>
                      <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        <div className="form-group"><label>Supplier Name</label><input className="form-control" value={item.supplier_name} onChange={e => updateCountDetail(idx, 'supplier_name', e.target.value)} /></div>
                        <div className="form-group"><label>Fibre Group</label><input className="form-control" value={item.fibre_group} onChange={e => updateCountDetail(idx, 'fibre_group', e.target.value)} /></div>
                        <div className="form-group"><label>Yarn Count</label><input className="form-control" value={item.yarn_count} onChange={e => updateCountDetail(idx, 'yarn_count', e.target.value)} /></div>
                        <div className="form-group"><label>Yarn CSP</label><input type="number" className="form-control" value={item.yarn_csp} onChange={e => updateCountDetail(idx, 'yarn_csp', e.target.value)} /></div>
                        <div className="form-group"><label>Min Cone Wgt</label><input type="number" className="form-control" value={item.min_cone_wgt} onChange={e => updateCountDetail(idx, 'min_cone_wgt', e.target.value)} /></div>
                        <div className="form-group"><label>Order Kgs</label><input type="number" className="form-control" value={item.order_kgs} onChange={e => updateCountDetail(idx, 'order_kgs', e.target.value)} /></div>
                        <div className="form-group"><label>Mill Name</label><input className="form-control" value={item.mill_name} onChange={e => updateCountDetail(idx, 'mill_name', e.target.value)} /></div>
                        <div className="form-group"><label>Print Name</label><input className="form-control" value={item.print_name} onChange={e => updateCountDetail(idx, 'print_name', e.target.value)} /></div>
                        <div className="form-group"><label>Tolerance %</label><input type="number" className="form-control" value={item.tolerance_pct} onChange={e => updateCountDetail(idx, 'tolerance_pct', e.target.value)} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'indent' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addIndentDetail}><Plus size={16} /> Add Indent Row</button>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SNo</th><th>Req Ind No</th><th>Design No</th><th>IBPO No</th><th>Party Name</th><th>Fabric Name</th><th>Yarn Count</th>
                          <th>Order Mtrs</th><th>Warp Qty</th><th>Weft Qty</th><th>Reqd Qty</th><th>Appd Qty</th><th>Order Qty</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.indent_details.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><input className="form-control" style={{ width: 100 }} value={item.req_ind_no} onChange={e => updateIndentDetail(idx, 'req_ind_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100 }} value={item.design_no} onChange={e => updateIndentDetail(idx, 'design_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100 }} value={item.ibpo_no} onChange={e => updateIndentDetail(idx, 'ibpo_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120 }} value={item.party_name} onChange={e => updateIndentDetail(idx, 'party_name', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120 }} value={item.fabric_name} onChange={e => updateIndentDetail(idx, 'fabric_name', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80 }} value={item.yarn_count} onChange={e => updateIndentDetail(idx, 'yarn_count', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.order_mtrs} onChange={e => updateIndentDetail(idx, 'order_mtrs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.warp_qty} onChange={e => updateIndentDetail(idx, 'warp_qty', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.weft_qty} onChange={e => updateIndentDetail(idx, 'weft_qty', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.tot_reqd_qty} onChange={e => updateIndentDetail(idx, 'tot_reqd_qty', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.appd_qty} onChange={e => updateIndentDetail(idx, 'appd_qty', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.order_qty} onChange={e => updateIndentDetail(idx, 'order_qty', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeIndentDetail(idx)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'tax' && (
                <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>Freight Type</label>
                    <select className="form-control" name="freight_type" value={form.freight_type} onChange={handleChange}>
                      <option>To Pay</option><option>Paid</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Freight Chg</label><input type="number" className="form-control" name="freight_chg" value={form.freight_chg} onChange={handleChange} /></div>
                  <div className="form-group"><label>Insurance Chg</label><input type="number" className="form-control" name="insurance_chg" value={form.insurance_chg} onChange={handleChange} /></div>
                  <div className="form-group"><label>Total Order Kgs</label><input type="number" className="form-control" name="total_order_kgs" value={form.total_order_kgs} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Transport</label><input className="form-control" name="transport" value={form.transport} onChange={handleChange} /></div>
                  <div className="form-group"><label>TAX Type</label>
                    <select className="form-control" name="tax_type" value={form.tax_type} onChange={handleChange}>
                      <option>GST</option><option>IGST</option><option>Exempt</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Taxable Amount</label><input type="number" className="form-control" name="taxable_amount" value={form.taxable_amount} onChange={handleChange} /></div>
                  <div className="form-group"><label>Dispatch Date</label><input type="date" className="form-control" name="dispatch_date" value={form.dispatch_date} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Packing Type</label>
                    <select className="form-control" name="packing_type" value={form.packing_type} onChange={handleChange}>
                      <option>Bags</option><option>Boxes</option><option>Pallets</option>
                    </select>
                  </div>
                  <div className="form-group"><label>SGST %</label><input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>CGST %</label><input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>IGST %</label><input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Labeling</label><input className="form-control" name="labeling" value={form.labeling} onChange={handleChange} /></div>
                  <div className="form-group"><label>Colour</label><input className="form-control" name="colour" value={form.colour} onChange={handleChange} /></div>
                  <div className="form-group"><label>Due Days</label><input type="number" className="form-control" name="due_days" value={form.due_days} onChange={handleChange} /></div>
                  <div className="form-group"><label>Nett Amount</label><input type="number" className="form-control" style={{ fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1' }} name="net_amount" value={form.net_amount} onChange={handleChange} /></div>
                  
                  <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
