import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { banking as bankingApi, ledgers as ledgersApi } from '../api';
import useCompanyStore from '../store/companyStore';
import {
  ArrowLeft, ArrowLeftRight, Printer, FileText, Clock,
  Download, Upload, Check, CheckCircle, AlertCircle, Briefcase,
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n || 0);

export default function BankingFeaturePage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const qc         = useQueryClient();
  const { activeCompany } = useCompanyStore();

  const path = location.pathname;
  let type = "activities";
  let title = "Bank Reconciliation";
  let subtitle = "Match ledger entries with your bank statement clear dates";

  if (path.includes("imported-data"))       { type = "imported-data";      title = "Imported Bank Statement"; subtitle = "View and map imported electronic bank statements to ledgers"; }
  else if (path.includes("cheque-printing")) { type = "cheque-printing";    title = "Cheque Printing Portal";  subtitle = "Configure layouts and print physical cheque leaves for pending vouchers"; }
  else if (path.includes("post-dated-summary")) { type = "post-dated-summary"; title = "Post-Dated Transactions"; subtitle = "Monitor scheduled checks and post-dated deposit vouchers"; }
  else if (path.includes("deposit-slip"))    { type = "deposit-slip";       title = "Deposit Slip Generator"; subtitle = "Create and print Cash or Cheque bank deposit slips"; }
  else if (path.includes("payment-advice"))  { type = "payment-advice";     title = "Payment Advice Register"; subtitle = "Generate and send formal payment notifications to suppliers"; }

  const [selectedBankLedgerId, setSelectedBankLedgerId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load real bank ledgers
  const { data: bankLedgers = [] } = useQuery({
    queryKey: ['banking-ledgers', activeCompany?.id],
    queryFn: () => ledgersApi.list({ company_id: activeCompany.id, group: 'Bank Accounts' }),
    enabled: !!activeCompany,
    onSuccess: (data) => { if (data.length > 0 && !selectedBankLedgerId) setSelectedBankLedgerId(String(data[0].id)); }
  });

  // Set first ledger as default when loaded
  const effectiveLedgerId = selectedBankLedgerId || (bankLedgers[0]?.id ? String(bankLedgers[0].id) : '');

  // 1. Unreconciled transactions
  const { data: unreconciledTxns = [], isLoading: loadingRecon, refetch: refetchRecon } = useQuery({
    queryKey: ['unreconciled', activeCompany?.id, effectiveLedgerId],
    queryFn: () => bankingApi.unreconciled({ company_id: activeCompany.id, bank_ledger_id: effectiveLedgerId }),
    enabled: !!activeCompany && !!effectiveLedgerId && type === 'activities',
  });

  // 2. Cheques
  const { data: cheques = [], isLoading: loadingCheques } = useQuery({
    queryKey: ['banking-cheques', activeCompany?.id, effectiveLedgerId],
    queryFn: () => bankingApi.cheques({ company_id: activeCompany.id, bank_ledger_id: effectiveLedgerId }),
    enabled: !!activeCompany && !!effectiveLedgerId && type === 'cheque-printing',
  });

  // 3. Post-dated
  const { data: postDated = [] } = useQuery({
    queryKey: ['post-dated', activeCompany?.id],
    queryFn: () => bankingApi.postDated(activeCompany.id),
    enabled: !!activeCompany && type === 'post-dated-summary',
  });

  // Bank dates for reconcile form
  const [bankDates, setBankDates] = useState({});
  const handleBankDateChange = (voucher_id, val) => setBankDates({ ...bankDates, [voucher_id]: val });

  const reconcileMut = useMutation({
    mutationFn: ({ voucher_id, bank_date }) => bankingApi.reconcile({
      company_id:     activeCompany.id,
      voucher_id:     voucher_id,
      bank_ledger_id: parseInt(effectiveLedgerId),
      bank_date:      bank_date,
    }),
    onSuccess: (_, vars) => {
      setSuccessMsg(`Transaction reconciled successfully!`);
      refetchRecon();
      setBankDates(prev => { const n = {...prev}; delete n[vars.voucher_id]; return n; });
      setTimeout(() => setSuccessMsg(''), 3000);
      qc.invalidateQueries(['banking-accounts', activeCompany.id]);
    }
  });

  // Deposit Slip state
  const [denominations, setDenominations] = useState({ 2000:0, 500:0, 200:0, 100:0, 50:0, 20:0, 10:0 });
  const totalDeposit = Object.entries(denominations).reduce((sum, [val, qty]) => sum + Number(val) * qty, 0);

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Briefcase size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to configure banking.</p>
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
            {type === 'activities' && <ArrowLeftRight size={20} className="text-white" />}
            {type === 'imported-data' && <Download size={20} className="text-white" />}
            {type === 'cheque-printing' && <Printer size={20} className="text-white" />}
            {type === 'post-dated-summary' && <Clock size={20} className="text-white" />}
            {(type === 'deposit-slip' || type === 'payment-advice') && <FileText size={20} className="text-white" />}
          </div>
          <div>
            <h1 className="cb-page-title">{title}</h1>
            <p className="cb-page-subtitle">{subtitle}</p>
          </div>
        </div>
        <button onClick={() => navigate('/banking')} className="cb-btn-secondary">
          <ArrowLeft size={15} /> Back to Portal
        </button>
      </div>

      {/* Bank Ledger Selector */}
      <div className="flex items-center gap-3 bg-white p-4 cb-card">
        <span className="cb-label">Select Bank Ledger:</span>
        <select
          value={effectiveLedgerId}
          onChange={(e) => setSelectedBankLedgerId(e.target.value)}
          className="cb-input max-w-[250px] py-1 px-2.5 text-xs"
        >
          {bankLedgers.length === 0 && <option value="">No bank ledgers found</option>}
          {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {successMsg && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
            <Check size={14} /> {successMsg}
          </span>
        )}
      </div>

      {/* ── 1. BANK RECONCILIATION ── */}
      {type === "activities" && (
        <div className="cb-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 cb-th w-28">Vch Date</th>
                  <th className="px-6 py-3.5 cb-th">Voucher / Narration</th>
                  <th className="px-6 py-3.5 cb-th">Type</th>
                  <th className="px-6 py-3.5 cb-th font-mono">Ref No</th>
                  <th className="px-6 py-3.5 cb-th text-right">Amount (₹)</th>
                  <th className="px-6 py-3.5 cb-th">Bank Clear Date</th>
                  <th className="px-6 py-3.5 cb-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingRecon ? (
                  <tr><td colSpan="7" className="py-12 text-center text-slate-400 animate-pulse">Loading transactions…</td></tr>
                ) : unreconciledTxns.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 cb-td font-semibold">
                    <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
                    All transactions reconciled!
                  </td></tr>
                ) : unreconciledTxns.map((txn) => (
                  <tr key={txn.voucher_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 cb-td font-mono text-xs">{txn.date}</td>
                    <td className="px-6 py-4 cb-td">
                      <div className="font-semibold text-purple-700 text-xs">{txn.voucher_number}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[180px]">{txn.narration}</div>
                    </td>
                    <td className="px-6 py-4 cb-td text-xs text-slate-500">{txn.voucher_type}</td>
                    <td className="px-6 py-4 cb-td font-mono text-xs text-slate-500">{txn.reference_no || '—'}</td>
                    <td className="px-6 py-4 cb-td text-right font-mono font-semibold">₹{fmt(txn.total_amount)}</td>
                    <td className="px-6 py-3 cb-td">
                      <input type="date" value={bankDates[txn.voucher_id] || ''}
                        onChange={(e) => handleBankDateChange(txn.voucher_id, e.target.value)}
                        className="cb-input py-1 px-2 max-w-[150px] text-xs font-mono" />
                    </td>
                    <td className="px-6 py-3 cb-td text-right">
                      <button
                        onClick={() => reconcileMut.mutate({ voucher_id: txn.voucher_id, bank_date: bankDates[txn.voucher_id] })}
                        disabled={!bankDates[txn.voucher_id] || reconcileMut.isPending}
                        className="cb-btn-primary py-1 px-2.5 rounded text-xs shrink-0"
                      >Reconcile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. IMPORTED BANK STATEMENT ── */}
      {type === "imported-data" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 cb-card">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statement Feed</span>
            <div className="flex gap-2">
              <button onClick={() => alert("Upload bank statement CSV/OFX/QIF")} className="cb-btn-primary text-xs py-1.5 px-3">
                <Upload size={14} /> Import Statement File
              </button>
            </div>
          </div>
          <div className="cb-card py-16 text-center text-slate-400">
            <Download size={32} className="mx-auto mb-3 text-slate-300"/>
            <p className="font-semibold">Bank statement import coming soon</p>
            <p className="text-xs mt-1">Upload CSV/OFX files to auto-map transactions to ledgers.</p>
          </div>
        </div>
      )}

      {/* ── 3. CHEQUE PRINTING ── */}
      {type === "cheque-printing" && (
        <div className="cb-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 cb-th">Issue Date</th>
                  <th className="px-6 py-3.5 cb-th">Voucher</th>
                  <th className="px-6 py-3.5 cb-th text-right">Amount</th>
                  <th className="px-6 py-3.5 cb-th font-mono">Reference</th>
                  <th className="px-6 py-3.5 cb-th text-center">Reconciled</th>
                  <th className="px-6 py-3.5 cb-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingCheques ? (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 animate-pulse">Loading cheques…</td></tr>
                ) : cheques.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 cb-td">No payment/receipt vouchers found.</td></tr>
                ) : cheques.map((c) => (
                  <tr key={c.voucher_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 cb-td font-mono text-xs">{c.date}</td>
                    <td className="px-6 py-4 cb-td">
                      <div className="font-semibold text-purple-700">{c.voucher_number}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[160px]">{c.payee}</div>
                    </td>
                    <td className="px-6 py-4 cb-td text-right font-mono font-semibold">₹{fmt(c.amount)}</td>
                    <td className="px-6 py-4 cb-td font-mono text-xs text-slate-500">{c.reference_no}</td>
                    <td className="px-6 py-4 cb-td text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        c.is_reconciled ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>
                        {c.is_reconciled ? `Reconciled ${c.bank_date}` : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-3 cb-td text-right">
                      <button onClick={() => alert(`Cheque ${c.voucher_number} sent to print queue.`)}
                        className="cb-btn-primary py-1 px-2.5 rounded text-xs shrink-0">
                        <Printer size={12} /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. POST-DATED SUMMARY ── */}
      {type === "post-dated-summary" && (
        <div className="cb-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 cb-th">Due Date</th>
                  <th className="px-6 py-3.5 cb-th">Voucher</th>
                  <th className="px-6 py-3.5 cb-th">Type</th>
                  <th className="px-6 py-3.5 cb-th font-mono">Reference No</th>
                  <th className="px-6 py-3.5 cb-th text-right">Due Amount</th>
                  <th className="px-6 py-3.5 cb-th text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {postDated.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 cb-td">No post-dated transactions found.</td></tr>
                ) : postDated.map((v) => (
                  <tr key={v.voucher_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 cb-td font-mono text-purple-700 font-bold">{v.due_date}</td>
                    <td className="px-6 py-4 cb-td font-semibold text-slate-800">{v.voucher_number}</td>
                    <td className="px-6 py-4 cb-td text-slate-500">{v.voucher_type}</td>
                    <td className="px-6 py-4 cb-td font-mono text-slate-400 text-xs">{v.reference_no || '—'}</td>
                    <td className="px-6 py-4 cb-td text-right font-mono font-bold">₹{fmt(v.amount)}</td>
                    <td className="px-6 py-4 cb-td text-center">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold">
                        Pending Release
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. DEPOSIT SLIP GENERATOR ── */}
      {type === "deposit-slip" && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 cb-card p-6 space-y-4 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">Denomination Sheet</h3>
            <div className="space-y-3">
              {[2000, 500, 200, 100, 50, 20, 10].map((denom) => (
                <div key={denom} className="flex items-center justify-between text-xs">
                  <span className="w-16 font-mono font-semibold text-slate-600">₹ {denom} x</span>
                  <input type="number" min="0" value={denominations[denom]}
                    onChange={(e) => setDenominations({ ...denominations, [denom]: Number(e.target.value) || 0 })}
                    className="cb-input py-1 px-2 max-w-[80px] text-right font-mono" placeholder="0" />
                  <span className="w-24 text-right font-mono font-bold text-slate-700">
                    = ₹ {(denom * denominations[denom]).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 cb-card p-6 space-y-4 bg-white flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 mb-4">Cash Deposit Details</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Deposit Account:</span>
                  <span className="font-semibold text-slate-800">{bankLedgers.find(l => l.id === parseInt(effectiveLedgerId))?.name || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Date of Deposit:</span>
                  <span className="font-mono text-slate-800">{new Date().toLocaleDateString("en-GB")}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-slate-150">
                  <span className="text-slate-600 font-semibold">Total Deposit Value:</span>
                  <span className="text-lg font-black text-purple-700 font-mono">₹ {totalDeposit.toLocaleString()}.00</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => alert(`Slip generated for ₹${totalDeposit}`)} disabled={totalDeposit === 0}
                className="cb-btn-primary">Generate Deposit Slip</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. PAYMENT ADVICE ── */}
      {type === "payment-advice" && (
        <div className="cb-card py-16 text-center text-slate-400">
          <FileText size={32} className="mx-auto mb-3 text-slate-300"/>
          <p className="font-semibold">Payment Advice Register</p>
          <p className="text-xs mt-1">Vouchers flagged for payment advice notification will appear here.</p>
        </div>
      )}
    </div>
  );
}
