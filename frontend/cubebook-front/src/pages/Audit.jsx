import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vouchers as vouchersApi } from '../api';
import useCompanyStore from '../store/companyStore';
import { ShieldCheck, Filter, Search } from 'lucide-react';

const today   = new Date().toISOString().split('T')[0];
const fyStart = `${new Date().getFullYear()}-04-01`;

const STATUS_STYLE = {
  Posted:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Cancelled: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Draft:     { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
};

const TYPE_COLOR = {
  Sales: '#3b82f6', Purchase: '#8b5cf6', Receipt: '#22c55e',
  Payment: '#f97316', Journal: '#eab308', Contra: '#14b8a6',
};

export default function Audit() {
  const { activeCompany } = useCompanyStore();
  const [fromDate, setFromDate] = useState(fyStart);
  const [toDate,   setToDate]   = useState(today);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');

  const { data: vList = [], isLoading } = useQuery({
    queryKey: ['audit-vouchers', activeCompany?.id, fromDate, toDate],
    queryFn: () => vouchersApi.list({ company_id: activeCompany.id, from_date: fromDate, to_date: toDate, limit: 500 }),
    enabled: !!activeCompany,
  });

  const filtered = vList.filter(v => {
    const matchSearch = !search || v.voucher_number?.toLowerCase().includes(search.toLowerCase()) || v.narration?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !status || v.status === status;
    return matchSearch && matchStatus;
  });

  const cancelled = vList.filter(v => v.status === 'Cancelled').length;
  const posted    = vList.filter(v => v.status === 'Posted').length;

  if (!activeCompany) return <p className="text-slate-500 text-center mt-20">Select a company first.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-slate-600" /> Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Voucher activity & modification history</p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="form-row">
        <div className="card">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Vouchers</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{vList.length}</p>
        </div>
        <div className="btn btn-success">
          <p className="text-xs text-emerald-600 font-semibold uppercase">Posted</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{posted}</p>
        </div>
        <div className="btn btn-danger">
          <p className="text-xs text-red-600 font-semibold uppercase">Cancelled</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="btn btn-secondary" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="btn btn-secondary" />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vouchers…"
            className="btn btn-secondary" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="btn btn-secondary">
          <option value="">All Status</option>
          <option value="Posted">Posted</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Draft">Draft</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} records</span>
      </div>

      {/* Audit Table */}
      <div className="card">
        <table className="data-table">
          <thead className="btn btn-secondary">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Voucher No.</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Narration</th>
              <th className="text-right px-4 py-3 font-semibold">Amount (₹)</th>
              <th className="text-center px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse">Loading audit log…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">No vouchers found.</td></tr>
            ) : filtered.map(v => {
              const s = STATUS_STYLE[v.status] || STATUS_STYLE.Posted;
              return (
                <tr key={v.id} className="btn btn-secondary">
                  <td className="px-5 py-2.5 text-slate-500 text-xs whitespace-nowrap">{v.date}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-700">{v.voucher_number}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: (TYPE_COLOR[v.voucher_type] || '#94a3b8') + '18', color: TYPE_COLOR[v.voucher_type] || '#94a3b8' }}>
                      {v.voucher_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs truncate max-w-xs">{v.narration || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-slate-800">
                    ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(v.total_amount || 0)}
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
