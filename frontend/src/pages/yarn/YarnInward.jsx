import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, ArrowRightLeft, FileText, IndianRupee, MapPin, Activity, CheckCircle, Package } from 'lucide-react';
import { yarnInwardAPI, partyAPI, yarnPurchaseOrderAPI } from '../../services/api';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function YarnInward() {
  const [inwards, setInwards] = useState([]);
  const [parties, setParties] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    entry_date: new Date().toISOString().split('T')[0],
    inward_date: new Date().toISOString().split('T')[0],
    status: 'Received', received_type: 'Direct', received_from: '', po_no_dt: '',
    agent_name: '', stock_godown: '', godown_id: 0, cone_type: 'Full Cone',
    
    order_kgs: 0, received_kgs: 0, balance_kgs: 0, pc_id: '', tolerance_pct: 0,
    bill_no: '', bill_amount: 0, gross_kgs: 0, net_kgs: 0, chipnam: '', due_days: 0,
    
    transport: '', veh_no: '', total_bags: 0, eway_bill: '', org_grn_no: '',
    gate_no: '', wbridge_no: '', w_weight: 0,
    
    other_remarks: '', packing: 'Bags', freight: 0, gross_amount: 0, tax_type: 'GST',
    cgst_pct: 0, sgst_pct: 0, igst_pct: 0, tax_value: 0, tcs_value: 0, tds_pct: 0,
    total_tax: 0, round_off: 0, net_amount: 0, remarks: '',
    
    items: [{
      yarn_count: '', mill_name: '', colour: '', color_code: '', lot_no: '',
      our_id: '', bags: 0, kgs: 0, rate: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [inwRes, partRes, poRes] = await Promise.all([
        yarnInwardAPI.list(), partyAPI.list(), yarnPurchaseOrderAPI.list()
      ]);
      setInwards(inwRes.data);
      setParties(partRes.data);
      setPos(poRes.data);
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
      if (!payload.inward_date) payload.inward_date = null;
      if (!payload.entry_date) payload.entry_date = null;

      if (editingId) {
        await yarnInwardAPI.update(editingId, payload);
      } else {
        await yarnInwardAPI.create(payload);
      }
      
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving inward');
      console.error(err);
    }
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await yarnInwardAPI.get(entry.id);
      if (data.entry_date) data.entry_date = data.entry_date.substring(0, 10);
      if (data.inward_date) data.inward_date = data.inward_date.substring(0, 10);
      
      const dataWithCalculatedAmounts = {
        ...data,
        items: (data.items || []).map(item => ({
          ...item,
          amount: (parseFloat(item.kgs) || 0) * (parseFloat(item.rate) || 0)
        }))
      };
      
      setForm({ ...initialForm, ...dataWithCalculatedAmounts });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('general');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading inward details.");
    }
  };

  const handleDelete = async (id, ref, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${ref}?`)) {
      try {
        await yarnInwardAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await yarnInwardAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    setForm({ ...form, [name]: value });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['bags', 'kgs', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    
    let newGross = parseFloat(form.gross_amount) || 0;
    if (field === 'kgs' || field === 'rate') {
      const newAmt = (parseFloat(newItems[index].kgs) || 0) * (parseFloat(newItems[index].rate) || 0);
      newItems[index].amount = newAmt;
      
      // Also update total gross amount
      newGross = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    }
    
    setForm({ ...form, items: newItems, gross_amount: newGross });
  };

  const filteredInwards = inwards.filter(i => {
    const matchesSearch = searchTerm === '' ||
      i.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.received_from?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All Status' || i.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || i.received_type === typeFilter;
    
    let matchesDate = true;
    if (i.inward_date) {
      const entryDate = new Date(i.inward_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const totalInwards = inwards.length;
  const directInwards = inwards.filter(i => i.received_type === 'Direct').length;
  const poInwards = inwards.filter(i => i.received_type === 'Against PO').length;

  const handleCardClick = (type) => {
    if (type === 'Total') { setStatusFilter('All Status'); setTypeFilter('All Types'); }
    if (type === 'Direct') { setTypeFilter('Direct'); }
    if (type === 'AgainstPO') { setTypeFilter('Against PO'); }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: FileText },
    { id: 'yarn', label: 'Yarn Details', icon: Package },
    { id: 'tax', label: 'Tax & Logistics', icon: IndianRupee }
  ];

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowRightLeft size={24} color="var(--primary)" /> Yarn Purchase Inward
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Record and manage yarn receipts.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setIsReadOnly(false); setShowForm(true); }}>
                <Plus size={18} /> New Inward
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', border: typeFilter === 'All Types' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Activity size={24} /></div>
              <div className="stat-details"><h3>Total Receipts</h3><div className="value">{totalInwards}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Direct')} style={{ cursor: 'pointer', border: typeFilter === 'Direct' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Direct Receipts</h3><div className="value">{directInwards}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('AgainstPO')} style={{ cursor: 'pointer', border: typeFilter === 'Against PO' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Against PO Receipts</h3><div className="value">{poInwards}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search Ref No or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Direct</option><option>Against PO</option>
              </select>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option><option>Received</option><option>Processed</option><option>Cancelled</option>
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
                      <th>Ref No</th><th>Inward Date</th><th>Supplier</th><th>Type</th><th>Net Amount</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredInwards.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No inwards found.</td></tr>
                    ) : filteredInwards.map(i => (
                      <tr key={i.id} onClick={() => handleRowClick(i)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === i.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{i.ref_no}</td>
                        <td>{i.inward_date}</td>
                        <td style={{ fontWeight: 500 }}>{i.received_from || '-'}</td>
                        <td><span className={`badge ${i.received_type === 'Direct' ? 'badge-draft' : 'badge-active'}`}>{i.received_type}</span></td>
                        <td style={{ fontWeight: 600 }}>₹{i.net_amount?.toFixed(2) || '0.00'}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(i, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(i, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(i.id, i.ref_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedViewEntry && (
              <div style={{ flex: '0 0 350px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                      <ArrowRightLeft size={18} /> {selectedViewEntry.ref_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Inward Date" value={selectedViewEntry.inward_date} />
                    <DetailRow label="Type" value={selectedViewEntry.received_type} />
                    <DetailRow label="Supplier" value={selectedViewEntry.received_from} />
                    <DetailRow label="Status" value={selectedViewEntry.status} />
                    <DetailRow label="Bill No" value={selectedViewEntry.bill_no} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financials</h4>
                    <DetailRow label="Bill Amount" value={`₹${selectedViewEntry.bill_amount}`} />
                    <DetailRow label="Total Tax" value={`₹${selectedViewEntry.total_tax}`} />
                    <DetailRow label="Net Amount" value={<span style={{ color: 'var(--primary)', fontSize: 14 }}>₹{selectedViewEntry.net_amount}</span>} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items ({selectedViewEntry.items?.length || 0})</h4>
                    {selectedViewEntry.items?.map((c, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Count: {c.yarn_count}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Bags: {c.bags}</span>
                          <span>Kgs: {c.kgs}</span>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Inward Details' : editingId ? 'Edit Inward' : 'New Yarn Inward'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update Inward' : 'Save Inward'}</button>
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
              
              {activeTab === 'general' && (
                <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>Entry Date *</label><input type="date" className="form-control" name="entry_date" value={form.entry_date} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Inward Date *</label><input type="date" className="form-control" name="inward_date" value={form.inward_date} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Status</label><input className="form-control" name="status" value={form.status} onChange={handleChange} /></div>
                  <div className="form-group"><label>Received From</label>
                    <select className="form-control" name="received_from" value={form.received_from} onChange={handleChange}>
                      <option value="">Select Supplier...</option>
                      {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group"><label>Recvd Type</label>
                    <select className="form-control" name="received_type" value={form.received_type} onChange={handleChange}>
                      <option>Direct</option><option>Against PO</option>
                    </select>
                  </div>
                  <div className="form-group"><label>PO No / Dt</label>
                    <select className="form-control" name="po_no_dt" value={form.po_no_dt} onChange={handleChange} disabled={form.received_type === 'Direct'}>
                      <option value="">Select PO...</option>
                      {pos.map(po => <option key={po.id} value={`${po.po_number} / ${po.po_date}`}>{po.po_number} / {po.po_date}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Agent Name</label><input className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange} /></div>
                  <div className="form-group"><label>Stock Godown</label><input className="form-control" name="stock_godown" value={form.stock_godown} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Godown ID</label><input type="number" className="form-control" name="godown_id" value={form.godown_id} onChange={handleChange} /></div>
                  <div className="form-group"><label>Cone Type</label>
                    <select className="form-control" name="cone_type" value={form.cone_type} onChange={handleChange}>
                      <option>Full Cone</option><option>Half Cone</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Order Kgs</label><input type="number" className="form-control" name="order_kgs" value={form.order_kgs} onChange={handleChange} /></div>
                  <div className="form-group"><label>Received Kgs</label><input type="number" className="form-control" name="received_kgs" value={form.received_kgs} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Balance Kgs</label><input type="number" className="form-control" name="balance_kgs" value={form.balance_kgs} onChange={handleChange} /></div>
                  <div className="form-group"><label>Pc ID</label><input className="form-control" name="pc_id" value={form.pc_id} onChange={handleChange} /></div>
                  <div className="form-group"><label>Tolerance %</label><input type="number" className="form-control" name="tolerance_pct" value={form.tolerance_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>Bill No</label><input className="form-control" name="bill_no" value={form.bill_no} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Bill Amount</label><input type="number" className="form-control" name="bill_amount" value={form.bill_amount} onChange={handleChange} /></div>
                  <div className="form-group"><label>Gross Kgs</label><input type="number" className="form-control" name="gross_kgs" value={form.gross_kgs} onChange={handleChange} /></div>
                  <div className="form-group"><label>Net Kgs</label><input type="number" className="form-control" name="net_kgs" value={form.net_kgs} onChange={handleChange} /></div>
                  <div className="form-group"><label>Chipnam</label><input className="form-control" name="chipnam" value={form.chipnam} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Due Days</label><input type="number" className="form-control" name="due_days" value={form.due_days} onChange={handleChange} /></div>
                  <div className="form-group"><label>Transport</label><input className="form-control" name="transport" value={form.transport} onChange={handleChange} /></div>
                  <div className="form-group"><label>Veh No</label><input className="form-control" name="veh_no" value={form.veh_no} onChange={handleChange} /></div>
                  <div className="form-group"><label>Total Bags</label><input type="number" className="form-control" name="total_bags" value={form.total_bags} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>E-Way Bill</label><input className="form-control" name="eway_bill" value={form.eway_bill} onChange={handleChange} /></div>
                  <div className="form-group"><label>Org GRN No</label><input className="form-control" name="org_grn_no" value={form.org_grn_no} onChange={handleChange} /></div>
                  <div className="form-group"><label>Gate No</label><input className="form-control" name="gate_no" value={form.gate_no} onChange={handleChange} /></div>
                  <div className="form-group"><label>Weighbridge No</label><input className="form-control" name="wbridge_no" value={form.wbridge_no} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>W Weight</label><input type="number" className="form-control" name="w_weight" value={form.w_weight} onChange={handleChange} /></div>
                </div>
              )}

              {activeTab === 'yarn' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Row</button>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SNo</th><th>Yarn Count</th><th>Mill</th><th>Colour</th><th>Color Code</th><th>Lot No</th><th>Our Id</th>
                          <th>Bags</th><th>Kgs</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><input className="form-control" style={{ width: 100 }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120 }} value={item.mill_name} onChange={e => updateItem(idx, 'mill_name', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100 }} value={item.colour} onChange={e => updateItem(idx, 'colour', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80 }} value={item.color_code} onChange={e => updateItem(idx, 'color_code', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80 }} value={item.lot_no} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80 }} value={item.our_id} onChange={e => updateItem(idx, 'our_id', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.kgs} onChange={e => updateItem(idx, 'kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70 }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80 }} value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} disabled /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'tax' && (
                <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>Packing</label>
                    <select className="form-control" name="packing" value={form.packing} onChange={handleChange}>
                      <option>Bags</option><option>Boxes</option><option>Pallets</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Freight</label><input type="number" className="form-control" name="freight" value={form.freight} onChange={handleChange} /></div>
                  <div className="form-group"><label>Gross Amount</label><input type="number" className="form-control" name="gross_amount" value={form.gross_amount} onChange={handleChange} /></div>
                  <div className="form-group"><label>TAX Type</label>
                    <select className="form-control" name="tax_type" value={form.tax_type} onChange={handleChange}>
                      <option>GST</option><option>IGST</option><option>Exempt</option>
                    </select>
                  </div>
                  
                  <div className="form-group"><label>CGST %</label><input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>SGST %</label><input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>IGST %</label><input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>Tax Value</label><input type="number" className="form-control" name="tax_value" value={form.tax_value} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>TCS Value</label><input type="number" className="form-control" name="tcs_value" value={form.tcs_value} onChange={handleChange} /></div>
                  <div className="form-group"><label>TDS %</label><input type="number" className="form-control" name="tds_pct" value={form.tds_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>Total Tax</label><input type="number" className="form-control" name="total_tax" value={form.total_tax} onChange={handleChange} /></div>
                  <div className="form-group"><label>Round Off</label><input type="number" className="form-control" name="round_off" value={form.round_off} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Nett Amount</label><input type="number" className="form-control" style={{ fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1' }} name="net_amount" value={form.net_amount} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Other Remarks</label><input className="form-control" name="other_remarks" value={form.other_remarks} onChange={handleChange} /></div>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
