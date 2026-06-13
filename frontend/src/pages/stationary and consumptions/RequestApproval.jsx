import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Check, X, Eye } from 'lucide-react';

export default function RequestApproval() {
  const [requests, setRequests] = useState([]);
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

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card">
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Department Request Approval</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Review and authorize department material request slips</p>
      </div>

      <div className="form-row">
        <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="data-table">
              <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Request No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody >
              {requests.map(req => (
                <tr key={req.id} >
                  <td style={{ fontFamily: "monospace" }}>{req.id}</td>
                  <td >{req.date}</td>
                  <td style={{ fontWeight: 600 }}>{req.department}</td>
                  <td >{req.requestedBy}</td>
                  <td >
                    <span className={`badge ${(req.status === 'Approved' ? 'bg-green-100 text-green-800' : req.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}`}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => setSelectedReq(req)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1 mx-auto">
                      <Eye size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {selectedReq ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="border-b pb-4">
                <h3 className="card-title">Review Request</h3>
                <span className="text-xs font-mono text-indigo-600 font-bold">{selectedReq.id}</span>
              </div>
              <div className="form-row">
                <div>
                  <span className="text-slate-500 block">Department</span>
                  <span className="font-semibold">{selectedReq.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Requested By</span>
                  <span className="font-semibold">{selectedReq.requestedBy}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Priority</span>
                  <span className="font-semibold">{selectedReq.priority}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Remarks</span>
                  <span className="font-semibold">{selectedReq.remarks || '-'}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Items Requested</h4>
                <div className="space-y-2">
                  {selectedReq.items.map((i, k) => {
                    const detail = itemsList.find(x => x.id === i.itemId);
                    return (
                      <div key={k} className="flex justify-between text-xs bg-slate-50 p-2 rounded border">
                        <span>{detail?.name || 'Item'}</span>
                        <span className="font-bold">Qty: {i.qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedReq.status === 'Pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => handleReject(selectedReq.id)} className="btn btn-danger">
                    <X size={16} /> Reject
                  </button>
                  <button onClick={() => handleApprove(selectedReq.id)} className="btn btn-primary">
                    <Check size={16} /> Approve
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
              <Eye size={48} className="mb-2 stroke-1" />
              <p className="text-sm">Select a request from the table to review and approve</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
