import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import useCompanyStore from '../store/companyStore';
import { companies } from '../api';
import TallyFormLayout, { FormRow, FormInput, SectionHeader } from '../components/layout/TallyFormLayout';

export default function CurrencyCreate() {
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
      navigate('/currency');
    },
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    mutation.mutate(form);
  };

  return (
    <TallyFormLayout
      title="Currency Master"
      mode="create"
      onAccept={handleSubmit}
      isLoading={mutation.isPending}
    >
      <SectionHeader title="Currency Properties" />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="Currency Symbol" required>
          <FormInput
            autoFocus
            required
            value={form.currency_symbol}
            onChange={(e) => handleChange('currency_symbol', e.target.value)}
            placeholder="e.g. ₹, $, €"
          />
        </FormRow>

        <FormRow label="Formal Name" required>
          <FormInput
            required
            value={form.currency_name}
            onChange={(e) => handleChange('currency_name', e.target.value)}
            placeholder="e.g. INR"
          />
        </FormRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="ISO Currency Code">
          <FormInput
            value={form.currency_iso_code}
            onChange={(e) => handleChange('currency_iso_code', e.target.value)}
            placeholder="e.g. INR"
          />
        </FormRow>

        <FormRow label="Number of Decimal Places">
          <FormInput
            type="number"
            min="0"
            max="4"
            value={form.currency_decimal_places}
            onChange={(e) => handleChange('currency_decimal_places', Number(e.target.value))}
          />
        </FormRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormRow label="Word representing unit (Whole)">
          <FormInput
            value={form.currency_amount_words_unit}
            onChange={(e) => handleChange('currency_amount_words_unit', e.target.value)}
            placeholder="e.g. Rupees"
          />
        </FormRow>

        <FormRow label="Word representing unit (Decimal)">
          <FormInput
            value={form.currency_amount_words_decimal}
            onChange={(e) => handleChange('currency_amount_words_decimal', e.target.value)}
            placeholder="e.g. Paise"
          />
        </FormRow>
      </div>

      <SectionHeader title="Display settings" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <FormRow label="Show in millions">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
            <input
              type="checkbox"
              checked={form.currency_show_in_millions}
              onChange={(e) => handleChange('currency_show_in_millions', e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Enable</span>
          </label>
        </FormRow>

        <FormRow label="Suffix symbol">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
            <input
              type="checkbox"
              checked={form.currency_suffix_symbol}
              onChange={(e) => handleChange('currency_suffix_symbol', e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Enable</span>
          </label>
        </FormRow>

        <FormRow label="Add space after symbol">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}>
            <input
              type="checkbox"
              checked={form.currency_space_between_amount_and_symbol}
              onChange={(e) => handleChange('currency_space_between_amount_and_symbol', e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Enable</span>
          </label>
        </FormRow>
      </div>

      {mutation.isError && (
        <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginTop: 16 }}>
          Could not save currency settings. Please try again.
        </div>
      )}
    </TallyFormLayout>
  );
}
