import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { Scale, CheckCircle, AlertCircle, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const today = new Date().toISOString().split('T')[0];
const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function TrialBalance() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOf, setAsOf] = useState(activeFy?.end_date || today);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (activeFy) {
      setAsOf(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['trial-balance', activeCompany?.id, asOf],
    queryFn: () => reports.trialBalance({ company_id: activeCompany.id, as_of: asOf }),
    enabled: !!activeCompany,
  });

  // Group rows by group name
  const grouped = {};
  (data?.rows || []).forEach(r => {
    if (!grouped[r.group]) grouped[r.group] = [];
    grouped[r.group].push(r);
  });

  const toggleGroup = g => setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Trial Balance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            <Scale size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Trial Balance</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Debit/Credit balancing as on date
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            FY: {activeFy?.label || 'Not set'} &nbsp;·&nbsp; {data?.rows?.length || 0} ledger balances
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="cb-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30">
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
                  <><AlertCircle size={12} className="text-red-500" /> Difference: ₹{fmt(Math.abs(data.total_dr - data.total_cr))}</>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => data && exportToPDF({ title: 'Trial Balance', companyName: activeCompany.name, period: `As of ${asOf}`, data: { raw: data, grouped }, reportType: 'trial-balance' })}
            className="flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto max-h-[55vh] relative">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
              <tr>
                <th className="text-left px-5 py-3 font-bold w-1/3">Particulars</th>
                <th className="text-right px-4 py-3 font-bold w-1/6">Opening Dr (₹)</th>
                <th className="text-right px-4 py-3 font-bold w-1/6">Opening Cr (₹)</th>
                <th className="text-right px-4 py-3 font-bold w-1/6">Closing Dr (₹)</th>
                <th className="text-right px-5 py-3 font-bold w-1/6">Closing Cr (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading trial balance…
                  </td>
                </tr>
              ) : !data?.rows?.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Scale size={36} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-semibold">No ledger balances found</p>
                  </td>
                </tr>
              ) : (
                Object.entries(grouped).map(([group, rows]) => {
                  const groupDr = rows.filter(r => r.closing_type === 'Dr').reduce((s, r) => s + r.closing, 0);
                  const groupCr = rows.filter(r => r.closing_type === 'Cr').reduce((s, r) => s + r.closing, 0);
                  const isOpen = expandedGroups[group] !== false; // default open

                  return (
                    <Fragment key={group}>
                      {/* Group Row */}
                      <tr
                        onClick={() => toggleGroup(group)}
                        className="bg-slate-50/60 border-b border-slate-100 hover:bg-slate-100/80 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-2.5 font-semibold text-slate-800 flex items-center gap-2">
                          <span className="text-slate-400">
                            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </span>
                          {group}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500 font-semibold" />
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500 font-semibold" />
                        <td className="px-4 py-2.5 text-right font-mono text-purple-700 font-semibold">
                          {groupDr > 0 ? `₹${fmt(groupDr)}` : ''}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-indigo-600 font-semibold">
                          {groupCr > 0 ? `₹${fmt(groupCr)}` : ''}
                        </td>
                      </tr>

                      {/* Ledger Rows */}
                      {isOpen && rows.map((r, i) => (
                        <tr key={i} className="hover:bg-purple-50/15 transition-colors align-top">
                          <td className="px-5 py-2.5 pl-10 text-slate-600 font-medium">{r.ledger}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-500 font-medium">
                            {r.opening_dr > 0 ? `₹${fmt(r.opening_dr)}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-500 font-medium">
                            {r.opening_cr > 0 ? `₹${fmt(r.opening_cr)}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-700 font-medium">
                            {r.closing_type === 'Dr' ? `₹${fmt(r.closing)}` : '—'}
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono text-slate-700 font-medium">
                            {r.closing_type === 'Cr' ? `₹${fmt(r.closing)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
            {/* Grand Total Footer */}
            {data && (
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
                <tr>
                  <td className="px-5 py-3 text-left text-slate-500 font-bold uppercase tracking-wider">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400" />
                  <td className="px-4 py-3 text-right font-mono text-slate-400" />
                  <td className="px-4 py-3 text-right font-mono text-[13px] text-emerald-700 font-bold">
                    ₹{fmt(data.total_dr)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[13px] text-indigo-700 font-bold border-l border-slate-100">
                    ₹{fmt(data.total_cr)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ── Enterprise Pagination Footer ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/20 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select className="bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer font-semibold">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">Page 1 of 1</span>
            <div className="flex items-center gap-1.5">
              <button disabled className="px-2.5 py-1.5 border border-slate-200/80 rounded-lg bg-white text-slate-300 cursor-not-allowed text-xs font-semibold transition-colors">
                Previous
              </button>
              <button disabled className="px-2.5 py-1.5 border border-slate-200/80 rounded-lg bg-white text-slate-300 cursor-not-allowed text-xs font-semibold transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
