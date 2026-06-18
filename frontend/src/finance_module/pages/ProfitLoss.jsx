import { useState, useEffect, Fragment } from 'react';
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
    <div className="cb-card h-full flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
            <tr>
              <th className="text-left px-5 py-3 font-bold flex items-center gap-2">
                <Icon size={14} style={{ color }} /> {title}
              </th>
              <th className="text-right px-5 py-3 font-bold w-1/3">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {Object.keys(groups || {}).length === 0 && (
              <tr>
                <td colSpan={2} className="text-slate-400 text-xs text-center py-8">{emptyText}</td>
              </tr>
            )}
            {Object.entries(groups || {}).map(([group, items]) => {
              const groupTotal = items.reduce((s, r) => s + r.amount, 0);
              const isOpen = expanded[group] !== false;
              return (
                <Fragment key={group}>
                  <tr onClick={() => toggle(group)} className="hover:bg-slate-100/80 transition-colors cursor-pointer">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <span className="text-slate-400">
                          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        {group}
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-[13px] text-slate-600 font-semibold">
                      ₹{fmt(groupTotal)}
                    </td>
                  </tr>
                  {isOpen && items.map((row, i) => (
                    <tr key={i} className="hover:bg-purple-50/15 transition-colors align-top bg-slate-50/30">
                      <td className="px-5 py-2 pl-10 text-xs text-slate-500 font-medium">{row.ledger}</td>
                      <td className="px-5 py-2 text-right font-mono text-[13px] text-slate-700">₹{fmt(row.amount)}</td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
            <tr>
              <td className="px-5 py-3 text-slate-500 uppercase font-bold tracking-wider">Total {title}</td>
              <td className="px-5 py-3 text-right font-mono text-[13px]" style={{ color }}>₹{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function ProfitLoss() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate, setToDate]     = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setFromDate(activeFy.start_date || fyStart);
      setToDate(activeFy.end_date || today);
    }
  }, [activeFy]);

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
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
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
                className="pl-10 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
            <span className="text-slate-400 text-xs font-semibold">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-10 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
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
          className="self-start md:self-auto flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {isLoading && <div className="text-center py-20 text-slate-400 animate-pulse text-xs">Computing Profit & Loss Statement…</div>}

      {data && (
        <div className="space-y-6">
          {/* Two-column P&L */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
