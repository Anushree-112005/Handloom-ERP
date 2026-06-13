import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports, ledgers as ledgersApi } from '../api';
import useCompanyStore from '../store/companyStore';
import { BookMarked, Download, Calendar, Filter } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fyStart = `${new Date().getFullYear()}-04-01`;
const today   = new Date().toISOString().split('T')[0];

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

export default function LedgerReport() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [ledgerId, setLedgerId] = useState('');
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate, setToDate]     = useState(activeFy?.end_date || today);

  const { data: ledgerList = [] } = useQuery({
    queryKey: ['ledgers', activeCompany?.id],
    queryFn: () => ledgersApi.list({ company_id: activeCompany.id }),
    enabled: !!activeCompany,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ledger-statement', ledgerId, fromDate, toDate],
    queryFn:  () => reports.ledgerStatement({ company_id: activeCompany.id, ledger_id: ledgerId, from_date: fromDate, to_date: toDate }),
    enabled:  !!activeCompany && !!ledgerId,
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Ledger Report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="btn btn-primary">
            <BookMarked size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Ledger Report</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Detailed transaction statement and reconciliation for an account
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            FY: {activeFy?.label || 'Not set'} &nbsp;·&nbsp; {data?.transactions?.length || 0} ledger postings
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="cb-card">
        {/* Toolbar */}
        <div className="btn btn-secondary">
          <div className="flex flex-wrap items-center gap-3">
            {/* Ledger Select Dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
              <select 
                value={ledgerId}
                onChange={(e) => setLedgerId(e.target.value)}
                className="btn btn-secondary"
              >
                <option value="">— Select Ledger —</option>
                {ledgerList.map(l => <option key={l.id} value={l.id}>{l.name} ({l.group})</option>)}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[8px]">▼</div>
            </div>

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
          </div>

          <button 
            onClick={() => data && exportToPDF({ title: 'Ledger Report', companyName: activeCompany.name, period: `${fromDate} to ${toDate}`, data, reportType: 'ledger' })}
            className="btn btn-secondary"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>

        {!ledgerId && (
          <div className="py-20 text-center text-slate-400">
            <BookMarked size={36} className="text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-semibold">Select a ledger from the list to view statement</p>
          </div>
        )}

        {ledgerId && (
          <div className="flex flex-col">
            {/* Ledger Info Summary Panel */}
            {data && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3.5 bg-amber-50/50 border-b border-amber-100/50">
                <div>
                  <span className="font-bold text-slate-800 text-sm">{data.ledger_name}</span>
                  <span className="btn btn-secondary">{data.group}</span>
                </div>
                <div className="flex items-center gap-8 text-xs font-medium">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-400">Opening Balance</p>
                    <p className="font-mono font-bold text-slate-700 mt-0.5">
                      ₹{fmt(data.opening_balance)} <span className="text-[9px] text-slate-400 uppercase font-semibold">{data.opening_type}</span>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-400">Closing Balance</p>
                    <p className="font-mono font-bold text-purple-700 mt-0.5">
                      ₹{fmt(data.closing_balance)} <span className="text-[9px] text-purple-500 uppercase font-semibold">{data.closing_type}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Table or Grid */}
            <div className="overflow-x-auto max-h-[50vh] relative">
              <div className="w-full text-xs min-w-[800px]">
                {/* Table Header Grid */}
                <div className="btn btn-secondary">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Voucher No.</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Narration</div>
                  <div className="col-span-1 text-right">Debit (₹)</div>
                  <div className="col-span-1 text-right">Credit (₹)</div>
                  <div className="col-span-1 text-right">Balance (₹)</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <div className="py-12 text-center text-slate-400 animate-pulse font-medium">
                      Loading transactions statement…
                    </div>
                  ) : data?.transactions?.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 font-semibold">
                      No transactions in this period
                    </div>
                  ) : (
                    data?.transactions?.map((row, i) => {
                      const ts = TYPE_STYLE[row.voucher_type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                      return (
                        <div key={i} className="btn btn-primary">
                          <div className="col-span-2 text-slate-500 font-medium whitespace-nowrap">{row.date}</div>
                          <div className="col-span-2 font-mono font-bold text-slate-800">{row.voucher_number}</div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${ts.bg} ${ts.text} ${ts.border}`}>
                              {row.voucher_type}
                            </span>
                          </div>
                          <div className="col-span-3 text-slate-500 font-medium truncate pr-4" title={row.narration}>
                            {row.narration || '—'}
                          </div>
                          <div className="col-span-1 text-right font-mono text-[13px] text-slate-700 font-medium">
                            {row.dr_amount > 0 ? `₹${fmt(row.dr_amount)}` : '—'}
                          </div>
                          <div className="col-span-1 text-right font-mono text-[13px] text-slate-700 font-medium">
                            {row.cr_amount > 0 ? `₹${fmt(row.cr_amount)}` : '—'}
                          </div>
                          <div className="col-span-1 text-right font-mono text-[13px] text-slate-800 font-bold">
                            ₹{fmt(row.balance)} &nbsp;
                            <span className="text-[9px] text-slate-400 uppercase font-semibold">{row.balance_type}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Table Footer */}
                {data && data?.transactions?.length > 0 && (
                  <div className="btn btn-secondary">
                    <div className="col-span-9 text-slate-500 font-bold uppercase tracking-wider">
                      Period Totals
                    </div>
                    <div className="col-span-1 text-right font-mono text-[13px] text-emerald-700 font-bold">
                      ₹{fmt(data.period_dr)}
                    </div>
                    <div className="btn btn-secondary">
                      ₹{fmt(data.period_cr)}
                    </div>
                    <div className="btn btn-secondary">
                      ₹{fmt(data.closing_balance)} <span className="text-[9px] text-slate-400 uppercase font-semibold">{data.closing_type}</span>
                    </div>
                  </div>
                )}
              </div>
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
      </div>
    </div>
  );
}
