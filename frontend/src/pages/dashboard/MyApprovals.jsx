import React, { useState, useEffect } from 'react';
import { mockDb } from '../stationary and consumptions/mockDb';
import { Shield, Package, Users, Receipt, Truck, Check, X, Clock, AlertTriangle, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyApprovals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Stores');
  
  const [storesData, setStoresData] = useState({ reqs: [], pos: [], issues: [] });
  
  const loadData = () => {
    const reqs = mockDb.get('consumables_requests').filter(x => x.status === 'Pending');
    const pos = mockDb.get('consumables_pos').filter(x => x.status === 'Ordered');
    const issues = mockDb.get('consumables_issues').filter(x => x.status !== 'Approved');
    setStoresData({ reqs, pos, issues });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('mockdb-update', loadData);
    return () => window.removeEventListener('mockdb-update', loadData);
  }, []);

  const handleApprove = (type, id) => {
    if (type === 'req') mockDb.update('consumables_requests', id, { status: 'Approved' });
    if (type === 'po') mockDb.update('consumables_pos', id, { status: 'Approved' });
    if (type === 'issue') mockDb.update('consumables_issues', id, { status: 'Approved' });
  };

  const totalStores = storesData.reqs.length + storesData.pos.length + storesData.issues.length;

  const tabs = [
    { id: 'Stores', label: 'Stores & Purchase', icon: Package, count: totalStores },
    { id: 'HR', label: 'HR & Admin', icon: Users, count: 2 },
    { id: 'Finance', label: 'Finance', icon: Receipt, count: 1 },
    { id: 'Gate', label: 'Gate Security', icon: Truck, count: 0 },
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield style={{ color: '#e11d48' }} size={28} /> Centralized Approvals
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>
            Review and authorize pending requests across all departments from a single dashboard.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} className="card stat-card" style={{ cursor: 'pointer', border: activeTab === tab.id ? '2px solid var(--primary)' : '1px solid var(--border)', '--stat-color': tab.count > 0 ? 'var(--danger)' : 'var(--success)' }}>
            <div className="stat-icon" style={{ background: tab.count > 0 ? '#ffe4e6' : '#d1fae5', color: tab.count > 0 ? '#e11d48' : '#10b981' }}>
              <tab.icon size={24} />
            </div>
            <div className="stat-info">
              <h3 style={{ color: tab.count > 0 ? '#e11d48' : 'inherit' }}>{tab.count} Pending</h3>
              <p>{tab.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Action Center: {activeTab}</h3>
        </div>

        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          {activeTab === 'Stores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {totalStores === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <Shield size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>No pending approvals in Stores & Purchase.</p>
                </div>
              ) : (
                <>
                  {storesData.reqs.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#4f46e5' }}>
                        <FileText size={16} /> Material Requests ({storesData.reqs.length})
                      </h4>
                      <table className="data-table" style={{ width: '100%' }}>
                        <thead><tr><th>Req No</th><th>Dept</th><th>By</th><th>Action</th></tr></thead>
                        <tbody>
                          {storesData.reqs.map(req => (
                            <tr key={req.id}>
                              <td style={{ fontWeight: 600 }}>{req.id}</td>
                              <td>{req.department}</td>
                              <td>{req.requestedBy}</td>
                              <td style={{ width: 150 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => handleApprove('req', req.id)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#10b981', border: 'none', color: 'white' }}><Check size={14} /> Approve</button>
                                  <button onClick={() => navigate('/stores-consumables/approve-request')} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {storesData.pos.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#4f46e5' }}>
                        <Package size={16} /> Purchase Orders ({storesData.pos.length})
                      </h4>
                      <table className="data-table" style={{ width: '100%' }}>
                        <thead><tr><th>PO No</th><th>Vendor</th><th>Value</th><th>Action</th></tr></thead>
                        <tbody>
                          {storesData.pos.map(po => (
                            <tr key={po.id}>
                              <td style={{ fontWeight: 600 }}>{po.id}</td>
                              <td>{po.vendor}</td>
                              <td style={{ fontWeight: 700 }}>₹{po.items.reduce((s,i)=>s+i.total,0).toLocaleString()}</td>
                              <td style={{ width: 150 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => handleApprove('po', po.id)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#10b981', border: 'none', color: 'white' }}><Check size={14} /> Approve</button>
                                  <button onClick={() => navigate('/stores-consumables/approve-po')} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {storesData.issues.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#4f46e5' }}>
                        <AlertTriangle size={16} /> Issue Vouchers ({storesData.issues.length})
                      </h4>
                      <table className="data-table" style={{ width: '100%' }}>
                        <thead><tr><th>Issue No</th><th>Dept</th><th>To</th><th>Action</th></tr></thead>
                        <tbody>
                          {storesData.issues.map(iss => (
                            <tr key={iss.id}>
                              <td style={{ fontWeight: 600 }}>{iss.id}</td>
                              <td>{iss.department}</td>
                              <td>{iss.employee}</td>
                              <td style={{ width: 150 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => handleApprove('issue', iss.id)} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#10b981', border: 'none', color: 'white' }}><Check size={14} /> Approve</button>
                                  <button onClick={() => navigate('/stores-consumables/approve-issue')} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }}><Eye size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'HR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead><tr><th>Type</th><th>Employee</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  <tr>
                    <td><span className="badge" style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontSize: 12, fontWeight: 600 }}>Leave Request</span></td>
                    <td style={{ fontWeight: 600 }}>Ramesh Kumar</td>
                    <td>2026-06-25 to 2026-06-26</td>
                    <td style={{ width: 150 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#10b981', border: 'none', color: 'white' }}><Check size={14} /> Approve</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '12px', fontSize: 12, fontWeight: 600 }}>Expense Claim</span></td>
                    <td style={{ fontWeight: 600 }}>Karthik Raja</td>
                    <td>Travel - ₹4,500</td>
                    <td style={{ width: 150 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#10b981', border: 'none', color: 'white' }}><Check size={14} /> Approve</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Finance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead><tr><th>Voucher No</th><th>Type</th><th>Amount</th><th>Action</th></tr></thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', color: '#4f46e5' }}>VCH-8821</td>
                    <td>Payment (Apex Supplies)</td>
                    <td style={{ fontWeight: 700, color: '#e11d48' }}>₹45,000</td>
                    <td style={{ width: 150 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#10b981', border: 'none', color: 'white' }}><Check size={14} /> Approve</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'Gate' && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Truck size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>No pending gate passes or goods release approvals.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
