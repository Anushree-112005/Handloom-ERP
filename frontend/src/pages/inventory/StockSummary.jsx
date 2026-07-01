import { useState, useMemo, useEffect } from 'react';
import { Layers, PieChart, Search, Download, Database, MapPin, IndianRupee, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';

export default function StockSummary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    // Fetch real stock data from backend API
    api.get('/inventory/stock-summary')
      .then(res => setStockData(res.data || []))
      .catch(() => setStockData([]));
  }, []);

  const categories = useMemo(() => {
    return ['All Categories', ...new Set(stockData.map(item => item.category))];
  }, [stockData]);

  const filteredStock = useMemo(() => {
    return stockData.filter(item => {
      const matchesSearch = (item.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.godown || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter, stockData]);

  const totals = useMemo(() => {
    const totalItems = filteredStock.length;
    const totalValuation = filteredStock.reduce((acc, item) => acc + (item.value || 0), 0);
    return { totalItems, totalValuation };
  }, [filteredStock]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStock);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Summary');
    XLSX.writeFile(wb, `Stock_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={24} color="var(--primary)" /> Enterprise Stock Summary
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Consolidated inventory status across raw materials, process stock, and finished goods.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}><Database size={24} /></div>
          <div className="stat-details">
            <h3>{totals.totalItems} Items</h3>
            <p style={{ color: 'var(--text-muted)' }}>Unique inventory SKUs</p>
          </div>
        </div>
        <div className="card stat-card" style={{ '--stat-color': 'var(--success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}><IndianRupee size={24} /></div>
          <div className="stat-details">
            <h3>₹{totals.totalValuation.toLocaleString()}</h3>
            <p style={{ color: 'var(--text-muted)' }}>Total Stock valuation</p>
          </div>
        </div>
        <div className="card stat-card" style={{ '--stat-color': 'var(--secondary)' }}>
          <div className="stat-icon" style={{ background: 'rgba(8, 145, 178, 0.1)', color: 'var(--secondary)' }}><ShieldCheck size={24} /></div>
          <div className="stat-details">
            <h3>Godowns</h3>
            <p style={{ color: 'var(--text-muted)' }}>Active storage facilities</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by SKU Name, Godown..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
        <select className="form-control" style={{ width: 220, margin: 0 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Grid Directory */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU ID</th>
              <th>Category</th>
              <th>SKU / Item Name</th>
              <th style={{ textAlign: 'right' }}>Stock Quantity</th>
              <th>Unit</th>
              <th style={{ textAlign: 'right' }}>Avg Valuation Rate</th>
              <th style={{ textAlign: 'right' }}>Total Value</th>
              <th>Godown Location</th>
              <th>Last Transaction</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700 }}>{item.id}</td>
                <td>
                  <span className="badge badge-active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {item.category}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.itemName}</td>
                <td style={{ textAlign: 'right', fontWeight: 650 }}>{(item.qty || 0).toLocaleString()}</td>
                <td>{item.unit}</td>
                <td style={{ textAlign: 'right' }}>₹{item.qty ? ((item.value || 0) / item.qty).toFixed(2) : '0.00'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(item.value || 0).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="var(--text-muted)" />
                    {item.godown}
                  </div>
                </td>
                <td>{item.lastUpdated}</td>
              </tr>
            ))}
            {filteredStock.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No stock records matching the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
