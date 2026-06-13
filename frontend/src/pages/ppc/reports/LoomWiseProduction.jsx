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
      const loomRes = await ppcAPI.getLooms().catch(() => ({ data: [] }));
      const activeLooms = loomRes.data || Array.from({length: 8}).map((_, i) => ({ id: `LM-00${i+1}`, loom_name: `Loom ${i+1}` }));
      setLooms(activeLooms);
      
      // Generate realistic mock data for the report
      const mockData = activeLooms.map((l, i) => {
        const day = Math.floor(Math.random() * 50 + 180);
        const night = Math.floor(Math.random() * 50 + 170);
        const total = day + night;
        const target = 425;
        const variance = total - target;
        const eff = (total / target) * 100;
        const defect = Math.floor(Math.random() * 10);
        const good = total - defect;
        
        return {
          id: i,
          loom_id: l.id || `LM-00${i+1}`,
          loom_name: l.loom_name || `Loom ${i+1}`,
          order_id: `ORD-2024-${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`,
          buyer_name: Math.random() > 0.5 ? 'H&M Sweden' : 'Zara Spain',
          fabric_type: 'Cotton Poplin',
          day_meters: day,
          night_meters: night,
          total_meters: total,
          target_meters: target,
          variance: variance,
          efficiency: eff,
          defect_meters: defect,
          good_meters: good,
          downtime: Math.floor(Math.random() * 30)/10,
          yarn_consumed: Math.floor(total * 0.08),
          status: eff > 90 ? '✅ On Track' : '⚠️ At Risk'
        };
      });
      
      setData(mockData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Loom-wise Production Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${filters.fromDate} to ${filters.toDate}`, 14, 22);
    
    autoTable(doc, {
      startY: 28,
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
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
              <tr>
                <th>Loom</th>
                <th>Order ID</th>
                <th>Day (m)</th>
                <th>Night (m)</th>
                <th>Total (m)</th>
                <th>Target (m)</th>
                <th>Var. (m)</th>
                <th>Eff. %</th>
                <th>Good (m)</th>
                <th>Down (hr)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40 }}>Loading data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40 }}>No production data found for this period.</td></tr>
              ) : data.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{row.loom_name}</td>
                  <td>{row.order_id}</td>
                  <td>{row.day_meters}</td>
                  <td>{row.night_meters}</td>
                  <td style={{ fontWeight: 700 }}>{row.total_meters}</td>
                  <td>{row.target_meters}</td>
                  <td style={{ color: row.variance < 0 ? '#b91c1c' : '#047857', fontWeight: 600 }}>{row.variance > 0 ? '+' : ''}{row.variance}</td>
                  <td style={{ color: row.efficiency < 90 ? '#b91c1c' : '#047857', fontWeight: 700 }}>{row.efficiency.toFixed(1)}%</td>
                  <td>{row.good_meters}</td>
                  <td style={{ color: '#b45309' }}>{row.downtime}</td>
                  <td style={{ fontWeight: 600 }}>{row.status}</td>
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
