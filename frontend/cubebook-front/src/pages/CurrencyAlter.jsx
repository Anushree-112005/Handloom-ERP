import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import useCompanyStore from '../store/companyStore';
import { companies } from '../api';
import { Globe, ArrowLeft, Save } from 'lucide-react';

export default function CurrencyAlter() {
  const navigate = useNavigate();
  const { activeCompany, setCompany } = useCompanyStore();
  const [form, setForm] = useState({
    currency_symbol: activeCompany?.currency_symbol || '₹',
    currency_name: activeCompany?.currency_name || 'INR',
    currency_iso_code: activeCompany?.currency_iso_code || 'INR',
    currency_decimal_places: activeCompany?.currency_decimal_places ?? 2,
    currency_show_in_millions: activeCompany?.currency_show_in_millions || false,
    currency_suffix_symbol: activeCompany?.currency_suffix_symbol || false,
    currency_space_between_amount_and_symbol: activeCompany?.currency_space_between_amount_and_symbol || false,
    currency_amount_words_unit: activeCompany?.currency_amount_words_unit || 'Rupees',
    currency_amount_words_decimal: activeCompany?.currency_amount_words_decimal || 'Paise',
  });

  const mutation = useMutation({
    mutationFn: (payload) => companies.update(activeCompany.id, payload),
    onSuccess: (data) => {
      setCompany(data);
      navigate('/cubebook/currency');
    },
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Alter Currency Master</h1>
            <p className="cb-page-subtitle">Modify the active currency symbols, units, decimal formats and display options</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cubebook/currency')}
          className="cb-btn-secondary"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Details Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="cb-card p-6 bg-slate-50/50">
            <h3 className="btn btn-secondary">Active Settings</h3>
            <div className="card">
              <div className="btn btn-primary">
                {activeCompany?.currency_symbol || '₹'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{activeCompany?.currency_name || 'INR'}</p>
                <p className="text-xs text-slate-400">ISO Code: {activeCompany?.currency_iso_code || 'INR'}</p>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-2 leading-relaxed">
              <span className="cb-label block mb-1">Configuration Guidelines</span>
              <p>Alter display symbols or formatting precision parameters to custom values preferred by your accounts department.</p>
              <p>These settings automatically format calculations in trial balances, balance sheets, daybooks and ledger registers.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Form Panel (8 cols) */}
        <div className="lg:col-span-8 cb-card p-6 space-y-6 bg-white">
          <h3 className="btn btn-secondary">Update Properties</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Currency Symbol *</span>
              <input
                required
                type="text"
                value={form.currency_symbol}
                onChange={(e) => handleChange('currency_symbol', e.target.value)}
                className="cb-input"
                placeholder="e.g. ₹, $, €"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Formal Name *</span>
              <input
                required
                type="text"
                value={form.currency_name}
                onChange={(e) => handleChange('currency_name', e.target.value)}
                className="cb-input"
                placeholder="e.g. INR"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">ISO Currency Code</span>
              <input
                type="text"
                value={form.currency_iso_code}
                onChange={(e) => handleChange('currency_iso_code', e.target.value)}
                className="cb-input"
                placeholder="e.g. INR"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Number of Decimal Places</span>
              <input
                type="number"
                min="0"
                max="4"
                value={form.currency_decimal_places}
                onChange={(e) => handleChange('currency_decimal_places', Number(e.target.value))}
                className="cb-input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Word representing unit (Whole)</span>
              <input
                type="text"
                value={form.currency_amount_words_unit}
                onChange={(e) => handleChange('currency_amount_words_unit', e.target.value)}
                className="cb-input"
                placeholder="e.g. Rupees"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Word representing unit (Decimal)</span>
              <input
                type="text"
                value={form.currency_amount_words_decimal}
                onChange={(e) => handleChange('currency_amount_words_decimal', e.target.value)}
                className="cb-input"
                placeholder="e.g. Paise"
              />
            </label>
          </div>

          <div className="btn btn-secondary">
            <span className="cb-label block mb-2">Display settings</span>
            
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.currency_show_in_millions}
                  onChange={(e) => handleChange('currency_show_in_millions', e.target.checked)}
                  className="btn btn-secondary"
                />
                <span className="text-xs font-medium text-slate-600">Show in millions</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.currency_suffix_symbol}
                  onChange={(e) => handleChange('currency_suffix_symbol', e.target.checked)}
                  className="btn btn-secondary"
                />
                <span className="text-xs font-medium text-slate-600">Suffix symbol</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.currency_space_between_amount_and_symbol}
                  onChange={(e) => handleChange('currency_space_between_amount_and_symbol', e.target.checked)}
                  className="btn btn-secondary"
                />
                <span className="text-xs font-medium text-slate-600">Add space</span>
              </label>
            </div>
          </div>

          <div className="btn btn-secondary">
            <button
              type="button"
              onClick={() => navigate('/cubebook/currency')}
              className="cb-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="cb-btn-primary"
            >
              <Save size={15} />
              {mutation.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          {mutation.isError && (
            <div className="btn btn-danger">
              Could not update currency settings. Please try again.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
