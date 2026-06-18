import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgers, ledgerGroups } from '../api';
import useCompanyStore from '../store/companyStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Filter, MoreHorizontal, Download, Users, ShoppingBag, Briefcase, CheckCircle, ArrowLeft, Save } from 'lucide-react';

const INDIAN_STATES = [
  "Tamil Nadu", "Maharashtra", "Karnataka", "Delhi", "Telangana", "Andhra Pradesh",
  "Gujarat", "West Bengal", "Kerala", "Uttar Pradesh", "Bihar", "Rajasthan"
];

const Ledgers = () => {
  const { activeCompany } = useCompanyStore();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All Types');
  const [isFormOpen, setIsFormOpen] = useState(mode === 'create');
  const [editingId, setEditingId] = useState(null);

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

  // Queries
  const { data: ledgersList = [], isLoading } = useQuery({
    queryKey: ['ledgers', activeCompany?.id],
    queryFn: () => ledgers.list({ company_id: activeCompany.id }),
    enabled: !!activeCompany
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['ledger-groups', activeCompany?.id],
    queryFn: () => ledgerGroups.list(activeCompany.id),
    enabled: !!activeCompany
  });

  const createMutation = useMutation({
    mutationFn: (data) => ledgers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ledgers', activeCompany?.id]);
      handleNew();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ledgers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ledgers', activeCompany?.id]);
      handleNew();
    },
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-slate-500">Please select a company to view ledgers.</p>
      </div>
    );
  }

  // Filter ledgers
  const filteredLedgers = ledgersList?.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (l.alias && l.alias.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGroup = selectedGroup === 'All Types' || l.group === selectedGroup;
    return matchesSearch && matchesGroup;
  }) || [];

  const handleNew = () => {
    setForm({
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
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openForm = () => {
    setForm({
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
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ledger) => {
    setForm({
      name: ledger.name || '',
      alias: ledger.alias || '',
      group: ledger.group || 'Capital Account',
      opening_balance: ledger.opening_balance || 0,
      balance_type: ledger.balance_type || 'Dr',
      pan: ledger.pan || '',
      provide_bank: ledger.provide_bank || false,
      mailing_name: ledger.mailing_name || '',
      mailing_address: ledger.mailing_address || '',
      state: ledger.state || 'Tamil Nadu',
      country: ledger.country || 'India',
      pincode: ledger.pincode || '',
    });
    setEditingId(ledger.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { ...form, company_id: activeCompany.id } });
    } else {
      createMutation.mutate({ ...form, company_id: activeCompany.id });
    }
  };

  const handleChange = (key, val) => {
    setForm({ ...form, [key]: val });
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--primary)" />
            {mode === 'alter' ? 'Alter Ledger' : 'Parties / Ledgers'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {mode === 'alter' ? 'Select a ledger from the list to modify its details' : 'Manage your customers, suppliers, and accounting ledgers'}
          </p>
        </div>
        {!isFormOpen && mode !== 'alter' ? (
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary">
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={openForm}>
              <Plus size={16} /> New Ledger
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {!isFormOpen && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Ledgers</p>
                <h3 className="text-2xl font-bold text-slate-800">{ledgersList?.length || 0}</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Debtors</p>
                <h3 className="text-2xl font-bold text-slate-800">{ledgersList?.filter(l => l.group.toLowerCase().includes('debtor')).length || 0}</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Creditors</p>
                <h3 className="text-2xl font-bold text-slate-800">{ledgersList?.filter(l => l.group.toLowerCase().includes('creditor')).length || 0}</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-fuchsia-50 text-fuchsia-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Active Custom</p>
                <h3 className="text-2xl font-bold text-slate-800">{ledgersList?.filter(l => !l.is_system).length || 0}</h3>
              </div>
            </div>
          </div>

          <div className="cb-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="search-bar" style={{ position: 'relative', width: 300 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search by Code, Name or Phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 44 }}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                   <Filter size={16} className="text-slate-400" />
                   <span className="text-sm text-slate-500 font-semibold">Filter:</span>
                   <select 
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="cb-input py-1.5 px-3"
                      style={{ width: 160 }}
                    >
                      <option value="All Types">All Types</option>
                      {groups?.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                   </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th className="cb-th">Code</th>
                    <th className="cb-th">Ledger Name</th>
                    <th className="cb-th">Type & Group</th>
                    <th className="cb-th">Contact & Phone</th>
                    <th className="cb-th">City</th>
                    <th className="cb-th">GST / PAN</th>
                    <th className="cb-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="cb-td text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Loading parties...</td>
                    </tr>
                  ) : filteredLedgers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="cb-td text-center" style={{ padding: 40 }}>
                        <div style={{ color: 'var(--text-muted)' }}>
                          <Users size={36} style={{ opacity: 0.3, marginBottom: 8, margin: '0 auto' }} />
                          <p style={{ fontWeight: 600 }}>No parties found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLedgers.map((ledger) => (
                      <tr 
                        key={ledger.id} 
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        onClick={() => handleEdit(ledger)}
                      >
                        <td className="cb-td font-medium text-slate-900">
                           {ledger.alias || '-'}
                        </td>
                        <td className="cb-td">
                          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{ledger.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Opening Bal: ₹{ledger.opening_balance?.toLocaleString()} {ledger.balance_type}</div>
                        </td>
                        <td className="cb-td">
                          <span className="cb-badge bg-slate-100 text-slate-700 border border-slate-200">
                            {ledger.group}
                          </span>
                        </td>
                        <td className="cb-td">
                          <div className="text-slate-800">{ledger.contact_person || '-'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ledger.phone || '-'}</div>
                        </td>
                        <td className="cb-td text-slate-700">
                          {ledger.city || '-'}
                        </td>
                        <td className="cb-td">
                          <div className="text-slate-800 text-xs font-mono">{ledger.gstin || '-'}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{ledger.pan || '-'}</div>
                        </td>
                        <td className="cb-td text-right">
                          <button className="text-slate-400 hover:text-purple-600 p-1.5 hover:bg-purple-100 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Inline Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12 items-start animate-fade">
          {/* Left Column: General Configuration (8 cols) */}
          <div className="lg:col-span-8 cb-card p-6 space-y-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div style={{ padding: 10, background: 'rgba(79, 70, 229, 0.1)', borderRadius: 10, color: 'var(--primary)' }}>
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editingId ? 'Alter Ledger' : 'New Ledger'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>General Details</p>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Ledger Name <span style={{ color: '#ef4444' }}>*</span></span>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="cb-input"
                  placeholder="e.g. Ramesh Traders"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">(alias)</span>
                <input
                  type="text"
                  value={form.alias}
                  onChange={(e) => handleChange('alias', e.target.value)}
                  className="cb-input"
                  placeholder="Alternative name reference"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Under Group <span style={{ color: '#ef4444' }}>*</span></span>
                <select
                  value={form.group}
                  onChange={(e) => handleChange('group', e.target.value)}
                  className="cb-input"
                >
                  <option value="Capital Account">Capital Account</option>
                  <option value="Current Assets">Current Assets</option>
                  <option value="Current Liabilities">Current Liabilities</option>
                  <option value="Sundry Debtors">Sundry Debtors</option>
                  <option value="Sundry Creditors">Sundry Creditors</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="col-span-2 flex flex-col gap-1.5">
                  <span className="cb-label">Opening Balance</span>
                  <input
                    type="number"
                    value={form.opening_balance}
                    onChange={(e) => handleChange('opening_balance', Number(e.target.value))}
                    className="cb-input text-right font-mono"
                    placeholder="0.00"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="cb-label">Type</span>
                  <select
                    value={form.balance_type}
                    onChange={(e) => handleChange('balance_type', e.target.value)}
                    className="cb-input font-bold"
                  >
                    <option value="Dr">Dr</option>
                    <option value="Cr">Cr</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="cb-label mb-3">Opening Balance Details</h4>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-500">Opening Balance on 1-Apr-26:</span>
                <span className="font-bold text-slate-800 font-mono">
                  ₹{form.opening_balance.toLocaleString()}.00 {form.balance_type}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Mailing, Tax & Banking (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mailing details */}
            <div className="cb-card p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">Mailing Details</h3>
              
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Mailing Name</span>
                <input
                  type="text"
                  value={form.mailing_name}
                  onChange={(e) => handleChange('mailing_name', e.target.value)}
                  className="cb-input py-1.5"
                  placeholder="Business display name"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Address</span>
                <textarea
                  rows={2}
                  value={form.mailing_address}
                  onChange={(e) => handleChange('mailing_address', e.target.value)}
                  className="cb-input py-1.5 resize-none"
                  placeholder="Street address details"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="cb-label">State</span>
                  <select
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="cb-input py-1"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="cb-label">Country</span>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="cb-input py-1.5"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Pincode</span>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="cb-input py-1.5"
                  placeholder="600001"
                />
              </label>
            </div>

            {/* Tax & Banking */}
            <div className="cb-card p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">Statutory & Bank</h3>
              
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">PAN / IT No.</span>
                <input
                  type="text"
                  value={form.pan}
                  onChange={(e) => handleChange('pan', e.target.value)}
                  className="cb-input py-1.5 font-mono"
                  placeholder="ABCDE1234F"
                />
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.provide_bank}
                  onChange={(e) => handleChange('provide_bank', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500/20"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className="text-xs font-semibold text-slate-600">Provide bank details</span>
              </label>
            </div>

            {/* Actions panel */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="cb-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="cb-btn-primary"
              >
                <Save size={15} />
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Accept & Save'}
              </button>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                Could not save ledger. Please try again.
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default Ledgers;
