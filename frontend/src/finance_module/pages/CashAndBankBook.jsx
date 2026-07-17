import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { DollarSign, CreditCard, Download, Calendar } from 'lucide-react';

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

function CashBookTab({ companyId, activeFy }) {
  const [from, setFrom] = useState(activeFy?.start_date || fyStart);
  const [to,   setTo]   = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setFrom(activeFy.start_date || fyStart);
      setTo(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['cash-book', companyId, from, to],
    queryFn:  () => reports.cashBook({ company_id: companyId, from_date: from, to_date: to }),
    enabled:  !!companyId,
  });

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          {/* Period Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <input 
                type="date" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 40, paddingRight: 10, width: 160 }}
              />
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>to</span>
            <div style={{ position: 'relative' }}>
              <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <input 
                type="date" 
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 40, paddingRight: 10, width: 160 }}
              />
            </div>
          </div>
        </div>

        {data && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right', paddingRight: 24, borderRight: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Opening Balance</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(data.opening_balance)}</p>
            </div>
            <div style={{ textAlign: 'right', paddingRight: 24, borderRight: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Receipts</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}>₹{fmt(data.total_receipts)}</p>
            </div>
            <div style={{ textAlign: 'right', paddingRight: 24, borderRight: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Payments</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#ef4444' }}>₹{fmt(data.total_payments)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Closing Balance</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>₹{fmt(data.closing_balance)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
          {/* Table Header Grid */}
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '12%' }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '15%' }}>Voucher No.</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '10%' }}>Type</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Narration</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '15%' }}>Receipts (₹)</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '15%' }}>Payments (₹)</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading cash book statement…
                </td>
              </tr>
            ) : data?.transactions?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                  No cash transactions in this period
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
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.narration}>
                      {row.narration || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                      {row.receipts > 0 ? `₹${fmt(row.receipts)}` : '—'}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>
                      {row.payments > 0 ? `₹${fmt(row.payments)}` : '—'}
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
                  Closing Balance
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                  ₹{fmt(data.total_receipts)}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{fmt(data.total_payments)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function BankBookTab({ companyId, activeFy }) {
  const [from, setFrom] = useState(activeFy?.start_date || fyStart);
  const [to,   setTo]   = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setFrom(activeFy.start_date || fyStart);
      setTo(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['bank-book', companyId, from, to],
    queryFn:  () => reports.bankBook({ company_id: companyId, from_date: from, to_date: to }),
    enabled:  !!companyId,
  });

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          {/* Period Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <input 
                type="date" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 40, paddingRight: 10, width: 160 }}
              />
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>to</span>
            <div style={{ position: 'relative' }}>
              <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <input 
                type="date" 
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 40, paddingRight: 10, width: 160 }}
              />
            </div>
          </div>
        </div>

        {data && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right', paddingRight: 24, borderRight: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Deposits</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}>₹{fmt(data.total_deposits)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Withdrawals</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#ef4444' }}>₹{fmt(data.total_withdrawals)}</p>
            </div>
          </div>
        )}
      </div>

      {data?.banks?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: '#eff6ff' }}>
          {data.banks.map(b => (
            <span key={b.id} style={{ padding: '4px 10px', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: 11, fontWeight: 700 }}>
              🏦 {b.name}
            </span>
          ))}
        </div>
      )}

      {/* Table Container */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
          {/* Table Header Grid */}
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '10%' }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '12%' }}>Voucher No.</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '10%' }}>Type</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '15%' }}>Bank</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '10%' }}>Ref No.</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Narration</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Deposits (₹)</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '12%' }}>Withdrawals (₹)</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading bank book statement…
                </td>
              </tr>
            ) : data?.transactions?.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                  No bank transactions in this period
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
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{row.bank_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{row.reference_no || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.narration}>
                      {row.narration || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>
                      {row.deposits > 0 ? `₹${fmt(row.deposits)}` : '—'}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>
                      {row.withdrawals > 0 ? `₹${fmt(row.withdrawals)}` : '—'}
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
                <td colSpan={6} style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12 }}>
                  Totals
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                  ₹{fmt(data.total_deposits)}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{fmt(data.total_withdrawals)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default function CashAndBankBook({ defaultTab = 'cash' }) {
  const { activeCompany, activeFy } = useCompanyStore();
  const [tab, setTab] = useState(defaultTab);

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <DollarSign size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view Cash & Bank Book.</p>
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
            {tab === 'cash' ? <DollarSign size={24} color="var(--primary)" /> : <CreditCard size={24} color="var(--primary)" />}
            {tab === 'cash' ? 'Cash Book' : 'Bank Book'}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Statement of all cash accounts and banking ledger transactions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Action Tabs Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setTab('cash')}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', background: tab === 'cash' ? 'var(--bg-primary)' : 'transparent', color: tab === 'cash' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: tab === 'cash' ? 'var(--shadow-sm)' : 'none', border: 'none', cursor: 'pointer' }}
            >
              <DollarSign size={14} /> Cash
            </button>
            <button 
              onClick={() => setTab('bank')}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', background: tab === 'bank' ? 'var(--bg-primary)' : 'transparent', color: tab === 'bank' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: tab === 'bank' ? 'var(--shadow-sm)' : 'none', border: 'none', cursor: 'pointer' }}
            >
              <CreditCard size={14} /> Bank
            </button>
          </div>

          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {tab === 'cash' && <CashBookTab companyId={activeCompany.id} activeFy={activeFy} />}
      {tab === 'bank' && <BankBookTab companyId={activeCompany.id} activeFy={activeFy} />}
    </div>
  );
}
