import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import { Network, ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'Accounting Masters',
    items: [
      { label: 'Groups', description: 'View chart of ledger groups.', route: '/masters/group' },
      { label: 'Ledgers', description: 'View chart of account ledgers.', route: '/ledgers' },
      { label: 'Voucher Types', description: 'View configured voucher templates.', route: '/masters/voucher-types' },
      { label: 'Currencies', description: 'View configured foreign currencies.', route: '/masters/currencies' },
      { label: 'Budgets', description: 'View financial budget configurations.', route: '/masters/budgets' },
      { label: 'Scenarios', description: 'View scenario analysis profiles.', route: '/masters/scenarios' },
    ],
  },
  {
    title: 'Inventory Masters',
    items: [
      { label: 'Stock Groups', description: 'View stock group categories hierarchy.', route: '/inventory-masters?tab=groups' },
      { label: 'Stock Items', description: 'View inventory stock item directories.', route: '/inventory-masters?tab=items' },
      { label: 'Stock Categories', description: 'View inventory category directories.', route: '/inventory-masters?tab=categories' },
      { label: 'Units', description: 'View measurement units directories.', route: '/inventory-masters?tab=units' },
      { label: 'Locations', description: 'View warehouse and storage directories.', route: '/inventory-masters?tab=locations' },
    ],
  },
];

export default function ChartOfAccounts() {
  const navigate = useNavigate();
  const { activeCompany, clearCompany } = useCompanyStore();

  const handleChangeCompany = () => {
    clearCompany();
    localStorage.removeItem('cb_company_id');
    localStorage.removeItem('cb_company_name');
    navigate('/dashboard');
  };

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Network size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Chart of Accounts</h1>
            <p className="cb-page-subtitle">Find and manage your master categories</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <div className="flex items-center gap-3 justify-end mt-1">
            <button
              type="button"
              onClick={handleChangeCompany}
              className="text-purple-600 hover:text-purple-800 font-semibold"
            >
              Change Company
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              className="text-slate-600 hover:text-slate-800 font-semibold"
            >
              Show Inactive
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="cb-card">
            <div className="btn btn-secondary">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{section.title}</h2>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {section.items.map((item) => {
                const isDisabled = !item.route;
                return (
                  <button
                    key={item.label}
                    onClick={() => !isDisabled && navigate(item.route)}
                    disabled={isDisabled}
                    className={`w-full text-left px-5 py-3 flex items-center justify-between gap-4 transition-colors ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-slate-50/70 group'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${isDisabled ? 'text-slate-500' : 'text-slate-800 group-hover:text-purple-700'}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5">{item.description}</span>
                    </div>
                    {!isDisabled && (
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="btn btn-secondary">
        <p className="font-semibold text-slate-700">Chart of Accounts Guide:</p>
        <p className="mt-1">All Accounting Masters, Inventory Masters, and Statutory Configurations are now fully operational and integrated with transactions and reporting logs.</p>
      </div>
    </div>
  );
}
