import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { BookOpen, Search, Filter, Calendar } from 'lucide-react';

const TYPE_STYLE = {
  Sales:       { bg: 'bg-indigo-50/60',   text: 'text-indigo-700',   border: 'border-indigo-100' },
  Purchase:    { bg: 'bg-purple-50/60',   text: 'text-purple-700',   border: 'border-purple-100' },
  Receipt:     { bg: 'bg-emerald-50/60',  text: 'text-emerald-700',  border: 'border-emerald-100' },
  Payment:     { bg: 'bg-amber-50/60',    text: 'text-amber-700',    border: 'border-amber-100' },
  Journal:     { bg: 'bg-slate-50',       text: 'text-slate-700',    border: 'border-slate-200' },
  Contra:      { bg: 'bg-sky-50/60',      text: 'text-sky-700',      border: 'border-sky-100' },
  'Debit Note':  { bg: 'bg-rose-50/60',     text: 'text-rose-700',     border: 'border-rose-100' },
  'Credit Note': { bg: 'bg-emerald-50/60',  text: 'text-emerald-700',  border: 'border-emerald-100' },
};

const VOUCHER_TYPES = ['Contra','Payment','Receipt','Journal','Sales','Purchase','Debit Note','Credit Note'];

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const DayBook = () => {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || '');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherType, setVoucherType] = useState('');

  useEffect(() => {
    if (activeFy) {
      setFromDate(activeFy.start_date || '');
      setToDate(activeFy.end_date || new Date().toISOString().split('T')[0]);
    }
  }, [activeFy]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['day-book', activeCompany?.id, fromDate, toDate, voucherType],
    queryFn: () => reports.dayBook({
      company_id: activeCompany.id,
      from_date: fromDate,
      to_date: toDate,
      voucher_type: voucherType || undefined
    }),
    enabled: !!activeCompany && !!fromDate && !!toDate
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Day Book.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Day Book</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              View all transaction histories and postings for a specific period
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            FY: {activeFy?.label || 'Not set'} &nbsp;·&nbsp; {report?.vouchers?.length || 0} transactions
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            {/* Period Filters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="relative w-full sm:w-36 shrink-0">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
              <span className="hidden sm:inline text-slate-400 text-[13px] font-semibold">to</span>
              <div className="relative w-full sm:w-36 shrink-0">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
            </div>

            {/* Type Select Dropdown */}
            <div className="relative w-full sm:w-48 shrink-0">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select 
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 appearance-none cursor-pointer"
              >
                <option value="">All Voucher Types</option>
                {VOUCHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
            </div>

            {/* Clear Filters Button */}
            {(voucherType) && (
              <button
                onClick={() => setVoucherType('')}
                className="text-[13px] text-purple-600 hover:text-purple-800 font-semibold px-3 py-2 hover:bg-purple-50 rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-[13px] text-slate-500 font-medium">
            Showing <span className="text-slate-800 font-bold">{report?.vouchers?.length || 0}</span> entries
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto max-h-[55vh] relative">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
              <tr>
                <th className="text-left px-5 py-3 font-bold w-24">Date</th>
                <th className="text-left px-4 py-3 font-bold w-32">Voucher No.</th>
                <th className="text-left px-4 py-3 font-bold w-28">Type</th>
                <th className="text-left px-4 py-3 font-bold">Particulars</th>
                <th className="text-right px-4 py-3 font-bold w-32">Debit (₹)</th>
                <th className="text-right px-5 py-3 font-bold w-32">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading transactions…
                  </td>
                </tr>
              ) : report?.vouchers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <BookOpen size={36} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-semibold">No transactions found</p>
                  </td>
                </tr>
              ) : (
                report?.vouchers?.map((v) => {
                  const ts = TYPE_STYLE[v.voucher_type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                  return (
                    <tr key={v.id} className="hover:bg-purple-50/15 transition-colors align-top">
                      <td className="px-5 py-3 text-slate-500 font-medium whitespace-nowrap">{v.date}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{v.voucher_number}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${ts.bg} ${ts.text} ${ts.border}`}>
                          {v.voucher_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="space-y-1">
                          {v.entries.map((e, i) => (
                            <div key={i} className="flex justify-between text-xs py-0.5">
                              <span className={e.dr_amount > 0 ? "font-semibold text-slate-800" : "ml-4 text-slate-500 font-medium"}>
                                {e.dr_amount > 0 ? "By " : "To "}{e.ledger_name}
                              </span>
                            </div>
                          ))}
                        </div>
                        {v.narration && (
                          <div className="mt-2 text-[11px] text-slate-400 font-normal italic bg-slate-50 p-2 rounded max-w-lg">
                            {v.narration}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[13px] text-slate-700 font-medium">
                        <div className="space-y-1">
                          {v.entries.map((e, i) => (
                            <div key={i} className="h-5">
                              {e.dr_amount > 0 ? `₹${fmt(e.dr_amount)}` : ''}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[13px] text-slate-700 font-medium">
                        <div className="space-y-1">
                          {v.entries.map((e, i) => (
                            <div key={i} className="h-5">
                              {e.cr_amount > 0 ? `₹${fmt(e.cr_amount)}` : ''}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Grand Total footer */}
            {report?.vouchers?.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
                <tr>
                  <td colSpan="4" className="px-6 py-3 text-left text-slate-500 font-bold uppercase tracking-wider">
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] text-slate-900 font-bold">
                    ₹{fmt(report?.grand_total_dr)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[13px] text-slate-900 font-bold border-l border-slate-100">
                    ₹{fmt(report?.grand_total_cr)}
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
};

export default DayBook;
