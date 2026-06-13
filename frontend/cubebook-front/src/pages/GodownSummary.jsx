import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { Warehouse, Calendar, ArrowRight, Package } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function GodownSummary() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeGodownId, setActiveGodownId] = useState(null);

  // Fetch godown summary items per location
  const { data: godowns = [], isLoading } = useQuery({
    queryKey: ['godown-summary', activeCompany?.id, asOfDate],
    queryFn: () => reports.godownSummary({
      company_id: activeCompany.id,
      as_of: asOfDate,
    }),
    enabled: !!activeCompany && !!asOfDate,
  });

  // Set first godown as active when list loads
  useEffect(() => {
    if (godowns.length > 0 && activeGodownId === null) {
      setActiveGodownId(godowns[0].godown_id);
    }
  }, [godowns, activeGodownId]);

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company first.</p>
      </div>
    );
  }

  // Active godown data
  const activeGodown = godowns.find(g => g.godown_id === activeGodownId) || godowns[0];
  const grandTotalValuation = godowns.reduce((s, g) => s + (g.total_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center border border-pink-100/30 shadow-sm">
            <Warehouse size={18} />
          </div>
          <div>
            <h1 className="cb-page-title text-slate-900 tracking-tight font-bold">Godown Summary</h1>
            <p className="cb-page-subtitle text-slate-400 mt-0.5">
              Inventory valuation and quantities distributed across storage locations
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Total Inventory Value: <span className="font-bold text-slate-800">₹{fmt(grandTotalValuation)}</span>
          </p>
        </div>
      </div>

      {/* ── Controls Toolbar ── */}
      <div className="cb-card px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/20">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar size={12} /> Balance As Of Date
          </label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="btn btn-secondary"
          />
        </div>
        <div className="text-slate-400 text-xs font-semibold">
          Showing balances as of {asOfDate}
        </div>
      </div>

      {/* ── Main Layout (Sidebar + Stock Table Grid) ── */}
      <div className="form-row">
        {/* Left Side: Godown Tabs / List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Storage Locations ({godowns.length})
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="cb-card p-4 animate-pulse space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : godowns.length === 0 ? (
            <div className="cb-card p-6 text-center text-slate-400 text-xs font-semibold">
              No locations/godowns defined.
            </div>
          ) : (
            <div className="space-y-2.5">
              {godowns.map(g => {
                const isActive = g.godown_id === activeGodownId;
                return (
                  <button
                    key={g.godown_id}
                    onClick={() => setActiveGodownId(g.godown_id)}
                    className={`w-full text-left cb-card p-4 transition-all flex items-center justify-between border-l-4 group ${
                      isActive
                        ? 'border-purple-500 bg-white ring-1 ring-purple-100/50 shadow-sm'
                        : 'border-transparent hover:border-slate-350 hover:bg-slate-50/50 bg-white'
                    }`}
                  >
                    <div>
                      <h4 className={`text-xs font-bold transition-colors ${isActive ? 'text-purple-700' : 'text-slate-800'}`}>
                        {g.godown_name}
                      </h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">
                        {g.items?.length || 0} unique items
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className={`text-[11px] font-mono font-bold ${isActive ? 'text-purple-800' : 'text-slate-800'}`}>
                          ₹{fmt(g.total_value)}
                        </p>
                        <p className="text-[9px] text-slate-400">Valuation</p>
                      </div>
                      <ArrowRight size={12} className={`text-slate-300 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-purple-400' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Godown Inventory Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
            Items in {activeGodown?.godown_name || 'Selected Godown'}
          </div>

          <div className="cb-card">
            <div className="overflow-x-auto max-h-[50vh]">
              <table className="data-table">
                <thead className="btn btn-secondary">
                  <tr>
                    <th className="text-left px-5 py-3 font-bold">Stock Item</th>
                    <th className="text-right px-4 py-3 font-bold w-32">Qty On Hand</th>
                    <th className="text-center px-4 py-3 font-bold w-20">Unit</th>
                    <th className="text-right px-4 py-3 font-bold w-28">Avg. Rate</th>
                    <th className="text-right px-5 py-3 font-bold w-36">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                        Loading warehouse stock…
                      </td>
                    </tr>
                  ) : !activeGodown || !activeGodown.items || activeGodown.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <Package size={36} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 font-semibold">No stock items in this location</p>
                        <p className="text-[10px] text-slate-350 mt-0.5">Post a transaction or assign location to see stock here.</p>
                      </td>
                    </tr>
                  ) : (
                    activeGodown.items.map(item => (
                      <tr key={item.item_id} className="btn btn-primary">
                        <td className="px-5 py-2.5 font-semibold text-slate-800">{item.item_name}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">{fmt(item.qty)}</td>
                        <td className="px-4 py-2.5 text-center text-slate-500 font-medium">{item.unit}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-550">₹{fmt(item.rate)}</td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-slate-900">₹{fmt(item.value)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            {activeGodown && activeGodown.items && activeGodown.items.length > 0 && (
              <div className="btn btn-secondary">
                <span>TOTAL VALUATION IN {activeGodown.godown_name?.toUpperCase()}</span>
                <span className="font-mono text-[13px] text-slate-900">
                  ₹{fmt(activeGodown.total_value)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
