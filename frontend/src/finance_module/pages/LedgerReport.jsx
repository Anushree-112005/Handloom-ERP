import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports, ledgers as ledgersApi } from '../api';
import useCompanyStore from '../store/companyStore';
import { BookMarked, Download, Calendar, Filter } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fyStart = `${new Date().getFullYear()}-04-01`;
const today   = new Date().toISOString().split('T')[0];

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

export default function LedgerReport() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [ledgerId, setLedgerId] = useState('');
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate, setToDate]     = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setFromDate(activeFy.start_date || fyStart);
      setToDate(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data: ledgerList = [] } = useQuery({
    queryKey: ['ledgers', activeCompany?.id],
    queryFn: () => ledgersApi.list({ company_id: activeCompany.id }),
    enabled: !!activeCompany,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ledger-statement', ledgerId, fromDate, toDate],
    queryFn:  () => reports.ledgerStatement({ company_id: activeCompany.id, ledger_id: ledgerId, from_date: fromDate, to_date: toDate }),
    enabled:  !!activeCompany && !!ledgerId,
  });

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <BookMarked size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the Ledger Report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookMarked size={24} color="var(--primary)" />
            Ledger Report
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Detailed transaction statement and reconciliation for an account
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Active Company: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeCompany.name}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            FY: {activeFy?.label || 'Not set'} &nbsp;·&nbsp; {data?.transactions?.length || 0} ledger postings
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            {/* Ledger Select Dropdown */}
            <div style={{ position: 'relative' }}>
              <Filter style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <select 
                value={ledgerId}
                onChange={(e) => setLedgerId(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 36, width: 220, cursor: 'pointer' }}
              >
                <option value="">— Select Ledger —</option>
                {ledgerList.map(l => <option key={l.id} value={l.id}>{l.name} ({l.group})</option>)}
              </select>
            </div>

            {/* Period Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 36, width: 140 }}
                />
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>to</span>
              <div style={{ position: 'relative' }}>
                <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 36, width: 140 }}
                />
              </div>
            </div>
          </div>

          <button 
            onClick={() => data && exportToPDF({ title: 'Ledger Report', companyName: activeCompany.name, period: `${fromDate} to ${toDate}`, data, reportType: 'ledger' })}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <Download size={14} /> Export PDF
          </button>
        </div>

        {!ledgerId && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BookMarked size={40} style={{ opacity: 0.3, margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Select a ledger from the list to view statement</p>
          </div>
        )}

        {ledgerId && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Ledger Info Summary Panel */}
            {data && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between', padding: '16px 20px', background: '#fef3c740', borderBottom: '1px solid #fde68a' }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{data.ledger_name}</span>
                  <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 100, border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>{data.group}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Opening Balance</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      ₹{fmt(data.opening_balance)} <span style={{ fontSize: 10 }}>{data.opening_type}</span>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Closing Balance</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                      ₹{fmt(data.closing_balance)} <span style={{ fontSize: 10 }}>{data.closing_type}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Table or Grid */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                {/* Table Header */}
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '12%' }}>Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '15%' }}>Voucher No.</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '10%' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Narration</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Debit (₹)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Credit (₹)</th>
                    <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Balance (₹)</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading transactions statement…
                      </td>
                    </tr>
                  ) : data?.transactions?.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                        No transactions in this period
                      </td>
                    </tr>
                  ) : (
                    data?.transactions?.map((row, i) => {
                      const ts = TYPE_STYLE[row.voucher_type] || { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)', border: 'var(--border)' };
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.date}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{row.voucher_number}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 700, background: ts.bg, color: ts.text, border: `1px solid ${ts.border}` }}>
                              {row.voucher_type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.narration}>
                            {row.narration || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {row.dr_amount > 0 ? `₹${fmt(row.dr_amount)}` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {row.cr_amount > 0 ? `₹${fmt(row.cr_amount)}` : '—'}
                          </td>
                          <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 700 }}>
                            ₹{fmt(row.balance)} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{row.balance_type}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer */}
                {data && data?.transactions?.length > 0 && (
                  <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                    <tr>
                      <td colSpan={4} style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12 }}>
                        Period Totals
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                        ₹{fmt(data.period_dr)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#6366f1' }}>
                        ₹{fmt(data.period_cr)}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                        ₹{fmt(data.closing_balance)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{data.closing_type}</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
