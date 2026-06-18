import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Boxes, Plus, Activity } from 'lucide-react';
import { stockItems } from '../api';
import useCompanyStore from '../store/companyStore';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function StockSummary() {
  const { activeCompany } = useCompanyStore();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['stock-items', activeCompany?.id],
    queryFn:  () => stockItems.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company first.</p>
      </div>
    );
  }

  const totalItems  = items.length;
  const totalValue  = items.reduce((s, i) => s + ((i.rate || 0) * (i.opening_qty || 0)), 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="btn btn-primary">
            <Boxes size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Stock Summary</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Inventory valuation, stock on hand, and group metrics
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/cubebook/inventory/stock-items/create')}
          className="cb-btn-primary px-3.5 py-2 text-xs rounded-xl shadow-sm self-start flex items-center gap-2"
        >
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="form-row">
        <div className="cb-card p-4 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Items</p>
          <p className="text-2xl font-bold font-mono text-indigo-800 mt-1.5">{totalItems}</p>
        </div>
        <div className="cb-card p-4 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Value</p>
          <p className="text-2xl font-bold font-mono text-slate-800 mt-1.5">₹{fmt(totalValue)}</p>
        </div>
        <div className="cb-card p-4 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Items</p>
          <p className="text-2xl font-bold font-mono text-emerald-800 mt-1.5">{items.filter(i => i.is_active !== false).length}</p>
        </div>
      </div>

      {/* ── Stock Table ── */}
      <div className="cb-card">
        <div className="overflow-x-auto max-h-[50vh] relative">
          <table className="data-table">
            <thead className="btn btn-secondary">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Item Name</th>
                <th className="text-left px-4 py-3 font-bold">Group</th>
                <th className="text-left px-4 py-3 font-bold">Unit</th>
                <th className="text-right px-4 py-3 font-bold w-28">GST Rate</th>
                <th className="text-right px-4 py-3 font-bold w-36">Rate</th>
                <th className="text-center px-5 py-3 font-bold w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading stock items…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Boxes size={36} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-semibold">No stock items found</p>
                    <button
                      onClick={() => navigate('/cubebook/inventory/stock-items/create')}
                      className="mt-2 text-purple-600 text-xs font-semibold hover:underline"
                    >
                      + Add your first item
                    </button>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="btn btn-primary" onClick={() => navigate(`/inventory/stock-items/alter/${item.id}`)}>
                    <td className="px-5 py-2.5 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium text-[11px]">{item.stock_group || item.group || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium">{item.unit || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      {item.gst_rate > 0 ? (
                        <span className="btn btn-primary">
                          {item.gst_rate}%
                        </span>
                      ) : <span className="text-slate-350">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 text-[13px]">
                      {item.rate ? `₹${fmt(item.rate)}` : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/inventory/stock-items/alter/${item.id}`)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Enterprise Pagination Footer ── */}
        <div className="btn btn-secondary">
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
              <button disabled className="btn btn-secondary">
                Previous
              </button>
              <button disabled className="btn btn-secondary">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Movement CTA ── */}
      <div className="btn btn-primary">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-indigo-600" />
          <div>
            <p className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Stock Movement Report</p>
            <p className="text-xs text-indigo-500/80 mt-0.5">Track stock ledger logs, inward/outward registers, and batch valuation</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/cubebook/inventory/movement')}
          className="btn btn-primary"
        >
          View Movement
        </button>
      </div>
    </div>
  );
}
