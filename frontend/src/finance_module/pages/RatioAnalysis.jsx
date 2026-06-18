import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { BarChart3, RefreshCw, Calendar, Download } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt  = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtP = n => `${(n || 0).toFixed(2)}%`;
const fyStart = `${new Date().getFullYear()}-04-01`;
const today   = new Date().toISOString().split('T')[0];

const ratioMeta = [
  { key: 'current_ratio',        label: 'Current Ratio',        suffix: ':1',  color: '#6366f1', desc: 'Current Assets / Current Liabilities' },
  { key: 'gross_profit_ratio',   label: 'Gross Profit Ratio',   suffix: '%',   color: '#10b981', desc: 'Gross Profit / Revenue × 100' },
  { key: 'net_profit_ratio',     label: 'Net Profit Ratio',     suffix: '%',   color: '#3b82f6', desc: 'Net Profit / Revenue × 100' },
  { key: 'working_capital',      label: 'Working Capital',      suffix: '',    color: '#f59e0b', desc: 'Current Assets − Current Liabilities' },
];

const statCards = [
  { key: 'revenue',              label: 'Total Revenue',        color: '#10b981' },
  { key: 'net_profit',           label: 'Net Profit / Loss',    color: '#6366f1' },
  { key: 'current_assets',       label: 'Current Assets',       color: '#3b82f6' },
  { key: 'current_liabilities',  label: 'Current Liabilities',  color: '#f59e0b' },
  { key: 'total_assets',         label: 'Total Assets',         color: '#8b5cf6' },
];

function RatioGauge({ label, value, suffix, color, desc }) {
  const display = suffix === '%' ? fmtP(value) : suffix === ':1' ? `${(value || 0).toFixed(2)}:1` : `₹${fmt(value)}`;
  return (
    <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color + '15', color }}>
          <BarChart3 size={20} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', maxWidth: 120, lineHeight: 1.3, fontWeight: 600 }}>{desc}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      <p style={{ margin: '8px 0 0 0', fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color }}>{display}</p>
    </div>
  );
}

export default function RatioAnalysis() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate,   setToDate]   = useState(activeFy?.end_date || today);

  useEffect(() => {
    if (activeFy) {
      setFromDate(activeFy.start_date || fyStart);
      setToDate(activeFy.end_date || today);
    }
  }, [activeFy]);

  const params = { company_id: activeCompany?.id, as_of: toDate, from_date: fromDate, to_date: toDate };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ratio-analysis', activeCompany?.id, fromDate, toDate],
    queryFn:  () => reports.ratioAnalysis(params),
    enabled:  !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <BarChart3 size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the Ratio Analysis.</p>
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
            <BarChart3 size={24} color="var(--primary)" />
            Ratio Analysis
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Key operational performance and financial health ratios
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => refetch()}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button 
            onClick={() => data && exportToPDF({ title: 'Ratio Analysis', companyName: activeCompany.name, period: `${fromDate} to ${toDate}`, data, reportType: 'ratio' })}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Computing key ratios…</div>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Ratio KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {ratioMeta.map(r => (
              <RatioGauge key={r.key} label={r.label} value={data[r.key]} suffix={r.suffix} color={r.color} desc={r.desc} />
            ))}
          </div>

          {/* Supporting Figures */}
          <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Supporting Financial Figures
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {statCards.map((s, i) => (
                <div key={s.key} style={{ padding: '24px 20px', textAlign: 'center', borderRight: i < statCards.length - 1 ? '1px solid var(--border)' : 'none', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: s.color }}>₹{fmt(data[s.key])}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
            <div style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${data.current_ratio >= 2 ? '#10b98140' : data.current_ratio >= 1 ? '#f59e0b40' : '#ef444440'}`, background: data.current_ratio >= 2 ? '#10b98110' : data.current_ratio >= 1 ? '#f59e0b10' : '#ef444410' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, color: data.current_ratio >= 2 ? '#065f46' : data.current_ratio >= 1 ? '#92400e' : '#991b1b' }}>Current Ratio Analaysis: {data.current_ratio?.toFixed(2)}:1</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: data.current_ratio >= 2 ? '#064e3b' : data.current_ratio >= 1 ? '#78350f' : '#7f1d1d', lineHeight: 1.5 }}>
                {data.current_ratio >= 2 ? '✅ Excellent liquidity status — the company is in a highly secure position to meet its short-term debt obligations.' :
                 data.current_ratio >= 1 ? '⚠️ Marginal liquidity status — monitor working capital buffers. The standard baseline target is ≥ 2:1.' :
                 '❌ Critical liquidity crunch — current liabilities exceed current assets. Significant risk of short-term cash deficits.'}
              </p>
            </div>
            <div style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${data.net_profit_ratio > 10 ? '#10b98140' : data.net_profit_ratio > 0 ? '#f59e0b40' : '#ef444440'}`, background: data.net_profit_ratio > 10 ? '#10b98110' : data.net_profit_ratio > 0 ? '#f59e0b10' : '#ef444410' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 700, color: data.net_profit_ratio > 10 ? '#065f46' : data.net_profit_ratio > 0 ? '#92400e' : '#991b1b' }}>Net Profit Ratio Analysis: {fmtP(data.net_profit_ratio)}</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: data.net_profit_ratio > 10 ? '#064e3b' : data.net_profit_ratio > 0 ? '#78350f' : '#7f1d1d', lineHeight: 1.5 }}>
                {data.net_profit_ratio > 10 ? '✅ Strong profitability — outstanding net yield margin exceeding 10% on sales revenues.' :
                 data.net_profit_ratio > 0 ? '⚠️ Profitable but slim net returns. Suggests checking operational cost optimization strategies.' :
                 '❌ Operating deficit — business has run at a net loss in this period. Review overhead costs and pricing structures.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
