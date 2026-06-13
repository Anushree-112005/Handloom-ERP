import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgers as ledgersApi, ledgerGroups } from '../api';
import useCompanyStore from '../store/companyStore';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Save, Plus } from 'lucide-react';

const INDIAN_STATES = [
  "Tamil Nadu", "Maharashtra", "Karnataka", "Delhi", "Telangana", "Andhra Pradesh",
  "Gujarat", "West Bengal", "Kerala", "Uttar Pradesh", "Bihar", "Rajasthan"
];

export default function LedgerCreate() {
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    alias: '',
    group: 'Capital Account',
    opening_balance: 0,
    balance_type: 'Dr',
    pan: '',
    provide_bank: false,
    mailing_name: '',
    mailing_address: '',
    state: 'Tamil Nadu',
    country: 'India',
    pincode: '',
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['ledger-groups', activeCompany?.id],
    queryFn: () => ledgerGroups.list(activeCompany.id),
    enabled: !!activeCompany,
  });

  const createMutation = useMutation({
    mutationFn: (data) => ledgersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ledgers', activeCompany?.id]);
      navigate('/ledgers');
    },
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Users size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company first.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createMutation.mutate({ ...form, company_id: activeCompany.id });
  };

  const handleChange = (key, val) => {
    setForm({ ...form, [key]: val });
  };

  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Ledger Creation</h1>
            <p className="cb-page-subtitle">Define a new chart of accounts ledger master</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/ledgers')}
          className="cb-btn-secondary"
        >
          <ArrowLeft size={15} />
          Back to Parties
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: General Configuration (8 cols) */}
        <div className="lg:col-span-8 cb-card p-6 space-y-6 bg-white">
          <h3 className="btn btn-secondary">General Details</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Ledger Name *</span>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="cb-input"
                placeholder="e.g. Ramesh Traders"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">(alias)</span>
              <input
                type="text"
                value={form.alias}
                onChange={(e) => handleChange('alias', e.target.value)}
                className="cb-input"
                placeholder="Alternative name reference"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Under Group *</span>
              <select
                value={form.group}
                onChange={(e) => handleChange('group', e.target.value)}
                className="cb-input"
              >
                <option value="Capital Account">Capital Account</option>
                <option value="Current Assets">Current Assets</option>
                <option value="Current Liabilities">Current Liabilities</option>
                <option value="Sundry Debtors">Sundry Debtors</option>
                <option value="Sundry Creditors">Sundry Creditors</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label className="col-span-2 flex flex-col gap-1.5">
                <span className="cb-label">Opening Balance</span>
                <input
                  type="number"
                  value={form.opening_balance}
                  onChange={(e) => handleChange('opening_balance', Number(e.target.value))}
                  className="cb-input text-right font-mono"
                  placeholder="0.00"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Type</span>
                <select
                  value={form.balance_type}
                  onChange={(e) => handleChange('balance_type', e.target.value)}
                  className="cb-input font-bold"
                >
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </label>
            </div>
          </div>

          <div className="btn btn-secondary">
            <h4 className="cb-label mb-3">Opening Balance Details</h4>
            <div className="btn btn-secondary">
              <span className="text-slate-500">Opening Balance on 1-Apr-26:</span>
              <span className="font-bold text-slate-800 font-mono">
                ₹{form.opening_balance.toLocaleString()}.00 {form.balance_type}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Mailing, Tax & Banking (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mailing details */}
          <div className="cb-card p-6 bg-white space-y-4">
            <h3 className="btn btn-secondary">Mailing Details</h3>
            
            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Mailing Name</span>
              <input
                type="text"
                value={form.mailing_name}
                onChange={(e) => handleChange('mailing_name', e.target.value)}
                className="cb-input text-xs py-1.5"
                placeholder="Business display name"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Address</span>
              <textarea
                rows={2}
                value={form.mailing_address}
                onChange={(e) => handleChange('mailing_address', e.target.value)}
                className="cb-input text-xs py-1.5 resize-none"
                placeholder="Street address details"
              />
            </label>

            <div className="form-row">
              <label className="flex flex-col gap-1">
                <span className="cb-label">State</span>
                <select
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="cb-input text-xs py-1"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="cb-label">Country</span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="cb-input text-xs py-1.5"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="cb-label">Pincode</span>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="cb-input text-xs py-1.5"
                placeholder="600001"
              />
            </label>
          </div>

          {/* Tax & Banking */}
          <div className="cb-card p-6 bg-white space-y-4">
            <h3 className="btn btn-secondary">Statutory & Bank</h3>
            
            <label className="flex flex-col gap-1.5">
              <span className="cb-label">PAN / IT No.</span>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => handleChange('pan', e.target.value)}
                className="cb-input text-xs py-1.5 font-mono"
                placeholder="ABCDE1234F"
              />
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.provide_bank}
                onChange={(e) => handleChange('provide_bank', e.target.checked)}
                className="btn btn-secondary"
              />
              <span className="text-xs font-medium text-slate-600">Provide bank details</span>
            </label>
          </div>

          {/* Actions panel */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/ledgers')}
              className="cb-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="cb-btn-primary"
            >
              <Save size={15} />
              {createMutation.isPending ? 'Saving...' : 'Accept'}
            </button>
          </div>

          {createMutation.isError && (
            <div className="btn btn-danger">
              Could not create ledger. Please try again.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
