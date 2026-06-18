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
      className="card">
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

  const { data: pl }         = useQuery({ queryKey: ['dash-pl', companyId], queryFn: () => reports.profitLoss({ ...params }), enabled: !!companyId });
  const { data: bs }         = useQuery({ queryKey: ['dash-bs', companyId], queryFn: () => reports.balanceSheet({ company_id: companyId, as_of: today }), enabled: !!companyId });
  const { data: outstanding }= useQuery({ queryKey: ['dash-out', companyId], queryFn: () => reports.outstanding({ company_id: companyId, as_of: today }), enabled: !!companyId });
  const { data: cashBook }   = useQuery({ queryKey: ['dash-cash', companyId], queryFn: () => reports.cashBook({ ...params }), enabled: !!companyId });
  const { data: recent }     = useQuery({ queryKey: ['dash-recent', companyId], queryFn: () => vouchersApi.list({ company_id: companyId, limit: 8 }), enabled: !!companyId });
  const { data: salesReg }   = useQuery({ queryKey: ['dash-sales', companyId], queryFn: () => reports.salesRegister({ ...params }), enabled: !!companyId });

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
        <button onClick={() => navigate('/cubebook/cubebook/company/create')}
          className="btn btn-primary">
          Create Company
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {activeCompany.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            FY {from} — {today} &nbsp;·&nbsp; Real-time accounting dashboard
          </p>
        </div>
        <button onClick={() => window.location.reload()}
          className="btn btn-secondary">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Quick Voucher Launcher */}
      <div className="card">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Entry</p>
        <div className="flex flex-wrap gap-2">
          {VOUCHER_ACTIONS.map(a => (
            <button key={a.type}
              onClick={() => navigate(`/cubebook/vouchers?type=${a.type}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all hover:shadow-sm"
              style={{ background: a.bg, color: a.color, borderColor: a.border }}>
              <Receipt size={14} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="form-row">
        <KpiCard
          title="Net Profit / Loss"
          value={pl ? `${pl.is_profit ? '' : '-'}₹${fmt(Math.abs(pl.net_profit))}` : '—'}
          subtitle={pl?.is_profit ? 'Profit this year' : 'Loss this year'}
          icon={pl?.is_profit ? TrendingUp : TrendingDown}
          color={pl?.is_profit ? '#22c55e' : '#ef4444'}
          onClick={() => navigate('/cubebook/cubebook/reports/profit-loss')}
        />
        <KpiCard
          title="Total Assets"
          value={bs ? `₹${fmt(bs.assets?.total)}` : '—'}
          subtitle="Balance sheet total"
          icon={Scale}
          color="#6366f1"
          onClick={() => navigate('/cubebook/cubebook/reports/balance-sheet')}
        />
        <KpiCard
          title="Receivables"
          value={outstanding ? `₹${fmt(outstanding.total_receivable)}` : '—'}
          subtitle="Sundry debtors"
          icon={ArrowUpRight}
          color="#3b82f6"
          onClick={() => navigate('/cubebook/cubebook/reports/outstanding')}
        />
        <KpiCard
          title="Payables"
          value={outstanding ? `₹${fmt(outstanding.total_payable)}` : '—'}
          subtitle="Sundry creditors"
          icon={AlertTriangle}
          color="#f59e0b"
          onClick={() => navigate('/cubebook/cubebook/reports/outstanding')}
        />
        <KpiCard
          title="Cash Balance"
          value={cashBook ? `₹${fmt(cashBook.closing_balance)}` : '—'}
          subtitle="Cash in hand"
          icon={DollarSign}
          color="#14b8a6"
          onClick={() => navigate('/cubebook/cubebook/reports/cash-book')}
        />
        <KpiCard
          title="Total Income"
          value={pl ? `₹${fmt(pl.income?.total)}` : '—'}
          subtitle="All income accounts"
          icon={TrendingUp}
          color="#22c55e"
          onClick={() => navigate('/cubebook/cubebook/reports/profit-loss')}
        />
        <KpiCard
          title="Total Expenses"
          value={pl ? `₹${fmt(pl.expenses?.total)}` : '—'}
          subtitle="All expense accounts"
          icon={TrendingDown}
          color="#ef4444"
          onClick={() => navigate('/cubebook/cubebook/reports/profit-loss')}
        />
        <KpiCard
          title="Total Liabilities"
          value={bs ? `₹${fmt(bs.liabilities?.total)}` : '—'}
          subtitle="Balance sheet total"
          icon={CreditCard}
          color="#a855f7"
          onClick={() => navigate('/cubebook/cubebook/reports/balance-sheet')}
        />
      </div>

      {/* Charts Row */}
      <div className="form-row">
        {/* Monthly Sales Bar */}
        <div className="btn btn-secondary">
          <div className="card-header">
            <div>
              <h3 className="font-bold text-slate-800">Monthly Sales</h3>
              <p className="text-xs text-slate-500">Last 6 months revenue</p>
            </div>
            <Activity size={18} className="text-slate-300" />
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => fmtK(v)} width={60} />
                <Tooltip formatter={v => [`₹${fmt(v)}`, 'Sales']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No sales data yet</div>
          )}
        </div>

        {/* P&L Pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-bold text-slate-800">Income vs Expenses</h3>
              <p className="text-xs text-slate-500">Current financial year</p>
            </div>
            <FileText size={18} className="text-slate-300" />
          </div>
          {plPieData.some(d => d.value > 0) ? (
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={plPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {plPieData.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[3]][i]} />)}
                  </Pie>
                  <Tooltip formatter={v => `₹${fmt(v)}`} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Vouchers + Quick Links */}
      <div className="form-row">
        {/* Recent Vouchers */}
        <div className="btn btn-secondary">
          <div className="btn btn-secondary">
            <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
            <button onClick={() => navigate('/cubebook/cubebook/day-book')} className="text-xs text-purple-600 font-medium hover:underline">
              View Day Book →
            </button>
          </div>
          <table className="data-table">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left px-5 py-2.5 font-semibold">Date</th>
                <th className="text-left px-4 py-2.5 font-semibold">Voucher</th>
                <th className="text-left px-4 py-2.5 font-semibold">Type</th>
                <th className="text-right px-5 py-2.5 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(recent || []).slice(0, 8).map(v => (
                <tr key={v.id} className="btn btn-secondary" onClick={() => navigate('/cubebook/cubebook/vouchers')}>
                  <td className="px-5 py-2.5 text-slate-500 text-xs whitespace-nowrap">{v.date}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-700">{v.voucher_number}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: { Sales: '#eff6ff', Purchase: '#f5f3ff', Payment: '#fff7ed', Receipt: '#f0fdf4', Journal: '#fefce8', Contra: '#f0fdfa' }[v.voucher_type] || '#f8fafc',
                        color:      { Sales: '#3b82f6', Purchase: '#8b5cf6', Payment: '#f97316', Receipt: '#22c55e', Journal: '#eab308', Contra: '#14b8a6' }[v.voucher_type] || '#64748b',
                      }}>
                      {v.voucher_type}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-xs font-semibold text-slate-800">
                    ₹{fmt(v.total_amount)}
                  </td>
                </tr>
              ))}
              {!recent?.length && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-300 text-sm">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Links */}
        <div className="card">
          <div className="btn btn-secondary">
            <h3 className="font-bold text-slate-800 text-sm">Quick Reports</h3>
          </div>
          <div className="p-3 space-y-1">
            {[
              { icon: Scale,      label: 'Trial Balance',     path: '/cubebook/reports/trial-balance',    color: '#6366f1' },
              { icon: TrendingUp, label: 'Profit & Loss',     path: '/cubebook/reports/profit-loss',      color: '#22c55e' },
              { icon: Package,    label: 'Balance Sheet',     path: '/cubebook/reports/balance-sheet',    color: '#3b82f6' },
              { icon: BookOpen,   label: 'Day Book',          path: '/cubebook/day-book',                 color: '#f59e0b' },
              { icon: DollarSign, label: 'Cash Book',         path: '/cubebook/reports/cash-book',        color: '#14b8a6' },
              { icon: CreditCard, label: 'Bank Book',         path: '/cubebook/reports/bank-book',        color: '#8b5cf6' },
              { icon: AlertTriangle,label:'Outstanding',      path: '/cubebook/reports/outstanding',      color: '#ef4444' },
              { icon: FileText,   label: 'GST Summary',       path: '/cubebook/gst',                      color: '#f97316' },
            ].map(({ icon: Icon, label, path, color }) => (
              <button key={path} onClick={() => navigate(path)}
                className="form-control">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '15' }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                <ArrowUpRight size={12} className="ml-auto text-slate-300 group-hover:text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
