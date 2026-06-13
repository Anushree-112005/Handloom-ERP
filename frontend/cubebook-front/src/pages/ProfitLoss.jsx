import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { TrendingUp, TrendingDown, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fyStart = `${new Date().getFullYear()}-04-01`;
const today = new Date().toISOString().split('T')[0];

function GroupBlock({ title, icon: Icon, color, groups, total, emptyText }) {
  const [expanded, setExpanded] = useState({});
  const toggle = g => setExpanded(p => ({ ...p, [g]: !p[g] }));

  return (
    <div className="card">
      <div className="btn btn-secondary" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
          <Icon size={14} style={{ color }} /> {title}
        </div>
        <span className="font-mono text-xs font-bold" style={{ color }}>₹{fmt(total)}</span>
      </div>
      <div className="flex-1 divide-y divide-slate-100">
        {Object.keys(groups || {}).length === 0 && (
          <p className="text-slate-400 text-xs text-center py-8">{emptyText}</p>
        )}
        {Object.entries(groups || {}).map(([group, items]) => {
          const groupTotal = items.reduce((s, r) => s + r.amount, 0);
          const isOpen = expanded[group] !== false;
          return (
            <Fragment key={group}>
              <button onClick={() => toggle(group)}
                className="form-control">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span className="text-slate-400">
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                  {group}
                </div>
                <span className="font-mono text-xs text-slate-600 font-semibold">₹{fmt(groupTotal)}</span>
              </button>
              {isOpen && items.map((row, i) => (
                <div key={i} className="btn btn-primary">
                  <span className="text-xs text-slate-500 font-medium">{row.ledger}</span>
                  <span className="font-mono text-xs text-slate-700">₹{fmt(row.amount)}</span>
                </div>
              ))}
            </Fragment>
          );
        })}
      </div>
      <div className="btn btn-secondary">
        <span>Total {title}</span>
        <span className="font-mono" style={{ color }}>₹{fmt(total)}</span>
      </div>
    </div>
  );
}

export default function ProfitLoss() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate, setToDate]     = useState(activeFy?.end_date || today);

  const { data, isLoading } = useQuery({
    queryKey: ['profit-loss', activeCompany?.id, fromDate, toDate],
    queryFn: () => reports.profitLoss({ company_id: activeCompany.id, from_date: fromDate, to_date: toDate }),
    enabled: !!activeCompany && !!fromDate && !!toDate,
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Profit & Loss.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="btn btn-primary">
            <TrendingUp size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Profit & Loss Account</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Net income and expenditure statement for a specific period
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

      {/* ── Controls and Overview Card ── */}
      <div className="cb-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="btn btn-secondary"
              />
            </div>
            <span className="text-slate-400 text-xs font-semibold">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="btn btn-secondary"
              />
            </div>
          </div>

          {data && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${data.is_profit ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
              {data.is_profit ? (
                <><TrendingUp size={12} className="text-emerald-500" /> Net Profit: ₹{fmt(Math.abs(data.net_profit))}</>
              ) : (
                <><TrendingDown size={12} className="text-rose-500" /> Net Loss: ₹{fmt(Math.abs(data.net_profit))}</>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Profit & Loss Account', companyName: activeCompany.name, period: `${fromDate} to ${toDate}`, data, reportType: 'profit-loss' })}
          className="btn btn-secondary"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {isLoading && <div className="text-center py-20 text-slate-400 animate-pulse text-xs">Computing Profit & Loss Statement…</div>}

      {data && (
        <div className="space-y-6">
          {/* Two-column P&L */}
          <div className="form-row">
            <GroupBlock
              title="Expenses (Dr)"
              icon={TrendingDown}
              color="#f43f5e"
              groups={data.expenses?.groups}
              total={data.expenses?.total}
              emptyText="No expense accounts"
            />
            <GroupBlock
              title="Income (Cr)"
              icon={TrendingUp}
              color="#10b981"
              groups={data.income?.groups}
              total={data.income?.total}
              emptyText="No income accounts"
            />
          </div>

          {/* Net Result Banner */}
          <div className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${data.is_profit ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
            <div>
              <p className="text-xs font-bold text-slate-600">Period net result Summary</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{fromDate} to {toDate}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className={`text-2xl font-bold font-mono ${data.is_profit ? 'text-emerald-700' : 'text-rose-700'}`}>
                {data.is_profit ? '' : '('}₹{fmt(Math.abs(data.net_profit))}{data.is_profit ? '' : ')'}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">
                Income ₹{fmt(data.income?.total)} − Expenses ₹{fmt(data.expenses?.total)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
