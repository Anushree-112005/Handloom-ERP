import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useCompanyStore from '../../store/companyStore';
import { stockGroups } from '../../api';
import TallyFormLayout, { FormRow, FormInput, FormSelect, SectionHeader } from '../../components/layout/TallyFormLayout';

export default function StockGroupForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', alias: '', parent_id: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: groups = [] } = useQuery({
    queryKey: ['stock-groups', activeCompany?.id],
    queryFn:  () => stockGroups.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  const { data: existing } = useQuery({
    queryKey: ['stock-group', id],
    queryFn:  () => stockGroups.get(id),
    enabled:  mode === 'alter' && !!id,
  });

  useEffect(() => {
    if (existing) setForm({
      name:      existing.name      || '',
      alias:     existing.alias     || '',
      parent_id: existing.parent_id != null ? String(existing.parent_id) : '',
    });
  }, [existing]);

  const onSuccess = () => {
    queryClient.invalidateQueries(['stock-groups', activeCompany?.id]);
    navigate('/cubebook/inventory-masters?tab=groups');
  };

  const payload = () => ({
    name:       form.name.trim(),
    parent_id:  form.parent_id !== '' ? Number(form.parent_id) : null,
    company_id: activeCompany.id,
  });

  const createMut = useMutation({ mutationFn: d => stockGroups.create(d), onSuccess });
  const updateMut = useMutation({ mutationFn: d => stockGroups.update(id, d), onSuccess });

  const handleAccept = () => {
    if (!form.name.trim()) return;
    mode === 'create' ? createMut.mutate(payload()) : updateMut.mutate(payload());
  };

  if (!activeCompany) return null;

  return (
    <TallyFormLayout
      title="Stock Group"
      mode={mode}
      onAccept={handleAccept}
      isLoading={createMut.isPending || updateMut.isPending}
      accentColor="#6366f1"
    >
      <SectionHeader title="General" />

      <FormRow label="Name" required>
        <FormInput autoFocus placeholder="e.g. Raw Materials" value={form.name} onChange={set('name')} />
      </FormRow>

      <FormRow label="Alias" hint="Optional short code">
        <FormInput placeholder="(optional alias)" value={form.alias} onChange={set('alias')} />
      </FormRow>

      <FormRow label="Under" hint="Parent group — leave blank for top-level">
        <FormSelect value={form.parent_id} onChange={set('parent_id')}>
          <option value="">Primary (Top Level)</option>
          {groups.filter(g => !id || g.id !== Number(id)).map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </FormSelect>
      </FormRow>
    </TallyFormLayout>
  );
}
