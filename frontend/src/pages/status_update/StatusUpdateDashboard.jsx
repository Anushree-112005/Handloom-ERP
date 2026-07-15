import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Search, Clock, CheckCircle, AlertTriangle, 
  PauseCircle, Upload, Save, History, Activity, Layers, ArrowRight,
  TrendingUp, FileText, CheckSquare, Settings, Factory
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { buyerOrderAPI } from '../../services/api';

// --- MOCK DATA ---
const mockOrders = [
  {
    id: 'ORD-1001',
    buyerName: 'Global Retailers Inc',
    buyerOrderNo: 'GR-2026-001',
    styleNo: 'ST-045A',
    poNo: 'PO-99238',
    productName: 'Mens Cotton T-Shirt',
    color: 'Navy Blue',
    size: 'M',
    orderQuantity: 5000,
    deliveryDate: '2026-08-15',
  },
  {
    id: 'ORD-1002',
    buyerName: 'Fashion Hub Ltd',
    buyerOrderNo: 'FH-5541',
    styleNo: 'ST-112B',
    poNo: 'PO-88122',
    productName: 'Womens Denim Jacket',
    color: 'Stone Wash',
    size: 'L',
    orderQuantity: 2000,
    deliveryDate: '2026-09-01',
  }
];

const productionStages = [
  'Fabric Received', 'Fabric Inspection', 'Dyeing', 'Compacting',
  'Cutting', 'Printing', 'Embroidery', 'Stitching', 'Washing',
  'Ironing', 'Quality Checking', 'Packing', 'Dispatch'
];

export default function StatusUpdateDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [apiOrders, setApiOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [orderData, setOrderData] = useState(null);
  
  // State for stage tracking
  const [stageStatuses, setStageStatuses] = useState({});
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState({
    status: 'Not Started',
    completedQty: 0,
    remarks: ''
  });

  // Verify Auth & Load Data
  useEffect(() => {
    const token = localStorage.getItem('status_update_token');
    if (!token) {
      navigate('/status-update/login');
      return;
    }
    const u = localStorage.getItem('su_user');
    if (u) setUser(JSON.parse(u));
    
    // Fetch orders for this user
    buyerOrderAPI.statusUpdateOrders()
      .then(res => setApiOrders(res.data))
      .catch(err => console.error('Failed to load orders', err));
  }, [navigate]);

  // Handle Order Selection
  const handleOrderChange = (e) => {
    const ordId = e.target.value;
    setSelectedOrder(ordId);
    
    if (ordId) {
      // Use apiOrders instead of mockOrders, matching on id
      const order = apiOrders.find(o => String(o.id) === ordId);
      setOrderData(order);
      const orderQty = order.items?.reduce((sum, item) => sum + (item.order_mtrs || 0), 0) || 0;
      
      // Initialize or load stage statuses for this order (Mocking initial state)
      const initialStatuses = {};
      productionStages.forEach(stage => {
        initialStatuses[stage] = {
          status: 'Not Started',
          completedQty: 0,
          pendingQty: orderQty,
          updatedBy: '-',
          updatedTime: '-',
          expectedDate: '-',
          remarks: ''
        };
      });
      // Mock some progress for ORD-1001
      if (ordId === 'ORD-1001') {
        initialStatuses['Fabric Received'] = { status: 'Completed', completedQty: 5000, pendingQty: 0, updatedBy: 'EMP123', updatedTime: '2026-07-10 10:00', expectedDate: '2026-07-10', remarks: 'Received full batch' };
        initialStatuses['Fabric Inspection'] = { status: 'Completed', completedQty: 5000, pendingQty: 0, updatedBy: 'EMP123', updatedTime: '2026-07-11 14:00', expectedDate: '2026-07-11', remarks: 'Passed QC' };
        initialStatuses['Dyeing'] = { status: 'In Progress', completedQty: 3000, pendingQty: 2000, updatedBy: 'EMP123', updatedTime: '2026-07-15 09:30', expectedDate: '2026-07-18', remarks: 'Dyeing running' };
      }
      
      setStageStatuses(initialStatuses);
      
      // Mock history
      setHistory([
        { id: 1, date: '2026-07-10 10:00', stage: 'Fabric Received', prevStatus: 'Not Started', newStatus: 'Completed', by: 'EMP123', remarks: 'Received full batch' },
        { id: 2, date: '2026-07-11 14:00', stage: 'Fabric Inspection', prevStatus: 'Not Started', newStatus: 'Completed', by: 'EMP123', remarks: 'Passed QC' }
      ]);
    } else {
      setOrderData(null);
      setStageStatuses({});
      setHistory([]);
    }
  };

  const addNotification = (type, message) => {
    const newNotif = { id: Date.now(), type, message };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('status_update_token');
    localStorage.removeItem('su_user');
    navigate('/status-update/login');
  };

  const handleEditStage = (stage) => {
    setEditingStage(stage);
    const current = stageStatuses[stage];
    setStageForm({
      status: current.status,
      completedQty: current.completedQty,
      remarks: current.remarks
    });
  };

  const handleSaveStage = () => {
    if (!orderData) return;
    
    const qty = parseInt(stageForm.completedQty, 10) || 0;
    const orderQty = orderData.items?.reduce((sum, item) => sum + (item.order_mtrs || 0), 0) || 0;
    
    // Validation
    if (qty > orderQty) {
      alert("Completed quantity cannot exceed Total Order Quantity.");
      return;
    }
    
    // Determine previous status for history
    const prevStatus = stageStatuses[editingStage].status;
    const newPending = orderQty - qty;
    
    // Update Stage
    const updatedStages = {
      ...stageStatuses,
      [editingStage]: {
        ...stageStatuses[editingStage],
        status: stageForm.status,
        completedQty: qty,
        pendingQty: newPending,
        updatedBy: user?.empId || 'System',
        updatedTime: new Date().toLocaleString(),
        remarks: stageForm.remarks
      }
    };
    
    setStageStatuses(updatedStages);
    
    // Add History
    setHistory(prev => [
      {
        id: Date.now(),
        date: new Date().toLocaleString(),
        stage: editingStage,
        prevStatus,
        newStatus: stageForm.status,
        by: user?.empId || 'System',
        remarks: stageForm.remarks
      },
      ...prev
    ]);
    
    // Notifications
    if (stageForm.status === 'Completed') {
      addNotification('success', `${editingStage} has been marked as Completed.`);
    } else if (stageForm.status === 'Hold') {
      addNotification('warning', `${editingStage} has been put on Hold.`);
    }
    
    setEditingStage(null);
  };

  // Calculations for Progress Summary
  let totalCompletedAcrossStages = 0;
  let activeProcess = 'None';
  let nextProcess = 'None';
  let overallCompletionPct = 0;

  if (orderData && Object.keys(stageStatuses).length > 0) {
    const orderQty = orderData.items?.reduce((sum, item) => sum + (item.order_mtrs || 0), 0) || 0;
    const maxPossibleCompleted = orderQty * productionStages.length;
    let activeFound = false;
    for (let i = 0; i < productionStages.length; i++) {
      const stg = productionStages[i];
      const st = stageStatuses[stg];
      totalCompletedAcrossStages += (st.completedQty || 0);
      
      if (!activeFound && (st.status === 'In Progress' || st.status === 'Hold' || st.status === 'Not Started')) {
        activeProcess = stg;
        nextProcess = productionStages[i+1] || 'Completed All';
        activeFound = true;
      }
    }
    
    overallCompletionPct = maxPossibleCompleted === 0 ? 0 : Math.round((totalCompletedAcrossStages / maxPossibleCompleted) * 100);
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return '#10b981'; // emerald
      case 'In Progress': return '#3b82f6'; // blue
      case 'Hold': return '#f59e0b'; // amber
      default: return '#94a3b8'; // slate
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Completed': return <CheckCircle size={16} />;
      case 'In Progress': return <Activity size={16} />;
      case 'Hold': return <PauseCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="animate-in fade-in" style={{ padding: '0px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header specific to Status Update */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 24px', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Settings size={24} color="var(--primary)" /> Production Status Update
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Update live floor status and track manufacturing progress.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Logged in as: <strong>{user?.empId || 'Employee'}</strong>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '6px 12px' }}>
            <LogOut size={16} /> Exit Module
          </button>
        </div>
      </div>

      {/* Notifications overlay */}
      <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.map(n => (
          <div key={n.id} className="animate-fade" style={{ 
            background: n.type === 'success' ? '#ecfdf5' : '#fffbeb', 
            border: `1px solid ${n.type === 'success' ? '#a7f3d0' : '#fde68a'}`,
            color: n.type === 'success' ? '#065f46' : '#92400e',
            padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            {n.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{n.message}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        
        {/* Order Selection */}
        <div className="card mb-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Select Order to Update:
          </div>
          <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select 
              className="form-control" 
              value={selectedOrder} 
              onChange={handleOrderChange}
              style={{ paddingLeft: '36px' }}
            >
              <option value="">-- Select Order --</option>
              {apiOrders.map(o => (
                <option key={o.id} value={o.id}>{o.ibpo_number || o.id} - {o.buyer_name}</option>
              ))}
            </select>
          </div>
        </div>

        {orderData ? (
          <div className="animate-fade">
            
            {/* Top Section: Order Details */}
            <div className="card mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <Layers size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Order Details</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Buyer Name</div><div style={{ fontWeight: 600 }}>{orderData.buyer_name}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Buyer Order No</div><div style={{ fontWeight: 600 }}>{orderData.ibpo_number}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Style No</div><div style={{ fontWeight: 600 }}>{orderData.items?.[0]?.buyer_style || '-'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PO No</div><div style={{ fontWeight: 600 }}>{orderData.items?.[0]?.party_po_no || '-'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product</div><div style={{ fontWeight: 600 }}>{orderData.items?.[0]?.fabric_type || '-'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Color / Size</div><div style={{ fontWeight: 600 }}>{orderData.items?.[0]?.color || '-'} / {orderData.items?.[0]?.uom || '-'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Order Quantity</div><div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '16px' }}>{orderData.items?.reduce((sum, item) => sum + (item.order_mtrs || 0), 0) || 0}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Order Date</div><div style={{ fontWeight: 600 }}>{orderData.order_date}</div></div>
              </div>
            </div>

            {/* Progress Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="card stat-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Order Quantity</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{orderData.items?.reduce((sum, item) => sum + (item.order_mtrs || 0), 0) || 0}</div>
              </div>
              <div className="card stat-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Overall Completion %</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{overallCompletionPct}%</div>
                <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${overallCompletionPct}%`, background: '#10b981', height: '100%' }}></div>
                </div>
              </div>
              <div className="card stat-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Process</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} /> {activeProcess}
                </div>
              </div>
              <div className="card stat-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Next Process</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowRight size={20} /> {nextProcess}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              {/* Production Stages Timeline/Cards */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <CheckSquare size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Update Production Stages</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
                  {productionStages.map((stage, idx) => {
                    const st = stageStatuses[stage];
                    const isEditing = editingStage === stage;
                    
                    return (
                      <div key={stage} style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '16px',
                        background: isEditing ? '#f8fafc' : '#fff',
                        borderLeft: `4px solid ${getStatusColor(st.status)}`,
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <div style={{ 
                                background: '#f1f5f9', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, 
                                width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' 
                              }}>
                                {idx + 1}
                              </div>
                              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{stage}</h4>
                              <span style={{ 
                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600,
                                padding: '2px 8px', borderRadius: '12px',
                                background: `${getStatusColor(st.status)}20`,
                                color: getStatusColor(st.status)
                              }}>
                                {getStatusIcon(st.status)} {st.status}
                              </span>
                            </div>
                            
                            {!isEditing && (
                              <div style={{ marginBottom: '8px' }}>
                                <div><strong>Status:</strong> <span style={{ color: getStatusColor(st.status), fontWeight: 500 }}>{st.status}</span></div>
                                <div><strong>Completed:</strong> {st.completedQty} / {orderData.items?.reduce((sum, item) => sum + (item.order_mtrs || 0), 0) || 0}</div>
                                <div><strong>Pending:</strong> {st.pendingQty}</div>
                                {st.updatedBy !== '-' && <div><strong>Updated By:</strong> {st.updatedBy} ({st.updatedTime})</div>}
                              </div>
                            )}
                          </div>
                          
                          {!isEditing && (
                            <button className="btn btn-secondary" onClick={() => handleEditStage(stage)} style={{ padding: '4px 12px', fontSize: '13px' }}>
                              Update Status
                            </button>
                          )}
                        </div>

                        {/* Edit Form */}
                        {isEditing && (
                          <div className="animate-fade" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Status</label>
                                <select 
                                  className="form-control" 
                                  value={stageForm.status}
                                  onChange={e => setStageForm({...stageForm, status: e.target.value})}
                                >
                                  <option>Not Started</option>
                                  <option>In Progress</option>
                                  <option>Completed</option>
                                  <option>Hold</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Completed Qty</label>
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  value={stageForm.completedQty}
                                  onChange={e => setStageForm({...stageForm, completedQty: e.target.value})}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Attachments (Optional)</label>
                                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} type="button">
                                  <Upload size={14} /> Upload Image/Doc
                                </button>
                              </div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Remarks</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                value={stageForm.remarks}
                                onChange={e => setStageForm({...stageForm, remarks: e.target.value})}
                                placeholder="Add notes about delays, issues, etc."
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                              <button className="btn btn-secondary" onClick={() => setEditingStage(null)}>Cancel</button>
                              <button className="btn btn-primary" onClick={handleSaveStage}>
                                <Save size={16} /> Save Changes
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {!isEditing && st.remarks && (
                          <div style={{ marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <strong>Remarks:</strong> {st.remarks}
                          </div>
                        )}
                        
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status History */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <History size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Update Logs</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.length > 0 ? history.map(log => (
                    <div key={log.id} style={{ fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.stage}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{log.prevStatus}</span>
                        <ArrowRight size={12} color="var(--text-muted)" />
                        <span style={{ color: getStatusColor(log.newStatus), fontWeight: 600 }}>{log.newStatus}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Updated by: <strong>{log.by}</strong>
                      </div>
                      {log.remarks && (
                        <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '4px' }}>
                          "{log.remarks}"
                        </div>
                      )}
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
                      No updates recorded yet.
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        ) : (
          <div style={{ 
            height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', background: '#fff', borderRadius: '12px', border: '1px dashed var(--border)'
          }}>
            <Factory size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3 style={{ margin: 0, fontWeight: 500 }}>Select an order to view and update its production status</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Use the dropdown above to search for an active buyer order.</p>
          </div>
        )}
        
      </div>
    </div>
  );
}
