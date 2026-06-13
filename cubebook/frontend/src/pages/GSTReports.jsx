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
      <div className={`px-5 py-3 border-b border-slate-100 flex items-center justify-between border-l-4 ${type === 'output' ? 'border-indigo-500' : 'border-emerald-500'} bg-slate-50/20`}>
        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
          {type === 'output' ? <TrendingUp size={14} className="text-indigo-600" /> : <TrendingDown size={14} className="text-emerald-600" />}
          {title}
        </div>
        <span className={`font-mono text-xs font-bold ${type === 'output' ? 'text-indigo-700' : 'text-emerald-700'}`}>₹{fmt(total)}</span>
      </div>
      <div className="p-4 space-y-2 text-xs">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <span className="font-semibold text-slate-600">{r.label}</span>
            <span className="font-mono font-semibold text-slate-800">₹{fmt(r.value)}</span>
          </div>
        ))}
      </div>
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-between font-bold text-xs text-slate-700">
        <span>Total {title}</span>
        <span className="font-mono text-slate-900">₹{fmt(total)}</span>
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
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            <BadgePercent size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">GST Reports</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              GST summary, compliance filings, and GSTR forms details
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="cb-btn-secondary px-3.5 py-1.5 text-xs rounded-xl shadow-sm self-start flex items-center gap-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors"
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      {/* ── Tab Bar switcher ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/40">
        {['summary', 'gstr1', 'gstr3b', 'itc'].map(t => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => navigate(t === 'summary' ? '/gst' : `/gst/${t}`)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-white text-purple-700 shadow-sm border border-purple-100/60'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent border border-transparent'
              }`}
            >
              {t === 'summary' ? 'GST Summary' : t === 'gstr1' ? 'GSTR-1' : t === 'gstr3b' ? 'GSTR-3B' : 'Input Tax Credit'}
            </button>
          );
        })}
      </div>

      {/* ── Date Filter ── */}
      <div className="cb-card p-4 flex flex-wrap items-center gap-4 bg-slate-50/20">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
          />
        </div>
        {data && (
          <div className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold border ${
            data.net_payable >= 0
              ? 'bg-rose-50 text-rose-700 border-rose-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
            {data.net_payable >= 0
              ? `GST Payable: ₹${fmt(data.net_payable)}`
              : `GST Refundable: ₹${fmt(Math.abs(data.net_payable))}`}
          </div>
        )}
      </div>

      {isLoading && <div className="text-center py-16 text-slate-400 animate-pulse text-xs font-semibold">Loading GST data…</div>}

      {/* ── Summary Tab ── */}
      {tab === 'summary' && data && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Output Tax (Sales)</p>
              <p className="text-2xl font-bold font-mono text-indigo-800 mt-1.5">₹{fmt(data.output_tax)}</p>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-150 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Input Tax (Purchase)</p>
              <p className="text-2xl font-bold font-mono text-emerald-800 mt-1.5">₹{fmt(data.input_tax)}</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${
              data.net_payable >= 0 ? 'bg-rose-50/50 border-rose-150' : 'bg-emerald-50/50 border-emerald-150'
            }`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                data.net_payable >= 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                Net {data.net_payable >= 0 ? 'Payable' : 'Refundable'}
              </p>
              <p className={`text-2xl font-bold font-mono mt-1.5 ${
                data.net_payable >= 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}>
                ₹{fmt(Math.abs(data.net_payable))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GSTBreakdownCard title="Output Tax" data={data.breakdown?.output} type="output" color="#6366f1" />
            <GSTBreakdownCard title="Input Tax"  data={data.breakdown?.input}  type="input"  color="#10b981" />
            
            <div className="cb-card p-5 flex flex-col items-center bg-white justify-between">
              <h3 className="font-bold text-slate-700 text-xs self-start uppercase tracking-wider">Tax Distribution</h3>
              {pieData.some(d => d.value > 0) ? (
                <div className="w-full flex-1 flex flex-col justify-center items-center mt-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={[COLORS[0], COLORS[1]][i]} />)}
                      </Pie>
                      <Tooltip formatter={v => `₹${fmt(v)}`} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-300 text-xs mt-6">No GST data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GSTR-1 Tab ── */}
      {tab === 'gstr1' && (
        <div className="cb-card">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">GSTR-1 — Outward Supplies (Sales)</span>
            {gstr1Data?.summary && (
              <span className="text-xs font-semibold text-slate-500">
                Total Taxable Value: <strong className="font-mono text-slate-800">₹{fmt(gstr1Data.summary.total_taxable_value)}</strong> | Total Tax: <strong className="font-mono text-slate-800">₹{fmt(gstr1Data.summary.total_tax)}</strong>
              </span>
            )}
          </div>
          {gstr1Loading ? (
            <div className="text-center py-16 text-slate-400 animate-pulse text-xs font-semibold">Loading GSTR-1 data…</div>
          ) : !gstr1Data?.rows?.length ? (
            <div className="text-center py-20 text-slate-400 text-xs font-semibold">No GSTR-1 records found in this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold">Date</th>
                    <th className="text-left px-4 py-3 font-bold">Invoice No.</th>
                    <th className="text-left px-4 py-3 font-bold">Customer Name</th>
                    <th className="text-left px-4 py-3 font-bold">GSTIN</th>
                    <th className="text-center px-2 py-3 font-bold">State</th>
                    <th className="text-right px-4 py-3 font-bold">Taxable Value (₹)</th>
                    <th className="text-right px-4 py-3 font-bold">CGST (₹)</th>
                    <th className="text-right px-4 py-3 font-bold">SGST (₹)</th>
                    <th className="text-right px-4 py-3 font-bold">IGST (₹)</th>
                    <th className="text-right px-5 py-3 font-bold">Invoice Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {gstr1Data.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/15 transition-colors align-top">
                      <td className="px-5 py-2.5 text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{row.voucher_number}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-semibold">{row.customer_name}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{row.customer_gstin}</td>
                      <td className="px-2 py-2.5 text-center text-slate-500 font-semibold">{row.state_code}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700">₹{fmt(row.taxable_value)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-650">₹{fmt(row.cgst)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-650">₹{fmt(row.sgst)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-655">₹{fmt(row.igst)}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-900">₹{fmt(row.invoice_value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
                  <tr>
                    <td colSpan={5} className="px-5 py-3 text-left text-slate-500 font-bold uppercase tracking-wider">Grand Total</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(gstr1Data.summary.total_taxable_value)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(gstr1Data.summary.total_cgst)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(gstr1Data.summary.total_sgst)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(gstr1Data.summary.total_igst)}</td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-700">₹{fmt(gstr1Data.summary.total_invoice_value)}</td>
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
        <div className="cb-card">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Input Tax Credit (ITC) Ledger — Inward Supplies (Purchases)</span>
            {itcData?.summary && (
              <span className="text-xs font-semibold text-slate-500">
                Total Taxable Value: <strong className="font-mono text-slate-800">₹{fmt(itcData.summary.total_taxable_value)}</strong> | Total ITC Available: <strong className="font-mono text-emerald-750">₹{fmt(itcData.summary.total_tax)}</strong>
              </span>
            )}
          </div>
          {itcLoading ? (
            <div className="text-center py-16 text-slate-400 animate-pulse text-xs font-semibold">Loading ITC Ledger data…</div>
          ) : !itcData?.rows?.length ? (
            <div className="text-center py-20 text-slate-400 text-xs font-semibold">No ITC records found in this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold">Date</th>
                    <th className="text-left px-4 py-3 font-bold">Bill No.</th>
                    <th className="text-left px-4 py-3 font-bold">Supplier Name</th>
                    <th className="text-left px-4 py-3 font-bold">GSTIN</th>
                    <th className="text-center px-2 py-3 font-bold">State</th>
                    <th className="text-right px-4 py-3 font-bold">Taxable Value (₹)</th>
                    <th className="text-right px-4 py-3 font-bold">CGST Input (₹)</th>
                    <th className="text-right px-4 py-3 font-bold">SGST Input (₹)</th>
                    <th className="text-right px-4 py-3 font-bold">IGST Input (₹)</th>
                    <th className="text-right px-5 py-3 font-bold">Total ITC (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {itcData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/15 transition-colors align-top">
                      <td className="px-5 py-2.5 text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{row.voucher_number}</td>
                      <td className="px-4 py-2.5 text-slate-700 font-semibold">{row.supplier_name}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">{row.supplier_gstin}</td>
                      <td className="px-2 py-2.5 text-center text-slate-500 font-semibold">{row.state_code}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-700">₹{fmt(row.taxable_value)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-650">₹{fmt(row.cgst)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-650">₹{fmt(row.sgst)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-655">₹{fmt(row.igst)}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-bold text-emerald-700">₹{fmt(row.total_tax)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
                  <tr>
                    <td colSpan={5} className="px-5 py-3 text-left text-slate-500 font-bold uppercase tracking-wider">Grand Total</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(itcData.summary.total_taxable_value)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(itcData.summary.total_cgst)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(itcData.summary.total_sgst)}</td>
                    <td className="px-4 py-3 text-right font-mono">₹{fmt(itcData.summary.total_igst)}</td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-700">₹{fmt(itcData.summary.total_tax)}</td>
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
