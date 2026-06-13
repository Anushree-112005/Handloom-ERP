import React, { useState } from 'react';
import { Factory, Printer, Download, Filter, Target, Activity, Settings, Package } from 'lucide-react';
import jsPDF from 'jspdf';

export default function DailyFactoryReport() {
  const [filters, setFilters] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    shift: 'Both'
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Daily Factory Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${filters.reportDate}`, 14, 22);
    doc.text('This is a mock PDF for Daily Factory Report', 14, 30);
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
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10b981', borderColor: '#10b981' }}>
            <Download size={16} /> Excel
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
              <div style={{ fontSize: 24, fontWeight: 700 }}>10</div>
            </div>
            <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#047857' }}>Total Looms Running</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#047857' }}>8</div>
            </div>
            <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#b45309' }}>Total Looms Idle</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b45309' }}>1</div>
            </div>
            <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#b91c1c' }}>Total Looms Breakdown</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c' }}>1</div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 12, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>Factory Utilization</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>80.0%</span>
          </div>
        </div>

        {/* Production Section */}
        <div className="card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            <Target size={18} /> Production Performance
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Meters</span><span style={{ fontWeight: 600 }}>4,250 m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Actual Meters</span><span style={{ fontWeight: 600, color: '#047857' }}>4,020 m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Variance</span><span style={{ fontWeight: 600, color: '#b91c1c' }}>-230 m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Overall Efficiency</span><span style={{ fontWeight: 700, color: 'var(--primary)' }}>94.6%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Quality Pass %</span><span style={{ fontWeight: 600 }}>97.9%</span>
            </div>
          </div>
        </div>

        {/* Downtime Section */}
        <div className="card">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            <Activity size={18} /> Downtime & Maintenance
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Downtime (hrs)</span><span style={{ fontWeight: 600 }}>6.5 hrs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>No. of Breakdowns</span><span style={{ fontWeight: 600 }}>3</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mechanical Downtime</span><span style={{ fontWeight: 600 }}>3.0 hrs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Lost Meters</span><span style={{ fontWeight: 600, color: '#b91c1c' }}>162 m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Est. Financial Loss</span><span style={{ fontWeight: 700, color: '#b91c1c' }}>₹7,290</span>
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
              <div style={{ fontSize: 24, fontWeight: 700 }}>5</div>
            </div>
            <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#047857' }}>On Track</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#047857' }}>4</div>
            </div>
            <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#b45309' }}>At Risk</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b45309' }}>1</div>
            </div>
            <div style={{ padding: 16, background: '#fef2f2', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#b91c1c' }}>Delayed</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c' }}>0</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
