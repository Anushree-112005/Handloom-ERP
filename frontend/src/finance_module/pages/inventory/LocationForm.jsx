import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useCompanyStore from '../../store/companyStore';
import { locations } from '../../api';
import TallyFormLayout, { FormRow, FormInput, FormSelect, SectionHeader } from '../../components/layout/TallyFormLayout';

export default function LocationForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '', alias: '', parent_id: '', address: '',
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: allLocations = [] } = useQuery({
    queryKey: ['locations', activeCompany?.id],
    queryFn:  () => locations.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  const { data: existing } = useQuery({
    queryKey: ['location', id],
    queryFn:  () => locations.get(id),
    enabled:  mode === 'alter' && !!id,
  });

  useEffect(() => {
    if (existing) setForm({
      name:      existing.name      || '',
      alias:     existing.alias     || '',
      parent_id: existing.parent_id != null ? String(existing.parent_id) : '',
      address:   existing.address   || '',
    });
  }, [existing]);

  const onSuccess = () => {
    queryClient.invalidateQueries(['locations', activeCompany?.id]);
    navigate('/inventory-masters?tab=locations');
  };

  const payload = () => ({
    name:       form.name.trim(),
    parent_id:  form.parent_id !== '' ? Number(form.parent_id) : null,
    address:    form.address || null,
    company_id: activeCompany.id,
  });

  const createMut = useMutation({ mutationFn: d => locations.create(d), onSuccess });
  const updateMut = useMutation({ mutationFn: d => locations.update(id, d), onSuccess });

  const handleAccept = () => {
    if (!form.name.trim()) return;
    mode === 'create' ? createMut.mutate(payload()) : updateMut.mutate(payload());
  };

  if (!activeCompany) return null;

  return (
    <TallyFormLayout
      title="Godown / Location"
      mode={mode}
      onAccept={handleAccept}
      isLoading={createMut.isPending || updateMut.isPending}
      accentColor="#ec4899"
    >
      <SectionHeader title="General" />

      <FormRow label="Name" required>
        <FormInput
          autoFocus
          placeholder="e.g. Main Warehouse, Chennai Store"
          value={form.name}
          onChange={set('name')}
        />
      </FormRow>

      <FormRow label="Alias" hint="Optional short code">
        <FormInput placeholder="(optional alias)" value={form.alias} onChange={set('alias')} />
      </FormRow>

      <FormRow label="Under" hint="Parent godown — leave blank for top-level">
        <FormSelect value={form.parent_id} onChange={set('parent_id')}>
          <option value="">Primary (Top Level)</option>
          {allLocations
            .filter(l => !id || l.id !== Number(id))
            .map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </FormSelect>
      </FormRow>

      <SectionHeader title="Address" />

      <FormRow label="Address" hint="Physical address of this godown">
        <textarea
          rows={3}
          placeholder="Enter godown address (optional)"
          value={form.address}
          onChange={set('address')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/15 resize-none transition-all placeholder:text-slate-300"
        />
      </FormRow>
    </TallyFormLayout>
  );
}
