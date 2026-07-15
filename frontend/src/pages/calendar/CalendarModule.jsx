import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, ChevronLeft, ChevronRight, Download, RefreshCw, Plus, 
  Search, Filter, X, Clock, MapPin, Users, Activity, ShoppingCart, 
  Box, Truck, Shield, Wrench, CreditCard, Eye
} from 'lucide-react';
import { 
  buyerOrderAPI, despatchAPI, ppcAPI, partyAPI, genericPurchaseOrderAPI, calendarEventAPI,
  yarnPurchaseOrderAPI, salesInvoiceAPI, employeeAPI, designEntryAPI
} from '../../services/api';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarModule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [events, setEvents] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState({ title: '', event_type: 'Meeting', event_date: '', event_time: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const fetchedEvents = [];

        // 1. Fetch Buyer Orders
        try {
          const boRes = await buyerOrderAPI.list();
          const orders = boRes.data?.data || boRes.data || [];
          if (Array.isArray(orders)) {
            orders.forEach(order => {
              const dateStr = order.created_at || order.order_date;
              if (dateStr) {
                const d = new Date(dateStr);
                // Only include if it matches the current month/year being viewed
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `bo-${order.id || order.order_no}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'Buyer Order Created',
                    category: 'Buyer Orders',
                    color: '#3b82f6', bg: '#eff6ff',
                    details: {
                      'Order No': order.order_no || 'N/A',
                      'Buyer': order.buyer_name || 'N/A',
                      'Quantity': order.total_quantity || 'N/A',
                      'Status': order.status || 'Active'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch Buyer Orders for Calendar:', e);
        }

        // 2. Fetch Despatch Planning
        try {
          const dpRes = await despatchAPI.list();
          const despatches = dpRes.data?.data || dpRes.data || [];
          if (Array.isArray(despatches)) {
            despatches.forEach(dp => {
              const dateStr = dp.despatch_date || dp.created_at;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `dp-${dp.id || dp.despatch_no}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'Dispatch Scheduled',
                    category: 'Dispatch',
                    color: '#f97316', bg: '#fff7ed',
                    details: {
                      'Dispatch No': dp.despatch_no || 'N/A',
                      'Destination': dp.destination || 'N/A',
                      'Vehicle': dp.vehicle_no || 'N/A',
                      'Status': dp.status || 'Pending'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch Despatches for Calendar:', e);
        }

        // 3. Fetch Party Master
        try {
          const partyRes = await partyAPI.list();
          const parties = partyRes.data?.data || partyRes.data || [];
          if (Array.isArray(parties)) {
            parties.forEach(party => {
              const dateStr = party.created_at;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `party-${party.id}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'Party Registration',
                    category: 'Critical Tasks',
                    color: '#ef4444', bg: '#fef2f2',
                    details: {
                      'Company': party.company_name || 'N/A',
                      'Type': party.party_type || 'N/A',
                      'City': party.city || 'N/A',
                      'Status': party.status || 'Active'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch Parties for Calendar:', e);
        }

        // 4. Fetch Production (PPC Looms as example)
        try {
          const ppcRes = await ppcAPI.getLooms();
          const looms = ppcRes.data?.data || ppcRes.data || [];
          if (Array.isArray(looms)) {
            looms.forEach(loom => {
              const dateStr = loom.created_at;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `loom-${loom.id}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'Production Loom Setup',
                    category: 'Production',
                    color: '#10b981', bg: '#ecfdf5',
                    details: {
                      'Loom No': loom.loom_no || 'N/A',
                      'Make': loom.make || 'N/A',
                      'Status': loom.status || 'Active'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch PPC Looms for Calendar:', e);
        }

        // 5. Fetch Generic Calendar Events
        try {
          const genRes = await calendarEventAPI.list();
          const genericEvents = genRes.data || [];
          if (Array.isArray(genericEvents)) {
            genericEvents.forEach(evt => {
              const dateStr = evt.event_date;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  
                  let catColor = '#8b5cf6'; // default purple
                  let catBg = '#ede9fe';
                  if (evt.event_type === 'Holiday') { catColor = '#10b981'; catBg = '#ecfdf5'; }
                  else if (evt.event_type === 'Reminder') { catColor = '#eab308'; catBg = '#fef9c3'; }
                  
                  fetchedEvents.push({
                    id: `gen-${evt.id}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: evt.event_time || '00:00',
                    timestamp: d.getTime(),
                    type: evt.title,
                    category: evt.event_type || 'General',
                    color: catColor, bg: catBg,
                    details: {
                      'Description': evt.description || 'N/A',
                      'Created By': evt.created_by || 'System'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch generic Calendar Events:', e);
        }

        // 6. Fetch Purchases
        try {
          const poRes = await yarnPurchaseOrderAPI.list();
          const pos = poRes.data?.data || poRes.data || [];
          if (Array.isArray(pos)) {
            pos.forEach(po => {
              const dateStr = po.po_date || po.created_at;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `po-${po.id || po.po_number}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'Purchase Order',
                    category: 'Purchases',
                    color: '#eab308', bg: '#fef9c3', // Yellow
                    details: {
                      'PO No': po.po_number || 'N/A',
                      'Vendor': po.vendor_name || 'N/A',
                      'Status': po.status || 'Active'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch POs for Calendar:', e);
        }

        // 7. Fetch Sales
        try {
          const salesRes = await salesInvoiceAPI.list();
          const sales = salesRes.data?.data || salesRes.data || [];
          if (Array.isArray(sales)) {
            sales.forEach(sale => {
              const dateStr = sale.invoice_date || sale.created_at;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `sale-${sale.id || sale.invoice_no}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'Sales Invoice',
                    category: 'Sales',
                    color: '#14b8a6', bg: '#ccfbf1', // Teal
                    details: {
                      'Invoice No': sale.invoice_no || 'N/A',
                      'Customer': sale.customer_name || 'N/A',
                      'Amount': sale.total_amount || 'N/A'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch Sales for Calendar:', e);
        }

        // 8. Fetch HR (Employees)
        try {
          const empRes = await employeeAPI.list();
          const emps = empRes.data?.data || empRes.data || [];
          if (Array.isArray(emps)) {
            emps.forEach(emp => {
              const dateStr = emp.date_of_joining || emp.created_at;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `emp-${emp.id}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'New Hire / Joining',
                    category: 'HR',
                    color: '#ec4899', bg: '#fce7f3', // Pink
                    details: {
                      'Name': emp.employee_name || 'N/A',
                      'Department': emp.department || 'N/A',
                      'Designation': emp.designation || 'N/A'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch Employees for Calendar:', e);
        }

        // 9. Fetch Design Entries
        try {
          const desRes = await designEntryAPI.list();
          const designs = desRes.data?.data || desRes.data || [];
          if (Array.isArray(designs)) {
            designs.forEach(des => {
              const dateStr = des.created_at;
              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
                  fetchedEvents.push({
                    id: `des-${des.id || des.design_no}`,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: d.getTime(),
                    type: 'Design Created',
                    category: 'Design',
                    color: '#6366f1', bg: '#e0e7ff', // Indigo
                    details: {
                      'Design No': des.design_no || 'N/A',
                      'Quality': des.quality || 'N/A',
                      'Status': des.status || 'Active'
                    }
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn('Could not fetch Designs for Calendar:', e);
        }

        // Set the fetched real-time events, sorted by time
        setEvents(fetchedEvents.sort((a, b) => a.timestamp - b.timestamp));
      } catch (err) {
        console.error('Error fetching live calendar data:', err);
        setEvents([]);
      }
    };

    fetchLiveEvents();
  }, [currentDate.getFullYear(), currentDate.getMonth(), refreshTrigger]);

  // KPI Calculations
  const filteredEventsList = useMemo(() => {
    let result = events;

    if (selectedFilters.length > 0) {
      result = result.filter(e => selectedFilters.includes(e.category));
    }

    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(e => 
        (e.type && e.type.toLowerCase().includes(lowerQ)) ||
        (e.category && e.category.toLowerCase().includes(lowerQ)) ||
        (e.details && Object.values(e.details).some(v => String(v).toLowerCase().includes(lowerQ)))
      );
    }
    return result;
  }, [events, searchQuery, selectedFilters]);

  const kpis = useMemo(() => {
    return {
      total: filteredEventsList.length,
      buyerOrders: filteredEventsList.filter(e => e.category === 'Buyer Orders').length,
      production: filteredEventsList.filter(e => e.category === 'Production').length,
      dispatch: filteredEventsList.filter(e => e.category === 'Dispatch').length,
      purchases: filteredEventsList.filter(e => e.category === 'Purchases').length,
      sales: filteredEventsList.filter(e => e.category === 'Sales').length,
    };
  }, [filteredEventsList]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setDrawerOpen(true);
  };

  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleViewFullRecord = () => {
    if (!selectedEvent) return;
    setModalOpen(false);
    switch (selectedEvent.category) {
      case 'Buyer Orders': navigate('/buyer-order'); break;
      case 'Dispatch': navigate('/despatch-planning'); break;
      case 'Production': navigate('/ppc/tracking/live-dashboard'); break;
      case 'Purchases': navigate('/yarn/purchase-order'); break;
      case 'Sales': navigate('/sales-invoice'); break;
      case 'HR': navigate('/employee-master'); break;
      case 'Design': navigate('/design-entry'); break;
      case 'Critical Tasks': navigate('/party-master'); break;
      default: alert(`No specific full record page for ${selectedEvent.category}`); break;
    }
  };

  // Calendar Grid Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Week Grid Logic
  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    const sunday = new Date(d.setDate(diff));
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i));
    }
    return week;
  };
  const weekDays = getWeekDays(currentDate);

  // Helper to group events by category for a specific day
  const getEventsForDay = (day) => {
    return filteredEventsList.filter(e => e.date.getDate() === day);
  };

  const getEventSummaryForDay = (dayEvents) => {
    const summary = {};
    dayEvents.forEach(e => {
      if (!summary[e.category]) {
        summary[e.category] = { count: 0, color: e.color, bg: e.bg };
      }
      summary[e.category].count += 1;
    });
    return Object.entries(summary);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Calendar
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Dashboard</span>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Calendar</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => {
            const csvContent = "data:text/csv;charset=utf-8,Type,Category,Date,Time\n" 
              + events.map(e => `${e.type},${e.category},${e.date.toLocaleDateString()},${e.time}`).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `calendar_events_${MONTHS[currentDate.getMonth()]}_${currentDate.getFullYear()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-secondary" onClick={() => {
            setEvents([]); // Clear to show visual refresh
            setTimeout(() => setRefreshTrigger(prev => prev + 1), 100);
          }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => {
            setNewEventData({ title: '', event_type: 'Meeting', event_date: currentDate.toISOString().split('T')[0], event_time: '10:00', description: '' });
            setAddEventModalOpen(true);
          }}>
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <KPICard title="Total Events" value={kpis.total} icon={Activity} color="#3b82f6" />
        <KPICard title="Buyer Orders" value={kpis.buyerOrders} icon={ShoppingCart} color="#8b5cf6" />
        <KPICard title="Production" value={kpis.production} icon={Box} color="#10b981" />
        <KPICard title="Dispatch" value={kpis.dispatch} icon={Truck} color="#f97316" />
        <KPICard title="Purchases" value={kpis.purchases} icon={ShoppingCart} color="#eab308" />
        <KPICard title="Sales" value={kpis.sales} icon={Activity} color="#14b8a6" />
      </div>

      {/* Calendar Toolbar */}
      <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={handleToday}>Today</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={handlePrevMonth}>
              <ChevronLeft size={20} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, minWidth: '160px', textAlign: 'center' }}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={handleNextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                padding: '8px 16px 8px 36px', 
                border: '1px solid var(--border)', 
                borderRadius: '8px',
                fontSize: '13px',
                width: '200px'
              }} 
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={() => setFilterMenuOpen(!filterMenuOpen)}>
              <Filter size={16} /> Filters
              {selectedFilters.length > 0 && (
                <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '4px' }}>
                  {selectedFilters.length}
                </span>
              )}
            </button>
            {filterMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', zIndex: 100, width: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '300px', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Filter by Category</h4>
                {['Buyer Orders', 'Dispatch', 'Production', 'Purchases', 'Sales', 'HR', 'Design', 'Critical Tasks', 'General'].map(cat => (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedFilters.includes(cat)} 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedFilters([...selectedFilters, cat]);
                        else setSelectedFilters(selectedFilters.filter(c => c !== cat));
                      }} 
                    />
                    {cat}
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '4px' }}>
            <button 
              style={viewBtnStyle(view === 'month')} 
              onClick={() => setView('month')}
            >Month</button>
            <button 
              style={viewBtnStyle(view === 'week')} 
              onClick={() => setView('week')}
            >Week</button>
            <button 
              style={viewBtnStyle(view === 'day')} 
              onClick={() => setView('day')}
            >Day</button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {view === 'month' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              {DAYS_OF_WEEK.map(day => (
                <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  {day}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>
              {blanks.map(blank => (
                <div key={`blank-${blank}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', opacity: 0.5 }}></div>
              ))}
              
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const summary = getEventSummaryForDay(dayEvents);
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

                return (
                  <div 
                    key={day} 
                    onClick={() => handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    style={{ 
                      borderRight: '1px solid var(--border)', 
                      borderBottom: '1px solid var(--border)',
                      padding: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      background: isToday ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      ':hover': { background: 'var(--bg-secondary)' }
                    }}
                    className="calendar-cell"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: isToday ? '800' : '600',
                        color: isToday ? 'var(--primary)' : 'var(--text-primary)',
                        background: isToday ? 'var(--primary-light)' : 'transparent',
                        width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%'
                      }}>
                        {day}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {summary.slice(0, 4).map(([category, info]) => (
                        <div 
                          key={category}
                          className="event-badge"
                          style={{
                            fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
                            background: info.bg, color: info.color, border: `1px solid ${info.color}40`,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600'
                          }}
                        >
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: info.color, flexShrink: 0 }}></div>
                          {category} ({info.count})
                        </div>
                      ))}
                      {summary.length > 4 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', paddingLeft: '4px' }}>
                          + {summary.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'week' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              {weekDays.map(date => {
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <div key={date.toISOString()} style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: isToday ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {DAYS_OF_WEEK[date.getDay()]} ({date.getDate()})
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '500px' }}>
              {weekDays.map(date => {
                const dayEvents = filteredEventsList.filter(e => e.date.toDateString() === date.toDateString());
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <div key={date.toISOString()} style={{ borderRight: '1px solid var(--border)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: isToday ? 'rgba(59, 130, 246, 0.02)' : 'transparent' }}>
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        onClick={(e) => handleEventClick(evt, e)}
                        style={{ background: evt.bg, color: evt.color, border: `1px solid ${evt.color}40`, padding: '8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
                      >
                        <div style={{ fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.type}</span>
                          <span style={{ fontSize: '10px', opacity: 0.8, flexShrink: 0 }}>{evt.time}</span>
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>{evt.category}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '500px', padding: '24px' }}>
             <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
               {DAYS_OF_WEEK[currentDate.getDay()]}, {MONTHS[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {filteredEventsList.filter(e => e.date.toDateString() === currentDate.toDateString()).map(evt => (
                  <div 
                    key={evt.id} 
                    onClick={(e) => handleEventClick(evt, e)}
                    className="card"
                    style={{ background: evt.bg, color: evt.color, border: `1px solid ${evt.color}40`, padding: '16px', display: 'flex', gap: '16px', cursor: 'pointer', alignItems: 'flex-start' }}
                  >
                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: '800', fontSize: '14px', flexShrink: 0, border: `1px solid ${evt.color}20` }}>
                      {evt.time}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: '800' }}>{evt.type}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>{evt.category}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                        {Object.entries(evt.details).slice(0, 3).map(([k, v]) => (
                          <div key={k} style={{ fontSize: '12px' }}>
                            <span style={{ opacity: 0.7 }}>{k}:</span> <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
               ))}
               {filteredEventsList.filter(e => e.date.toDateString() === currentDate.toDateString()).length === 0 && (
                 <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '24px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                   No events scheduled for this day.
                 </div>
               )}
             </div>
          </div>
        )}

      </div>

      {/* Date Drawer Timeline */}
      {drawerOpen && selectedDate && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998, animation: 'fadeIn 0.2s' }} 
            onClick={() => setDrawerOpen(false)}
          ></div>
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              right: 0, 
              bottom: 0, 
              width: '450px', 
              background: 'var(--bg-primary)', 
              zIndex: 999,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>
                  {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Timeline of Activities</span>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {getEventsForDay(selectedDate.getDate()).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
                  <p>No activities recorded for this date.</p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {/* Vertical Timeline Line */}
                  <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }}></div>
                  
                  {getEventsForDay(selectedDate.getDate()).map((evt, idx) => (
                    <div 
                      key={evt.id} 
                      style={{ 
                        position: 'relative', 
                        paddingLeft: '32px', 
                        marginBottom: '24px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleEventClick(evt)}
                    >
                      <div style={{ 
                        position: 'absolute', 
                        left: '6px', 
                        top: '4px', 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: evt.color,
                        boxShadow: `0 0 0 4px ${evt.bg}`,
                        zIndex: 2
                      }}></div>
                      
                      <div className="card" style={{ padding: '16px', background: 'var(--bg-primary)', transition: 'transform 0.2s, box-shadow 0.2s', ':hover': { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-md)' }}}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} /> {evt.time}
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: evt.color, margin: '0 0 12px 0' }}>
                          {evt.type}
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(evt.details).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{key}:</span>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Event Detail Modal */}
      {modalOpen && selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
          <div className="card" style={{ width: '500px', maxWidth: '90vw', padding: 0, overflow: 'hidden', animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '20px 24px', background: selectedEvent.bg, borderBottom: `1px solid ${selectedEvent.color}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: selectedEvent.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: selectedEvent.color }}>{selectedEvent.type}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedEvent.date.toDateString()} at {selectedEvent.time}</span>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {Object.entries(selectedEvent.details).map(([key, val]) => (
                  <div key={key} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: '700' }}>
                      {key}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Close</button>
                <button className="btn btn-primary" onClick={handleViewFullRecord} style={{ background: selectedEvent.color, borderColor: selectedEvent.color }}>View Full Record</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {addEventModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
          <div className="card" style={{ width: '400px', maxWidth: '90vw', padding: '24px', animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0' }}>Add Calendar Event</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Event Title *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newEventData.title}
                  onChange={e => setNewEventData({...newEventData, title: e.target.value})}
                  placeholder="e.g. Board Meeting"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Event Type</label>
                <select 
                  className="input-field" 
                  value={newEventData.event_type}
                  onChange={e => setNewEventData({...newEventData, event_type: e.target.value})}
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Date *</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={newEventData.event_date}
                    onChange={e => setNewEventData({...newEventData, event_date: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Time</label>
                  <input 
                    type="time" 
                    className="input-field" 
                    value={newEventData.event_time}
                    onChange={e => setNewEventData({...newEventData, event_time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Description</label>
                <textarea 
                  className="input-field" 
                  rows="3"
                  value={newEventData.description}
                  onChange={e => setNewEventData({...newEventData, description: e.target.value})}
                  placeholder="Optional details..."
                ></textarea>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setAddEventModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => {
                if (!newEventData.title || !newEventData.event_date) {
                  alert('Title and Date are required!');
                  return;
                }
                try {
                  await calendarEventAPI.create(newEventData);
                  setAddEventModalOpen(false);
                  setRefreshTrigger(prev => prev + 1); // Refresh calendar
                } catch (e) {
                  alert('Failed to save event. ' + e.message);
                }
              }}>Save Event</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponents
function KPICard({ title, value, icon: Icon, color }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${color}` }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function viewBtnStyle(isActive) {
  return {
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: '600',
    background: isActive ? 'var(--bg-primary)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '6px',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
}
