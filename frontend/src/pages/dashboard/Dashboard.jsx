import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingCart, Package, Receipt, ClipboardList, MapPin,
  TrendingUp, Activity, Filter, Clock, Layers, Scissors, Box, 
  CheckSquare, Factory, ChevronRight, BarChart3, HelpCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line
} from 'recharts';
import { dashboardAPI } from '../../services/api';

// Textile Specific Mock Data
const dailyProductionData = [
  { name: 'Mon', meters: 2400 },
  { name: 'Tue', meters: 3200 },
  { name: 'Wed', meters: 2800 },
  { name: 'Thu', meters: 3600 },
  { name: 'Fri', meters: 4100 },
  { name: 'Sat', meters: 3900 },
  { name: 'Sun', meters: 1200 },
];

const prodVsDispatchData = [
  { month: 'Jan', Production: 40000, Dispatch: 32000 },
  { month: 'Feb', Production: 45000, Dispatch: 38000 },
  { month: 'Mar', Production: 52000, Dispatch: 46000 },
  { month: 'Apr', Production: 48000, Dispatch: 42000 },
  { month: 'May', Production: 61000, Dispatch: 55000 },
  { month: 'Jun', Production: 58000, Dispatch: 57000 },
];

const bottleneckData = [
  { process: 'Warping', pending: 15 },
  { process: 'Weaving', pending: 28 },
  { process: 'Dyeing', pending: 42 },
  { process: 'Checking', pending: 19 },
  { process: 'Packing', pending: 8 },
];

const fabricDistributionData = [
  { name: 'Cotton Yarn', value: 40, color: '#10b981' },
  { name: 'Polyester Blend', value: 30, color: '#f59e0b' },
  { name: 'Linen Weave', value: 15, color: '#3b82f6' },
  { name: 'Viscose Fabric', value: 15, color: '#8b5cf6' },
];

const buyerQtyData = [
  { name: 'SK Textiles', qty: 45000 },
  { name: 'Mani Spinners', qty: 32000 },
  { name: 'Global Exim', qty: 28000 },
  { name: 'A1 Garments', qty: 22000 },
  { name: 'Raju Traders', qty: 15000 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Filters State
  const [dateFilter, setDateFilter] = useState('This Month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    dashboardAPI.stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Panel A: Daily Operations Panel
  const dailyOperations = [
    { label: 'Vendor Inward', value: '14 Rolls', path: '/cloth/inward', color: '#10b981', icon: Factory },
    { label: 'Purchase Inward', value: '2,450 Kgs', path: '/yarn/inward', color: '#22c55e', icon: Layers },
    { label: 'Process Delivery', value: '8 Batches', path: '/yarn/grey-delivery', color: '#64748b', icon: Clock },
    { label: 'Process Inward', value: '12 Bags', path: '/dyed-yarn/received', color: '#ec4899', icon: Layers },
    { label: 'QC Pending', value: '5 Lots', path: '/cloth/checking', color: '#eab308', icon: CheckSquare },
    { label: 'Packing Done', value: '38 Bales', path: '/packing', color: '#f97316', icon: Box },
    { label: 'Dispatch Done', value: '4 Shipments', path: '/despatch', color: '#ef4444', icon: MapPin },
    { label: 'Invoice Generated', value: '9 Invoices', path: '/sales-invoice', color: '#3b82f6', icon: Receipt },
  ];



  const renderMetricGrid = (title, items, isDark = false) => (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              background: 'var(--bg-primary)',
              border: `1.5px solid ${item.color}25`,
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              const chevron = e.currentTarget.querySelector('.chevron-indicator');
              if (chevron) chevron.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = `${item.color}25`;
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              const chevron = e.currentTarget.querySelector('.chevron-indicator');
              if (chevron) chevron.style.transform = 'none';
            }}
          >
            {/* Top Row: Icon and Label */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                {item.label}
              </span>
              {item.icon && (
                <div style={{ color: item.color, background: `${item.color}12`, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <item.icon size={16} />
                </div>
              )}
            </div>

            {/* Bottom Row: Value and Chevron */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span style={{ fontSize: 20, fontWeight: 750, color: 'var(--text-primary)' }}>
                {item.value}
              </span>
              <ChevronRight className="chevron-indicator" size={16} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Welcome back! Here is a live overview of factory metrics and textile operations.</p>
        </div>
        
        {/* Date Filters Panel */}
        <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'row', width: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={15} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Date Range:</span>
          </div>
          
          <div style={{ display: 'flex', gap: 4 }}>
            {['Today', 'Weekly', 'Monthly', 'Custom Date'].map((filterOpt) => (
              <button 
                key={filterOpt}
                onClick={() => setDateFilter(filterOpt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: dateFilter === filterOpt ? 'var(--primary)' : 'transparent',
                  color: dateFilter === filterOpt ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {filterOpt}
              </button>
            ))}
          </div>

          {dateFilter === 'Custom Date' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              <input type="date" className="form-control" style={{ width: 125, padding: '6px', fontSize: 12 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>to</span>
              <input type="date" className="form-control" style={{ width: 125, padding: '6px', fontSize: 12 }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Panels Grid */}
      {renderMetricGrid('A. Daily Operations Panel', dailyOperations)}

      {/* Textile-Specific Charts Section */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
        F. Textile-Specific Analytics
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Production vs Dispatch Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Production vs Dispatch</h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Comparison of total produced fabric vs dispatched volumes (Meters)</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={prodVsDispatchData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Production" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Dispatch" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Process Pending Bottlenecks Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Process Pending (Bottlenecks)</h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Number of lots/orders currently queued per process step</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottleneckData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="process" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {bottleneckData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pending > 30 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fabric Type Distribution Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Fabric Type Distribution</h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distribution percentage of current fabric production types</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fabricDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {fabricDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Meter Production Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Daily Meter Production</h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Meters of fabric produced per day over the last week</span>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyProductionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMeters" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
                <Area type="monotone" dataKey="meters" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMeters)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Buyer-wise Qty Chart */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Buyer-wise Quantity</h4>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total quantity ordered per buyer (Meters)</span>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buyerQtyData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-primary)', fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} cursor={{fill: 'var(--bg-hover)'}}/>
              <Bar dataKey="qty" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
