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

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card">
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Purchase Order Approval</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Approve Purchase Orders before dispatching them to vendors</p>
      </div>

      <div className="form-row">
        <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="data-table">
              <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Vendor</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500">PO Value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody >
              {pos.map(po => {
                const totalVal = po.items.reduce((acc, i) => acc + i.total, 0);
                return (
                  <tr key={po.id} >
                    <td style={{ fontFamily: "monospace" }}>{po.id}</td>
                    <td >{po.date}</td>
                    <td style={{ fontWeight: 600 }}>{po.vendor}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">₹{totalVal.toLocaleString()}</td>
                    <td >
                      <span className={`badge ${(po.status === 'Approved' || po.status === 'Completed' ? 'bg-green-100 text-green-800' : po.status === 'Ordered' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}`}>
                        {po.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => setSelectedPO(po)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1 mx-auto">
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          {selectedPO ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="border-b pb-4">
                <h3 className="card-title">Review PO</h3>
                <span className="text-xs font-mono text-indigo-600 font-bold">{selectedPO.id}</span>
              </div>
              <div className="form-row">
                <div>
                  <span className="text-slate-500 block">Vendor</span>
                  <span className="font-semibold">{selectedPO.vendor}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Terms</span>
                  <span className="font-semibold">{selectedPO.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Expected Delivery</span>
                  <span className="font-semibold">{selectedPO.expectedDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Items</span>
                  <span className="font-semibold">{selectedPO.items.length} items</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900">PO Items Grid</h4>
                <div className="space-y-2">
                  {selectedPO.items.map((i, k) => {
                    const detail = itemsList.find(x => x.id === i.itemId);
                    return (
                      <div key={k} className="flex justify-between text-xs bg-slate-50 p-2 rounded border">
                        <div>
                          <p className="font-semibold">{detail?.name || 'Item'}</p>
                          <span className="text-[10px] text-slate-500">Rate: ₹{i.rate} x Qty: {i.qty}</span>
                        </div>
                        <span className="font-bold text-slate-900">₹{i.total.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedPO.status === 'Ordered' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => handleReject(selectedPO.id)} className="btn btn-danger">
                    <X size={16} /> Reject
                  </button>
                  <button onClick={() => handleApprove(selectedPO.id)} className="btn btn-primary">
                    <Check size={16} /> Authorize PO
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
              <Eye size={48} className="mb-2 stroke-1" />
              <p className="text-sm">Select a PO from the table to review and approve</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
