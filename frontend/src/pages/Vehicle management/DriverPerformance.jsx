import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Award, TrendingUp, Filter, Calendar, Truck, 
  MapPin, Clock, Navigation, CheckCircle2, AlertTriangle, 
  ChevronRight, Download, RefreshCw, BarChart3, Star, Zap,
  DollarSign, Gauge, ShieldAlert, FileText, Eye, X, FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
import { showError, showSuccess } from '../../utils/notifications';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DriverPerformance = () => {
  const [data, setData] = useState({ summary: {}, details: [] });
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewType, setViewType] = useState('driver'); // 'driver' or 'vehicle'
  const [vehicles, setVehicles] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({
    driverId: '',
    vehicleId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [filters, viewType]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/fleet/vehicles');
      setVehicles(res.data || []);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/fleet/drivers');
      setDrivers(res.data || []);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.driverId) params.append('driver_id', filters.driverId);
      if (filters.vehicleId) params.append('vehicle_id', filters.vehicleId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      params.append('view_type', viewType);
      
      const res = await api.get(`/fleet/driver-performance-report?${params.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch performance report:', error);
      showError('Failed to load driver report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const headers = [
      'Driver Name', 'Vehicle Number', 'Total Trips', 'Total Distance (KM)', 
      'Hours Logged', 'Avg Mileage (km/L)', 'On-Time Deliveries', 'Late Deliveries', 
      'Breakdowns', 'Total Fuel Cost (INR)', 'Cost per KM (INR)', 'Performance Score (%)', 'Status'
    ];

    const details = data.details || [];
    const workSheetData = [
      headers,
      ...details.map(entry => [
        entry.driver_name,
        entry.vehicle_number,
        entry.total_trips,
        entry.total_distance,
        entry.total_driving_time,
        entry.avg_mileage,
        entry.on_time_deliveries,
        entry.late_deliveries,
        entry.breakdowns,
        entry.fuel_cost,
        entry.cost_per_km,
        entry.performance_score,
        entry.status
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(workSheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${viewType === 'driver' ? 'Driver' : 'Vehicle'}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showSuccess('Excel Exported successfully');
  };

  const exportToPDF = (isPrint = false) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(`Fleet ${viewType === 'driver' ? 'Driver' : 'Vehicle'} Report`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const headers = [
      ['Name/No', 'Trips', 'Distance', 'Avg Mileage', 'On-Time', 'Late', 'Breakdown', 'Score', 'Status']
    ];

    const details = data.details || [];
    const tableData = details.map(entry => [
      viewType === 'driver' ? entry.driver_name : entry.vehicle_number,
      entry.total_trips,
      `${entry.total_distance} km`,
      `${entry.avg_mileage} km/L`,
      entry.on_time_deliveries,
      entry.late_deliveries,
      entry.breakdowns,
      `${entry.performance_score}%`,
      entry.status
    ]);

    autoTable(doc, {
      head: headers,
      body: tableData.length > 0 ? tableData : [['No data', '-', '-', '-', '-', '-', '-', '-', '-']],
      startY: 40,
      theme: 'grid',
      headStyles: { fillStyle: '#6366f1' },
      styles: { fontSize: 8, font: 'helvetica' }
    });

    if (isPrint) {
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`${viewType === 'driver' ? 'Driver' : 'Vehicle'}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showSuccess('PDF Exported successfully');
    }
  };

  const clearFilters = () => {
    setFilters({
      driverId: '',
      vehicleId: '',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="animate-fade">
      {/* Header Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, background: 'rgba(139, 92, 246, 0.08)', borderRadius: 10, color: 'var(--primary)' }}>
            <Award size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              {viewType === 'driver' ? 'Driver' : 'Vehicle'} Performance
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
              {viewType === 'driver' ? 'Holistic performance and metrics analysis for drivers.' : 'Asset utilisation and efficiency statistics.'}
            </p>
          </div>
        </div>

        {/* Tab Toggle Segmented Control */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button 
              onClick={() => { setViewType('driver'); setFilters(f => ({...f, vehicleId: ''})); }}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: viewType === 'driver' ? 'var(--bg-primary)' : 'none',
                color: viewType === 'driver' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              DRIVER RELATED
            </button>
            <button 
              onClick={() => { setViewType('vehicle'); setFilters(f => ({...f, driverId: ''})); }}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: viewType === 'vehicle' ? 'var(--bg-primary)' : 'none',
                color: viewType === 'vehicle' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              VEHICLE RELATED
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Export
            </button>
            
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden' }}>
                <button 
                  onClick={() => { exportToPDF(); setShowExportMenu(false); }} 
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <FileText size={16} color="#ef4444" /> PDF Report
                </button>
                <button 
                  onClick={() => { exportToExcel(); setShowExportMenu(false); }} 
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <FileSpreadsheet size={16} color="#10b981" /> Excel Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Row matching Sales Invoice */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          {viewType === 'driver' ? (
            <div style={{ width: 180 }}>
              <MasterDropdown
                value={filters.driverId}
                onChange={(val) => setFilters({...filters, driverId: val})}
                options={[
                  { value: '', label: 'All Drivers' },
                  ...drivers.map(d => ({ value: d.id, label: d.driver_name || d.name }))
                ]}
                placeholder="All Drivers"
              />
            </div>
          ) : (
            <div style={{ width: 180 }}>
              <MasterDropdown
                value={filters.vehicleId}
                onChange={(val) => setFilters({...filters, vehicleId: val})}
                options={[
                  { value: '', label: 'All Vehicles' },
                  ...vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))
                ]}
                placeholder="All Vehicles"
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input 
              type="date" 
              className="form-control"
              style={{ width: 140, margin: 0, height: 38 }}
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input 
              type="date" 
              className="form-control"
              style={{ width: 140, margin: 0, height: 38 }}
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>

          {(filters.driverId || filters.vehicleId) && (
            <button 
              onClick={clearFilters} 
              className="btn btn-secondary"
              style={{ height: 38, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Driver Performance Matrix Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Performance Registry</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '4px 0 0' }}>Holistic evaluation based on mileage, reliability, and maintenance</p>
          </div>
          {data.summary.best_performer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.08)', padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
               <Star className="text-emerald-500 animate-pulse" size={14} />
               <span style={{ fontSize: 11, fontWeight: 700, color: '#047857' }}>
                 Best Performer: {data.summary.best_performer}
               </span>
            </div>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>{viewType === 'driver' ? 'Driver Profile' : 'Vehicle Identity'}</th>
                <th>{viewType === 'driver' ? 'Assigned Vehicle' : 'Assigned Driver'}</th>
                <th>Trip Completion</th>
                <th>Working Period</th>
                <th>Efficiency</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Performance Index</th>
              </tr>
            </thead>
            <tbody>
              {data.details.map((entry, idx) => (
                <tr key={idx} style={{ transition: 'background 0.2s' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        padding: 8,
                        borderRadius: 10,
                        background: 'rgba(139, 92, 246, 0.08)',
                        color: 'var(--primary)'
                      }}>
                        {viewType === 'driver' ? <User size={18} /> : <Truck size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                          {viewType === 'driver' ? entry.driver_name : entry.vehicle_number}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                          <MapPin size={10} /> {entry.status === 'High Performance' ? 'Regional Hub' : 'Local Route'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ padding: 6, borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                          {viewType === 'driver' ? <Truck size={14} /> : <User size={14} />}
                       </div>
                       <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {viewType === 'driver' ? entry.vehicle_number : entry.driver_name}
                       </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', width: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Navigation size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                          {entry.total_trips} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>TRIPS</span>
                        </span>
                      </div>
                      <div style={{ height: 6, width: '100%', bg: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                        <div 
                          style={{
                            height: '100%',
                            background: '#10b981',
                            width: `${(entry.on_time_deliveries / (entry.total_trips || 1)) * 100}%`
                          }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                           <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                           {entry.total_driving_time} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>HRS</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                           {entry.total_distance.toLocaleString()} KM
                        </span>
                     </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: 13 }}>
                          <Gauge size={14} /> {entry.avg_mileage} <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>KM/L</span>
                       </div>
                       <div style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600, marginTop: 2 }}>
                          ₹{entry.cost_per_km}/KM
                       </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{entry.performance_score}%</span>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: 12, 
                            fontSize: 9, 
                            fontWeight: 700,
                            background: entry.status === 'High Performance' ? 'rgba(16, 185, 129, 0.08)' : entry.status === 'Average' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            color: entry.status === 'High Performance' ? '#10b981' : entry.status === 'Average' ? '#3b82f6' : '#ef4444',
                            border: entry.status === 'High Performance' ? '1px solid rgba(16, 185, 129, 0.2)' : entry.status === 'Average' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            {entry.status}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedRecord(entry)}
                        className="btn btn-secondary"
                        style={{ padding: '6px' }}
                      >
                         <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.details.length === 0 && !loading && (
                <tr>
                   <td colSpan="6" style={{ padding: 48, textAlign: 'center' }}>
                     <div style={{ maxWidth: 300, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                       <div style={{ background: 'var(--bg-secondary)', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                         <Star size={32} />
                       </div>
                       <div>
                         <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Performance Records</h4>
                         <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: '1.5' }}>There are no performance entries matching the current filter window.</p>
                       </div>
                       <button onClick={fetchReport} className="btn btn-primary" style={{ padding: '8px 16px' }}>Refresh Search</button>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 650, padding: 0, overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 8, background: 'rgba(139, 92, 246, 0.08)', borderRadius: 8, color: 'var(--primary)' }}>
                  {viewType === 'driver' ? <User size={20} /> : <Truck size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Audit Performance Details</h3>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {viewType === 'driver' ? 'Driver Centric Analysis' : 'Vehicle Performance Report'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Primary Identity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Operator Name</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedRecord.driver_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Fleet Unit No</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{selectedRecord.vehicle_number}</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ textPanel: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Efficiency</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedRecord.avg_mileage} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>KM/L</span>
                  </div>
                </div>
                <div style={{ textPanel: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Distance</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedRecord.total_distance.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>KM</span>
                  </div>
                </div>
                <div style={{ textPanel: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Trips</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedRecord.total_trips} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>LOGS</span>
                  </div>
                </div>
              </div>

              {/* Financial & Reliability */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                 <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                       <DollarSign size={14} /> Total Burn Rate
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>₹{selectedRecord.fuel_cost.toLocaleString()}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#f87171', marginTop: 4 }}>₹{selectedRecord.cost_per_km} per Kilometer</div>
                 </div>
                 <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                       <CheckCircle2 size={14} /> Delivery Success
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {((selectedRecord.on_time_deliveries / (selectedRecord.total_trips || 1)) * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#34d399', marginTop: 4 }}>
                      {selectedRecord.on_time_deliveries} Successes Out of {selectedRecord.total_trips}
                    </div>
                 </div>
              </div>

              {/* Breakdown Warning */}
              {selectedRecord.breakdowns > 0 && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', padding: 16, borderRadius: 12, color: '#b45309' }}>
                   <AlertTriangle size={20} />
                   <div>
                     <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Technical Alert</div>
                     <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>This entry includes {selectedRecord.breakdowns} critical breakdowns recorded in the interval.</div>
                   </div>
                </div>
              )}

              {/* Trip History Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Navigation size={14} style={{ color: 'var(--primary)' }} /> Recent Activity Log
                  </h4>
                  <span className="badge badge-active" style={{ fontSize: 10 }}>LAST {selectedRecord.recent_trips?.length || 0} ENTRIES</span>
                </div>
                
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>{viewType === 'driver' ? 'Vehicle No' : 'Operator'}</th>
                          <th>Distance</th>
                          <th>Fuel / Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedRecord.recent_trips || []).map((trip, tIdx) => (
                          <tr key={tIdx}>
                            <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{trip.date}</td>
                            <td>
                              <span style={{ px: 8, py: 4, background: 'var(--bg-secondary)', borderRadius: 6, fontWeight: 700, color: 'var(--text-primary)', padding: '2px 8px' }}>
                                {viewType === 'driver' ? trip.vehicle_number : trip.driver_name}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trip.distance} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>KM</span></td>
                            <td>
                              {trip.fuel_liters > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ color: '#10b981', fontWeight: 700 }}>{trip.fuel_liters}L</span>
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>₹{trip.fuel_cost}</span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>--</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {(!selectedRecord.recent_trips || selectedRecord.recent_trips.length === 0) && (
                          <tr>
                            <td colSpan="4" style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No individual trip logs found for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <div style={{ h: 8, w: 8, height: 8, width: 8, borderRadius: '50%', background: selectedRecord.status === 'High Performance' ? '#10b981' : '#ef4444' }} />
                 <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{selectedRecord.status}</span>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPerformance;