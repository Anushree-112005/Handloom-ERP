import React, { useState, useEffect } from 'react';
import { Calendar, Search, Save, ArrowLeft, Plus, Trash2, Eye, Edit2 } from 'lucide-react';
import { ppcAPI, buyerOrderAPI, subMasterAPI } from '../../services/api';

export default function StartDatePlanning() {
  const [records, setRecords] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: null,
    schedule_id: '',
    order_id: '',
    loom_id: '',
    allocated_meters: '',
    daily_production: '',
    runtime_days: '',
    planned_start: new Date().toISOString().split('T')[0],
    planned_end: '',
    delivery_date: '',
    buffer_days: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, allocRes, ordRes, loomsRes] = await Promise.all([
        subMasterAPI.list('ppc_start_end_plan').catch(() => ({ data: [] })),
        ppcAPI.getAllocations().catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setAllocations(allocRes?.data || []);
      setLooms(loomsRes?.data || []);

      const fetchedOrders = ordRes?.data || [];
      if (fetchedOrders.length === 0) {
        setOrders([{ id: 'ORD-2024-001', order_no: 'ORD-2024-001', expected_delivery_date: '2026-07-10' }]);
      } else {
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDates = (start, runtime, delivery) => {
    if (!start || !runtime) return { end: '', buffer: '' };
    
    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.ceil(runtime));
    
    const endStr = endDate.toISOString().split('T')[0];
    
    let bufferStr = '';
    if (delivery) {
      const delDate = new Date(delivery);
      const diffTime = delDate - endDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      bufferStr = diffDays.toString();
    }

    return { end: endStr, buffer: bufferStr };
  };

  const handleOrderChange = (e) => {
    const selectedOrderId = e.target.value;
    const order = orders.find(o => o.order_no === selectedOrderId || o.id.toString() === selectedOrderId);
    const delDate = order?.expected_delivery_date || '2026-07-10';

    // Auto-select Loom if there's an allocation
    const alloc = allocations.find(a => a.order_id === selectedOrderId);
    let loomId = formData.loom_id;
    let allocatedMeters = formData.allocated_meters;

    if (alloc) {
      const loom = looms.find(l => l.id === alloc.loom_id);
      loomId = loom ? loom.loom_name : alloc.loom_id;
      allocatedMeters = alloc.assigned_meters;
    }

    const dailyProd = computeDailyProduction(loomId);
    const runtime = dailyProd > 0 && allocatedMeters ? (allocatedMeters / dailyProd) : '';
    const { end, buffer } = calculateDates(formData.planned_start, runtime, delDate);

    setFormData(prev => ({
      ...prev,
      order_id: selectedOrderId,
      delivery_date: delDate,
      loom_id: loomId,
      allocated_meters: allocatedMeters,
      daily_production: dailyProd || '',
      runtime_days: runtime ? runtime.toFixed(1) : '',
      planned_end: end,
      buffer_days: buffer
    }));
  };

  const computeDailyProduction = (loomName) => {
    const loom = looms.find(l => l.loom_name === loomName || l.id.toString() === loomName);
    if (!loom) return 0;
    return (loom.capacity_per_day * (loom.efficiency_pct / 100)).toFixed(2);
  };

  const handleLoomChange = (e) => {
    const loomId = e.target.value;
    const dailyProd = computeDailyProduction(loomId);
    
    // Check if we have an allocation
    const alloc = allocations.find(a => a.order_id === formData.order_id && (a.loom_id === loomId || looms.find(l=>l.id===a.loom_id)?.loom_name === loomId));
    const allocatedMeters = alloc ? alloc.assigned_meters : formData.allocated_meters;

    const runtime = dailyProd > 0 && allocatedMeters ? (allocatedMeters / dailyProd) : '';
    const { end, buffer } = calculateDates(formData.planned_start, runtime, formData.delivery_date);

    setFormData(prev => ({
      ...prev,
      loom_id: loomId,
      allocated_meters: allocatedMeters,
      daily_production: dailyProd || '',
      runtime_days: runtime ? runtime.toFixed(1) : '',
      planned_end: end,
      buffer_days: buffer
    }));
  };

  const handleStartChange = (e) => {
    const start = e.target.value;
    const { end, buffer } = calculateDates(start, formData.runtime_days, formData.delivery_date);
    setFormData(prev => ({
      ...prev,
      planned_start: start,
      planned_end: end,
      buffer_days: buffer
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.schedule_id,
        code: formData.order_id,
        extra_field_1: `${formData.planned_start} to ${formData.planned_end}`,
        extra_field_2: `Buffer: ${formData.buffer_days} days`,
        description: `Loom: ${formData.loom_id} | Runtime: ${formData.runtime_days} days`,
        is_active: true
      };

      if (formData.id) {
        await subMasterAPI.update('ppc_start_end_plan', formData.id, payload);
      } else {
        await subMasterAPI.create('ppc_start_end_plan', payload);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating schedule.');
    }
  };

  const handleEdit = (record) => {
    // Parse description/extra fields back into form data roughly
    const loomMatch = record.description?.match(/Loom: (.*?) \|/);
    const runtimeMatch = record.description?.match(/Runtime: (.*?) days/);
    const startEndMatch = record.extra_field_1?.split(' to ');
    const bufferMatch = record.extra_field_2?.match(/Buffer: (.*?) days/);

    setFormData({
      id: record.id,
      schedule_id: record.name,
      order_id: record.code,
      loom_id: loomMatch ? loomMatch[1] : '',
      allocated_meters: '', // Would need to re-fetch to be exact
      daily_production: '',
      runtime_days: runtimeMatch ? runtimeMatch[1] : '',
      planned_start: startEndMatch ? startEndMatch[0] : new Date().toISOString().split('T')[0],
      planned_end: startEndMatch ? startEndMatch[1] : '',
      delivery_date: '', // Re-fetch
      buffer_days: bufferMatch ? bufferMatch[1] : ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await subMasterAPI.delete('ppc_start_end_plan', id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete schedule');
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ color: '#ec4899' }} /> Start & End Date Planning
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Calculate accurate start and end dates based on machine capacity</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                id: null,
                schedule_id: `SC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                order_id: '', loom_id: '', allocated_meters: '', daily_production: '',
                runtime_days: '', planned_start: new Date().toISOString().split('T')[0],
                planned_end: '', delivery_date: '', buffer_days: ''
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#ec4899', borderColor: '#ec4899' }}
          >
            <Plus size={16} /> New Schedule
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

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#ec489918', borderRadius: 10, color: '#ec4899' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Create Production Schedule</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Automated runtime and buffer calculation</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#ec489918', color: '#be185d', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.schedule_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" value={formData.order_id} onChange={handleOrderChange} required>
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={handleLoomChange} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.loom_name}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Allocated Meters (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.allocated_meters} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Daily Production (m/day) (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.daily_production} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Runtime (days) (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.runtime_days} readOnly style={{ backgroundColor: '#ec489918', borderColor: '#ec4899', color: '#be185d', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Planned Start Date</label>
                <input type="date" className="form-control" value={formData.planned_start} onChange={handleStartChange} required />
              </div>
              <div className="form-group">
                <label>Planned End Date (Auto-calc)</label>
                <input type="date" className="form-control" value={formData.planned_end} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Buyer Delivery Date (Auto-fill)</label>
                <input type="date" className="form-control" value={formData.delivery_date} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Buffer Days (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.buffer_days !== '' ? `${formData.buffer_days} days` : ''} readOnly style={{ backgroundColor: formData.buffer_days < 0 ? '#ef444418' : '#10b98118', borderColor: formData.buffer_days < 0 ? '#ef4444' : '#10b981', color: formData.buffer_days < 0 ? '#b91c1c' : '#047857', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ec4899', borderColor: '#ec4899' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Schedule
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Schedules ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search schedules..."
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
                  <th>Schedule ID</th>
                  <th>Order ID</th>
                  <th>Dates</th>
                  <th>Buffer / Details</th>
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
                    <td><span style={{ color: '#ec4899', fontWeight: 600 }}>{record.code}</span></td>
                    <td>{record.extra_field_1}</td>
                    <td>{record.extra_field_2} ({record.description})</td>
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
