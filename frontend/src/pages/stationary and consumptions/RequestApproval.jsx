import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Check, CheckCircle, Clock, Download, Edit2, Eye, FileText, IndianRupee, MapPin, Phone, Trash2, User, X, XCircle, Search, Filter, Globe, Mail, ClipboardList } from 'lucide-react';

import { mockDb } from './mockDb';
import ExportButton from '../../components/ExportButton';

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function RequestApproval() {
  const [requests, setRequests] = useState([]);

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

  const [itemsList, setItemsList] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => {
    setRequests(mockDb.get('consumables_requests'));
    setItemsList(mockDb.get('consumables_items'));
  }, []);

  const handleApprove = (reqId) => {
    mockDb.update('consumables_requests', reqId, { status: 'Approved' });
    setRequests(mockDb.get('consumables_requests'));
    setSelectedReq(null);
    alert('Request approved successfully!');
  };

  const handleReject = (reqId) => {
    mockDb.update('consumables_requests', reqId, { status: 'Rejected' });
    setRequests(mockDb.get('consumables_requests'));
    setSelectedReq(null);
    alert('Request rejected.');
  };

  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req =>
    req.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Requests', value: requests.length, icon: <FileText size={24} />, color: '#6366f1' },
    { label: 'Pending Approval', value: requests.filter(r => r.status === 'Pending').length, icon: <Clock size={24} />, color: '#f59e0b' },
    { label: 'Approved', value: requests.filter(r => r.status === 'Approved').length, icon: <CheckCircle size={24} />, color: '#10b981' },
    { label: 'Rejected', value: requests.filter(r => r.status === 'Rejected').length, icon: <XCircle size={24} />, color: '#ef4444' }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {view === 'list' ? (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={24} color="var(--primary)" /> Department Request Approval
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Review and authorize department material request slips</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ExportButton
                data={filteredRequests}
                filename="Request_Approval_Report"
                pdfTitle="Department Request Approval"
                columns={[
                  { header: 'Request No', key: 'id' },
                  { header: 'Date', key: 'date' },
                  { header: 'Department', key: 'department' },
                  { header: 'Requested By', key: 'requestedBy' },
                  { header: 'Status', key: 'status' }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20, marginBottom: 24 }}>
            {stats.map(stat => (
              <div key={stat.label} className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
                <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="stat-details">
                  <h3>{stat.label}</h3>
                  <div className="value">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
            {/* Search Card */}
            <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" placeholder="Search requests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                  <Filter size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
                </div>
                <select className="form-control" style={{ width: 150, margin: 0 }}>
                  <option>All Statuses</option>
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
          </div>

          <div className="table-responsive" style={{ flex: 1 }}>
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Date</th>
                    <th>Department</th>
                    <th>Requested By</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedViewItem(req)}
                      style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === req.id ? 'var(--bg-secondary)' : 'transparent' }}
                    >
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{req.id}</td>
                      <td>{req.date}</td>
                      <td style={{ fontWeight: 600 }}>{req.department}</td>
                      <td>{req.requestedBy}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${req.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 8 }}>
                        {req.status === 'Pending' && (
                          <button onClick={() => handleApprove(req.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', border: 'none', color: 'white' }}>
                            <Check size={14} /> Approve
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedViewItem(req)} title="Preview"><Eye size={16} color="var(--primary)" /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No requests found in the queue.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          {selectedReq && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Review Request: {selectedReq.id}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Review requested quantities before authorizing.</p>
                </div>
                <span style={{
                  background: selectedReq.status === 'Approved' ? '#dcfce7' : selectedReq.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                  color: selectedReq.status === 'Approved' ? '#166534' : selectedReq.status === 'Pending' ? '#92400e' : '#991b1b',
                  padding: '6px 14px', borderRadius: '12px', fontSize: 13, fontWeight: 600
                }}>
                  {selectedReq.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Department</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedReq.department}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Requested By</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedReq.requestedBy}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Priority</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: selectedReq.priority === 'High' ? '#ef4444' : 'var(--text-primary)' }}>{selectedReq.priority}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Remarks</span>
                  <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>{selectedReq.remarks || '-'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Items Requested</h4>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Code</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Name</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Quantity Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReq.items.map((i, k) => {
                        const detail = itemsList.find(x => x.id === i.itemId);
                        return (
                          <tr key={k} style={{ borderBottom: k !== selectedReq.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{i.itemId}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{detail?.name || 'Item'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#6366f1', background: '#e0e7ff30' }}>{i.qty}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedReq.status === 'Pending' && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 'auto' }}>
                  <button onClick={() => { handleReject(selectedReq.id); setView('list'); }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', borderColor: '#fee2e2' }}>
                    <X size={16} /> Reject
                  </button>
                  <button onClick={() => { handleApprove(selectedReq.id); setView('list'); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981' }}>
                    <Check size={16} /> Approve Request
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Request Approval Preview</h3>
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
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>REQUEST APPROVAL</h2>
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
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br />Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5} /> 0424-1234567</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5} /> info@handloomerp.com</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5} /> www.handloomerp.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                    <FileText size={16} color="#1e3a8a" strokeWidth={2.5} /> GSTIN : 33ABCDE1234F1Z5
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
