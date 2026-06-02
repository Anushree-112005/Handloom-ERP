import React, { useState, useEffect } from 'react';
import { 
  Calendar, Settings, History, CheckSquare, Plus, Save, 
  Search, Lock, CheckCircle, FileText, Truck, Eye, Trash2, X
} from 'lucide-react';
import { buyerOrderAPI } from '../../services/api';

export default function OrderSubModule() {
  const [activeCard, setActiveCard] = useState('Buyer Order Schedule');
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  
  const [showAddSequence, setShowAddSequence] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  
  const [schedules, setSchedules] = useState([]);
  const [schForm, setSchForm] = useState({
    order_id_ref: '', buyer_ref: '', shipment_date: '', delivery_place: '', delivery_terms: 'Door Delivery',
    qty: '', fabric_type: 'Cotton', shade: '', lot_no: '', packing_type: 'Bale', transporter_name: '', transport_mode: 'Road', remarks: ''
  });

  const [sequences, setSequences] = useState([]);
  const [seqForm, setSeqForm] = useState({
    order_id_ref: '', prefix: 'IBPO', fin_year: '2026-27', running_no: 1, buyer_name: '', party_name: '',
    order_type: 'Domestic', category: 'Fabric', buyer_ref: '', created_by: 'Administrator'
  });

  const [showAddAmd, setShowAddAmd] = useState(false);
  const [selectedAmd, setSelectedAmd] = useState(null);
  
  const [amendments, setAmendments] = useState([]);
  const [amdForm, setAmdForm] = useState({
    order_id_ref: '', amd_date: '', field_changed: 'Quantity', old_value: '', new_value: '',
    remarks: '', approved_by: '', effective_date: '', buyer_ref: '', fabric_details: '', shade: ''
  });

  const [showAddCmp, setShowAddCmp] = useState(false);
  const [selectedCmp, setSelectedCmp] = useState(null);
  
  const [completions, setCompletions] = useState([]);
  const [cmpForm, setCmpForm] = useState({
    order_id_ref: '', completion_date: '', status: 'Closed',
    final_dispatch_qty: '', balance_qty: '0',
    fabric_type: 'Cotton', shade: '', lot_no: '', packing_type: 'Bale',
    delivery_place: '', transporter_name: '', buyer_ref: '', remarks: ''
  });

  const [buyerOrders, setBuyerOrders] = useState([]);

  const cards = [
    { title: 'Buyer Order Schedule', icon: Calendar, color: '#3b82f6', desc: 'Manage delivery and shipment dates' },
    { title: 'Buyer Order Sequences', icon: Settings, color: '#8b5cf6', desc: 'Configure auto-generated Order IDs' },
    { title: 'Buyer Order AMD', icon: History, color: '#f59e0b', desc: 'Track amendment history & changes' },
    { title: 'Buyer Order Completion', icon: CheckSquare, color: '#10b981', desc: 'Mark orders as closed/completed' }
  ];

  useEffect(() => {
    fetchSchedules();
    fetchSequences();
    fetchAmendments();
    fetchCompletions();
    fetchBuyerOrders();
  }, []);

  const fetchBuyerOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrders(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchCompletions = async () => {
    try {
      const res = await buyerOrderAPI.listCompletions();
      setCompletions(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchAmendments = async () => {
    try {
      const res = await buyerOrderAPI.listAmendments();
      setAmendments(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchSequences = async () => {
    try {
      const res = await buyerOrderAPI.listSequences();
      setSequences(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await buyerOrderAPI.listSchedules();
      setSchedules(res.data.map(s => ({
        id: s.schedule_id, dbId: s.id, orderId: s.order_id_ref, ref: s.buyer_ref, date: s.shipment_date,
        place: s.delivery_place, transport: s.transporter_name, qty: s.qty, fabric: s.fabric_type, status: s.status,
        deliveryTerms: s.delivery_terms, shade: s.shade, lotNo: s.lot_no, packing: s.packing_type, mode: s.transport_mode, remarks: s.remarks
      })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSchSave = async () => {
    try {
      const payload = { ...schForm };
      if (!payload.shipment_date) {
        payload.shipment_date = null;
      }
      
      await buyerOrderAPI.createSchedule(payload);
      setShowAddSchedule(false);
      setSchForm({
        order_id_ref: '', buyer_ref: '', shipment_date: '', delivery_place: '', delivery_terms: 'Door Delivery',
        qty: '', fabric_type: 'Cotton', shade: '', lot_no: '', packing_type: 'Bale', transporter_name: '', transport_mode: 'Road', remarks: ''
      });
      fetchSchedules();
    } catch(e) {
      console.error(e);
      alert("Error saving shipment entry. Check console for details.");
    }
  };

  const handleSchDelete = async (dbId) => {
    if(!window.confirm("Are you sure you want to delete this shipment?")) return;
    try {
      await buyerOrderAPI.deleteSchedule(dbId);
      fetchSchedules();
      setSelectedSchedule(null);
    } catch(e) {
      console.error(e);
      alert("Error deleting shipment.");
    }
  };

  const handleSeqSave = async () => {
    try {
      const yearStr = seqForm.fin_year.substring(0, 4);
      const generated = `${seqForm.prefix}-${yearStr}-${String(seqForm.running_no).padStart(3, '0')}`;
      const payload = { ...seqForm, generated_order_no: generated };
      
      await buyerOrderAPI.createSequence(payload);
      fetchSequences();
      setShowAddSequence(false);
      setSeqForm({
        order_id_ref: '', prefix: 'IBPO', fin_year: '2026-27', running_no: 1, buyer_name: '', party_name: '',
        order_type: 'Domestic', category: 'Fabric', buyer_ref: '', created_by: 'Administrator'
      });
      alert("Sequence Configuration Saved Successfully!");
    } catch(e) {
      console.error(e);
      alert("Error saving sequence.");
    }
  };
  
  const handleSeqDelete = async (dbId) => {
    if(!window.confirm("Delete this sequence?")) return;
    try {
      await buyerOrderAPI.deleteSequence(dbId);
      fetchSequences();
    } catch(e) {
      console.error(e);
    }
  };

  const handleAmdSave = async () => {
    try {
      const payload = { ...amdForm };
      if (!payload.amd_date) payload.amd_date = null;
      if (!payload.effective_date) payload.effective_date = null;
      
      await buyerOrderAPI.createAmendment(payload);
      fetchAmendments();
      setShowAddAmd(false);
      setAmdForm({
        order_id_ref: '', amd_date: '', field_changed: 'Quantity', old_value: '', new_value: '',
        remarks: '', approved_by: '', effective_date: '', buyer_ref: '', fabric_details: '', shade: ''
      });
      alert("Amendment Saved Successfully!");
    } catch(e) {
      console.error(e);
      alert("Error saving amendment.");
    }
  };

  const handleAmdDelete = async (dbId) => {
    if(!window.confirm("Delete this amendment?")) return;
    try {
      await buyerOrderAPI.deleteAmendment(dbId);
      fetchAmendments();
    } catch(e) { console.error(e); }
  };
  
  const handleCmpSave = async () => {
    try {
      const payload = { ...cmpForm };
      if (!payload.completion_date) payload.completion_date = null;
      
      await buyerOrderAPI.createCompletion(payload);
      fetchCompletions();
      setShowAddCmp(false);
      setCmpForm({
        order_id_ref: '', completion_date: '', status: 'Closed',
        final_dispatch_qty: '', balance_qty: '0',
        fabric_type: 'Cotton', shade: '', lot_no: '', packing_type: 'Bale',
        delivery_place: '', transporter_name: '', buyer_ref: '', remarks: ''
      });
      alert("Completion Record Saved Successfully!");
    } catch(e) {
      console.error(e);
      alert("Error saving completion record.");
    }
  };

  const handleCmpDelete = async (dbId) => {
    if(!window.confirm("Delete this completion record?")) return;
    try {
      await buyerOrderAPI.deleteCompletion(dbId);
      fetchCompletions();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="page-container animate-fade">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Order Sub-Module</h1>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage Schedules, Sequences, Amendments, and Completions for Buyer Orders.</p>
      </div>

      {/* Interactive Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {cards.map(c => (
          <div 
            key={c.title} 
            className="card" 
            onClick={() => { 
              setActiveCard(c.title); 
              setSelectedSchedule(null); 
              setShowAddSchedule(false);
              setSelectedSequence(null);
              setShowAddSequence(false);
              setSelectedAmd(null);
              setShowAddAmd(false);
              setSelectedCmp(null);
              setShowAddCmp(false);
            }}
            style={{ 
              padding: 20, 
              cursor: 'pointer', 
              border: activeCard === c.title ? `2px solid ${c.color}` : '1px solid transparent',
              background: activeCard === c.title ? `rgba(${c.color === '#3b82f6' ? '59,130,246' : c.color === '#8b5cf6' ? '139,92,246' : c.color === '#f59e0b' ? '245,158,11' : '16,185,129'}, 0.05)` : 'var(--bg-secondary)',
              transition: 'all 0.2s ease',
              transform: activeCard === c.title ? 'translateY(-2px)' : 'none',
              boxShadow: activeCard === c.title ? `0 10px 15px -3px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: c.color, color: '#fff', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(0,0,0,0.15)` }}>
                <c.icon size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dynamic Content Area */}
      <div className="card" style={{ padding: 24, minHeight: 400 }}>
        
        {/* --- SCHEDULE VIEW --- */}
        {activeCard === 'Buyer Order Schedule' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6' }}>
                <Calendar size={20} /> Shipping Schedules
              </h2>
              <button className="btn btn-primary" onClick={() => { setShowAddSchedule(true); setSelectedSchedule(null); }}>
                <Plus size={16} /> Add Shipment Entry
              </button>
            </div>
            
            {!showAddSchedule ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="table-responsive animate-fade" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th>Schedule ID</th>
                        <th>Order ID</th>
                        <th>Shipment Date</th>
                        <th>Delivery Place</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map(s => (
                        <tr 
                          key={s.id} 
                          onClick={() => setSelectedSchedule(s)}
                          style={{ 
                            cursor: 'pointer', 
                            background: selectedSchedule?.id === s.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent' 
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>{s.id}</td>
                          <td style={{ color: 'var(--primary)' }}>{s.orderId}</td>
                          <td>{s.date}</td>
                          <td>{s.place}</td>
                          <td>{s.qty}</td>
                          <td><span className="badge badge-active">{s.status}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', marginRight: 8 }} onClick={(e) => { e.stopPropagation(); setSelectedSchedule(s); }}><Eye size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleSchDelete(s.dbId); }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* QUICK VIEW SIDE PANE */}
                {selectedSchedule && (
                  <div className="card animate-slide" style={{ width: 350, padding: 0, position: 'sticky', top: 100, border: '1px solid var(--primary-light)', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--primary)', color: 'white', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedSchedule.id}</h3>
                      <button style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setSelectedSchedule(null)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Order ID</p>
                          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSchedule.orderId}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Buyer Ref</p>
                          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 500 }}>{selectedSchedule.ref}</p>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Delivery & Transport</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Place:</strong> {selectedSchedule.place}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Terms:</strong> {selectedSchedule.deliveryTerms}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Mode:</strong> {selectedSchedule.mode} via {selectedSchedule.transport}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Textile Details</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Fabric:</strong> {selectedSchedule.fabric} ({selectedSchedule.qty})</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Shade:</strong> <span style={{ display: 'inline-block', width: 10, height: 10, background: '#1D3557', borderRadius: '50%', marginRight: 4 }}></span>{selectedSchedule.shade}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Lot No:</strong> {selectedSchedule.lotNo}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Packing:</strong> {selectedSchedule.packing}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Remarks</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{selectedSchedule.remarks}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card animate-fade" style={{ padding: 0, border: '1px solid var(--primary)' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(59, 130, 246, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>New Shipment Details</h3>
                </div>

                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {/* Row 1 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Schedule ID</label>
                      <input type="text" className="form-control" defaultValue="AUTO-GENERATED" disabled style={{ background: 'var(--bg-secondary)', fontWeight: 600, color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order ID (IBPO No)</label>
                      <select className="form-control" value={schForm.order_id_ref} onChange={e => setSchForm({...schForm, order_id_ref: e.target.value})}>
                        <option value="">Select Buyer Order...</option>
                        {buyerOrders.map(bo => (
                          <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} - {bo.party_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Buyer Reference No</label>
                      <input type="text" className="form-control" placeholder="e.g. PO-8899" value={schForm.buyer_ref} onChange={e => setSchForm({...schForm, buyer_ref: e.target.value})} />
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Shipment Date</label>
                      <input type="date" className="form-control" value={schForm.shipment_date} onChange={e => setSchForm({...schForm, shipment_date: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Delivery Place</label>
                      <input type="text" className="form-control" placeholder="Tirupur, Erode, etc." value={schForm.delivery_place} onChange={e => setSchForm({...schForm, delivery_place: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Delivery Terms</label>
                      <select className="form-control" value={schForm.delivery_terms} onChange={e => setSchForm({...schForm, delivery_terms: e.target.value})}>
                        <option>Door Delivery</option>
                        <option>FOB</option>
                        <option>CIF</option>
                      </select>
                    </div>

                    {/* Row 3 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Quantity (Mtrs/Pcs)</label>
                      <input type="text" className="form-control" placeholder="e.g. 5000" value={schForm.qty} onChange={e => setSchForm({...schForm, qty: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Fabric Type</label>
                      <select className="form-control" value={schForm.fabric_type} onChange={e => setSchForm({...schForm, fabric_type: e.target.value})}>
                        <option>Cotton</option>
                        <option>Polyester</option>
                        <option>Blended</option>
                        <option>Denim</option>
                        <option>Linen</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Shade / Colour</label>
                      <input type="text" className="form-control" placeholder="Pantone code or Mill ref" value={schForm.shade} onChange={e => setSchForm({...schForm, shade: e.target.value})} />
                    </div>

                    {/* Row 4 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Lot No</label>
                      <input type="text" className="form-control" placeholder="Yarn/Fabric lot" value={schForm.lot_no} onChange={e => setSchForm({...schForm, lot_no: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Packing Type</label>
                      <select className="form-control" value={schForm.packing_type} onChange={e => setSchForm({...schForm, packing_type: e.target.value})}>
                        <option>Bale</option>
                        <option>Roll</option>
                        <option>Carton</option>
                        <option>Pallet</option>
                      </select>
                    </div>
                    <div style={{ visibility: 'hidden' }}></div> {/* Spacer */}

                    {/* Row 5 - Logistics */}
                    <div style={{ gridColumn: 'span 3', borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Transporter Name</label>
                        <input type="text" className="form-control" placeholder="e.g. VRL Logistics" value={schForm.transporter_name} onChange={e => setSchForm({...schForm, transporter_name: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Transport Mode</label>
                        <select className="form-control" value={schForm.transport_mode} onChange={e => setSchForm({...schForm, transport_mode: e.target.value})}>
                          <option>Road</option>
                          <option>Rail</option>
                          <option>Air</option>
                          <option>Sea</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 6 */}
                    <div style={{ gridColumn: 'span 3' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Remarks / Instructions</label>
                      <textarea className="form-control" placeholder="e.g. Attach shrinkage test report" rows={2} value={schForm.remarks} onChange={e => setSchForm({...schForm, remarks: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setShowAddSchedule(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSchSave}><Save size={16} /> Save Shipment Entry</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- SEQUENCES VIEW --- */}
        {activeCard === 'Buyer Order Sequences' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6' }}>
                <Settings size={20} /> Sequence Configuration
              </h2>
              <button className="btn btn-primary" onClick={() => { setShowAddSequence(true); setSelectedSequence(null); }}>
                <Plus size={16} /> Add Sequence
              </button>
            </div>

            {!showAddSequence ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="table-responsive animate-fade" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th>Sequence ID</th>
                        <th>Order ID (IBPO)</th>
                        <th>Generated Order No</th>
                        <th>Buyer / Party</th>
                        <th>Type / Category</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sequences.map(seq => (
                        <tr 
                          key={seq.id}
                          onClick={() => setSelectedSequence(seq)}
                          style={{ 
                            cursor: 'pointer', 
                            background: selectedSequence?.id === seq.id ? 'rgba(139, 92, 246, 0.05)' : 'transparent' 
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>{seq.sequence_id}</td>
                          <td style={{ color: 'var(--primary)' }}>{seq.order_id_ref || '-'}</td>
                          <td style={{ color: '#8b5cf6', fontWeight: 600 }}>{seq.generated_order_no}</td>
                          <td>{seq.buyer_name || '-'} / {seq.party_name || '-'}</td>
                          <td>{seq.order_type} / {seq.category}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', marginRight: 8 }} onClick={(e) => { e.stopPropagation(); setSelectedSequence(seq); }}><Eye size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleSeqDelete(seq.id); }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {sequences.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No sequences configured yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* QUICK VIEW SIDE PANE FOR SEQUENCE */}
                {selectedSequence && (
                  <div className="card animate-slide" style={{ width: 350, padding: 0, position: 'sticky', top: 100, border: '1px solid #8b5cf6', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#8b5cf6', color: 'white', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Settings size={18} /> Configuration Details
                      </h3>
                      <button className="btn btn-secondary" style={{ padding: 4, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setSelectedSequence(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Identifiers</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Sequence ID:</strong> {selectedSequence.sequence_id}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Order ID (IBPO):</strong> {selectedSequence.order_id_ref || 'N/A'}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8b5cf6', fontWeight: 700 }}><strong>Order No:</strong> {selectedSequence.generated_order_no}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Prefix:</strong> {selectedSequence.prefix}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Running No:</strong> {selectedSequence.running_no}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Fin Year:</strong> {selectedSequence.fin_year}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Logistics</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Buyer Name:</strong> {selectedSequence.buyer_name || 'N/A'}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Party Name:</strong> {selectedSequence.party_name || 'N/A'}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Type:</strong> {selectedSequence.order_type}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Category:</strong> {selectedSequence.category}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Created By:</strong> {selectedSequence.created_by}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card animate-fade" style={{ padding: 0, border: '1px solid #8b5cf6' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(139, 92, 246, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#8b5cf6' }}>New Sequence Configuration</h3>
                </div>

                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {/* Row 1 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Sequence ID</label>
                      <input type="text" className="form-control" defaultValue="AUTO-GENERATED" disabled style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order ID (IBPO No)</label>
                      <select className="form-control" value={seqForm.order_id_ref} onChange={e => setSeqForm({...seqForm, order_id_ref: e.target.value})}>
                        <option value="">Select Buyer Order...</option>
                        {buyerOrders.map(bo => (
                          <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} - {bo.party_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Prefix</label>
                      <input type="text" className="form-control" value={seqForm.prefix} onChange={e => setSeqForm({...seqForm, prefix: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Financial Year</label>
                      <select className="form-control" value={seqForm.fin_year} onChange={e => setSeqForm({...seqForm, fin_year: e.target.value})}>
                        <option>2026-27</option>
                        <option>2025-26</option>
                        <option>2024-25</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Running Number</label>
                      <input type="number" className="form-control" value={seqForm.running_no} onChange={e => setSeqForm({...seqForm, running_no: e.target.value})} />
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Buyer Name</label>
                      <select className="form-control" value={seqForm.buyer_name} onChange={e => setSeqForm({...seqForm, buyer_name: e.target.value})}>
                        <option value="">Select Buyer Master...</option>
                        <option>H&M</option>
                        <option>Walmart</option>
                        <option>C&A</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Party Name</label>
                      <select className="form-control" value={seqForm.party_name} onChange={e => setSeqForm({...seqForm, party_name: e.target.value})}>
                        <option value="">Select Party Master...</option>
                        <option>Tirupur Knits</option>
                        <option>Erode Fabrics</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order Type</label>
                      <select className="form-control" value={seqForm.order_type} onChange={e => setSeqForm({...seqForm, order_type: e.target.value})}>
                        <option>Domestic</option>
                        <option>Export</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order Category</label>
                      <select className="form-control" value={seqForm.category} onChange={e => setSeqForm({...seqForm, category: e.target.value})}>
                        <option>Fabric</option>
                        <option>Garment</option>
                        <option>Yarn</option>
                      </select>
                    </div>

                    {/* Row 3 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Buyer Reference No</label>
                      <input type="text" className="form-control" placeholder="PO reference..." value={seqForm.buyer_ref} onChange={e => setSeqForm({...seqForm, buyer_ref: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Created Date</label>
                      <input type="date" className="form-control" value={new Date().toISOString().split('T')[0]} disabled />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Created By</label>
                      <input type="text" className="form-control" value={seqForm.created_by} disabled />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                       <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Preview Next Order No</span>
                         <span style={{ fontSize: 16, fontWeight: 800, color: '#8b5cf6', marginTop: 4 }}>
                           {`${seqForm.prefix}-${seqForm.fin_year.substring(0,4)}-${String(seqForm.running_no).padStart(3, '0')}`}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setShowAddSequence(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSeqSave}><Save size={16} /> Save Sequence</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- AMD (AMENDMENT) VIEW --- */}
        {activeCard === 'Buyer Order AMD' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
                <History size={20} /> Amendment History (AMD)
              </h2>
              <button className="btn btn-primary" onClick={() => { setShowAddAmd(true); setSelectedAmd(null); }}>
                <Plus size={16} /> Add Amendment
              </button>
            </div>

            {!showAddAmd ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="table-responsive animate-fade" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th>AMD ID</th>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Field Changed</th>
                        <th>Old Value</th>
                        <th>New Value</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amendments.map(a => (
                        <tr 
                          key={a.id}
                          onClick={() => setSelectedAmd(a)}
                          style={{ 
                            cursor: 'pointer', 
                            background: selectedAmd?.id === a.id ? 'rgba(245, 158, 11, 0.05)' : 'transparent' 
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>{a.amendment_id}</td>
                          <td style={{ color: 'var(--primary)' }}>{a.order_id_ref}</td>
                          <td>{a.amd_date}</td>
                          <td><span style={{ padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{a.field_changed}</span></td>
                          <td style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{a.old_value}</td>
                          <td style={{ fontWeight: 600, color: '#10b981' }}>{a.new_value}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', marginRight: 8 }} onClick={(e) => { e.stopPropagation(); setSelectedAmd(a); }}><Eye size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '6px', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleAmdDelete(a.id); }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {amendments.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No amendments recorded yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* QUICK VIEW SIDE PANE FOR AMD */}
                {selectedAmd && (
                  <div className="card animate-slide" style={{ width: 350, padding: 0, position: 'sticky', top: 100, border: '1px solid #f59e0b', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#f59e0b', color: 'white', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <History size={18} /> Amendment Details
                      </h3>
                      <button className="btn btn-secondary" style={{ padding: 4, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setSelectedAmd(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tracking Info</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>AMD ID:</strong> {selectedAmd.amendment_id}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Order ID:</strong> {selectedAmd.order_id_ref}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Date:</strong> {selectedAmd.amd_date}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Effective Date:</strong> {selectedAmd.effective_date}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Approved By:</strong> {selectedAmd.approved_by}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Changes Made</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Field:</strong> {selectedAmd.field_changed}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Old Value:</strong> <span style={{ textDecoration: 'line-through' }}>{selectedAmd.old_value}</span></p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>New Value:</strong> <span style={{ color: '#10b981', fontWeight: 600 }}>{selectedAmd.new_value}</span></p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Remarks:</strong> {selectedAmd.remarks}</p>
                      </div>

                      { (selectedAmd.fabric_details || selectedAmd.shade) && (
                        <>
                          <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>
                          <div>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Textile Details</p>
                            <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Fabric:</strong> {selectedAmd.fabric_details || 'N/A'}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Shade:</strong> {selectedAmd.shade || 'N/A'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card animate-fade" style={{ padding: 0, border: '1px solid #f59e0b' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#d97706' }}>New Amendment Entry</h3>
                </div>

                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {/* Row 1 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>AMD ID</label>
                      <input type="text" className="form-control" defaultValue="AUTO-GENERATED" disabled style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order ID (IBPO No)</label>
                      <select className="form-control" value={amdForm.order_id_ref} onChange={e => setAmdForm({...amdForm, order_id_ref: e.target.value})}>
                        <option value="">Select Buyer Order...</option>
                        {buyerOrders.map(bo => (
                          <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} - {bo.party_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Amendment Date</label>
                      <input type="date" className="form-control" value={amdForm.amd_date} onChange={e => setAmdForm({...amdForm, amd_date: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Effective Date</label>
                      <input type="date" className="form-control" value={amdForm.effective_date} onChange={e => setAmdForm({...amdForm, effective_date: e.target.value})} />
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Field Changed</label>
                      <select className="form-control" value={amdForm.field_changed} onChange={e => setAmdForm({...amdForm, field_changed: e.target.value})}>
                        <option>Delivery Date</option>
                        <option>Quantity</option>
                        <option>Rate</option>
                        <option>Fabric Type</option>
                        <option>Shade/Colour</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Old Value</label>
                      <input type="text" className="form-control" placeholder="e.g. 4000 Mtrs" value={amdForm.old_value} onChange={e => setAmdForm({...amdForm, old_value: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>New Value</label>
                      <input type="text" className="form-control" placeholder="e.g. 5000 Mtrs" value={amdForm.new_value} onChange={e => setAmdForm({...amdForm, new_value: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Approved By</label>
                      <input type="text" className="form-control" placeholder="Manager Name" value={amdForm.approved_by} onChange={e => setAmdForm({...amdForm, approved_by: e.target.value})} />
                    </div>

                    {/* Row 3 */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Reason / Remarks</label>
                      <input type="text" className="form-control" placeholder="e.g. Buyer request, production delay..." value={amdForm.remarks} onChange={e => setAmdForm({...amdForm, remarks: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Buyer Ref No</label>
                      <input type="text" className="form-control" placeholder="Updated PO ref" value={amdForm.buyer_ref} onChange={e => setAmdForm({...amdForm, buyer_ref: e.target.value})} />
                    </div>
                    <div style={{ visibility: 'hidden' }}></div>

                    {/* Row 4 (Textile Specifics) */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Fabric Details (GSM, Weave)</label>
                      <input type="text" className="form-control" placeholder="e.g. 180 GSM, Twill weave" value={amdForm.fabric_details} onChange={e => setAmdForm({...amdForm, fabric_details: e.target.value})} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Shade / Colour</label>
                      <input type="text" className="form-control" placeholder="Pantone Code" value={amdForm.shade} onChange={e => setAmdForm({...amdForm, shade: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setShowAddAmd(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAmdSave}><Save size={16} /> Save Amendment</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- COMPLETION VIEW --- */}
        {activeCard === 'Buyer Order Completion' && (
          <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
                <CheckSquare size={20} /> Order Completions
              </h2>
              <button className="btn btn-success" onClick={() => { setShowAddCmp(true); setSelectedCmp(null); }}>
                <CheckCircle size={16} /> Mark New Order as Completed
              </button>
            </div>

            {!showAddCmp ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="table-responsive animate-fade" style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <table className="data-table">
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr>
                        <th>CMP ID</th>
                        <th>Order ID</th>
                        <th>Completion Date</th>
                        <th>Status</th>
                        <th>Final Dispatch Qty</th>
                        <th>Balance Qty</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completions.map(c => (
                        <tr 
                          key={c.id}
                          onClick={() => setSelectedCmp(c)}
                          style={{ 
                            cursor: 'pointer', 
                            background: selectedCmp?.id === c.id ? 'rgba(16, 185, 129, 0.05)' : 'transparent' 
                          }}
                        >
                          <td style={{ fontWeight: 600 }}>{c.cmp_id}</td>
                          <td style={{ color: 'var(--primary)' }}>{c.order_id_ref}</td>
                          <td>{c.completion_date}</td>
                          <td><span className="badge badge-completed">{c.status}</span></td>
                          <td>{c.final_dispatch_qty}</td>
                          <td>{c.balance_qty}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleCmpDelete(c.id); }} title="Delete"><Trash2 size={14} /></button>
                              <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#3b82f6' }} title="Trigger Final Invoice"><FileText size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {completions.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No completions recorded yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* QUICK VIEW SIDE PANE FOR CMP */}
                {selectedCmp && (
                  <div className="card animate-slide" style={{ width: 350, padding: 0, position: 'sticky', top: 100, border: '1px solid #10b981', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#10b981', color: 'white', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckSquare size={18} /> Completion Details
                      </h3>
                      <button className="btn btn-secondary" style={{ padding: 4, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setSelectedCmp(null)}>
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tracking Info</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>CMP ID:</strong> {selectedCmp.cmp_id}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Order ID:</strong> {selectedCmp.order_id_ref}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Completion Date:</strong> {selectedCmp.completion_date}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Status:</strong> <span className="badge badge-completed">{selectedCmp.status}</span></p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Metrics</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Final Dispatch Qty:</strong> {selectedCmp.final_dispatch_qty}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Balance Qty:</strong> {selectedCmp.balance_qty}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Logistics & References</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Delivery Place:</strong> {selectedCmp.delivery_place}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Transporter:</strong> {selectedCmp.transporter_name}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Buyer Ref No:</strong> {selectedCmp.buyer_ref}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Remarks:</strong> {selectedCmp.remarks}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }}></div>

                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Textile specifics</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Fabric Type:</strong> {selectedCmp.fabric_type}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Shade/Colour:</strong> {selectedCmp.shade}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Lot No:</strong> {selectedCmp.lot_no}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13 }}><strong>Packing Type:</strong> {selectedCmp.packing_type}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card animate-fade" style={{ padding: 0, border: '1px solid #10b981' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(16, 185, 129, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#059669' }}>Mark Order as Completed</h3>
                </div>

                <div style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {/* Row 1 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>CMP ID</label>
                      <input type="text" className="form-control" defaultValue="AUTO-GENERATED" disabled style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Order ID (IBPO No)</label>
                      <select className="form-control" value={cmpForm.order_id_ref} onChange={e => setCmpForm({...cmpForm, order_id_ref: e.target.value})}>
                        <option value="">Select Buyer Order...</option>
                        {buyerOrders.map(bo => (
                          <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} - {bo.party_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Completion Date</label>
                      <input type="date" className="form-control" value={cmpForm.completion_date} onChange={e => setCmpForm({...cmpForm, completion_date: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Status</label>
                      <select className="form-control" value={cmpForm.status} onChange={e => setCmpForm({...cmpForm, status: e.target.value})}>
                        <option>Closed</option>
                        <option>Cancelled</option>
                        <option>On Hold</option>
                      </select>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Final Dispatch Qty</label>
                      <input type="text" className="form-control" placeholder="e.g. 5000 Mtrs" value={cmpForm.final_dispatch_qty} onChange={e => setCmpForm({...cmpForm, final_dispatch_qty: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Balance Qty</label>
                      <input type="text" className="form-control" placeholder="e.g. 0" value={cmpForm.balance_qty} onChange={e => setCmpForm({...cmpForm, balance_qty: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Fabric Type</label>
                      <select className="form-control" value={cmpForm.fabric_type} onChange={e => setCmpForm({...cmpForm, fabric_type: e.target.value})}>
                        <option>Cotton</option>
                        <option>Polyester</option>
                        <option>Blended</option>
                        <option>Denim</option>
                        <option>Linen</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Shade / Colour</label>
                      <input type="text" className="form-control" placeholder="Pantone Code" value={cmpForm.shade} onChange={e => setCmpForm({...cmpForm, shade: e.target.value})} />
                    </div>

                    {/* Row 3 */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Lot No</label>
                      <input type="text" className="form-control" placeholder="Yarn/Fabric lot" value={cmpForm.lot_no} onChange={e => setCmpForm({...cmpForm, lot_no: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Packing Type</label>
                      <select className="form-control" value={cmpForm.packing_type} onChange={e => setCmpForm({...cmpForm, packing_type: e.target.value})}>
                        <option>Bale</option>
                        <option>Roll</option>
                        <option>Carton</option>
                        <option>Pallet</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Delivery Place</label>
                      <input type="text" className="form-control" placeholder="e.g. Tirupur" value={cmpForm.delivery_place} onChange={e => setCmpForm({...cmpForm, delivery_place: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Transporter Name</label>
                      <input type="text" className="form-control" placeholder="e.g. VRL Logistics" value={cmpForm.transporter_name} onChange={e => setCmpForm({...cmpForm, transporter_name: e.target.value})} />
                    </div>

                    {/* Row 4 */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Buyer Reference No</label>
                      <input type="text" className="form-control" placeholder="Buyer's PO number" value={cmpForm.buyer_ref} onChange={e => setCmpForm({...cmpForm, buyer_ref: e.target.value})} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Remarks</label>
                      <input type="text" className="form-control" placeholder="e.g. Order closed after final shipment" value={cmpForm.remarks} onChange={e => setCmpForm({...cmpForm, remarks: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setShowAddCmp(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleCmpSave}><CheckSquare size={16} /> Save Completion Record</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
