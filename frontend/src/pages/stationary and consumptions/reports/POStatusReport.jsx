import React, { useState, useEffect } from 'react';
import { storesService } from '../../../services/storesService';
import { 
  FileText, Search, Download, RefreshCw, AlertTriangle, Filter 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function POStatusReport() {
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
      const response = await storesService.getPOStatusReport({
        search: searchTerm,
        date_from: dateFrom,
        date_to: dateTo,
        vendor: vendorFilter,
        status: statusFilter
      });
      setData(response || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch PO Status report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo, vendorFilter, statusFilter]);

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Purchase Order & Request Status Report', 14, 15);
    doc.setFontSize(10);
    
    const headers = [['Request No', 'PO No', 'Vendor', 'Req Date', 'Ordered', 'Received', 'Pending', 'Status']];
    const body = data.map(row => [
      row.request_number,
      row.po_number || '-',
      row.vendor_name || '-',
      row.request_date,
      row.ordered_qty,
      row.received_qty,
      row.pending_qty,
      row.current_status
    ]);
    
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 20
    });
    
    doc.save(`PO_Status_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `PO_Status_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filteredData = data.filter(item => 
    !searchTerm || 
    item.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'approved': return '#3b82f6';
      case 'ordered': return '#8b5cf6';
      case 'partially received': return '#f59e0b';
      case 'pending': return '#6b7280';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FileText size={26} style={{ color: '#6366f1' }} />
            Purchase Order & Request Status
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>Track the complete procurement lifecycle from request to completion.</p>
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

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Req No, PO No, Vendor..." 
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
            <option value="Ordered">Ordered</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Request Date</th>
                    <th>Approval Status</th>
                    <th>PO Number</th>
                    <th>Vendor</th>
                    <th style={{ textAlign: 'right' }}>Ordered Qty</th>
                    <th style={{ textAlign: 'right' }}>Received Qty</th>
                    <th style={{ textAlign: 'right' }}>Pending Qty</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.request_number}</td>
                      <td>{row.request_date}</td>
                      <td>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                          background: row.approval_status === 'Approved' ? '#dcfce7' : '#fef3c7',
                          color: row.approval_status === 'Approved' ? '#166534' : '#92400e'
                        }}>
                          {row.approval_status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, color: '#4338ca' }}>{row.po_number || '-'}</td>
                      <td>{row.vendor_name || '-'}</td>
                      <td style={{ textAlign: 'right' }}>{row.ordered_qty}</td>
                      <td style={{ textAlign: 'right' }}>{row.received_qty}</td>
                      <td style={{ textAlign: 'right', color: row.pending_qty > 0 ? '#ef4444' : 'inherit' }}>{row.pending_qty}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                          background: `${getStatusColor(row.current_status)}15`,
                          color: getStatusColor(row.current_status)
                        }}>
                          {row.current_status}
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
