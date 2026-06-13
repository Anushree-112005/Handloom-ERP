import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { ClipboardList, FileText, Download, Calendar } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fyStart = `${new Date().getFullYear()}-04-01`;
const today   = new Date().toISOString().split('T')[0];

function RegisterTable({ data, isLoading, mode }) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 animate-pulse font-medium text-xs">
        Loading invoice register…
      </div>
    );
  }
  if (!data?.rows?.length) {
    return (
      <div className="py-20 text-center text-slate-400 font-semibold text-xs">
        No {mode === 'sales' ? 'sales' : 'purchase'} invoices found in this period
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto max-h-[50vh] relative">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
            <tr>
              <th className="text-left px-5 py-3 font-bold">Date</th>
              <th className="text-left px-4 py-3 font-bold">Invoice No.</th>
              <th className="text-left px-4 py-3 font-bold">Party Name</th>
              <th className="text-left px-4 py-3 font-bold">Ref No.</th>
              <th className="text-right px-4 py-3 font-bold">{mode === 'sales' ? 'Sales Value (₹)' : 'Purchase Value (₹)'}</th>
              <th className="text-right px-4 py-3 font-bold">GST Amount (₹)</th>
              <th className="text-right px-5 py-3 font-bold">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.rows.map((row, i) => (
              <tr key={i} className="hover:bg-purple-50/15 transition-colors align-top">
                <td className="px-5 py-2.5 text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{row.voucher_number}</td>
                <td className="px-4 py-2.5 text-slate-700 font-semibold">{row.party}</td>
                <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">{row.reference_no || '—'}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[13px] text-slate-700 font-medium font-semibold">
                  ₹{fmt(mode === 'sales' ? row.sales_amount : row.purchase_amount)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[13px] text-amber-700 font-medium">
                  {row.gst_amount > 0 ? `₹${fmt(row.gst_amount)}` : '—'}
                </td>
                <td className="px-5 py-2.5 text-right font-mono text-[13px] text-slate-900 font-bold">
                  ₹{fmt(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
            <tr>
              <td colSpan={4} className="px-5 py-3 text-left text-slate-500 font-bold uppercase tracking-wider">
                Grand Total — {data.rows.length} invoice{data.rows.length !== 1 ? 's' : ''}
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-400" />
              <td className="px-4 py-3 text-right font-mono text-slate-400 border-l border-slate-100" />
              <td className="px-5 py-3 text-right font-mono text-[13px] text-emerald-700 font-bold border-l border-slate-100">
                ₹{fmt(data.grand_total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Enterprise Pagination Footer ── */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/20 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span>Show</span>
          <select className="bg-transparent border-none text-slate-700 focus:outline-none cursor-pointer font-semibold">
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-400">Page 1 of 1</span>
          <div className="flex items-center gap-1.5">
            <button disabled className="px-2.5 py-1.5 border border-slate-200/80 rounded-lg bg-white text-slate-300 cursor-not-allowed text-xs font-semibold transition-colors">
              Previous
            </button>
            <button disabled className="px-2.5 py-1.5 border border-slate-200/80 rounded-lg bg-white text-slate-300 cursor-not-allowed text-xs font-semibold transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesPurchaseRegister({ defaultTab = 'sales' }) {
  const { activeCompany, activeFy } = useCompanyStore();
  const [tab,      setTab]      = useState(defaultTab);
  const [fromDate, setFromDate] = useState(activeFy?.start_date || fyStart);
  const [toDate,   setToDate]   = useState(activeFy?.end_date || today);

  const params = { company_id: activeCompany?.id, from_date: fromDate, to_date: toDate };

  const { data: salesData,    isLoading: salesLoading }    = useQuery({ queryKey: ['sales-register', params], queryFn: () => reports.salesRegister(params), enabled: !!activeCompany && tab === 'sales' });
  const { data: purchaseData, isLoading: purchaseLoading } = useQuery({ queryKey: ['purchase-register', params], queryFn: () => reports.purchaseRegister(params), enabled: !!activeCompany && tab === 'purchase' });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company to view the Registers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100/30 shadow-sm">
            {tab === 'sales' ? <ClipboardList size={18} /> : <FileText size={18} />}
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">
              {tab === 'sales' ? 'Sales Register' : 'Purchase Register'}
            </h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Summary of all {tab === 'sales' ? 'inward tax invoices and billings' : 'outward bills and purchase vouchers'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Action Tabs Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
            <button 
              onClick={() => setTab('sales')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${tab === 'sales' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ClipboardList size={11} /> Sales
            </button>
            <button 
              onClick={() => setTab('purchase')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${tab === 'purchase' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText size={11} /> Purchase
            </button>
          </div>

          <button 
            onClick={() => {
              const activeData = tab === 'sales' ? salesData : purchaseData;
              if (activeData) exportToPDF({ title: tab === 'sales' ? 'Sales Register' : 'Purchase Register', companyName: activeCompany.name, period: `${fromDate} to ${toDate}`, data: { ...activeData, mode: tab }, reportType: 'register' });
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="cb-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
                />
              </div>
              <span className="text-slate-400 text-xs font-semibold">to</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-36 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {tab === 'sales'    && <RegisterTable data={salesData}    isLoading={salesLoading}    mode="sales" />}
        {tab === 'purchase' && <RegisterTable data={purchaseData} isLoading={purchaseLoading} mode="purchase" />}
      </div>
    </div>
  );
}
