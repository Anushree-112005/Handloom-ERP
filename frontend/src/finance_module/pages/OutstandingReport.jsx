import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { AlertTriangle, Download, ArrowUpRight, ArrowDownLeft, Calendar, Filter } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const today = new Date().toISOString().split('T')[0];

export default function OutstandingReport() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOf,      setAsOf]      = useState(activeFy?.end_date || today);
  const [partyType, setPartyType] = useState('');

  useEffect(() => {
    if (activeFy) {
      setAsOf(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['outstanding', activeCompany?.id, asOf, partyType],
    queryFn:  () => reports.outstanding({ company_id: activeCompany.id, as_of: asOf, party_type: partyType || undefined }),
    enabled:  !!activeCompany,
  });

  const debtors   = data?.rows?.filter(r => r.party_type === 'Debtor')   || [];
  const creditors = data?.rows?.filter(r => r.party_type === 'Creditor') || [];

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Outstanding Report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Outstanding Report</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Reconcile receivables from debtors and payables to creditors
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
          {/* As Of date */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-semibold">As of:</span>
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

          {/* Party type select */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
            <select 
              value={partyType}
              onChange={(e) => setPartyType(e.target.value)}
              className="pl-7 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 appearance-none cursor-pointer"
            >
              <option value="">All Parties</option>
              <option value="debtor">Debtors (Receivables)</option>
              <option value="creditor">Creditors (Payables)</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[8px]">▼</div>
          </div>

          {partyType && (
            <button
              onClick={() => setPartyType('')}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold px-2 py-1 hover:bg-purple-50 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Outstanding Report', companyName: activeCompany.name, period: `As of ${asOf}`, data: { items: partyType === 'debtor' ? debtors : partyType === 'creditor' ? creditors : data.rows }, reportType: 'outstanding' })}
          className="flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight size={13} /> Total Receivables
              </p>
              <p className="text-2xl font-bold font-mono text-blue-900 mt-1">₹{fmt(data.total_receivable)}</p>
              <p className="text-[10px] font-semibold text-blue-400 mt-0.5">
                {debtors.length} active customer account{debtors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownLeft size={13} /> Total Payables
              </p>
              <p className="text-2xl font-bold font-mono text-amber-900 mt-1">₹{fmt(data.total_payable)}</p>
              <p className="text-[10px] font-semibold text-amber-400 mt-0.5">
                {creditors.length} active vendor account{creditors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div className="text-center py-20 text-slate-400 animate-pulse text-xs">Computing outstanding balances…</div>}

      {/* Debtors Table */}
      {(!partyType || partyType === 'debtor') && debtors.length > 0 && (
        <div className="cb-card">
          <div className="px-5 py-3 border-b border-slate-100 bg-blue-50/15 flex items-center gap-2">
            <ArrowUpRight size={15} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-800">Receivables — Sundry Debtors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
                <tr>
                  <th className="text-left px-5 py-3 font-bold">Party Name</th>
                  <th className="text-left px-4 py-3 font-bold w-1/4">Group</th>
                  <th className="text-right px-4 py-3 font-bold w-1/4">Outstanding (₹)</th>
                  <th className="text-center px-5 py-3 font-bold w-24">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {debtors.map(r => (
                  <tr key={r.ledger_id} className="hover:bg-purple-50/15 transition-colors align-top">
                    <td className="px-5 py-2.5 font-semibold text-slate-800">{r.ledger_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{r.group}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px] text-blue-700 font-bold">₹{fmt(r.outstanding)}</td>
                    <td className="px-5 py-2.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-50/60 text-blue-700 border-blue-100">
                        {r.balance_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                <tr>
                  <td colSpan={2} className="px-5 py-3 text-slate-500 uppercase font-bold tracking-wider">
                    Total Receivables
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] text-blue-800 font-bold border-l border-slate-100">
                    ₹{fmt(data?.total_receivable)}
                  </td>
                  <td className="border-l border-slate-100" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Enterprise Pagination Footer ── */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/20 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select className="bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer font-semibold">
                <option>25</option>
                <option>50</option>
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
      )}

      {/* Creditors Table */}
      {(!partyType || partyType === 'creditor') && creditors.length > 0 && (
        <div className="cb-card mt-6">
          <div className="px-5 py-3 border-b border-slate-100 bg-amber-50/15 flex items-center gap-2">
            <ArrowDownLeft size={15} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-800">Payables — Sundry Creditors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
                <tr>
                  <th className="text-left px-5 py-3 font-bold">Party Name</th>
                  <th className="text-left px-4 py-3 font-bold w-1/4">Group</th>
                  <th className="text-right px-4 py-3 font-bold w-1/4">Outstanding (₹)</th>
                  <th className="text-center px-5 py-3 font-bold w-24">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {creditors.map(r => (
                  <tr key={r.ledger_id} className="hover:bg-purple-50/15 transition-colors align-top">
                    <td className="px-5 py-2.5 font-semibold text-slate-800">{r.ledger_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{r.group}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px] text-amber-700 font-bold">₹{fmt(r.outstanding)}</td>
                    <td className="px-5 py-2.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50/60 text-amber-700 border-amber-100">
                        {r.balance_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                <tr>
                  <td colSpan={2} className="px-5 py-3 text-slate-500 uppercase font-bold tracking-wider">
                    Total Payables
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] text-amber-800 font-bold border-l border-slate-100">
                    ₹{fmt(data?.total_payable)}
                  </td>
                  <td className="border-l border-slate-100" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Enterprise Pagination Footer ── */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 bg-slate-50/20 text-xs font-medium text-slate-500">
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
      )}

      {data && data.rows?.length === 0 && (
        <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
          <AlertTriangle size={36} className="text-slate-200 mx-auto mb-2" />
          <p className="text-xs font-semibold">No outstanding balances found</p>
        </div>
      )}
    </div>
  );
}
