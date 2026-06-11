import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgers, ledgerGroups } from '../api';
import useCompanyStore from '../store/companyStore';
import { Search, Plus, Filter, MoreHorizontal, Download, Users, ShoppingBag, Briefcase, CheckCircle, Calendar } from 'lucide-react';

const Ledgers = () => {
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All Types');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: ledgersList, isLoading } = useQuery({
    queryKey: ['ledgers', activeCompany?.id],
    queryFn: () => ledgers.list({ company_id: activeCompany.id }),
    enabled: !!activeCompany
  });

  const { data: groups } = useQuery({
    queryKey: ['ledger-groups', activeCompany?.id],
    queryFn: () => ledgerGroups.list(activeCompany.id),
    enabled: !!activeCompany
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={24} className="text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Party Master</h1>
          </div>
          <p className="text-sm text-slate-500">Manage all customers, suppliers, agents and transporters.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Download size={16} />
            Export
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Add New Party
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Total Parties</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{ledgersList?.length || 0}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Sales Parties</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {ledgersList?.filter(l => l.group.toLowerCase().includes('debtor')).length || 0}
            </p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Briefcase size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Purchase Parties</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {ledgersList?.filter(l => l.group.toLowerCase().includes('creditor')).length || 0}
            </p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-fuchsia-50 text-fuchsia-500 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Active Parties</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{ledgersList?.filter(l => !l.is_system).length || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Code, Name or Phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
               <Filter size={16} className="text-slate-400" />
               <span className="text-sm text-slate-500">Filter:</span>
               <select 
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:border-purple-500 shadow-sm"
                >
                  <option value="All Types">All Types</option>
                  {groups?.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
               </select>
            </div>
            <div className="hidden lg:flex items-center gap-2">
               <span className="text-sm text-slate-500">From:</span>
               <div className="relative">
                 <input type="date" className="bg-white border border-slate-200 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:border-purple-500 shadow-sm text-slate-600" />
               </div>
               <span className="text-sm text-slate-500 ml-2">To:</span>
               <div className="relative">
                 <input type="date" className="bg-white border border-slate-200 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:border-purple-500 shadow-sm text-slate-600" />
               </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Business Name</th>
                <th className="px-6 py-4">Type & Group</th>
                <th className="px-6 py-4">Contact & Phone</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">GST / PAN</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-500">Loading parties...</td>
                </tr>
              ) : filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-500 font-medium">
                    No parties found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((ledger) => (
                  <tr key={ledger.id} className="hover:bg-purple-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-medium text-slate-900">
                       {ledger.alias || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-purple-700">{ledger.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Opening Bal: ₹{ledger.opening_balance.toLocaleString()} {ledger.balance_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
                        {ledger.group}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800">{ledger.contact_person || '-'}</div>
                      <div className="text-xs text-slate-500">{ledger.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {ledger.city || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 text-xs font-mono">{ledger.gstin || '-'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{ledger.pan || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
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
      
      {/* TODO: Add Ledger Modal Here */}
    </div>
  );
};

export default Ledgers;
