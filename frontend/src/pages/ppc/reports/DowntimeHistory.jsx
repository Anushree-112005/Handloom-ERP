import React, { useState, useEffect } from 'react';
import { Clock, Printer, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { subMasterAPI } from '../../../services/api';

export default function DowntimeHistory() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    loom_id: 'All',
    category: 'All',
    status: 'All'
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await subMasterAPI.list('ppc_breakdown_entry').catch(() => ({ data: [] }));
      const records = res.data || [];
      
      const parsedData = records.map(r => {
        const catStat = (r.extra_field_1 || 'Unknown - Unknown').split(' - ');
        const dt = parseFloat(r.extra_field_2) || 0;
        return {
          id: r.name || `BD-${r.id}`,
          date: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          loom_id: r.code || 'Unknown',
          category: catStat[0] || 'Mechanical',
          reason: r.description || 'No details provided',
          start: '--', // Not stored in legacy system
          end: '--',
          downtime: dt,
          lost_meters: dt * 25, // approx 25m/hr
          loss_value: dt * 25 * 45, // approx 45Rs/m
          status: (catStat[1] || '').includes('Open') ? '🕐 Pending' : '✅ Resolved'
        };
      });
      
      setData(parsedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39);
    doc.text('DINESH TEXTILES', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('123 Industrial Estate, Tiruppur, Tamil Nadu 641604', 14, 30);
    doc.text('Phone: +91 98765 43210 | Email: info@dineshtextiles.com', 14, 36);
    
    // Horizontal Line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 42, doc.internal.pageSize.width - 14, 42);
    
    // Report Info
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text('Downtime History Report', 14, 54);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Period: ${filters.fromDate} to ${filters.toDate}`, 14, 62);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, 62, { align: 'right' });
    
    autoTable(doc, {
      startY: 68,
      head: [['ID', 'Date', 'Loom', 'Category', 'Reason', 'Down(hr)', 'Lost(m)', 'Loss(₹)', 'Status']],
      body: data.map(d => [d.id, d.date, d.loom_id, d.category, d.reason, d.downtime, d.lost_meters, d.loss_value, d.status]),
    });
    doc.save('Downtime_History.pdf');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Downtime");
    XLSX.writeFile(wb, "Downtime_History.xlsx");
  };

  const totalHrs = data.reduce((s,d) => s + d.downtime, 0);
  const totalLoss = data.reduce((s,d) => s + d.loss_value, 0);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ color: 'var(--primary)' }} /> Downtime History Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Comprehensive log of breakdowns and associated production losses</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Printer size={16} /> PDF</button>
          <button className="btn btn-primary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', borderColor: '#10b981' }}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>From Date</label>
            <input type="date" className="form-control" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>To Date</label>
            <input type="date" className="form-control" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Loom ID</label>
            <select className="form-control" value={filters.loom_id} onChange={e => setFilters({...filters, loom_id: e.target.value})}>
              <option value="All">All Looms</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Category</label>
            <select className="form-control" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="All">All Categories</option><option value="Mechanical">Mechanical</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Status</label>
            <select className="form-control" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="All">All</option><option value="Resolved">Resolved</option><option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: 13, whiteSpace: 'nowrap', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Loom</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Reason</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Start</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>End</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Down (h)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Lost (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Loss (₹)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading history...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No downtime recorded.</td></tr>
              ) : data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--primary)' }}>{row.id}</td>
                  <td style={{ padding: '16px' }}>{row.date}</td>
                  <td style={{ padding: '16px' }}>{row.loom_id}</td>
                  <td style={{ padding: '16px' }}>{row.category}</td>
                  <td style={{ padding: '16px' }}>{row.reason}</td>
                  <td style={{ padding: '16px' }}>{row.start}</td>
                  <td style={{ padding: '16px' }}>{row.end}</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#b91c1c' }}>{row.downtime.toFixed(2)}</td>
                  <td style={{ padding: '16px' }}>{row.lost_meters.toFixed(0)}</td>
                  <td style={{ padding: '16px', color: '#b91c1c' }}>₹{row.loss_value.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Breakdowns</div><div style={{ fontWeight: 700, fontSize: 16 }}>{data.length}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Downtime</div><div style={{ fontWeight: 700, fontSize: 16, color: '#b91c1c' }}>{totalHrs} hrs</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Financial Loss</div><div style={{ fontWeight: 700, fontSize: 16, color: '#b91c1c' }}>₹{totalLoss.toLocaleString()}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Most Affected</div><div style={{ fontWeight: 700, fontSize: 16 }}>LM-003</div></div>
        </div>
      </div>
    </div>
  );
}
