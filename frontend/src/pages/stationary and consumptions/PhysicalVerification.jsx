import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Save, Clipboard } from 'lucide-react';

export default function PhysicalVerification() {
  const [items, setItems] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [auditor, setAuditor] = useState('');
  const [actualQtys, setActualQtys] = useState({});

  useEffect(() => {
    const list = mockDb.get('consumables_items');
    setItems(list);
    setVerifications(mockDb.get('consumables_verifications') || []);
    
    // Initialize actual qtys map
    const initial = {};
    list.forEach(i => {
      initial[i.id] = i.currentStock || 0;
    });
    setActualQtys(initial);
  }, []);

  const handleQtyChange = (itemId, val) => {
    setActualQtys({
      ...actualQtys,
      [itemId]: Number(val)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const verId = 'VER' + Math.floor(Math.random() * 10000);
    const dateStr = new Date().toISOString().split('T')[0];

    const records = items.map(itm => {
      const system = itm.currentStock || 0;
      const actual = actualQtys[itm.id];
      const diff = actual - system;

      // If there's a difference, post to ledger to adjust
      if (diff !== 0) {
        const type = diff > 0 ? 'IN' : 'OUT';
        mockDb.postToLedger(itm.id, 'Physical Audit Adj', verId, Math.abs(diff), type);
      }

      return {
        itemId: itm.id,
        name: itm.name,
        systemQty: system,
        actualQty: actual,
        difference: diff
      };
    });

    const newVerificationObj = {
      id: verId,
      date: dateStr,
      auditor: auditor || 'Internal Auditor',
      items: records
    };

    const currentVerifications = mockDb.get('consumables_verifications') || [];
    currentVerifications.push(newVerificationObj);
    mockDb.set('consumables_verifications', currentVerifications);

    alert('Physical Stock verification completed! Discrepancies updated in stock ledger.');
    
    // Reload items stock
    setItems(mockDb.get('consumables_items'));
    setVerifications(currentVerifications);
    setAuditor('');
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Physical Stock Verification</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Audit stock count, match physical inventories, and auto-correct ledger differences</p>
        </div>
      </div>

      <div className="form-row">
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="card-title">Verification Process Sheet</h3>
            <div className="w-1/2">
              <input 
                type="text" required value={auditor} 
                onChange={(e) => setAuditor(e.target.value)} 
                placeholder="Auditor / Verifier Name *" 
                className="form-control" 
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <table className="form-control">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 border-r">Item Code</th>
                  <th className="px-4 py-2 border-r">Item Name</th>
                  <th className="px-4 py-2 border-r text-center w-28">System Qty</th>
                  <th className="px-4 py-2 border-r text-center w-32">Actual Qty</th>
                  <th className="px-4 py-2 text-center w-28">Difference</th>
                </tr>
              </thead>
              <tbody >
                {items.map(itm => {
                  const system = itm.currentStock || 0;
                  const actual = actualQtys[itm.id] !== undefined ? actualQtys[itm.id] : system;
                  const diff = actual - system;
                  return (
                    <tr key={itm.id} >
                      <td className="px-4 py-2 border-r font-mono">{itm.code || itm.id}</td>
                      <td className="px-4 py-2 border-r font-semibold">{itm.name}</td>
                      <td className="px-4 py-2 border-r text-center font-bold">{system}</td>
                      <td className="px-4 py-2 border-r text-center">
                        <input 
                          type="number" required min="0" value={actual} 
                          onChange={(e) => handleQtyChange(itm.id, e.target.value)} 
                          className="form-control" 
                        />
                      </td>
                      <td className={`px-4 py-2 text-center font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                        {diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Post Verification Audit
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-1">
            <Clipboard size={16} /> Audit History
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {verifications.map(v => (
              <div key={v.id} className="p-3 bg-slate-50 rounded border text-xs">
                <div className="card-header">
                  <span className="font-mono font-bold text-indigo-600">{v.id}</span>
                  <span className="text-slate-500">{v.date}</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Auditor: {v.auditor}</p>
                <div className="mt-2 space-y-1">
                  {v.items.filter(i => i.difference !== 0).map((i, k) => (
                    <div key={k} className="flex justify-between text-[10px]">
                      <span>{i.name}</span>
                      <span className={i.difference < 0 ? 'text-red-600' : 'text-green-600'}>{i.difference}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
