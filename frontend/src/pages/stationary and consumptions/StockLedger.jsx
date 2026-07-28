import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Search, FileText, ArrowDownLeft, ArrowUpRight, Package } from 'lucide-react';

export default function StockLedger() {
  const [ledger, setLedger] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

  useEffect(() => {
    setItems(mockDb.get('consumables_items'));
    const list = mockDb.get('consumables_ledger');
    setLedger(list);
    if (items.length > 0) {
      setSelectedItem(items[0].id);
    }
  }, []);

  const filteredLedger = ledger.filter(x => selectedItem === '' || x.itemId === selectedItem);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card" style={{ border: 'none', boxShadow: 'none', boxShadow: 'none' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Stock Ledger</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Audit trail of stock inward receipts, department issues, and manual adjustments</p>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Transactions</h3>
            <div className="value">{filteredLedger.length}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <ArrowDownLeft size={24} />
          </div>
          <div className="stat-details">
            <h3>Receipts (Inward)</h3>
            <div className="value">{filteredLedger.filter(x => x.in > 0).length}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-details">
            <h3>Issues (Outward)</h3>
            <div className="value">{filteredLedger.filter(x => x.out > 0).length}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Tracked Items</h3>
            <div className="value">{items.length}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'none', boxShadow: 'none' }}>
        <div className="w-96 flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Select Item Ledger:</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="form-control"
          >
            <option value="">-- All Items --</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th >Transaction ID</th>
              <th >Date</th>
              <th >Reference Voucher</th>
              <th >Transaction Type</th>
              <th style={{ textAlign: "right" }}>In (Receipt)</th>
              <th style={{ textAlign: "right" }}>Out (Issue)</th>
              <th style={{ textAlign: "right" }}>Cumulative Stock Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredLedger.map(l => (
              <tr key={l.id} >
                <td className="px-6 py-4 font-mono text-xs">{l.id}</td>
                <td className="px-6 py-4 text-slate-600">{l.date}</td>
                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{l.refId}</td>
                <td className="px-6 py-4 text-slate-600">{l.refType}</td>
                <td className="px-6 py-4 text-right text-green-600 font-semibold">{l.inQty > 0 ? `+${l.inQty}` : '-'}</td>
                <td className="px-6 py-4 text-right text-rose-600 font-semibold">{l.outQty > 0 ? `-${l.outQty}` : '-'}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{l.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
