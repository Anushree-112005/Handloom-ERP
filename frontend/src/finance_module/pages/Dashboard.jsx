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
    const result = [];
    const todayDate = new Date(today);
    // Generate present month to previous 4 months (5 months total)
    for (let i = 4; i >= 0; i--) {
      const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
      const yearMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const label = d.toLocaleString('en-IN', { month: 'short' });
      result.push({
        key: yearMonth,
        month: label,
        Sales: 0
      });
    }

    if (salesReg?.rows) {
      salesReg.rows.forEach(r => {
        const m = r.date?.slice(0, 7);
        const match = result.find(item => item.key === m);
        if (match) {
          match.Sales += Math.round(r.total || 0);
        }
      });
    }
    return result;
  }, [salesReg, today]);

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
          className="btn btn-primary px-5 py-2">
          Create Company
        </button>
      </div>
    );
  }

  const kpiItems = [
    { label: "Net Profit / Loss", value: pl ? `${pl.is_profit ? '' : '-'}₹${fmt(Math.abs(pl.net_profit))}` : '—', icon: pl?.is_profit ? TrendingUp : TrendingDown, color: pl?.is_profit ? '#22c55e' : '#ef4444', path: '/cubebook/reports/profit-loss' },
    { label: "Total Assets", value: bs ? `₹${fmt(bs.assets?.total)}` : '—', icon: Scale, color: '#6366f1', path: '/cubebook/reports/balance-sheet' },
    { label: "Receivables", value: outstanding ? `₹${fmt(outstanding.total_receivable)}` : '—', icon: ArrowUpRight, color: '#3b82f6', path: '/cubebook/reports/outstanding' },
    { label: "Payables", value: outstanding ? `₹${fmt(outstanding.total_payable)}` : '—', icon: AlertTriangle, color: '#f59e0b', path: '/cubebook/reports/outstanding' },
    { label: "Cash Balance", value: cashBook ? `₹${fmt(cashBook.closing_balance)}` : '—', icon: DollarSign, color: '#14b8a6', path: '/cubebook/reports/cash-book' },
    { label: "Total Income", value: pl ? `₹${fmt(pl.income?.total)}` : '—', icon: TrendingUp, color: '#22c55e', path: '/cubebook/reports/profit-loss' },
    { label: "Total Expenses", value: pl ? `₹${fmt(pl.expenses?.total)}` : '—', icon: TrendingDown, color: '#ef4444', path: '/cubebook/reports/profit-loss' },
    { label: "Total Liab.", value: bs ? `₹${fmt(bs.liabilities?.total)}` : '—', icon: CreditCard, color: '#a855f7', path: '/cubebook/reports/balance-sheet' }
  ];

  const renderMetricGrid = (items) => (
    <div style={{ marginBottom: 20 }}>
      {/* Compact Grid Layout similar to the main ERP dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {items.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => navigate(item.path)}
            style={{
              background: 'var(--bg-primary)',
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${item.color}`,
              borderRadius: '8px',
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 8px ${item.color}15`;
              e.currentTarget.style.borderColor = `${item.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ 
              color: item.color, 
              background: `${item.color}15`, 
              padding: '8px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <item.icon size={18} strokeWidth={2.5} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {item.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 750, color: 'var(--text-primary)' }}>
                  {item.value.split(' ')[0]} 
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {item.value.split(' ').slice(1).join(' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children }) => (
    <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
        {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>}
      </div>
      <div style={{ position: 'relative', width: '100%', height: 220 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Finance Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Live overview of accounting and financial metrics.</p>
        </div>
        
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row', width: 'auto', flexWrap: 'wrap', position: 'relative', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <Activity size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Active FY:</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{from} — {today}</span>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => fmtK(v)} width={60} />
                  <Tooltip formatter={v => [`₹${fmt(v)}`, 'Sales']} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', background: 'var(--bg-primary)' }} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="Sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No sales data yet</div>
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
                  <Tooltip formatter={v => `₹${fmt(v)}`} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No data yet</div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Recent Vouchers */}
      <div style={{ marginBottom: 16 }}>
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Transactions</h3>
            <button onClick={() => navigate('/cubebook/day-book')} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              View Day Book →
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Voucher</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Type</th>
                <th style={{ textAlign: 'right', padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(recent || []).slice(0, 8).map(v => {
                const actionData = VOUCHER_ACTIONS.find(a => a.type === v.voucher_type) || VOUCHER_ACTIONS[4];
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => navigate('/cubebook/vouchers')} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 12 }}>{v.date}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{v.voucher_number}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                        background: actionData.bg,
                        color: actionData.color,
                        border: `1px solid ${actionData.border}`
                      }}>
                        {v.voucher_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{fmt(v.total_amount)}
                    </td>
                  </tr>
                );
              })}
              {!recent?.length && (
                <tr><td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
