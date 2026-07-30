import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Briefcase, Download, Edit2, Eye, FileText, Filter, IndianRupee, MapPin, Phone, Printer, RefreshCw, Search, Trash2, User, X, Globe, Mail, ClipboardList } from 'lucide-react';

import { storesService } from '../../../services/storesService';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ExportButton from '../../../components/ExportButton';

import { downloadElementAsPdf } from '../../../components/A4DocumentPreview';
import logoImg from '../../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function POPrintReport() {
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={24} color="var(--primary)" /> Purchase Order / DC Printing
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Search and print Purchase Orders and Delivery Challans.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton
            data={filteredData}
            filename="PO_DC_Report"
            pdfTitle="Purchase Order / DC Printing Report"
            columns={[
              { header: 'PO/DC Number', key: 'document_number' },
              { header: 'Type', key: 'document_type' },
              { header: 'Vendor', key: 'vendor_name' },
              { header: 'Date', key: 'date' },
              { header: 'Items', key: 'total_items' },
              { header: 'Total Qty', key: 'total_quantity' },
              { header: 'Total Amount', key: 'total_amount', render: (row) => row.total_amount ? `Rs.${row.total_amount}` : '-' },
              { header: 'Status', key: 'status' }
            ]}
          />
          <button className="btn btn-secondary" onClick={fetchReport} style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
        {/* Search Card */}
        <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-control" placeholder="Search PO/DC or Vendor..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <Filter size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
            </div>
            <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <input type="text" className="form-control" style={{ width: 130, margin: 0 }} placeholder="Vendor" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
              <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
              <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
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
            <div className="table-responsive">
              <div className="card" style={{ padding: 0, overflowX: "auto" }}>
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
                    <tr 
                      key={idx}
                      style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === row.document_number ? 'var(--bg-secondary)' : 'transparent' }}
                      onClick={() => setSelectedViewItem(row)}
                    >
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{row.document_number}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                          background: row.document_type === 'PO' ? '#e0e7ff' : '#fce7f3',
                          color: row.document_type === 'PO' ? '#4338ca' : '#be185d'
                        }}>
                          {row.document_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.vendor_name}</td>
                      <td>{row.date}</td>
                      <td style={{ textAlign: 'right' }}>{row.total_items}</td>
                      <td style={{ textAlign: 'right' }}>{row.total_quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.total_amount ? `Rs.${row.total_amount}` : '-'}</td>
                      <td>
                        <span className={`status-badge ${(row.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                          {row.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedViewItem(row)} title="Preview"><Eye size={16} color="var(--primary)" /></button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Print Document"><Printer size={16} color="var(--text-primary)" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
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
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>PO Print Preview</h3>
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
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>PO REPORT</h2>
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
    </div >
  );
}
