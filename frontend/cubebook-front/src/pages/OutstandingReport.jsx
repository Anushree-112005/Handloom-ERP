import { useState } from 'react';
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
          <div className="btn btn-primary">
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
                className="btn btn-secondary"
              />
            </div>
          </div>

          {/* Party type select */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
            <select 
              value={partyType}
              onChange={(e) => setPartyType(e.target.value)}
              className="btn btn-secondary"
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
              className="btn btn-primary"
            >
              Reset Filters
            </button>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Outstanding Report', companyName: activeCompany.name, period: `As of ${asOf}`, data: { items: partyType === 'debtor' ? debtors : partyType === 'creditor' ? creditors : data.rows }, reportType: 'outstanding' })}
          className="btn btn-secondary"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      {data && (
        <div className="form-row">
          <div className="btn btn-primary">
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
          <div className="btn btn-primary">
            <ArrowUpRight size={15} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-800">Receivables — Sundry Debtors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="text-left px-5 py-3 font-bold">Party Name</th>
                  <th className="text-left px-4 py-3 font-bold w-1/4">Group</th>
                  <th className="text-right px-4 py-3 font-bold w-1/4">Outstanding (₹)</th>
                  <th className="text-center px-5 py-3 font-bold w-24">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {debtors.map(r => (
                  <tr key={r.ledger_id} className="btn btn-primary">
                    <td className="px-5 py-2.5 font-semibold text-slate-800">{r.ledger_name}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{r.group}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px] text-blue-700 font-bold">₹{fmt(r.outstanding)}</td>
                    <td className="px-5 py-2.5 text-center">
                      <span className="btn btn-primary">
                        {r.balance_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="btn btn-secondary">
                <tr>
                  <td colSpan={2} className="px-5 py-3 text-slate-500 uppercase font-bold tracking-wider">
                    Total Receivables
                  </td>
                  <td className="btn btn-secondary">
                    ₹{fmt(data?.total_receivable)}
                  </td>
                  <td className="btn btn-secondary" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Enterprise Pagination Footer ── */}
          <div className="btn btn-secondary">
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
                <button disabled className="btn btn-secondary">
                  Previous
                </button>
                <button disabled className="btn btn-secondary">
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
          <div className="btn btn-secondary">
            <ArrowDownLeft size={15} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-800">Payables — Sundry Creditors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="text-left px-5 py-3 font-bold">Party Name</th>
                  <th className="text-left px-4 py-3 font-bold w-1/4">Group</th>
                  <th className="text-right px-4 py-3 font-bold w-1/4">Outstanding (₹)</th>
                  <th className="text-center px-5 py-3 font-bold w-24">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {creditors.map(r => (
                  <tr key={r.ledger_id} className="hover:bg-amber-50/10 transition-colors">
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
              <tfoot className="btn btn-secondary">
                <tr>
                  <td colSpan={2} className="px-5 py-3 text-slate-500 uppercase font-bold tracking-wider">
                    Total Payables
                  </td>
                  <td className="btn btn-secondary">
                    ₹{fmt(data?.total_payable)}
                  </td>
                  <td className="btn btn-secondary" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Enterprise Pagination Footer ── */}
          <div className="btn btn-secondary">
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
                <button disabled className="btn btn-secondary">
                  Previous
                </button>
                <button disabled className="btn btn-secondary">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {data && data.rows?.length === 0 && (
        <div className="btn btn-secondary">
          <AlertTriangle size={36} className="text-slate-200 mx-auto mb-2" />
          <p className="text-xs font-semibold">No outstanding balances found</p>
        </div>
      )}
    </div>
  );
}
