import React, { useState, useEffect } from 'react';
import { AlertTriangle, PlusCircle } from 'lucide-react';

import { mockDb } from './mockDb';

export default function ReorderReport() {
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    const list = mockDb.get('consumables_items');
    // Filter items where stock is less than or equal to safety stock or min level
    const low = list.filter(i => (i.currentStock || 0) <= i.minStock);
    setLowStockItems(low);
  }, []);

  const handleQuickRequisition = () => {
    if (lowStockItems.length === 0) {
      alert('All items have healthy stock levels.');
      return;
    }
    const reqObj = {
      id: 'PRQ' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      requestedBy: 'System Auto-Trigger',
      status: 'Approved',
      items: lowStockItems.map(i => ({
        itemId: i.id,
        name: i.name,
        currentStock: i.currentStock || 0,
        minStock: i.minStock,
        qty: i.reorderQty || 50
      }))
    };
    const current = mockDb.get('consumables_requisitions') || [];
    current.push(reqObj);
    mockDb.set('consumables_requisitions', current);
    alert('Auto Reorder Requisition slip raised successfully!');
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card" style={{ border: 'none', boxShadow: 'none', padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" /> Low Stock & Reorder Alert Report
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>List of items with stock counts below or near threshold levels</p>
        </div>
        <button onClick={handleQuickRequisition} className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center gap-2 font-semibold text-sm">
          <PlusCircle size={16} /> Quick Reorder Requisition
        </button>
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
        <table className="data-table">
              <thead>
            <tr>
              <th >Item Code</th>
              <th >Item Name</th>
              <th >Category</th>
              <th style={{ textAlign: "right" }}>Min Stock Limit</th>
              <th style={{ textAlign: "right" }}>Available Stock</th>
              <th style={{ textAlign: "right" }}>Suggested Reorder Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {lowStockItems.map(i => (
              <tr key={i.id} >
                <td className="px-6 py-4 font-mono">{i.code || i.id}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{i.name}</td>
                <td className="px-6 py-4 text-slate-600">{i.category}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-700">{i.minStock}</td>
                <td className="btn btn-danger">{i.currentStock || 0}</td>
                <td className="px-6 py-4 text-right font-bold text-indigo-600">{i.reorderQty || 50}</td>
              </tr>
            ))}
            {lowStockItems.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-semibold">
                  All items are above the minimum stock threshold!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
