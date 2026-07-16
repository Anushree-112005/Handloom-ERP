import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { PieChart as PieIcon, CheckCircle, AlertCircle, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const today = new Date().toISOString().split('T')[0];

function Side({ title, color, groups, total }) {
  const [expanded, setExpanded] = useState({});
  const toggle = g => setExpanded(p => ({ ...p, [g]: !p[g] }));

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 400 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 20px', fontWeight: 600, color, fontSize: 11, textTransform: 'uppercase' }}>{title}</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '33%' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groups || {}).length === 0 && (
              <tr>
                <td colSpan={2} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>No entries</td>
              </tr>
            )}
            {Object.entries(groups || {}).map(([group, items]) => {
              const groupTotal = items.reduce((s, r) => s + r.amount, 0);
              const isOpen = expanded[group] !== false;
              return (
                <Fragment key={group}>
                  <tr 
                    onClick={() => toggle(group)} 
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  >
                    <td style={{ padding: '10px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        {group}
                      </div>
                    </td>
                    <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                      ₹{fmt(groupTotal)}
                    </td>
                  </tr>
                  {isOpen && items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 20px 10px 40px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.ledger}</td>
                      <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>₹{fmt(item.amount)}</td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
            <tr>
              <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: 12 }}>Total {title}</td>
              <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color }}>₹{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function BalanceSheet() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOf, setAsOf] = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setAsOf(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['balance-sheet', activeCompany?.id, asOf],
    queryFn: () => reports.balanceSheet({ company_id: activeCompany.id, as_of: asOf }),
    enabled: !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the Balance Sheet.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <PieIcon size={24} color="var(--primary)" />
            Balance Sheet
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Financial position summary showing Assets & Liabilities as on date
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

      {/* ── Controls and Balance Status Card ── */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
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
                <><AlertCircle size={14} /> Liabilities & Assets Mismatch</>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Balance Sheet', companyName: activeCompany.name, period: `As of ${asOf}`, data, reportType: 'balance-sheet' })}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Loading balance sheet details…</div>}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          <Side title="Liabilities" color="#8b5cf6" groups={data.liabilities?.groups} total={data.liabilities?.total} />
          <Side title="Assets"      color="#3b82f6" groups={data.assets?.groups}      total={data.assets?.total} />
        </div>
      )}
    </div>
  );
}
