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

  return (
    <div className="animate-fade" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header */}
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: '12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Vendor Quotations</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: '4px 0 0 0' }}>Log and compare quotation rates from stationery and item suppliers</p>
            </div>
            <button onClick={() => {
              setFormData({ vendor: vendors[0]?.name || '', validityDate: '', paymentTerms: '30 Days Credit', items: [], quotation_file_path: '' });
              setView('form');
            }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Plus size={16} /> Add Quotation
            </button>
          </div>

          {/* Quotations List */}
          <div className="card" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <table className="data-table">
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
                {quotations.map(q => {
                  const val = q.items.reduce((acc, i) => acc + i.total, 0);
                  return (
                    <tr key={q.id}>
                      <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{q.id}</td>
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
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                          >
                            <Download size={14} /> View
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 700, 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          background: q.status === 'Approved' ? '#dcfce7' : '#fef3c7', 
                          color: q.status === 'Approved' ? '#15803d' : '#b45309' 
                        }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          {q.status === 'Pending' && (
                            <button onClick={() => handleApprove(q.id)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12, color: '#15803d', borderColor: '#bbf7d0', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          <button onClick={() => handleDelete(q.id)} className="btn btn-outline" style={{ padding: '4px 8px', minWidth: 0, color: '#dc2626', borderColor: '#fee2e2' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {quotations.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <FileText size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <div>No vendor quotations registered.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="card animate-fade" style={{ borderRadius: '12px' }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Record Vendor Quotation</h2>
            <button onClick={() => setView('list')} style={{ padding: 4, borderRadius: "var(--radius-sm)", cursor: "pointer", background: "none", border: "none" }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="form-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div>
                <label>Select Vendor *</label>
                <select 
                  value={formData.vendor} 
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})} 
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                >
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label>Validity Date</label>
                <input 
                  type="date" value={formData.validityDate} 
                  onChange={(e) => setFormData({...formData, validityDate: e.target.value})} 
                  className="form-control" 
                  style={{ borderRadius: '8px' }}
                />
              </div>
              <div>
                <label>Payment Terms</label>
                <input 
                  type="text" value={formData.paymentTerms} 
                  onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} 
                  className="form-control" 
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            {/* Quotation file upload field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '400px' }}>
              <label style={{ fontWeight: 600 }}>Quotation Attachment (PDF/Image)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {formData.quotation_file_path ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: 13 }}>
                    <FileText size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontFamily: 'monospace' }}>{formData.quotation_file_path.split('/').pop()}</span>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, quotation_file_path: '' }))} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: 2 }} title="Remove file">
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
                    <label htmlFor="quotation-file-upload" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 14px', borderRadius: '6px', fontSize: 13, border: '1px solid var(--border)' }}>
                      <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload File'}
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Quotation Items</h3>
                <button type="button" onClick={handleAddField} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold text-sm" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                  <PlusCircle size={16} /> Add Item
                </button>
              </div>

              <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {formData.items.map((field, idx) => (
                  <div key={idx} className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-dashed text-xs" style={{ display: 'flex', gap: 16, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px dashed var(--border)', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Item</label>
                      <select 
                        value={field.itemId} 
                        onChange={(e) => handleItemChange(idx, e.target.value)} 
                        className="form-control"
                        style={{ borderRadius: '6px' }}
                      >
                        {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div style={{ width: '100px' }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Qty</label>
                      <input 
                        type="number" required min="1" value={field.qty} 
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))} 
                        className="form-control" 
                        style={{ borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ width: '120px' }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Rate (₹)</label>
                      <input 
                        type="number" step="0.01" value={field.rate} 
                        onChange={(e) => handleRateChange(idx, e.target.value)} 
                        className="form-control" 
                        style={{ borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ width: '140px' }}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total (₹)</label>
                      <input type="text" readOnly value={field.total} className="form-control" style={{ borderRadius: '6px', background: '#e2e8f0', fontWeight: 600 }} />
                    </div>
                    <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-danger" style={{ borderRadius: '6px', padding: 8 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 20 }}>
              <button type="button" onClick={() => setView('list')} className="px-4 py-2 border rounded-lg" style={{ cursor: 'pointer' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Save size={16} /> Save Quotation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
