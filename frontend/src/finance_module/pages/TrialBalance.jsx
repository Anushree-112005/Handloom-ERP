import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { Scale, CheckCircle, AlertCircle, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const today = new Date().toISOString().split('T')[0];
const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function TrialBalance() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOf, setAsOf] = useState(activeFy?.end_date || today);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (activeFy) {
      setAsOf(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['trial-balance', activeCompany?.id, asOf],
    queryFn: () => reports.trialBalance({ company_id: activeCompany.id, as_of: asOf }),
    enabled: !!activeCompany,
  });

  // Group rows by group name
  const grouped = {};
  (data?.rows || []).forEach(r => {
    if (!grouped[r.group]) grouped[r.group] = [];
    grouped[r.group].push(r);
  });

  const toggleGroup = g => setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Scale size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the Trial Balance.</p>
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
            <Scale size={24} color="var(--primary)" />
            Trial Balance
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Debit/Credit balancing as on date
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Active Company: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeCompany.name}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            FY: {activeFy?.label || 'Not set'} &nbsp;·&nbsp; {data?.rows?.length || 0} ledger balances
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>As of Date:</span>
              <div style={{ position: 'relative' }}>
                <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input
                  type="date"
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 40, paddingRight: 10, width: 160 }}
                />
              </div>
            </div>

            {data && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '8px', fontSize: 13, fontWeight: 600, border: `1px solid ${data.is_balanced ? '#10b98140' : '#ef444440'}`, background: data.is_balanced ? '#10b98110' : '#ef444410', color: data.is_balanced ? '#10b981' : '#ef4444' }}>
                {data.is_balanced ? (
                  <><CheckCircle size={14} /> Balanced</>
                ) : (
                  <><AlertCircle size={14} /> Difference: ₹{fmt(Math.abs(data.total_dr - data.total_cr))}</>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => data && exportToPDF({ title: 'Trial Balance', companyName: activeCompany.name, period: `As of ${asOf}`, data: { raw: data, grouped }, reportType: 'trial-balance' })}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <Download size={14} /> Export PDF
          </button>
        </div>

        {/* Table Container */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '33%' }}>Particulars</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Opening Dr (₹)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Opening Cr (₹)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Closing Dr (₹)</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Closing Cr (₹)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading trial balance…
                  </td>
                </tr>
              ) : !data?.rows?.length ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
                      <Scale size={40} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No ledger balances found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                Object.entries(grouped).map(([group, rows]) => {
                  const groupDr = rows.filter(r => r.closing_type === 'Dr').reduce((s, r) => s + r.closing, 0);
                  const groupCr = rows.filter(r => r.closing_type === 'Cr').reduce((s, r) => s + r.closing, 0);
                  const isOpen = expandedGroups[group] !== false; // default open

                  return (
                    <Fragment key={group}>
                      {/* Group Row */}
                      <tr
                        onClick={() => toggleGroup(group)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      >
                        <td style={{ padding: '10px 20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          {group}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-muted)' }} />
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-muted)' }} />
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#ef4444' }}>
                          {groupDr > 0 ? `₹${fmt(groupDr)}` : ''}
                        </td>
                        <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>
                          {groupCr > 0 ? `₹${fmt(groupCr)}` : ''}
                        </td>
                      </tr>

                      {/* Ledger Rows */}
                      {isOpen && rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 20px 10px 40px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.ledger}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {r.opening_dr > 0 ? `₹${fmt(r.opening_dr)}` : '—'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {r.opening_cr > 0 ? `₹${fmt(r.opening_cr)}` : '—'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {r.closing_type === 'Dr' ? `₹${fmt(r.closing)}` : '—'}
                          </td>
                          <td style={{ padding: '10px 20px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {r.closing_type === 'Cr' ? `₹${fmt(r.closing)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
            {/* Grand Total Footer */}
            {data && (
              <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                <tr>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: 12 }}>
                    Grand Total
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }} />
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-muted)' }} />
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#ef4444' }}>
                    ₹{fmt(data.total_dr)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#10b981' }}>
                    ₹{fmt(data.total_cr)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
