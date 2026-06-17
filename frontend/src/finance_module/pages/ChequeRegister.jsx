import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { banking as bankingApi, ledgers as ledgersApi } from "../api";
import useCompanyStore from "../store/companyStore";
import { CreditCard, RefreshCw, CheckCircle, Clock } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n || 0);

export default function ChequeRegister() {
  const { activeCompany } = useCompanyStore();
  const [filterLedger, setFilterLedger] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: bankLedgers = [] } = useQuery({
    queryKey: ['banking-ledgers', activeCompany?.id],
    queryFn:  () => ledgersApi.list({ company_id: activeCompany.id, group: 'Bank Accounts' }),
    enabled:  !!activeCompany,
  });

  const { data: allCheques = [], isLoading, refetch } = useQuery({
    queryKey: ['cheque-register', activeCompany?.id, filterLedger],
    queryFn:  () => bankingApi.cheques({
      company_id:    activeCompany.id,
      bank_ledger_id: filterLedger || undefined,
    }),
    enabled:  !!activeCompany,
  });

  const filtered = allCheques.filter(c => {
    if (filterStatus === 'reconciled') return c.is_reconciled;
    if (filterStatus === 'pending')    return !c.is_reconciled;
    return true;
  });

  // Aggregate by bank account
  const bankSummary = bankLedgers.map(l => {
    const bankCheques = allCheques.filter(c => c.bank_ledger_id === l.id);
    return {
      name: l.name,
      total: bankCheques.length,
      reconciled: bankCheques.filter(c => c.is_reconciled).length,
      pending: bankCheques.filter(c => !c.is_reconciled).length,
      totalAmount: bankCheques.reduce((s, c) => s + (c.amount || 0), 0),
    };
  }).filter(s => s.total > 0);

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <CreditCard size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Cheque Register</h1>
            <p className="cb-page-subtitle">Track all payment and receipt instruments across bank accounts</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="cb-btn-secondary text-xs py-1.5 px-3">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Bank Summary Cards */}
      {bankSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankSummary.map((b) => (
            <div key={b.name} className="cb-stat-card border-l-4 border-l-purple-500">
              <h4 className="font-bold text-slate-800 text-sm mb-2">{b.name}</h4>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Total: <strong className="text-slate-700">{b.total}</strong></span>
                <span className="text-green-600">✓ {b.reconciled} cleared</span>
                <span className="text-amber-600">⏳ {b.pending} pending</span>
              </div>
              <div className="mt-3 font-mono font-bold text-purple-700">₹ {fmt(b.totalAmount)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 cb-card">
        <div className="flex items-center gap-2">
          <label className="cb-label text-xs">Bank Account:</label>
          <select value={filterLedger} onChange={e => setFilterLedger(e.target.value)}
            className="cb-input py-1 px-2 text-xs max-w-[200px]">
            <option value="">All Banks</option>
            {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="cb-label text-xs">Status:</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="cb-input py-1 px-2 text-xs max-w-[150px]">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reconciled">Cleared</option>
          </select>
        </div>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} instruments</span>
      </div>

      {/* Cheque Table */}
      <div className="cb-card">
        <div className="overflow-x-auto max-h-[55vh] relative">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Issue Date</th>
                <th className="text-left px-4 py-3 font-bold">Voucher</th>
                <th className="text-left px-4 py-3 font-bold">Payee / Narration</th>
                <th className="text-left px-4 py-3 font-bold">Bank</th>
                <th className="text-left px-4 py-3 font-bold">Reference No</th>
                <th className="text-right px-4 py-3 font-bold">Amount</th>
                <th className="text-center px-4 py-3 font-bold">Status</th>
                <th className="text-center px-5 py-3 font-bold">Bank Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr><td colSpan="8" className="py-12 text-center text-slate-400 animate-pulse">Loading cheque register…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                  No instruments found. Record Payment/Receipt vouchers to see them here.
                </td></tr>
              ) : filtered.map((c) => (
                <tr key={c.voucher_id} className="hover:bg-purple-50/15 transition-colors align-top">
                  <td className="px-5 py-2.5 font-mono text-slate-500">{c.date}</td>
                  <td className="px-4 py-2.5 font-semibold text-purple-700">{c.voucher_number}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800 truncate max-w-[180px]">{c.payee}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.bank_ledger_name}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{c.reference_no || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">₹{fmt(c.amount)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${
                      c.is_reconciled
                        ? 'bg-green-50 text-green-700 border-green-150'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {c.is_reconciled ? <><CheckCircle size={10}/> Cleared</> : <><Clock size={10}/> Pending</>}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-center font-mono text-slate-400">
                    {c.bank_date || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
