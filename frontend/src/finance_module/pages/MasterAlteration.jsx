import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import {
  FileEdit, Layers, Users, Globe, Receipt,
  Package, Grid, Box, Scale, MapPin,
  FileText, FileSpreadsheet, Key, ArrowRight
} from 'lucide-react';

const masterSections = [
  {
    title: 'Accounting Masters',
    gradient: 'from-purple-500 to-indigo-500',
    icon: Layers,
    items: [
      { label: 'Group', icon: Layers, description: 'Alter ledger groups.', route: '/cubebook/masters/group?mode=alter', color: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-300 hover:shadow-purple-100' },
      { label: 'Ledger', icon: Users, description: 'Alter ledger masters.', route: '/cubebook/ledgers?mode=alter', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
      { label: 'Currency', icon: Globe, description: 'Alter currency settings.', route: '/cubebook/currency/alter', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
      { label: 'Voucher Type', icon: Receipt, description: 'Alter voucher types.', route: '/cubebook/masters/voucher-types', color: 'text-amber-600', bg: 'bg-amber-50', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
    ],
  },
  {
    title: 'Inventory Masters',
    gradient: 'from-emerald-500 to-teal-500',
    icon: Package,
    items: [
      { label: 'Stock Group', icon: Grid, description: 'Alter stock groups.', route: '/cubebook/inventory-masters?tab=groups', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
      { label: 'Stock Category', icon: Box, description: 'Alter item categories.', route: '/cubebook/inventory-masters?tab=categories', color: 'text-cyan-600', bg: 'bg-cyan-50', hover: 'hover:border-cyan-300 hover:shadow-cyan-100' },
      { label: 'Stock Item', icon: Package, description: 'Alter stock items.', route: '/cubebook/inventory-masters?tab=items', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
      { label: 'Unit', icon: Scale, description: 'Alter measure units.', route: '/cubebook/inventory-masters?tab=units', color: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300 hover:shadow-indigo-100' },
      { label: 'Location', icon: MapPin, description: 'Alter storage locations.', route: '/cubebook/inventory-masters?tab=locations', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
    ],
  },
  {
    title: 'Statutory Masters',
    gradient: 'from-amber-500 to-orange-500',
    icon: FileText,
    items: [
      { label: 'GST Registration', icon: FileSpreadsheet, description: 'Alter GST registration.', route: '/cubebook/masters/gst-registration?mode=alter', color: 'text-amber-600', bg: 'bg-amber-50', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
      { label: 'GST Classification', icon: FileText, description: 'Alter HSN/SAC groups.', route: '/cubebook/masters/gst-classification?mode=alter', color: 'text-orange-600', bg: 'bg-orange-50', hover: 'hover:border-orange-300 hover:shadow-orange-100' },
    ],
  },
  {
    title: 'Statutory Details',
    gradient: 'from-rose-500 to-pink-500',
    icon: Key,
    items: [
      { label: 'Company GST', icon: FileText, description: 'Alter active company GST.', route: '/cubebook/masters/gst-details', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
      { label: 'PAN/CIN', icon: Key, description: 'Alter corporate ID.', route: '/cubebook/masters/pan-cin-details', color: 'text-pink-600', bg: 'bg-pink-50', hover: 'hover:border-pink-300 hover:shadow-pink-100' },
    ],
  },
];

export default function MasterAlteration() {
  const navigate = useNavigate();
  const { activeCompany, clearCompany } = useCompanyStore();

  const handleChangeCompany = () => {
    navigate('/cubebook/company-setup');
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
    <div className="space-y-8 animate-fade">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <FileEdit size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Alteration</h1>
            <p className="text-sm text-slate-500 mt-1">Browse and alter master records for your company</p>
          </div>
        </div>
        <div className="text-right text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          <div className="text-slate-500">
            Active Company: <span className="font-bold text-slate-800 text-sm ml-1">{activeCompany.name}</span>
          </div>
          <button
            type="button"
            onClick={handleChangeCompany}
            className="text-indigo-600 hover:text-indigo-800 font-semibold mt-1.5 transition-colors"
          >
            Change Company
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {masterSections.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className={`h-1.5 w-full bg-gradient-to-r ${section.gradient}`}></div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className={`p-2 rounded-xl ${section.items[0].bg} ${section.items[0].color}`}>
                <section.icon size={20} />
              </div>
              <h2 className="text-base font-bold text-slate-800">{section.title}</h2>
            </div>
            <div className="p-4 grid gap-3 sm:grid-cols-2 bg-white flex-1">
              {section.items.map((item) => {
                const isDisabled = !item.route;
                return (
                  <button
                    key={item.label}
                    onClick={() => !isDisabled && navigate(item.route)}
                    disabled={isDisabled}
                    className={`text-left p-4 rounded-xl border border-slate-100 flex flex-col gap-3 transition-all duration-200 ${isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-slate-50'
                      : `hover:-translate-y-1 hover:shadow-md bg-white ${item.hover}`
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                        <item.icon size={20} />
                      </div>
                      {!isDisabled && (
                        <ArrowRight size={16} className="text-slate-300 opacity-0 -translate-x-2 transition-all duration-200" style={{ opacity: 1, transform: 'none' }} />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDisabled ? 'text-slate-500' : 'text-slate-800'}`}>
                        {item.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
