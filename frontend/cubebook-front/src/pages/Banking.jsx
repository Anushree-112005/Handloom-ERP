import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { banking as bankingApi } from "../api";
import useCompanyStore from "../store/companyStore";
import {
  Building2, CreditCard, ArrowLeftRight, Printer, FileText,
  TrendingUp, ArrowUpRight, TrendingDown, RefreshCw,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n || 0);

export default function Banking() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();

  const { data: bankAccounts = [], isLoading, refetch } = useQuery({
    queryKey: ['banking-accounts', activeCompany?.id],
    queryFn: () => bankingApi.accounts(activeCompany.id),
    enabled: !!activeCompany,
  });

  const { data: unreconciledAll = [] } = useQuery({
    queryKey: ['banking-unreconciled', activeCompany?.id],
    queryFn: () => bankingApi.unreconciled({ company_id: activeCompany.id }),
    enabled: !!activeCompany,
  });

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalUnreconciled = bankAccounts.reduce((sum, acc) => sum + (acc.unreconciled_count || 0), 0);

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Building2 size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to view banking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Banking Portal</h1>
            <p className="cb-page-subtitle">Monitor bank balances, reconcile statements, track cheques, and generate slips</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="cb-btn-secondary text-xs py-1.5 px-3">
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="btn btn-secondary">
            Active: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="form-row">
        <div className="cb-stat-card border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <p className="cb-stat-label">Total Bank Balance</p>
            <p className="cb-stat-value text-purple-700">₹{fmt(totalBalance)}</p>
          </div>
          <div className="btn btn-primary"><TrendingUp size={20} /></div>
        </div>

        <div className="cb-stat-card border-l-4 border-l-teal-500 flex items-center justify-between">
          <div>
            <p className="cb-stat-label">Unreconciled Items</p>
            <p className="cb-stat-value text-teal-700">{totalUnreconciled}</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><ArrowLeftRight size={20} /></div>
        </div>

        <div className="cb-stat-card border-l-4 border-l-pink-500 flex items-center justify-between">
          <div>
            <p className="cb-stat-label">Bank Accounts</p>
            <p className="cb-stat-value text-pink-700">{bankAccounts.length}</p>
          </div>
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl"><CreditCard size={20} /></div>
        </div>

        <div className="cb-stat-card border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <p className="cb-stat-label">Recent Transactions</p>
            <p className="cb-stat-value text-blue-700">{unreconciledAll.length}</p>
          </div>
          <div className="btn btn-primary"><FileText size={20} /></div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="form-row">
        {[
          { label: 'Bank Reconcile', icon: ArrowLeftRight, path: '/banking/activities' },
          { label: 'Cheque Register', icon: CreditCard, path: '/banking/cheque-register' },
          { label: 'Cheque Printing', icon: Printer, path: '/banking/cheque-printing' },
          { label: 'Deposit Slips', icon: FileText, path: '/banking/deposit-slip' },
          { label: 'Payment Advices', icon: FileText, path: '/banking/payment-advice', spanTwo: true },
        ].map(({ label, icon: Icon, path, spanTwo }) => (
          <button key={path} onClick={() => navigate(path)}
            className={`cb-card p-4 hover:border-purple-300 hover:bg-purple-50/10 text-center flex flex-col items-center gap-2 transition-all cursor-pointer group ${spanTwo ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
            <div className="btn btn-primary">
              <Icon size={18} />
            </div>
            <span className="text-xs font-bold text-slate-700">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Bank Accounts */}
        <div className="lg:col-span-5 cb-card p-6 space-y-4">
          <h3 className="btn btn-secondary">Bank Accounts</h3>
          {isLoading ? (
            <p className="text-slate-400 text-sm animate-pulse text-center py-8">Loading bank accounts…</p>
          ) : bankAccounts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No bank accounts found. Add ledgers under "Bank Accounts" group.</p>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="btn btn-secondary">
                  <div className="flex items-center gap-3">
                    <div className="btn btn-primary"><Building2 size={16} /></div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{account.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{account.group}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${account.balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                      ₹{fmt(Math.abs(account.balance))}
                    </span>
                    {account.unreconciled_count > 0 && (
                      <span className="block text-[9px] uppercase font-bold text-amber-600 mt-0.5">
                        {account.unreconciled_count} unreconciled
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Unreconciled */}
        <div className="lg:col-span-7 cb-card p-6 space-y-4">
          <h3 className="btn btn-secondary">Unreconciled & Recent Activities</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="btn btn-secondary">
                  <th className="py-2.5 cb-th">Date</th>
                  <th className="py-2.5 cb-th">Particulars</th>
                  <th className="py-2.5 cb-th text-right">Amount</th>
                  <th className="py-2.5 cb-th text-center">Bank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unreconciledAll.slice(0, 8).map((txn) => (
                  <tr key={txn.voucher_id} className="btn btn-secondary">
                    <td className="py-3 cb-td font-mono text-[11px]">{txn.date}</td>
                    <td className="py-3 cb-td">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">{txn.particulars || txn.voucher_number}</div>
                      <div className="text-[9px] text-slate-400 font-mono">Ref: {txn.reference_no || '—'}</div>
                    </td>
                    <td className={`py-3 cb-td text-right font-bold font-mono ${txn.txn_type === 'Debit' ? 'text-red-500' : 'text-green-600'}`}>
                      {txn.txn_type === 'Credit' ? '+' : '-'}₹{fmt(txn.total_amount)}
                    </td>
                    <td className="py-3 cb-td text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        Unreconciled
                      </span>
                    </td>
                  </tr>
                ))}
                {unreconciledAll.length === 0 && (
                  <tr><td colSpan="4" className="py-8 text-center text-slate-400">All transactions reconciled ✓</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {unreconciledAll.length > 8 && (
            <button onClick={() => navigate('/banking/activities')}
              className="text-xs text-purple-600 font-semibold hover:underline">
              View all {unreconciledAll.length} unreconciled →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
