import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgers as ledgersApi, ledgerGroups } from '../api';
import useCompanyStore from '../store/companyStore';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import TallyFormLayout, { FormRow, FormInput, FormSelect, SectionHeader } from '../components/layout/TallyFormLayout';

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
    addresses: [
      { address_type: 'Primary', alias: '', address: '', state: 'Tamil Nadu', country: 'India', pincode: '', city: '', gst_no: '', contact_number: '' }
    ],
  });
  const [formError, setFormError] = useState('');

  const handleAddAddress = () => {
    setForm(prev => ({
      ...prev,
      addresses: [...prev.addresses, { address_type: 'Bill', alias: '', address: '', state: 'Tamil Nadu', country: 'India', pincode: '', city: '', gst_no: '', contact_number: '' }]
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

  const handleSubmit = () => {
    setFormError('');
    if (!form.name.trim()) {
      setFormError('Ledger Name is required.');
      return;
    }
    
    const isPartyLedger = form.group === 'Sundry Debtors' || form.group === 'Sundry Creditors';
    
    if (isPartyLedger) {
      if (!form.pan.trim()) {
        setFormError('PAN Number is mandatory for Party Ledgers.');
        return;
      }
      
      // Validate Addresses for Parties
      for (let i = 0; i < form.addresses.length; i++) {
        const addr = form.addresses[i];
        if (!addr.pincode.trim()) {
          setFormError(`PIN Code is mandatory for address ${i + 1} (E-way bill requirement).`);
          return;
        }
        if (!addr.gst_no.trim()) {
          setFormError(`GST Number is mandatory for address ${i + 1}.`);
          return;
        }
        if (!addr.contact_number.trim()) {
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
    <TallyFormLayout
      title="Ledger"
      mode="create"
      onAccept={handleSubmit}
      isLoading={createMutation.isPending}
    >
      {formError && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {formError}
        </div>
      )}

      <SectionHeader title="General Details" />
      
      <FormRow label="Ledger Name" required>
        <FormInput
          autoFocus
          required
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Ramesh Traders"
        />
      </FormRow>

      <FormRow label="Alias" hint="Alternative name reference">
        <FormInput
          value={form.alias}
          onChange={(e) => handleChange('alias', e.target.value)}
          placeholder="(optional alias)"
        />
      </FormRow>

      <FormRow label="Under Group" required>
        <FormSelect
          value={form.group}
          onChange={(e) => handleChange('group', e.target.value)}
        >
          <option value="Capital Account">Capital Account</option>
          <option value="Current Assets">Current Assets</option>
          <option value="Current Liabilities">Current Liabilities</option>
          <option value="Sundry Debtors">Sundry Debtors</option>
          <option value="Sundry Creditors">Sundry Creditors</option>
          {groups.map((g) => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))}
        </FormSelect>
      </FormRow>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <FormRow label="Opening Balance">
          <FormInput
            type="number"
            value={form.opening_balance}
            onChange={(e) => handleChange('opening_balance', Number(e.target.value))}
            placeholder="0.00"
            style={{ textAlign: 'right', fontFamily: 'monospace' }}
          />
        </FormRow>
        <FormRow label="Type">
          <FormSelect
            value={form.balance_type}
            onChange={(e) => handleChange('balance_type', e.target.value)}
            style={{ fontWeight: 'bold' }}
          >
            <option value="Dr">Dr</option>
            <option value="Cr">Cr</option>
          </FormSelect>
        </FormRow>
      </div>

      <SectionHeader title="Addresses" />

      <div style={{ padding: '0 16px 16px 16px' }}>
        {form.addresses.map((addr, idx) => (
          <div key={idx} style={{ padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12, position: 'relative' }}>
            {idx > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveAddress(idx)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Remove
              </button>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Address Type</span>
                <FormSelect value={addr.address_type} onChange={e => handleAddressChange(idx, 'address_type', e.target.value)}>
                  <option value="Primary">Primary</option>
                  <option value="Bill">Bill</option>
                  <option value="Ship">Ship</option>
                  <option value="Branch">Branch</option>
                  <option value="Head Office">Head Office</option>
                </FormSelect>
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alias (1, 2, 3...)</span>
                <FormInput value={addr.alias} onChange={e => handleAddressChange(idx, 'alias', e.target.value)} placeholder="e.g. 1" />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Street Address</span>
              <textarea
                rows={2}
                value={addr.address}
                onChange={e => handleAddressChange(idx, 'address', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, background: 'var(--bg-input)' }}
                placeholder="Street address details"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>City</span>
                <FormInput value={addr.city} onChange={e => handleAddressChange(idx, 'city', e.target.value)} placeholder="City" />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>State</span>
                <FormSelect value={addr.state} onChange={e => handleAddressChange(idx, 'state', e.target.value)}>
                  <option value="">- Select -</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pincode *</span>
                <FormInput value={addr.pincode} onChange={e => handleAddressChange(idx, 'pincode', e.target.value)} placeholder="Pincode" />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Country</span>
                <FormInput value={addr.country} onChange={e => handleAddressChange(idx, 'country', e.target.value)} placeholder="Country" />
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>GST Number *</span>
                <FormInput value={addr.gst_no} onChange={e => handleAddressChange(idx, 'gst_no', e.target.value)} placeholder="GSTIN" style={{ fontFamily: 'monospace' }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Number *</span>
                <FormInput value={addr.contact_number} onChange={e => handleAddressChange(idx, 'contact_number', e.target.value)} placeholder="Phone/Mobile" />
              </label>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={handleAddAddress}
          style={{ padding: '8px 16px', background: 'transparent', border: '1px dashed var(--primary)', borderRadius: 6, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
        >
          + Add Another Address
        </button>
      </div>

      <SectionHeader title="Statutory & Bank" />

      <FormRow label="PAN / IT No. *" hint="Mandatory for compliance">
        <FormInput
          value={form.pan}
          onChange={(e) => handleChange('pan', e.target.value)}
          placeholder="ABCDE1234F"
          style={{ fontFamily: 'monospace' }}
        />
      </FormRow>

      <FormRow label="Banking">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
          <input
            type="checkbox"
            checked={form.provide_bank}
            onChange={(e) => handleChange('provide_bank', e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Provide bank details</span>
        </label>
      </FormRow>

      {createMutation.isError && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginTop: 16 }}>
          Could not create ledger. Please try again.
        </div>
      )}
    </TallyFormLayout>
  );
}
