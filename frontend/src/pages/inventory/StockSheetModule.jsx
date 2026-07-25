import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Filter, Download, ArrowLeft,
  Package, Boxes, AlertTriangle, XCircle, Box, Activity, DollarSign,
  PieChart, RefreshCw, Printer, FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { stockSheetAPI } from '../../services/api';

export default function StockSheetModule() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await stockSheetAPI.list();
      const data = res.data || [];
      setItems(data);
    } catch (err) {
      console.error("Error fetching stock sheet items:", err);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setView('detail');
    setActiveTab('info');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StockSheet");
    XLSX.writeFile(wb, "Stock_Sheet.xlsx");
    setShowExportMenu(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Stock Sheet Report', 14, 20);
    const tableData = items.map(i => [
      i.item_code, i.item_name, i.material_type, i.warehouse, 
      i.current_stock, i.unit, i.stock_value?.toFixed(2), i.status
    ]);
    autoTable(doc, {
      startY: 30,
      head: [['Code', 'Item', 'Type', 'Warehouse', 'Stock', 'Unit', 'Value', 'Status']],
      body: tableData
    });
    doc.save('Stock_Sheet.pdf');
    setShowExportMenu(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.item_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType ? i.material_type === filterType : true;
      const matchStatus = filterStatus ? i.status === filterStatus : true;
      return matchSearch && matchType && matchStatus;
    });
  }, [items, searchTerm, filterType, filterStatus]);

  const totalValue = items.reduce((acc, i) => acc + (i.stock_value || 0), 0);
  const lowStockCount = items.filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = items.filter(i => i.status === 'Out of Stock').length;

  const renderStatusBadge = (status) => {
    let badgeClass = 'badge-secondary';
    if (status === 'In Stock') { badgeClass = 'badge-success'; }
    else if (status === 'Low Stock') { badgeClass = 'badge-warning'; }
    else if (status === 'Out of Stock') { badgeClass = 'badge-error'; }
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  if (view === 'detail' && selectedItem) {
    const tbs = [
      { id: 'info', label: 'Item Info' },
      { id: 'summary', label: 'Stock Summary' },
      { id: 'movements', label: 'Movements' },
      { id: 'batches', label: 'Batch Details' },
      { id: 'valuation', label: 'Valuation' }
    ];
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setView('list')} style={{ marginRight: '16px', padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{selectedItem.item_code} - {selectedItem.item_name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Detailed stock sheet for the item.</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {renderStatusBadge(selectedItem.status)}
          </div>
        </div>

        <div className="card" style={{ padding: 0, marginBottom: 24, borderBottom: '1px solid var(--border)', display: 'flex' }}>
          {tbs.map(t => (
            <div 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              style={{ 
                padding: '16px 24px', cursor: 'pointer', fontWeight: 600,
                color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent'
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><label style={{ color: 'var(--text-muted)' }}>Item Code</label><p style={{ fontWeight: 600 }}>{selectedItem.item_code}</p></div>
              <div><label style={{ color: 'var(--text-muted)' }}>Item Name</label><p style={{ fontWeight: 600 }}>{selectedItem.item_name}</p></div>
              <div><label style={{ color: 'var(--text-muted)' }}>Category</label><p>{selectedItem.category}</p></div>
              <div><label style={{ color: 'var(--text-muted)' }}>Material Type</label><p>{selectedItem.material_type}</p></div>
              <div><label style={{ color: 'var(--text-muted)' }}>Warehouse</label><p>{selectedItem.warehouse}</p></div>
              <div><label style={{ color: 'var(--text-muted)' }}>Unit</label><p>{selectedItem.unit}</p></div>
            </div>
          )}
          {activeTab === 'summary' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
               <div><label style={{ color: 'var(--text-muted)' }}>Opening Stock</label><p>{selectedItem.opening_stock} {selectedItem.unit}</p></div>
               <div><label style={{ color: 'var(--text-muted)' }}>Stock In</label><p>{selectedItem.stock_in} {selectedItem.unit}</p></div>
               <div><label style={{ color: 'var(--text-muted)' }}>Stock Out</label><p>{selectedItem.stock_out} {selectedItem.unit}</p></div>
               <div><label style={{ color: 'var(--text-muted)' }}>Current Stock</label><p style={{ fontWeight: 600, fontSize: 18 }}>{selectedItem.current_stock} {selectedItem.unit}</p></div>
               <div><label style={{ color: 'var(--text-muted)' }}>Reserved Stock</label><p>{selectedItem.reserved_stock} {selectedItem.unit}</p></div>
               <div><label style={{ color: 'var(--text-muted)' }}>Available Stock</label><p style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedItem.available_stock} {selectedItem.unit}</p></div>
            </div>
          )}
          {activeTab === 'movements' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Ref No</th><th>Module</th><th>In</th><th>Out</th><th>Balance</th><th>User</th>
                </tr>
              </thead>
              <tbody>
                {(selectedItem.movements || []).map((m, i) => (
                  <tr key={i}>
                    <td>{m.date}</td><td>{m.type}</td><td>{m.ref_no}</td><td>{m.module}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{m.in || '-'}</td><td style={{ color: '#ef4444', fontWeight: 600 }}>{m.out || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{m.balance}</td><td>{m.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'batches' && (
            <table className="data-table">
              <thead><tr><th>Batch No</th><th>Mfg Date</th><th>Qty</th><th>Warehouse</th><th>Status</th></tr></thead>
              <tbody>
                {(selectedItem.batches || []).map((b, i) => (
                  <tr key={i}><td>{b.batch_no}</td><td>{b.mfg_date}</td><td>{b.qty}</td><td>{b.warehouse}</td><td>{b.status}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'valuation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><label style={{ color: 'var(--text-muted)' }}>Average Cost</label><p>₹ {selectedItem.valuation?.average_cost}</p></div>
              <div><label style={{ color: 'var(--text-muted)' }}>Last Purchase Rate</label><p>₹ {selectedItem.valuation?.last_purchase_rate}</p></div>
              <div><label style={{ color: 'var(--text-muted)' }}>Current Value</label><p style={{ fontWeight: 600, fontSize: 18, color: 'var(--primary)' }}>₹ {selectedItem.valuation?.current_value}</p></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={24} color="var(--primary)" /> Stock Sheet
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Comprehensive overview of all stock items, valuation, and statuses.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={fetchItems} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={16} /> Refresh
          </button>
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
                  onClick={exportPDF}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                >
                  <FileDown size={16} color="#ef4444" /> PDF Report
                </button>
                <button
                  onClick={exportExcel}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                >
                  <Download size={16} color="#10b981" /> Excel Sheet
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Items</h3>
            <div className="value">{items.length}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h3>Stock Value</h3>
            <div className="value">₹ {(totalValue / 1000).toFixed(1)}k</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Low Stock</h3>
            <div className="value">{lowStockCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Out of Stock</h3>
            <div className="value">{outOfStockCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Box size={24} />
          </div>
          <div className="stat-details">
            <h3>Warehouses</h3>
            <div className="value">{new Set(items.map(i=>i.warehouse)).size}</div>
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
            placeholder="Search by Code or Item Name..."
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

          <select className="form-control" style={{ width: 160, margin: 0 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Material Types</option>
            <option value="Yarn">Yarn</option>
            <option value="Fabric">Fabric</option>
            <option value="Chemical">Chemical</option>
            <option value="Accessory">Accessory</option>
          </select>
          <select className="form-control" style={{ width: 160, margin: 0 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
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
                <th>Type</th>
                <th>Warehouse</th>
                <th>Current Stock</th>
                <th>Stock Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{item.item_code}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{item.item_name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.material_type}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.warehouse}</td>
                  <td style={{ fontWeight: 600 }}>{item.current_stock} {item.unit}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹ {item.stock_value?.toFixed(2)}</td>
                  <td>{renderStatusBadge(item.status)}</td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <p>No stock items found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
