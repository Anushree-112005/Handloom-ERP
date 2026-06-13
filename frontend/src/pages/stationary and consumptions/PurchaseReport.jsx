import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';

export default function PurchaseReport() {
  const [grns, setGrns] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  useEffect(() => {
    setGrns(mockDb.get('consumables_grns'));
    setItemsList(mockDb.get('consumables_items'));
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card">
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Purchase & Stock Inward Report</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Track vendor supply invoices, receipts, and purchase cost audits</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
              <thead>
            <tr>
              <th >GRN No</th>
              <th >Date</th>
              <th >Vendor</th>
              <th >PO ID</th>
              <th style={{ textAlign: "right" }}>Total Items</th>
              <th style={{ textAlign: "right" }}>Inward Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {grns.map(grn => {
              const inwardValue = grn.items.reduce((acc, i) => acc + (i.acceptedQty * i.rate), 0);
              return (
                <tr key={grn.id} >
                  <td className="px-6 py-4 font-mono">{grn.id}</td>
                  <td className="px-6 py-4 text-slate-600">{grn.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{grn.vendor}</td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{grn.poId || '-'}</td>
                  <td className="px-6 py-4 text-right font-bold">{grn.items.length}</td>
                  <td className="px-6 py-4 text-right font-extrabold text-slate-950">₹{inwardValue.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
