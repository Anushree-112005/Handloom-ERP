import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Check, X, Eye, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function IssueApproval() {
  const [issues, setIssues] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    setIssues(mockDb.get('consumables_issues'));
    setItemsList(mockDb.get('consumables_items'));
  }, []);

  const handleApprove = (issId) => {
    mockDb.update('consumables_issues', issId, { status: 'Approved' });
    setIssues(mockDb.get('consumables_issues'));
    setSelectedIssue(null);
    alert('Issue voucher approved successfully!');
  };

  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIssues = issues.filter(iss =>
    iss.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iss.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iss.employee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Issues', value: issues.length, icon: <FileText size={24} />, color: '#6366f1' },
    { label: 'Pending Approval', value: issues.filter(iss => iss.status !== 'Approved').length, icon: <Clock size={24} />, color: '#f59e0b' },
    { label: 'Approved', value: issues.filter(iss => iss.status === 'Approved').length, icon: <CheckCircle size={24} />, color: '#10b981' },
    { label: 'Rejected', value: issues.filter(iss => iss.status === 'Rejected').length, icon: <XCircle size={24} />, color: '#ef4444' }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {view === 'list' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check style={{ color: '#6366f1' }} /> Store Issue Voucher Approval
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Review and authorize store issue slips before stock release</p>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ '--stat-color': s.color }}>
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

          <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Approval Queue ({filteredIssues.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search issues..."
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
                  <th>Issue Voucher</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Issued To</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(iss => (
                  <tr key={iss.id}>
                    <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{iss.id}</td>
                    <td>{iss.date}</td>
                    <td style={{ fontWeight: 600 }}>{iss.department}</td>
                    <td>{iss.employee}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        background: iss.status === 'Approved' ? '#dcfce7' : '#fef3c7',
                        color: iss.status === 'Approved' ? '#166534' : '#92400e',
                        padding: '4px 10px', borderRadius: '12px', fontSize: 12, fontWeight: 600
                      }}>
                        {iss.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 8 }}>
                      {iss.status !== 'Approved' && (
                        <button onClick={() => handleApprove(iss.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', border: 'none', color: 'white' }}>
                          <Check size={14} /> Approve
                        </button>
                      )}
                      <button onClick={() => { setSelectedIssue(iss); setView('form'); }} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredIssues.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No issues found in the queue.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          {selectedIssue && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Review Store Issue: {selectedIssue.id}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Review quantities and purpose before releasing stock.</p>
                </div>
                <span style={{
                  background: selectedIssue.status === 'Approved' ? '#dcfce7' : '#fef3c7',
                  color: selectedIssue.status === 'Approved' ? '#166534' : '#92400e',
                  padding: '6px 14px', borderRadius: '12px', fontSize: 13, fontWeight: 600
                }}>
                  {selectedIssue.status || 'Pending'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Department</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedIssue.department}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Employee</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedIssue.employee}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Date</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedIssue.date}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Purpose</span>
                  <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>{selectedIssue.purpose || '-'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Items List</h4>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Code</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Name</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Quantity to Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIssue.items.map((i, k) => {
                        const detail = itemsList.find(x => x.id === i.itemId);
                        return (
                          <tr key={k} style={{ borderBottom: k !== selectedIssue.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
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

              {selectedIssue.status !== 'Approved' && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 'auto' }}>
                  <button onClick={() => { handleApprove(selectedIssue.id); setView('list'); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981' }}>
                    <Check size={16} /> Authorize Stock Release
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
