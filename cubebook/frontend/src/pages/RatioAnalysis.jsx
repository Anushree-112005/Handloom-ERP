import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { BarChart3, RefreshCw, Calendar, Download } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt  = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtP = n => `${(n || 0).toFixed(2)}%`;
const fyStart = `${new Date().getFullYear()}-04-01`;
const today   = new Date().toISOString().split('T')[0];

const ratioMeta = [
  { key: 'current_ratio',        label: 'Current Ratio',        suffix: ':1',  color: '#6366f1', desc: 'Current Assets / Current Liabilities' },
  { key: 'gross_profit_ratio',   label: 'Gross Profit Ratio',   suffix: '%',   color: '#10b981', desc: 'Gross Profit / Revenue × 100' },
  { key: 'net_profit_ratio',     label: 'Net Profit Ratio',     suffix: '%',   color: '#3b82f6', desc: 'Net Profit / Revenue × 100' },
  { key: 'working_capital',      label: 'Working Capital',      suffix: '',    color: '#f59e0b', desc: 'Current Assets − Current Liabilities' },
];

const statCards = [
  { key: 'revenue',              label: 'Total Revenue',        color: '#10b981' },
  { key: 'net_profit',           label: 'Net Profit / Loss',    color: '#6366f1' },
  { key: 'current_assets',       label: 'Current Assets',       color: '#3b82f6' },
  { key: 'current_liabilities',  label: 'Current Liabilities',  color: '#f59e0b' },
  { key: 'total_assets',         label: 'Total Assets',         color: '#8b5cf6' },
];

function RatioGauge({ label, value, suffix, color, desc }) {
  const display = suffix === '%' ? fmtP(value) : suffix === ':1' ? `${(value || 0).toFixed(2)}:1` : `₹${fmt(value)}`;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + '15' }}>
          <BarChart3 size={15} style={{ color }} />
        </div>
        <span className="text-[10px] text-slate-400 text-right max-w-[120px] leading-tight font-medium">{desc}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold font-mono mt-1" style={{ color }}>{display}</p>
    </div>
  );
}

export default function RatioAnalysis() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate,   setToDate]   = useState(activeFy?.end_date || today);

  const params = { company_id: activeCompany?.id, as_of: toDate, from_date: fromDate, to_date: toDate };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ratio-analysis', activeCompany?.id, fromDate, toDate],
    queryFn:  () => reports.ratioAnalysis(params),
    enabled:  !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Ratio Analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            <BarChart3 size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Ratio Analysis</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Key operational performance and financial health ratios
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            FY: {activeFy?.label || 'Not set'}
          </p>
        </div>
      </div>

      {/* ── Controls Toolbar Card ── */}
      <div className="cb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
            <span className="text-slate-400 text-xs font-semibold">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button 
            onClick={() => data && exportToPDF({ title: 'Ratio Analysis', companyName: activeCompany.name, period: `${fromDate} to ${toDate}`, data, reportType: 'ratio' })}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      {isLoading && <div className="text-center py-20 text-slate-400 animate-pulse text-xs">Computing key ratios…</div>}

      {data && (
        <div className="space-y-6">
          {/* Ratio KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ratioMeta.map(r => (
              <RatioGauge key={r.key} label={r.label} value={data[r.key]} suffix={r.suffix} color={r.color} desc={r.desc} />
            ))}
          </div>

          {/* Supporting Figures */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-bold text-slate-700 text-xs bg-slate-50/20">
              Supporting Financial Figures
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y divide-slate-100">
              {statCards.map(s => (
                <div key={s.key} className="p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                  <p className="text-base font-bold font-mono mt-1" style={{ color: s.color }}>₹{fmt(data[s.key])}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 border text-xs leading-relaxed ${data.current_ratio >= 2 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : data.current_ratio >= 1 ? 'bg-amber-50/50 border-amber-100 text-amber-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
              <p className="font-bold mb-1 text-xs">Current Ratio Analaysis: {data.current_ratio?.toFixed(2)}:1</p>
              <p className="text-[11px] font-medium">
                {data.current_ratio >= 2 ? '✅ Excellent liquidity status — the company is in a highly secure position to meet its short-term debt obligations.' :
                 data.current_ratio >= 1 ? '⚠️ Marginal liquidity status — monitor working capital buffers. The standard baseline target is ≥ 2:1.' :
                 '❌ Critical liquidity crunch — current liabilities exceed current assets. Significant risk of short-term cash deficits.'}
              </p>
            </div>
            <div className={`rounded-xl p-4 border text-xs leading-relaxed ${data.net_profit_ratio > 10 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : data.net_profit_ratio > 0 ? 'bg-amber-50/50 border-amber-100 text-amber-800' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
              <p className="font-bold mb-1 text-xs">Net Profit Ratio Analysis: {fmtP(data.net_profit_ratio)}</p>
              <p className="text-[11px] font-medium">
                {data.net_profit_ratio > 10 ? '✅ Strong profitability — outstanding net yield margin exceeding 10% on sales revenues.' :
                 data.net_profit_ratio > 0 ? '⚠️ Profitable but slim net returns. Suggests checking operational cost optimization strategies.' :
                 '❌ Operating deficit — business has run at a net loss in this period. Review overhead overheads and pricing structures.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
