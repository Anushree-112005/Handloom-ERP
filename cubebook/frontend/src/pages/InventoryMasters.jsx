import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import useCompanyStore from '../store/companyStore';
import { stockGroups, stockCategories, stockItems, units, locations } from '../api';
import { exportToPDF } from '../utils/pdfExport';
import {
  Layers, Tag, Package, Ruler, Warehouse,
  Plus, Pencil, Trash2, Search, ChevronRight, Download,
} from 'lucide-react';

const TABS = [
  { key: 'groups',     label: 'Stock Groups',     icon: Layers,    color: '#6366f1' },
  { key: 'categories', label: 'Categories',        icon: Tag,       color: '#f59e0b' },
  { key: 'items',      label: 'Stock Items',       icon: Package,   color: '#22c55e' },
  { key: 'units',      label: 'Units',             icon: Ruler,     color: '#3b82f6' },
  { key: 'locations',  label: 'Godowns',           icon: Warehouse, color: '#ec4899' },
];

const CONFIG = {
  groups: {
    api: stockGroups,
    createRoute: '/inventory/stock-groups/create',
    alterRoute:  (id) => `/inventory/stock-groups/alter/${id}`,
    emptyMsg: 'No stock groups yet.',
    columns: ['Group Name', 'Under'],
    renderRow: (row) => (
      <>
        <td className="px-5 py-3 font-semibold text-slate-800">{row.name}</td>
        <td className="px-4 py-3 text-slate-500 text-xs">{row.parent_name || <span className="italic text-slate-300">Primary</span>}</td>
      </>
    ),
  },
  categories: {
    api: stockCategories,
    createRoute: '/inventory/stock-categories/create',
    alterRoute:  (id) => `/inventory/stock-categories/alter/${id}`,
    emptyMsg: 'No stock categories yet.',
    columns: ['Category Name', 'Under'],
    renderRow: (row) => (
      <>
        <td className="px-5 py-3 font-semibold text-slate-800">{row.name}</td>
        <td className="px-4 py-3 text-slate-500 text-xs">{row.parent_name || <span className="italic text-slate-300">Primary</span>}</td>
      </>
    ),
  },
  items: {
    api: stockItems,
    createRoute: '/inventory/stock-items/create',
    alterRoute:  (id) => `/inventory/stock-items/alter/${id}`,
    emptyMsg: 'No stock items yet.',
    columns: ['Item Name', 'Unit', 'GST Rate', 'Selling Rate'],
    renderRow: (row) => (
      <>
        <td className="px-5 py-3">
          <p className="font-semibold text-slate-800">{row.name}</p>
          {row.hsn_code && <p className="text-[10px] text-slate-400 mt-0.5">HSN: {row.hsn_code}</p>}
        </td>
        <td className="px-4 py-3">
          {row.unit
            ? <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">{row.unit}</span>
            : <span className="text-slate-300 text-xs">—</span>}
        </td>
        <td className="px-4 py-3">
          {row.gst_rate > 0
            ? <span className="text-xs font-bold px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full">{row.gst_rate}%</span>
            : <span className="text-slate-300 text-xs">Nil</span>}
        </td>
        <td className="px-4 py-3 font-mono text-sm text-slate-700">
          {row.selling_rate > 0 ? `₹${Number(row.selling_rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </td>
      </>
    ),
  },
  units: {
    api: units,
    createRoute: '/inventory/units/create',
    alterRoute:  (id) => `/inventory/units/alter/${id}`,
    emptyMsg: 'No units of measure yet.',
    columns: ['Symbol', 'Formal Name', 'Decimals'],
    renderRow: (row) => (
      <>
        <td className="px-5 py-3">
          <span className="font-bold text-indigo-700 text-sm bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">{row.symbol}</span>
        </td>
        <td className="px-4 py-3 text-slate-700 font-medium">{row.formal_name || '—'}</td>
        <td className="px-4 py-3 text-slate-500 text-xs">{row.number_of_decimal_places ?? 2} decimal places</td>
      </>
    ),
  },
  locations: {
    api: locations,
    createRoute: '/inventory/locations/create',
    alterRoute:  (id) => `/inventory/locations/alter/${id}`,
    emptyMsg: 'No godowns / locations yet.',
    columns: ['Godown Name', 'Under'],
    renderRow: (row) => (
      <>
        <td className="px-5 py-3 font-semibold text-slate-800">{row.name}</td>
        <td className="px-4 py-3 text-slate-500 text-xs">{row.parent_name || <span className="italic text-slate-300">Primary</span>}</td>
      </>
    ),
  },
};

export default function InventoryMasters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany } = useCompanyStore();

  const rawTab = searchParams.get('tab') || 'groups';
  const tab    = CONFIG[rawTab] ? rawTab : 'groups';
  const config = CONFIG[tab];
  const tabMeta = TABS.find(t => t.key === tab);

  const [search, setSearch] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [tab, activeCompany?.id],
    queryFn:  () => config.api.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => config.api.delete(id),
    onSuccess:  () => queryClient.invalidateQueries([tab, activeCompany?.id]),
  });

  // Reset search on tab change
  useEffect(() => { setSearch(''); }, [tab]);

  const filtered = rows.filter(r =>
    !search || (r.name || r.symbol || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (row) => {
    const label = row.name || row.symbol;
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      deleteMut.mutate(row.id);
    }
  };

  const handlePDF = () => {
    const tabLabels = { groups: 'Stock Groups', categories: 'Categories', items: 'Stock Items', units: 'Units', locations: 'Godowns' };
    exportToPDF({
      title: `${tabLabels[tab] || 'Inventory'} List`,
      companyName: activeCompany?.name,
      period: `Exported on ${new Date().toLocaleDateString('en-IN')}`,
      data: { tab, rows: filtered },
      reportType: 'inventory',
    });
  };

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500">Select a company first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Masters</h1>
          <p className="text-sm text-slate-500 mt-0.5">{activeCompany.name} · Manage stock, units & godowns</p>
        </div>
        <button
          onClick={() => navigate(config.createRoute)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
        >
          <Plus size={15} /> Create {tabMeta?.label.replace(/s$/, '')}
        </button>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {TABS.map(t => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setSearchParams({ tab: t.key })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: active ? t.color : 'transparent',
                color: active ? '#fff' : '#64748b',
              }}
            >
              <t.icon size={14} />
              {t.label}
              {!active && rows.length > 0 && tab === t.key && (
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 rounded-full">{rows.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${tabMeta?.label.toLowerCase()}…`}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 w-52"
              />
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full border"
              style={{ background: tabMeta?.color + '15', color: tabMeta?.color, borderColor: tabMeta?.color + '30' }}
            >
              {filtered.length} {tabMeta?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePDF}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Download PDF"
            >
              <Download size={12} /> PDF
            </button>
            <button
              onClick={() => navigate(config.createRoute)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <Plus size={12} /> New
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                {config.columns.map((col, i) => (
                  <th key={col} className={`${i === 0 ? 'px-5' : 'px-4'} py-3 text-left font-semibold`}>{col}</th>
                ))}
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-5 py-12 text-center text-slate-400 animate-pulse">
                    Loading {tabMeta?.label.toLowerCase()}…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-5 py-14 text-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: tabMeta?.color + '15' }}
                    >
                      {tabMeta && <tabMeta.icon size={22} style={{ color: tabMeta.color }} />}
                    </div>
                    <p className="text-slate-400 text-sm">{search ? `No results for "${search}"` : config.emptyMsg}</p>
                    {!search && (
                      <button
                        onClick={() => navigate(config.createRoute)}
                        className="mt-3 text-purple-600 text-sm font-semibold hover:underline"
                      >
                        + Create first {tabMeta?.label.replace(/s$/, '').toLowerCase()}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-purple-50/40 cursor-pointer transition-colors group ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                    onClick={() => navigate(config.alterRoute(row.id))}
                  >
                    {config.renderRow(row)}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(config.alterRoute(row.id)); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(row); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={13} className="text-slate-300 ml-1" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {filtered.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-5 py-2.5 text-xs text-slate-400 font-medium">
                    {filtered.length} {tabMeta?.label.toLowerCase()}
                    {search && ` matching "${search}"`}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
