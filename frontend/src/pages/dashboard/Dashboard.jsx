import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingCart, Package, Receipt, ClipboardList, MapPin,
  TrendingUp, ArrowUpRight, Activity, Filter, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { dashboardAPI } from '../../services/api';

// Mock data
const revenueData = [
  { name: 'Jan', revenue: 4000, orders: 24 }, { name: 'Feb', revenue: 3000, orders: 18 },
  { name: 'Mar', revenue: 5000, orders: 29 }, { name: 'Apr', revenue: 4500, orders: 26 },
  { name: 'May', revenue: 6000, orders: 35 }, { name: 'Jun', revenue: 5500, orders: 31 },
];

const moduleDistribution = [
  { name: 'Yarn', value: 35, color: '#f59e0b' },
  { name: 'Cloth', value: 45, color: '#10b981' },
  { name: 'Processing', value: 20, color: '#6366f1' },
];

const topPartiesData = [
  { name: 'SK Textiles', value: 120000 },
  { name: 'Mani Spinners', value: 85000 },
  { name: 'Global Exim', value: 65000 },
  { name: 'A1 Garments', value: 45000 },
];

const moduleCards = [
  { title: 'Party Master', path: '/party-master', color: '#6366f1', icon: '👥' },
  { title: 'Buyer Orders', path: '/buyer-order', color: '#06b6d4', icon: '📋' },
  { title: 'Yarn PO', path: '/yarn/purchase-order', color: '#f59e0b', icon: '🧶' },
  { title: 'Cloth Inward', path: '/cloth/inward', color: '#10b981', icon: '🧵' },
  { title: 'Packing', path: '/packing', color: '#f97316', icon: '📦' },
  { title: 'Sales Invoice', path: '/sales-invoice', color: '#3b82f6', icon: '🧾' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const statCards = [
    { label: 'Total Parties', value: stats.total_parties ?? 0, icon: Users, cls: 'purple', color: '#6366f1' },
    { label: 'Buyer Orders', value: stats.total_buyer_orders ?? 0, icon: ShoppingCart, cls: 'cyan', color: '#06b6d4' },
    { label: 'Purchase Orders', value: stats.total_purchase_orders ?? 0, icon: Package, cls: 'amber', color: '#f59e0b' },
    { label: 'Sales Invoices', value: stats.total_invoices ?? 0, icon: Receipt, cls: 'emerald', color: '#10b981' },
  ];

  return (
    <div className="animate-fade">
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Welcome back! Here's what's happening in your factory.</p>
        </div>
        
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row', width: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>
          
          <select className="form-control" style={{ width: 140, padding: '8px 12px' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
            <option>Custom Range</option>
          </select>

          {dateFilter === 'Custom Range' && (
            <>
              <input type="date" className="form-control" style={{ width: 130, padding: '8px' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input type="date" className="form-control" style={{ width: 130, padding: '8px' }} value={toDate} onChange={e => setToDate(e.target.value)} />
            </>
          )}

          <button className="btn btn-primary" style={{ padding: '8px 16px' }}>Apply</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {statCards.map((s) => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className={`stat-icon ${s.cls}`}>
              <s.icon size={24} />
            </div>
            <div className="stat-info">
              <h3>{loading ? '—' : s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Revenue Trend Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} style={{ color: 'var(--primary)' }} />
              Revenue Trends
            </h3>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Parties Bar Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--success)' }} />
              Top Parties by Volume
            </h3>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPartiesData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-primary)', fontWeight: 500 }} />
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }} cursor={{fill: 'var(--bg-hover)'}}/>
                <Bar dataKey="value" fill="var(--success)" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 28 }}>
        {/* Distribution Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} style={{ color: 'var(--secondary)' }} />
              Product Distribution
            </h3>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={moduleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {moduleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Access Modules */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Access Modules</h3>
          </div>
          <div className="module-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {moduleCards.map((mod) => (
              <div key={mod.title} className="module-card" onClick={() => navigate(mod.path)} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${mod.color}15`, color: mod.color, fontSize: 16 }}>
                    {mod.icon}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 13 }}>{mod.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
