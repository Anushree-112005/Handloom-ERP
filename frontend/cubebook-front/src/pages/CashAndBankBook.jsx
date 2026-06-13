import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { DollarSign, CreditCard, Download, Calendar } from 'lucide-react';

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

function CashBookTab({ companyId, activeFy }) {
  const [from, setFrom] = useState(activeFy?.start_date || fyStart);
  const [to,   setTo]   = useState(activeFy?.end_date || today);

  const { data, isLoading } = useQuery({
    queryKey: ['cash-book', companyId, from, to],
    queryFn:  () => reports.cashBook({ company_id: companyId, from_date: from, to_date: to }),
    enabled:  !!companyId,
  });

  return (
    <div className="cb-card">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
            <span className="text-slate-400 text-xs font-semibold">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        {data && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium self-start md:self-auto">
            <div className="text-left md:text-right border-r border-slate-100 pr-4">
              <p className="text-[10px] text-slate-400">Opening Balance</p>
              <p className="font-mono font-bold text-slate-700 mt-0.5">₹{fmt(data.opening_balance)}</p>
            </div>
            <div className="text-left md:text-right border-r border-slate-100 pr-4">
              <p className="text-[10px] text-slate-400 font-semibold text-slate-500">Total Receipts</p>
              <p className="font-mono font-bold text-emerald-600 mt-0.5">₹{fmt(data.total_receipts)}</p>
            </div>
            <div className="text-left md:text-right border-r border-slate-100 pr-4">
              <p className="text-[10px] text-slate-400 font-semibold text-slate-500">Total Payments</p>
              <p className="font-mono font-bold text-rose-600 mt-0.5">₹{fmt(data.total_payments)}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] text-slate-400">Closing Balance</p>
              <p className="font-mono font-bold text-purple-700 mt-0.5">₹{fmt(data.closing_balance)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[50vh] relative">
        <div className="w-full text-xs min-w-[800px]">
          {/* Table Header Grid */}
          <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 py-3 px-5 tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Voucher No.</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-4">Narration</div>
            <div className="col-span-1 text-right">Receipts (₹)</div>
            <div className="col-span-1 text-right">Payments (₹)</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 animate-pulse font-medium">
                Loading cash book statement…
              </div>
            ) : data?.transactions?.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-semibold">
                No cash transactions in this period
              </div>
            ) : (
              data?.transactions?.map((row, i) => {
                const ts = TYPE_STYLE[row.voucher_type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                return (
                  <div key={i} className="grid grid-cols-12 text-xs py-2.5 px-5 hover:bg-purple-50/15 transition-colors align-top items-center">
                    <div className="col-span-2 text-slate-500 font-medium whitespace-nowrap">{row.date}</div>
                    <div className="col-span-2 font-mono font-bold text-slate-800">{row.voucher_number}</div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${ts.bg} ${ts.text} ${ts.border}`}>
                        {row.voucher_type}
                      </span>
                    </div>
                    <div className="col-span-4 text-slate-500 font-medium truncate pr-4" title={row.narration}>
                      {row.narration || '—'}
                    </div>
                    <div className="col-span-1 text-right font-mono text-[13px] text-emerald-700 font-bold">
                      {row.receipts > 0 ? `₹${fmt(row.receipts)}` : '—'}
                    </div>
                    <div className="col-span-1 text-right font-mono text-[13px] text-rose-700 font-bold border-l border-slate-100">
                      {row.payments > 0 ? `₹${fmt(row.payments)}` : '—'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer */}
          {data && data?.transactions?.length > 0 && (
            <div className="grid grid-cols-12 text-xs font-bold text-slate-800 bg-slate-50/80 border-t-2 border-slate-200 py-3 px-5 sticky bottom-0">
              <div className="col-span-10 text-slate-500 font-bold uppercase tracking-wider">
                Closing Balance
              </div>
              <div className="col-span-1 text-right font-mono text-[13px] text-emerald-700 font-bold">
                ₹{fmt(data.total_receipts)}
              </div>
              <div className="col-span-1 text-right font-mono text-[13px] text-indigo-700 font-bold border-l border-slate-100">
                ₹{fmt(data.total_payments)}
              </div>
            </div>
          )}
        </div>
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
  );
}

function BankBookTab({ companyId, activeFy }) {
  const [from, setFrom] = useState(activeFy?.start_date || fyStart);
  const [to,   setTo]   = useState(activeFy?.end_date || today);

  const { data, isLoading } = useQuery({
    queryKey: ['bank-book', companyId, from, to],
    queryFn:  () => reports.bankBook({ company_id: companyId, from_date: from, to_date: to }),
    enabled:  !!companyId,
  });

  return (
    <div className="cb-card">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
            <span className="text-slate-400 text-xs font-semibold">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input 
                type="date" 
                value={to}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        {data && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium self-start md:self-auto">
            <div className="text-left md:text-right border-r border-slate-100 pr-4">
              <p className="text-[10px] text-slate-400">Total Deposits</p>
              <p className="font-mono font-bold text-emerald-600 mt-0.5">₹{fmt(data.total_deposits)}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] text-slate-400 font-semibold text-slate-500">Total Withdrawals</p>
              <p className="font-mono font-bold text-rose-600 mt-0.5">₹{fmt(data.total_withdrawals)}</p>
            </div>
          </div>
        )}
      </div>

      {data?.banks?.length > 0 && (
        <div className="flex gap-2 flex-wrap px-5 py-2.5 border-b border-slate-100 bg-blue-50/10">
          {data.banks.map(b => (
            <span key={b.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100/60 rounded-lg text-[10px] font-bold">
              🏦 {b.name}
            </span>
          ))}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[50vh] relative">
        <div className="w-full text-xs min-w-[900px]">
          {/* Table Header Grid */}
          <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 py-3 px-5 tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Voucher No.</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-2">Bank</div>
            <div className="col-span-1">Ref No.</div>
            <div className="col-span-2">Narration</div>
            <div className="col-span-1 text-right">Deposits (₹)</div>
            <div className="col-span-1 text-right">Withdrawals (₹)</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 animate-pulse font-medium">
                Loading bank book statement…
              </div>
            ) : data?.transactions?.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-semibold">
                No bank transactions in this period
              </div>
            ) : (
              data?.transactions?.map((row, i) => {
                const ts = TYPE_STYLE[row.voucher_type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                return (
                  <div key={i} className="grid grid-cols-12 text-xs py-2.5 px-5 hover:bg-purple-50/15 transition-colors align-top items-center">
                    <div className="col-span-2 text-slate-500 font-medium whitespace-nowrap">{row.date}</div>
                    <div className="col-span-2 font-mono font-bold text-slate-800">{row.voucher_number}</div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${ts.bg} ${ts.text} ${ts.border}`}>
                        {row.voucher_type}
                      </span>
                    </div>
                    <div className="col-span-2 text-slate-600 font-semibold">{row.bank_name}</div>
                    <div className="col-span-1 text-slate-400 font-mono text-[10px]">{row.reference_no || '—'}</div>
                    <div className="col-span-2 text-slate-500 font-medium truncate pr-4" title={row.narration}>
                      {row.narration || '—'}
                    </div>
                    <div className="col-span-1 text-right font-mono text-[13px] text-emerald-700 font-bold">
                      {row.deposits > 0 ? `₹${fmt(row.deposits)}` : '—'}
                    </div>
                    <div className="col-span-1 text-right font-mono text-[13px] text-rose-700 font-bold border-l border-slate-100">
                      {row.withdrawals > 0 ? `₹${fmt(row.withdrawals)}` : '—'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer */}
          {data && data?.transactions?.length > 0 && (
            <div className="grid grid-cols-12 text-xs font-bold text-slate-800 bg-slate-50/80 border-t-2 border-slate-200 py-3 px-5 sticky bottom-0">
              <div className="col-span-10 text-slate-500 font-bold uppercase tracking-wider">
                Totals
              </div>
              <div className="col-span-1 text-right font-mono text-[13px] text-emerald-700 font-bold">
                ₹{fmt(data.total_deposits)}
              </div>
              <div className="col-span-1 text-right font-mono text-[13px] text-indigo-700 font-bold border-l border-slate-100">
                ₹{fmt(data.total_withdrawals)}
              </div>
            </div>
          )}
        </div>
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
  );
}

export default function CashAndBankBook({ defaultTab = 'cash' }) {
  const { activeCompany, activeFy } = useCompanyStore();
  const [tab, setTab] = useState(defaultTab);

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view Cash & Bank Book.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            {tab === 'cash' ? <DollarSign size={18} /> : <CreditCard size={18} />}
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">
              {tab === 'cash' ? 'Cash Book' : 'Bank Book'}
            </h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Statement of all cash accounts and banking ledger transactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Action Tabs Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
            <button 
              onClick={() => setTab('cash')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${tab === 'cash' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <DollarSign size={11} /> Cash
            </button>
            <button 
              onClick={() => setTab('bank')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${tab === 'bank' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <CreditCard size={11} /> Bank
            </button>
          </div>

          <button className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {tab === 'cash' && <CashBookTab companyId={activeCompany.id} activeFy={activeFy} />}
      {tab === 'bank' && <BankBookTab companyId={activeCompany.id} activeFy={activeFy} />}
    </div>
  );
}
