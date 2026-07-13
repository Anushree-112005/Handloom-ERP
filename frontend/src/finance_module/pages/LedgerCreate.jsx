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

  const handleSubmit = () => {
    if (!form.name.trim()) return;
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

      <SectionHeader title="Mailing Details" />

      <FormRow label="Mailing Name">
        <FormInput
          value={form.mailing_name}
          onChange={(e) => handleChange('mailing_name', e.target.value)}
          placeholder="Business display name"
        />
      </FormRow>

      <FormRow label="Address">
        <textarea
          rows={2}
          value={form.mailing_address}
          onChange={(e) => handleChange('mailing_address', e.target.value)}
          className="cb-input resize-none"
          placeholder="Street address details"
        />
      </FormRow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="State">
          <FormSelect
            value={form.state}
            onChange={(e) => handleChange('state', e.target.value)}
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FormSelect>
        </FormRow>
        <FormRow label="Country">
          <FormInput
            value={form.country}
            onChange={(e) => handleChange('country', e.target.value)}
          />
        </FormRow>
      </div>

      <FormRow label="Pincode">
        <FormInput
          value={form.pincode}
          onChange={(e) => handleChange('pincode', e.target.value)}
          placeholder="e.g. 600001"
        />
      </FormRow>

      <SectionHeader title="Statutory & Bank" />

      <FormRow label="PAN / IT No.">
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
