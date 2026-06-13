import React, { useState } from 'react';
import { Calendar, Printer, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function DeliveryForecast() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString().split('T')[0],
    order_id: 'All',
    buyer_name: 'All',
    status: 'All'
  });

  const data = Array.from({length: 6}).map((_, i) => {
    const total = 25000 + (i * 5000);
    const produced = Math.floor(total * 0.6);
    const rem = total - produced;
    const comp = (produced / total) * 100;
    const currentRate = 415 + (i * 10);
    const reqRate = 426 + (i * 15);
    const gap = currentRate - reqRate;
    
    let status = '✅ On Track';
    let buffer = 18 - (i * 4);
    let risk = 20 + (i * 15);
    if (buffer < 0) { status = '❌ Delayed'; }
    else if (buffer < 5) { status = '⚠️ At Risk'; }

    return {
      order_id: `ORD-2024-00${i+1}`,
      buyer: i % 2 === 0 ? 'H&M Sweden' : 'Zara Spain',
      fabric: 'Cotton Poplin',
      total, produced, rem, comp,
      currentRate, reqRate, gap,
      plannedEnd: '2026-07-07',
      currentEta: '2026-06-22',
      buyerDelivery: '2026-07-10',
      buffer,
      risk,
      status
    };
  });

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Delivery Forecast Report', 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Order', 'Buyer', 'Total(m)', 'Rem(m)', 'Comp %', 'Rate Gap', 'ETA', 'Delivery', 'Buffer', 'Status']],
      body: data.map(d => [d.order_id, d.buyer, d.total, d.rem, d.comp.toFixed(1), d.gap, d.currentEta, d.buyerDelivery, d.buffer, d.status]),
    });
    doc.save('Delivery_Forecast.pdf');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Forecast");
    XLSX.writeFile(wb, "Delivery_Forecast.xlsx");
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ color: 'var(--primary)' }} /> Delivery Forecast Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Predictive analysis of order completion against buyer delivery dates</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Printer size={16} /> PDF</button>
          <button className="btn btn-primary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', borderColor: '#10b981' }}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <div className="form-group"><label style={{ fontSize: 12 }}>From Date</label><input type="date" className="form-control" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} /></div>
          <div className="form-group"><label style={{ fontSize: 12 }}>To Date</label><input type="date" className="form-control" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} /></div>
          <div className="form-group"><label style={{ fontSize: 12 }}>Order ID</label><select className="form-control" value={filters.order_id} onChange={e => setFilters({...filters, order_id: e.target.value})}><option value="All">All Orders</option></select></div>
          <div className="form-group"><label style={{ fontSize: 12 }}>Buyer</label><select className="form-control" value={filters.buyer_name} onChange={e => setFilters({...filters, buyer_name: e.target.value})}><option value="All">All Buyers</option></select></div>
          <div className="form-group"><label style={{ fontSize: 12 }}>Status</label><select className="form-control" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}><option value="All">All</option></select></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr><th>Order ID</th><th>Buyer</th><th>Total (m)</th><th>Rem (m)</th><th>Comp %</th><th>Rate Gap (m/d)</th><th>Current ETA</th><th>Buyer Delivery</th><th>Buffer Days</th><th>Risk Score</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.order_id}</td>
                  <td>{row.buyer}</td><td style={{ fontWeight: 600 }}>{row.total.toLocaleString()}</td>
                  <td style={{ color: '#b45309' }}>{row.rem.toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>{row.comp.toFixed(1)}%</td>
                  <td style={{ color: row.gap < 0 ? '#b91c1c' : '#047857', fontWeight: 600 }}>{row.gap}</td>
                  <td style={{ fontWeight: 600 }}>{row.currentEta}</td>
                  <td>{row.buyerDelivery}</td>
                  <td style={{ fontWeight: 700, color: row.buffer < 0 ? '#b91c1c' : (row.buffer < 5 ? '#b45309' : '#047857') }}>{row.buffer}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${row.risk}%`, height: '100%', background: row.risk > 70 ? '#b91c1c' : 'var(--primary)' }}></div></div>
                      <span style={{ width: 25, textAlign: 'right', fontSize: 11 }}>{row.risk}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
