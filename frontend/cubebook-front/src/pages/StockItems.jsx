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
          className="btn btn-primary"
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
          className="form-control"
        />
      </div>

      {/* Stock Items Table */}
      <div className="btn btn-secondary">
        <table className="data-table">
          <thead>
            <tr className="btn btn-secondary">
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
                <tr key={item.id} className="btn btn-secondary">
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
          <div className="card">
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
                  className="form-control"
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
                  className="form-control"
                  placeholder="Enter description"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="form-control"
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
                    className="form-control"
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
                  className="form-control"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddingNew(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="btn btn-primary"
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
