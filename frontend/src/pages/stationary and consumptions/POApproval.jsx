import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Check, X, Eye } from 'lucide-react';

export default function POApproval() {
  const [pos, setPOs] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);

  useEffect(() => {
    setPOs(mockDb.get('consumables_pos'));
    setItemsList(mockDb.get('consumables_items'));
  }, []);

  const handleApprove = (poId) => {
    mockDb.update('consumables_pos', poId, { status: 'Approved' });
    setPOs(mockDb.get('consumables_pos'));
    setSelectedPO(null);
    alert('Purchase Order approved successfully!');
  };

  const handleReject = (poId) => {
    mockDb.update('consumables_pos', poId, { status: 'Rejected' });
    setPOs(mockDb.get('consumables_pos'));
    setSelectedPO(null);
    alert('Purchase Order rejected.');
  };

  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPOs = pos.filter(po => 
    po.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check style={{ color: '#6366f1' }} /> Purchase Order Approval
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Approve Purchase Orders before dispatching them to vendors</p>
        </div>
        {view === 'form' && (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Approval Queue ({filteredPOs.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search POs..."
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
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th style={{ textAlign: 'right' }}>PO Value</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.map(po => {
                  const totalVal = po.items.reduce((acc, i) => acc + i.total, 0);
                  return (
                    <tr key={po.id}>
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{po.id}</td>
                      <td>{po.date}</td>
                      <td style={{ fontWeight: 600 }}>{po.vendor}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{totalVal.toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          background: (po.status === 'Approved' || po.status === 'Completed') ? '#dcfce7' : po.status === 'Ordered' ? '#dbeafe' : '#fef3c7', 
                          color: (po.status === 'Approved' || po.status === 'Completed') ? '#166534' : po.status === 'Ordered' ? '#1e40af' : '#92400e', 
                          padding: '4px 10px', borderRadius: '12px', fontSize: 12, fontWeight: 600 
                        }}>
                          {po.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 8 }}>
                        {po.status === 'Ordered' && (
                          <button onClick={() => handleApprove(po.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', border: 'none', color: 'white' }}>
                            <Check size={14} /> Approve
                          </button>
                        )}
                        <button onClick={() => { setSelectedPO(po); setView('form'); }} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Eye size={14} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredPOs.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No POs found in the queue.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          {selectedPO && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Review Purchase Order: {selectedPO.id}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Review vendor details and line items before authorizing.</p>
                </div>
                <span style={{ 
                  background: (selectedPO.status === 'Approved' || selectedPO.status === 'Completed') ? '#dcfce7' : selectedPO.status === 'Ordered' ? '#dbeafe' : '#fef3c7', 
                  color: (selectedPO.status === 'Approved' || selectedPO.status === 'Completed') ? '#166534' : selectedPO.status === 'Ordered' ? '#1e40af' : '#92400e', 
                  padding: '6px 14px', borderRadius: '12px', fontSize: 13, fontWeight: 600 
                }}>
                  {selectedPO.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Vendor</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedPO.vendor}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Payment Terms</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedPO.paymentTerms}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Expected Delivery</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedPO.expectedDate || '-'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 13, marginBottom: 4 }}>Total Items</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#6366f1' }}>{selectedPO.items.length} items</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>PO Items Grid</h4>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Code</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Item Name</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Rate</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Quantity</th>
                        <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.items.map((i, k) => {
                        const detail = itemsList.find(x => x.id === i.itemId);
                        return (
                          <tr key={k} style={{ borderBottom: k !== selectedPO.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{i.itemId}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{detail?.name || 'Item'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>₹{i.rate}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#6366f1', background: '#e0e7ff30' }}>{i.qty}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{i.total.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: '2px solid var(--border)', background: '#f8fafc' }}>
                        <td colSpan="4" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>Grand Total:</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#6366f1' }}>
                          ₹{selectedPO.items.reduce((acc, i) => acc + i.total, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedPO.status === 'Ordered' && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 'auto' }}>
                  <button onClick={() => { handleReject(selectedPO.id); setView('list'); }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', borderColor: '#fee2e2' }}>
                    <X size={16} /> Reject
                  </button>
                  <button onClick={() => { handleApprove(selectedPO.id); setView('list'); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981' }}>
                    <Check size={16} /> Authorize PO
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
