import React, { useState } from 'react';
import { Clock, Printer, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function DowntimeHistory() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    loom_id: 'All',
    category: 'All',
    status: 'All'
  });

  const data = Array.from({length: 8}).map((_, i) => ({
    id: `BD-00${i+1}`,
    date: '2026-06-13',
    loom_id: `LM-00${Math.floor(Math.random()*5)+1}`,
    order_id: 'ORD-2024-001',
    category: ['Mechanical', 'Electrical', 'Yarn', 'Power'][i % 4],
    reason: 'Issue details ' + i,
    start: '10:30 AM',
    end: '12:00 PM',
    downtime: 1.5 + (i * 0.5),
    lost_meters: 37.5 + (i * 10),
    loss_value: 1687 + (i * 500),
    status: i % 3 === 0 ? '🕐 Pending' : '✅ Resolved'
  }));

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Downtime History Report', 14, 15);
    autoTable(doc, {
      startY: 20,
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
          <table className="table" style={{ width: '100%', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr><th>ID</th><th>Date</th><th>Loom</th><th>Category</th><th>Reason</th><th>Start</th><th>End</th><th>Down (h)</th><th>Lost (m)</th><th>Loss (₹)</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.id}</td>
                  <td>{row.date}</td><td>{row.loom_id}</td><td>{row.category}</td><td>{row.reason}</td>
                  <td>{row.start}</td><td>{row.end}</td>
                  <td style={{ fontWeight: 700, color: '#b91c1c' }}>{row.downtime}</td>
                  <td>{row.lost_meters}</td><td style={{ color: '#b91c1c' }}>₹{row.loss_value.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{row.status}</td>
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
