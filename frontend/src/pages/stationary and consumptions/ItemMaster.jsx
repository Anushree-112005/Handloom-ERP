import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Box, Loader, AlertCircle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';
import { confirmDialog, alertDialog } from '../../utils/dialogs';

export default function ItemMaster() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category_id: '',
    uom_id: '',
    vendor_id: '',
    department_id: '',
    description: '',
    minimum_stock: '',
    maximum_stock: '',
    reorder_level: '',
    purchase_price: '',
    current_stock: '',
    warehouse: '',
    zone: '',
    rack: '',
    shelf: '',
    bin: '',
    barcode: '',
    status: ''
  });

  const fetchDropdowns = async () => {
    setDropdownsLoading(true);
    try {
      const [cats, units, vens, depts] = await Promise.all([
        storesService.getCategories(),
        storesService.getUOMs(),
        storesService.getVendors(),
        storesService.getDepartments()
      ]);
      setCategories(cats);
      setUoms(units);
      setVendors(vens);
      setDepartments(depts);
    } catch (err) {
      console.error("Failed to load form dropdown options:", err);
      setError("Failed to load UOMs/Categories dropdown options. Please refresh.");
    } finally {
      setDropdownsLoading(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storesService.getItems(searchTerm);
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchTerm, view]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleOpenForm = (item = null) => {
    setError('');
    fetchDropdowns(); 

    if (item) {
      setFormData({
        item_code: item.item_code || '',
        item_name: item.item_name || '',
        category_id: item.category_id || '',
        uom_id: item.uom_id || '',
        vendor_id: item.vendor_id || '',
        department_id: item.department_id || '',
        description: item.description || '',
        minimum_stock: item.minimum_stock !== null ? item.minimum_stock : '',
        maximum_stock: item.maximum_stock !== null ? item.maximum_stock : '',
        reorder_level: item.reorder_level !== null ? item.reorder_level : '',
        purchase_price: item.purchase_price !== null ? item.purchase_price : '',
        current_stock: item.current_stock !== null ? item.current_stock : '',
        warehouse: item.warehouse || '',
        zone: item.zone || '',
        rack: item.rack || '',
        shelf: item.shelf || '',
        bin: item.bin || '',
        barcode: item.barcode || '',
        status: item.status || ''
      });
      setEditingId(item.id);
    } else {
      setFormData({
        item_code: '',
        item_name: '',
        category_id: '',
        uom_id: '',
        vendor_id: '',
        department_id: '',
        description: '',
        minimum_stock: '',
        maximum_stock: '',
        reorder_level: '',
        purchase_price: '',
        current_stock: '',
        warehouse: '',
        zone: '',
        rack: '',
        shelf: '',
        bin: '',
        barcode: '',
        status: ''
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This will soft delete the record.',
      type: 'delete',
      confirmText: 'Delete'
    });
    if (confirmed) {
      try {
        setLoading(true);
        await storesService.deleteItem(id);
        await fetchItems();
      } catch (err) {
        console.error(err);
        alertDialog({ title: 'Error', message: err.response?.data?.detail || 'Failed to delete item.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_code.trim() || !formData.item_name.trim()) {
      setError('Item Code and Item Name are required.');
      return;
    }
    if (!formData.category_id || !formData.uom_id) {
      setError('Please select a Category and Unit of Measurement.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      uom_id: Number(formData.uom_id),
      department_id: Number(formData.department_id),
      vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
      minimum_stock: Number(formData.minimum_stock) || 0,
      maximum_stock: Number(formData.maximum_stock) || 0,
      reorder_level: Number(formData.reorder_level) || 0,
      purchase_price: Number(formData.purchase_price) || 0,
      current_stock: Number(formData.current_stock) || 0
    };

    try {
      if (editingId) {
        await storesService.updateItem(editingId, payload);
        alertDialog({ title: 'Success', message: 'Item updated successfully!', type: 'success' });
      } else {
        await storesService.createItem(payload);
        alertDialog({ title: 'Success', message: 'Item saved successfully!', type: 'success' });
      }
      setView('list');
      await fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the item. Code might be duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'Total Items', value: items.length, icon: <Box size={24} />, color: '#6366f1' },
    { label: 'Active Items', value: items.filter(i => i.status === 'Active').length, icon: <CheckCircle size={24} />, color: '#10b981' },
    { label: 'Inactive Items', value: items.filter(i => i.status !== 'Active').length, icon: <XCircle size={24} />, color: '#ef4444' }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {view === 'list' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box style={{ color: '#6366f1' }} /> Item Master
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Register consumables, packaging, tools, and safety supplies</p>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> New Item
            </button>
          </div>

          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
                <div className="stat-icon" style={{ background: `${s.color}1a`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-info">
                  <h3>{s.value}</h3>
                  <p>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', alignItems: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Items ({items.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 280 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
              <input
                type="text"
                placeholder="Search items by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
          )}

          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>UOM</th>
                  <th style={{ textAlign: "right" }}>Current Stock</th>
                  <th style={{ textAlign: "right" }}>Min Stock</th>
                  <th style={{ textAlign: "right" }}>Reorder Lvl</th>
                  <th style={{ textAlign: "right" }}>Purchase Price</th>
                  <th>Preferred Vendor</th>
                  <th>Department</th>
                  <th>Warehouse Location</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="13" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      {loading ? 'Loading items from database...' : 'No items registered. Click New Item to add one.'}
                    </td>
                  </tr>
                ) : items.map(itm => (
                  <tr key={itm.id}>
                    <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{itm.item_code}</td>
                    <td style={{ fontWeight: 600 }}>{itm.item_name}</td>
                    <td style={{ fontSize: 13 }}>
                      <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                        {itm.category_name || '-'}
                      </span>
                    </td>
                    <td>{itm.uom_name || '-'}</td>
                    <td style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: itm.current_stock <= itm.reorder_level ? '#ef4444' : 'var(--text-primary)'
                    }}>
                      {itm.current_stock}
                    </td>
                    <td style={{ textAlign: "right", color: 'var(--text-muted)' }}>{itm.minimum_stock}</td>
                    <td style={{ textAlign: "right", color: 'var(--text-muted)' }}>{itm.reorder_level}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>₹{itm.purchase_price.toFixed(2)}</td>
                    <td style={{ fontSize: 13 }}>{itm.vendor_name || '-'}</td>
                    <td style={{ fontSize: 13 }}>{itm.department_name || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {itm.warehouse ? `${itm.warehouse} (Z: ${itm.zone || '-'}, R: ${itm.rack || '-'})` : '-'}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${itm.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {itm.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(itm)} style={{ padding: 6, borderRadius: 8, color: '#4f46e5', background: '#e0e7ff', cursor: "pointer", border: "none" }} title="Edit Item">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(itm.id)} style={{ padding: 6, borderRadius: 8, color: '#ef4444', background: '#fef2f2', cursor: "pointer", border: "none" }} title="Delete Item">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : (
        <div className="animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button 
              type="button"
              onClick={() => setView('list')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit Item Details' : 'Add New Item Master'}
            </h2>
          </div>

          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
              <button
                type="button"
                style={{
                  padding: '16px 24px', background: '#fff',
                  border: 'none', borderBottom: '3px solid var(--primary)',
                  fontWeight: 600, color: 'var(--primary)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Item Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
                  </div>
                )}

                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Basic Information
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Item Code *</label>
                        <input
                          type="text" required disabled={!!editingId} value={formData.item_code}
                          onChange={(e) => setFormData({ ...formData, item_code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                          placeholder="Enter Item Code"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Item Name *</label>
                        <input
                          type="text" required value={formData.item_name}
                          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                          placeholder="Enter Item Name"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Status"
                          name="status"
                          value={formData.status}
                          options={['Active', 'Inactive']}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Category"
                          name="category_id"
                          entityType="category"
                          value={formData.category_id}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="UOM"
                          name="uom_id"
                          entityType="uom"
                          value={formData.uom_id}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Department"
                          name="department_id"
                          entityType="department"
                          value={formData.department_id}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter Description"
                          className="form-control"
                          rows="3"
                        />
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Pricing & Stock Levels
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Purchase Price (₹) *</label>
                        <input
                          type="number" step="0.01" required value={formData.purchase_price}
                          onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                          placeholder="Enter Purchase Price"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Current Stock Qty *</label>
                        <input
                          type="number" required value={formData.current_stock}
                          onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                          placeholder="Enter Current Stock Qty"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Min Stock Alert *</label>
                        <input
                          type="number" required value={formData.minimum_stock}
                          onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                          placeholder="Enter Min Stock"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Reorder Level *</label>
                        <input
                          type="number" required value={formData.reorder_level}
                          onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                          placeholder="Enter Reorder Level"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Default Preferred Supplier"
                          name="vendor_id"
                          entityType="vendor"
                          value={formData.vendor_id}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Storage Location
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Warehouse</label>
                        <input
                          type="text" value={formData.warehouse}
                          onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                          placeholder="Enter Warehouse"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Zone</label>
                        <input
                          type="text" value={formData.zone}
                          onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                          placeholder="Enter Zone"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Rack Number</label>
                        <input
                          type="text" value={formData.rack}
                          onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                          placeholder="Enter Rack Number"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Shelf Number</label>
                        <input
                          type="text" value={formData.shelf}
                          onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                          placeholder="Enter Shelf Number"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Bin Number</label>
                        <input
                          type="text" value={formData.bin}
                          onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                          placeholder="Enter Bin Number"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Barcode</label>
                        <input
                          type="text" value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          placeholder="Enter Barcode"
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                    <X size={16} /> Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
