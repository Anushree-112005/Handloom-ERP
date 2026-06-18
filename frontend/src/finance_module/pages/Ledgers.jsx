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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to view ledgers.</p>
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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--primary)" />
            {mode === 'alter' ? 'Alter Ledger' : 'Parties / Ledgers'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>
            {mode === 'alter' ? 'Select a ledger from the list to modify its details' : 'Manage your customers, suppliers, and accounting ledgers'}
          </p>
        </div>
        {!isFormOpen && mode !== 'alter' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-primary" onClick={openForm} style={{ padding: '8px 16px', fontSize: 13 }}>
              <Plus size={16} /> New Ledger
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ padding: '8px 16px', fontSize: 13 }}>
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {!isFormOpen && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 8 }}>
            {[
              { label: 'Total Ledgers', value: ledgersList?.length || 0, icon: Users, color: '#6366f1' },
              { label: 'Debtors', value: ledgersList?.filter(l => l.group.toLowerCase().includes('debtor')).length || 0, icon: ShoppingBag, color: '#10b981' },
              { label: 'Creditors', value: ledgersList?.filter(l => l.group.toLowerCase().includes('creditor')).length || 0, icon: Briefcase, color: '#f59e0b' },
              { label: 'Active Custom', value: ledgersList?.filter(l => !l.is_system).length || 0, icon: CheckCircle, color: '#d946ef' }
            ].map((stat, idx) => (
              <div key={idx} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${stat.color}15`, color: stat.color }}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</p>
                  <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search by Code, Name or Phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 40 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Filter:</span>
                <select 
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="cb-input"
                  style={{ width: 180, cursor: 'pointer' }}
                >
                  <option value="All Types">All Types</option>
                  {groups?.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Code</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Ledger Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Type & Group</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Contact & Phone</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>City</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>GST / PAN</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading parties...</td>
                    </tr>
                  ) : filteredLedgers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                          <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>No parties found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLedgers.map((ledger) => (
                      <tr 
                        key={ledger.id} 
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                        onClick={() => handleEdit(ledger)}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                           {ledger.alias || '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 14 }}>{ledger.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Opening Bal: ₹{ledger.opening_balance?.toLocaleString()} {ledger.balance_type}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 100 }}>
                            {ledger.group}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{ledger.contact_person || '-'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{ledger.phone || '-'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {ledger.city || '-'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 600 }}>{ledger.gstin || '-'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ledger.pan || '-'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6 }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--bg-hover)'}} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}>
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
        <form onSubmit={handleSubmit} className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
          {/* Left Column: General Configuration */}
          <div className="card" style={{ padding: 24, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ padding: 10, background: 'rgba(79, 70, 229, 0.1)', borderRadius: 10, color: 'var(--primary)' }}>
                <Users size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{editingId ? 'Alter Ledger' : 'New Ledger'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>General Details</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Ledger Name <span style={{ color: '#ef4444' }}>*</span></span>
                <input required type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="cb-input" placeholder="e.g. Ramesh Traders" />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>(alias)</span>
                <input type="text" value={form.alias} onChange={(e) => handleChange('alias', e.target.value)} className="cb-input" placeholder="Alternative name reference" />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 2' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Under Group <span style={{ color: '#ef4444' }}>*</span></span>
                <select value={form.group} onChange={(e) => handleChange('group', e.target.value)} className="cb-input">
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

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Opening Balance</span>
                <input type="number" value={form.opening_balance} onChange={(e) => handleChange('opening_balance', Number(e.target.value))} className="cb-input" style={{ textAlign: 'right', fontFamily: 'monospace' }} placeholder="0.00" />
              </label>
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Type</span>
                <select value={form.balance_type} onChange={(e) => handleChange('balance_type', e.target.value)} className="cb-input" style={{ fontWeight: 600 }}>
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Opening Balance Details</h4>
              <div style={{ padding: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Opening Balance on 1-Apr-26:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  ₹{form.opening_balance.toLocaleString()}.00 {form.balance_type}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Mailing, Tax & Banking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Mailing details */}
            <div className="card" style={{ padding: 24, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: '0 0 16px 0' }}>Mailing Details</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Mailing Name</span>
                  <input type="text" value={form.mailing_name} onChange={(e) => handleChange('mailing_name', e.target.value)} className="cb-input" placeholder="Business display name" />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Address</span>
                  <textarea rows={2} value={form.mailing_address} onChange={(e) => handleChange('mailing_address', e.target.value)} className="cb-input" style={{ resize: 'none' }} placeholder="Street address details" />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>State</span>
                    <select value={form.state} onChange={(e) => handleChange('state', e.target.value)} className="cb-input">
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Country</span>
                    <input type="text" value={form.country} onChange={(e) => handleChange('country', e.target.value)} className="cb-input" />
                  </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Pincode</span>
                  <input type="text" value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} className="cb-input" placeholder="600001" />
                </label>
              </div>
            </div>

            {/* Tax & Banking */}
            <div className="card" style={{ padding: 24, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: '0 0 16px 0' }}>Statutory & Bank</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>PAN / IT No.</span>
                  <input type="text" value={form.pan} onChange={(e) => handleChange('pan', e.target.value)} className="cb-input" style={{ fontFamily: 'monospace' }} placeholder="ABCDE1234F" />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={form.provide_bank} onChange={(e) => handleChange('provide_bank', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Provide bank details</span>
                </label>
              </div>
            </div>

            {/* Actions panel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                <Save size={15} />
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Accept & Save'}
              </button>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: 13, fontWeight: 500 }}>
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
