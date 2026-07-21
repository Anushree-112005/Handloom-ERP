import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { BookOpen, Search, Filter, Calendar, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VOUCHER_ACTIONS = [
  { label: 'Payment',  type: 'Payment',  color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'Receipt',  type: 'Receipt',  color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'Sales',    type: 'Sales',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Purchase', type: 'Purchase', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Journal',  type: 'Journal',  color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  { label: 'Contra',   type: 'Contra',   color: '#14b8a6', bg: '#f0fdfa', border: '#99f6e4' },
  { label: 'Debit Note', type: 'Debit Note', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { label: 'Credit Note',type: 'Credit Note',color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
];

const VOUCHER_TYPES = VOUCHER_ACTIONS.map(a => a.type);

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const DayBook = () => {
  const { activeCompany, activeFy } = useCompanyStore();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || '');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherType, setVoucherType] = useState('');

  useEffect(() => {
    if (activeFy) {
      setFromDate(activeFy.start_date || '');
      setToDate(activeFy.end_date || new Date().toISOString().split('T')[0]);
    }
  }, [activeFy]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['day-book', activeCompany?.id, fromDate, toDate, voucherType],
    queryFn: () => reports.dayBook({
      company_id: activeCompany.id,
      from_date: fromDate,
      to_date: toDate,
      voucher_type: voucherType || undefined
    }),
    enabled: !!activeCompany && !!fromDate && !!toDate
  });

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the Day Book.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={24} color="var(--primary)" />
            Day Book
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            View all transaction histories and postings for a specific period
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Active Company: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeCompany.name}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            FY: {activeFy?.label || 'Not set'} &nbsp;·&nbsp; {report?.vouchers?.length || 0} transactions
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            {/* Period Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 40, paddingRight: 10, width: 160 }}
                />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>to</span>
              <div style={{ position: 'relative' }}>
                <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 40, paddingRight: 10, width: 160 }}
                />
              </div>
            </div>

            {/* Type Select Dropdown */}
            <div style={{ position: 'relative' }}>
              <Filter style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <select 
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 36, width: 180, cursor: 'pointer' }}
              >
                <option value="">All Voucher Types</option>
                {VOUCHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(voucherType) && (
              <button
                onClick={() => setVoucherType('')}
                style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Showing <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{report?.vouchers?.length || 0}</span> entries</span>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: 100 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: 140 }}>Voucher No.</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: 120 }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Particulars</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: 120, textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: 120, textAlign: 'right' }}>Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : report?.vouchers?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <BookOpen size={40} style={{ opacity: 0.2 }} />
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No transactions found for this period</p>
                    </div>
                  </td>
                </tr>
              ) : (
                report?.vouchers?.map((v, i) => {
                  const actionData = VOUCHER_ACTIONS.find(a => a.type === v.voucher_type) || VOUCHER_ACTIONS[4];
                  return (
                    <tr 
                      key={v.id || i} 
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onClick={() => navigate('/cubebook/vouchers')}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{v.date}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{v.voucher_number}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: '9999px',
                          background: actionData.bg,
                          color: actionData.color,
                          border: `1px solid ${actionData.border}`
                        }}>
                          {v.voucher_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(v.entries || []).map((e, idx) => (
                            <div key={idx} style={{ 
                              fontWeight: e.dr_amount > 0 ? 600 : 400,
                              color: e.dr_amount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                              paddingLeft: e.dr_amount > 0 ? '0' : '16px'
                            }}>
                              {e.dr_amount > 0 ? 'By ' : 'To '}{e.ledger_name}
                            </div>
                          ))}
                        </div>
                        {v.narration && (
                          <div style={{ 
                            marginTop: '8px', 
                            fontSize: '11px', 
                            color: 'var(--text-muted)', 
                            fontStyle: 'italic', 
                            backgroundColor: '#f1f5f9', 
                            padding: '6px 10px', 
                            borderRadius: '4px',
                            maxWidth: '480px'
                          }}>
                            {v.narration}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(v.entries || []).map((e, idx) => (
                            <div key={idx} style={{ height: '19px', visibility: e.dr_amount > 0 ? 'visible' : 'hidden' }}>
                              {e.dr_amount > 0 ? fmt(e.dr_amount) : '-'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', textAlign: 'right', color: '#22c55e', fontWeight: 600 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(v.entries || []).map((e, idx) => (
                            <div key={idx} style={{ height: '19px', visibility: e.cr_amount > 0 ? 'visible' : 'hidden' }}>
                              {e.cr_amount > 0 ? fmt(e.cr_amount) : '-'}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Totals */}
        {report?.vouchers?.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Period Totals:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>
                <div style={{ color: '#ef4444', width: 100, textAlign: 'right' }}>₹{fmt(report.grand_total_dr)}</div>
                <div style={{ color: '#22c55e', width: 100, textAlign: 'right' }}>₹{fmt(report.grand_total_cr)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayBook;
