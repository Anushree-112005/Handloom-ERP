import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { AlertTriangle, Download, ArrowUpRight, ArrowDownLeft, Calendar, Filter } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const today = new Date().toISOString().split('T')[0];

export default function OutstandingReport() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOf,      setAsOf]      = useState(activeFy?.end_date || today);
  const [partyType, setPartyType] = useState('');

  useEffect(() => {
    if (activeFy) {
      setAsOf(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['outstanding', activeCompany?.id, asOf, partyType],
    queryFn:  () => reports.outstanding({ company_id: activeCompany.id, as_of: asOf, party_type: partyType || undefined }),
    enabled:  !!activeCompany,
  });

  const debtors   = data?.rows?.filter(r => r.party_type === 'Debtor')   || [];
  const creditors = data?.rows?.filter(r => r.party_type === 'Creditor') || [];

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the Outstanding Report.</p>
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
            <AlertTriangle size={24} color="var(--primary)" />
            Outstanding Report
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Reconcile receivables from debtors and payables to creditors
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Active Company: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeCompany.name}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            FY: {activeFy?.label || 'Not set'}
          </p>
        </div>
      </div>

      {/* ── Controls Toolbar Card ── */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          {/* As Of date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>As of:</span>
            <div style={{ position: 'relative' }}>
              <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <input 
                type="date" 
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="cb-input"
                style={{ paddingLeft: 36, width: 140 }}
              />
            </div>
          </div>

          {/* Party type select */}
          <div style={{ position: 'relative' }}>
            <Filter style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
            <select 
              value={partyType}
              onChange={(e) => setPartyType(e.target.value)}
              className="cb-input"
              style={{ paddingLeft: 36, width: 200, cursor: 'pointer' }}
            >
              <option value="">All Parties</option>
              <option value="debtor">Debtors (Receivables)</option>
              <option value="creditor">Creditors (Payables)</option>
            </select>
          </div>

          {partyType && (
            <button
              onClick={() => setPartyType('')}
              style={{ color: 'var(--primary)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Outstanding Report', companyName: activeCompany.name, period: `As of ${asOf}`, data: { items: partyType === 'debtor' ? debtors : partyType === 'creditor' ? creditors : data.rows }, reportType: 'outstanding' })}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div className="card" style={{ background: '#3b82f610', border: '1px solid #3b82f640', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowUpRight size={14} /> Total Receivables
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: '#1e3a8a' }}>₹{fmt(data.total_receivable)}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
                {debtors.length} active customer account{debtors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="card" style={{ background: '#f59e0b10', border: '1px solid #f59e0b40', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowDownLeft size={14} /> Total Payables
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: '#78350f' }}>₹{fmt(data.total_payable)}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, fontWeight: 600, color: '#d97706' }}>
                {creditors.length} active vendor account{creditors.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Computing outstanding balances…</div>}

      {/* Debtors Table */}
      {(!partyType || partyType === 'debtor') && debtors.length > 0 && (
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#3b82f615', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowUpRight size={18} style={{ color: '#2563eb' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1e40af' }}>Receivables — Sundry Debtors</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Party Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '25%' }}>Group</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '25%' }}>Outstanding (₹)</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center', width: 100 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {debtors.map(r => (
                  <tr key={r.ledger_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.ledger_name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{r.group}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>₹{fmt(r.outstanding)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                        {r.balance_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                <tr>
                  <td colSpan={2} style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12 }}>
                    Total Receivables
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#1e40af' }}>
                    ₹{fmt(data?.total_receivable)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Creditors Table */}
      {(!partyType || partyType === 'creditor') && creditors.length > 0 && (
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#f59e0b15', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowDownLeft size={18} style={{ color: '#d97706' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>Payables — Sundry Creditors</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Party Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', width: '25%' }}>Group</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '25%' }}>Outstanding (₹)</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center', width: 100 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {creditors.map(r => (
                  <tr key={r.ledger_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.ledger_name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{r.group}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#b45309' }}>₹{fmt(r.outstanding)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                        {r.balance_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                <tr>
                  <td colSpan={2} style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12 }}>
                    Total Payables
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#92400e' }}>
                    ₹{fmt(data?.total_payable)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {data && data.rows?.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-primary)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
          <AlertTriangle size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px auto' }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No outstanding balances found</p>
        </div>
      )}
    </div>
  );
}
