import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ledgerGroups, ledgers, stockGroups, stockItems, stockCategories, units, locations, vouchers } from '../api';
import useCompanyStore from '../store/companyStore';
import { Network, Layers, Users, Package, Grid, Search, Receipt, Globe, Calculator, Compass, Box, Scale, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';

const masterSections = [
  {
    title: 'Accounting Masters',
    color: '#6366f1',
    gradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    icon: Layers,
    items: [
      { id: 'groups', label: 'Groups', icon: Layers, description: 'Ledger classification groups.', color: '#6366f1' },
      { id: 'ledgers', label: 'Ledgers', icon: Users, description: 'Account ledger masters.', color: '#3b82f6' },
      { id: 'voucherTypes', label: 'Voucher Types', icon: Receipt, description: 'Numbering and prefixes.', color: '#f59e0b' },
      { id: 'currencies', label: 'Currencies', icon: Globe, description: 'Foreign currency settings.', color: '#10b981' },
      { id: 'budgets', label: 'Budgets', icon: Calculator, description: 'Financial budgets.', color: '#ef4444' },
      { id: 'scenarios', label: 'Scenarios', icon: Compass, description: 'Financial scenarios.', color: '#8b5cf6' },
    ],
  },
  {
    title: 'Inventory Masters',
    color: '#10b981',
    gradient: 'linear-gradient(90deg, #10b981, #14b8a6)',
    icon: Package,
    items: [
      { id: 'stockGroups', label: 'Stock Groups', icon: Grid, description: 'Stock grouping categories.', color: '#10b981' },
      { id: 'stockCategories', label: 'Stock Categories', icon: Box, description: 'Inventory item categories.', color: '#06b6d4' },
      { id: 'stockItems', label: 'Stock Items', icon: Package, description: 'Base stock items.', color: '#3b82f6' },
      { id: 'units', label: 'Units', icon: Scale, description: 'Units of measure.', color: '#6366f1' },
      { id: 'locations', label: 'Locations', icon: MapPin, description: 'Storage locations.', color: '#ef4444' },
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

  const MOCK_VOUCHER_TYPES_KEY = "cb_mock_voucher_types";
  const voucherTypesData = localStorage.getItem(MOCK_VOUCHER_TYPES_KEY) ? JSON.parse(localStorage.getItem(MOCK_VOUCHER_TYPES_KEY)) : [];

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Network size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view the chart of accounts.</p>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Group Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Under (Parent)</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {loadingGroups ? <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Groups...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Groups Found</td></tr> :
             filtered.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{g.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{g.parent_group || 'Primary'}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{g.is_primary ? 'Primary' : 'Sub-Group'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'ledgers') {
      const filtered = ledgersData.filter(l => l.name.toLowerCase().includes(searchLower) || (l.group && l.group.toLowerCase().includes(searchLower)));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Ledger Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Under Group</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Opening Balance</th>
            </tr>
          </thead>
          <tbody>
            {loadingLedgers ? <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Ledgers...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Ledgers Found</td></tr> :
             filtered.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#6366f1' }}>{l.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{l.group}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>₹{l.opening_balance?.toLocaleString()} {l.balance_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'stockGroups') {
      const filtered = stockGroupsData.filter(g => g.name.toLowerCase().includes(searchLower) || (g.parent_id && String(g.parent_id).includes(searchLower)));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Stock Group Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Parent Group ID</th>
            </tr>
          </thead>
          <tbody>
            {loadingStockGroups ? <tr><td colSpan="2" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Stock Groups...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="2" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Stock Groups Found</td></tr> :
             filtered.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981' }}>{g.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{g.parent_id || 'Primary'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'stockItems') {
      const filtered = stockItemsData.filter(i => i.name.toLowerCase().includes(searchLower) || (i.part_no && i.part_no.toLowerCase().includes(searchLower)));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Item Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Part No.</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Group ID</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Opening Qty</th>
            </tr>
          </thead>
          <tbody>
            {loadingStockItems ? <tr><td colSpan="4" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Stock Items...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="4" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Stock Items Found</td></tr> :
             filtered.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#3b82f6' }}>{i.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{i.part_no || '-'}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{i.group_id || 'Primary'}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{i.opening_balance || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'voucherTypes') {
      const filtered = voucherTypesData.filter(v => v.name.toLowerCase().includes(searchLower) || v.baseType.toLowerCase().includes(searchLower));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Voucher Type Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Base Type</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Numbering Method</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Voucher Types Found</td></tr> :
             filtered.map((v, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f59e0b' }}>{v.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{v.baseType}</td>
                <td style={{ padding: '14px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{v.numbering}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'currencies') {
      const c = activeCompany;
      if (!c) return null;
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Currency Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Symbol</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>ISO Code</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Decimals</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981' }}>{c.currency_name || 'INR'}</td>
              <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{c.currency_symbol || '₹'}</td>
              <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{c.currency_iso_code || 'INR'}</td>
              <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>{c.currency_decimal_places ?? 2}</td>
            </tr>
          </tbody>
        </table>
      );
    }

    if (activeTab === 'budgets' || activeTab === 'scenarios') {
      return (
        <div style={{ padding: 64, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'var(--bg-secondary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Network size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>No Records Available</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>There are no {activeTab} defined yet for this company.</p>
        </div>
      );
    }

    if (activeTab === 'stockCategories') {
      const filtered = stockCategoriesData.filter(c => c.name.toLowerCase().includes(searchLower));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Category Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Parent Category ID</th>
            </tr>
          </thead>
          <tbody>
            {loadingStockCategories ? <tr><td colSpan="2" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Stock Categories...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="2" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Stock Categories Found</td></tr> :
             filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#06b6d4' }}>{c.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{c.parent_id || 'Primary'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'units') {
      const filtered = unitsData.filter(u => u.symbol.toLowerCase().includes(searchLower) || (u.formal_name && u.formal_name.toLowerCase().includes(searchLower)));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Unit Symbol</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Formal Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Decimals</th>
            </tr>
          </thead>
          <tbody>
            {loadingUnits ? <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Units...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Units Found</td></tr> :
             filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#6366f1' }}>{u.symbol}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{u.formal_name || '-'}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>{u.number_of_decimal_places || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'locations') {
      const filtered = locationsData.filter(l => l.name.toLowerCase().includes(searchLower));
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Location Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Parent Location ID</th>
            </tr>
          </thead>
          <tbody>
            {loadingLocations ? <tr><td colSpan="2" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading Locations...</td></tr> : 
             filtered.length === 0 ? <tr><td colSpan="2" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No Locations Found</td></tr> :
             filtered.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#ef4444' }}>{l.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{l.parent_id || 'Primary'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network size={24} color="var(--primary)" />
            Chart of Accounts
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Unified view of all master data
          </p>
        </div>
      </div>

      {!activeTab ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
          {masterSections.map((section) => (
            <div key={section.title} className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: 3, width: '100%', background: section.gradient, position: 'absolute', top: 0, left: 0 }}></div>
              
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)' }}>
                <div style={{ padding: 8, borderRadius: 8, background: `${section.color}15`, color: section.color }}>
                  <section.icon size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</h2>
              </div>
              
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-primary)', flex: 1 }}>
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      textAlign: 'left', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.2s', background: 'transparent', cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = `${item.color}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <item.icon size={20} />
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.label}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button 
                onClick={() => { setActiveTab(null); setSearchTerm(''); }}
                className="btn btn-secondary" style={{ padding: '8px 12px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                {(() => {
                  const active = ALL_TABS.find(t => t.id === activeTab);
                  const Icon = active?.icon || Layers;
                  return (
                    <>
                      <Icon size={20} style={{ color: active?.color || 'var(--primary)' }} />
                      List of {active?.label}
                    </>
                  );
                })()}
              </h2>
            </div>
            <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${ALL_TABS.find(t => t.id === activeTab)?.label}...`}
                className="cb-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}
