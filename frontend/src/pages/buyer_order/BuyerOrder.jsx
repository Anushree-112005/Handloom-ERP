import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, FileText, CreditCard, Truck, Settings, MessageSquare, ClipboardList, Edit2, Filter, CheckCircle, ShoppingCart, Briefcase, Users, Star } from 'lucide-react';
import { buyerOrderAPI, partyAPI, employeeAPI } from '../../services/api';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function BuyerOrder() {
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [editingId, setEditingId] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    order_date: new Date().toISOString().split('T')[0],
    party_id: '', party_name: '', billing_address: '', agent_name: '',
    order_type: 'Regular', certified_type: '', buyer_name: '',
    state: '', state_code: '', gst_no: '', pan_no: '',
    commission_type: 'Percentage', commission_pct: 0, order_taken_by: '',
    nomination_type: '', regular_special: 'Regular',

    outstanding: 0, overdue: 0, due_30_days: 0, status: 'Active',
    status_remark: '', max_crd_days: 0, po_credit: 0, po_max_crd: 0, bill_credit: 0,
    payment_detail: '', payment_terms: 'Net 30', payment_file_path: '',

    transport_mode: 'Road', transport_name: '', party_terms: 'FOB',
    lr_type: '', lr_terms: '', party_comp_date: '', exfactory_date: '',
    delivery_starting: '', delivery_at: '', desp_mtr_min: 0, desp_mtr_max: 0,
    delivery_place: '', delivery_address: '',

    process_sequence: '',
    process_instruction: '', email_to: '', email_cc: '',
    yarn_instruction: '', prod_instruction: '', delivery_instruction: '', remarks: '',
    
    items: [{
      party_po_no: '', po_date: '', point_of_contact: '', order_mtrs: 0, uom: 'MTR',
      tolerance_pct: 0, total_mtr_yard: 0, hsn_code: '', sample_mtr: 0, buyer_style: '',
      short_no: '', design_no: '', gry_construction: '', fabric_type: 'Cotton', color: '',
      construction: '', weaving_type: 'Plain', pick_on_table: 0, print_name: '',
      finish_reed: 0, finish_pick: 0, finish_width: 0, cuttable_width: 0, pattern: 'Solid',
      packing_type: 'Roll', loom_type: '', insurance: 'No', packing_charge: 0, end_use: '',
      season: 'All Season', party_comment: '', fabric_content: '', development_id: '',
      country: 'India', combo: '', currency: 'INR', pc_type: '', gsm: 0, price: 0,
      gst_pct: 0, gst_rate: 0, rate: 0, amount: 0, image_design_path: '', party_terms: ''
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [ordersRes, partiesRes, empRes] = await Promise.all([
        buyerOrderAPI.list(),
        partyAPI.list(),
        employeeAPI.list()
      ]);
      setOrders(ordersRes.data);
      setParties(partiesRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.party_id) payload.party_id = null;
      
      ['party_comp_date', 'exfactory_date', 'delivery_starting'].forEach(field => {
        if (!payload[field]) payload[field] = null;
      });
      payload.items = payload.items.map(item => {
        const itemCopy = { ...item };
        if (!itemCopy.po_date) itemCopy.po_date = null;
        return itemCopy;
      });

      if (editingId) {
        await buyerOrderAPI.update(editingId, payload);
      } else {
        await buyerOrderAPI.create(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving buyer order');
      console.error(err);
    }
  };

  const handleOpenForm = async (order, readOnly = false) => {
    try {
      const { data } = await buyerOrderAPI.get(order.id);
      const editForm = { ...initialForm, ...data };
      
      if (editForm.order_date) editForm.order_date = editForm.order_date.substring(0, 10);
      if (editForm.party_comp_date) editForm.party_comp_date = editForm.party_comp_date.substring(0, 10);
      if (editForm.exfactory_date) editForm.exfactory_date = editForm.exfactory_date.substring(0, 10);
      if (editForm.delivery_starting) editForm.delivery_starting = editForm.delivery_starting.substring(0, 10);
      
      if (editForm.items) {
        editForm.items = editForm.items.map(i => {
          if (i.po_date) i.po_date = i.po_date.substring(0, 10);
          return i;
        });
      }

      setForm(editForm);
      setEditingId(data.id);
      setActiveTab('main');
      setIsReadOnly(readOnly);
      setShowForm(true);
      setSelectedViewOrder(null);
    } catch (err) {
      alert("Error loading order details.");
    }
  };

  const handleDelete = async (id, ibpo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete order ${ibpo}?`)) {
      try {
        await buyerOrderAPI.delete(id);
        if (selectedViewOrder?.id === id) setSelectedViewOrder(null);
        loadData();
      } catch (err) {
        alert('Error deleting order');
        console.error(err);
      }
    }
  };

  const handleRowClick = async (order) => {
    try {
      const { data } = await buyerOrderAPI.get(order.id);
      setSelectedViewOrder(data);
    } catch (err) {
      console.error("Error fetching order details", err);
    }
  };

  const handlePartyChange = (e) => {
    const partyId = e.target.value;
    const party = parties.find(p => p.id.toString() === partyId);
    setForm({
      ...form,
      party_id: partyId,
      party_name: party ? party.company_name : '',
      billing_address: party ? party.address : '',
      state: party ? party.state : '',
      gst_no: party ? party.gst_number : '',
      pan_no: party ? party.pan_number : '',
    });
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
    if (['order_mtrs', 'rate', 'tolerance_pct', 'sample_mtr', 'pick_on_table', 'finish_reed', 'finish_pick', 'finish_width', 'cuttable_width', 'packing_charge', 'gsm', 'price', 'gst_pct', 'gst_rate'].includes(field)) {
        val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;
    
    if (field === 'order_mtrs' || field === 'rate') {
      const mtrs = field === 'order_mtrs' ? val : (newItems[index].order_mtrs || 0);
      const rate = field === 'rate' ? val : (newItems[index].rate || 0);
      newItems[index].amount = mtrs * rate;
    }
    setForm({ ...form, items: newItems });
  };

  const tabs = [
    { id: 'main', label: 'Main Details', icon: FileText },
    { id: 'payment', label: 'Payment Details', icon: CreditCard },
    { id: 'items', label: 'Party PO Details', icon: ClipboardList },
    { id: 'transport', label: 'Transport & Delivery', icon: Truck },
    { id: 'process', label: 'Process Follow', icon: Settings },
    { id: 'instructions', label: 'Instructions', icon: MessageSquare }
  ];

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchTerm === '' ||
      o.ibpo_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.party_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All Types' || (o.order_type || 'Regular') === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || o.status === statusFilter;

    let matchesDate = true;
    if (o.order_date) {
      const orderDate = new Date(o.order_date);
      if (fromDate) matchesDate = matchesDate && orderDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && orderDate <= tDate;
      }
    }
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const totalOrders = orders.length;
  const regularOrders = orders.filter(o => (o.order_type || 'Regular') === 'Regular').length;
  const specialOrders = orders.filter(o => o.order_type === 'Special').length;
  const activeOrders = orders.filter(o => o.status === 'Active').length;

  const handleCardClick = (type) => {
    if (type === 'Total') {
      setTypeFilter('All Types');
      setStatusFilter('All Status');
    } else if (type === 'Regular') {
      setTypeFilter('Regular');
      setStatusFilter('All Status');
    } else if (type === 'Special') {
      setTypeFilter('Special');
      setStatusFilter('All Status');
    } else if (type === 'Active') {
      setTypeFilter('All Types');
      setStatusFilter('Active');
    }
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={24} color="var(--primary)" /> Buyer Orders
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage all buyer orders, payments, and logistics.</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setIsReadOnly(false); setShowForm(true); }}>
              <Plus size={16} /> New Order
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', border: typeFilter === 'All Types' && statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><ShoppingCart size={24} /></div>
              <div className="stat-details"><h3>Total Orders</h3><div className="value">{totalOrders}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Regular')} style={{ cursor: 'pointer', border: typeFilter === 'Regular' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Regular Orders</h3><div className="value">{regularOrders}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Special')} style={{ cursor: 'pointer', border: typeFilter === 'Special' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Star size={24} /></div>
              <div className="stat-details"><h3>Special Orders</h3><div className="value">{specialOrders}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #8b5cf6' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active Orders</h3><div className="value">{activeOrders}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search by IBPO or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><Filter size={16} /><span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span></div>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Regular</option><option>Export</option><option>Special</option>
              </select>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option><option>Active</option><option>Inactive</option><option>Settled</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>IBPO No</th><th>Order Date</th><th>Party Name</th>
                      <th>Type</th><th>Items</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No buyer orders found.</td></tr>
                    ) : filteredOrders.map(o => (
                      <tr 
                        key={o.id} 
                        onClick={() => handleRowClick(o)}
                        style={{ cursor: 'pointer', background: selectedViewOrder?.id === o.id ? 'var(--bg-secondary)' : 'transparent' }}
                      >
                        <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{o.ibpo_number}</td>
                        <td>{o.order_date}</td>
                        <td style={{ fontWeight: 500 }}>{o.party_name}</td>
                        <td><span className="badge badge-active">{o.order_type || 'Regular'}</span></td>
                        <td>{o.items?.length || 0} items</td>
                        <td><span className={`badge ${o.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{o.status}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(e) => handleDelete(o.id, o.ibpo_number, e)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
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
                      <ShoppingCart size={18} /> {selectedViewOrder.ibpo_number}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewOrder, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewOrder, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Party Name" value={selectedViewOrder.party_name} />
                    <DetailRow label="Order Date" value={selectedViewOrder.order_date} />
                    <DetailRow label="Order Type" value={<span className="badge badge-active">{selectedViewOrder.order_type || 'Regular'}</span>} />
                    <DetailRow label="Status" value={selectedViewOrder.status} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial</h4>
                    <DetailRow label="Outstanding" value={selectedViewOrder.outstanding} />
                    <DetailRow label="Payment Terms" value={selectedViewOrder.payment_terms} />
                    <DetailRow label="Commission Type" value={selectedViewOrder.commission_type} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transport</h4>
                    <DetailRow label="Transport Mode" value={selectedViewOrder.transport_mode} />
                    <DetailRow label="Delivery Place" value={selectedViewOrder.delivery_place} />
                    <DetailRow label="Party Comp Date" value={selectedViewOrder.party_comp_date} />
                    <DetailRow label="Ex-Factory Date" value={selectedViewOrder.exfactory_date} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Line Items ({selectedViewOrder.items?.length || 0})</h4>
                    {selectedViewOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>PO: {item.party_po_no || 'N/A'} - {item.fabric_type}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Mtrs: {item.order_mtrs}</span>
                          <span>Rate: {item.rate}</span>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Buyer Order Details' : editingId ? 'Edit Buyer Order' : 'New Buyer Order Entry'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update Order' : 'Save Order'}</button>
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
            {/* MAIN DETAILS */}
            {activeTab === 'main' && (
              <div className="animate-fade">
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group">
                    <label>Order Date *</label>
                    <input type="date" className="form-control" name="order_date" value={form.order_date} onChange={handleChange} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Party Name *</label>
                    <select className="form-control" required value={form.party_id} onChange={handlePartyChange}>
                      <option value="">Select Party...</option>
                      {parties.map(p => <option key={p.id} value={p.id}>{p.company_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Buyer Name</label>
                    <input className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Address</label>
                    <input className="form-control" name="billing_address" value={form.billing_address} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" name="state" value={form.state} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Agent Name</label>
                    <input className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Order Type</label>
                    <select className="form-control" name="order_type" value={form.order_type} onChange={handleChange}>
                      <option>Regular</option><option>Export</option><option>Special</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Certified Type</label>
                    <select className="form-control" name="certified_type" value={form.certified_type} onChange={handleChange}>
                      <option value="">None</option><option>ISO</option><option>Organic</option><option>Fair Trade</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>GST No</label>
                    <input className="form-control" name="gst_no" value={form.gst_no} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>PAN No</label>
                    <input className="form-control" name="pan_no" value={form.pan_no} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Commission Type</label>
                    <select className="form-control" name="commission_type" value={form.commission_type} onChange={handleChange}>
                      <option>Percentage</option><option>Fixed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Commission Value</label>
                    <input type="number" className="form-control" name="commission_pct" value={form.commission_pct} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Order Taken By</label>
                    <select className="form-control" name="order_taken_by" value={form.order_taken_by} onChange={handleChange}>
                      <option value="">Select Employee...</option>
                      {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nomination</label>
                    <input className="form-control" name="nomination_type" value={form.nomination_type} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Regular / Special</label>
                    <select className="form-control" name="regular_special" value={form.regular_special} onChange={handleChange}>
                      <option>Regular</option><option>Special</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT DETAILS */}
            {activeTab === 'payment' && (
              <div className="animate-fade">
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>Outstanding</label><input type="number" className="form-control" name="outstanding" value={form.outstanding} onChange={handleChange} /></div>
                  <div className="form-group"><label>Over Due</label><input type="number" className="form-control" name="overdue" value={form.overdue} onChange={handleChange} /></div>
                  <div className="form-group"><label>30 Days+ Due</label><input type="number" className="form-control" name="due_30_days" value={form.due_30_days} onChange={handleChange} /></div>
                  <div className="form-group"><label>Status</label>
                    <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                      <option>Active</option><option>Inactive</option><option>Settled</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Max Crd Days</label><input type="number" className="form-control" name="max_crd_days" value={form.max_crd_days} onChange={handleChange} /></div>
                  <div className="form-group"><label>PO Credit Days</label><input type="number" className="form-control" name="po_credit" value={form.po_credit} onChange={handleChange} /></div>
                  <div className="form-group"><label>PO Max Crd</label><input type="number" className="form-control" name="po_max_crd" value={form.po_max_crd} onChange={handleChange} /></div>
                  <div className="form-group"><label>Bill Credit</label><input type="number" className="form-control" name="bill_credit" value={form.bill_credit} onChange={handleChange} /></div>
                  <div className="form-group"><label>Payment Terms</label>
                    <select className="form-control" name="payment_terms" value={form.payment_terms} onChange={handleChange}>
                      <option>Net 30</option><option>Net 60</option><option>Advance</option><option>COD</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Status Remark</label><input className="form-control" name="status_remark" value={form.status_remark} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Payment Detail Notes</label><input className="form-control" name="payment_detail" value={form.payment_detail} onChange={handleChange} /></div>
                  <div className="form-group"><label>Upload Supporting Doc</label><input type="file" className="form-control" style={{ padding: '6px' }} /></div>
                </div>
              </div>
            )}

            {/* TRANSPORT & DELIVERY */}
            {activeTab === 'transport' && (
              <div className="animate-fade">
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="form-group"><label>Transport Mode</label>
                    <select className="form-control" name="transport_mode" value={form.transport_mode} onChange={handleChange}>
                      <option>Road</option><option>Rail</option><option>Air</option><option>Sea</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Transport Name</label><input className="form-control" name="transport_name" value={form.transport_name} onChange={handleChange} /></div>
                  <div className="form-group"><label>Party Terms</label>
                    <select className="form-control" name="party_terms" value={form.party_terms} onChange={handleChange}>
                      <option>FOB</option><option>CIF</option><option>Ex-Works</option>
                    </select>
                  </div>
                  <div className="form-group"><label>LR Type</label><input className="form-control" name="lr_type" value={form.lr_type} onChange={handleChange} /></div>
                  <div className="form-group"><label>LR Terms</label><input className="form-control" name="lr_terms" value={form.lr_terms} onChange={handleChange} /></div>
                  <div className="form-group"><label>Party Comp Date</label><input type="date" className="form-control" name="party_comp_date" value={form.party_comp_date} onChange={handleChange} /></div>
                  <div className="form-group"><label>Exfactory Date</label><input type="date" className="form-control" name="exfactory_date" value={form.exfactory_date} onChange={handleChange} /></div>
                  <div className="form-group"><label>Delivery Starting</label><input type="date" className="form-control" name="delivery_starting" value={form.delivery_starting} onChange={handleChange} /></div>
                  <div className="form-group"><label>Delivery At</label><input className="form-control" name="delivery_at" value={form.delivery_at} onChange={handleChange} /></div>
                  <div className="form-group"><label>Desp Mtr Min</label><input type="number" className="form-control" name="desp_mtr_min" value={form.desp_mtr_min} onChange={handleChange} /></div>
                  <div className="form-group"><label>Desp Mtr Max</label><input type="number" className="form-control" name="desp_mtr_max" value={form.desp_mtr_max} onChange={handleChange} /></div>
                  <div className="form-group"><label>Delivery Place</label><input className="form-control" name="delivery_place" value={form.delivery_place} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Delivery Address</label><input className="form-control" name="delivery_address" value={form.delivery_address} onChange={handleChange} /></div>
                </div>
              </div>
            )}

            {/* PROCESS FOLLOW & INSTRUCTIONS */}
            {activeTab === 'process' && (
              <div className="animate-fade">
                <div className="form-group">
                  <label>Process Follow Sequence</label>
                  <select className="form-control" name="process_sequence" value={form.process_sequence} onChange={handleChange}>
                    <option value="">-- Select Process Sequence --</option>
                    <option>Weaving {"->"} Processing {"->"} Dispatch</option>
                    <option>Yarn Dyeing {"->"} Weaving {"->"} Finishing</option>
                    <option>Direct Dispatch (Trading)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="animate-fade">
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="form-group"><label>Email TO</label><input className="form-control" name="email_to" value={form.email_to} onChange={handleChange} placeholder="comma separated" /></div>
                  <div className="form-group"><label>Email CC</label><input className="form-control" name="email_cc" value={form.email_cc} onChange={handleChange} placeholder="comma separated" /></div>
                  <div className="form-group"><label>Process Instruction</label><textarea className="form-control" name="process_instruction" value={form.process_instruction} onChange={handleChange} /></div>
                  <div className="form-group"><label>Yarn Instruction</label><textarea className="form-control" name="yarn_instruction" value={form.yarn_instruction} onChange={handleChange} /></div>
                  <div className="form-group"><label>Production Instruction</label><textarea className="form-control" name="prod_instruction" value={form.prod_instruction} onChange={handleChange} /></div>
                  <div className="form-group"><label>Delivery Instruction</label><textarea className="form-control" name="delivery_instruction" value={form.delivery_instruction} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>General Remarks</label><textarea className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                </div>
              </div>
            )}

            {/* PARTY PO DETAILS (LINE ITEMS) */}
            {activeTab === 'items' && (
              <div className="animate-fade">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button type="button" className="btn btn-primary" onClick={addItem}><Plus size={16} /> Add Another PO Item</button>
                </div>
                
                {form.items.map((item, index) => (
                  <div key={index} style={{ border: '1px solid var(--border)', padding: 20, marginBottom: 20, borderRadius: 8, background: '#fafafa', position: 'relative' }}>
                    <button type="button" onClick={() => removeItem(index)} style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14}/></button>
                    <h4 style={{ marginTop: 0, marginBottom: 16, color: 'var(--primary)' }}>Item #{index + 1} Details</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                      <div className="form-group"><label>Party PO No</label><input className="form-control" value={item.party_po_no} onChange={e => updateItem(index, 'party_po_no', e.target.value)} /></div>
                      <div className="form-group"><label>PO Date</label><input type="date" className="form-control" value={item.po_date} onChange={e => updateItem(index, 'po_date', e.target.value)} /></div>
                      <div className="form-group"><label>Design No</label><input className="form-control" value={item.design_no} onChange={e => updateItem(index, 'design_no', e.target.value)} /></div>
                      <div className="form-group"><label>Fabric Type</label>
                        <select className="form-control" value={item.fabric_type} onChange={e => updateItem(index, 'fabric_type', e.target.value)}>
                          <option>Cotton</option><option>Polyester</option><option>Blended</option>
                        </select>
                      </div>
                      <div className="form-group"><label>Color</label><input className="form-control" value={item.color} onChange={e => updateItem(index, 'color', e.target.value)} /></div>
                      
                      <div className="form-group"><label>Order Qty</label><input type="number" className="form-control" value={item.order_mtrs} onChange={e => updateItem(index, 'order_mtrs', e.target.value)} /></div>
                      <div className="form-group"><label>UOM</label>
                        <select className="form-control" value={item.uom} onChange={e => updateItem(index, 'uom', e.target.value)}>
                          <option>MTR</option><option>YARD</option><option>PCS</option>
                        </select>
                      </div>
                      <div className="form-group"><label>Rate</label><input type="number" className="form-control" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} /></div>
                      <div className="form-group"><label>Amount</label><input type="number" className="form-control" value={item.amount} disabled style={{ background: '#e5e7eb' }} /></div>
                      <div className="form-group"><label>HSN Code</label><input className="form-control" value={item.hsn_code} onChange={e => updateItem(index, 'hsn_code', e.target.value)} /></div>

                      <div className="form-group"><label>Point of Contact</label><input className="form-control" value={item.point_of_contact} onChange={e => updateItem(index, 'point_of_contact', e.target.value)} /></div>
                      <div className="form-group"><label>Tolerance %</label><input type="number" className="form-control" value={item.tolerance_pct} onChange={e => updateItem(index, 'tolerance_pct', e.target.value)} /></div>
                      <div className="form-group"><label>Sample Qty</label><input type="number" className="form-control" value={item.sample_mtr} onChange={e => updateItem(index, 'sample_mtr', e.target.value)} /></div>
                      <div className="form-group"><label>Party Style</label><input className="form-control" value={item.buyer_style} onChange={e => updateItem(index, 'buyer_style', e.target.value)} /></div>
                      <div className="form-group"><label>Short No</label><input className="form-control" value={item.short_no} onChange={e => updateItem(index, 'short_no', e.target.value)} /></div>

                      <div className="form-group"><label>Gry Construction</label><input className="form-control" value={item.gry_construction} onChange={e => updateItem(index, 'gry_construction', e.target.value)} /></div>
                      <div className="form-group"><label>Weaving Type</label>
                        <select className="form-control" value={item.weaving_type} onChange={e => updateItem(index, 'weaving_type', e.target.value)}>
                          <option>Plain</option><option>Twill</option><option>Satin</option>
                        </select>
                      </div>
                      <div className="form-group"><label>Pick on Table</label><input type="number" className="form-control" value={item.pick_on_table} onChange={e => updateItem(index, 'pick_on_table', e.target.value)} /></div>
                      <div className="form-group"><label>Finish Width</label><input type="number" className="form-control" value={item.finish_width} onChange={e => updateItem(index, 'finish_width', e.target.value)} /></div>
                      <div className="form-group"><label>Pattern</label>
                        <select className="form-control" value={item.pattern} onChange={e => updateItem(index, 'pattern', e.target.value)}>
                          <option>Solid</option><option>Stripe</option><option>Check</option>
                        </select>
                      </div>

                      <div className="form-group"><label>Packing Type</label>
                        <select className="form-control" value={item.packing_type} onChange={e => updateItem(index, 'packing_type', e.target.value)}>
                          <option>Roll</option><option>Bale</option><option>Box</option>
                        </select>
                      </div>
                      <div className="form-group"><label>End Use</label>
                        <select className="form-control" value={item.end_use} onChange={e => updateItem(index, 'end_use', e.target.value)}>
                          <option>Apparel</option><option>Home Textile</option><option>Industrial</option>
                        </select>
                      </div>
                      <div className="form-group"><label>Season</label>
                        <select className="form-control" value={item.season} onChange={e => updateItem(index, 'season', e.target.value)}>
                          <option>All Season</option><option>Summer</option><option>Winter</option>
                        </select>
                      </div>
                      <div className="form-group"><label>Country</label><input className="form-control" value={item.country} onChange={e => updateItem(index, 'country', e.target.value)} /></div>
                      <div className="form-group"><label>Upload Design File</label><input type="file" className="form-control" style={{ padding: '6px' }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
