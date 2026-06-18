import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { PieChart as PieIcon, CheckCircle, AlertCircle, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const today = new Date().toISOString().split('T')[0];

function Side({ title, color, groups, total }) {
  const [expanded, setExpanded] = useState({});
  const toggle = g => setExpanded(p => ({ ...p, [g]: !p[g] }));

  return (
    <div className="cb-card h-full flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
            <tr>
              <th className="text-left px-5 py-3 font-bold" style={{ color }}>{title}</th>
              <th className="text-right px-5 py-3 font-bold w-1/3">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {Object.keys(groups || {}).length === 0 && (
              <tr>
                <td colSpan={2} className="text-slate-400 text-xs text-center py-8">No entries</td>
              </tr>
            )}
            {Object.entries(groups || {}).map(([group, items]) => {
              const groupTotal = items.reduce((s, r) => s + r.amount, 0);
              const isOpen = expanded[group] !== false;
              return (
                <Fragment key={group}>
                  <tr onClick={() => toggle(group)} className="hover:bg-slate-100/80 transition-colors cursor-pointer">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-xs">
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
                  {isOpen && items.map((item, i) => (
                    <tr key={i} className="hover:bg-purple-50/15 transition-colors align-top bg-slate-50/30">
                      <td className="px-5 py-2 pl-10 text-xs text-slate-500 font-medium">{item.ledger}</td>
                      <td className="px-5 py-2 text-right font-mono text-[13px] text-slate-700">₹{fmt(item.amount)}</td>
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

export default function BalanceSheet() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOf, setAsOf] = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setAsOf(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['balance-sheet', activeCompany?.id, asOf],
    queryFn: () => reports.balanceSheet({ company_id: activeCompany.id, as_of: asOf }),
    enabled: !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Balance Sheet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            <PieIcon size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Balance Sheet</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Financial position summary showing Assets & Liabilities as on date
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

      {/* ── Controls and Balance Status Card ── */}
      <div className="cb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold">As of Date:</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="pl-10 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
          </div>

          {data && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${data.is_balanced ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {data.is_balanced ? (
                <><CheckCircle size={12} className="text-emerald-500" /> Balanced</>
              ) : (
                <><AlertCircle size={12} className="text-red-500" /> Liabilities & Assets Mismatch</>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Balance Sheet', companyName: activeCompany.name, period: `As of ${asOf}`, data, reportType: 'balance-sheet' })}
          className="flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {isLoading && <div className="text-center py-20 text-slate-400 animate-pulse text-xs">Loading balance sheet details…</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Side title="Liabilities" color="#8b5cf6" groups={data.liabilities?.groups} total={data.liabilities?.total} />
          <Side title="Assets"      color="#3b82f6" groups={data.assets?.groups}      total={data.assets?.total} />
        </div>
      )}
    </div>
  );
}
