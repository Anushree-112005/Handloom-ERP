import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Filter, Download, ArrowLeft,
  Package, Boxes, AlertTriangle, XCircle, Box, Activity, DollarSign,
  PieChart, RefreshCw, Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_BASE = 'http://localhost:8000/api/v1';

export default function StockSheetModule() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/stock-sheet`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        if (data.length === 0) {
          seedMockData();
        }
      }
    } catch (err) {
      console.error("Error fetching stock sheet items:", err);
    }
  };

  const seedMockData = async () => {
    const mockData = [
      {
        item_code: 'YRN-001', item_name: 'Cotton Yarn 40s', category: 'Raw Material', material_type: 'Yarn',
        warehouse: 'Main Store', batch_no: 'B-2026-01', unit: 'Kg',
        opening_stock: 1200, stock_in: 500, stock_out: 800, current_stock: 900, reserved_stock: 200, available_stock: 700,
        reorder_level: 500, unit_cost: 285.00, stock_value: 256500.00, status: 'In Stock',
        stock_summary: { opening: 1200, purchased: 500, consumed: 800, closing: 900 },
        movements: [
          { date: '2026-07-10', type: 'Purchase', ref_no: 'PO-1025', module: 'Purchase', in: 500, out: 0, balance: 1700, user: 'Admin' },
          { date: '2026-07-11', type: 'Production', ref_no: 'PR-250', module: 'PPC', in: 0, out: 800, balance: 900, user: 'Admin' }
        ],
        batches: [{ batch_no: 'B-2026-01', mfg_date: '2026-07-01', qty: 900, warehouse: 'Main Store', status: 'Active' }],
        valuation: { average_cost: 285, standard_cost: 290, current_value: 256500, last_purchase_rate: 285 }
      },
      {
        item_code: 'FAB-005', item_name: 'Single Jersey Fabric', category: 'Finished Goods', material_type: 'Fabric',
        warehouse: 'Finished Goods WH', batch_no: 'LOT-55', unit: 'Mtr',
        opening_stock: 500, stock_in: 1000, stock_out: 1400, current_stock: 100, reserved_stock: 50, available_stock: 50,
        reorder_level: 300, unit_cost: 150.00, stock_value: 15000.00, status: 'Low Stock',
        stock_summary: { opening: 500, produced: 1000, dispatched: 1400, closing: 100 },
        movements: [], batches: [], valuation: { average_cost: 150, current_value: 15000 }
      },
      {
        item_code: 'CHM-012', item_name: 'Blue Reactive Dye', category: 'Consumables', material_type: 'Chemical',
        warehouse: 'Chemical Store', batch_no: 'DYE-89', unit: 'Kg',
        opening_stock: 50, stock_in: 0, stock_out: 50, current_stock: 0, reserved_stock: 0, available_stock: 0,
        reorder_level: 20, unit_cost: 420.00, stock_value: 0.00, status: 'Out of Stock',
        stock_summary: { opening: 50, closing: 0 }, movements: [], batches: [], valuation: { average_cost: 420, current_value: 0 }
      }
    ];
    for (const item of mockData) {
      await fetch(`${API_BASE}/stock-sheet/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item)
      });
    }
    fetchItems();
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
    let bg = '#e2e8f0', color = '#475569';
    if (status === 'In Stock') { bg = '#dcfce7'; color = '#166534'; }
    else if (status === 'Low Stock') { bg = '#fef08a'; color = '#854d0e'; }
    else if (status === 'Out of Stock') { bg = '#fee2e2'; color = '#991b1b'; }
    return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: bg, color }}>{status}</span>;
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
      <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <button className="btn" onClick={() => setView('list')} style={{ marginRight: '16px', padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0 }}>Stock Sheet: {selectedItem.item_code} - {selectedItem.item_name}</h2>
          <div style={{ marginLeft: 'auto' }}>
            {renderStatusBadge(selectedItem.status)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          {tbs.map(t => (
            <div 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              style={{ 
                padding: '12px 16px', cursor: 'pointer', fontWeight: 600,
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
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Ref No</th><th>Module</th><th>In</th><th>Out</th><th>Balance</th><th>User</th>
                </tr>
              </thead>
              <tbody>
                {(selectedItem.movements || []).map((m, i) => (
                  <tr key={i}>
                    <td>{m.date}</td><td>{m.type}</td><td>{m.ref_no}</td><td>{m.module}</td>
                    <td style={{ color: 'green' }}>{m.in || '-'}</td><td style={{ color: 'red' }}>{m.out || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{m.balance}</td><td>{m.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'batches' && (
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
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
              <div><label style={{ color: 'var(--text-muted)' }}>Current Value</label><p style={{ fontWeight: 600, fontSize: 18 }}>₹ {selectedItem.valuation?.current_value}</p></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
          <FileText size={28} style={{ marginRight: 12, color: 'var(--primary)' }}/> 
          Stock Sheet
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchItems}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={exportPDF}>
            <FileText size={16} /> Export PDF
          </button>
          <button className="btn btn-secondary" onClick={exportExcel}>
            <Download size={16} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0 }}>Total Items</h4><Package size={20} color="var(--primary)" />
          </div>
          <h2 style={{ margin: '12px 0 0 0' }}>{items.length}</h2>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid green' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0 }}>Stock Value</h4><DollarSign size={20} color="green" />
          </div>
          <h2 style={{ margin: '12px 0 0 0' }}>₹ {(totalValue / 1000).toFixed(1)}k</h2>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid orange' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0 }}>Low Stock</h4><AlertTriangle size={20} color="orange" />
          </div>
          <h2 style={{ margin: '12px 0 0 0' }}>{lowStockCount}</h2>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid red' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0 }}>Out of Stock</h4><XCircle size={20} color="red" />
          </div>
          <h2 style={{ margin: '12px 0 0 0' }}>{outOfStockCount}</h2>
        </div>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid purple' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ color: 'var(--text-muted)', margin: 0 }}>Warehouses</h4><Box size={20} color="purple" />
          </div>
          <h2 style={{ margin: '12px 0 0 0' }}>{new Set(items.map(i=>i.warehouse)).size}</h2>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" className="form-control" placeholder="Search by Code or Item Name..." 
              style={{ paddingLeft: 40, width: '100%' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: '200px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Material Types</option>
            <option value="Yarn">Yarn</option>
            <option value="Fabric">Fabric</option>
            <option value="Chemical">Chemical</option>
            <option value="Accessory">Accessory</option>
          </select>
          <select className="form-control" style={{ width: '200px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <table className="table" style={{ width: '100%', textAlign: 'left' }}>
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
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.item_code}</td>
                <td>{item.item_name}</td>
                <td>{item.material_type}</td>
                <td>{item.warehouse}</td>
                <td style={{ fontWeight: 600 }}>{item.current_stock} {item.unit}</td>
                <td>₹ {item.stock_value?.toFixed(2)}</td>
                <td>{renderStatusBadge(item.status)}</td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No stock items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
