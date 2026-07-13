import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Box, Loader, AlertCircle } from 'lucide-react';

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
    minimum_stock: 0,
    maximum_stock: 0,
    reorder_level: 0,
    purchase_price: 0,
    current_stock: 0,
    warehouse: '',
    zone: '',
    rack: '',
    shelf: '',
    bin: '',
    barcode: '',
    status: 'Active'
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

  // Load options once on mount or when opening form
  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleOpenForm = (item = null) => {
    setError('');
    fetchDropdowns(); // Refresh options in case they changed

    if (item) {
      setFormData({
        item_code: item.item_code,
        item_name: item.item_name,
        category_id: item.category_id,
        uom_id: item.uom_id,
        vendor_id: item.vendor_id || '',
        department_id: item.department_id || '',
        description: item.description || '',
        minimum_stock: item.minimum_stock || 0,
        maximum_stock: item.maximum_stock || 0,
        reorder_level: item.reorder_level || 0,
        purchase_price: item.purchase_price || 0,
        current_stock: item.current_stock || 0,
        warehouse: item.warehouse || '',
        zone: item.zone || '',
        rack: item.rack || '',
        shelf: item.shelf || '',
        bin: item.bin || '',
        barcode: item.barcode || '',
        status: item.status || 'Active'
      });
      setEditingId(item.id);
    } else {
      setFormData({
        item_code: '',
        item_name: '',
        category_id: categories[0]?.id || '',
        uom_id: uoms[0]?.id || '',
        vendor_id: vendors[0]?.id || '',
        department_id: '',
        description: '',
        minimum_stock: 10,
        maximum_stock: 100,
        reorder_level: 20,
        purchase_price: 0,
        current_stock: 0,
        warehouse: 'Main Store',
        zone: '',
        rack: '',
        shelf: '',
        bin: '',
        barcode: '',
        status: 'Active'
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item? This will soft delete the record.')) {
      try {
        setLoading(true);
        await storesService.deleteItem(id);
        await fetchItems();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to delete item.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_id) {
      setError('Please select a Consuming Department first.');
      return;
    }
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
    
    // Map empty strings to null for optional relations
    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      uom_id: Number(formData.uom_id),
      vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
      department_id: formData.department_id ? Number(formData.department_id) : null,
      minimum_stock: Number(formData.minimum_stock) || 0,
      maximum_stock: Number(formData.maximum_stock) || 0,
      reorder_level: Number(formData.reorder_level) || 0,
      purchase_price: Number(formData.purchase_price) || 0,
      current_stock: Number(formData.current_stock) || 0
    };

    try {
      if (editingId) {
        await storesService.updateItem(editingId, payload);
      } else {
        await storesService.createItem(payload);
      }
      setView('list');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the item. Code might be duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: "24px",
        background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)",
        border: "1px solid var(--border)",
        borderRadius: "12px"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'rgb(99, 102, 241)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <Box size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Item Master</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Register consumables, packaging, tools, and safety supplies</p>
          </div>
        </div>
        {view === 'list' ? (
          <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Plus size={16} /> New Item
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Inventory Item' : 'Register New Inventory Item'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting || dropdownsLoading || !formData.department_id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                {editingId ? 'Update Item' : 'Save Item'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Prominent Department Selection (Required First) */}
            <fieldset style={{ 
              border: '2px solid rgb(99, 102, 241)', 
              borderRadius: 12, 
              padding: '24px 32px', 
              margin: 0, 
              background: 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.03) 100%)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'rgb(99, 102, 241)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Select Department *
              </legend>
              <div className="form-group" style={{ maxWidth: '400px', margin: 0 }}>
                <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 14 }}>Consuming Department *</label>
                <select 
                  value={formData.department_id} 
                  required
                  onChange={(e) => setFormData({...formData, department_id: e.target.value})} 
                  className="form-control"
                  style={{ border: '2px solid rgb(99, 102, 241)', borderRadius: '8px', padding: '10px 14px' }}
                >
                  <option value="">-- Choose Department --</option>
                  {departments.filter(d => d.status === 'Active').map(d => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>You must select a department first before you can fill in item details.</small>
              </div>
            </fieldset>

            {!formData.department_id && (
              <div style={{ 
                padding: '16px 20px', 
                borderRadius: '8px', 
                background: 'rgba(99, 102, 241, 0.05)', 
                border: '1px dashed rgb(99, 102, 241)', 
                color: 'rgb(99, 102, 241)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12 
              }}>
                <AlertCircle size={20} className="animate-bounce" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Please select a department first to start entering item details.</span>
              </div>
            )}

            {/* Part 1: Basic Information */}
            <fieldset disabled={!formData.department_id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0, opacity: formData.department_id ? 1 : 0.6 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Basic Item Details
              </legend>
              
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Item Code / Short Name *</label>
                  <input 
                    type="text" required disabled={!!editingId} value={formData.item_code} 
                    onChange={(e) => setFormData({...formData, item_code: e.target.value.toUpperCase().replace(/\s+/g, '-')})} 
                    placeholder="E.g. ITM-NEEDLE-14"
                    className="form-control" 
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Unique identifier (uppercase, no spaces)</small>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Item Name *</label>
                  <input 
                    type="text" required value={formData.item_name} 
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})} 
                    placeholder="E.g. Stitching Needles Size 14"
                    className="form-control" 
                  />
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Category *</label>
                  <select 
                    value={formData.category_id} 
                    required
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})} 
                    className="form-control"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Unit of Measurement (UOM) *</label>
                  <select 
                    value={formData.uom_id} 
                    required
                    onChange={(e) => setFormData({...formData, uom_id: e.target.value})} 
                    className="form-control"
                  >
                    <option value="">-- Select UOM --</option>
                    {uoms.map(u => <option key={u.id} value={u.id}>{u.uom_name} ({u.symbol || u.uom_code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Status *</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})} 
                    className="form-control"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: 20 }}>
                <div className="form-group" style={{ width: '100%' }}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Item Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    placeholder="Enter details, material specification, or compatibility..."
                    className="form-control" 
                    rows="3"
                  />
                </div>
              </div>
            </fieldset>

            {/* Part 2: Pricing & Stock Levels */}
            <fieldset disabled={!formData.department_id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0, opacity: formData.department_id ? 1 : 0.6 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Inventory Levels & Cost
              </legend>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Purchase Price (₹) *</label>
                  <input 
                    type="number" step="0.01" required value={formData.purchase_price} 
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})} 
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Current Stock Qty *</label>
                  <input 
                    type="number" required value={formData.current_stock} 
                    onChange={(e) => setFormData({...formData, current_stock: e.target.value})} 
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Min Stock Alert *</label>
                  <input 
                    type="number" required value={formData.minimum_stock} 
                    onChange={(e) => setFormData({...formData, minimum_stock: e.target.value})} 
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Reorder Level *</label>
                  <input 
                    type="number" required value={formData.reorder_level} 
                    onChange={(e) => setFormData({...formData, reorder_level: e.target.value})} 
                    className="form-control" 
                  />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr', gap: 20, marginTop: 20 }}>
                <div className="form-group" style={{ maxWidth: '400px' }}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Default Preferred Supplier</label>
                  <select 
                    value={formData.vendor_id} 
                    onChange={(e) => setFormData({...formData, vendor_id: e.target.value})} 
                    className="form-control"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Part 3: Physical Storage Location */}
            <fieldset disabled={!formData.department_id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0, opacity: formData.department_id ? 1 : 0.6 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Storage Location Coordinates
              </legend>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Warehouse / Store Room</label>
                  <input 
                    type="text" value={formData.warehouse} 
                    onChange={(e) => setFormData({...formData, warehouse: e.target.value})} 
                    placeholder="E.g. Main Consumables Warehouse"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Zone</label>
                  <input 
                    type="text" value={formData.zone} 
                    onChange={(e) => setFormData({...formData, zone: e.target.value})} 
                    placeholder="E.g. Zone B"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Rack Number</label>
                  <input 
                    type="text" value={formData.rack} 
                    onChange={(e) => setFormData({...formData, rack: e.target.value})} 
                    placeholder="E.g. Rack 3"
                    className="form-control" 
                  />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Shelf Number</label>
                  <input 
                    type="text" value={formData.shelf} 
                    onChange={(e) => setFormData({...formData, shelf: e.target.value})} 
                    placeholder="E.g. Shelf 2"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Bin Number</label>
                  <input 
                    type="text" value={formData.bin} 
                    onChange={(e) => setFormData({...formData, bin: e.target.value})} 
                    placeholder="E.g. Bin H"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Barcode / QR Code</label>
                  <input 
                    type="text" value={formData.barcode} 
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})} 
                    placeholder="E.g. BARCODE-12345"
                    className="form-control" 
                  />
                </div>
              </div>
            </fieldset>
          </div>
        </form>
      )}
    </div>
  );
}
