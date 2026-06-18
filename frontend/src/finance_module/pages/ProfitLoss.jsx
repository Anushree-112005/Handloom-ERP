import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { TrendingUp, TrendingDown, Download, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fyStart = `${new Date().getFullYear()}-04-01`;
const today = new Date().toISOString().split('T')[0];

function GroupBlock({ title, icon: Icon, color, groups, total, emptyText }) {
  const [expanded, setExpanded] = useState({});
  const toggle = g => setExpanded(p => ({ ...p, [g]: !p[g] }));

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 400 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={14} style={{ color }} /> {title}
              </th>
              <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right', width: '33%' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(groups || {}).length === 0 && (
              <tr>
                <td colSpan={2} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>{emptyText}</td>
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
                  {isOpen && items.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 20px 10px 40px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{row.ledger}</td>
                      <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>₹{fmt(row.amount)}</td>
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

export default function ProfitLoss() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate, setToDate]     = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setFromDate(activeFy.start_date || fyStart);
      setToDate(activeFy.end_date || today);
    }
  }, [activeFy]);

  const { data, isLoading } = useQuery({
    queryKey: ['profit-loss', activeCompany?.id, fromDate, toDate],
    queryFn: () => reports.profitLoss({ company_id: activeCompany.id, from_date: fromDate, to_date: toDate }),
    enabled: !!activeCompany && !!fromDate && !!toDate,
  });

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the Profit & Loss.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={24} color="var(--primary)" />
            Profit & Loss Account
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Net income and expenditure statement for a specific period
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

      {/* ── Controls and Overview Card ── */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
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

          {data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: '8px', fontSize: 13, fontWeight: 600, border: `1px solid ${data.is_profit ? '#10b98140' : '#ef444440'}`, background: data.is_profit ? '#10b98110' : '#ef444410', color: data.is_profit ? '#10b981' : '#ef4444' }}>
              {data.is_profit ? (
                <><TrendingUp size={14} /> Net Profit: ₹{fmt(Math.abs(data.net_profit))}</>
              ) : (
                <><TrendingDown size={14} /> Net Loss: ₹{fmt(Math.abs(data.net_profit))}</>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={() => data && exportToPDF({ title: 'Profit & Loss Account', companyName: activeCompany.name, period: `${fromDate} to ${toDate}`, data, reportType: 'profit-loss' })}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Computing Profit & Loss Statement…</div>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Two-column P&L */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
            <GroupBlock
              title="Expenses (Dr)"
              icon={TrendingDown}
              color="#ef4444"
              groups={data.expenses?.groups}
              total={data.expenses?.total}
              emptyText="No expense accounts"
            />
            <GroupBlock
              title="Income (Cr)"
              icon={TrendingUp}
              color="#10b981"
              groups={data.income?.groups}
              total={data.income?.total}
              emptyText="No income accounts"
            />
          </div>

          {/* Net Result Banner */}
          <div style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, border: `1px solid ${data.is_profit ? '#10b98140' : '#ef444440'}`, background: data.is_profit ? '#10b9810a' : '#ef44440a' }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Period net result Summary</p>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{fromDate} to {toDate}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: data.is_profit ? '#10b981' : '#ef4444' }}>
                {data.is_profit ? '' : '('}₹{fmt(Math.abs(data.net_profit))}{data.is_profit ? '' : ')'}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                Income ₹{fmt(data.income?.total)} − Expenses ₹{fmt(data.expenses?.total)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
