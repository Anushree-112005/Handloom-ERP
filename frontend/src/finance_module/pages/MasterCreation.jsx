import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import {
  PlusCircle, Layers, Users, Globe, Receipt,
  Package, Grid, Box, Scale, MapPin,
  FileText, FileSpreadsheet, Key, ArrowRight
} from 'lucide-react';

const masterSections = [
  {
    title: 'Accounting Masters',
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500',
    icon: Layers,
    items: [
      { label: 'Group', icon: Layers, description: 'Ledger classification groups.', route: '/cubebook/masters/group', color: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-300 hover:shadow-purple-100' },
      { label: 'Ledger', icon: Users, description: 'Account ledger masters.', route: '/cubebook/masters/ledger', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
      { label: 'Currency', icon: Globe, description: 'Foreign currency settings.', route: '/cubebook/currency/create', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
      { label: 'Voucher Type', icon: Receipt, description: 'Numbering and prefixes.', route: '/cubebook/masters/voucher-type/create', color: 'text-amber-600', bg: 'bg-amber-50', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
    ],
  },
  {
    title: 'Inventory Masters',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    icon: Package,
    items: [
      { label: 'Stock Group', icon: Grid, description: 'Stock grouping categories.', route: '/cubebook/inventory/stock-groups/create', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
      { label: 'Stock Category', icon: Box, description: 'Inventory item categories.', route: '/cubebook/inventory/stock-categories/create', color: 'text-cyan-600', bg: 'bg-cyan-50', hover: 'hover:border-cyan-300 hover:shadow-cyan-100' },
      { label: 'Stock Item', icon: Package, description: 'Base stock items.', route: '/cubebook/inventory/stock-items/create', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
      { label: 'Unit', icon: Scale, description: 'Units of measure.', route: '/cubebook/inventory/units/create', color: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300 hover:shadow-indigo-100' },
      { label: 'Location', icon: MapPin, description: 'Storage locations.', route: '/cubebook/inventory/locations/create', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
    ],
  },
  {
    title: 'Statutory Masters',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    icon: FileText,
    items: [
      { label: 'GST Registration', icon: FileSpreadsheet, description: 'State-wise registration.', route: '/cubebook/masters/gst-registration', color: 'text-amber-600', bg: 'bg-amber-50', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
      { label: 'GST Classification', icon: FileText, description: 'Custom HSN/SAC groups.', route: '/cubebook/masters/gst-classification', color: 'text-orange-600', bg: 'bg-orange-50', hover: 'hover:border-orange-300 hover:shadow-orange-100' },
    ],
  },
  {
    title: 'Statutory Details',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    icon: Key,
    items: [
      { label: 'Company GST', icon: FileText, description: 'Active company GSTIN.', route: '/cubebook/masters/gst-details', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
      { label: 'PAN/CIN', icon: Key, description: 'Corporate identification.', route: '/cubebook/masters/pan-cin-details', color: 'text-pink-600', bg: 'bg-pink-50', hover: 'hover:border-pink-300 hover:shadow-pink-100' },
    ],
  },
];

export default function MasterCreation() {
  const navigate = useNavigate();
  const { activeCompany, clearCompany } = useCompanyStore();

  const handleChangeCompany = () => {
    navigate('/cubebook/company-setup');
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
    <div className="space-y-8 animate-fade">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
            <PlusCircle size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Creation</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage accounting, inventory, and statutory registers</p>
          </div>
        </div>
        <div className="text-right text-xs bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          <div className="text-slate-500">
            Active Company: <span className="font-bold text-slate-800 text-sm ml-1">{activeCompany.name}</span>
          </div>
          <button
            type="button"
            onClick={handleChangeCompany}
            className="text-purple-600 hover:text-purple-800 font-semibold mt-1.5 transition-colors"
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
                const isDisabled = item.route === '#';
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
