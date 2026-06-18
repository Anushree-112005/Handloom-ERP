import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useCompanyStore from '../../store/companyStore';
import { stockCategories } from '../../api';
import TallyFormLayout, { FormRow, FormInput, FormSelect, SectionHeader } from '../../components/layout/TallyFormLayout';

export default function StockCategoryForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', alias: '', parent_id: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: categories = [] } = useQuery({
    queryKey: ['stock-categories', activeCompany?.id],
    queryFn:  () => stockCategories.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  const { data: existing } = useQuery({
    queryKey: ['stock-category', id],
    queryFn:  () => stockCategories.get(id),
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
    queryClient.invalidateQueries(['stock-categories', activeCompany?.id]);
    navigate('/cubebook/inventory-masters?tab=categories');
  };

  const payload = () => ({
    name:       form.name.trim(),
    parent_id:  form.parent_id !== '' ? Number(form.parent_id) : null,
    company_id: activeCompany.id,
  });

  const createMut = useMutation({ mutationFn: d => stockCategories.create(d), onSuccess });
  const updateMut = useMutation({ mutationFn: d => stockCategories.update(id, d), onSuccess });

  const handleAccept = () => {
    if (!form.name.trim()) return;
    mode === 'create' ? createMut.mutate(payload()) : updateMut.mutate(payload());
  };

  if (!activeCompany) return null;

  return (
    <TallyFormLayout
      title="Stock Category"
      mode={mode}
      onAccept={handleAccept}
      isLoading={createMut.isPending || updateMut.isPending}
      accentColor="#f59e0b"
    >
      <SectionHeader title="General" />

      <FormRow label="Name" required>
        <FormInput autoFocus placeholder="e.g. Fabric, Yarn, Accessories" value={form.name} onChange={set('name')} />
      </FormRow>

      <FormRow label="Alias" hint="Optional short code">
        <FormInput placeholder="(optional alias)" value={form.alias} onChange={set('alias')} />
      </FormRow>

      <FormRow label="Under" hint="Parent category — leave blank for top-level">
        <FormSelect value={form.parent_id} onChange={set('parent_id')}>
          <option value="">Primary (Top Level)</option>
          {categories.filter(c => !id || c.id !== Number(id)).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </FormSelect>
      </FormRow>
    </TallyFormLayout>
  );
}
