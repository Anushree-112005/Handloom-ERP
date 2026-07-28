import React, { useState, useEffect } from 'react';
import { storesService } from '../../../services/storesService';
import {
  Printer, Search, Download, Filter, RefreshCw, FileText, Eye, AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function POPrintReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await storesService.getPOPrintReport({
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
        vendor: vendorFilter,
        status: statusFilter
      });
      setData(response || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch PO / DC Printing report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo, vendorFilter, statusFilter]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Purchase Order / DC Printing Report', 14, 15);
    doc.setFontSize(10);

    const headers = [['PO/DC Number', 'Type', 'Vendor', 'Date', 'Items', 'Total Qty', 'Total Amount', 'Status']];
    const body = data.map(row => [
      row.document_number,
      row.document_type,
      row.vendor_name,
      row.date,
      row.total_items,
      row.total_quantity,
      row.total_amount,
      row.status
    ]);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20
    });

    doc.save(`PO_DC_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `PO_DC_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredData = data.filter(item =>
    !searchTerm ||
    item.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Printer size={26} style={{ color: '#6366f1' }} />
            Purchase Order / DC Printing
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>Search and print Purchase Orders and Delivery Challans.</p>
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

      <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search PO/DC or Vendor..." 
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

          <select className="form-control" style={{ width: 130, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Cancelled">Cancelled</option>
          </select>
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
                    <th>PO/DC Number</th>
                    <th>Type</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Total Items</th>
                    <th style={{ textAlign: 'right' }}>Total Qty</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.document_number}</td>
                      <td>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                          background: row.document_type === 'PO' ? '#e0e7ff' : '#fce7f3',
                          color: row.document_type === 'PO' ? '#4338ca' : '#be185d'
                        }}>
                          {row.document_type}
                        </span>
                      </td>
                      <td>{row.vendor_name}</td>
                      <td>{row.date}</td>
                      <td style={{ textAlign: 'right' }}>{row.total_items}</td>
                      <td style={{ textAlign: 'right' }}>{row.total_quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.total_amount ? `Rs.${row.total_amount}` : '-'}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                          background: `${getStatusColor(row.status)}15`,
                          color: getStatusColor(row.status)
                        }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="icon-btn" title="View Details"><Eye size={16} /></button>
                          <button className="icon-btn" title="Print Document"><Printer size={16} /></button>
                        </div>
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
    </div >
  );
}
