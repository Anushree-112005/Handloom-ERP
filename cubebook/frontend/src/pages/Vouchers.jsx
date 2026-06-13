import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vouchers, ledgers as ledgersApi, companies } from '../api';
import useCompanyStore from '../store/companyStore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VoucherForm from '../components/VoucherForm';
import { Plus, Search, Receipt, Filter, Trash2, X } from 'lucide-react';

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

const STATUS_STYLE = {
  Posted:    { bg: 'bg-emerald-50/60',  text: 'text-emerald-700',  border: 'border-emerald-100' },
  Cancelled: { bg: 'bg-rose-50/60',     text: 'text-rose-700',     border: 'border-rose-100' },
  Draft:     { bg: 'bg-amber-50/60',    text: 'text-amber-700',    border: 'border-amber-100' },
};

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function Vouchers() {
  const { activeCompany } = useCompanyStore();
  const queryClient       = useQueryClient();
  const navigate          = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voucherType, setVoucherType] = useState('Payment');
  const [seeding,     setSeeding]     = useState(false);

  const { data: vouchersList = [], isLoading } = useQuery({
    queryKey: ['vouchers', activeCompany?.id],
    queryFn:  () => vouchers.list({ company_id: activeCompany.id }),
    enabled:  !!activeCompany,
  });

  const handleSeedVouchers = async () => {
    if (!activeCompany?.id) return;
    try {
      setSeeding(true);
      await companies.seedVouchers(activeCompany.id);
      queryClient.invalidateQueries();
      alert("Successfully seeded textile vouchers and matching accounts for this company in real-time!");
    } catch (err) {
      alert("Error seeding vouchers: " + (err.response?.data?.detail || err.message));
    } finally {
      setSeeding(false);
    }
  };

  const { data: ledgersList = [] } = useQuery({
    queryKey: ['ledgers', activeCompany?.id],
    queryFn:  () => ledgersApi.list({ company_id: activeCompany.id }),
    enabled:  !!activeCompany,
  });

  // Open modal when ?type= param is present
  useEffect(() => {
    const type = searchParams.get('type');
    if (type) { setVoucherType(type); setIsModalOpen(true); }
  }, [searchParams]);

  const openVoucher = (type) => {
    setVoucherType(type);
    setIsModalOpen(true);
  };

  const closeVoucher = () => {
    setIsModalOpen(false);
    searchParams.delete('type');
    setSearchParams(searchParams);
    navigate('/vouchers', { replace: true });
  };

  const filtered = vouchersList.filter(v => {
    const matchSearch = !search ||
      v.voucher_number?.toLowerCase().includes(search.toLowerCase()) ||
      v.narration?.toLowerCase().includes(search.toLowerCase()) ||
      (v.entries?.[0]?.ledger_name && v.entries[0].ledger_name.toLowerCase().includes(search.toLowerCase()));
    const matchType = !typeFilter || v.voucher_type === typeFilter;
    return matchSearch && matchType;
  });

  const totalAmt = filtered.reduce((s, v) => s + (Number(v.total_amount) || 0), 0);

  // Per-type summary counts
  const typeCounts = VOUCHER_TYPES.reduce((acc, t) => {
    acc[t] = vouchersList.filter(v => v.voucher_type === t).length;
    return acc;
  }, {});

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500 font-medium">Select a company to view vouchers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            <Receipt size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Voucher Entry</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Record and manage company ledger transactions and vouchers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="text-right text-xs">
            <div className="text-slate-500">
              Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{vouchersList.length} total vouchers</p>
          </div>
          <button
            onClick={handleSeedVouchers}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            {seeding ? "Generating..." : "Seed Textile Vouchers"}
          </button>
          <button
            onClick={() => openVoucher('Payment')}
            className="cb-btn-primary px-3.5 py-2 text-xs rounded-xl shadow-sm animate-none"
          >
            <Plus size={14} /> New Voucher
          </button>
        </div>
      </div>

      {/* ── Unified Quick Actions & Voucher Counts ── */}
      <div className="cb-card p-4 bg-slate-50/40">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Voucher Quick Actions & Counts
          </p>
          <span className="text-[10px] font-medium text-slate-400">
            Click to filter by type &nbsp;·&nbsp; Click <span className="font-bold">+</span> to create
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {VOUCHER_TYPES.map(t => {
            const isActive = typeFilter === t;
            const count = typeCounts[t] || 0;
            const ts = TYPE_STYLE[t] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
            return (
              <div
                key={t}
                onClick={() => setTypeFilter(isActive ? '' : t)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.01] ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span className="tracking-tight">{t}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                  isActive ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
                <button
                  type="button"
                  title={`Create New ${t}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openVoucher(t);
                  }}
                  className={`p-0.5 rounded transition-colors ${
                    isActive
                      ? 'hover:bg-purple-200 text-purple-600'
                      : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="cb-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search voucher no., particulars, or narration..."
                className="pl-8 pr-3 py-1.5 w-72 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
              />
            </div>

            {/* Type Select Dropdown */}
            <div className="relative">
              <Filter size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="pl-7 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 appearance-none cursor-pointer"
              >
                <option value="">All Voucher Types</option>
                {VOUCHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[8px]">▼</div>
            </div>

            {/* Clear Filters Button */}
            {(typeFilter || search) && (
              <button
                onClick={() => { setTypeFilter(''); setSearch(''); }}
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold px-2 py-1 hover:bg-purple-50 rounded-md transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Showing {filtered.length} of {vouchersList.length} vouchers
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto max-h-[50vh] relative">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
              <tr>
                <th className="text-left px-5 py-3 font-bold w-24">Date</th>
                <th className="text-left px-4 py-3 font-bold w-32">Voucher No.</th>
                <th className="text-left px-4 py-3 font-bold w-28">Type</th>
                <th className="text-left px-4 py-3 font-bold">Particulars / Narration</th>
                <th className="text-left px-4 py-3 font-bold w-28">Ref No.</th>
                <th className="text-center px-4 py-3 font-bold w-24">Status</th>
                <th className="text-right px-5 py-3 font-bold w-36">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading vouchers…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Receipt size={36} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-semibold">No vouchers found</p>
                    <button
                      onClick={() => openVoucher('Payment')}
                      className="mt-2 text-purple-600 text-xs font-semibold hover:underline"
                    >
                      + Create your first voucher
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((v, i) => {
                  const ts = TYPE_STYLE[v.voucher_type] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                  const ss = STATUS_STYLE[v.status]     || STATUS_STYLE.Posted;
                  const particulars = v.entries?.[0]?.ledger_name || v.narration || '—';
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-purple-50/15 cursor-pointer transition-colors"
                      onClick={() => openVoucher(v.voucher_type)}
                    >
                      <td className="px-5 py-2.5 text-slate-500 font-medium whitespace-nowrap">{v.date}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{v.voucher_number}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${ts.bg} ${ts.text} ${ts.border}`}>
                          {v.voucher_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-md truncate">
                        <span className="font-semibold text-slate-800">{particulars}</span>
                        {v.narration && (
                          <span className="text-slate-400 font-normal ml-2 italic">— {v.narration}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-medium">{v.reference_no || '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${ss.bg} ${ss.text} ${ss.border}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-900 text-[13px]">
                        ₹{fmt(v.total_amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Summary tfoot */}
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
                <tr>
                  <td colSpan={6} className="px-5 py-2.5 text-left text-slate-500 font-bold uppercase tracking-wider">
                    Total ({filtered.length} Voucher{filtered.length !== 1 ? 's' : ''})
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-[13px] text-slate-900 font-bold">
                    ₹{fmt(totalAmt)}
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

      {/* ── Keyboard Shortcuts Hint ── */}
      <div className="flex items-center gap-3.5 flex-wrap px-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-1">Shortcuts:</span>
        {[
          ['F4','Contra'], ['F5','Payment'], ['F6','Receipt'],
          ['F7','Journal'], ['F8','Sales'], ['F9','Purchase'],
        ].map(([k, t]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-slate-400">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono font-bold text-slate-500 shadow-sm">{k}</kbd>
            <span className="font-medium text-slate-500">{t}</span>
          </span>
        ))}
      </div>

      {/* ── Voucher Form Modal ── */}
      {isModalOpen && (
        <VoucherForm
          type={voucherType}
          companyId={activeCompany?.id}
          ledgers={ledgersList}
          onClose={closeVoucher}
          onSaved={() => {
            queryClient.invalidateQueries();
          }}
        />
      )}
    </div>
  );
}
