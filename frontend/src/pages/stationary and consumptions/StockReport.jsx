import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StockReport() {
  const [items, setItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setItems(mockDb.get('consumables_items'));
    setCategories(mockDb.get('consumables_categories'));
  }, []);

  const filtered = items.filter(i => categoryFilter === '' || i.category === categoryFilter);

  const exportExcel = () => {
    const data = filtered.map(i => ({
      'Item Code': i.code || i.id,
      'Item Name': i.name,
      'Category': i.category,
      'UOM': i.uom,
      'Current Stock': i.currentStock || 0,
      'Rate': i.rate,
      'Total Valuation': (i.currentStock || 0) * i.rate
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
    XLSX.writeFile(workbook, 'Stock_Report.xlsx');
  };

  const totalValuation = filtered.reduce((acc, i) => acc + ((i.currentStock || 0) * i.rate), 0);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Current Stock Inventory Report</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Real-time inventory levels, reorder parameters and valuation metrics</p>
        </div>
        <button onClick={exportExcel} className="btn btn-success">
          <Download size={16} /> Export Excel
        </button>
      </div>

      <div className="card">
        <div className="w-64">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Filter by Category</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            className="form-control"
          >
            <option value="">-- All Categories --</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="ml-auto text-right bg-slate-50 p-2 rounded border px-4">
          <span className="text-xs text-slate-500 block">Total Inventory Valuation</span>
          <span className="text-lg font-extrabold text-indigo-700">₹{totalValuation.toLocaleString()}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
              <thead>
            <tr>
              <th >Item Code</th>
              <th >Item Name</th>
              <th >Category</th>
              <th >UOM</th>
              <th style={{ textAlign: "right" }}>Stock</th>
              <th style={{ textAlign: "right" }}>Rate</th>
              <th style={{ textAlign: "right" }}>Valuation</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filtered.map(i => (
              <tr key={i.id} >
                <td className="px-6 py-4 font-mono">{i.code || i.id}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{i.name}</td>
                <td className="px-6 py-4 text-slate-600">{i.category}</td>
                <td className="px-6 py-4 text-slate-600">{i.uom}</td>
                <td className={`px-6 py-4 text-right font-bold ${i.currentStock <= i.minStock ? 'text-amber-600 bg-amber-50' : 'text-slate-950'}`}>
                  {i.currentStock || 0}
                </td>
                <td className="px-6 py-4 text-right text-slate-600">₹{i.rate}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">₹{((i.currentStock || 0) * i.rate).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
