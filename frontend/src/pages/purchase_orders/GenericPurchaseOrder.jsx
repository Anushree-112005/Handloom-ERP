import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, Download, IndianRupee, Layers, Palette, Factory, Scissors } from 'lucide-react';
import { genericPurchaseOrderAPI, partyAPI, dropdownAPI, buyerOrderAPI } from '../../services/api';

export default function GenericPurchaseOrder({ title, description, icon: Icon = Package, moduleType }) {
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [activeTab, setActiveTab] = useState('main');
  
  const initialForm = {
    po_no: '',
    po_date: new Date().toISOString().split('T')[0],
    org_name: '',
    internal_po_no: '',
    used_for: '',
    against_ref: '',
    agent_name: '',
    supplier_name: '',
    delivery_at: '',
    status: 'Active',
    packing_type: '',
    labeling: '',
    remarks: '',

    transport: '',
    freight_type: '',
    freight_chg: 0,
    insurance_chg: 0,
    total_order_kgs: 0,
    dispatch_date: '',
    due_days: 0,
    
    tax_type: 'GST',
    taxable_amount: 0,
    sgst_pct: 2.50,
    cgst_pct: 2.50,
    igst_pct: 0,
    net_amount: 0,
    terms_conditions: [
      'Material not meeting our specification and standards will be returned',
      'Demanded Qty to be supplied in whole and excess/short supply will not be accepted.',
      'Send Invoice along with Material.',
      'Defective and damage pieces will not be accepted.',
      'Start bulk production only after getting the sample Approval.',
      'Subject to Namakkal Jurisdiction.'
    ],
    items: [{
      yarn_count: '', colour: '', item_name: '', order_qty: 0, uom: 'KGS', rate: 0, amount: 0, delivery_date: ''
    }]
  };

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  
  const [newTermVal, setNewTermVal] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes] = await Promise.all([
        genericPurchaseOrderAPI.list(moduleType),
        partyAPI.list(),
        dropdownAPI.getAll(),
        buyerOrderAPI.list()
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setBuyerOrders(buyerOrdRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [moduleType]);

  const recalculate = (updatedForm) => {
    const updatedItems = (updatedForm.items || []).map(item => {
      const orderQty = parseFloat(item.order_qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      return { ...item, amount: parseFloat((orderQty * rate).toFixed(2)) };
    });

    const taxableAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;
    const taxType = updatedForm.tax_type || 'GST';
    const freightChg = parseFloat(updatedForm.freight_chg) || 0;
    const insuranceChg = parseFloat(updatedForm.insurance_chg) || 0;

    let taxAmount = 0;
    if (taxType === 'GST') {
      taxAmount = ((cgstPct + sgstPct) / 100) * taxableAmount;
    } else if (taxType === 'IGST') {
      taxAmount = (igstPct / 100) * taxableAmount;
    }

    const netAmount = taxableAmount + freightChg + insuranceChg + taxAmount;

    return {
      ...updatedForm,
      items: updatedItems,
      taxable_amount: parseFloat(taxableAmount.toFixed(2)),
      net_amount: parseFloat(netAmount.toFixed(2))
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
    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['order_qty', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    setForm(recalculate({ ...form, items: newItems }));
  };

  const addItem = () => setForm(recalculate({ ...form, items: [...form.items, initialForm.items[0]] }));
  const removeItem = (index) => setForm(recalculate({ ...form, items: form.items.filter((_, i) => i !== index) }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, po_type: moduleType };
      if (!payload.delivery_date) payload.delivery_date = null;
      await genericPurchaseOrderAPI.create(payload);
      setShowForm(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await genericPurchaseOrderAPI.delete(id);
        loadData();
      } catch (err) {
        alert("Error deleting order");
      }
    }
  };

  const filteredOrders = orders.filter(o => {
    return (searchTerm === '' || o.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) || o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
           (statusFilter === 'All Status' || o.status === statusFilter);
  });

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={24} color="var(--primary)" /> {title}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>{description}</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} /> New Order
            </button>
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

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search PO or Supplier..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All Status</option><option>Active</option><option>Closed</option>
            </select>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO No</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No orders found</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.po_no}</td>
                      <td>{order.po_date}</td>
                      <td>{order.supplier_name}</td>
                      <td>₹{order.net_amount?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${order.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" style={{ color: '#ef4444' }} onClick={() => handleDelete(order.id)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Edit2 size={20} color="var(--primary)" /> Create {title}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              <button type="submit" form="generic-po-form" className="btn btn-primary"><Save size={16} /> Save Order</button>
            </div>
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
              <Package size={16} /> Order Details
            </button>
          </div>

          <form id="generic-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
              <div id="section-main" className="animate-fade">
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Info</h4>
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>Order Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Org. Name</label>
                    <select className="form-control" name="org_name" value={form.org_name || ''} onChange={handleChange}>
                      <option value="">Select Org...</option>
                      {options.masters?.organization_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Internal PO No</label><input type="text" className="form-control" name="internal_po_no" value={form.internal_po_no} onChange={handleChange} /></div>
                  <div className="form-group"><label>Used For</label><input type="text" className="form-control" name="used_for" value={form.used_for} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Against Reference</label>
                    <select className="form-control" name="against_ref" value={form.against_ref || ''} onChange={handleChange}>
                      <option value="">Select...</option>
                      <option value="No Reference">No Reference (Dummy PO)</option>
                      {buyerOrders.map(bo => (
                        <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                      ))}
                      {options.masters?.against_reference_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Agent Name</label><input type="text" className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Supplier Name</label>
                    <select className="form-control" name="supplier_name" value={form.supplier_name} onChange={handleChange} required>
                      <option value="">Select Supplier...</option>
                      {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Delivery At</label><input type="text" className="form-control" name="delivery_at" value={form.delivery_at} onChange={handleChange} /></div>
                  <div className="form-group"><label>Status</label><select className="form-control" name="status" value={form.status} onChange={handleChange}><option value="Active">Active</option><option value="Closed">Closed</option></select></div>
                  <div className="form-group"><label>Packing Type</label>
                    <select className="form-control" name="packing_type" value={form.packing_type || ''} onChange={handleChange}>
                      <option value="">Select...</option>
                      {options.masters?.packing_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group"><label>Labeling</label><input type="text" className="form-control" name="labeling" value={form.labeling} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Remarks</label><input type="text" className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                </div>
              </div>

              <div id="section-items" className="animate-fade" style={{ marginTop: 32 }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Indent / Design</h4>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Indent Row</button>
                </div>
                <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                  <table className="data-table" style={{ minWidth: '1000px' }}>
                    <thead>
                      <tr>
                        <th>SNo</th>
                        <th>Count</th>
                        <th>Color</th>
                        <th>Item Details / Description</th>
                        <th>Delivery Date</th>
                        <th>Order Qty</th>
                        <th>UOM</th>
                        <th>Rate (₹)</th>
                        <th>Amount (₹)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)}>
                              <option value="">Select...</option>
                              {options.masters?.count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.colour} onChange={e => updateItem(idx, 'colour', e.target.value)}>
                              <option value="">Select...</option>
                              {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td><input className="form-control" style={{ minWidth: 200, padding: 6, margin: 0 }} value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} /></td>
                          <td><input type="date" className="form-control" style={{ width: 130, padding: 6, margin: 0 }} value={item.delivery_date} onChange={e => updateItem(idx, 'delivery_date', e.target.value)} /></td>
                          <td><input type="number" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.order_qty} onChange={e => updateItem(idx, 'order_qty', e.target.value)} /></td>
                          <td><select className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.uom} onChange={e => updateItem(idx, 'uom', e.target.value)}><option>KGS</option><option>MTRS</option><option>PCS</option><option>BOX</option></select></td>
                          <td><input type="number" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                          <td><input type="number" className="form-control" style={{ width: 120, padding: 6, margin: 0, background: '#f1f5f9', fontWeight: 'bold' }} value={item.amount} disabled /></td>
                          <td><button type="button" className="icon-btn" onClick={() => removeItem(idx)} style={{ color: 'red' }}><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="section-tax" className="animate-fade" style={{ marginTop: 32 }}>
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TERMS & CONDITIONS</span>
                      </div>
                      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {form.terms_conditions?.map((term, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                              {idx + 1}. {term}
                            </span>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => {
                                const newTerm = prompt('Edit term:', term);
                                if (newTerm) {
                                  const updatedTerms = [...form.terms_conditions];
                                  updatedTerms[idx] = newTerm;
                                  setForm({ ...form, terms_conditions: updatedTerms });
                                }
                              }}><Edit2 size={14} /></button>
                              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} onClick={() => {
                                setForm({ ...form, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) });
                              }}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <input type="text" className="form-control" style={{ margin: 0 }} placeholder="Add new term or condition..." value={newTermVal} onChange={e => setNewTermVal(e.target.value)} onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newTermVal.trim()) {
                                setForm({ ...form, terms_conditions: [...(form.terms_conditions || []), newTermVal.trim()] });
                                setNewTermVal('');
                              }
                            }
                          }} />
                          <button type="button" className="btn btn-primary" onClick={() => {
                            if (newTermVal.trim()) {
                              setForm({ ...form, terms_conditions: [...(form.terms_conditions || []), newTermVal.trim()] });
                              setNewTermVal('');
                            }
                          }}><Plus size={16} /> Add</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ width: 350, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ORDER SUMMARY</span>
                      </div>
                      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Amount</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>INR {(form.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Charges</span>
                          <input 
                            type="number" 
                            name="freight_chg" 
                            value={form.freight_chg} 
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
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance</span>
                          <input 
                            type="number" 
                            name="insurance_chg" 
                            value={form.insurance_chg} 
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST</span>
                            <input 
                              type="number" 
                              name="sgst_pct" 
                              value={form.sgst_pct} 
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
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{((form.taxable_amount || 0) * (form.sgst_pct || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST</span>
                            <input 
                              type="number" 
                              name="cgst_pct" 
                              value={form.cgst_pct} 
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
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{((form.taxable_amount || 0) * (form.cgst_pct || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST</span>
                            <input 
                              type="number" 
                              name="igst_pct" 
                              value={form.igst_pct} 
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
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{((form.taxable_amount || 0) * (form.igst_pct || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Order Kgs</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.total_order_kgs || 0}</span>
                        </div>
                        <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Grand Total</span>
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
