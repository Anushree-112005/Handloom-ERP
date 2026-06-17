import React, { useState, useEffect } from 'react';
import { Factory, Search, Save, ArrowLeft, Plus, Trash2, Eye, Edit2 } from 'lucide-react';
import { ppcAPI, buyerOrderAPI, subMasterAPI } from '../../services/api';

export default function OrderBreakdown() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    order_id: '',
    buyer_name: '',
    fabric_type: '',
    total_meters: '',
    num_looms: 3,
    split_logic: 'Equal',
    allocations: [{ loom_id: '', meters: 10000 }, { loom_id: '', meters: 10000 }, { loom_id: '', meters: 10000 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes, loomsRes] = await Promise.all([
        subMasterAPI.list('ppc_order_breakdown'),
        buyerOrderAPI.list().catch(() => ({ data: [] })),
        ppcAPI.getLooms()
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomsRes?.data || []);
      
      // If no orders from API, we'll use a placeholder for the demo
      const fetchedOrders = ordRes?.data || [];
      if (fetchedOrders.length === 0) {
        setOrders([{ id: 'ORD-2024-001', order_no: 'ORD-2024-001', buyer_name: 'H&M Sweden', quality: 'Cotton Poplin', total_quantity: 30000 }]);
      } else {
        setOrders(fetchedOrders);
      }
    } catch (err) {
      if (err?.message !== 'Request aborted' && err?.code !== 'ERR_CANCELED') {
        console.error("Failed to fetch data", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSplits = (total, numLooms, logic, currentAllocations = []) => {
    if (numLooms <= 0) return [];
    const split = (logic === 'Equal' && total > 0) ? (total / numLooms).toFixed(2) : '';
    const newAllocations = [];
    for (let i = 0; i < numLooms; i++) {
       newAllocations.push({
         loom_id: currentAllocations[i]?.loom_id || '',
         meters: logic === 'Equal' ? split : (currentAllocations[i]?.meters || '')
       });
    }
    return newAllocations;
  };

  const handleOrderChange = (e) => {
    const selectedOrderId = e.target.value;
    if (!selectedOrderId) {
       setFormData(prev => ({ 
         ...prev, order_id: '', buyer_name: '', fabric_type: '', total_meters: '', allocations: calculateSplits(0, prev.num_looms, prev.split_logic, prev.allocations)
       }));
       return;
    }
    
    const order = orders.find(o => o.order_no === selectedOrderId || o.id.toString() === selectedOrderId);
    if (!order) return;

    const total = parseFloat(order.total_quantity) || 30000;
    const buyer = order.buyer_name || order.party_name || 'H&M Sweden';
    const fabric = order.fabric_quality || order.quality || 'Cotton Poplin';

    const newAllocations = calculateSplits(total, formData.num_looms, formData.split_logic, formData.allocations);

    setFormData(prev => ({
      ...prev,
      order_id: order.order_no || order.id.toString(),
      buyer_name: buyer,
      fabric_type: fabric,
      total_meters: total,
      allocations: newAllocations
    }));
  };

  const handleLogicChange = (e) => {
    const logic = e.target.value;
    const newAllocations = calculateSplits(parseFloat(formData.total_meters) || 0, formData.num_looms, logic, formData.allocations);
    setFormData(prev => ({ ...prev, split_logic: logic, allocations: newAllocations }));
  };

  const handleAddLoom = () => {
    const num = formData.allocations.length + 1;
    if (num > 20) return;
    const newAllocations = calculateSplits(parseFloat(formData.total_meters) || 0, num, formData.split_logic, formData.allocations);
    setFormData(prev => ({ ...prev, num_looms: num, allocations: newAllocations }));
  };

  const handleRemoveLoom = (indexToRemove) => {
    const num = Math.max(1, formData.allocations.length - 1);
    const updatedAllocations = formData.allocations.filter((_, idx) => idx !== indexToRemove);
    const newAllocations = calculateSplits(parseFloat(formData.total_meters) || 0, num, formData.split_logic, updatedAllocations);
    setFormData(prev => ({ ...prev, num_looms: num, allocations: newAllocations }));
  };

  const handleAllocationMetersChange = (index, value) => {
    const newAllocations = [...formData.allocations];
    newAllocations[index].meters = value;
    setFormData(prev => ({ ...prev, split_logic: 'Manual', allocations: newAllocations }));
  };

  const handleAllocationLoomChange = (index, value) => {
    const newAllocations = [...formData.allocations];
    newAllocations[index].loom_id = value;
    setFormData(prev => ({ ...prev, allocations: newAllocations }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_order_breakdown', {
        name: formData.order_id,
        extra_field_1: formData.total_meters.toString(),
        extra_field_2: formData.split_logic,
        description: `Looms: ${formData.num_looms}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving record.');
    }
  };
  const handleEdit = (record) => {
    setFormData(prev => ({ ...prev, order_id: record.name, total_meters: record.extra_field_1, split_logic: record.extra_field_2 }));
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await subMasterAPI.delete('ppc_order_breakdown', id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete record');
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.extra_field_2?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Factory style={{ color: '#06b6d4' }} /> Order Breakdown
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Split large orders across multiple looms dynamically</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                order_id: '', buyer_name: '', fabric_type: '', total_meters: '',
                num_looms: 3, split_logic: 'Equal', allocations: [{ loom_id: '', meters: 0 }, { loom_id: '', meters: 0 }, { loom_id: '', meters: 0 }]
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#06b6d4', borderColor: '#06b6d4' }}
          >
            <Plus size={16} /> New Breakdown
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {/* Inline Form */}
      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#06b6d418', borderRadius: 10, color: '#06b6d4' }}>
                <Factory size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Configure Order Distribution</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Allocate meters evenly or manually across looms</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" name="order_id" value={formData.order_id} onChange={handleOrderChange} required>
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id} - {o.buyer_name || o.party_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Split Logic</label>
                <select className="form-control" name="split_logic" value={formData.split_logic} onChange={handleLogicChange}>
                  <option value="Equal">Equal Split</option>
                  <option value="Capacity-based">Capacity-based</option>
                  <option value="Manual">Manual Entry</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Buyer Name (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.buyer_name} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Fabric Type (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.fabric_type} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Total Order Meters (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.total_meters ? `${formData.total_meters} m` : ''} readOnly style={{ backgroundColor: '#06b6d418', borderColor: '#06b6d4', color: '#0891b2', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 16, border: '1px solid var(--border)', borderRadius: 12, backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Loom Allocations</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Add or remove looms for this order</p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleAddLoom}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13 }}
                >
                  <Plus size={14} /> Add Loom
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {formData.allocations.map((alloc, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label style={{ fontSize: 11, textTransform: 'uppercase' }}>Select Loom {idx + 1}</label>
                      <select 
                        className="form-control" 
                        value={alloc.loom_id}
                        onChange={(e) => handleAllocationLoomChange(idx, e.target.value)}
                      >
                         <option value="">-- Assign Loom --</option>
                         {looms.map(l => (
                           <option key={l.id} value={l.loom_name}>{l.loom_name}</option>
                         ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, width: 130 }}>
                      <label style={{ fontSize: 11, textTransform: 'uppercase' }}>Meters</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={alloc.meters} 
                        onChange={(e) => handleAllocationMetersChange(idx, e.target.value)}
                        readOnly={formData.split_logic !== 'Manual'}
                        style={formData.split_logic !== 'Manual' ? { backgroundColor: 'var(--bg-primary)', fontWeight: 600 } : { fontWeight: 600, color: '#0891b2' }}
                      />
                    </div>
                    {formData.allocations.length > 1 && (
                      <button 
                        type="button" 
                        className="btn btn-icon" 
                        onClick={() => handleRemoveLoom(idx)}
                        style={{ color: '#ef4444', padding: 8, marginTop: 18 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#06b6d4', borderColor: '#06b6d4' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Breakdown
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Saved Breakdowns ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Total Meters</th>
                  <th>Split Logic</th>
                  <th>Allocated Looms</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td><span style={{ color: '#0891b2', fontWeight: 600 }}>{record.extra_field_1} m</span></td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        backgroundColor: record.extra_field_2 === 'Equal' ? '#06b6d420' : '#8b5cf620',
                        color: record.extra_field_2 === 'Equal' ? '#0891b2' : '#6d28d9'
                      }}>
                        {record.extra_field_2}
                      </span>
                    </td>
                    <td>{record.description}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn-icon" onClick={() => handleEdit(record)} title="View/Edit">
                          <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button className="btn-icon" onClick={() => handleEdit(record)} title="Edit">
                          <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(record.id)} title="Delete">
                          <Trash2 size={16} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
