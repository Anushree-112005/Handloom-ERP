import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ledgerGroups } from '../api';
import useCompanyStore from '../store/companyStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Plus, Search, Database, ArrowLeft, Save, Edit2 } from 'lucide-react';

export default function GroupCreate() {
  const { activeCompany } = useCompanyStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');
  
  const [isFormOpen, setIsFormOpen] = useState(mode !== 'alter');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [under, setUnder] = useState('Capital Account');
  const [nature, setNature] = useState('Asset');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['ledger-groups', activeCompany?.id],
    queryFn: () => ledgerGroups.list(activeCompany.id),
    enabled: !!activeCompany,
  });

  const createMutation = useMutation({
    mutationFn: (data) => ledgerGroups.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ledger-groups', activeCompany?.id]);
      handleNew();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ledgerGroups.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ledger-groups', activeCompany?.id]);
      handleNew();
    },
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Layers size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company first.</p>
        </div>
      </div>
    );
  }

  const handleNew = () => {
    setName('');
    setUnder('Capital Account');
    setNature('Asset');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openForm = () => {
    setName('');
    setUnder('Capital Account');
    setNature('Asset');
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (group) => {
    if (group.is_system) {
      alert("System groups cannot be altered directly. You can create sub-groups under them.");
      return;
    }
    setName(group.name || '');
    setUnder(group.parent_group || 'Capital Account');
    setNature(group.nature || 'Asset');
    setEditingId(group.id);
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { name, parent_group: under, nature } });
    } else {
      createMutation.mutate({ name, parent_group: under, nature, company_id: activeCompany.id });
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.parent?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      {/* Header & New Entry Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={24} color="var(--primary)" />
            {mode === 'alter' ? 'Alter Group' : 'Accounting Groups'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {mode === 'alter' ? 'Select a group from the list to modify its details' : 'Manage ledger classification categories'}
          </p>
        </div>
        {!isFormOpen && mode !== 'alter' ? (
          <button 
            className="btn btn-primary" 
            onClick={openForm}
          >
            <Plus size={16} /> New Entry
          </button>
        ) : isFormOpen ? (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        ) : null}
      </div>

      {!isFormOpen && (
        <>
          <div className="stats-grid">
            <div className="card stat-card" style={{ '--stat-color': 'var(--primary)' }}>
              <div className="stat-icon purple">
                <Database size={24} />
              </div>
              <div className="stat-info">
                <p>Total Groups</p>
                <h3>{groups.length}</h3>
              </div>
            </div>
            <div className="card stat-card" style={{ '--stat-color': '#10b981' }}>
              <div className="stat-icon emerald">
                <Layers size={24} />
              </div>
              <div className="stat-info">
                <p>Primary Groups</p>
                <h3>{groups.filter(g => !g.parent || g.parent === 'Primary').length}</h3>
              </div>
            </div>
            <div className="card stat-card" style={{ '--stat-color': '#f59e0b' }}>
              <div className="stat-icon amber">
                <Layers size={24} />
              </div>
              <div className="stat-info">
                <p>Sub Groups</p>
                <h3>{groups.filter(g => g.parent && g.parent !== 'Primary').length}</h3>
              </div>
            </div>
          </div>

          <div className="cb-card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Records ({filteredGroups.length})</h3>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cb-input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>
            
            <div className="table-responsive" style={{ flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th className="cb-th" style={{ width: 60 }}>#</th>
                    <th className="cb-th">Group Name</th>
                    <th className="cb-th">Under (Parent)</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="cb-td" colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                  ) : filteredGroups.length === 0 ? (
                    <tr>
                      <td className="cb-td" colSpan={3} style={{ textAlign: 'center', padding: 40 }}>
                        <div style={{ color: 'var(--text-muted)' }}>
                          <Database size={36} style={{ opacity: 0.3, marginBottom: 8, margin: '0 auto' }} />
                          <p style={{ fontWeight: 600 }}>No records found</p>
                          <p style={{ fontSize: 12 }}>Add your first entry using the New Entry button.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredGroups.map((record, idx) => (
                    <tr 
                      key={record.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${!record.is_system ? 'cursor-pointer group' : ''}`}
                      onClick={() => {
                        if (!record.is_system) handleEdit(record);
                      }}
                    >
                      <td className="cb-td">{idx + 1}</td>
                      <td className="cb-td">
                        <span style={{ fontWeight: 600 }}>{record.name}</span>
                        {record.is_system && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">System</span>}
                      </td>
                      <td className="cb-td">
                        <span className="cb-badge bg-slate-100 text-slate-600 border border-slate-200">
                          {record.parent_group || 'Primary'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Inline Form */}
      {isFormOpen && (
        <div className="cb-card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: 'rgba(79, 70, 229, 0.1)', borderRadius: 10, color: 'var(--primary)' }}>
                <Layers size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editingId ? 'Alter Group' : 'New Group'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Accounting Group Details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Group Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cb-input"
                  placeholder="e.g. Indirect Expenses - Admin"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Under (Parent Group) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  value={under} 
                  onChange={(e) => setUnder(e.target.value)} 
                  className="cb-input"
                >
                  <option value="Capital Account">Capital Account</option>
                  <option value="Current Assets">Current Assets</option>
                  <option value="Current Liabilities">Current Liabilities</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24 }}>
              <button type="button" className="cb-btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="cb-btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save size={16} /> {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>

            {(createMutation.isError || updateMutation.isError) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                Could not save ledger group. Please try again.
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
