import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reports } from '../api';
import useCompanyStore from '../store/companyStore';
import { Warehouse, Calendar, Package, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function GodownSummary() {
  const { activeCompany, activeFy } = useCompanyStore();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (id) => setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  // Fetch godown summary items per location
  const { data: godowns = [], isLoading } = useQuery({
    queryKey: ['godown-summary', activeCompany?.id, asOfDate],
    queryFn: () => reports.godownSummary({
      company_id: activeCompany.id,
      as_of: asOfDate,
    }),
    enabled: !!activeCompany && !!asOfDate,
  });



  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <p className="text-sm font-medium">Please select a company first.</p>
      </div>
    );
  }

  const grandTotalValuation = godowns.reduce((s, g) => s + (g.total_value || 0), 0);

  const handleExport = () => {
    if (godowns) {
      exportToPDF({ title: 'Godown Summary', companyName: activeCompany.name, period: `As of ${asOfDate}`, data: { raw: godowns }, reportType: 'godown-summary' });
    }
  };

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
      <div className="cb-card px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <label className="text-slate-400 text-xs font-semibold flex items-center gap-1.5">
            Balance As Of Date:
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="pl-10 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all cursor-pointer"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 bg-purple-600 border border-transparent px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {/* ── Main Layout ── */}
      <div className="cb-card">
        <div className="overflow-x-auto max-h-[55vh] relative">
          <table className="w-full text-xs min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
              <tr>
                <th className="text-left px-5 py-3 font-bold w-1/3">Stock Item / Godown</th>
                <th className="text-right px-4 py-3 font-bold w-1/6">Qty On Hand</th>
                <th className="text-center px-4 py-3 font-bold w-1/6">Unit</th>
                <th className="text-right px-4 py-3 font-bold w-1/6">Avg. Rate</th>
                <th className="text-right px-5 py-3 font-bold w-1/6">Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading godown summary…
                  </td>
                </tr>
              ) : !godowns?.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Warehouse size={36} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-semibold">No godowns/locations found</p>
                  </td>
                </tr>
              ) : (
                godowns.map(g => {
                  const isOpen = expandedGroups[g.godown_id] !== false; // default open
                  return (
                    <Fragment key={g.godown_id}>
                      {/* Group Row */}
                      <tr
                        onClick={() => toggleGroup(g.godown_id)}
                        className="bg-slate-50/60 border-b border-slate-100 hover:bg-slate-100/80 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-2.5 font-semibold text-slate-800 flex items-center gap-2">
                          <span className="text-slate-400">
                            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </span>
                          {g.godown_name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500 font-semibold" />
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500 font-semibold" />
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500 font-semibold" />
                        <td className="px-5 py-2.5 text-right font-mono text-purple-700 font-semibold">
                          ₹{fmt(g.total_value)}
                        </td>
                      </tr>
                      
                      {/* Child Rows */}
                      {isOpen && (!g.items || g.items.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-5 py-3 pl-12 text-slate-400 text-xs italic">
                            No items in this location
                          </td>
                        </tr>
                      )}
                      {isOpen && g.items?.map((item, i) => (
                        <tr key={i} className="hover:bg-purple-50/15 transition-colors align-top">
                          <td className="px-5 py-2.5 pl-12 text-slate-500 font-medium">
                            {item.item_name}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-[13px] text-slate-800 font-bold">
                            {fmt(item.qty)}
                          </td>
                          <td className="px-4 py-2.5 text-center text-slate-500 font-medium">
                            {item.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-550">
                            ₹{fmt(item.rate)}
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono text-slate-900 font-bold">
                            ₹{fmt(item.value)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 text-xs font-bold text-slate-800 sticky bottom-0">
              <tr>
                <td colSpan={4} className="px-5 py-3 text-slate-500 font-bold uppercase tracking-wider">
                  Grand Total
                </td>
                <td className="px-5 py-3 text-right font-mono text-[13px] text-emerald-700 font-bold">
                  ₹{fmt(grandTotalValuation)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
