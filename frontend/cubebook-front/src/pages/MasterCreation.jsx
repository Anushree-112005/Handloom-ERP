import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import { PlusCircle, Building2, ArrowRight } from 'lucide-react';

const masterSections = [
  {
    title: 'Accounting Masters',
    items: [
      { label: 'Group', description: 'Create custom ledger classification groups.', route: '/masters/group' },
      { label: 'Ledger', description: 'Create and configure account ledger masters.', route: '/masters/ledger' },
      { label: 'Currency', description: 'Define base or foreign currency settings.', route: '/currency/create' },
      { label: 'Voucher Type', description: 'Define numbering, prefixes and rules for vouchers.', route: '/masters/voucher-type/create' },
    ],
  },
  {
    title: 'Inventory Masters',
    items: [
      { label: 'Stock Group',    description: 'Create custom stock grouping categories.',      route: '/inventory/stock-groups/create' },
      { label: 'Stock Category', description: 'Create custom inventory item categories.',   route: '/inventory/stock-categories/create' },
      { label: 'Stock Item',     description: 'Create and configure base stock items.',        route: '/inventory/stock-items/create' },
      { label: 'Unit',           description: 'Create units of measure parameters.',   route: '/inventory/units/create' },
      { label: 'Location',       description: 'Create godowns and storage locations.',  route: '/inventory/locations/create' },
    ],
  },
  {
    title: 'Statutory Masters',
    items: [
      { label: 'GST Registration', description: 'GST state-wise registration configuration.', route: '/masters/gst-registration' },
      { label: 'GST Classification', description: 'Define custom HSN/SAC groups and rates.', route: '/masters/gst-classification' },
    ],
  },
  {
    title: 'Statutory Details',
    items: [
      { label: 'Company GST Details', description: 'Configure active company GSTIN profiles.', route: '/masters/gst-details' },
      { label: 'PAN/CIN Details', description: 'Corporate identification details registration.', route: '/masters/pan-cin-details' },
    ],
  },
];

export default function MasterCreation() {
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
          <PlusCircle size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to access master creation.</p>
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
            <PlusCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Master Creation</h1>
            <p className="cb-page-subtitle">Create and manage accounting, inventory, and statutory registers</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">
            Active Company: <span className="font-semibold text-slate-800">{activeCompany.name}</span>
          </div>
          <button
            type="button"
            onClick={handleChangeCompany}
            className="text-purple-600 hover:text-purple-800 font-semibold mt-1"
          >
            Change Company
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {masterSections.map((section) => (
          <div key={section.title} className="cb-card">
            <div className="btn btn-secondary">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{section.title}</h2>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {section.items.map((item) => {
                const isDisabled = item.route === '#';
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
        <p className="font-semibold text-slate-700">Master Creation Guide:</p>
        <p className="mt-1">All Accounting Masters, Inventory Masters, and Statutory Configurations are now fully operational and integrated with transactions and reporting logs.</p>
      </div>
    </div>
  );
}
