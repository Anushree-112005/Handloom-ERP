import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useCompanyStore from '../../store/companyStore';
import { units } from '../../api';
import TallyFormLayout, { FormRow, FormInput, SectionHeader } from '../../components/layout/TallyFormLayout';

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4];

export default function UnitForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    symbol:      '',
    formal_name: '',
    number_of_decimal_places: 2,
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: existing } = useQuery({
    queryKey: ['unit', id],
    queryFn:  () => units.get(id),
    enabled:  mode === 'alter' && !!id,
  });

  useEffect(() => {
    if (existing) setForm({
      symbol:      existing.symbol      || '',
      formal_name: existing.formal_name || '',
      number_of_decimal_places: existing.number_of_decimal_places ?? 2,
    });
  }, [existing]);

  const onSuccess = () => {
    queryClient.invalidateQueries(['units', activeCompany?.id]);
    navigate('/cubebook/inventory-masters?tab=units');
  };

  const payload = () => ({
    symbol:      form.symbol.trim(),
    formal_name: form.formal_name.trim() || null,
    number_of_decimal_places: Number(form.number_of_decimal_places),
    company_id:  activeCompany.id,
  });

  const createMut = useMutation({ mutationFn: d => units.create(d), onSuccess });
  const updateMut = useMutation({ mutationFn: d => units.update(id, d), onSuccess });

  const handleAccept = () => {
    if (!form.symbol.trim()) return;
    mode === 'create' ? createMut.mutate(payload()) : updateMut.mutate(payload());
  };

  if (!activeCompany) return null;

  return (
    <TallyFormLayout
      title="Unit of Measure"
      mode={mode}
      onAccept={handleAccept}
      isLoading={createMut.isPending || updateMut.isPending}
      accentColor="#3b82f6"
    >
      <SectionHeader title="Unit Details" />

      <FormRow label="Symbol" required hint="Short code shown in transactions, e.g. Nos, Kg, Mtr">
        <FormInput
          autoFocus
          placeholder="e.g. Nos"
          value={form.symbol}
          onChange={set('symbol')}
          className="w-36 uppercase"
        />
      </FormRow>

      <FormRow label="Formal Name" hint="Full descriptive name, e.g. Numbers, Kilograms">
        <FormInput
          placeholder="e.g. Numbers"
          value={form.formal_name}
          onChange={set('formal_name')}
        />
      </FormRow>

      <FormRow label="Decimal Places" hint="Precision for quantity entry">
        <div className="flex gap-2">
          {DECIMAL_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setForm(f => ({ ...f, number_of_decimal_places: d }))}
              className="w-10 h-10 rounded-lg text-sm font-bold border transition-all"
              style={{
                background: Number(form.number_of_decimal_places) === d ? '#3b82f6' : '#eff6ff',
                color: Number(form.number_of_decimal_places) === d ? '#fff' : '#3b82f6',
                borderColor: Number(form.number_of_decimal_places) === d ? '#3b82f6' : '#bfdbfe',
              }}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          Preview: 1{form.number_of_decimal_places > 0 ? '.' + '0'.repeat(Number(form.number_of_decimal_places)) : ''} {form.symbol || 'Unit'}
        </span>
      </FormRow>
    </TallyFormLayout>
  );
}
