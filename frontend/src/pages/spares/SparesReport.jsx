import { useState, useMemo } from 'react';
import { 
  FileText, Search, Download, Printer, Filter, ChevronRight, 
  AlertTriangle, RefreshCw, Layers, Settings, ArrowDownLeft 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function SparesReport() {
  // Low Stock warnings
  const [lowStockAlerts, setLowStockAlerts] = useState([
    { code: 'SP-WE-091', name: 'Weft Selector Needle', qty: 15, min: 20, status: 'Critical' },
    { code: 'SP-EL-889', name: 'Loom Encoder Sensor', qty: 8, min: 10, status: 'Warning' }
  ]);

  // Overall Spares Stock Database
  const [sparesStock, setSparesStock] = useState([
    { code: 'SP-WE-402', name: 'Rapier Gripper Right', category: 'Mechanical Spares', loom: 'Picanol OptiMax', qty: 24, min: 10, cost: 4200, location: 'Rack A-2' },
    { code: 'SP-WE-091', name: 'Weft Selector Needle', category: 'Electronic Spares', loom: 'Sulzer G6500', qty: 15, min: 20, cost: 1850, location: 'Rack B-5' },
    { code: 'SP-SP-112', name: 'Spindle Drive Belt 12mm', category: 'Spinning Belts', loom: 'LMW LR9', qty: 45, min: 15, cost: 950, location: 'Rack C-1' },
    { code: 'SP-WE-224', name: 'Loom Heald Frame Wire 330mm', category: 'Mechanical Spares', loom: 'Multi-Loom', qty: 400, min: 100, cost: 4, location: 'Bin D-12' },
    { code: 'SP-EL-889', name: 'Loom Encoder Sensor', category: 'Electronic Spares', loom: 'Picanol', qty: 8, min: 10, cost: 12500, location: 'Cabinet E-2' },
    { code: 'SP-WE-005', name: 'Rapier Drive Wheel', category: 'Mechanical Spares', loom: 'Sulzer', qty: 12, min: 5, cost: 8500, location: 'Rack A-5' }
  ]);

  // Consumption breakdown data
  const consumptionData = [
    { name: 'Mechanical Spares', value: 32000, color: '#ef4444' },
    { name: 'Electronic Spares', value: 18500, color: '#f59e0b' },
    { name: 'Belts & Drives', value: 9500, color: '#8b5cf6' },
    { name: 'Loom Healds', value: 2400, color: '#10b981' }
  ];

  // Loom usage data
  const loomUsageData = [
    { name: 'Picanol', spent: 18500 },
    { name: 'Sulzer', spent: 14200 },
    { name: 'LMW Spinning', spent: 9800 },
    { name: 'Other Looms', spent: 3400 }
  ];

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedLoom, setSelectedLoom] = useState('All');

  // Filtered Stock Table Rows
  const filteredRows = useMemo(() => {
    return sparesStock.filter(row => {
      const matchSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCat === 'All' || row.category === selectedCat;
      const matchLoom = selectedLoom === 'All' || row.loom.includes(selectedLoom);
      return matchSearch && matchCat && matchLoom;
    });
  }, [sparesStock, searchTerm, selectedCat, selectedLoom]);

  // Excel compilation
  const handleExportExcel = () => {
    const dataToExport = filteredRows.map(row => ({
      'Part Code': row.code,
      'Spare Name': row.name,
      'Category': row.category,
      'Compatible Machine': row.loom,
      'Current Qty': row.qty,
      'Min Level': row.min,
      'Unit Cost (Rs)': row.cost,
      'Total Valuation (Rs)': row.qty * row.cost,
      'Location Bin': row.location
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Spares Stock');
    XLSX.writeFile(workbook, 'Spares_Stock_Report.xlsx');
  };

  // PDF compilation
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait' });
    doc.setFont('helvetica', 'bold');
    doc.text('DINESH EXPORTS TEXTILE ERP — SPARES STOCK REPORT', 14, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toISOString().substring(0, 10)} | Scope: Spares & Maintenance`, 14, 21);

    const headers = [['Part Code', 'Part Name', 'Category', 'Loom', 'Qty', 'Min', 'Valuation']];
    const data = filteredRows.map(row => [
      row.code,
      row.name,
      row.category,
      row.loom,
      row.qty,
      row.min,
      `Rs.${(row.qty * row.cost).toLocaleString()}`
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 26,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] }
    });

    doc.save('Spares_Stock_Report.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FileText size={26} style={{ color: '#ef4444' }} /> Spares & Maintenance Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            Centralized spare-parts stock valuation, consumption analytics, and critical indent status logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Download size={16} style={{ color: '#15803d' }} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <FileText size={16} style={{ color: '#dc2626' }} /> Export PDF
          </button>
        </div>
      </div>

      {/* CRITICAL STOCK ALERTS BAR */}
      {lowStockAlerts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {lowStockAlerts.map(alert => (
            <div 
              key={alert.code} 
              style={{ 
                borderLeft: '5px solid #ef4444', 
                background: 'rgba(239, 68, 68, 0.04)', 
                padding: '16px 20px', 
                borderRadius: '8px', 
                border: '1px solid rgba(239, 68, 68, 0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>LOW STOCK ALERT: {alert.code}</strong>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{alert.name}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-pending" style={{ fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 800 }}>
                  Stock: {alert.qty} / Min: {alert.min}
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>Action Required</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CHARTS AND ANALYTICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Chart 1: Loom Spares Expense */}
        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>📈 Breakdown Spare Expense (Rs)</span>
            <span style={{ color: '#ef4444', fontSize: '12px' }}>By Loom Manufacturer</span>
          </h4>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loomUsageData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`Rs.${v.toLocaleString()}`, 'Spares Expense']} />
                <Bar dataKey="spent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            🧶 Spares Category Consumption Breakdown
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', height: '240px' }}>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consumptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {consumptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `Rs.${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {consumptionData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}:</span>
                  <span style={{ color: 'var(--text-muted)' }}>Rs.{(item.value/1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Search spare parts</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search Part name, Register Code..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', margin: 0, fontSize: '13px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Category</label>
            <select className="form-control" value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }}>
              <option value="All">All Categories</option>
              <option value="Mechanical Spares">Mechanical Spares</option>
              <option value="Electronic Spares">Electronic Spares</option>
              <option value="Spinning Belts">Spinning Belts</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Compatible Machine</label>
            <select className="form-control" value={selectedLoom} onChange={e => setSelectedLoom(e.target.value)} style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }}>
              <option value="All">All Machines</option>
              <option value="Picanol">Picanol Loom</option>
              <option value="Sulzer">Sulzer Loom</option>
              <option value="LMW">LMW Spinning</option>
            </select>
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '9px', fontSize: '13px', justifyContent: 'center' }} 
            onClick={() => {
              setSearchTerm('');
              setSelectedCat('All');
              setSelectedLoom('All');
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* DYNAMIC VALUATION TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Spares Stock Valuation & Ledger
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredRows.length} parts items of {sparesStock.length} total
            </span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handlePrint}>
            <Printer size={12} /> Print Ledger
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', margin: 0, minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Part Name</th>
                <th>Category</th>
                <th>Compatible Loom</th>
                <th>In Stock</th>
                <th>Min Level</th>
                <th style={{ textAlign: 'right' }}>Unit Cost</th>
                <th style={{ textAlign: 'right' }}>Valuation</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No spare parts inventory match the active filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isLow = row.qty <= row.min;
                  return (
                    <tr key={idx} style={{ background: isLow ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{row.code}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</span>
                        {isLow && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontWeight: 700 }}>
                            Low
                          </span>
                        )}
                      </td>
                      <td>{row.category}</td>
                      <td>{row.loom}</td>
                      <td style={{ fontWeight: 800, color: isLow ? '#ef4444' : 'var(--text-primary)' }}>{row.qty}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{row.min}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs.{row.cost.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#4f46e5' }}>Rs.{(row.qty * row.cost).toLocaleString()}</td>
                      <td>
                        <span className="badge badge-draft" style={{ borderRadius: '4px', fontSize: '11px' }}>{row.location}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
