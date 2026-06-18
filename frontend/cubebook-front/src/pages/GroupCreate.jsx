import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ledgerGroups } from '../api';
import useCompanyStore from '../store/companyStore';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Save } from 'lucide-react';

export default function GroupCreate() {
  const { activeCompany } = useCompanyStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [under, setUnder] = useState('Capital Account');

  const { data: groups = [] } = useQuery({
    queryKey: ['ledger-groups', activeCompany?.id],
    queryFn: () => ledgerGroups.list(activeCompany.id),
    enabled: !!activeCompany,
  });

  const createMutation = useMutation({
    mutationFn: (data) => ledgerGroups.create(data),
    onSuccess: () => {
      navigate('/cubebook/ledgers');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, parent: under, company_id: activeCompany.id });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Group Creation</h1>
            <p className="cb-page-subtitle">Create a new ledger classification category group</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cb-btn-secondary"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="cb-card p-6 space-y-5 bg-white">
        <h3 className="btn btn-secondary">Group Details</h3>
        
        <label className="flex flex-col gap-1.5">
          <span className="cb-label">Group Name *</span>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="cb-input"
            placeholder="e.g. Indirect Expenses - Admin"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="cb-label">Under (Parent Group) *</span>
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
        </label>

        <div className="btn btn-secondary">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="cb-btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={createMutation.isPending}
            className="cb-btn-primary"
          >
            <Save size={15} />
            {createMutation.isPending ? "Creating..." : "Accept"}
          </button>
        </div>

        {createMutation.isError && (
          <div className="btn btn-danger">
            Could not create ledger group. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}
