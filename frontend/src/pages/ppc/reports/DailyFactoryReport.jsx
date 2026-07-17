import React, { useState, useEffect } from 'react';
import { Factory, Printer, Download, Filter, Target, Activity, Settings, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import { ppcAPI } from '../../../services/api';

export default function DailyFactoryReport() {
  const [filters, setFilters] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    shift: 'Both'
  });

  const [dashboard, setDashboard] = useState({
    active_orders: 0,
    total_running: 0,
    total_idle: 0,
    production_today: 0,
    on_time: 0,
    at_risk: 0,
    avg_efficiency: 0,
    pending_receipts: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await ppcAPI.getDashboard();
      if (res.data) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalLooms = dashboard.total_running + dashboard.total_idle;
  const loomsRunning = dashboard.total_running;
  const loomsIdle = dashboard.total_idle;
  const utilization = totalLooms > 0 ? (loomsRunning / totalLooms) * 100 : 0;
  
  const targetMeters = totalLooms * 425 || 425;
  const actualMeters = dashboard.production_today;
  const variance = actualMeters - targetMeters;
  const efficiency = dashboard.avg_efficiency || 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
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
    doc.text('Daily Factory Report', 14, 54);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Date: ${filters.reportDate}`, 14, 62);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, 62, { align: 'right' });

    doc.text(`Total Looms: ${totalLooms}`, 14, 75);
    doc.text(`Running Looms: ${loomsRunning}`, 14, 82);
    doc.text(`Idle Looms: ${loomsIdle}`, 14, 89);
    doc.text(`Utilization: ${utilization.toFixed(1)}%`, 14, 96);
    
    doc.text(`Target Production: ${targetMeters} m`, 14, 110);
    doc.text(`Actual Production: ${actualMeters} m`, 14, 117);
    doc.text(`Variance: ${variance.toFixed(1)} m`, 14, 124);
    doc.text(`Overall Efficiency: ${efficiency.toFixed(1)}%`, 14, 131);

    doc.save(`Daily_Factory_${filters.reportDate}.pdf`);
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Factory style={{ color: 'var(--primary)' }} /> Daily Factory Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Comprehensive daily snapshot of plant performance</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Report Date</h4>
          <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: 12 }}>Report ID: DFR-001</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="form-group" style={{ width: 200 }}>
            <input type="date" className="form-control" value={filters.reportDate} onChange={e => setFilters({...filters, reportDate: e.target.value})} />
          </div>
          <div className="form-group" style={{ width: 200 }}>
            <select className="form-control" value={filters.shift} onChange={e => setFilters({...filters, shift: e.target.value})}>
              <option value="Both">All Shifts</option>
              <option value="Day">Day Shift</option>
              <option value="Night">Night Shift</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        
        {/* Factory Summary */}
        <div className="card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            <Settings size={18} /> Factory Summary
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Looms in Factory</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{totalLooms}</div>
            </div>
            <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#047857' }}>Total Looms Running</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#047857' }}>{loomsRunning}</div>
            </div>
            <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#b45309' }}>Total Looms Idle</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b45309' }}>{loomsIdle}</div>
            </div>
            <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#b91c1c' }}>Total Looms Breakdown</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c' }}>{dashboard.pending_receipts}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 12, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>Factory Utilization</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{utilization.toFixed(1)}%</span>
          </div>
        </div>

        {/* Production Section */}
        <div className="card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            <Target size={18} /> Production Performance
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Meters</span><span style={{ fontWeight: 600 }}>{targetMeters.toLocaleString()} m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Actual Meters</span><span style={{ fontWeight: 600, color: '#047857' }}>{actualMeters.toLocaleString()} m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Variance</span><span style={{ fontWeight: 600, color: variance < 0 ? '#b91c1c' : '#047857' }}>{variance > 0 ? '+' : ''}{variance.toFixed(1)} m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Overall Efficiency</span><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{efficiency.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            <Package size={18} /> Active Orders
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Orders</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboard.active_orders}</div>
            </div>
            <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#047857' }}>On Track</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#047857' }}>{dashboard.on_time}</div>
            </div>
            <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#b45309' }}>At Risk</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b45309' }}>{dashboard.at_risk}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
