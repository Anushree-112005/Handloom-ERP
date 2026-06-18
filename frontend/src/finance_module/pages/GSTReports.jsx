import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { BadgePercent, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { exportToPDF } from '../utils/pdfExport';

const fmt  = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fyStart = `${new Date().getFullYear()}-04-01`;
const today   = new Date().toISOString().split('T')[0];
const COLORS  = ['#6366f1', '#10b981', '#f59e0b'];

function GSTBreakdownCard({ title, data, type, color }) {
  if (!data) return null;
  const rows = [
    { label: 'CGST',  value: data.cgst  },
    { label: 'SGST',  value: data.sgst  },
    { label: 'IGST',  value: data.igst  },
  ];
  const total = rows.reduce((s, r) => s + (r.value || 0), 0);
  return (
    <div className="cb-card">
      <div className="overflow-x-auto max-h-[50vh]">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
            <tr>
              <th className="text-left px-5 py-3 font-bold flex items-center gap-2 border-l-4 border-transparent" style={{ borderLeftColor: type === 'output' ? '#6366f1' : '#10b981' }}>
                {type === 'output' ? <TrendingUp size={14} className="text-indigo-600" /> : <TrendingDown size={14} className="text-emerald-600" />}
                {title}
              </th>
              <th className="text-right px-5 py-3 font-bold">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map(r => (
              <tr key={r.label} className="hover:bg-purple-50/15 transition-colors align-top">
                <td className="px-5 py-2.5 font-semibold text-slate-600">{r.label}</td>
                <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-800">₹{fmt(r.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
            <tr>
              <td className="px-5 py-3 text-left text-slate-500 font-bold uppercase tracking-wider">Total {title}</td>
              <td className={`px-5 py-3 text-right font-mono text-[13px] font-bold ${type === 'output' ? 'text-indigo-700' : 'text-emerald-700'}`}>₹{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function GSTReports() {
  const { activeCompany } = useCompanyStore();
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate,   setToDate]   = useState(today);

  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  const tab = ['gstr1', 'gstr3b', 'itc'].includes(lastSegment) ? lastSegment : 'summary';

  const { data, isLoading } = useQuery({
    queryKey: ['gst-summary', activeCompany?.id, fromDate, toDate],
    queryFn:  () => reports.gstSummary({ company_id: activeCompany.id, from_date: fromDate, to_date: toDate }),
    enabled:  !!activeCompany,
  });

  const { data: gstr1Data, isLoading: gstr1Loading } = useQuery({
    queryKey: ['gstr1', activeCompany?.id, fromDate, toDate],
    queryFn:  () => reports.gstr1({ company_id: activeCompany.id, from_date: fromDate, to_date: toDate }),
    enabled:  !!activeCompany && tab === 'gstr1',
  });

  const { data: itcData, isLoading: itcLoading } = useQuery({
    queryKey: ['itc', activeCompany?.id, fromDate, toDate],
    queryFn:  () => reports.itcLedger({ company_id: activeCompany.id, from_date: fromDate, to_date: toDate }),
    enabled:  !!activeCompany && tab === 'itc',
  });

  const pieData = data ? [
    { name: 'Output Tax', value: data.output_tax },
    { name: 'Input Tax',  value: data.input_tax  },
  ] : [];

  const handleExport = () => {
    const company = activeCompany?.name || 'Company';
    const period  = `Period: ${fromDate} to ${toDate}`;

    if (tab === 'summary' && data) {
      exportToPDF({ title: 'GST Summary', companyName: company, period, data, reportType: 'gst-summary' });
    } else if (tab === 'gstr1' && gstr1Data) {
      exportToPDF({ title: 'GSTR-1 Outward Supplies', companyName: company, period, data: gstr1Data, reportType: 'gstr1' });
    } else if (tab === 'gstr3b' && data) {
      exportToPDF({ title: 'GSTR-3B Return Summary', companyName: company, period, data, reportType: 'gstr3b' });
    } else if (tab === 'itc' && itcData) {
      exportToPDF({ title: 'Input Tax Credit Ledger', companyName: company, period, data: itcData, reportType: 'itc' });
    } else {
      alert('No data to export yet. Please wait for data to load.');
    }
  };

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company first.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BadgePercent size={24} color="var(--primary)" />
            GST Reports
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            GST summary, compliance filings, and GSTR forms details
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> Export PDF
        </button>
      </div>

      {/* ── Tab Bar switcher ── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
        {['summary', 'gstr1', 'gstr3b', 'itc'].map(t => {
          const active = tab === t;
          return (
            <button key={t} onClick={() => navigate(t === 'summary' ? '/gst' : `/gst/${t}`)}
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: active ? 'var(--bg-primary)' : 'transparent', color: active ? 'var(--primary)' : 'var(--text-muted)', boxShadow: active ? 'var(--shadow-sm)' : 'none', border: 'none', cursor: 'pointer' }}
            >
              {t === 'summary' ? 'GST Summary' : t === 'gstr1' ? 'GSTR-1' : t === 'gstr3b' ? 'GSTR-3B' : 'Input Tax Credit'}
            </button>
          );
        })}
      </div>

      {/* ── Date Filter Toolbar ── */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>From:</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="cb-input" style={{ width: 140 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>To:</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="cb-input" style={{ width: 140 }} />
        </div>
        {data && (
          <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: data.net_payable >= 0 ? '#fee2e2' : '#d1fae5', color: data.net_payable >= 0 ? '#b91c1c' : '#065f46', border: `1px solid ${data.net_payable >= 0 ? '#fecaca' : '#a7f3d0'}` }}>
            {data.net_payable >= 0 ? `GST Payable: ₹${fmt(data.net_payable)}` : `GST Refundable: ₹${fmt(Math.abs(data.net_payable))}`}
          </div>
        )}
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Loading GST data…</div>}

      {/* ── Summary Tab ── */}
      {tab === 'summary' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Output Tax (Sales)', value: `₹${fmt(data.output_tax)}`, bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
              { label: 'Input Tax (Purchase)', value: `₹${fmt(data.input_tax)}`, bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
              { label: `Net ${data.net_payable >= 0 ? 'Payable' : 'Refundable'}`, value: `₹${fmt(Math.abs(data.net_payable))}`, bg: data.net_payable >= 0 ? '#fee2e2' : '#d1fae5', color: data.net_payable >= 0 ? '#b91c1c' : '#065f46', border: data.net_payable >= 0 ? '#fecaca' : '#a7f3d0' },
            ].map(({ label, value, bg, color, border }) => (
              <div key={label} style={{ padding: '20px 24px', borderRadius: 12, background: bg, border: `1px solid ${border}`, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <GSTBreakdownCard title="Output Tax" data={data.breakdown?.output} type="output" color="#6366f1" />
            <GSTBreakdownCard title="Input Tax"  data={data.breakdown?.input}  type="input"  color="#10b981" />
            
            <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tax Distribution</h3>
              {pieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={[COLORS[0], COLORS[1]][i]} />)}
                    </Pie>
                    <Tooltip formatter={v => `₹${fmt(v)}`} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 24 }}>No GST data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GSTR-1 Tab ── */}
      {tab === 'gstr1' && (
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, textTransform: 'uppercase' }}>GSTR-1 — Outward Supplies (Sales)</span>
            {gstr1Data?.summary && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total Taxable: <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(gstr1Data.summary.total_taxable_value)}</strong> | Total Tax: <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(gstr1Data.summary.total_tax)}</strong>
              </span>
            )}
          </div>
          {gstr1Loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading GSTR-1 data…</div>
          ) : !gstr1Data?.rows?.length ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No GSTR-1 records found in this period.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    {['Date','Invoice No.','Customer Name','GSTIN','State','Taxable Value (₹)','CGST (₹)','SGST (₹)','IGST (₹)','Invoice Value (₹)'].map((h,i) => (
                      <th key={h} style={{ padding: `12px ${i===0?'20px':i===9?'20px':'16px'}`, fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: i>=5 ? 'right' : i===4 ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gstr1Data.rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{row.voucher_number}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{row.customer_name}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{row.customer_gstin}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>{row.state_code}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>₹{fmt(row.taxable_value)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(row.cgst)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(row.sgst)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(row.igst)}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>₹{fmt(row.invoice_value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                  <tr>
                    <td colSpan={5} style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12 }}>Grand Total</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>₹{fmt(gstr1Data.summary.total_taxable_value)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(gstr1Data.summary.total_cgst)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(gstr1Data.summary.total_sgst)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(gstr1Data.summary.total_igst)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>₹{fmt(gstr1Data.summary.total_invoice_value)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── GSTR-3B Tab ── */}
      {tab === 'gstr3b' && data && (
        <div className="space-y-6">
          {/* Table 3.1 Outward Supplies */}
          <div className="cb-card">
            <div className="px-5 py-3 border-b border-slate-100 bg-indigo-50/10 border-l-4 border-indigo-500 font-bold text-slate-800 text-xs uppercase tracking-wider">
              Table 3.1: Details of Outward Taxable Supplies (Sales)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold">Nature of Supplies</th>
                    <th className="text-right px-4 py-3 font-bold">Integrated Tax (IGST)</th>
                    <th className="text-right px-4 py-3 font-bold">Central Tax (CGST)</th>
                    <th className="text-right px-4 py-3 font-bold">State/UT Tax (SGST)</th>
                    <th className="text-right px-5 py-3 font-bold">Total Tax Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr className="align-middle">
                    <td className="px-5 py-4 font-semibold text-slate-700 leading-relaxed">(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</td>
                    <td className="px-4 py-4 text-right font-mono font-semibold text-slate-800">₹{fmt(data.breakdown?.output?.igst)}</td>
                    <td className="px-4 py-4 text-right font-mono font-semibold text-slate-800">₹{fmt(data.breakdown?.output?.cgst)}</td>
                    <td className="px-4 py-4 text-right font-mono font-semibold text-slate-800">₹{fmt(data.breakdown?.output?.sgst)}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">₹{fmt(data.output_tax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4 Eligible ITC */}
          <div className="cb-card">
            <div className="px-5 py-3 border-b border-slate-100 bg-emerald-50/10 border-l-4 border-emerald-500 font-bold text-slate-800 text-xs uppercase tracking-wider">
              Table 4: Details of Eligible Input Tax Credit (ITC)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold">ITC Details</th>
                    <th className="text-right px-4 py-3 font-bold">Integrated Tax (IGST)</th>
                    <th className="text-right px-4 py-3 font-bold">Central Tax (CGST)</th>
                    <th className="text-right px-4 py-3 font-bold">State/UT Tax (SGST)</th>
                    <th className="text-right px-5 py-3 font-bold">Total ITC Available (₹)</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr className="align-middle">
                    <td className="px-5 py-4 font-semibold text-slate-700 leading-relaxed">(A) ITC Available (whether in full or part) - All other ITC</td>
                    <td className="px-4 py-4 text-right font-mono font-semibold text-slate-800">₹{fmt(data.breakdown?.input?.igst)}</td>
                    <td className="px-4 py-4 text-right font-mono font-semibold text-slate-800">₹{fmt(data.breakdown?.input?.cgst)}</td>
                    <td className="px-4 py-4 text-right font-mono font-semibold text-slate-800">₹{fmt(data.breakdown?.input?.sgst)}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">₹{fmt(data.input_tax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 6 Net Tax Payable */}
          <div className="cb-card">
            <div className="px-5 py-3 border-b border-slate-100 bg-purple-50/10 border-l-4 border-purple-500 font-bold text-slate-800 text-xs uppercase tracking-wider">
              Table 6.1: Payment of Tax (Net Liability Summary)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold">Tax Description</th>
                    <th className="text-right px-4 py-3 font-bold">Output Tax (A)</th>
                    <th className="text-right px-4 py-3 font-bold">Eligible ITC (B)</th>
                    <th className="text-right px-5 py-3 font-bold">Net Payable / Refundable (A - B)</th>
                  </tr>
                </thead>
                <tbody className="bg-white font-medium divide-y divide-slate-100">
                  <tr>
                    <td className="px-5 py-3 text-slate-750 font-semibold">Integrated Tax (IGST)</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.breakdown?.output?.igst)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.breakdown?.input?.igst)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-bold ${data.breakdown?.output?.igst - data.breakdown?.input?.igst >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      ₹{fmt(data.breakdown?.output?.igst - data.breakdown?.input?.igst)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-slate-750 font-semibold">Central Tax (CGST)</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.breakdown?.output?.cgst)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.breakdown?.input?.cgst)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-bold ${data.breakdown?.output?.cgst - data.breakdown?.input?.cgst >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      ₹{fmt(data.breakdown?.output?.cgst - data.breakdown?.input?.cgst)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-slate-750 font-semibold">State/UT Tax (SGST)</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.breakdown?.output?.sgst)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.breakdown?.input?.sgst)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-bold ${data.breakdown?.output?.sgst - data.breakdown?.input?.sgst >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      ₹{fmt(data.breakdown?.output?.sgst - data.breakdown?.input?.sgst)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800">
                  <tr>
                    <td className="px-5 py-3 text-left text-slate-500 font-bold uppercase tracking-wider">Total Return Summary</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.output_tax)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(data.input_tax)}</td>
                    <td className={`px-5 py-3 text-right font-mono text-xs font-extrabold ${data.net_payable >= 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                      ₹{fmt(Math.abs(data.net_payable))} {data.net_payable >= 0 ? 'Payable' : 'Refundable'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ITC Ledger Tab ── */}
      {tab === 'itc' && (
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, textTransform: 'uppercase' }}>Input Tax Credit (ITC) Ledger — Inward Supplies</span>
            {itcData?.summary && (
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total Taxable: <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(itcData.summary.total_taxable_value)}</strong> | Total ITC: <strong style={{ fontFamily: 'monospace', color: '#10b981' }}>₹{fmt(itcData.summary.total_tax)}</strong>
              </span>
            )}
          </div>
          {itcLoading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ITC Ledger data…</div>
          ) : !itcData?.rows?.length ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>No ITC records found in this period.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    {['Date','Bill No.','Supplier Name','GSTIN','State','Taxable Value (₹)','CGST Input (₹)','SGST Input (₹)','IGST Input (₹)','Total ITC (₹)'].map((h,i) => (
                      <th key={h} style={{ padding: `12px ${i===0?'20px':i===9?'20px':'16px'}`, fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: i>=5 ? 'right' : i===4 ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itcData.rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{row.voucher_number}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{row.supplier_name}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{row.supplier_gstin}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>{row.state_code}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>₹{fmt(row.taxable_value)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(row.cgst)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(row.sgst)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>₹{fmt(row.igst)}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>₹{fmt(row.total_tax)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                  <tr>
                    <td colSpan={5} style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12 }}>Grand Total</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>₹{fmt(itcData.summary.total_taxable_value)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(itcData.summary.total_cgst)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(itcData.summary.total_sgst)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)' }}>₹{fmt(itcData.summary.total_igst)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>₹{fmt(itcData.summary.total_tax)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
