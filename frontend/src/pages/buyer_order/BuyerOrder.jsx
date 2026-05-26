import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { buyerOrderAPI, partyAPI } from '../../services/api';

export default function BuyerOrder() {
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    order_date: new Date().toISOString().split('T')[0],
    party_id: '',
    party_name: '',
    agent_name: '',
    order_type: 'Regular',
    payment_terms: '',
    transport_mode: 'Road',
    transport_name: '',
    remarks: '',
    items: []
  });

  const loadData = async () => {
    try {
      const [ordersRes, partiesRes] = await Promise.all([
        buyerOrderAPI.list(),
        partyAPI.list()
      ]);
      setOrders(ordersRes.data);
      setParties(partiesRes.data);
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
      await buyerOrderAPI.create(form);
      setShowForm(false);
      setForm({
        order_date: new Date().toISOString().split('T')[0],
        party_id: '',
        party_name: '',
        agent_name: '',
        order_type: 'Regular',
        payment_terms: '',
        transport_mode: 'Road',
        transport_name: '',
        remarks: '',
        items: []
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating buyer order');
    }
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, {
        design_no: '', fabric_type: '', color: '', order_mtrs: 0,
        tolerance_pct: 0, uom: 'MTR', hsn_code: '', rate: 0, amount: 0
      }]
    });
  };

  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    if (field === 'order_mtrs' || field === 'rate') {
      const mtrs = field === 'order_mtrs' ? parseFloat(value) || 0 : parseFloat(newItems[index].order_mtrs) || 0;
      const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = mtrs * rate;
    }
    setForm({ ...form, items: newItems });
  };

  const handlePartyChange = (e) => {
    const partyId = e.target.value;
    const party = parties.find(p => p.id.toString() === partyId);
    setForm({
      ...form,
      party_id: partyId,
      party_name: party ? party.company_name : ''
    });
  };

  return (
    <div className="animate-fade">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Buyer Order Posting</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Order
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} style={{ marginBottom: 24, padding: 20, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Order Date *</label>
                <input className="form-control" type="date" required value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Party *</label>
                <select className="form-control" required value={form.party_id} onChange={handlePartyChange}>
                  <option value="">Select Party...</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.company_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Agent Name</label>
                <input className="form-control" value={form.agent_name} onChange={e => setForm({...form, agent_name: e.target.value})} />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Order Type</label>
                <select className="form-control" value={form.order_type} onChange={e => setForm({...form, order_type: e.target.value})}>
                  <option>Regular</option>
                  <option>Export</option>
                  <option>Special</option>
                </select>
              </div>
              <div className="form-group">
                <label>Transport Mode</label>
                <select className="form-control" value={form.transport_mode} onChange={e => setForm({...form, transport_mode: e.target.value})}>
                  <option>Road</option>
                  <option>Rail</option>
                  <option>Air</option>
                  <option>Sea</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment Terms</label>
                <input className="form-control" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} />
              </div>
            </div>
            
            <div className="form-group">
              <label>Remarks</label>
              <textarea className="form-control" rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
            </div>

            {/* Line Items */}
            <div style={{ marginTop: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>Order Items</h4>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={addItem}>
                  <Plus size={14} /> Add Item
                </button>
              </div>
              
              {form.items.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Design No</th>
                      <th>Fabric Type</th>
                      <th>Color</th>
                      <th>Order Mtrs</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, index) => (
                      <tr key={index}>
                        <td><input className="form-control" value={item.design_no} onChange={e => updateItem(index, 'design_no', e.target.value)} required /></td>
                        <td><input className="form-control" value={item.fabric_type} onChange={e => updateItem(index, 'fabric_type', e.target.value)} /></td>
                        <td><input className="form-control" value={item.color} onChange={e => updateItem(index, 'color', e.target.value)} /></td>
                        <td><input type="number" className="form-control" value={item.order_mtrs} onChange={e => updateItem(index, 'order_mtrs', e.target.value)} required /></td>
                        <td><input type="number" className="form-control" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} required /></td>
                        <td><input type="number" className="form-control" value={item.amount} disabled /></td>
                        <td>
                          <button type="button" className="btn btn-danger" style={{ padding: '6px 8px' }} onClick={() => removeItem(index)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-success">Save Order</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>IBPO No</th>
                <th>Order Date</th>
                <th>Party Name</th>
                <th>Type</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No buyer orders found. Click "New Order" to add one.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{o.ibpo_number}</td>
                  <td>{o.order_date}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{o.party_name}</td>
                  <td><span className="badge badge-active">{o.order_type}</span></td>
                  <td>{o.items?.length || 0} items</td>
                  <td><span className={`badge ${o.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{o.status}</span></td>
                  <td><button className="btn btn-secondary" style={{ padding: '4px 8px' }}><Eye size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
