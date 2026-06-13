import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Check, X, Eye } from 'lucide-react';

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

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card">
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Store Issue Voucher Approval</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Review and authorize store issue slips before stock release</p>
      </div>

      <div className="form-row">
        <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="data-table">
              <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Issue Voucher</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">Issued To</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody >
              {issues.map(iss => (
                <tr key={iss.id} >
                  <td style={{ fontFamily: "monospace" }}>{iss.id}</td>
                  <td >{iss.date}</td>
                  <td style={{ fontWeight: 600 }}>{iss.department}</td>
                  <td >{iss.employee}</td>
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => setSelectedIssue(iss)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-1 mx-auto">
                      <Eye size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          {selectedIssue ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="border-b pb-4">
                <h3 className="card-title">Review Store Issue</h3>
                <span className="text-xs font-mono text-indigo-600 font-bold">{selectedIssue.id}</span>
              </div>
              <div className="form-row">
                <div>
                  <span className="text-slate-500 block">Department</span>
                  <span className="font-semibold">{selectedIssue.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Employee</span>
                  <span className="font-semibold">{selectedIssue.employee}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date</span>
                  <span className="font-semibold">{selectedIssue.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Purpose</span>
                  <span className="font-semibold">{selectedIssue.purpose || '-'}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Items List</h4>
                <div className="space-y-2">
                  {selectedIssue.items.map((i, k) => {
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

              <div className="pt-4 border-t">
                <button onClick={() => handleApprove(selectedIssue.id)} className="form-control">
                  <Check size={16} /> Authorize Stock Release
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
              <Eye size={48} className="mb-2 stroke-1" />
              <p className="text-sm">Select an issue voucher from the table to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
