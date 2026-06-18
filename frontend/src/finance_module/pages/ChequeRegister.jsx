import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { banking as bankingApi, ledgers as ledgersApi } from "../api";
import useCompanyStore from "../store/companyStore";
import { CreditCard, RefreshCw, CheckCircle, Clock, Filter } from "lucide-react";

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <CreditCard size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={24} color="var(--primary)" />
            Cheque Register
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Track all payment and receipt instruments across bank accounts
          </p>
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Bank Summary Cards */}
      {bankSummary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {bankSummary.map((b) => (
            <div key={b.name} className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeft: '4px solid #6366f1', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{b.total}</strong></span>
                <span style={{ color: '#10b981' }}>✓ {b.reconciled} cleared</span>
                <span style={{ color: '#f59e0b' }}>⏳ {b.pending} pending</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#6366f1' }}>₹ {fmt(b.totalAmount)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Table Card */}
      <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bank Account:</label>
            <div style={{ position: 'relative' }}>
              <Filter style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <select value={filterLedger} onChange={e => setFilterLedger(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 36, width: 200, cursor: 'pointer' }}>
                <option value="">All Banks</option>
                {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status:</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="cb-input"
              style={{ width: 150, cursor: 'pointer' }}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="reconciled">Cleared</option>
            </select>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} instruments</span>
        </div>

        {/* Cheque Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                {['Issue Date','Voucher','Payee / Narration','Bank','Reference No','Amount','Status','Bank Date'].map((h, i) => (
                  <th key={h} style={{ padding: '12px ' + (i === 0 ? '20px' : '16px'), fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: ['Amount'].includes(h) ? 'right' : ['Status','Bank Date'].includes(h) ? 'center' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading cheque register…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
                  No instruments found. Record Payment/Receipt vouchers to see them here.
                </td></tr>
              ) : filtered.map((c) => (
                <tr key={c.voucher_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{c.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{c.voucher_number}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.payee}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{c.bank_ledger_name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{c.reference_no || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>₹{fmt(c.amount)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 700, background: c.is_reconciled ? '#d1fae5' : '#fef3c7', color: c.is_reconciled ? '#047857' : '#b45309', border: `1px solid ${c.is_reconciled ? '#a7f3d0' : '#fde68a'}` }}>
                      {c.is_reconciled ? <><CheckCircle size={11}/> Cleared</> : <><Clock size={11}/> Pending</>}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
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
