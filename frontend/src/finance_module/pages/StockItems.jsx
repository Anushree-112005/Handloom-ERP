import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import useCompanyStore from '../store/companyStore';

const StockItems = () => {
  const { activeCompany } = useCompanyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: '',
    opening_qty: 0,
    opening_value: 0,
  });

  // Placeholder for API integration
  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ['stock-items', activeCompany?.id],
    queryFn: () => Promise.resolve([]),
    enabled: !!activeCompany
  });

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-slate-500">Please select a company to view stock items.</p>
      </div>
    );
  }

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    // TODO: Implement add stock item
    setFormData({
      name: '',
      description: '',
      unit: '',
      opening_qty: 0,
      opening_value: 0,
    });
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package size={32} className="text-indigo-600 dark:text-indigo-400" />
          Stock Items
        </h1>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          New Stock Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search stock items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Stock Items Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Unit</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Opening Qty</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Opening Value</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  {searchTerm ? 'No stock items found' : 'No stock items added yet'}
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{item.description}</td>
                  <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{item.unit}</td>
                  <td className="px-6 py-3 text-sm text-right text-slate-900 dark:text-white">{item.opening_qty}</td>
                  <td className="px-6 py-3 text-sm text-right text-slate-900 dark:text-white">₹{item.opening_value.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-700 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="text-red-600 hover:text-red-700 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Stock Item Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add Stock Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter stock item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter description"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., kg, pcs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Opening Qty
                  </label>
                  <input
                    type="number"
                    value={formData.opening_qty}
                    onChange={(e) => setFormData({...formData, opening_qty: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Opening Value (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.opening_value}
                  onChange={(e) => setFormData({...formData, opening_value: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddingNew(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockItems;
