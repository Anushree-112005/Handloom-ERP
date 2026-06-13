import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Award, TrendingUp, Filter, Calendar, Truck, 
  MapPin, Clock, Navigation, CheckCircle2, AlertTriangle, 
  ChevronRight, Download, RefreshCw, BarChart3, Star, Zap,
  DollarSign, Gauge, ShieldAlert, FileText, Eye, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
      
      const res = await api.get(`/fleet/driver-performance-report?${params.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch performance report:', error);
      showError('Failed to load driver report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Driver Name', 'Vehicle Number', 'Total Trips', 'Total Distance (KM)', 
      'Hours Logged', 'Avg Mileage (km/L)', 'On-Time Deliveries', 'Late Deliveries', 
      'Breakdowns', 'Total Fuel Cost (INR)', 'Cost per KM (INR)', 'Performance Score (%)', 'Status'
    ];

    const details = data.details || [];
    const csvRows = details.map(entry => [
      `"${entry.driver_name}"`,
      `"${entry.vehicle_number}"`,
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
      `"${entry.status}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${viewType === 'driver' ? 'Driver' : 'Vehicle'}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('CSV Exported successfully');
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

    doc.autoTable({
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

  const rankingData = useMemo(() => {
    return data.details.slice(0, 5).map(d => ({
      name: viewType === 'driver' ? d.driver_name : d.vehicle_number,
      score: d.performance_score
    }));
  }, [data.details, viewType]);

  const deliveryDistribution = useMemo(() => {
    let onTime = 0, late = 0;
    data.details.forEach(d => {
      onTime += d.on_time_deliveries;
      late += d.late_deliveries;
    });
    return [
      { name: 'On-Time', value: onTime, color: '#10b981' },
      { name: 'Late', value: late, color: '#f43f5e' }
    ];
  }, [data.details]);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="btn btn-primary">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tightest uppercase">
                {viewType === 'driver' ? 'Driver' : 'Vehicle'} <span className="text-purple-600">Report</span>
              </h1>
              <p className="text-slate-500 font-bold text-sm tracking-wide">
                {viewType === 'driver' ? 'Driver related vehicle report' : 'Vehicle related report'}
              </p>
            </div>
          </div>
          
          <div className="btn btn-secondary">
            <button 
              onClick={() => { setViewType('driver'); setFilters(f => ({...f, vehicleId: ''})); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewType === 'driver' ? 'bg-white shadow-xl text-purple-600 border border-purple-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              DRIVER RELATED
            </button>
            <button 
              onClick={() => { setViewType('vehicle'); setFilters(f => ({...f, driverId: ''})); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewType === 'vehicle' ? 'bg-white shadow-xl text-purple-600 border border-purple-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              VEHICLE RELATED
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div 
              className="relative"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                onMouseEnter={() => setShowExportMenu(true)}
                className="btn btn-secondary"
              >
                <Download size={20} /> Export Report
              </button>
              
              {showExportMenu && (
                <div className="btn btn-secondary">
                  <button onClick={() => { exportToExcel(); setShowExportMenu(false); }} className="form-control">
                    <BarChart3 size={16} className="text-emerald-500" /> EXCEL FORMAT
                  </button>
                  <button onClick={() => { exportToPDF(); setShowExportMenu(false); }} className="form-control">
                    <FileText size={16} className="text-rose-500" /> PDF DOCUMENT
                  </button>
                  <button onClick={() => { exportToPDF(true); setShowExportMenu(false); }} className="form-control">
                    <Eye size={16} className="text-blue-500" /> FULL VIEW
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards removed as per user request */}

      {/* Advanced Filters */}
      <div className="card">
        <div className="form-row">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <User size={14} className="text-purple-500" /> {viewType === 'driver' ? 'Selective Driver' : 'Selective Vehicle'}
            </label>
            {viewType === 'driver' ? (
              <select 
                className="form-control"
                value={filters.driverId}
                onChange={(e) => setFilters({...filters, driverId: e.target.value})}
              >
                <option value="">All Drivers</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            ) : (
              <select 
                className="form-control"
                value={filters.vehicleId}
                onChange={(e) => setFilters({...filters, vehicleId: e.target.value})}
              >
                <option value="">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar size={14} className="text-purple-500" /> Start Date
            </label>
            <input 
              type="date" 
              className="form-control"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar size={14} className="text-purple-500" /> End Date
            </label>
            <input 
              type="date" 
              className="form-control"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>

        </div>
      </div>


      {/* Driver Performance Matrix Table */}
      <div className="card">
        <div className="btn btn-secondary">
          <div>
            <h3 className="font-black text-slate-900 tracking-tight text-lg">Performance Matrix Registry</h3>
            <p className="text-slate-400 text-xs font-bold mt-1">Holistic evaluation based on mileage, reliability, and maintenance</p>
          </div>
          <div className="btn btn-primary">
             <Star className="text-purple-600" size={16} />
             <span className="text-[10px] font-black text-purple-700 tracking-widest uppercase truncate max-w-[150px]">
               Best: {data.summary.best_performer}
             </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="btn btn-secondary">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[25%]">
                  {viewType === 'driver' ? 'Driver Profile' : 'Vehicle Identity'}
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {viewType === 'driver' ? 'Assigned Vehicle' : 'Assigned Driver'}
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trip Completion</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Working Period</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Efficiency</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Performance Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.details.map((entry, idx) => (
                <tr key={idx} className="btn btn-secondary">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="btn btn-primary">
                        {viewType === 'driver' ? <User className="h-5 w-5 text-slate-400 group-hover:text-purple-600" /> : <Truck className="h-5 w-5 text-slate-400 group-hover:text-purple-600" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 leading-tight tracking-tight">
                          {viewType === 'driver' ? entry.driver_name : entry.vehicle_number}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {entry.status === 'High Performance' ? 'Regional Hub' : 'Local Route'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                       <div className="btn btn-primary">
                          {viewType === 'driver' ? <Truck size={14} /> : <User size={14} />}
                       </div>
                       <span className="text-sm font-bold text-slate-700">
                          {viewType === 'driver' ? entry.vehicle_number : entry.driver_name}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation size={14} className="text-indigo-400" />
                        <span className="font-black text-slate-900 text-sm">{entry.total_trips} <span className="text-[10px] text-slate-400">COMPLETED</span></span>
                      </div>
                      <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="btn btn-success" 
                            style={{width: `${(entry.on_time_deliveries / entry.total_trips) * 100}%` || '0%'}} 
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm mb-1">
                           <Clock size={14} className="text-slate-400" />
                           {entry.total_driving_time} <span className="text-[10px] text-slate-400">HRS</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                           Total: {entry.total_distance.toLocaleString()} KM
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm mb-1">
                          <Gauge size={14} /> {entry.avg_mileage} <span className="text-[10px] text-emerald-400">KM/L</span>
                       </div>
                       <div className="flex items-center gap-1 text-[10px] font-black text-rose-500 italic">
                          <DollarSign size={10} /> ₹{entry.cost_per_km}/KM
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex flex-col items-end gap-2">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                            <circle 
                              cx="24" 
                              cy="24" 
                              r="20" 
                              fill="none" 
                              stroke={entry.status === 'High Performance' ? '#10b981' : entry.status === 'Average' ? '#6366f1' : '#f43f5e'} 
                              strokeWidth="4" 
                              strokeDasharray={`${(entry.performance_score / 100) * 125.6} 125.6`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-black text-slate-900">{entry.performance_score}%</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                           entry.status === 'High Performance' ? 'bg-emerald-50 text-emerald-600' :
                           entry.status === 'Average' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                           {entry.status}
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedRecord(entry)}
                        className="btn btn-primary"
                      >
                         <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.details.length === 0 && !loading && (
                <tr>
                   <td colSpan="7" className="px-8 py-32 text-center">
                     <div className="max-w-xs mx-auto space-y-4">
                       <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-slate-300 ring-4 ring-white shadow-inner">
                         <Star size={40} />
                       </div>
                       <div>
                         <h4 className="text-slate-900 font-black tracking-tight uppercase text-sm">No Analyst Records</h4>
                         <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">There are no performance entries matching the current filter window.</p>
                       </div>
                       <button onClick={fetchReport} className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-6 py-2.5 rounded-xl">Refresh Search</button>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="card">
            <div className="btn btn-secondary">
              <div className="flex items-center gap-4">
                <div className="card">
                  {viewType === 'driver' ? <User size={24} className="text-purple-600" /> : <Truck size={24} className="text-purple-600" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Audit Log Details</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewType === 'driver' ? 'Driver Centric Analysis' : 'Vehicle Performance Report'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="btn btn-secondary"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Primary Identity */}
              <div className="form-row">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Operator Name</label>
                  <p className="text-xl font-black text-slate-900">{selectedRecord.driver_name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Fleet Unit No</label>
                  <p className="text-xl font-black text-purple-600">{selectedRecord.vehicle_number}</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="btn btn-secondary">
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-2">Efficiency</p>
                  <p className="text-lg font-black text-slate-900">{selectedRecord.avg_mileage} <span className="text-[10px]">km/L</span></p>
                </div>
                <div className="btn btn-secondary">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-2">Distance</p>
                  <p className="text-lg font-black text-slate-900">{selectedRecord.total_distance.toLocaleString()} <span className="text-[10px]">KM</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight mb-2">Trips</p>
                  <p className="text-lg font-black text-slate-900">{selectedRecord.total_trips} <span className="text-[10px]">LOGS</span></p>
                </div>
              </div>

              {/* Financial & Reliability */}
              <div className="form-row">
                 <div className="btn btn-danger">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <DollarSign size={14} /> Total Burn Rate
                    </h4>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{selectedRecord.fuel_cost.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-rose-400 mt-1 uppercase italic">₹{selectedRecord.cost_per_km} per Kilometer</p>
                 </div>
                 <div className="btn btn-success">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <CheckCircle2 size={14} /> Delivery Success
                    </h4>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{((selectedRecord.on_time_deliveries / selectedRecord.total_trips) * 100).toFixed(1)}%</p>
                    <p className="text-[10px] font-black text-emerald-400 mt-1 uppercase italic">{selectedRecord.on_time_deliveries} Successes Out of {selectedRecord.total_trips}</p>
                 </div>
              </div>

              {/* Breakdown Warning */}
              {selectedRecord.breakdowns > 0 && (
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex items-center gap-4 text-amber-700">
                   <AlertTriangle className="animate-bounce" size={24} />
                   <div>
                     <p className="text-sm font-black uppercase">Technical Alert</p>
                     <p className="text-xs font-bold leading-none mt-1">This entry includes {selectedRecord.breakdowns} critical breakdowns recorded in the interval.</p>
                   </div>
                </div>
              )}

              {/* Trip History Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Navigation size={14} className="text-purple-500" /> Recent Activity Log
                  </h4>
                  <span className="btn btn-primary">LAST {selectedRecord.recent_trips?.length || 0} ENTRIES</span>
                </div>
                
                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr className="btn btn-secondary">
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Date</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">
                            {viewType === 'driver' ? 'Vehicle No' : 'Operator'}
                          </th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Distance</th>
                          <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[9px]">Fuel / Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(selectedRecord.recent_trips || []).map((trip, tIdx) => (
                          <tr key={tIdx} className="btn btn-secondary">
                            <td className="px-6 py-4 font-bold text-slate-600">{trip.date}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 rounded-lg font-black text-slate-700">
                                {viewType === 'driver' ? trip.vehicle_number : trip.driver_name}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-black text-slate-900">{trip.distance} <span className="text-slate-400">KM</span></td>
                            <td className="px-6 py-4">
                              {trip.fuel_liters > 0 ? (
                                <div className="flex flex-col">
                                  <span className="text-emerald-600 font-bold">{trip.fuel_liters}L</span>
                                  <span className="text-[9px] text-slate-400 font-black">₹{trip.fuel_cost}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">--</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {(!selectedRecord.recent_trips || selectedRecord.recent_trips.length === 0) && (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No individual trip logs found for this period.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="btn btn-secondary">
              <div className="flex items-center gap-2">
                 <div className={`h-3 w-3 rounded-full ${selectedRecord.status === 'High Performance' ? 'bg-emerald-600 shadow-[0_0_10px_#10b981]' : 'bg-rose-600 shadow-[0_0_10px_#f43f5e]'}`} />
                 <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedRecord.status}</span>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="btn btn-secondary"
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