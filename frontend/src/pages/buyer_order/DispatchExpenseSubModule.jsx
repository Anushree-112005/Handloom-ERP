import { useState, useEffect } from 'react';
import { buyerOrderAPI } from '../../services/api';
import { Truck, DollarSign, Plus, Save, X, Search, Eye, Trash2, Calendar, FileText } from 'lucide-react';

export default function DispatchExpenseSubModule() {
  const [activeCard, setActiveCard] = useState('Dispatch Indent');

  // --- Dispatch State ---
  const [showAddDispatch, setShowAddDispatch] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [dispatchForm, setDispatchForm] = useState({
    order_id_ref: '', transporter_name: '', lr_no: '', vehicle_no: '',
    delivery_place: '', packing_type: 'Bale', dispatch_date: '',
    shade: '', lot_no: '', quantity: '', remarks: ''
  });

  // --- Expense State ---
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    order_id_ref: '', expense_type: 'Freight', amount: '', currency: 'INR',
    payment_mode: 'Bank Transfer', vendor_name: '', invoice_ref: '', remarks: ''
  });

  const cards = [
    { title: 'Dispatch Indent', icon: Truck, color: '#3b82f6', desc: 'Manage logistics instructions and dispatch slips' },
    { title: 'Expense Entry', icon: DollarSign, color: '#f59e0b', desc: 'Record additional costs and freight charges' }
  ];

  useEffect(() => {
    fetchDispatches();
    fetchExpenses();
  }, []);

  const fetchDispatches = async () => {
    try {
      const res = await buyerOrderAPI.listDispatches();
      setDispatches(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchExpenses = async () => {
    try {
      const res = await buyerOrderAPI.listExpenses();
      setExpenses(res.data);
    } catch(e) { console.error(e); }
  };

  const handleDispatchSave = async () => {
    try {
      const payload = { ...dispatchForm };
      if (!payload.dispatch_date) payload.dispatch_date = null;

      await buyerOrderAPI.createDispatch(payload);
      fetchDispatches();
      setShowAddDispatch(false);
      setDispatchForm({
        order_id_ref: '', transporter_name: '', lr_no: '', vehicle_no: '',
        delivery_place: '', packing_type: 'Bale', dispatch_date: '',
        shade: '', lot_no: '', quantity: '', remarks: ''
      });
      alert("Dispatch Indent Saved Successfully!");
    } catch(e) {
      console.error(e);
      alert("Error saving dispatch indent.");
    }
  };

  const handleDispatchDelete = async (dbId) => {
    if(!window.confirm("Delete this dispatch indent?")) return;
    try {
      await buyerOrderAPI.deleteDispatch(dbId);
      fetchDispatches();
    } catch(e) { console.error(e); }
  };

  const handleExpenseSave = async () => {
    try {
      const payload = { ...expenseForm };
      payload.amount = parseFloat(payload.amount) || 0;

      await buyerOrderAPI.createExpense(payload);
      fetchExpenses();
      setShowAddExpense(false);
      setExpenseForm({
        order_id_ref: '', expense_type: 'Freight', amount: '', currency: 'INR',
        payment_mode: 'Bank Transfer', vendor_name: '', invoice_ref: '', remarks: ''
      });
      alert("Expense Entry Saved Successfully!");
    } catch(e) {
      console.error(e);
      alert("Error saving expense entry.");
    }
  };

  const handleExpenseDelete = async (dbId) => {
    if(!window.confirm("Delete this expense entry?")) return;
    try {
      await buyerOrderAPI.deleteExpense(dbId);
      fetchExpenses();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 className="page-title">Dispatch & Expense</h1>
        <p className="page-subtitle">Manage logistics, generate dispatch slips, and record associated expenses.</p>
      </div>

      {/* HORIZONTAL CARDS NAVIGATION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => {
          const isActive = activeCard === c.title;
          return (
            <div 
              key={i} 
              className={`card ${isActive ? 'active-card' : ''}`}
              onClick={() => {
                setActiveCard(c.title);
                setSelectedDispatch(null);
                setShowAddDispatch(false);
                setSelectedExpense(null);
                setShowAddExpense(false);
              }}
              style={{ 
                padding: 20, 
                cursor: 'pointer', 
                border: isActive ? `2px solid ${c.color}` : '1px solid var(--border)',
                background: isActive ? `rgba(${c.color === '#3b82f6' ? '59,130,246' : '245,158,11'}, 0.05)` : 'var(--bg-secondary)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: c.color, color: 'white', padding: 12, borderRadius: 12 }}>
                  <c.icon size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isActive ? c.color : 'inherit' }}>{c.title}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{c.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 24 }}>
        {/* --- DISPATCH VIEW --- */}
        {activeCard === 'Dispatch Indent' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6' }}>
                <Truck size={20} /> Dispatch Indents
              </h2>
              <button className="btn btn-primary" onClick={() => { setShowAddDispatch(true); setSelectedDispatch(null); }}>
                <Plus size={16} /> Add Dispatch Indent
              </button>
            </div>

            {!showAddDispatch ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="table-responsive animate-fade" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th>Indent ID</th>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Transporter</th>
                        <th>LR No</th>
                        <th>Quantity</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatches.map(d => (
                        <tr 
                          key={d.id}
                          onClick={() => setSelectedDispatch(d)}
                          style={{ 
                            cursor: 'pointer', 
                            background: selectedDispatch?.id === d.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent' 
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>{d.indent_id}</td>
                          <td style={{ color: 'var(--primary)' }}>{d.order_id_ref}</td>
                          <td>{d.dispatch_date}</td>
                          <td>{d.transporter_name}</td>
                          <td>{d.lr_no}</td>
                          <td>{d.quantity}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', marginRight: 8 }} onClick={(e) => { e.stopPropagation(); setSelectedDispatch(d); }}><Eye size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleDispatchDelete(d.id); }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {dispatches.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No dispatch indents found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* QUICK VIEW SIDE PANE FOR DISPATCH */}
                {selectedDispatch && (
                  <div className="card animate-slide" style={{ width: 350, padding: 0, position: 'sticky', top: 100, border: '1px solid #3b82f6', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#3b82f6', color: 'white', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={18} /> Dispatch Summary
                      </h3>
                      <button className="btn btn-secondary" style={{ padding: 4, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setSelectedDispatch(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tracking Info</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Indent ID:</strong> {selectedDispatch.indent_id}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Order ID:</strong> {selectedDispatch.order_id_ref}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Dispatch Date:</strong> {selectedDispatch.dispatch_date}</p>
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
                      
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Logistics</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Transporter:</strong> {selectedDispatch.transporter_name}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>LR No:</strong> {selectedDispatch.lr_no}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Vehicle No:</strong> {selectedDispatch.vehicle_no}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Delivery Place:</strong> {selectedDispatch.delivery_place}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
                      
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Textile Details</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Packing Type:</strong> {selectedDispatch.packing_type}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Quantity:</strong> {selectedDispatch.quantity}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Shade:</strong> {selectedDispatch.shade}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Lot No:</strong> {selectedDispatch.lot_no}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Remarks:</strong> {selectedDispatch.remarks}</p>
                      </div>
                      
                      <button className="btn btn-secondary" style={{ marginTop: 10 }}><FileText size={14} /> Generate Slip</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card animate-fade" style={{ padding: 0, border: '1px solid #3b82f6' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(59, 130, 246, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2563eb' }}>New Dispatch Indent</h3>
                </div>

                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {/* Row 1 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Indent ID</label>
                      <input type="text" className="form-control" defaultValue="AUTO-GENERATED" disabled style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order ID (IBPO No)</label>
                      <input type="text" className="form-control" placeholder="e.g. IBPO-2026-001" value={dispatchForm.order_id_ref} onChange={e => setDispatchForm({...dispatchForm, order_id_ref: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Dispatch Date</label>
                      <input type="date" className="form-control" value={dispatchForm.dispatch_date} onChange={e => setDispatchForm({...dispatchForm, dispatch_date: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Delivery Place</label>
                      <input type="text" className="form-control" placeholder="e.g. Tirupur Warehouse" value={dispatchForm.delivery_place} onChange={e => setDispatchForm({...dispatchForm, delivery_place: e.target.value})} />
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Transporter Name</label>
                      <input type="text" className="form-control" placeholder="e.g. VRL Logistics" value={dispatchForm.transporter_name} onChange={e => setDispatchForm({...dispatchForm, transporter_name: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>LR No</label>
                      <input type="text" className="form-control" placeholder="Lorry Receipt No" value={dispatchForm.lr_no} onChange={e => setDispatchForm({...dispatchForm, lr_no: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Vehicle No</label>
                      <input type="text" className="form-control" placeholder="e.g. TN-39-AB-1234" value={dispatchForm.vehicle_no} onChange={e => setDispatchForm({...dispatchForm, vehicle_no: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Quantity (Mtrs/Pcs)</label>
                      <input type="text" className="form-control" placeholder="e.g. 5000 Mtrs" value={dispatchForm.quantity} onChange={e => setDispatchForm({...dispatchForm, quantity: e.target.value})} />
                    </div>

                    {/* Row 3 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Packing Type</label>
                      <select className="form-control" value={dispatchForm.packing_type} onChange={e => setDispatchForm({...dispatchForm, packing_type: e.target.value})}>
                        <option>Bale</option>
                        <option>Roll</option>
                        <option>Carton</option>
                        <option>Pallet</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Shade / Colour</label>
                      <input type="text" className="form-control" placeholder="Pantone Code" value={dispatchForm.shade} onChange={e => setDispatchForm({...dispatchForm, shade: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Lot No</label>
                      <input type="text" className="form-control" placeholder="Yarn/Fabric lot" value={dispatchForm.lot_no} onChange={e => setDispatchForm({...dispatchForm, lot_no: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Remarks</label>
                      <input type="text" className="form-control" placeholder="Special instructions" value={dispatchForm.remarks} onChange={e => setDispatchForm({...dispatchForm, remarks: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setShowAddDispatch(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleDispatchSave}><Save size={16} /> Save Indent</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- EXPENSE VIEW --- */}
        {activeCard === 'Expense Entry' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
                <DollarSign size={20} /> Expense Entries
              </h2>
              <button className="btn btn-primary" onClick={() => { setShowAddExpense(true); setSelectedExpense(null); }}>
                <Plus size={16} /> Add Expense Entry
              </button>
            </div>

            {!showAddExpense ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="table-responsive animate-fade" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th>EXP ID</th>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Vendor</th>
                        <th>Invoice Ref</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr 
                          key={e.id}
                          onClick={() => setSelectedExpense(e)}
                          style={{ 
                            cursor: 'pointer', 
                            background: selectedExpense?.id === e.id ? 'rgba(245, 158, 11, 0.05)' : 'transparent' 
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>{e.expense_id}</td>
                          <td style={{ color: 'var(--primary)' }}>{e.order_id_ref}</td>
                          <td><span className="badge badge-pending">{e.expense_type}</span></td>
                          <td style={{ fontWeight: 700 }}>{e.currency} {parseFloat(e.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td>{e.vendor_name}</td>
                          <td>{e.invoice_ref}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', marginRight: 8 }} onClick={(evt) => { evt.stopPropagation(); setSelectedExpense(e); }}><Eye size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--danger)' }} onClick={(evt) => { evt.stopPropagation(); handleExpenseDelete(e.id); }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No expense entries found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* QUICK VIEW SIDE PANE FOR EXPENSE */}
                {selectedExpense && (
                  <div className="card animate-slide" style={{ width: 350, padding: 0, position: 'sticky', top: 100, border: '1px solid #f59e0b', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#f59e0b', color: 'white', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <DollarSign size={18} /> Expense Summary
                      </h3>
                      <button className="btn btn-secondary" style={{ padding: 4, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setSelectedExpense(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Reference Info</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>EXP ID:</strong> {selectedExpense.expense_id}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Order ID:</strong> {selectedExpense.order_id_ref}</p>
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
                      
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Financial Details</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Type:</strong> {selectedExpense.expense_type}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                          <strong>Amount:</strong> <span style={{ color: '#d97706', fontWeight: 800 }}>{selectedExpense.currency} {parseFloat(selectedExpense.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Payment Mode:</strong> {selectedExpense.payment_mode}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
                      
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Vendor Details</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Vendor / Party:</strong> {selectedExpense.vendor_name}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Invoice Ref:</strong> {selectedExpense.invoice_ref}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Remarks:</strong> {selectedExpense.remarks}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card animate-fade" style={{ padding: 0, border: '1px solid #f59e0b' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#d97706' }}>New Expense Entry</h3>
                </div>

                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {/* Row 1 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>EXP ID</label>
                      <input type="text" className="form-control" defaultValue="AUTO-GENERATED" disabled style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order ID (IBPO No)</label>
                      <input type="text" className="form-control" placeholder="e.g. IBPO-2026-001" value={expenseForm.order_id_ref} onChange={e => setExpenseForm({...expenseForm, order_id_ref: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Expense Type</label>
                      <select className="form-control" value={expenseForm.expense_type} onChange={e => setExpenseForm({...expenseForm, expense_type: e.target.value})}>
                        <option>Freight</option>
                        <option>Insurance</option>
                        <option>Packing</option>
                        <option>Commission</option>
                        <option>Miscellaneous</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Amount</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select className="form-control" style={{ width: 80 }} value={expenseForm.currency} onChange={e => setExpenseForm({...expenseForm, currency: e.target.value})}>
                          <option>INR</option>
                          <option>USD</option>
                          <option>EUR</option>
                        </select>
                        <input type="number" className="form-control" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Payment Mode</label>
                      <select className="form-control" value={expenseForm.payment_mode} onChange={e => setExpenseForm({...expenseForm, payment_mode: e.target.value})}>
                        <option>Bank Transfer</option>
                        <option>Cash</option>
                        <option>Credit Note</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Vendor / Party Name</label>
                      <input type="text" className="form-control" placeholder="e.g. Transporter/Agent" value={expenseForm.vendor_name} onChange={e => setExpenseForm({...expenseForm, vendor_name: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Invoice / Ref No</label>
                      <input type="text" className="form-control" placeholder="Vendor Bill No" value={expenseForm.invoice_ref} onChange={e => setExpenseForm({...expenseForm, invoice_ref: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Remarks</label>
                      <input type="text" className="form-control" placeholder="Reason for expense" value={expenseForm.remarks} onChange={e => setExpenseForm({...expenseForm, remarks: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setShowAddExpense(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleExpenseSave}><Save size={16} /> Save Expense</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
