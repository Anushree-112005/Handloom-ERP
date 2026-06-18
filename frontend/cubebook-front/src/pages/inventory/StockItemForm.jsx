import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useCompanyStore from '../../store/companyStore';
import { stockItems, units, stockGroups } from '../../api';
import TallyFormLayout, { FormRow, FormInput, FormSelect, SectionHeader } from '../../components/layout/TallyFormLayout';

const GST_RATES = ['0', '0.1', '0.25', '1', '1.5', '3', '5', '6', '7.5', '12', '18', '28'];

export default function StockItemForm({ mode = 'create' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '', alias: '', group_id: '', unit: '',
    hsn_code: '', gst_rate: '18',
    purchase_rate: '', selling_rate: '',
    opening_qty: '', opening_rate: '',
    description: '',
  });

  const set    = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: allUnits = [] } = useQuery({
    queryKey: ['units', activeCompany?.id],
    queryFn:  () => units.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['stock-groups', activeCompany?.id],
    queryFn:  () => stockGroups.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  const { data: existing } = useQuery({
    queryKey: ['stock-item', id],
    queryFn:  () => stockItems.get(id),
    enabled:  mode === 'alter' && !!id,
  });

  useEffect(() => {
    if (existing) setForm({
      name:          existing.name          || '',
      alias:         existing.alias         || '',
      group_id:      existing.group_id != null ? String(existing.group_id) : '',
      unit:          existing.unit          || '',
      hsn_code:      existing.hsn_code      || '',
      gst_rate:      existing.gst_rate != null ? String(existing.gst_rate) : '18',
      purchase_rate: existing.purchase_rate != null ? String(existing.purchase_rate) : '',
      selling_rate:  existing.selling_rate  != null ? String(existing.selling_rate)  : '',
      opening_qty:   existing.opening_qty   != null ? String(existing.opening_qty)   : '',
      opening_rate:  existing.opening_rate  != null ? String(existing.opening_rate)  : '',
      description:   existing.description   || '',
    });
  }, [existing]);

  const onSuccess = () => {
    queryClient.invalidateQueries(['stock-items', activeCompany?.id]);
    queryClient.invalidateQueries(['items', activeCompany?.id]);
    navigate('/cubebook/inventory-masters?tab=items');
  };

  const openingValue = (parseFloat(form.opening_qty) || 0) * (parseFloat(form.opening_rate) || 0);

  const payload = () => ({
    name:          form.name.trim(),
    unit:          form.unit          || null,
    group_id:      form.group_id !== '' ? Number(form.group_id) : null,
    hsn_code:      form.hsn_code      || null,
    gst_rate:      parseFloat(form.gst_rate)      || 0,
    purchase_rate: parseFloat(form.purchase_rate) || 0,
    selling_rate:  parseFloat(form.selling_rate)  || 0,
    opening_qty:   parseFloat(form.opening_qty)   || 0,
    opening_rate:  parseFloat(form.opening_rate)  || 0,
    company_id:    activeCompany.id,
  });

  const createMut = useMutation({ mutationFn: d => stockItems.create(d), onSuccess });
  const updateMut = useMutation({ mutationFn: d => stockItems.update(id, d), onSuccess });

  const handleAccept = () => {
    if (!form.name.trim()) return;
    mode === 'create' ? createMut.mutate(payload()) : updateMut.mutate(payload());
  };

  if (!activeCompany) return null;

  return (
    <TallyFormLayout
      title="Stock Item"
      mode={mode}
      onAccept={handleAccept}
      isLoading={createMut.isPending || updateMut.isPending}
      accentColor="#22c55e"
    >
      <SectionHeader title="General" />

      <FormRow label="Name" required>
        <FormInput autoFocus placeholder="e.g. Cotton Fabric 40s" value={form.name} onChange={set('name')} />
      </FormRow>

      <FormRow label="Under Group" hint="Stock group this item belongs to">
        <FormSelect value={form.group_id} onChange={set('group_id')}>
          <option value="">— Select Group —</option>
          {allGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </FormSelect>
      </FormRow>

      <FormRow label="Unit of Measure" hint="e.g. Nos, Kg, Mtr, Pcs">
        <FormSelect value={form.unit} onChange={set('unit')}>
          <option value="">Not Applicable</option>
          {allUnits.map(u => (
            <option key={u.id} value={u.symbol}>{u.symbol}{u.formal_name ? ` – ${u.formal_name}` : ''}</option>
          ))}
        </FormSelect>
      </FormRow>

      <SectionHeader title="Tax / GST" />

      <FormRow label="HSN / SAC Code" hint="6-digit HSN code for GST compliance">
        <FormInput placeholder="e.g. 520512" value={form.hsn_code} onChange={set('hsn_code')} className="w-44" />
      </FormRow>

      <FormRow label="GST Rate">
        <div className="flex gap-2 flex-wrap">
          {GST_RATES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setForm(f => ({ ...f, gst_rate: r }))}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={{
                background: form.gst_rate === r ? '#f97316' : '#fff7ed',
                color: form.gst_rate === r ? '#fff' : '#f97316',
                borderColor: form.gst_rate === r ? '#f97316' : '#fed7aa',
              }}
            >
              {r}%
            </button>
          ))}
        </div>
      </FormRow>

      <SectionHeader title="Rates" />

      <FormRow label="Purchase Rate (₹)" hint="Default purchase price per unit">
        <FormInput type="number" min={0} step={0.01} placeholder="0.00" value={form.purchase_rate} onChange={set('purchase_rate')} className="w-44" />
      </FormRow>

      <FormRow label="Selling Rate (₹)" hint="Default selling price per unit">
        <FormInput type="number" min={0} step={0.01} placeholder="0.00" value={form.selling_rate} onChange={set('selling_rate')} className="w-44" />
      </FormRow>

      {/* Margin preview */}
      {form.purchase_rate && form.selling_rate && parseFloat(form.purchase_rate) > 0 && (
        <div className="ml-[calc(33%+0.75rem)] text-xs text-slate-400">
          Margin: <span className={`font-bold ${parseFloat(form.selling_rate) >= parseFloat(form.purchase_rate) ? 'text-emerald-600' : 'text-red-500'}`}>
            ₹{(parseFloat(form.selling_rate) - parseFloat(form.purchase_rate)).toFixed(2)}
            {' '}({(((parseFloat(form.selling_rate) - parseFloat(form.purchase_rate)) / parseFloat(form.purchase_rate)) * 100).toFixed(1)}%)
          </span>
        </div>
      )}

      <SectionHeader title="Opening Balance" />

      <FormRow label="Opening Qty">
        <FormInput type="number" min={0} step={0.001} placeholder="0" value={form.opening_qty} onChange={set('opening_qty')} className="w-36" />
      </FormRow>

      <FormRow label="Opening Rate (₹)" hint="Rate per unit for opening stock valuation">
        <FormInput type="number" min={0} step={0.01} placeholder="0.00" value={form.opening_rate} onChange={set('opening_rate')} className="w-44" />
      </FormRow>

      <FormRow label="Opening Value (₹)" hint="Auto-calculated — Qty × Rate">
        <div className="btn btn-secondary">
          ₹{openingValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </FormRow>
    </TallyFormLayout>
  );
}
