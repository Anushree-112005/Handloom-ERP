import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Filter, Printer } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LoomWiseProduction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    loom_id: 'All',
    shift: 'Both',
    order_id: 'All'
  });

  const [looms, setLooms] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loomRes, logsRes] = await Promise.all([
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        ppcAPI.getDailyEntries().catch(() => ({ data: [] }))
      ]);
      const activeLooms = loomRes.data || [];
      setLooms(activeLooms);
      
      const logs = logsRes.data || [];
      
      const realReportData = activeLooms.map((l, i) => {
        const loomLogs = logs.filter(log => String(log.loom_id) === String(l.id));
        const total = loomLogs.reduce((sum, log) => sum + (log.meters_produced || 0), 0);
        const downtime = loomLogs.reduce((sum, log) => sum + (log.downtime_minutes || 0), 0) / 60;
        
        // Target: capacity * (efficiency / 100)
        const target = l.capacity_per_day * (l.efficiency_pct / 100) || 425;
        const variance = total - target;
        const eff = target > 0 ? (total / target) * 100 : 0;
        
        // Find associated orders
        const ordersList = Array.from(new Set(loomLogs.map(log => log.order_id).filter(Boolean)));
        
        return {
          id: l.id,
          loom_id: l.id,
          loom_name: l.loom_name,
          order_id: ordersList.join(', ') || '-',
          buyer_name: '-',
          fabric_type: '-',
          day_meters: total,
          night_meters: 0,
          total_meters: total,
          target_meters: target,
          variance: parseFloat(variance.toFixed(1)),
          efficiency: eff,
          defect_meters: 0,
          good_meters: total,
          downtime: parseFloat(downtime.toFixed(1)),
          yarn_consumed: parseFloat((total * 0.08).toFixed(1)),
          status: eff >= 80 ? '✅ On Track' : '⚠️ At Risk'
        };
      });
      
      setData(realReportData);
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
    doc.text('Loom-wise Production Report', 14, 54);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Period: ${filters.fromDate} to ${filters.toDate}`, 14, 62);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, 62, { align: 'right' });
    
    autoTable(doc, {
      startY: 68,
      head: [['Loom', 'Order', 'Buyer', 'Day(m)', 'Night(m)', 'Total(m)', 'Target(m)', 'Var(m)', 'Eff(%)', 'Defect(m)', 'Good(m)', 'Status']],
      body: data.map(d => [
        d.loom_name, d.order_id, d.buyer_name, d.day_meters, d.night_meters, 
        d.total_meters, d.target_meters, d.variance, d.efficiency.toFixed(1),
        d.defect_meters, d.good_meters, d.status
      ]),
    });
    doc.save(`Loom_Production_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({
      'Loom ID': d.loom_id, 'Loom Name': d.loom_name, 'Order ID': d.order_id,
      'Buyer Name': d.buyer_name, 'Fabric Type': d.fabric_type,
      'Day Shift(m)': d.day_meters, 'Night Shift(m)': d.night_meters,
      'Total(m)': d.total_meters, 'Target(m)': d.target_meters,
      'Variance(m)': d.variance, 'Efficiency(%)': d.efficiency.toFixed(1),
      'Defect(m)': d.defect_meters, 'Good(m)': d.good_meters,
      'Downtime(hrs)': d.downtime, 'Yarn(kg)': d.yarn_consumed, 'Status': d.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loom Production");
    XLSX.writeFile(wb, `Loom_Production_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Compute footer aggregates
  const totalLooms = data.length;
  const totalProduced = data.reduce((sum, d) => sum + d.total_meters, 0);
  const totalTarget = data.reduce((sum, d) => sum + d.target_meters, 0);
  const overallVariance = totalProduced - totalTarget;
  const overallEff = totalTarget ? (totalProduced / totalTarget) * 100 : 0;
  const totalDefect = data.reduce((sum, d) => sum + d.defect_meters, 0);
  const totalGood = data.reduce((sum, d) => sum + d.good_meters, 0);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: 'var(--primary)' }} /> Loom-wise Production Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Detailed daily output and efficiency tracking per machine</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', borderColor: '#10b981' }}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Filter Parameters</h4>
          <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: 12 }}>Report ID: LWP-001</span>
        </div>
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
              {looms.map(l => <option key={l.id} value={l.id}>{l.loom_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Shift</label>
            <select className="form-control" value={filters.shift} onChange={e => setFilters({...filters, shift: e.target.value})}>
              <option value="Both">Day / Night</option>
              <option value="Day">Day</option>
              <option value="Night">Night</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 12 }}>Order ID</label>
            <select className="form-control" value={filters.order_id} onChange={e => setFilters({...filters, order_id: e.target.value})}>
              <option value="All">All Orders</option>
              <option value="ORD-2024-001">ORD-2024-001</option>
              <option value="ORD-2024-002">ORD-2024-002</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="table-responsive" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Loom</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Day (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Night (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Total (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Target (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Var. (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Eff. %</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Good (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Down (hr)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No production data found for this period.</td></tr>
              ) : data.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.loom_name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{row.order_id}</td>
                  <td style={{ padding: '16px' }}>{row.day_meters}</td>
                  <td style={{ padding: '16px' }}>{row.night_meters}</td>
                  <td style={{ padding: '16px', fontWeight: 700 }}>{row.total_meters}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{row.target_meters}</td>
                  <td style={{ padding: '16px', color: row.variance < 0 ? '#b91c1c' : '#047857', fontWeight: 600 }}>{row.variance > 0 ? '+' : ''}{row.variance}</td>
                  <td style={{ padding: '16px', color: row.efficiency < 90 ? '#b91c1c' : '#047857', fontWeight: 700 }}>{row.efficiency.toFixed(1)}%</td>
                  <td style={{ padding: '16px', color: '#047857' }}>{row.good_meters}</td>
                  <td style={{ padding: '16px', color: '#b45309' }}>{row.downtime}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer Summary */}
        <div style={{ background: 'var(--bg-secondary)', padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16 }}>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Looms</div><div style={{ fontWeight: 700, fontSize: 16 }}>{totalLooms}</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Target</div><div style={{ fontWeight: 700, fontSize: 16 }}>{totalTarget.toLocaleString()} m</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Produced</div><div style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{totalProduced.toLocaleString()} m</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Variance</div><div style={{ fontWeight: 700, fontSize: 16, color: overallVariance < 0 ? '#b91c1c' : '#047857' }}>{overallVariance} m</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overall Eff.</div><div style={{ fontWeight: 700, fontSize: 16 }}>{overallEff.toFixed(1)}%</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Good</div><div style={{ fontWeight: 700, fontSize: 16, color: '#047857' }}>{totalGood.toLocaleString()} m</div></div>
          <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Defect</div><div style={{ fontWeight: 700, fontSize: 16, color: '#b91c1c' }}>{totalDefect.toLocaleString()} m</div></div>
        </div>
      </div>
    </div>
  );
}
