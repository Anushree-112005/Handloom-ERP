import React, { useState } from 'react';
import { TrendingUp, Printer, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function EfficiencyTrend() {
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    loom_id: 'All',
    period: 'Daily'
  });

  // Mock Trend Data
  const data = Array.from({length: 10}).map((_, i) => {
    const d = new Date(filters.fromDate);
    d.setDate(d.getDate() + i);
    const target = 425;
    const actual = Math.floor(Math.random() * 50 + 380);
    const eff = (actual / target) * 100;
    const prevEff = eff - (Math.random() * 5 - 2);
    const trend = eff - prevEff;

    return {
      date: d.toISOString().split('T')[0],
      loom_id: 'LM-001',
      target,
      actual,
      efficiency: eff,
      oee: eff * 0.9,
      downtime: (100 - eff) / 10,
      trend: trend
    };
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Efficiency Trend Report', 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Loom', 'Target', 'Actual', 'Eff %', 'OEE %', 'Downtime(h)']],
      body: data.map(d => [d.date, d.loom_id, d.target, d.actual, d.efficiency.toFixed(1), d.oee.toFixed(1), d.downtime.toFixed(1)]),
    });
    doc.save('Efficiency_Trend.pdf');
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({
      Date: d.date, Loom: d.loom_id, Target: d.target, Actual: d.actual,
      'Efficiency %': d.efficiency.toFixed(1), 'OEE %': d.oee.toFixed(1),
      'Downtime(h)': d.downtime.toFixed(1)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trend");
    XLSX.writeFile(wb, "Efficiency_Trend.xlsx");
  };

  const avgEff = data.reduce((s,d) => s + d.efficiency, 0) / data.length;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp style={{ color: 'var(--primary)' }} /> Efficiency Trend Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Analyze long-term efficiency and OEE performance</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Printer size={16} /> PDF</button>
          <button className="btn btn-primary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', borderColor: '#10b981' }}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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
              <option value="All">All Looms</option><option value="LM-001">LM-001</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Period</label>
            <select className="form-control" value={filters.period} onChange={e => setFilters({...filters, period: e.target.value})}>
              <option value="Daily">Daily</option><option value="Weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', fontSize: 13 }}>
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr><th>Date</th><th>Loom</th><th>Target</th><th>Actual</th><th>Eff %</th><th>OEE %</th><th>Down (h)</th><th>Trend</th></tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.date}</td><td>{row.loom_id}</td><td>{row.target}</td>
                  <td style={{ fontWeight: 600 }}>{row.actual}</td>
                  <td style={{ fontWeight: 700, color: row.efficiency < 90 ? '#b91c1c' : '#047857' }}>{row.efficiency.toFixed(1)}%</td>
                  <td>{row.oee.toFixed(1)}%</td><td>{row.downtime.toFixed(1)}</td>
                  <td style={{ color: row.trend > 0 ? '#047857' : '#b91c1c' }}>{row.trend > 0 ? '📈 +' : '📉 '}{row.trend.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ margin: 0, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Trend Analysis</h4>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Average Efficiency</div><div style={{ fontSize: 24, fontWeight: 700 }}>{avgEff.toFixed(1)}%</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Best Day</div><div style={{ fontSize: 16, fontWeight: 600, color: '#047857' }}>99.2% (10-Jun)</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Worst Day</div><div style={{ fontSize: 16, fontWeight: 600, color: '#b91c1c' }}>72.4% (08-Jun)</div></div>
          <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Trend</div><div style={{ fontSize: 16, fontWeight: 600, color: '#047857' }}>📈 Improving</div></div>
        </div>
      </div>
    </div>
  );
}
