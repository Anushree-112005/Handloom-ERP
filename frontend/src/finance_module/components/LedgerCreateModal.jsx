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
    pan: '',
    addresses: [],
  });
  const [formError, setFormError] = useState('');

  const handleAddAddress = () => {
    setForm(prev => ({
      ...prev,
      addresses: [...prev.addresses, { address_type: 'Bill', alias: '', city: '', state: '', pincode: '', gst_no: '', contact_number: '' }]
    }));
  };

  const handleAddressChange = (index, field, value) => {
    setForm(prev => {
      const newAddresses = [...prev.addresses];
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      return { ...prev, addresses: newAddresses };
    });
  };

  const handleRemoveAddress = (index) => {
    setForm(prev => {
      const newAddresses = prev.addresses.filter((_, i) => i !== index);
      return { ...prev, addresses: newAddresses };
    });
  };

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
    setFormError('');
    if (!form.name.trim()) return;

    const isPartyLedger = form.group === 'Sundry Debtors' || form.group === 'Sundry Creditors';
    
    if (isPartyLedger) {
      if (!form.pan?.trim()) {
        setFormError('PAN Number is mandatory for Party Ledgers.');
        return;
      }
      
      for (let i = 0; i < form.addresses.length; i++) {
        const addr = form.addresses[i];
        if (!addr.pincode?.trim()) {
          setFormError(`PIN Code is mandatory for address ${i + 1} (E-way bill requirement).`);
          return;
        }
        if (!addr.gst_no?.trim()) {
          setFormError(`GST Number is mandatory for address ${i + 1}.`);
          return;
        }
        if (!addr.contact_number?.trim()) {
          setFormError(`Contact Number is mandatory for address ${i + 1}.`);
          return;
        }
      }
    }

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
          {formError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

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

          {(form.group === 'Sundry Debtors' || form.group === 'Sundry Creditors') && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PAN Number *</span>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => handleChange('pan', e.target.value)}
                className="cb-input py-2 uppercase"
                placeholder="ABCDE1234F"
              />
            </label>
          )}

          {/* Multiple Addresses Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Addresses</span>
              <button type="button" onClick={handleAddAddress} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <Plus size={12} /> Add Address
              </button>
            </div>
            
            <div className="space-y-3">
              {form.addresses.map((addr, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 relative">
                  <button type="button" onClick={() => handleRemoveAddress(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Type</span>
                      <select value={addr.address_type} onChange={e => handleAddressChange(idx, 'address_type', e.target.value)} className="cb-input py-1 text-xs">
                        <option value="Bill">Bill</option>
                        <option value="Ship">Ship</option>
                        <option value="Branch">Branch</option>
                        <option value="Head Office">Head Office</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Alias (1, 2, etc.)</span>
                      <input type="text" value={addr.alias} onChange={e => handleAddressChange(idx, 'alias', e.target.value)} className="cb-input py-1 text-xs" placeholder="Alias" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">City</span>
                      <input type="text" value={addr.city} onChange={e => handleAddressChange(idx, 'city', e.target.value)} className="cb-input py-1 text-xs" placeholder="City" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">State</span>
                      <input type="text" value={addr.state} onChange={e => handleAddressChange(idx, 'state', e.target.value)} className="cb-input py-1 text-xs" placeholder="State" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Pincode {(form.group === 'Sundry Debtors' || form.group === 'Sundry Creditors') ? '*' : ''}</span>
                      <input type="text" value={addr.pincode} onChange={e => handleAddressChange(idx, 'pincode', e.target.value)} className="cb-input py-1 text-xs" placeholder="Pincode" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">GST No {(form.group === 'Sundry Debtors' || form.group === 'Sundry Creditors') ? '*' : ''}</span>
                      <input type="text" value={addr.gst_no} onChange={e => handleAddressChange(idx, 'gst_no', e.target.value)} className="cb-input py-1 text-xs" placeholder="GSTIN" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Contact {(form.group === 'Sundry Debtors' || form.group === 'Sundry Creditors') ? '*' : ''}</span>
                      <input type="text" value={addr.contact_number} onChange={e => handleAddressChange(idx, 'contact_number', e.target.value)} className="cb-input py-1 text-xs" placeholder="Phone" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
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
