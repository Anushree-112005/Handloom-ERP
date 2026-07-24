import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Clock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

// Import specific approval components
import BuyerOrderApprovalTable from '../../components/approvals/BuyerOrderApprovalTable';
import PIApprovalTable from '../../components/approvals/PIApprovalTable';
import VendorOrderApprovalTable from '../../components/approvals/VendorOrderApprovalTable';
import YarnIndentApprovalForm from '../../components/approvals/YarnIndentApprovalForm';

export default function ApprovalPage({ title, approvalType, requiredRole }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Still keeping the generic fetch logic for fallback tables
  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/approvals/pending');
      const filtered = response.data.filter(app => app.approval_type === approvalType);
      setApprovals(filtered);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch generic data if we are using the generic table
    if (!['Buyer Order', 'PI', 'Vendor Workorder', 'Internal Fabric Request'].includes(approvalType)) {
      fetchApprovals();
    }
  }, [approvalType]);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/approvals/${id}/action`, { action, comments: "" });
      alert(`Successfully ${action}d!`);
      fetchApprovals();
    } catch (error) {
      alert("Error processing action");
      console.error(error);
    }
  };

  // Render specific layout based on approval type
  if (approvalType === 'Buyer Order') {
    return <BuyerOrderApprovalTable />;
  }
  
  if (approvalType === 'PI') {
    return <PIApprovalTable />;
  }

  if (approvalType === 'Vendor Workorder') {
    return <VendorOrderApprovalTable />;
  }

  if (approvalType === 'Internal Fabric Request') {
    return <YarnIndentApprovalForm />;
  }

  // Fallback Generic Table for other approval types (e.g. GRA, Surplus DC)
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield style={{ color: '#e11d48' }} size={28} /> {title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>
            Review and authorize pending {title.toLowerCase()} requests.
          </p>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Approval Queue</h3>
        </div>

        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          {loading && !['Buyer Order', 'PI', 'Vendor Workorder', 'Internal Fabric Request'].includes(approvalType) ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Clock size={48} className="animate-spin" style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>Loading pending approvals...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Shield size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
              <p>No pending approvals in this category.</p>
            </div>
          ) : (
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Entity Type</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.entity_id}</td>
                    <td>{app.entity_type}</td>
                    <td>{app.requested_by?.name || `User ${app.requested_by_id}`}</td>
                    <td><span className="badge badge-warning">{app.status}</span></td>
                    <td style={{ width: 200 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleAction(app.id, 'Approve')} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#10b981', border: 'none', color: 'white' }}><Check size={14} /> Approve</button>
                        <button onClick={() => handleAction(app.id, 'Reject')} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12, color: '#e11d48', borderColor: '#fecdd3' }}><X size={14} /> Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
