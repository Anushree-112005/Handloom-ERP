import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Calendar as CalendarIcon, Download, FileText, Filter, ArrowLeft, Printer, Clock, Factory, Truck, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { buyerOrderScheduleAPI, buyerOrderAPI } from '../../services/api';

// Mock Data removed

export default function BuyerOrderSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [buyerOrders, setBuyerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const initialForm = {
    schedule_no: '',
    schedule_date: new Date().toISOString().split('T')[0],
    schedule_order: '',
    ibpo_ref_no: '',
    po_date: '',
    party_name: '',
    design_no: '',
    quality_print_name: '',
    order_mtr: 0,
    minimum_mtr: 0,
    maximum_mtr: 0,
    tolerance_pct: 0,
    delivery_starting: '',
    party_completion_date: '',
    company_completion_date: '',
    production_start_date: '',
    schedule_entries: [],
    remarks: '',
    total_scheduled_qty: 0
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchSchedules();
    fetchBuyerOrders();
  }, []);

  const fetchBuyerOrders = async () => {
    setLoadingOrders(true);
    setOrdersError('');
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrders(res.data || []);
    } catch (e) {
      console.error('Failed to fetch buyer orders', e);
      setOrdersError('Failed to load IBPO numbers');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await buyerOrderScheduleAPI.list();
      setSchedules(res.data || []);
    } catch (e) {
      console.error('Failed to fetch schedules', e);
    }
  };

  const calculateTotals = (entries) => {
    return entries.reduce((sum, entry) => sum + (parseFloat(entry.schedule_mtr) || 0), 0);
  };

  const handleOpenForm = (schedule = null, readOnly = false) => {
    if (schedule) {
      setForm(schedule);
      setEditingId(schedule.id);
      if (schedule.production_start_date) {
        setCurrentMonth(new Date(schedule.production_start_date));
      }
    } else {
      const newScheduleNo = `SCH-${new Date().getFullYear()}-${String(schedules.length + 1).padStart(3, '0')}`;
      setForm({ ...initialForm, schedule_no: newScheduleNo });
      setEditingId(null);
      setCurrentMonth(new Date());
    }
    setIsReadOnly(readOnly);
    setShowForm(true);
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    
    let updatedForm = { ...form, [name]: value };

    // Auto-fetch logic when IBPO is selected
    if (name === 'ibpo_ref_no') {
      const matchedOrder = buyerOrders.find(o => o.ibpo_number === value);
      if (matchedOrder) {
        const designNo = matchedOrder.items?.map(i => i.design_no).filter(Boolean).join(', ') || '';
        const quality = matchedOrder.items?.map(i => i.fabric_type).filter(Boolean).join(', ') || '';
        const orderMtr = matchedOrder.items?.reduce((sum, i) => sum + (parseFloat(i.order_mtrs) || 0), 0) || 0;
        const poDate = matchedOrder.items?.[0]?.po_date ? matchedOrder.items[0].po_date.substring(0, 10) : (matchedOrder.order_date ? matchedOrder.order_date.substring(0, 10) : '');

        updatedForm = {
          ...updatedForm,
          party_name: matchedOrder.party_name || '',
          po_date: poDate,
          design_no: designNo,
          quality_print_name: quality,
          order_mtr: orderMtr,
          delivery_starting: matchedOrder.delivery_starting ? matchedOrder.delivery_starting.substring(0, 10) : '',
          party_completion_date: matchedOrder.party_comp_date ? matchedOrder.party_comp_date.substring(0, 10) : '',
          company_completion_date: matchedOrder.exfactory_date ? matchedOrder.exfactory_date.substring(0, 10) : ''
        };
      }
    }

    setForm(updatedForm);
  };

  const addScheduleEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      approval: false,
      schedule_date: '',
      schedule_mtr: 0
    };
    const updatedEntries = [...form.schedule_entries, newEntry];
    setForm({
      ...form,
      schedule_entries: updatedEntries,
      total_scheduled_qty: calculateTotals(updatedEntries)
    });
  };

  const updateScheduleEntry = (id, field, value) => {
    let finalValue = value;
    if (field === 'schedule_mtr') finalValue = parseFloat(value) || 0;

    const updatedEntries = form.schedule_entries.map(entry => 
      entry.id === id ? { ...entry, [field]: finalValue } : entry
    );
    
    setForm({
      ...form,
      schedule_entries: updatedEntries,
      total_scheduled_qty: calculateTotals(updatedEntries)
    });
  };

  const removeScheduleEntry = (id) => {
    const updatedEntries = form.schedule_entries.filter(entry => entry.id !== id);
    setForm({
      ...form,
      schedule_entries: updatedEntries,
      total_scheduled_qty: calculateTotals(updatedEntries)
    });
  };

  const handleSave = async () => {
    if (!form.ibpo_ref_no) {
      alert("Please select an IBPO Reference No.");
      return;
    }
    
    // We remap schedule_entries to entries for the backend payload
    const payload = {
      ...form,
      quality: form.quality_print_name,
      entries: form.schedule_entries.map(e => ({
        approval: e.approval,
        schedule_date: e.schedule_date || null,
        schedule_mtr: e.schedule_mtr || 0
      }))
    };

    try {
      if (editingId) {
        await buyerOrderScheduleAPI.update(editingId, payload);
      } else {
        await buyerOrderScheduleAPI.create(payload);
      }
      await fetchSchedules();
      setShowForm(false);
    } catch (e) {
      console.error('Failed to save schedule', e);
      alert('Failed to save schedule. Please check the form fields.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await buyerOrderScheduleAPI.delete(id);
        await fetchSchedules();
      } catch (e) {
        console.error('Failed to delete schedule', e);
      }
    }
  };

  // --- Calendar Logic ---
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      let isProdStart = form.production_start_date === dateStr;
      let isDelivery = form.delivery_starting === dateStr || form.party_completion_date === dateStr || form.company_completion_date === dateStr;
      let isScheduled = form.schedule_entries.some(e => e.schedule_date === dateStr);
      let scheduledQty = form.schedule_entries.filter(e => e.schedule_date === dateStr).reduce((sum, e) => sum + e.schedule_mtr, 0);

      let classes = "calendar-day";
      if (isProdStart) classes += " prod-start";
      else if (isDelivery) classes += " delivery";
      else if (isScheduled) classes += " scheduled";

      days.push(
        <div key={dateStr} className={classes} title={isScheduled ? `${scheduledQty} MTR Scheduled` : ''}>
          <span className="day-number">{d}</span>
          {isScheduled && <span className="cal-indicator sched">{scheduledQty}</span>}
          {isProdStart && <span className="cal-indicator prod">START</span>}
          {isDelivery && <span className="cal-indicator del">DELIVERY</span>}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button type="button" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600 }}>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button type="button" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
        <div className="calendar-grid">
          <div className="cal-head">Sun</div>
          <div className="cal-head">Mon</div>
          <div className="cal-head">Tue</div>
          <div className="cal-head">Wed</div>
          <div className="cal-head">Thu</div>
          <div className="cal-head">Fri</div>
          <div className="cal-head">Sat</div>
          {days}
        </div>
        <div className="calendar-legend">
          <div className="leg-item"><div className="leg-box prod-start"></div> Production Start</div>
          <div className="leg-item"><div className="leg-box scheduled"></div> Scheduled</div>
          <div className="leg-item"><div className="leg-box delivery"></div> Delivery Date</div>
        </div>

        <style>{`
          .calendar-container {
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            background: #fff;
          }
          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
          }
          .calendar-header button {
            background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px;
          }
          .calendar-header button:hover { background: rgba(0,0,0,0.05); }
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-bottom: 1px solid var(--border);
          }
          .cal-head {
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            padding: 8px 0;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
          }
          .calendar-day {
            aspect-ratio: 1;
            padding: 4px;
            border-right: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .calendar-day:nth-child(7n) { border-right: none; }
          .calendar-day.empty { background: #f9fafb; }
          .day-number {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: auto;
          }
          .cal-indicator {
            font-size: 9px;
            font-weight: 700;
            padding: 2px 4px;
            border-radius: 2px;
            text-align: center;
          }
          .cal-indicator.sched { background: rgba(59,130,246,0.15); color: #2563eb; }
          .cal-indicator.prod { background: rgba(16,185,129,0.15); color: #059669; }
          .cal-indicator.del { background: rgba(245,158,11,0.15); color: #d97706; }
          
          .calendar-day.prod-start { background: rgba(16,185,129,0.05); }
          .calendar-day.scheduled { background: rgba(59,130,246,0.05); }
          .calendar-day.delivery { background: rgba(245,158,11,0.05); }

          .calendar-legend {
            display: flex;
            gap: 16px;
            padding: 12px;
            font-size: 11px;
            color: var(--text-muted);
            background: #fff;
          }
          .leg-item { display: flex; alignItems: center; gap: 6px; }
          .leg-box { width: 12px; height: 12px; border-radius: 2px; }
          .leg-box.prod-start { background: #10b981; }
          .leg-box.scheduled { background: #3b82f6; }
          .leg-box.delivery { background: #f59e0b; }
        `}</style>
      </div>
    );
  };


  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Buyer Order Schedule Report", 14, 15);
    const headers = [["Schedule No", "Order No", "Buyer", "Style", "Prod Start", "Order Mtr", "Scheduled", "Status"]];
    const rows = schedules.map(s => [
      s.schedule_no, s.ibpo_ref_no, s.party_name, s.design_no, 
      s.production_start_date, s.order_mtr, s.total_scheduled_qty, s.current_status
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Buyer_Order_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(schedules);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedules");
    XLSX.writeFile(wb, `Buyer_Order_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredSchedules = schedules.filter(s => 
    (s.schedule_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.ibpo_ref_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.party_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarIcon size={24} color="var(--primary)" /> Buyer Order Schedule
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage buyer order production schedules and planning.</p>
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
              <button className="btn btn-primary" onClick={() => handleOpenForm(null)}>
                <Plus size={16} /> New Schedule
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Total Schedules</h3><div className="value">
                {schedules.length}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Planned</h3><div className="value">
                {schedules.filter(s => s.current_status === 'Planned').length}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><Factory size={24} /></div>
              <div className="stat-details"><h3>In Production</h3><div className="value">
                {schedules.filter(s => s.current_status === 'In Production').length}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Completed</h3><div className="value">
                {schedules.filter(s => s.current_status === 'Completed').length}
              </div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search by Schedule No, IBPO No, Buyer..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><Filter size={16} /><span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span></div>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option>
              </select>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Planned</option>
                <option>In Production</option>
                <option>Completed</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Schedule No</th>
                    <th>Date</th>
                    <th>IBPO No</th>
                    <th>Buyer</th>
                    <th>Style</th>
                    <th>Prod Start</th>
                    <th>Order MTR</th>
                    <th>Scheduled MTR</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length === 0 ? (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No schedules found.</td></tr>
                  ) : filteredSchedules.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.schedule_no}</td>
                      <td>{s.schedule_date}</td>
                      <td style={{ fontWeight: 600 }}>{s.ibpo_ref_no}</td>
                      <td>{s.party_name}</td>
                      <td>{s.design_no}</td>
                      <td>{s.production_start_date}</td>
                      <td>{s.order_mtr}</td>
                      <td>{s.total_scheduled_qty}</td>
                      <td>
                        <span className={`badge ${s.current_status === 'Completed' ? 'badge-active' : 'badge-inactive'}`}>
                          {s.current_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(s, true)} title="View"><Eye size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(s, false)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => setShowForm(false)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {isReadOnly ? 'View Schedule' : editingId ? 'Edit Schedule' : 'New Schedule'}
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 13 }}>
                {form.schedule_no || 'SCH-NEW'}
              </p>
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
              <FileText size={18} /> Schedule Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="animate-fade">
                {/* SECTION 1: SCHEDULE INFORMATION */}
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Schedule Information</h4>
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group">
                    <label>Schedule No</label>
                    <input type="text" className="form-control" name="schedule_no" value={form.schedule_no} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                  </div>
                  <div className="form-group">
                    <label>Schedule Date</label>
                    <input type="date" className="form-control" name="schedule_date" value={form.schedule_date} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Schedule Order</label>
                    <input type="text" className="form-control" name="schedule_order" value={form.schedule_order} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>IBPO Reference No *</label>
                    <select className="form-control" name="ibpo_ref_no" value={form.ibpo_ref_no} onChange={handleChange} required>
                      <option value="">Select IBPO...</option>
                      {loadingOrders && <option disabled>Loading...</option>}
                      {ordersError && <option disabled>{ordersError}</option>}
                      {!loadingOrders && buyerOrders.length === 0 && <option disabled>No Buyer Orders Available.</option>}
                      {buyerOrders.map(o => <option key={o.ibpo_number} value={o.ibpo_number}>{o.ibpo_number} - {o.party_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>PO Date</label>
                    <input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Party Name</label>
                    <input type="text" className="form-control" name="party_name" value={form.party_name} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Design No (SP No)</label>
                    <input type="text" className="form-control" name="design_no" value={form.design_no} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Quality / Print Name</label>
                    <input type="text" className="form-control" name="quality_print_name" value={form.quality_print_name} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Order MTR</label>
                    <input type="number" className="form-control" name="order_mtr" value={form.order_mtr} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Minimum MTR</label>
                    <input type="number" className="form-control" name="minimum_mtr" value={form.minimum_mtr} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Maximum MTR</label>
                    <input type="number" className="form-control" name="maximum_mtr" value={form.maximum_mtr} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Tolerance %</label>
                    <input type="number" className="form-control" name="tolerance_pct" value={form.tolerance_pct} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Delivery Starting</label>
                    <input type="date" className="form-control" name="delivery_starting" value={form.delivery_starting} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Party Completion Date</label>
                    <input type="date" className="form-control" name="party_completion_date" value={form.party_completion_date} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Company Completion Date</label>
                    <input type="date" className="form-control" name="company_completion_date" value={form.company_completion_date} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Production Start Date</label>
                    <input type="date" className="form-control" name="production_start_date" value={form.production_start_date} onChange={handleChange} />
                  </div>
                </div>

                {/* SECTION 2: SCHEDULE ENTRY & CALENDAR */}
                <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Schedule Entry</h4>
                
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                  {/* Left Side: Table & Notes */}
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12 }}>
                        {!isReadOnly && (
                          <button type="button" className="btn btn-secondary" onClick={addScheduleEntry} style={{ padding: '4px 8px', fontSize: 12 }}>
                            <Plus size={14} style={{ marginRight: 4 }} /> Add Row
                          </button>
                        )}
                      </div>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        <table className="data-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 60, textAlign: 'center' }}>S.No</th>
                              <th style={{ width: 80, textAlign: 'center' }}>Approval</th>
                              <th>Schedule Date</th>
                              <th style={{ textAlign: 'right' }}>Schedule MTR</th>
                              {!isReadOnly && <th style={{ width: 80, textAlign: 'center' }}>Action</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {form.schedule_entries.length === 0 ? (
                              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No schedule entries added.</td></tr>
                            ) : (
                              form.schedule_entries.map((entry, index) => (
                                <tr key={entry.id}>
                                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <input type="checkbox" checked={entry.approval} onChange={(e) => updateScheduleEntry(entry.id, 'approval', e.target.checked)} style={{ cursor: 'pointer' }} />
                                  </td>
                                  <td>
                                    <input type="date" className="form-control" value={entry.schedule_date} onChange={(e) => updateScheduleEntry(entry.id, 'schedule_date', e.target.value)} style={{ margin: 0 }} />
                                  </td>
                                  <td>
                                    <input type="number" className="form-control" value={entry.schedule_mtr} onChange={(e) => updateScheduleEntry(entry.id, 'schedule_mtr', e.target.value)} style={{ margin: 0, textAlign: 'right' }} />
                                  </td>
                                  {!isReadOnly && (
                                    <td style={{ textAlign: 'center' }}>
                                      <button type="button" onClick={() => removeScheduleEntry(entry.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 600 }}>Schedule Total:</div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {form.total_scheduled_qty} MTR
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: 'var(--primary)', margin: '8px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Remarks / Notes</h4>
                      <textarea 
                        className="form-control" 
                        name="remarks" 
                        value={form.remarks} 
                        onChange={handleChange} 
                        rows={4}
                        placeholder="Enter scheduling remarks, production notes, or delivery instructions..."
                      />
                    </div>
                  </div>

                  {/* Right Side: Calendar */}
                  <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Production Calendar</h4>
                      {renderCalendar()}
                    </div>
                  </div>
                </div>

              </div>
            </fieldset>

            {/* Bottom action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              {!isReadOnly && (
                <>
                  <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={16} /> Save
                  </button>
                  {editingId && (
                    <button className="btn btn-secondary" onClick={() => handleDelete(editingId)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444' }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Close
                  </button>
                </>
              )}
              {isReadOnly && (
                <>
                  <button className="btn btn-primary" onClick={() => setShowForm(false)}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
