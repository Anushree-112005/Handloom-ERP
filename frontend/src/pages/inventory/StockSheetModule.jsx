import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Filter, Download, ArrowLeft,
  Package, Boxes, AlertTriangle, XCircle, Box, Activity, DollarSign,
  PieChart, RefreshCw, Printer
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
    let bg = '#f1f5f9', color = '#475569';
    if (status === 'In Stock') { bg = '#10b98120'; color = '#047857'; }
    else if (status === 'Low Stock') { bg = '#f9731620'; color = '#c2410c'; }
    else if (status === 'Out of Stock') { bg = '#ef444420'; color = '#b91c1c'; }
    return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: bg, color }}>{status}</span>;
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

      <div className="card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Stock Items ({filteredItems.length})</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="search-bar" style={{ position: 'relative', width: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" className="form-control" placeholder="Search by Code or Item Name..." 
                style={{ paddingLeft: 36, width: '100%' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="form-control" style={{ width: '160px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Material Types</option>
              <option value="Yarn">Yarn</option>
              <option value="Fabric">Fabric</option>
              <option value="Chemical">Chemical</option>
              <option value="Accessory">Accessory</option>
            </select>
            <select className="form-control" style={{ width: '160px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="table-responsive" style={{ flex: 1 }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>Item Code</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>Item Name</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>Type</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>Warehouse</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>Current Stock</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>Stock Value</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)} style={{ cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.item_code}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.item_name}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{item.material_type}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{item.warehouse}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{item.current_stock} {item.unit}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>₹ {item.stock_value?.toFixed(2)}</td>
                  <td style={{ padding: '16px' }}>{renderStatusBadge(item.status)}</td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No stock items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
