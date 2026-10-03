import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, Box, Briefcase, CheckCircle, Download, Edit2, Eye, FileText, IndianRupee, Loader, MapPin, Phone, Plus, Save, Search, Trash2, User, X, XCircle, Users, Filter, Globe, Mail } from 'lucide-react';

import { storesService } from '../../services/storesService';
import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';
import { confirmDialog, alertDialog } from '../../utils/dialogs';

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function ItemMaster() {
  const [view, setView] = useState('list');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

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

  const handleDelete = (id, name = 'this item', e = null) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
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
                <Users size={24} color="var(--primary)" /> Item Master
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Register consumables, packaging, tools, and safety supplies</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ExportButton
                data={items}
                filename="Item_Master_Report"
                pdfTitle="Item Master Report"
                columns={[
                  { header: 'Item Code', key: 'item_code' },
                  { header: 'Item Name', key: 'item_name' },
                  { header: 'Current Stock', key: 'current_stock' },
                  { header: 'Reorder Level', key: 'reorder_level' },
                  { header: 'Status', key: 'status' }
                ]}
              />
              <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={16} /> New Item
              </button>
            </div>
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
          {/* Search Card */}
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search items..."
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {loading && <Loader className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Filter size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
              </div>
              
              <select className="form-control" style={{ width: 150, margin: 0 }}>
                <option>All Types</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
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
                    <tr key={itm.id}
                        onClick={() => setSelectedViewItem(itm)}
                        style={{
                          cursor: 'pointer',
                          background: selectedViewItem?.id === itm.id ? 'var(--bg-secondary)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
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
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(itm)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setSelectedViewItem(itm)}
                            title="Preview"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(itm.id, itm.item_name, e)}
                            title="Delete"
                          >
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
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

      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420,
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    setLoading(true);
                    await storesService.deleteItem(id);
                    await fetchItems();
                    if (typeof setSelectedViewItem === 'function' && selectedViewItem?.id === id) setSelectedViewItem(null);
                  } catch (err) {
                    alertDialog({ title: 'Error', message: err.response?.data?.detail || 'Failed to delete record.', type: 'error' });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Item Master Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>

                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>ITEM MASTER</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                <div style={{ padding: '10px 40px 40px 40px' }}>
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(10, 20).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Handloom ERP</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@handloomerp.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.handloomerp.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                      <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

