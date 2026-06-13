import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';

export default function AuditReport() {
  const [ledger, setLedger] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  useEffect(() => {
    setLedger(mockDb.get('consumables_ledger'));
    setItemsList(mockDb.get('consumables_items'));
  }, []);

  const auditEntries = ledger.filter(x => x.refType.includes('Adjustment') || x.refType.includes('Audit'));

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card">
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Inventory Audit & Discrepancy Report</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Details of manual adjustments, damage markdowns, and physical-to-system reconciliation audits</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
              <thead>
            <tr>
              <th >Audit ID</th>
              <th >Date</th>
              <th >Item Name</th>
              <th >Correction Type</th>
              <th >Reference Code</th>
              <th style={{ textAlign: "right" }}>Deviation Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {auditEntries.map(entry => {
              const itm = itemsList.find(x => x.id === entry.itemId);
              const isOut = entry.outQty > 0;
              return (
                <tr key={entry.id} >
                  <td className="px-6 py-4 font-mono text-xs">{entry.id}</td>
                  <td className="px-6 py-4 text-slate-600">{entry.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{itm?.name || 'Item'}</td>
                  <td className="px-6 py-4 text-slate-600">{entry.refType}</td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{entry.refId}</td>
                  <td className={`px-6 py-4 text-right font-bold ${isOut ? 'text-red-600' : 'text-green-600'}`}>
                    {isOut ? `-${entry.outQty}` : `+${entry.inQty}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
