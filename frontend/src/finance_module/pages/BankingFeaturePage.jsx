import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { banking as bankingApi, ledgers as ledgersApi } from '../api';
import useCompanyStore from '../store/companyStore';
import {
  ArrowLeft, ArrowLeftRight, Printer, FileText, Clock,
  Download, Upload, Check, CheckCircle, AlertCircle, Briefcase,
  Building2, CreditCard, Calendar, Banknote, Info,
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n || 0);

/* ─── Page meta config ─── */
const PAGE_META = {
  activities:          { title: 'Bank Reconciliation',        subtitle: 'Match ledger entries with bank statement clear dates',              icon: ArrowLeftRight, color: '#6366f1' },
  'imported-data':     { title: 'Imported Bank Statement',    subtitle: 'View and map imported electronic bank statements to ledgers',        icon: Download,       color: '#3b82f6' },
  'cheque-printing':   { title: 'Cheque Printing Portal',     subtitle: 'Configure layouts and print physical cheque leaves for pending vouchers', icon: Printer,      color: '#10b981' },
  'post-dated-summary':{ title: 'Post-Dated Transactions',    subtitle: 'Monitor scheduled checks and post-dated deposit vouchers',           icon: Clock,          color: '#f59e0b' },
  'deposit-slip':      { title: 'Deposit Slip Generator',     subtitle: 'Create and print Cash or Cheque bank deposit slips',                icon: Banknote,       color: '#8b5cf6' },
  'payment-advice':    { title: 'Payment Advice Register',    subtitle: 'Generate and send formal payment notifications to suppliers',        icon: FileText,       color: '#ec4899' },
};

/* ─── Status Badge ─── */
function StatusBadge({ cleared, label, date }) {
  return cleared ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#d1fae5', color: '#047857', border: '1px solid #a7f3d0' }}>
      <CheckCircle size={11} /> {date || 'Cleared'}
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
      <Clock size={11} /> {label || 'Pending'}
    </span>
  );
}

/* ─── Section card wrapper ─── */
function SectionCard({ children, noPad }) {
  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      ...(noPad ? {} : {}),
    }}>
      {children}
    </div>
  );
}

/* ─── Table header ─── */
function THead({ cols }) {
  return (
    <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
      <tr>
        {cols.map(({ label, align = 'left', width }, i) => (
          <th key={i} style={{
            padding: `12px ${i === 0 ? '20px' : i === cols.length - 1 ? '20px' : '16px'}`,
            fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: 0.5,
            textAlign: align, width,
          }}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/* ─── Empty / Loading Row ─── */
function EmptyRow({ cols, loading, message, icon: Icon }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        {loading ? (
          <span style={{ fontWeight: 500 }}>Loading…</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {Icon && <Icon size={32} style={{ opacity: 0.25 }} />}
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{message}</p>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function BankingFeaturePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { activeCompany } = useCompanyStore();

  const path = location.pathname;
  let type = 'activities';
  if (path.includes('imported-data'))        type = 'imported-data';
  else if (path.includes('cheque-printing')) type = 'cheque-printing';
  else if (path.includes('post-dated-summary')) type = 'post-dated-summary';
  else if (path.includes('deposit-slip'))    type = 'deposit-slip';
  else if (path.includes('payment-advice'))  type = 'payment-advice';

  const meta = PAGE_META[type];
  const PageIcon = meta.icon;

  const [selectedBankLedgerId, setSelectedBankLedgerId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* ─── Bank ledgers ─── */
  const { data: bankLedgers = [] } = useQuery({
    queryKey: ['banking-ledgers', activeCompany?.id],
    queryFn: () => ledgersApi.list({ company_id: activeCompany.id, group: 'Bank Accounts' }),
    enabled: !!activeCompany,
    onSuccess: (data) => { if (data.length > 0 && !selectedBankLedgerId) setSelectedBankLedgerId(String(data[0].id)); }
  });

  const effectiveLedgerId = selectedBankLedgerId || (bankLedgers[0]?.id ? String(bankLedgers[0].id) : '');

  /* ─── Queries ─── */
  const { data: unreconciledTxns = [], isLoading: loadingRecon, refetch: refetchRecon } = useQuery({
    queryKey: ['unreconciled', activeCompany?.id, effectiveLedgerId],
    queryFn: () => bankingApi.unreconciled({ company_id: activeCompany.id, bank_ledger_id: effectiveLedgerId }),
    enabled: !!activeCompany && !!effectiveLedgerId && type === 'activities',
  });

  const { data: cheques = [], isLoading: loadingCheques } = useQuery({
    queryKey: ['banking-cheques', activeCompany?.id, effectiveLedgerId],
    queryFn: () => bankingApi.cheques({ company_id: activeCompany.id, bank_ledger_id: effectiveLedgerId }),
    enabled: !!activeCompany && !!effectiveLedgerId && type === 'cheque-printing',
  });

  const { data: postDated = [] } = useQuery({
    queryKey: ['post-dated', activeCompany?.id],
    queryFn: () => bankingApi.postDated(activeCompany.id),
    enabled: !!activeCompany && type === 'post-dated-summary',
  });

  /* ─── Bank dates for reconcile ─── */
  const [bankDates, setBankDates] = useState({});
  const handleBankDateChange = (voucher_id, val) => setBankDates({ ...bankDates, [voucher_id]: val });

  const reconcileMut = useMutation({
    mutationFn: ({ voucher_id, bank_date }) => bankingApi.reconcile({
      company_id: activeCompany.id,
      voucher_id,
      bank_ledger_id: parseInt(effectiveLedgerId),
      bank_date,
    }),
    onSuccess: (_, vars) => {
      setSuccessMsg('Transaction reconciled successfully!');
      refetchRecon();
      setBankDates(prev => { const n = { ...prev }; delete n[vars.voucher_id]; return n; });
      setTimeout(() => setSuccessMsg(''), 3000);
      qc.invalidateQueries(['banking-accounts', activeCompany.id]);
    },
    onError: () => { setErrorMsg('Reconciliation failed. Please try again.'); setTimeout(() => setErrorMsg(''), 3000); }
  });

  /* ─── CSV auto-match ─── */
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const newBankDates = { ...bankDates };
      let matchCount = 0;
      const unmatchedTxns = unreconciledTxns.filter(t => !newBankDates[t.voucher_id]);
      lines.forEach((line) => {
        if (!line.trim()) return;
        const dateMatch = line.match(/(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})/);
        if (!dateMatch) return;
        let bankDate = dateMatch[1];
        if (bankDate.includes('/')) bankDate = bankDate.replace(/\//g, '-');
        const parts = bankDate.split('-');
        if (parts[0].length === 2 && parts[2].length === 4) bankDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const amounts = [...line.matchAll(/[\d,]+\.\d{2}/g)].map(m => parseFloat(m[0].replace(/,/g, '')));
        for (const amount of amounts) {
          if (amount > 0) {
            const matchIndex = unmatchedTxns.findIndex(t => Math.abs(t.total_amount - amount) < 0.01);
            if (matchIndex !== -1) {
              newBankDates[unmatchedTxns[matchIndex].voucher_id] = bankDate;
              unmatchedTxns.splice(matchIndex, 1);
              matchCount++;
              break;
            }
          }
        }
      });
      setBankDates(newBankDates);
      setSuccessMsg(`Auto-matched ${matchCount} transaction${matchCount !== 1 ? 's' : ''} from statement!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  /* ─── Deposit Slip ─── */
  const [denominations, setDenominations] = useState({ 2000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 });
  const totalDeposit = Object.entries(denominations).reduce((sum, [val, qty]) => sum + Number(val) * qty, 0);

  /* ─── No company guard ─── */
  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Briefcase size={36} style={{ color: 'var(--primary)', opacity: 0.6 }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to configure banking.</p>
        </div>
      </div>
    );
  }

  const activeLedgerName = bankLedgers.find(l => String(l.id) === String(effectiveLedgerId))?.name || '—';

  /* ═══════════════════════════════════════════════════════════ RENDER ═══ */
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: meta.color + '18', color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${meta.color}30`, flexShrink: 0 }}>
            <PageIcon size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {meta.title}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{meta.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/banking')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13 }}
        >
          <ArrowLeft size={15} /> Back to Portal
        </button>
      </div>

      {/* ── Global Alert Banner ── */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 10, color: '#047857', fontWeight: 600, fontSize: 13 }}>
          <Check size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, color: '#b91c1c', fontWeight: 600, fontSize: 13 }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* ── Bank Ledger Selector Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16,
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 20px',
      }}>
        <Building2 size={16} style={{ color: meta.color, flexShrink: 0 }} />
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', flexShrink: 0 }}>
          Bank Account:
        </label>
        <select
          value={effectiveLedgerId}
          onChange={(e) => setSelectedBankLedgerId(e.target.value)}
          className="cb-input"
          style={{ maxWidth: 260, cursor: 'pointer' }}
        >
          {bankLedgers.length === 0 && <option value="">No bank ledgers found</option>}
          {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        {effectiveLedgerId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: meta.color + '12', color: meta.color, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${meta.color}25` }}>
            <CreditCard size={12} /> {activeLedgerName}
          </div>
        )}

        {/* CSV Auto-match for reconciliation */}
        {type === 'activities' && (
          <label style={{
            marginLeft: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', background: '#eff6ff', color: '#2563eb',
            border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, fontWeight: 700, transition: 'all 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
          >
            <Upload size={14} /> Auto-match via Statement CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
          </label>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ── 1. BANK RECONCILIATION
      ════════════════════════════════════════════════════════════════════ */}
      {type === 'activities' && (
        <SectionCard>
          {/* Stats bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Unreconciled:</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', color: unreconciledTxns.length > 0 ? '#f59e0b' : '#10b981', fontSize: 14 }}>
                {unreconciledTxns.length}
              </span>
            </div>
            <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Total: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                ₹{fmt(unreconciledTxns.reduce((s, t) => s + (t.total_amount || 0), 0))}
              </strong>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {unreconciledTxns.length === 0 ? '✓ All cleared' : `Set bank date → click Reconcile`}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
              <THead cols={[
                { label: 'Vch Date', width: 110 },
                { label: 'Voucher / Narration' },
                { label: 'Type', width: 100 },
                { label: 'Ref No', width: 120 },
                { label: 'Amount (₹)', align: 'right', width: 140 },
                { label: 'Bank Clear Date', width: 160 },
                { label: 'Action', align: 'right', width: 110 },
              ]} />
              <tbody>
                {loadingRecon ? (
                  <EmptyRow cols={7} loading message="Loading transactions…" />
                ) : unreconciledTxns.length === 0 ? (
                  <EmptyRow cols={7} icon={CheckCircle} message="All transactions reconciled!" />
                ) : (
                  unreconciledTxns.map((txn) => (
                    <tr key={txn.voucher_id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {txn.date}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: meta.color, fontSize: 13 }}>{txn.voucher_number}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {txn.narration || txn.particulars || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{txn.voucher_type}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{txn.reference_no || '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        ₹{fmt(txn.total_amount)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ position: 'relative' }}>
                          <Calendar style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={13} />
                          <input
                            type="date"
                            value={bankDates[txn.voucher_id] || ''}
                            onChange={(e) => handleBankDateChange(txn.voucher_id, e.target.value)}
                            className="cb-input"
                            style={{ paddingLeft: 32, maxWidth: 150, fontSize: 12 }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => reconcileMut.mutate({ voucher_id: txn.voucher_id, bank_date: bankDates[txn.voucher_id] })}
                          disabled={!bankDates[txn.voucher_id] || reconcileMut.isPending}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                            background: bankDates[txn.voucher_id] ? meta.color : 'var(--bg-secondary)',
                            color: bankDates[txn.voucher_id] ? '#fff' : 'var(--text-muted)',
                            border: 'none', cursor: bankDates[txn.voucher_id] ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s', opacity: (!bankDates[txn.voucher_id] || reconcileMut.isPending) ? 0.5 : 1,
                          }}
                        >
                          <Check size={12} /> Reconcile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ── 2. IMPORTED BANK STATEMENT
      ════════════════════════════════════════════════════════════════════ */}
      {type === 'imported-data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Statement Feed</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Import CSV, OFX, or QIF bank statement files</p>
              </div>
              <button
                onClick={() => alert('Upload bank statement CSV/OFX/QIF')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13 }}
              >
                <Upload size={14} /> Import Statement File
              </button>
            </div>

            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ display: 'inline-flex', padding: 20, borderRadius: 16, background: '#eff6ff', color: '#3b82f6', marginBottom: 16 }}>
                <Download size={36} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>Bank Statement Import</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: 14, color: 'var(--text-muted)' }}>Upload CSV/OFX files to auto-map transactions to ledgers.</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Feature coming soon — transactions matched by amount and date.</p>
            </div>
          </SectionCard>

          {/* Info card */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, color: '#1d4ed8' }}>
            <Info size={16} style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              <strong>Supported formats:</strong> CSV (comma-separated), OFX (bank feeds), QIF (Quicken). Rows are matched by transaction amount and approximate date ranges.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ── 3. CHEQUE PRINTING
      ════════════════════════════════════════════════════════════════════ */}
      {type === 'cheque-printing' && (
        <SectionCard>
          {/* Header bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, textTransform: 'uppercase' }}>Cheque Leaf Queue</span>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{cheques.length} voucher{cheques.length !== 1 ? 's' : ''} in queue</p>
            </div>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
            >
              <Printer size={14} /> Print All
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <THead cols={[
                { label: 'Issue Date', width: 110 },
                { label: 'Voucher / Payee' },
                { label: 'Amount (₹)', align: 'right', width: 140 },
                { label: 'Reference', width: 140 },
                { label: 'Status', align: 'center', width: 130 },
                { label: 'Action', align: 'right', width: 100 },
              ]} />
              <tbody>
                {loadingCheques ? (
                  <EmptyRow cols={6} loading />
                ) : cheques.length === 0 ? (
                  <EmptyRow cols={6} icon={Printer} message="No payment/receipt vouchers found." />
                ) : (
                  cheques.map((c) => (
                    <tr key={c.voucher_id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: meta.color, fontSize: 13 }}>{c.voucher_number}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.payee}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>₹{fmt(c.amount)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{c.reference_no || '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <StatusBadge cleared={c.is_reconciled} date={c.bank_date} />
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => alert(`Cheque ${c.voucher_number} sent to print queue.`)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                            borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            background: meta.color, color: '#fff', border: 'none', transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <Printer size={12} /> Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ── 4. POST-DATED TRANSACTIONS
      ════════════════════════════════════════════════════════════════════ */}
      {type === 'post-dated-summary' && (
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, textTransform: 'uppercase' }}>Scheduled / Post-Dated Instruments</span>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{postDated.length} pending release{postDated.length !== 1 ? 's' : ''}</p>
            </div>
            {postDated.length > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b', background: '#fef3c7', padding: '5px 12px', borderRadius: 6, border: '1px solid #fde68a' }}>
                ₹{fmt(postDated.reduce((s, v) => s + (v.amount || 0), 0))} pending
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650 }}>
              <THead cols={[
                { label: 'Due Date', width: 120 },
                { label: 'Voucher', width: 130 },
                { label: 'Type', width: 110 },
                { label: 'Reference No', width: 140 },
                { label: 'Due Amount (₹)', align: 'right', width: 150 },
                { label: 'Status', align: 'center', width: 130 },
              ]} />
              <tbody>
                {postDated.length === 0 ? (
                  <EmptyRow cols={6} icon={Clock} message="No post-dated transactions found." />
                ) : (
                  postDated.map((v) => {
                    const isPast = new Date(v.due_date) < new Date();
                    return (
                      <tr key={v.voucher_id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: isPast ? '#ef4444' : meta.color, whiteSpace: 'nowrap' }}>
                          {v.due_date}
                          {isPast && <span style={{ marginLeft: 6, fontSize: 10, color: '#ef4444' }}>Overdue</span>}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{v.voucher_number}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{v.voucher_type}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{v.reference_no || '—'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>₹{fmt(v.amount)}</td>
                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                          <StatusBadge cleared={false} label={isPast ? 'Overdue' : 'Pending Release'} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ── 5. DEPOSIT SLIP GENERATOR
      ════════════════════════════════════════════════════════════════════ */}
      {type === 'deposit-slip' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>
          {/* Denomination Sheet */}
          <SectionCard>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Denomination Sheet</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {[2000, 500, 200, 100, 50, 20, 10].map((denom) => (
                <div key={denom} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 13, minWidth: 70 }}>₹ {denom} ×</span>
                  <input
                    type="number" min="0"
                    value={denominations[denom]}
                    onChange={(e) => setDenominations({ ...denominations, [denom]: Number(e.target.value) || 0 })}
                    className="cb-input"
                    style={{ width: 90, textAlign: 'right', fontFamily: 'monospace' }}
                    placeholder="0"
                  />
                  <span style={{ minWidth: 90, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: denom * denominations[denom] > 0 ? meta.color : 'var(--text-muted)', fontSize: 13 }}>
                    = ₹ {(denom * denominations[denom]).toLocaleString()}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, fontWeight: 800 }}>
                <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12 }}>Total</span>
                <span style={{ fontFamily: 'monospace', fontSize: 18, color: meta.color }}>₹ {totalDeposit.toLocaleString()}.00</span>
              </div>
            </div>
          </SectionCard>

          {/* Slip Preview */}
          <SectionCard>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cash Deposit Details</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {[
                { label: 'Deposit Account', value: activeLedgerName },
                { label: 'Date of Deposit', value: new Date().toLocaleDateString('en-GB') },
                { label: 'Company', value: activeCompany.name },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}:</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}

              <div style={{ margin: '20px 0', padding: '20px', background: totalDeposit > 0 ? meta.color + '10' : 'var(--bg-secondary)', border: `2px dashed ${totalDeposit > 0 ? meta.color + '40' : 'var(--border)'}`, borderRadius: 10, textAlign: 'center' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Deposit Value</p>
                <p style={{ margin: 0, fontSize: 30, fontWeight: 900, fontFamily: 'monospace', color: totalDeposit > 0 ? meta.color : 'var(--text-muted)' }}>
                  ₹ {totalDeposit.toLocaleString()}.00
                </p>
              </div>

              <button
                onClick={() => alert(`Slip generated for ₹${totalDeposit}`)}
                disabled={totalDeposit === 0}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 700, justifyContent: 'center', opacity: totalDeposit === 0 ? 0.5 : 1, cursor: totalDeposit === 0 ? 'not-allowed' : 'pointer' }}
              >
                Generate Deposit Slip
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ── 6. PAYMENT ADVICE REGISTER
      ════════════════════════════════════════════════════════════════════ */}
      {type === 'payment-advice' && (
        <SectionCard>
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-flex', padding: 20, borderRadius: 16, background: '#fdf4ff', color: '#ec4899', marginBottom: 16 }}>
              <FileText size={36} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>Payment Advice Register</h3>
            <p style={{ margin: '0 0 4px 0', fontSize: 14, color: 'var(--text-muted)' }}>Vouchers flagged for payment advice notification will appear here.</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Mark vouchers as "Payment Advice Required" when creating Payment entries.</p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
