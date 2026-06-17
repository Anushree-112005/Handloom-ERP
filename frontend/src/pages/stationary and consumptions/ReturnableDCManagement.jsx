import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Save, Trash2, X, FileText, Search, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export default function ReturnableDCManagement() {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [dcs, setDcs] = useState([]);
  const [activeStream, setActiveStream] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    dc_no: '',
    dc_stream: 'General Service',
    date: new Date().toISOString().split('T')[0],
    asset_name: '',
    serial_no: '',
    fault_description: '',
    service_vendor: '',
    quotation_no: '',
    quotation_amount: 0,
    service_po_no: '',
    advance_payment: 0,
    status: 'Outward',
    return_date: '',
    remarks: ''
  });
  
  const [editingId, setEditingId] = useState(null);

  const dcStreams = ['Yarn Unit', 'Fabric Unit', 'General Service'];
  const statuses = ['Outward', 'Returned', 'Completed'];

  const fetchDCs = async () => {
    try {
      const res = await api.get('/stationary/returnable-dc/all');
      setDcs(res.data);
    } catch (err) {
      console.error('Error fetching DCs:', err);
    }
  };

  useEffect(() => {
    fetchDCs();
  }, [view]);

  const generateDCNumber = () => {
    const streamCode = formData.dc_stream.split(' ')[0].toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({
      ...prev,
      dc_no: `RDC-${streamCode}-${random}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dc_no) {
      alert('DC Number is required.');
      return;
    }
    
    // Convert empty return_date to null
    const payload = {
      ...formData,
      return_date: formData.return_date || null,
      quotation_amount: Number(formData.quotation_amount),
      advance_payment: Number(formData.advance_payment)
    };

    try {
      if (editingId) {
        await api.put(`/stationary/returnable-dc/${editingId}`, payload);
        alert('Returnable DC updated successfully.');
      } else {
        await api.post('/stationary/returnable-dc/create', payload);
        alert('Returnable DC created successfully.');
      }
      setView('list');
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save Returnable DC.');
    }
  };

  const handleEdit = (dc) => {
    setFormData({
      dc_no: dc.dc_no,
      dc_stream: dc.dc_stream,
      date: dc.date,
      asset_name: dc.asset_name,
      serial_no: dc.serial_no || '',
      fault_description: dc.fault_description || '',
      service_vendor: dc.service_vendor,
      quotation_no: dc.quotation_no || '',
      quotation_amount: dc.quotation_amount || 0,
      service_po_no: dc.service_po_no || '',
      advance_payment: dc.advance_payment || 0,
      status: dc.status,
      return_date: dc.return_date || '',
      remarks: dc.remarks || ''
    });
    setEditingId(dc.id);
    setView('form');
  };

  const handleMarkReturned = async (dc) => {
    if (!window.confirm(`Mark ${dc.dc_no} as Returned?`)) return;
    try {
      await api.put(`/stationary/returnable-dc/${dc.id}`, {
        ...dc,
        status: 'Returned',
        return_date: new Date().toISOString().split('T')[0]
      });
      fetchDCs();
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this DC record?')) return;
    try {
      await api.delete(`/stationary/returnable-dc/${id}`);
      fetchDCs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete DC record.');
    }
  };

  const filteredDcs = dcs.filter(item => {
    const matchesStream = activeStream === 'All' || item.dc_stream === activeStream;
    const matchesStatus = activeStatus === 'All' || item.status === activeStatus;
    const matchesSearch = 
      item.dc_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.service_vendor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStream && matchesStatus && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header section */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Returnable Delivery Challan (DC)</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 0' }}>Track equipment repairs, external services, and asset returns</p>
            </div>
            <button onClick={() => {
              setFormData({
                dc_no: '',
                dc_stream: 'General Service',
                date: new Date().toISOString().split('T')[0],
                asset_name: '',
                serial_no: '',
                fault_description: '',
                service_vendor: '',
                quotation_no: '',
                quotation_amount: 0,
                service_po_no: '',
                advance_payment: 0,
                status: 'Outward',
                return_date: '',
                remarks: ''
              });
              setEditingId(null);
              setView('form');
            }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}>
              <Plus size={18} /> Generate Returnable DC
            </button>
          </div>

          {/* Filtering and Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {/* Stream Tabs */}
              <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: '8px' }}>
                <button 
                  onClick={() => setActiveStream('All')}
                  style={{ border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeStream === 'All' ? 'white' : 'transparent', color: activeStream === 'All' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: activeStream === 'All' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                >
                  All Streams
                </button>
                {dcStreams.map(s => (
                  <button 
                    key={s}
                    onClick={() => setActiveStream(s)}
                    style={{ border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeStream === s ? 'white' : 'transparent', color: activeStream === s ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: activeStream === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <select 
                value={activeStatus} 
                onChange={(e) => setActiveStatus(e.target.value)} 
                className="form-control"
                style={{ width: '150px', borderRadius: '8px', border: '1px solid var(--border)' }}
              >
                <option value="All">All Statuses</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search DC no, asset, vendor..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 38, borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="card" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DC No</th>
                  <th>Date</th>
                  <th>Stream</th>
                  <th>Asset & Vendor</th>
                  <th>Quotation / PO</th>
                  <th>Advance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDcs.map(dc => (
                  <tr key={dc.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{dc.dc_no}</td>
                    <td>{dc.date}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: dc.dc_stream === 'Yarn Unit' ? '#fef3c7' : dc.dc_stream === 'Fabric Unit' ? '#dbeafe' : '#f1f5f9', color: dc.dc_stream === 'Yarn Unit' ? '#d97706' : dc.dc_stream === 'Fabric Unit' ? '#2563eb' : '#475569' }}>
                        {dc.dc_stream}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dc.asset_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vendor: {dc.service_vendor}</div>
                    </td>
                    <td>
                      {dc.quotation_no ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>₹{dc.quotation_amount} ({dc.quotation_no})</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PO: {dc.service_po_no || '-'}</div>
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{dc.advance_payment}</td>
                    <td>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        background: dc.status === 'Outward' ? '#fee2e2' : dc.status === 'Returned' ? '#dcfce7' : '#e2e8f0', 
                        color: dc.status === 'Outward' ? '#991b1b' : dc.status === 'Returned' ? '#166534' : '#475569' 
                      }}>
                        {dc.status}
                      </span>
                      {dc.return_date && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ret: {dc.return_date}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {dc.status === 'Outward' && (
                          <button onClick={() => handleMarkReturned(dc)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#166534', borderColor: '#bbf7d0' }}>
                            <CheckCircle size={14} /> Mark Returned
                          </button>
                        )}
                        <button onClick={() => handleEdit(dc)} className="btn btn-outline" style={{ padding: '6px 10px', minWidth: 0 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(dc.id)} className="btn btn-outline" style={{ padding: '6px 10px', minWidth: 0, color: '#dc2626', borderColor: '#fee2e2' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredDcs.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <FileText size={40} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600 }}>No Returnable DCs found</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Returnable DC' : 'Create Returnable DC'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save Returnable DC
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-row">
              <div>
                <label>DC Stream *</label>
                <select 
                  value={formData.dc_stream} 
                  onChange={(e) => setFormData({ ...formData, dc_stream: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                >
                  {dcStreams.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>DC Number *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. RDC-GEN-1002" 
                    value={formData.dc_no}
                    onChange={(e) => setFormData({ ...formData, dc_no: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px' }}
                  />
                  <button type="button" onClick={generateDCNumber} className="btn btn-outline" style={{ borderRadius: '8px', padding: '0 12px', fontWeight: 600 }}>
                    Auto-Gen
                  </button>
                </div>
              </div>

              <div>
                <label>Date *</label>
                <input 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Asset / Item Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Sewing Machine Motor, Dyeing Pump" 
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Serial Number / Model</label>
                <input 
                  type="text" 
                  placeholder="e.g. SN-998271" 
                  value={formData.serial_no}
                  onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Service Vendor *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Apex Electricals" 
                  value={formData.service_vendor}
                  onChange={(e) => setFormData({ ...formData, service_vendor: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            <div>
              <label>Technical Fault Description</label>
              <textarea 
                rows="3" 
                placeholder="Describe the fault or service requirements..."
                value={formData.fault_description}
                onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })}
                className="form-control"
                style={{ borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            <div className="form-row">
              <div>
                <label>Quotation Reference</label>
                <input 
                  type="text" 
                  placeholder="e.g. QT-882" 
                  value={formData.quotation_no}
                  onChange={(e) => setFormData({ ...formData, quotation_no: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Quotation Amount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.quotation_amount}
                  onChange={(e) => setFormData({ ...formData, quotation_amount: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Service PO No.</label>
                <input 
                  type="text" 
                  placeholder="e.g. SPO-2026-004" 
                  value={formData.service_po_no}
                  onChange={(e) => setFormData({ ...formData, service_po_no: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Advance Payment (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.advance_payment}
                  onChange={(e) => setFormData({ ...formData, advance_payment: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Return Date</label>
                <input 
                  type="date" 
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            <div>
              <label>Remarks / Notes</label>
              <textarea 
                rows="2" 
                placeholder="Additional comments or instructions..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="form-control"
                style={{ borderRadius: '8px', resize: 'vertical' }}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
