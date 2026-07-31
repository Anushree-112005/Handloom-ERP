import React, { useState, useEffect } from 'react';
import api, { erpStockAPI } from '../../services/api';
import { Search, Filter, Download, Box, BarChart2, Package, IndianRupee, FileText } from 'lucide-react';

export default function StockSummary() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [categoryFilter]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      let items = [];
      try {
        const urlParams = categoryFilter ? { category: categoryFilter } : {};
        const resInv = await inventoryAPI.getStockSummary(urlParams);
        if (resInv.data && resInv.data.length > 0) {
          items = resInv.data.map(item => ({
            id: item.id,
            item_code: item.item_code || 'YRN-001',
            item_name: item.item_name || 'Yarn Item',
            godown_id: item.godown_id ? `Godown ${item.godown_id}` : 'MAIN',
            status: item.status || 'AVAILABLE',
            closing_qty: item.closing_qty || 0,
            closing_value: item.closing_value || 0,
            unit: item.unit || 'Kgs'
          }));
        }
      } catch (e) {
        console.warn('Inventory stock summary endpoint fallback', e);
      }

      if (items.length === 0) {
        const urlParams = categoryFilter ? `?category=${categoryFilter}` : '';
        const res = await erpStockAPI.getCurrentStock(urlParams);
        items = (res.data || []).map(item => ({
          id: item.id,
          item_code: item.item_id,
          item_name: item.item_id,
          godown_id: item.location_type || 'MAIN',
          status: item.status,
          closing_qty: item.quantity,
          closing_value: item.quantity * 300,
          unit: 'Kgs'
        }));
      }

      setSummary(items);
    } catch (error) {
      console.error('Failed to fetch stock summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = summary.filter(item => 
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredData.length;
  const totalValue = filteredData.reduce((acc, curr) => acc + (curr.closing_value || 0), 0);
  const availableItems = filteredData.filter(i => i.status === 'AVAILABLE').length;
  const otherItems = totalItems - availableItems;

  return (
    <div className="animate-fade">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={24} color="var(--primary)" /> Stock Summary
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Current stock balances and valuation across all locations.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Export
            </button>
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden' }}>
                <button
                  onClick={() => setShowExportMenu(false)}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                >
                  <FileText size={16} color="#ef4444" /> PDF Report
                </button>
                <button
                  onClick={() => setShowExportMenu(false)}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                >
                  <Download size={16} color="#10b981" /> Excel Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <BarChart2 size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Items</h3>
            <div className="value">{totalItems}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Stock Value</h3>
            <div className="value">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Available Items</h3>
            <div className="value">{availableItems}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <Filter size={24} />
          </div>
          <div className="stat-details">
            <h3>Other Status</h3>
            <div className="value">{otherItems}</div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Item Code or Name..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter Category:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="YARN">Yarn</option>
            <option value="GREIGE_FABRIC">Greige Fabric</option>
            <option value="FINISHED_FABRIC">Finished Fabric</option>
            <option value="SPARE">Spares</option>
            <option value="CONSUMABLE">Consumables</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Godown ID</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Closing Qty</th>
                <th>Unit</th>
                <th style={{ textAlign: 'right' }}>Closing Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading stock summary...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <Box size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <p>No records found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.item_code || '-'}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{item.item_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.godown_id || 'MAIN'}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'AVAILABLE' ? 'badge-success' : 
                        item.status === 'RESERVED' ? 'badge-warning' : 
                        'badge-secondary'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{(item.closing_qty || 0).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.unit || 'Kgs'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>₹{(item.closing_value || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
