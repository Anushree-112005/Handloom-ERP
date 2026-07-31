import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Activity, AlertCircle, AlertTriangle, Briefcase, CheckCircle2, Download, Edit2, Eye, FileText, Filter, IndianRupee, Layers, MapPin, Phone, RefreshCw, Search, Trash2, User, X, Globe, Mail, ClipboardList } from 'lucide-react';

import { erpStockAPI } from '../../../services/api';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import ExportButton from '../../../components/ExportButton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

import { downloadElementAsPdf } from '../../../components/A4DocumentPreview';
import logoImg from '../../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function StockReport() {
  const [data, setData] = useState([]);

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

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

    doc.save(`Stock_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `Stock_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    switch (status) {
      case 'Available': return '#10b981';
      case 'Low Stock': return '#f59e0b';
      case 'Out of Stock': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={24} color="var(--primary)" /> Stock Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Complete inventory valuation and status monitoring.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton
            data={filteredData}
            filename="Stock_Report"
            pdfTitle="Complete Inventory Status Report"
            columns={[
              { header: 'Code', key: 'item_code' },
              { header: 'Item Name', key: 'item_name' },
              { header: 'Category', key: 'category' },
              { header: 'Available', key: 'available_stock' },
              { header: 'Value', key: 'stock_value' },
              { header: 'Min Stock', key: 'min_stock' },
              { header: 'Reorder Lvl', key: 'reorder_level' },
              { header: 'Status', key: 'stock_status' }
            ]}
          />
          <button className="btn btn-secondary" onClick={fetchReport} style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <FileText size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Value</h3>
            <div className="value">Rs. {totalValue.toLocaleString()}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-details">
            <h3>Available Items</h3>
            <div className="value">{availableItems}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Low Stock</h3>
            <div className="value">{lowStockItems}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Out of Stock</h3>
            <div className="value">{outOfStockItems}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '20px', border: 'none', boxShadow: 'none' }}>
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

        <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '20px', border: 'none', boxShadow: 'none' }}>
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

      <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
        {/* Search Card */}
        <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-control" placeholder="Code, Name, Category..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
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
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'none', overflow: 'hidden' }}>
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
                    <tr 
                      key={idx}
                      onClick={() => setSelectedViewItem(row)}
                      style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === row.item_code ? 'var(--bg-secondary)' : 'transparent' }}
                    >
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{row.item_code}</td>
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
                        <span className={`status-badge ${(row.stock_status || 'available').toLowerCase().replace(/ /g, '-')}`}>
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

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Stock Report Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>

                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>STOCK REPORT</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                <div style={{ padding: '10px 40px 40px 40px' }}>
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(10, 20).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Dinesh Exports</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@dineshexports.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.dineshexports.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                      <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

