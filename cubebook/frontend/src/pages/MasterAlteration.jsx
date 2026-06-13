import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import { FileEdit, ArrowRight } from 'lucide-react';

const masterSections = [
  {
    title: 'Accounting Masters',
    items: [
      { label: 'Group', description: 'Alter custom ledger classification groups.', route: '/masters/group' },
      { label: 'Ledger', description: 'Alter and configure account ledger masters.', route: '/masters/ledger' },
      { label: 'Currency', description: 'Define base or foreign currency settings.', route: '/currency/alter' },
      { label: 'Voucher Type', description: 'Alter numbering, prefixes and rules for vouchers.', route: '/masters/voucher-types' },
    ],
  },
  {
    title: 'Inventory Masters',
    items: [
      { label: 'Stock Group',    description: 'Alter custom stock grouping categories.',      route: '/inventory-masters?tab=groups' },
      { label: 'Stock Category', description: 'Alter custom inventory item categories.',   route: '/inventory-masters?tab=categories' },
      { label: 'Stock Item',     description: 'Alter and configure base stock items.',        route: '/inventory-masters?tab=items' },
      { label: 'Unit',           description: 'Alter units of measure parameters.',   route: '/inventory-masters?tab=units' },
      { label: 'Location',       description: 'Alter godowns and storage locations.',  route: '/inventory-masters?tab=locations' },
    ],
  },
  {
    title: 'Statutory Masters',
    items: [
      { label: 'GST Registration', description: 'Alter GST state-wise registration configuration.', route: '/masters/gst-registration?mode=alter' },
      { label: 'GST Classification', description: 'Define custom HSN/SAC groups and rates.', route: '/masters/gst-classification?mode=alter' },
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

export default function MasterAlteration() {
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
          <FileEdit size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to access master alteration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
            <FileEdit size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Master Alteration</h1>
            <p className="cb-page-subtitle">Browse and alter master records for your company</p>
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
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
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

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Master Alteration Guide:</p>
        <p className="mt-1">All Accounting Masters, Inventory Masters, and Statutory Configurations are now fully operational and integrated with transactions and reporting logs.</p>
      </div>
    </div>
  );
}
