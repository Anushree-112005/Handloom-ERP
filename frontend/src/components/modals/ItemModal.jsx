import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Save, X, Loader, AlertCircle } from 'lucide-react';

export default function ItemModal({ isOpen, onClose, onSave, editingId = null }) {
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

  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (editingId) {
        fetchItemDetails(editingId);
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
        setError('');
      }
    }
  }, [isOpen, editingId]);

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
      console.error(err);
      setError("Failed to load dropdown options.");
    } finally {
      setDropdownsLoading(false);
    }
  };

  const fetchItemDetails = async (id) => {
    setLoading(true);
    try {
      const data = await storesService.getItems();
      const item = data.find(i => i.id === id);
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
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch item details.');
    } finally {
      setLoading(false);
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
      department_id: formData.department_id ? Number(formData.department_id) : null,
      vendor_id: formData.vendor_id ? Number(formData.vendor_id) : null,
      minimum_stock: Number(formData.minimum_stock) || 0,
      maximum_stock: Number(formData.maximum_stock) || 0,
      reorder_level: Number(formData.reorder_level) || 0,
      purchase_price: Number(formData.purchase_price) || 0,
      current_stock: Number(formData.current_stock) || 0
    };

    try {
      let savedData;
      if (editingId) {
        savedData = await storesService.updateItem(editingId, payload);
      } else {
        savedData = await storesService.createItem(payload);
      }
      onSave(savedData);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 1000, maxWidth: '95%', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: 24 }}>
          {loading || dropdownsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader className="animate-spin text-primary" size={24} /></div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                Basic Information
              </h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Item Code *</label>
                  <input
                    type="text" required disabled={!!editingId} value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text" required value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status} required
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category_id} required
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>UOM *</label>
                  <select
                    value={formData.uom_id} required
                    onChange={(e) => setFormData({ ...formData, uom_id: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select UOM --</option>
                    {uoms.map(u => <option key={u.id} value={u.id}>{u.uom_name} ({u.symbol || u.uom_code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                    rows="2"
                  />
                </div>
              </div>

              <h4 style={{ color: 'var(--primary)', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                Pricing & Stock Levels
              </h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Purchase Price (₹) *</label>
                  <input
                    type="number" step="0.01" required value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Current Stock Qty *</label>
                  <input
                    type="number" required value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Min Stock Alert *</label>
                  <input
                    type="number" required value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Reorder Level *</label>
                  <input
                    type="number" required value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Default Preferred Supplier</label>
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                  </select>
                </div>
              </div>

              <h4 style={{ color: 'var(--primary)', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                Storage Location
              </h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Warehouse</label>
                  <input
                    type="text" value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Zone</label>
                  <input
                    type="text" value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Rack</label>
                  <input
                    type="text" value={formData.rack}
                    onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Shelf</label>
                  <input
                    type="text" value={formData.shelf}
                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Bin</label>
                  <input
                    type="text" value={formData.bin}
                    onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Barcode</label>
                  <input
                    type="text" value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
