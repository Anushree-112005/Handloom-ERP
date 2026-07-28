import React, { useState, useEffect } from 'react';
import { storesService } from '../../../services/storesService';
import {
  Receipt, Search, Download, RefreshCw, AlertTriangle, Users, Package, DollarSign, FileText, Filter
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function PurchaseReceivedReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await storesService.getPurchaseReceivedReport({
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
        vendor: vendorFilter,
        category: categoryFilter
      });
      setData(response || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Purchase & Received report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo, vendorFilter, categoryFilter]);

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Purchase & Received Report', 14, 15);
    doc.setFontSize(10);

    const headers = [['Purchase No', 'Vendor', 'Item Code', 'Item Name', 'Category', 'Ordered Qty', 'Received Qty', 'Balance', 'Total Amount', 'Received Date']];
    const body = data.map(row => [
      row.purchase_number,
      row.vendor_name,
      row.item_code,
      row.item_name,
      row.category_name,
      row.ordered_qty,
      row.received_qty,
      row.balance_qty,
      row.total_amount,
      row.received_date
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20
    });

    doc.save(`Purchase_Received_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `Purchase_Received_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredData = data.filter(item =>
    !searchTerm ||
    item.purchase_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Summary Cards Calculations
  const uniquePOs = new Set(filteredData.map(d => d.purchase_number)).size;
  const uniqueVendors = new Set(filteredData.map(d => d.vendor_name)).size;
  const totalAmount = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
  const totalReceivedQty = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.received_qty) || 0), 0);

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Receipt size={26} style={{ color: '#6366f1' }} />
            Purchase & Received Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>Vendor-wise and item-wise purchase history.</p>
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

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <Receipt size={24} />
          </div>
          <div className="stat-info">
            <h3>{uniquePOs}</h3>
            <p>Total Purchase Orders</p>
          </div>
        </div>
        <div className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{uniqueVendors}</h3>
            <p>Total Vendors</p>
          </div>
        </div>
        <div className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Rs. {totalAmount.toLocaleString()}</h3>
            <p>Total Purchase Amount</p>
          </div>
        </div>
        <div className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
          <div className="stat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>{totalReceivedQty.toLocaleString()}</h3>
            <p>Total Received Quantity</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Purchase No, Item, Vendor..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          <input type="text" className="form-control" style={{ width: 130, margin: 0 }} placeholder="Vendor" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} />

          <input type="text" className="form-control" style={{ width: 130, margin: 0 }} placeholder="Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />
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
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Purchase No</th>
                    <th>Vendor</th>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Ordered Qty</th>
                    <th style={{ textAlign: 'right' }}>Received Qty</th>
                    <th style={{ textAlign: 'right' }}>Balance Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>GST</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Received Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.purchase_number}</td>
                      <td>{row.vendor_name}</td>
                      <td style={{ color: '#6366f1' }}>{row.item_code}</td>
                      <td>{row.item_name}</td>
                      <td>{row.category_name}</td>
                      <td style={{ textAlign: 'right' }}>{row.ordered_qty}</td>
                      <td style={{ textAlign: 'right' }}>{row.received_qty}</td>
                      <td style={{ textAlign: 'right', color: row.balance_qty > 0 ? '#ef4444' : 'inherit' }}>{row.balance_qty}</td>
                      <td style={{ textAlign: 'right' }}>{row.unit_price}</td>
                      <td style={{ textAlign: 'right' }}>{row.gst}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.total_amount ? `Rs.${row.total_amount}` : '-'}</td>
                      <td>{row.received_date}</td>
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
