import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports, stockItems } from '../api';
import useCompanyStore from '../store/companyStore';
import { Activity, ArrowLeft, Search, Calendar, ChevronRight, CornerDownRight } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const TYPE_STYLE = {
  Sales:       { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
  Purchase:    { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
  Receipt:     { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' },
  Payment:     { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  Journal:     { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' },
  Contra:      { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  'Debit Note':  { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' },
  'Credit Note': { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' },
};

export default function StockMovement() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || '2025-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeFy) {
      setFromDate(activeFy.start_date || '2025-04-01');
      setToDate(activeFy.end_date || new Date().toISOString().split('T')[0]);
    }
  }, [activeFy]);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company first.</p>
      </div>
    );
  }

  // Filter summary rows
  const filteredSummaryRows = (summaryData?.rows || []).filter(row =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={24} color="var(--primary)" />
            Stock Movement
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            {selectedItemId ? 'Detailed item ledger, inwards, outwards, and storage mapping' : 'Inventory valuation, stock items ledger summary, and period flows'}
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>Active Company: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeCompany.name}</span></div>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>FY: {activeFy?.label || 'Not set'}</p>
        </div>
      </div>

      {/* ── Detailed Ledger Summary Cards ── */}
      {selectedItemId && ledgerData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Opening Stock', value: `${fmt(ledgerData.opening_qty)} ${ledgerData.unit}`, color: 'var(--text-primary)', border: '#6366f1' },
            { label: 'Total Inwards (+)', value: `+${fmt((ledgerData.transactions||[]).reduce((s,t)=>s+(t.inward_qty||0),0))} ${ledgerData.unit}`, color: '#10b981', border: '#10b981' },
            { label: 'Total Outwards (-)', value: `-${fmt((ledgerData.transactions||[]).reduce((s,t)=>s+(t.outward_qty||0),0))} ${ledgerData.unit}`, color: '#ef4444', border: '#ef4444' },
            { label: 'Closing Balance', value: `${fmt(ledgerData.closing_qty)} ${ledgerData.unit}`, color: '#6366f1', border: '#6366f1' },
          ].map(({ label, value, color, border }) => (
            <div key={label} className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeft: `4px solid ${border}`, borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table & Toolbar Card ── */}
      <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            {selectedItemId && (
              <button
                onClick={() => { setSelectedItemId(null); setSearchQuery(''); }}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} /> Back to Summary
              </button>
            )}

            {/* Period Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="cb-input" style={{ paddingLeft: 36, width: 140 }} />
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>to</span>
              <div style={{ position: 'relative' }}>
                <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="cb-input" style={{ paddingLeft: 36, width: 140 }} />
              </div>
            </div>

            {selectedItemId && (
              <select value={selectedItemId} onChange={(e) => setSelectedItemId(Number(e.target.value))} className="cb-input" style={{ width: 200, cursor: 'pointer' }}>
                {dropdownItems.map(i => (<option key={i.id} value={i.id}>{i.name}</option>))}
              </select>
            )}
          </div>

          {!selectedItemId && (
            <div style={{ position: 'relative', width: 240 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <input type="text" placeholder="Search stock item…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="cb-input" style={{ paddingLeft: 36, width: '100%' }} />
            </div>
          )}
        </div>

        {/* ── Table Content ── */}
        <div style={{ overflowX: 'auto' }}>
          {/* Summary View */}
          {!selectedItemId ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
              <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Item Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Unit</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Opening Qty</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#10b981', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Inward Qty</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#ef4444', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Outward Qty</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Closing Qty</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Closing Value</th>
                </tr>
              </thead>
              <tbody>
                {isSummaryLoading ? (
                  <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading stock summary…</td></tr>
                ) : filteredSummaryRows.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>No stock items found for this period.</td></tr>
                ) : (
                  filteredSummaryRows.map(row => (
                    <tr key={row.id} onClick={() => setSelectedItemId(row.id)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {row.name} <ChevronRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.unit}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{fmt(row.opening_qty)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>+{fmt(row.inward_qty)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>-{fmt(row.outward_qty)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(row.closing_qty)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(row.rate)}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-primary)' }}>₹{fmt(row.value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Detailed Ledger View */
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
              <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Vch No.</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Particulars</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#10b981', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Inward</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#ef4444', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Outward</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLedgerLoading ? (
                  <tr><td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading detailed stock ledger…</td></tr>
                ) : (ledgerData?.transactions || []).length === 0 ? (
                  <>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <td colSpan={5} style={{ padding: '10px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Opening Balance</td>
                      <td colSpan={3} />
                      <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(ledgerData?.opening_qty)}</td>
                    </tr>
                    <tr><td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No transactions found during this period</td></tr>
                  </>
                ) : (
                  <>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan={5} style={{ padding: '10px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Opening Balance</td>
                      <td colSpan={3} />
                      <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(ledgerData.opening_qty)}</td>
                    </tr>
                    {ledgerData.transactions.map((tx, idx) => {
                      const style = TYPE_STYLE[tx.voucher_type] || TYPE_STYLE.Journal;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{tx.date}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{tx.voucher_number}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 700, background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>{tx.voucher_type}</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tx.particulars}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{tx.location_name}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>{tx.inward_qty > 0 ? `+${fmt(tx.inward_qty)}` : '—'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>{tx.outward_qty > 0 ? `-${fmt(tx.outward_qty)}` : '—'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(tx.rate)}</td>
                          <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(tx.balance)}</td>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '2px solid var(--border)', background: 'var(--bg-secondary)', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span style={{ textTransform: 'uppercase', fontSize: 12 }}>Total Value</span>
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800 }}>
              ₹{fmt(summaryData.rows?.reduce((s, r) => s + (r.value || 0), 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
