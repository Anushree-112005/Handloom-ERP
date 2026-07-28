import React, { useState, useEffect } from 'react';
import { Search, Filter, Box, AlertTriangle, CheckCircle, Package, ArrowRightLeft, Truck, Download, FileText, BarChart2 } from 'lucide-react';
import { erpStockAPI } from '../../services/api';

export default function GenericStockTable({ title, category, locationType, isAlerts }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [category, locationType, isAlerts]);

  const fetchStock = async () => {
    setLoading(true);
    try {
      if (isAlerts) {
        const response = await erpStockAPI.getLowStockAlerts();
        setStock(response.data);
      } else {
        let query = '?';
        if (category) query += `category=${category}&`;
        if (locationType) query += `location_type=${locationType}&`;
        
        const response = await erpStockAPI.getCurrentStock(query);
        setStock(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'AVAILABLE': return <span className="badge badge-success"><CheckCircle size={12} style={{marginRight: 4}}/> Available</span>;
      case 'AT_JOB_WORK': return <span className="badge badge-warning"><ArrowRightLeft size={12} style={{marginRight: 4}}/> At Job Work</span>;
      case 'IN_TRANSIT': return <span className="badge badge-primary"><Truck size={12} style={{marginRight: 4}}/> In Transit</span>;
      case 'RESERVED': return <span className="badge" style={{background: '#e0e7ff', color: '#4338ca'}}><Package size={12} style={{marginRight: 4}}/> Reserved</span>;
      case 'HOLD': return <span className="badge badge-danger"><AlertTriangle size={12} style={{marginRight: 4}}/> Hold</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.item_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.batch_id && item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalItems = stock.length;
  const availableItems = stock.filter(i => i.status === 'AVAILABLE').length;
  const reservedItems = stock.filter(i => i.reserved_quantity > 0).length;
  const holdItems = stock.filter(i => i.status === 'HOLD').length;

  return (
    <div className="animate-fade">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={24} color="var(--primary)" /> {title}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage inventory and stock levels for {category || locationType || 'all categories'}.</p>
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
            <h3>Total Stock Items</h3>
            <div className="value">{totalItems}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Available</h3>
            <div className="value">{availableItems}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Reserved</h3>
            <div className="value">{reservedItems}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>On Hold / Alerts</h3>
            <div className="value">{isAlerts ? totalItems : holdItems}</div>
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
            placeholder="Search Items, Batches..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="AT_JOB_WORK">At Job Work</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="RESERVED">Reserved</option>
            <option value="HOLD">Hold</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Location / Stage</th>
                <th>Batch / Lot</th>
                <th style={{ textAlign: 'right' }}>Total Qty</th>
                <th style={{ textAlign: 'right' }}>Reserved Qty</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading stock data...</td>
                </tr>
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <Box size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <p>No stock found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStock.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.item_id}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.location_type || 'Main Godown'}</td>
                    <td>
                      {item.batch_id && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12, marginRight: 4, fontWeight: 500 }}>B: {item.batch_id}</span>}
                      {item.lot_id && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>L: {item.lot_id}</span>}
                      {!item.batch_id && !item.lot_id && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>N/A</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', color: item.reserved_quantity > 0 ? '#ea580c' : 'inherit', fontWeight: item.reserved_quantity > 0 ? 600 : 'normal' }}>{item.reserved_quantity}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }}>Change Status</button>
                    </td>
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
