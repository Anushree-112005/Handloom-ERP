import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import { Globe, Plus, Edit2 } from 'lucide-react';

export default function CurrencyGateway() {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();

  const currentSymbol = activeCompany?.currency_symbol || '₹';
  const currentName = activeCompany?.currency_name || 'INR';
  const currentIso = activeCompany?.currency_iso_code || 'INR';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Currency Master</h1>
            <p className="cb-page-subtitle">Define and configure base company currency symbol and format settings</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
          Active Company: <span className="font-semibold text-slate-800">{activeCompany?.name}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Card: Current currency info */}
        <div className="cb-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">Current Currency Setup</h3>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-purple-600/10 text-purple-700 flex items-center justify-center text-xl font-bold">
                {currentSymbol}
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">{currentName}</p>
                <p className="text-xs text-slate-400">ISO Currency Code: {currentIso}</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/currency/create')}
              className="cb-btn-primary"
            >
              <Plus size={15} />
              Create New
            </button>
            <button
              type="button"
              onClick={() => navigate('/currency/alter')}
              className="cb-btn-secondary"
            >
              <Edit2 size={14} />
              Alter Existing
            </button>
          </div>
        </div>

        {/* Right Card: Help guide */}
        <div className="cb-card p-6 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4">How to configure</h3>
          <ol className="space-y-3 text-xs text-slate-600">
            <li className="flex gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <span className="font-bold text-purple-600">1.</span>
              <span>Review the active company currency settings on the left.</span>
            </li>
            <li className="flex gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <span className="font-bold text-purple-600">2.</span>
              <span>Click <strong>Create New</strong> to define a new currency symbol, decimal places, unit naming, and suffix preferences.</span>
            </li>
            <li className="flex gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <span className="font-bold text-purple-600">3.</span>
              <span>Click <strong>Alter Existing</strong> to edit the current active configuration directly.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
