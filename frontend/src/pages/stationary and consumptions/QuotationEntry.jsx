import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, PlusCircle, Upload, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';

export default function QuotationEntry() {
  const [view, setView] = useState('list');
  const [quotations, setQuotations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    vendor: '',
    validityDate: '',
    paymentTerms: '30 Days Credit',
    quotation_file_path: '',
    items: []
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setQuotations(mockDb.get('consumables_quotations'));
    setVendors(mockDb.get('consumables_vendors'));
    setItemsList(mockDb.get('consumables_items'));
  }, [view]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    try {
      const res = await api.post('/stationary/po/upload-quotation', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, quotation_file_path: res.data.quotation_file_path }));
    } catch (err) {
      console.error('Failed to upload quotation file:', err);
      alert('Quotation file upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddField = () => {
    const itm = itemsList[0];
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: itm?.id || '', qty: 1, rate: itm?.rate || 0, total: itm?.rate || 0 }]
    });
  };

  const handleItemChange = (index, itemId) => {
    const selected = itemsList.find(x => x.id === itemId);
    const updated = [...formData.items];
    updated[index] = {
      ...updated[index],
      itemId: selected.id,
      rate: selected.rate || 0,
      total: selected.rate * updated[index].qty
    };
    setFormData({ ...formData, items: updated });
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...formData.items];
    updated[index].qty = qty;
    updated[index].total = updated[index].rate * qty;
    setFormData({ ...formData, items: updated });
  };

  const handleRateChange = (index, rate) => {
    const updated = [...formData.items];
    updated[index].rate = Number(rate);
    updated[index].total = Number(rate) * updated[index].qty;
    setFormData({ ...formData, items: updated });
  };

  const handleRemoveField = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Add items to quotation.');
      return;
    }
    const newQuotation = {
      id: 'QTN' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      vendor: formData.vendor || vendors[0]?.name || 'Apex Supplies Ltd',
      validityDate: formData.validityDate,
      paymentTerms: formData.paymentTerms,
      status: 'Pending',
      items: formData.items,
      quotation_file_path: formData.quotation_file_path
    };
    mockDb.add('consumables_quotations', newQuotation);
    setView('list');
  };

  const handleApprove = (id) => {
    mockDb.update('consumables_quotations', id, { status: 'Approved' });
    setQuotations(mockDb.get('consumables_quotations'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    mockDb.delete('consumables_quotations', id);
    setQuotations(mockDb.get('consumables_quotations'));
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuotations = quotations.filter(q => 
    q.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: '#6366f1' }} /> Vendor Quotations
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Log and compare quotation rates from stationery and item suppliers</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setFormData({ vendor: vendors[0]?.name || '', validityDate: '', paymentTerms: '30 Days Credit', items: [], quotation_file_path: '' });
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Add Quotation
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-icon purple">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>{quotations.length}</h3>
                <p>Total Quotations</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon amber">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>{quotations.filter(q => q.status === 'Pending').length}</h3>
                <p>Pending Quotations</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon emerald">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{quotations.filter(q => q.status === 'Approved').length}</h3>
                <p>Approved Quotations</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon cyan">
                <div style={{ fontSize: 20, fontWeight: '800' }}>₹</div>
              </div>
              <div className="stat-info">
                <h3>₹{quotations.reduce((sum, q) => sum + q.items.reduce((acc, i) => acc + i.total, 0), 0).toLocaleString()}</h3>
                <p>Total Value</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Quotations ({filteredQuotations.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Validity</th>
                  <th>Payment Terms</th>
                  <th style={{ textAlign: "right" }}>Total Value</th>
                  <th style={{ textAlign: "center" }}>File</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredQuotations.map(q => {
                  const val = q.items.reduce((acc, i) => acc + i.total, 0);
                  return (
                    <tr key={q.id}>
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{q.id}</td>
                      <td>{q.date}</td>
                      <td style={{ fontWeight: 600 }}>{q.vendor}</td>
                      <td>{q.validityDate || '-'}</td>
                      <td>{q.paymentTerms}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>₹{val.toLocaleString()}</td>
                      <td style={{ textAlign: "center" }}>
                        {q.quotation_file_path ? (
                          <a 
                            href={`${api.defaults.baseURL || ''}${q.quotation_file_path}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                          >
                            <Download size={14} /> View
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ 
                          color: q.status === 'Pending' ? '#d97706' : '#047857', 
                          fontWeight: 600, 
                          backgroundColor: q.status === 'Pending' ? '#fef3c7' : '#d1fae5', 
                          padding: '4px 10px', borderRadius: 12, fontSize: 12 
                        }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          {q.status === 'Pending' && (
                            <button onClick={() => handleApprove(q.id)} style={{ padding: 6, borderRadius: 8, color: '#15803d', background: '#dcfce7', cursor: "pointer", border: "none" }} title="Approve">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(q.id)} style={{ padding: 6, borderRadius: 8, color: '#ef4444', background: '#fef2f2', cursor: "pointer", border: "none" }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: 10, background: '#6366f115', borderRadius: 10, color: '#6366f1' }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Record Vendor Quotation</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Log a new quotation from a vendor</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label>Select Vendor <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.vendor} 
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})} 
                  className="form-control"
                >
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Validity Date</label>
                <input 
                  type="date" value={formData.validityDate} 
                  onChange={(e) => setFormData({...formData, validityDate: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label>Payment Terms</label>
                <input 
                  type="text" value={formData.paymentTerms} 
                  onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} 
                  className="form-control" 
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label>Quotation Attachment (PDF/Image)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                {formData.quotation_file_path ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border)' }}>
                    <FileText size={16} style={{ color: '#6366f1' }} />
                    <span style={{ fontFamily: 'monospace' }}>{formData.quotation_file_path.split('/').pop()}</span>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, quotation_file_path: '' }))} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="file" 
                      id="quotation-file-upload" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                    <label htmlFor="quotation-file-upload" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload File'}
                    </label>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Quotation Items</h4>
                <button type="button" onClick={handleAddField} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <PlusCircle size={14} /> Add Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  No items added yet. Click 'Add Item'.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {formData.items.map((field, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="form-group" style={{ flex: 2, margin: 0 }}>
                        <label>Item</label>
                        <select 
                          value={field.itemId} 
                          onChange={(e) => handleItemChange(idx, e.target.value)} 
                          className="form-control"
                        >
                          {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Qty</label>
                        <input 
                          type="number" required min="1" value={field.qty} 
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))} 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Rate (₹)</label>
                        <input 
                          type="number" step="0.01" value={field.rate} 
                          onChange={(e) => handleRateChange(idx, e.target.value)} 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Total (₹)</label>
                        <input type="text" readOnly value={field.total} className="form-control" style={{ background: '#f8fafc', fontWeight: 600 }} />
                      </div>
                      <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-secondary" style={{ padding: '10px 12px', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Save Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
