import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ledgerGroups, ledgers, stockGroups, stockItems, stockCategories, units, locations, vouchers } from '../api';
import useCompanyStore from '../store/companyStore';
import { Network, Layers, Users, Package, Grid, Search, Receipt, Globe, Calculator, Compass, Box, Scale, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';

const masterSections = [
  {
    title: 'Accounting Masters',
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500',
    icon: Layers,
    items: [
      { id: 'groups', label: 'Groups', icon: Layers, description: 'Ledger classification groups.', color: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-300 hover:shadow-purple-100' },
      { id: 'ledgers', label: 'Ledgers', icon: Users, description: 'Account ledger masters.', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
      { id: 'voucherTypes', label: 'Voucher Types', icon: Receipt, description: 'Numbering and prefixes.', color: 'text-amber-600', bg: 'bg-amber-50', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
      { id: 'currencies', label: 'Currencies', icon: Globe, description: 'Foreign currency settings.', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
      { id: 'budgets', label: 'Budgets', icon: Calculator, description: 'Financial budgets.', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
      { id: 'scenarios', label: 'Scenarios', icon: Compass, description: 'Financial scenarios.', color: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300 hover:shadow-indigo-100' },
    ],
  },
  {
    title: 'Inventory Masters',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    icon: Package,
    items: [
      { id: 'stockGroups', label: 'Stock Groups', icon: Grid, description: 'Stock grouping categories.', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
      { id: 'stockCategories', label: 'Stock Categories', icon: Box, description: 'Inventory item categories.', color: 'text-cyan-600', bg: 'bg-cyan-50', hover: 'hover:border-cyan-300 hover:shadow-cyan-100' },
      { id: 'stockItems', label: 'Stock Items', icon: Package, description: 'Base stock items.', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
      { id: 'units', label: 'Units', icon: Scale, description: 'Units of measure.', color: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300 hover:shadow-indigo-100' },
      { id: 'locations', label: 'Locations', icon: MapPin, description: 'Storage locations.', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
    ],
  }
];

const ALL_TABS = masterSections.flatMap(s => s.items);

export default function ChartOfAccounts() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Data
  const { data: groupsData = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['ledger-groups', activeCompany?.id],
    queryFn: () => ledgerGroups.list(activeCompany.id),
    enabled: !!activeCompany && activeTab === 'groups'
  });

  const { data: ledgersData = [], isLoading: loadingLedgers } = useQuery({
    queryKey: ['ledgers', activeCompany?.id],
    queryFn: () => ledgers.list({ company_id: activeCompany.id }),
    enabled: !!activeCompany && activeTab === 'ledgers'
  });

  const { data: stockGroupsData = [], isLoading: loadingStockGroups } = useQuery({
    queryKey: ['stock-groups', activeCompany?.id],
    queryFn: () => stockGroups.list(activeCompany.id),
    enabled: !!activeCompany && activeTab === 'stockGroups'
  });

  const { data: stockItemsData = [], isLoading: loadingStockItems } = useQuery({
    queryKey: ['stock-items', activeCompany?.id],
    queryFn: () => stockItems.list(activeCompany.id),
    enabled: !!activeCompany && activeTab === 'stockItems'
  });

  const { data: stockCategoriesData = [], isLoading: loadingStockCategories } = useQuery({
    queryKey: ['stock-categories', activeCompany?.id],
    queryFn: () => stockCategories.list(activeCompany.id),
    enabled: !!activeCompany && activeTab === 'stockCategories'
  });

  const { data: unitsData = [], isLoading: loadingUnits } = useQuery({
    queryKey: ['units', activeCompany?.id],
    queryFn: () => units.list(activeCompany.id),
    enabled: !!activeCompany && activeTab === 'units'
  });

  const { data: locationsData = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations', activeCompany?.id],
    queryFn: () => locations.list(activeCompany.id),
    enabled: !!activeCompany && activeTab === 'locations'
  });

  // Since we don't have APIs for Voucher Types (using localStorage/mock currently), Budgets, and Scenarios:
  const MOCK_VOUCHER_TYPES_KEY = "cb_mock_voucher_types";
  const voucherTypesData = localStorage.getItem(MOCK_VOUCHER_TYPES_KEY) ? JSON.parse(localStorage.getItem(MOCK_VOUCHER_TYPES_KEY)) : [];

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Network size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to view the chart of accounts.</p>
        </div>
      </div>
    );
  }

  // Render Table content based on active tab
  const renderContent = () => {
    const searchLower = searchTerm.toLowerCase();

    if (activeTab === 'groups') {
      const filtered = groupsData.filter(g => g.name.toLowerCase().includes(searchLower) || (g.parent_group && g.parent_group.toLowerCase().includes(searchLower)));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Group Name</th>
                <th className="cb-th">Under (Parent)</th>
                <th className="cb-th text-center">Type</th>
              </tr>
            </thead>
            <tbody>
              {loadingGroups ? <tr><td colSpan="3" className="p-8 text-center text-slate-400">Loading Groups...</td></tr> : 
               filtered.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-slate-400">No Groups Found</td></tr> :
               filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-slate-800">{g.name}</td>
                  <td className="cb-td text-slate-600">{g.parent_group || 'Primary'}</td>
                  <td className="cb-td text-center">
                    <span className="cb-badge bg-slate-100 text-slate-600 border-slate-200">{g.is_primary ? 'Primary' : 'Sub-Group'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'ledgers') {
      const filtered = ledgersData.filter(l => l.name.toLowerCase().includes(searchLower) || (l.group && l.group.toLowerCase().includes(searchLower)));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Ledger Name</th>
                <th className="cb-th">Under Group</th>
                <th className="cb-th text-right">Opening Balance</th>
              </tr>
            </thead>
            <tbody>
              {loadingLedgers ? <tr><td colSpan="3" className="p-8 text-center text-slate-400">Loading Ledgers...</td></tr> : 
               filtered.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-slate-400">No Ledgers Found</td></tr> :
               filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-purple-700">{l.name}</td>
                  <td className="cb-td text-slate-600">{l.group}</td>
                  <td className="cb-td text-right font-mono text-slate-700">₹{l.opening_balance?.toLocaleString()} {l.balance_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'stockGroups') {
      const filtered = stockGroupsData.filter(g => g.name.toLowerCase().includes(searchLower) || (g.parent_id && String(g.parent_id).includes(searchLower)));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Stock Group Name</th>
                <th className="cb-th">Parent Group ID</th>
              </tr>
            </thead>
            <tbody>
              {loadingStockGroups ? <tr><td colSpan="2" className="p-8 text-center text-slate-400">Loading Stock Groups...</td></tr> : 
               filtered.length === 0 ? <tr><td colSpan="2" className="p-8 text-center text-slate-400">No Stock Groups Found</td></tr> :
               filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-emerald-700">{g.name}</td>
                  <td className="cb-td text-slate-600">{g.parent_id || 'Primary'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'stockItems') {
      const filtered = stockItemsData.filter(i => i.name.toLowerCase().includes(searchLower) || (i.part_no && i.part_no.toLowerCase().includes(searchLower)));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Item Name</th>
                <th className="cb-th">Part No.</th>
                <th className="cb-th">Group ID</th>
                <th className="cb-th text-right">Opening Qty</th>
              </tr>
            </thead>
            <tbody>
              {loadingStockItems ? <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading Stock Items...</td></tr> : 
               filtered.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-400">No Stock Items Found</td></tr> :
               filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-blue-700">{i.name}</td>
                  <td className="cb-td text-slate-500 font-mono text-xs">{i.part_no || '-'}</td>
                  <td className="cb-td text-slate-600">{i.group_id || 'Primary'}</td>
                  <td className="cb-td text-right font-mono text-slate-700">{i.opening_balance || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'voucherTypes') {
      const filtered = voucherTypesData.filter(v => v.name.toLowerCase().includes(searchLower) || v.baseType.toLowerCase().includes(searchLower));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Voucher Type Name</th>
                <th className="cb-th">Base Type</th>
                <th className="cb-th">Numbering Method</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-slate-400">No Voucher Types Found</td></tr> :
               filtered.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-amber-700">{v.name}</td>
                  <td className="cb-td text-slate-600">{v.baseType}</td>
                  <td className="cb-td"><span className="cb-badge bg-slate-100 text-slate-600 border-slate-200">{v.numbering}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'currencies') {
      // Active Company Currency
      const c = activeCompany;
      if (!c) return null;
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Currency Name</th>
                <th className="cb-th">Symbol</th>
                <th className="cb-th">ISO Code</th>
                <th className="cb-th text-center">Decimals</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="cb-td font-bold text-emerald-700">{c.currency_name || 'INR'}</td>
                <td className="cb-td font-mono text-slate-600">{c.currency_symbol || '₹'}</td>
                <td className="cb-td text-slate-600">{c.currency_iso_code || 'INR'}</td>
                <td className="cb-td text-center">{c.currency_decimal_places ?? 2}</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'budgets' || activeTab === 'scenarios') {
      return (
        <div className="p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Network size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Records Available</h3>
          <p className="text-slate-500 text-sm">There are no {activeTab} defined yet for this company.</p>
        </div>
      );
    }

    if (activeTab === 'stockCategories') {
      const filtered = stockCategoriesData.filter(c => c.name.toLowerCase().includes(searchLower));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Category Name</th>
                <th className="cb-th">Parent Category ID</th>
              </tr>
            </thead>
            <tbody>
              {loadingStockCategories ? <tr><td colSpan="2" className="p-8 text-center text-slate-400">Loading Stock Categories...</td></tr> : 
               filtered.length === 0 ? <tr><td colSpan="2" className="p-8 text-center text-slate-400">No Stock Categories Found</td></tr> :
               filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-cyan-700">{c.name}</td>
                  <td className="cb-td text-slate-600">{c.parent_id || 'Primary'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'units') {
      const filtered = unitsData.filter(u => u.symbol.toLowerCase().includes(searchLower) || (u.formal_name && u.formal_name.toLowerCase().includes(searchLower)));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Unit Symbol</th>
                <th className="cb-th">Formal Name</th>
                <th className="cb-th text-center">Decimals</th>
              </tr>
            </thead>
            <tbody>
              {loadingUnits ? <tr><td colSpan="3" className="p-8 text-center text-slate-400">Loading Units...</td></tr> : 
               filtered.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-slate-400">No Units Found</td></tr> :
               filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-indigo-700">{u.symbol}</td>
                  <td className="cb-td text-slate-600">{u.formal_name || '-'}</td>
                  <td className="cb-td text-center">{u.number_of_decimal_places || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === 'locations') {
      const filtered = locationsData.filter(l => l.name.toLowerCase().includes(searchLower));
      return (
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="cb-th">Location Name</th>
                <th className="cb-th">Parent Location ID</th>
              </tr>
            </thead>
            <tbody>
              {loadingLocations ? <tr><td colSpan="2" className="p-8 text-center text-slate-400">Loading Locations...</td></tr> : 
               filtered.length === 0 ? <tr><td colSpan="2" className="p-8 text-center text-slate-400">No Locations Found</td></tr> :
               filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="cb-td font-bold text-rose-700">{l.name}</td>
                  <td className="cb-td text-slate-600">{l.parent_id || 'Primary'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Network size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chart of Accounts</h1>
            <p className="text-sm text-slate-500 mt-1">Unified view of all master data</p>
          </div>
        </div>
      </div>

      {!activeTab ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {masterSections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className={`h-1.5 w-full bg-gradient-to-r ${section.gradient}`}></div>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className={`p-2 rounded-xl text-${section.color}-600 bg-${section.color}-50`}>
                  <section.icon size={20} />
                </div>
                <h2 className="text-base font-bold text-slate-800">{section.title}</h2>
              </div>
              <div className="p-4 grid gap-3 sm:grid-cols-2 bg-white flex-1">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveTab(item.id)}
                    className={`text-left p-4 rounded-xl border border-slate-100 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md bg-white ${item.hover}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                        <item.icon size={20} />
                      </div>
                      <ArrowRight size={16} className="text-slate-300 opacity-0 -translate-x-2 transition-all duration-200" style={{ opacity: 1, transform: 'none' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {item.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cb-card flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setActiveTab(null); setSearchTerm(''); }}
                className="btn btn-secondary !px-3"
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                {(() => {
                  const active = ALL_TABS.find(t => t.id === activeTab);
                  const Icon = active?.icon || Layers;
                  return (
                    <>
                      <Icon size={20} className="text-indigo-600" />
                      List of {active?.label}
                    </>
                  );
                })()}
              </h2>
            </div>
            <div className="relative w-full sm:w-64 shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${ALL_TABS.find(t => t.id === activeTab)?.label}...`}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
