import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgers as ledgersApi, ledgerGroups } from '../api';
import useCompanyStore from '../store/companyStore';
import { X, Save, AlertCircle } from 'lucide-react';

export default function LedgerCreateModal({ onClose, onSuccess }) {
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    group: 'Capital Account',
    opening_balance: 0,
    balance_type: 'Dr',
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['ledger-groups', activeCompany?.id],
    queryFn: () => ledgerGroups.list(activeCompany.id),
    enabled: !!activeCompany,
  });

  const createMutation = useMutation({
    mutationFn: (data) => ledgersApi.create(data),
    onSuccess: (newLedger) => {
      queryClient.invalidateQueries(['ledgers', activeCompany?.id]);
      onSuccess?.(newLedger);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createMutation.mutate({ ...form, company_id: activeCompany.id });
  };

  const handleChange = (key, val) => {
    setForm({ ...form, [key]: val });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <h2 className="font-bold text-slate-800">Quick Ledger Creation</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ledger Name *</span>
            <input
              required
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="cb-input py-2"
              placeholder="e.g. ABC Corp"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Group *</span>
            <select
              value={form.group}
              onChange={(e) => handleChange('group', e.target.value)}
              className="cb-input py-2"
            >
              <option value="Capital Account">Capital Account</option>
              <option value="Current Assets">Current Assets</option>
              <option value="Current Liabilities">Current Liabilities</option>
              <option value="Sundry Debtors">Sundry Debtors</option>
              <option value="Sundry Creditors">Sundry Creditors</option>
              <option value="Bank Accounts">Bank Accounts</option>
              <option value="Cash-in-hand">Cash-in-hand</option>
              <option value="Sales Accounts">Sales Accounts</option>
              <option value="Purchase Accounts">Purchase Accounts</option>
              {groups.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opening Balance</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.opening_balance}
                onChange={(e) => handleChange('opening_balance', Number(e.target.value))}
                className="cb-input py-2 text-right font-mono"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</span>
              <select
                value={form.balance_type}
                onChange={(e) => handleChange('balance_type', e.target.value)}
                className="cb-input py-2 font-bold"
              >
                <option value="Dr">Dr</option>
                <option value="Cr">Cr</option>
              </select>
            </label>
          </div>

          {createMutation.isError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{createMutation.error?.response?.data?.detail || "Error creating ledger."}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="cb-btn-secondary py-2 px-4">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !form.name.trim()}
            className="cb-btn-primary py-2 px-5"
          >
            <Save size={16} /> {createMutation.isPending ? 'Saving...' : 'Create Ledger'}
          </button>
        </div>

      </div>
    </div>
  );
}
