import React, { useState, useEffect } from 'react';
import { Package, Plus, CheckCircle, X, Save, Edit2, Trash2, AlertTriangle, Calendar, User, Laptop, Monitor, Phone, Headphones, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchAssets, createAsset, updateAsset, deleteAsset, fetchEmployees } from '../../../services/hrService';

const assetCategories = [
  { name: 'Laptop', icon: Laptop },
  { name: 'Desktop', icon: Monitor },
  { name: 'Mobile', icon: Phone },
  { name: 'Headphones', icon: Headphones },
  { name: 'Keyboard', icon: Package },
  { name: 'Mouse', icon: Package },
  { name: 'Monitor', icon: Monitor },
  { name: 'Chair', icon: Package },
  { name: 'Desk', icon: Package },
  { name: 'ID Card', icon: Package },
  { name: 'Access Card', icon: Package },
  { name: 'Other', icon: Package }
];

const statusColors = {
  'Assigned': 'bg-green-100 text-green-700',
  'Available': 'bg-blue-100 text-blue-700',
  'Under Maintenance': 'bg-yellow-100 text-yellow-700',
  'Retired': 'bg-slate-100 text-slate-600',
  'Lost': 'bg-red-100 text-red-700'
};

const conditionColors = {
  'Excellent': 'text-green-600',
  'Good': 'text-blue-600',
  'Fair': 'text-yellow-600',
  'Poor': 'text-red-600'
};

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const initialForm = {
    asset_name: '',
    asset_tag: '',
    category: '',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_end: '',
    condition: 'Good',
    assigned_to: '',
    assigned_employee_name: '',
    assigned_date: '',
    location: '',
    notes: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetData, empData] = await Promise.all([
        fetchAssets(),
        fetchEmployees()
      ]);
      setAssets(assetData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.asset_name || !form.category) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        asset_type: form.category,
        asset_name: form.asset_name,
        brand: form.brand || null,
        model: form.model || null,
        serial_number: form.serial_number || null,
        employee_id: form.assigned_to ? parseInt(form.assigned_to) : null,
        employee_name: form.assigned_employee_name || null,
        assigned_date: form.assigned_date || null,
        purchase_date: form.purchase_date || null,
        purchase_value: parseFloat(form.purchase_cost) || 0,
        current_value: parseFloat(form.purchase_cost) || 0,
        condition: form.condition || 'Good',
        notes: form.notes || null
      };

      if (editingId) {
        await updateAsset(editingId, payload);
      } else {
        await createAsset(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Failed to save asset. Please check all fields.');
    }
  };

  const handleEdit = (asset) => {
    setForm({
      asset_name: asset.asset_name,
      asset_tag: asset.asset_id || '',
      category: asset.asset_type,
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      purchase_date: asset.purchase_date?.split('T')[0] || '',
      purchase_cost: asset.purchase_value || '',
      warranty_end: asset.warranty_end?.split('T')[0] || '',
      condition: asset.condition || 'Good',
      assigned_to: asset.employee_id || '',
      assigned_employee_name: asset.employee_name || '',
      assigned_date: asset.assigned_date?.split('T')[0] || '',
      location: asset.location || '',
      notes: asset.notes || ''
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await deleteAsset(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e.id === parseInt(empId));
    setForm({
      ...form,
      assigned_to: empId,
      assigned_employee_name: emp?.name || '',
      assigned_date: empId ? new Date().toISOString().split('T')[0] : ''
    });
  };

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = !filterCategory || asset.category === filterCategory;
    const matchesStatus = !filterStatus || asset.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  // Stats
  const stats = {
    total: assets.length,
    assigned: assets.filter(a => a.status === 'Assigned').length,
    available: assets.filter(a => a.status === 'Available').length,
    maintenance: assets.filter(a => a.status === 'Under Maintenance').length,
    totalValue: assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0)
  };

  // Category breakdown
  const categoryBreakdown = assetCategories.map(cat => ({
    ...cat,
    count: assets.filter(a => a.category === cat.name).length
  })).filter(c => c.count > 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const generateAssetTag = () => {
    const prefix = 'AST';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div className="btn btn-secondary">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Assets</h1>
          <span className="btn btn-primary">
            {filteredAssets.length} Records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                showFilters || filterCategory || filterStatus
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              Filter
              {(filterCategory || filterStatus) && (
                <span className="btn btn-primary" />
              )}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button
                    onClick={() => { setFilterCategory(''); setFilterStatus(''); setShowFilters(false); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Categories</option>
                      {assetCategories.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Status</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Available">Available</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="btn btn-secondary">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button
            onClick={() => { 
              setShowForm(true); 
              setEditingId(null); 
              setForm({ ...initialForm, asset_tag: generateAssetTag() }); 
            }}
            className="btn btn-primary"
          >
            <Plus size={14} /> Add Asset
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

      {/* Stats */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Assets</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.assigned}</p>
              <p className="text-xs text-slate-500">Assigned</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.available}</p>
              <p className="text-xs text-slate-500">Available</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.maintenance}</p>
              <p className="text-xs text-slate-500">Maintenance</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
              <p className="text-xs text-slate-500">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Content */}
      {viewMode === 'list' ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
            <thead className="btn btn-secondary">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Asset</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Tag</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Assigned To</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Condition</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="btn btn-secondary">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{asset.asset_name}</p>
                      <p className="text-xs text-slate-500">{asset.brand} {asset.model}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-indigo-600">{asset.asset_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{asset.asset_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    {asset.employee_name ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{asset.employee_name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${conditionColors[asset.condition]}`}>
                      {asset.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(asset)} className="btn btn-secondary">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No assets found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="form-row">
          {filteredAssets.map(asset => {
            const CategoryIcon = assetCategories.find(c => c.name === asset.asset_type)?.icon || Package;
            return (
              <div key={asset.id} className="card">
                <div className="flex items-start gap-3 mb-3">
                  <div className="btn btn-primary">
                    <CategoryIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{asset.asset_name}</h3>
                    <p className="text-xs text-slate-500">{asset.brand} {asset.model}</p>
                    <span className="inline-block mt-1 text-xs font-mono text-indigo-600">{asset.asset_id}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-700 font-medium">{asset.asset_type}</span>
                  </div>
                  {asset.employee_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{asset.employee_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Condition:</span>
                    <span className={`font-medium ${conditionColors[asset.condition]}`}>{asset.condition}</span>
                  </div>
                </div>
                
                <div className="btn btn-secondary">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                    {asset.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(asset)} className="btn btn-secondary">
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(asset.id)} className="btn btn-danger">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredAssets.length === 0 && (
            <div className="btn btn-secondary">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No assets found</p>
            </div>
          )}
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Asset</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name *</label>
                  <input
                    type="text"
                    value={form.asset_name}
                    onChange={(e) => setForm({ ...form, asset_name: e.target.value })}
                    className="form-control"
                    placeholder="MacBook Pro 14 inch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Asset Tag</label>
                  <input
                    type="text"
                    value={form.asset_tag}
                    onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
                    className="form-control"
                    placeholder="AST-001"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Category</option>
                    {assetCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="form-control"
                    placeholder="Apple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="form-control"
                    placeholder="M3 Pro"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                    className="form-control"
                    placeholder="FVFG1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="form-control"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={form.purchase_date}
                    onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={form.purchase_cost}
                    onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                    className="form-control"
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty End</label>
                  <input
                    type="date"
                    value={form.warranty_end}
                    onChange={(e) => setForm({ ...form, warranty_end: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                  <select
                    value={form.assigned_to}
                    onChange={handleEmployeeChange}
                    className="form-control"
                  >
                    <option value="">Not Assigned</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="form-control"
                    placeholder="Floor 2, Desk 25"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="btn btn-secondary">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
