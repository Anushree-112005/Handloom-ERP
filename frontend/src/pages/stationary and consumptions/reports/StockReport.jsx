import React, { useState, useEffect, useMemo } from 'react';
import { erpStockAPI } from '../../../services/api';
import { 
  Layers, Search, Download, RefreshCw, AlertTriangle, FileText, Activity, AlertCircle, CheckCircle2, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function StockReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await erpStockAPI.getCurrentStock('?category=consumables');
      
      const mapped = (res.data || []).map(item => ({
        item_code: item.item_id,
        item_name: item.item_id,
        category: 'Consumables',
        uom: 'Units',
        opening_stock: 0,
        purchased_qty: 0,
        issued_qty: 0,
        returned_qty: 0,
        closing_stock: item.quantity,
        available_stock: item.quantity,
        reserved_stock: item.reserved_quantity,
        min_stock: 10,
        max_stock: 100,
        stock_value: item.quantity * 50,
        stock_status: item.quantity > 10 ? 'Available' : (item.quantity > 0 ? 'Low Stock' : 'Out of Stock')
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Stock report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [categoryFilter, statusFilter]);

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Complete Inventory Status Report', 14, 15);
    doc.setFontSize(10);
    
    const headers = [['Code', 'Item Name', 'Category', 'Available', 'Value', 'Min Stock', 'Reorder Lvl', 'Status']];
    const body = data.map(row => [
      row.item_code,
      row.item_name,
      row.category,
      row.available_stock,
      row.stock_value,
      row.min_stock,
      row.reorder_level,
      row.stock_status
    ]);
    
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20
    });
    
    doc.save(`Stock_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `Stock_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filteredData = data.filter(item => 
    !searchTerm || 
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Summary Metrics
  const totalValue = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.stock_value) || 0), 0);
  const availableItems = filteredData.filter(d => d.stock_status === 'Available').length;
  const lowStockItems = filteredData.filter(d => d.stock_status === 'Low Stock').length;
  const outOfStockItems = filteredData.filter(d => d.stock_status === 'Out of Stock').length;
  
  const catMap = {};
  const catValueMap = {};

  filteredData.forEach(row => {
    const val = parseFloat(row.stock_value) || 0;
    const qty = parseFloat(row.available_stock) || 0;
    
    catMap[row.category] = (catMap[row.category] || 0) + qty;
    catValueMap[row.category] = (catValueMap[row.category] || 0) + val;
  });

  const catChartData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
  const catValueChartData = Object.entries(catValueMap).map(([name, value]) => ({ name, value }));

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return '#10b981';
      case 'Low Stock': return '#f59e0b';
      case 'Out of Stock': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Layers size={26} style={{ color: '#6366f1' }} />
            Stock Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>Complete inventory valuation and status monitoring.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Download size={16} style={{ color: '#15803d' }} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <FileText size={16} style={{ color: '#6366f1' }} /> Export PDF
          </button>
          <button className="btn btn-primary" onClick={fetchReport} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Total Inventory Value</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>Rs. {totalValue.toLocaleString()}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Available Items</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{availableItems}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Low Stock Items</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{lowStockItems}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Out of Stock Items</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{outOfStockItems}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Category-wise Inventory</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {catChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Inventory Value by Category</h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catValueChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Code, Name, Category..." 
            className="form-control"
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <input type="text" className="form-control" style={{ width: 130, margin: 0 }} placeholder="Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />
          
          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading report data...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 16px' }} />
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No records found matching criteria.</div>
        ) : (
          <>
            <div className="table-responsive" style={{ maxHeight: '600px', overflow: 'auto' }}>
              <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                  <tr>
                    <th>Code</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>UOM</th>
                    <th style={{ textAlign: 'right' }}>Opening</th>
                    <th style={{ textAlign: 'right' }}>Purchased</th>
                    <th style={{ textAlign: 'right' }}>Issued</th>
                    <th style={{ textAlign: 'right' }}>Returned</th>
                    <th style={{ textAlign: 'right' }}>Closing</th>
                    <th style={{ textAlign: 'right' }}>Available</th>
                    <th style={{ textAlign: 'right' }}>Reserved</th>
                    <th style={{ textAlign: 'right' }}>Min Lvl</th>
                    <th style={{ textAlign: 'right' }}>Max Lvl</th>
                    <th style={{ textAlign: 'right' }}>Stock Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: '#4338ca' }}>{row.item_code}</td>
                      <td>{row.item_name}</td>
                      <td>{row.category}</td>
                      <td>{row.uom}</td>
                      <td style={{ textAlign: 'right' }}>{row.opening_stock}</td>
                      <td style={{ textAlign: 'right', color: '#10b981' }}>{row.purchased_qty}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444' }}>{row.issued_qty}</td>
                      <td style={{ textAlign: 'right' }}>{row.returned_qty}</td>
                      <td style={{ textAlign: 'right' }}>{row.closing_stock}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.available_stock}</td>
                      <td style={{ textAlign: 'right', color: '#f59e0b' }}>{row.reserved_stock}</td>
                      <td style={{ textAlign: 'right' }}>{row.min_stock}</td>
                      <td style={{ textAlign: 'right' }}>{row.max_stock}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.stock_value ? `Rs.${row.stock_value}` : '-'}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                          background: `${getStatusColor(row.stock_status)}15`,
                          color: getStatusColor(row.stock_status)
                        }}>
                          {row.stock_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  className="btn-secondary" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px' }}
                >
                  Prev
                </button>
                <button 
                  className="btn-secondary" 
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
