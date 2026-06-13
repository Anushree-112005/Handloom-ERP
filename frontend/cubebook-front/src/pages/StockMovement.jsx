import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports, stockItems } from '../api';
import useCompanyStore from '../store/companyStore';
import { Activity, ArrowLeft, Search, Calendar, ChevronRight, CornerDownRight } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

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

export default function StockMovement() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || '2025-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Summary list of all items movement
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['stock-movement-summary', activeCompany?.id, fromDate, toDate],
    queryFn: () => reports.stockMovement({
      company_id: activeCompany.id,
      from_date: fromDate,
      to_date: toDate,
    }),
    enabled: !!activeCompany && !selectedItemId,
  });

  // 2. Fetch Detailed ledger for a single item
  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['stock-movement-ledger', activeCompany?.id, selectedItemId, fromDate, toDate],
    queryFn: () => reports.stockMovement({
      company_id: activeCompany.id,
      from_date: fromDate,
      to_date: toDate,
      stock_item_id: selectedItemId,
    }),
    enabled: !!activeCompany && !!selectedItemId,
  });

  // 3. Fetch all stock items for dropdown quick-selection
  const { data: dropdownItems = [] } = useQuery({
    queryKey: ['stock-items-list', activeCompany?.id],
    queryFn: () => stockItems.list(activeCompany.id),
    enabled: !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company first.</p>
      </div>
    );
  }

  // Filter summary rows
  const filteredSummaryRows = (summaryData?.rows || []).filter(row =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="btn btn-primary">
            <Activity size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Stock Movement</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              {selectedItemId ? 'Detailed item ledger, inwards, outwards, and storage mapping' : 'Inventory valuation, stock items ledger summary, and period flows'}
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            FY: {activeFy?.label || 'Not set'}
          </p>
        </div>
      </div>

      {/* ── Detailed Ledger Summary Cards ── */}
      {selectedItemId && ledgerData && (
        <div className="form-row">
          <div className="cb-card p-4 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opening Stock</p>
            <p className="text-xl font-bold font-mono text-slate-800 mt-1.5">{fmt(ledgerData.opening_qty)} {ledgerData.unit}</p>
          </div>
          <div className="btn btn-success">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Inwards (+)</p>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-1.5">
              +{fmt((ledgerData.transactions || []).reduce((s, t) => s + (t.inward_qty || 0), 0))} {ledgerData.unit}
            </p>
          </div>
          <div className="btn btn-danger">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Total Outwards (-)</p>
            <p className="text-xl font-bold font-mono text-rose-700 mt-1.5">
              -{fmt((ledgerData.transactions || []).reduce((s, t) => s + (t.outward_qty || 0), 0))} {ledgerData.unit}
            </p>
          </div>
          <div className="btn btn-primary">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Closing Balance</p>
            <p className="text-xl font-bold font-mono text-purple-800 mt-1.5">{fmt(ledgerData.closing_qty)} {ledgerData.unit}</p>
          </div>
        </div>
      )}

      {/* ── Table & Toolbar Card ── */}
      <div className="cb-card">
        {/* Toolbar */}
        <div className="btn btn-secondary">
          <div className="flex flex-wrap items-center gap-3">
            {selectedItemId && (
              <button
                onClick={() => { setSelectedItemId(null); setSearchQuery(''); }}
                className="btn btn-secondary"
              >
                <ArrowLeft size={13} /> Back to Summary
              </button>
            )}

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

            {/* Quick Item select dropdown (Only visible in Detailed view) */}
            {selectedItemId && (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                className="btn btn-secondary"
              >
                {dropdownItems.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Search bar */}
          {!selectedItemId && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search stock item…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="btn btn-secondary"
              />
            </div>
          )}
        </div>

        {/* ── Table Content ── */}
        <div className="overflow-x-auto max-h-[55vh]">
          {/* Summary View */}
          {!selectedItemId ? (
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="text-left px-5 py-3 font-bold">Item Name</th>
                  <th className="text-center px-4 py-3 font-bold w-20">Unit</th>
                  <th className="text-right px-4 py-3 font-bold w-28">Opening Qty</th>
                  <th className="text-right px-4 py-3 font-bold w-28 text-emerald-600">Inward Qty</th>
                  <th className="text-right px-4 py-3 font-bold w-28 text-rose-600">Outward Qty</th>
                  <th className="text-right px-4 py-3 font-bold w-28">Closing Qty</th>
                  <th className="text-right px-4 py-3 font-bold w-28">Valuation Rate</th>
                  <th className="text-right px-5 py-3 font-bold w-36">Closing Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isSummaryLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                      Loading stock summary…
                    </td>
                  </tr>
                ) : filteredSummaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-medium">
                      No stock items found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredSummaryRows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedItemId(row.id)}
                      className="btn btn-primary"
                    >
                      <td className="px-5 py-3 font-semibold text-slate-800 flex items-center gap-1.5 group-hover:text-purple-700">
                        {row.name}
                        <ChevronRight size={12} className="text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">{row.unit}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">{fmt(row.opening_qty)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-medium">+{fmt(row.inward_qty)}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600 font-medium">-{fmt(row.outward_qty)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{fmt(row.closing_qty)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">₹{fmt(row.rate)}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">₹{fmt(row.value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Detailed Ledger View */
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="text-left px-5 py-3 font-bold w-28">Date</th>
                  <th className="text-left px-4 py-3 font-bold w-32">Vch No.</th>
                  <th className="text-center px-4 py-3 font-bold w-24">Vch Type</th>
                  <th className="text-left px-4 py-3 font-bold">Particulars (Party)</th>
                  <th className="text-left px-4 py-3 font-bold w-36">Location/Godown</th>
                  <th className="text-right px-4 py-3 font-bold w-24 text-emerald-600">Inward Qty</th>
                  <th className="text-right px-4 py-3 font-bold w-24 text-rose-600">Outward Qty</th>
                  <th className="text-right px-4 py-3 font-bold w-28">Rate (₹)</th>
                  <th className="text-right px-5 py-3 font-bold w-28">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLedgerLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                      Loading detailed stock ledger…
                    </td>
                  </tr>
                ) : (ledgerData?.transactions || []).length === 0 ? (
                  <>
                    <tr className="bg-slate-50/30">
                      <td colSpan={5} className="px-5 py-2.5 font-semibold text-slate-500">Opening Balance</td>
                      <td colSpan={3} />
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-700">{fmt(ledgerData?.opening_qty)}</td>
                    </tr>
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-350 italic font-medium">
                        No transactions found during this period
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr className="bg-slate-50/30">
                      <td colSpan={5} className="px-5 py-2.5 font-semibold text-slate-500">Opening Balance</td>
                      <td colSpan={3} />
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-700">{fmt(ledgerData.opening_qty)}</td>
                    </tr>
                    {ledgerData.transactions.map((tx, idx) => {
                      const style = TYPE_STYLE[tx.voucher_type] || TYPE_STYLE.Journal;
                      return (
                        <tr key={idx} className="btn btn-primary">
                          <td className="px-5 py-2.5 text-slate-650 font-medium">{tx.date}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{tx.voucher_number}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-[5px] text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                              {tx.voucher_type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 font-semibold">{tx.particulars}</td>
                          <td className="px-4 py-2.5 text-slate-500 font-medium">{tx.location_name}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-emerald-600 font-bold">
                            {tx.inward_qty > 0 ? `+${fmt(tx.inward_qty)}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-rose-600 font-bold">
                            {tx.outward_qty > 0 ? `-${fmt(tx.outward_qty)}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-700">₹{fmt(tx.rate)}</td>
                          <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-800">{fmt(tx.balance)}</td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Table Footer Summary ── */}
        {!selectedItemId && summaryData && (
          <div className="btn btn-secondary">
            <span>TOTAL VALUE</span>
            <span className="font-mono text-[13px] text-slate-900">
              ₹{fmt(summaryData.rows?.reduce((s, r) => s + (r.value || 0), 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
