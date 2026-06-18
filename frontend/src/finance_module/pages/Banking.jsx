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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Building2 size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view banking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} color="var(--primary)" />
            Banking Portal
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Monitor bank balances, reconcile statements, track cheques, and generate slips
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => refetch()} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
            Active: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeCompany.name}</span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {[
          { label: 'Total Bank Balance', value: `₹${fmt(totalBalance)}`, icon: TrendingUp, color: '#6366f1', border: '#6366f1' },
          { label: 'Unreconciled Items', value: totalUnreconciled, icon: ArrowLeftRight, color: '#14b8a6', border: '#14b8a6' },
          { label: 'Bank Accounts', value: bankAccounts.length, icon: CreditCard, color: '#ec4899', border: '#ec4899' },
          { label: 'Recent Transactions', value: unreconciledAll.length, icon: FileText, color: '#3b82f6', border: '#3b82f6' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', borderLeft: `4px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color }}>{value}</p>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: color + '15', color }}>
              <Icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'Bank Reconcile', icon: ArrowLeftRight, path: '/banking/activities', color: '#6366f1' },
          { label: 'Cheque Register', icon: CreditCard, path: '/banking/cheque-register', color: '#3b82f6' },
          { label: 'Cheque Printing', icon: Printer, path: '/banking/cheque-printing', color: '#10b981' },
          { label: 'Deposit Slips', icon: FileText, path: '/banking/deposit-slip', color: '#f59e0b' },
          { label: 'Payment Advices', icon: FileText, path: '/banking/payment-advice', color: '#8b5cf6' },
        ].map(({ label, icon: Icon, path, color }) => (
          <button key={path} onClick={() => navigate(path)}
            className="card"
            style={{ textAlign: 'center', padding: 20, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = color + '60'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ padding: 10, borderRadius: 10, background: color + '15', color }}>
              <Icon size={20} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1.5fr' }}>
        {/* Left: Bank Accounts */}
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>Bank Accounts</h3>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Loading bank accounts…</p>
            ) : bankAccounts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No bank accounts found. Add ledgers under "Bank Accounts" group.</p>
            ) : (
              bankAccounts.map((account) => (
                <div key={account.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 8, background: '#6366f115', color: '#6366f1', borderRadius: 8 }}>
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{account.name}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{account.group}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: account.balance >= 0 ? 'var(--text-primary)' : '#ef4444' }}>
                      ₹{fmt(Math.abs(account.balance))}
                    </span>
                    {account.unreconciled_count > 0 && (
                      <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginTop: 2 }}>
                        {account.unreconciled_count} unreconciled
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Unreconciled */}
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>Unreconciled & Recent Activities</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Particulars</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Bank</th>
                </tr>
              </thead>
              <tbody>
                {unreconciledAll.slice(0, 8).map((txn) => (
                  <tr key={txn.voucher_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{txn.date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.particulars || txn.voucher_number}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>Ref: {txn.reference_no || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: 13, color: txn.txn_type === 'Debit' ? '#ef4444' : '#10b981' }}>
                      {txn.txn_type === 'Credit' ? '+' : '-'}₹{fmt(txn.total_amount)}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                        Unreconciled
                      </span>
                    </td>
                  </tr>
                ))}
                {unreconciledAll.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>All transactions reconciled ✓</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {unreconciledAll.length > 8 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => navigate('/banking/activities')} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
                View all {unreconciledAll.length} unreconciled →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
