import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle,
  Package, Receipt, ArrowUpRight, ArrowDownRight, RefreshCw, FileText,
  BookOpen, Scale, Activity,
} from 'lucide-react';
import { reports, vouchers as vouchersApi } from '../api';
import useCompanyStore from '../store/companyStore';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);
const fmtK = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${fmt(n)}`;

const today   = new Date().toISOString().split('T')[0];
const fyStart = `${new Date().getFullYear()}-04-01`;

const VOUCHER_ACTIONS = [
  { label: 'Payment',  type: 'Payment',  color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'Receipt',  type: 'Receipt',  color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'Sales',    type: 'Sales',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Purchase', type: 'Purchase', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Journal',  type: 'Journal',  color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  { label: 'Contra',   type: 'Contra',   color: '#14b8a6', bg: '#f0fdfa', border: '#99f6e4' },
];

function KpiCard({ title, value, subtitle, icon: Icon, trend, color, onClick }) {
  return (
    <button onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-left w-full hover:shadow-md hover:border-slate-300 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg`} style={{ background: color + '18' }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </button>
  );
}

export default function Dashboard() {
  const { activeCompany, activeFy } = useCompanyStore();
  const navigate = useNavigate();
  const companyId = activeCompany?.id;
  const from = activeFy?.start_date || fyStart;

  const params = { company_id: companyId, from_date: from, to_date: today };

  const { data: pl }         = useQuery({ queryKey: ['dash-pl', companyId, from, today], queryFn: () => reports.profitLoss({ ...params }), enabled: !!companyId });
  const { data: bs }         = useQuery({ queryKey: ['dash-bs', companyId], queryFn: () => reports.balanceSheet({ company_id: companyId, as_of: today }), enabled: !!companyId });
  const { data: outstanding }= useQuery({ queryKey: ['dash-out', companyId], queryFn: () => reports.outstanding({ company_id: companyId, as_of: today }), enabled: !!companyId });
  const { data: cashBook }   = useQuery({ queryKey: ['dash-cash', companyId, from, today], queryFn: () => reports.cashBook({ ...params }), enabled: !!companyId });
  const { data: recent }     = useQuery({ queryKey: ['dash-recent', companyId], queryFn: () => vouchersApi.list({ company_id: companyId, limit: 8 }), enabled: !!companyId });
  const { data: salesReg }   = useQuery({ queryKey: ['dash-sales', companyId, from, today], queryFn: () => reports.salesRegister({ ...params }), enabled: !!companyId });

  const monthlyData = useMemo(() => {
    if (!salesReg?.rows) return [];
    const map = {};
    salesReg.rows.forEach(r => {
      const m = r.date?.slice(0, 7);
      if (m) map[m] = (map[m] || 0) + (r.total || 0);
    });
    return Object.entries(map).sort().slice(-6).map(([m, v]) => ({
      month: new Date(m + '-01').toLocaleString('en-IN', { month: 'short' }),
      Sales: Math.round(v),
    }));
  }, [salesReg]);

  const plPieData = pl ? [
    { name: 'Income',   value: pl.income?.total || 0 },
    { name: 'Expenses', value: pl.expenses?.total || 0 },
  ] : [];

  if (!activeCompany) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-5xl">📊</div>
        <h2 className="text-xl font-bold text-slate-700">No Company Selected</h2>
        <p className="text-slate-400 text-sm">Please create or select a company to get started.</p>
        <button onClick={() => navigate('/cubebook/company/create')}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors">
          Create Company
        </button>
      </div>
    );
  }

const renderMetricGrid = (items) => (
    <div style={{ marginBottom: 28 }}>
      <div className="stats-grid">
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={item.onClick}
            className="card stat-card"
            style={{ 
              cursor: 'pointer',
              '--stat-color': item.color 
            }}
          >
            <div className="stat-icon" style={{ color: item.color, background: `${item.color}15` }}>
              <item.icon size={24} strokeWidth={2} />
            </div>
            
            <div className="stat-info">
              <p>{item.title}</p>
              <h3>{item.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children }) => (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{title}</h4>
        {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>{subtitle}</span>}
      </div>
      <div style={{ flex: 1, minHeight: 220 }}>
        {children}
      </div>
    </div>
  );

  const kpiItems = [
    { title: "Net Profit / Loss", value: pl ? `${pl.is_profit ? '' : '-'}₹${fmt(Math.abs(pl.net_profit))}` : '—', icon: pl?.is_profit ? TrendingUp : TrendingDown, color: pl?.is_profit ? '#22c55e' : '#ef4444', onClick: () => navigate('/reports/profit-loss') },
    { title: "Total Assets", value: bs ? `₹${fmt(bs.assets?.total)}` : '—', icon: Scale, color: '#6366f1', onClick: () => navigate('/reports/balance-sheet') },
    { title: "Receivables", value: outstanding ? `₹${fmt(outstanding.total_receivable)}` : '—', icon: ArrowUpRight, color: '#3b82f6', onClick: () => navigate('/reports/outstanding') },
    { title: "Payables", value: outstanding ? `₹${fmt(outstanding.total_payable)}` : '—', icon: AlertTriangle, color: '#f59e0b', onClick: () => navigate('/reports/outstanding') },
    { title: "Cash Balance", value: cashBook ? `₹${fmt(cashBook.closing_balance)}` : '—', icon: DollarSign, color: '#14b8a6', onClick: () => navigate('/reports/cash-book') },
    { title: "Total Income", value: pl ? `₹${fmt(pl.income?.total)}` : '—', icon: TrendingUp, color: '#22c55e', onClick: () => navigate('/reports/profit-loss') },
    { title: "Total Expenses", value: pl ? `₹${fmt(pl.expenses?.total)}` : '—', icon: TrendingDown, color: '#ef4444', onClick: () => navigate('/reports/profit-loss') },
    { title: "Total Liabilities", value: bs ? `₹${fmt(bs.liabilities?.total)}` : '—', icon: CreditCard, color: '#a855f7', onClick: () => navigate('/reports/balance-sheet') }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>Finance Dashboard</h2>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: 14 }}>Live overview of accounting and financial metrics.</p>
        </div>
        
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row', width: 'auto', flexWrap: 'wrap', position: 'relative', background: 'var(--bg-primary, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted, #64748b)' }}>
            <Activity size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Active FY:</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{from} — {today}</span>
        </div>
      </div>

      {renderMetricGrid(kpiItems)}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Monthly Sales Bar */}
        <div style={{ gridColumn: 'span 2' }}>
          <ChartCard title="Monthly Revenue" subtitle="Last 6 months top-line growth">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => fmtK(v)} width={60} />
                  <Tooltip formatter={v => [`₹${fmt(v)}`, 'Sales']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No sales data yet</div>
            )}
          </ChartCard>
        </div>

        {/* P&L Pie */}
        <div>
          <ChartCard title="Income vs Expenses" subtitle="Current financial year distribution">
            {plPieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={plPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                    {plPieData.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[3]][i]} />)}
                  </Pie>
                  <Tooltip formatter={v => `₹${fmt(v)}`} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Recent Vouchers + Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Recent Vouchers */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ background: 'var(--bg-primary, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>Recent Transactions</h3>
              <button onClick={() => navigate('/day-book')} style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                View Day Book →
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: 'var(--bg-secondary, #f8fafc)', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', fontSize: 11, textTransform: 'uppercase' }}>Voucher</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', fontSize: 11, textTransform: 'uppercase' }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', fontSize: 11, textTransform: 'uppercase' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(recent || []).slice(0, 8).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border, #e2e8f0)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => navigate('/vouchers')} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted, #94a3b8)', fontSize: 12 }}>{v.date}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>{v.voucher_number}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                        background: { Sales: '#eff6ff', Purchase: '#f5f3ff', Payment: '#fff7ed', Receipt: '#f0fdf4', Journal: '#fefce8', Contra: '#f0fdfa' }[v.voucher_type] || '#f8fafc',
                        color:      { Sales: '#3b82f6', Purchase: '#8b5cf6', Payment: '#f97316', Receipt: '#22c55e', Journal: '#eab308', Contra: '#14b8a6' }[v.voucher_type] || '#64748b',
                      }}>
                        {v.voucher_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                      ₹{fmt(v.total_amount)}
                    </td>
                  </tr>
                ))}
                {!recent?.length && (
                  <tr><td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted, #cbd5e1)', fontSize: 13 }}>No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div style={{ background: 'var(--bg-primary, #ffffff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>Quick Reports</h3>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { icon: Scale,      label: 'Trial Balance',     path: '/reports/trial-balance',    color: '#6366f1' },
                { icon: TrendingUp, label: 'Profit & Loss',     path: '/reports/profit-loss',      color: '#22c55e' },
                { icon: Package,    label: 'Balance Sheet',     path: '/reports/balance-sheet',    color: '#3b82f6' },
                { icon: BookOpen,   label: 'Day Book',          path: '/day-book',                 color: '#f59e0b' },
                { icon: DollarSign, label: 'Cash Book',         path: '/reports/cash-book',        color: '#14b8a6' },
                { icon: CreditCard, label: 'Bank Book',         path: '/reports/bank-book',        color: '#8b5cf6' },
                { icon: AlertTriangle,label:'Outstanding',      path: '/reports/outstanding',      color: '#ef4444' },
                { icon: FileText,   label: 'GST Summary',       path: '/gst',                      color: '#f97316' },
              ].map(({ icon: Icon, label, path, color }) => (
                <button key={path} onClick={() => navigate(path)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${color}15`, color: color }}>
                    <Icon size={14} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary, #334155)', flex: 1 }}>{label}</span>
                  <ArrowUpRight size={14} style={{ color: 'var(--text-muted, #cbd5e1)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
