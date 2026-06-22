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
    const matchesStream = activeStream === 'All' || item?.dc_stream === activeStream;
    const matchesStatus = activeStatus === 'All' || item?.status === activeStatus;
    const matchesSearch = 
      (item?.dc_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.service_vendor || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStream && matchesStatus && matchesSearch;
  });


  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {view === 'list' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw style={{ color: '#6366f1' }} /> Returnable Delivery Challan (DC)
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Track equipment repairs, external services, and asset returns</p>
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
            }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Generate Returnable DC
            </button>
          </div>

          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-icon purple">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>{dcs.length}</h3>
                <p>Total DCs Issued</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon amber">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>{dcs.filter(dc => dc.status === 'Outward').length}</h3>
                <p>Active Outward</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon emerald">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{dcs.filter(dc => dc.status === 'Returned').length}</h3>
                <p>Returned / Closed</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon cyan">
                <div style={{ fontSize: 20, fontWeight: '800' }}>₹</div>
              </div>
              <div className="stat-info">
                <h3>₹{dcs.reduce((sum, dc) => sum + (Number(dc.quotation_amount) || 0), 0).toLocaleString()}</h3>
                <p>Total Service Cost</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  <button 
                    onClick={() => setActiveStream('All')}
                    className={`btn ${activeStream === 'All' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: 13 }}
                  >
                    All Streams
                  </button>
                  {dcStreams.map(s => (
                    <button 
                      key={s}
                      onClick={() => setActiveStream(s)}
                      className={`btn ${activeStream === s ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: 13 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <select 
                  value={activeStatus} 
                  onChange={(e) => setActiveStatus(e.target.value)} 
                  className="form-control"
                  style={{ width: '150px' }}
                >
                  <option value="All">All Statuses</option>
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="search-bar" style={{ position: 'relative', width: 280 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search DC no, asset, vendor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: 36, fontSize: 13 }}
                />
              </div>
            </div>

            <div className="table-responsive" style={{ flex: 1 }}>
              <table className="data-table" style={{ width: '100%' }}>
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
                    <tr key={dc?.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{dc?.dc_no}</td>
                      <td>{dc?.date}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: '6px', background: dc?.dc_stream === 'Yarn Unit' ? '#fef3c7' : dc?.dc_stream === 'Fabric Unit' ? '#dbeafe' : '#f1f5f9', color: dc?.dc_stream === 'Yarn Unit' ? '#d97706' : dc?.dc_stream === 'Fabric Unit' ? '#2563eb' : '#475569' }}>
                          {dc?.dc_stream}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{dc?.asset_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vendor: {dc?.service_vendor}</div>
                      </td>
                      <td>
                        {dc?.quotation_no ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>₹{dc?.quotation_amount} ({dc?.quotation_no})</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PO: {dc?.service_po_no || '-'}</div>
                          </>
                        ) : '-'}
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{dc?.advance_payment || 0}</td>
                      <td>
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 700, 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          background: dc?.status === 'Outward' ? '#fee2e2' : dc?.status === 'Returned' ? '#dcfce7' : '#f8fafc', 
                          color: dc?.status === 'Outward' ? '#991b1b' : dc?.status === 'Returned' ? '#166534' : 'var(--text-primary)' 
                        }}>
                          {dc?.status}
                        </span>
                        {dc?.return_date && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ret: {dc?.return_date}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {dc?.status === 'Outward' && (
                            <button onClick={() => handleMarkReturned(dc)} className="btn btn-outline" style={{ padding: '6px', minWidth: 0, color: '#166534', borderColor: '#bbf7d0', borderRadius: '8px' }} title="Mark Returned">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(dc)} className="btn btn-outline" style={{ padding: '6px', minWidth: 0, borderRadius: '8px' }} title="Edit">
                            <FileText size={14} />
                          </button>
                          <button onClick={() => handleDelete(dc?.id)} className="btn btn-outline" style={{ padding: '6px', minWidth: 0, color: '#dc2626', borderColor: '#fee2e2', borderRadius: '8px' }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDcs.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <RefreshCw size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Returnable DCs found</h3>
                        <p style={{ margin: 0 }}>Generate a new DC to start tracking.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw style={{ color: '#6366f1' }} /> {editingId ? 'Edit Returnable DC' : 'Create Returnable DC'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Enter details for equipment repairs or external services</p>
            </div>
            <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Back to List
            </button>
          </div>

          <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label>DC Stream <span style={{ color: '#ef4444' }}>*</span></label>
                  <select 
                    value={formData.dc_stream} 
                    onChange={(e) => setFormData({ ...formData, dc_stream: e.target.value })}
                    className="form-control"
                  >
                    {dcStreams.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>DC Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. RDC-GEN-1002" 
                      value={formData.dc_no}
                      onChange={(e) => setFormData({ ...formData, dc_no: e.target.value })}
                      className="form-control"
                    />
                    <button type="button" onClick={generateDCNumber} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
                      Auto-Gen
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="date" 
                    required 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Asset / Item Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Sewing Machine Motor, Dyeing Pump" 
                      value={formData.asset_name}
                      onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Serial Number / Model</label>
                    <input 
                      type="text" 
                      placeholder="e.g. SN-998271" 
                      value={formData.serial_no}
                      onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Service Vendor <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Apex Electricals" 
                      value={formData.service_vendor}
                      onChange={(e) => setFormData({ ...formData, service_vendor: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Technical Fault Description</label>
                <textarea 
                  rows="3" 
                  placeholder="Describe the fault or service requirements..."
                  value={formData.fault_description}
                  onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })}
                  className="form-control"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label>Quotation Reference</label>
                  <input 
                    type="text" 
                    placeholder="e.g. QT-882" 
                    value={formData.quotation_no}
                    onChange={(e) => setFormData({ ...formData, quotation_no: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Quotation Amount (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.quotation_amount}
                    onChange={(e) => setFormData({ ...formData, quotation_amount: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Service PO No.</label>
                  <input 
                    type="text" 
                    placeholder="e.g. SPO-00004" 
                    value={formData.service_po_no}
                    onChange={(e) => setFormData({ ...formData, service_po_no: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Advance Payment (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.advance_payment}
                    onChange={(e) => setFormData({ ...formData, advance_payment: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Return Date</label>
                  <input 
                    type="date" 
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Remarks / Notes</label>
                <textarea 
                  rows="2" 
                  placeholder="Additional comments or instructions..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="form-control"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Returnable DC
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
