import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, Droplets, MapPin, IndianRupee, Truck, Calendar, 
  Activity, Filter, RefreshCw, Download, FileText, FileSpreadsheet, X 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { showError } from '../../utils/notifications';

const FuelConsumption = () => {
  const [vehicles, setVehicles] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    vehicle_id: '',
    driver_id: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, fuelRes, routesRes, tripsRes, driversRes] = await Promise.all([
        api.get('/fleet/vehicles'),
        api.get('/fleet/fuel-entries'),
        api.get('/fleet/routes'),
        api.get('/fleet/trips'),
        api.get('/fleet/drivers')
      ]);
      setVehicles(vehiclesRes.data || []);
      setFuelEntries(fuelRes.data || []);
      setRoutes(routesRes.data || []);
      setTrips(tripsRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Failed to load consumption data:', error);
      showError('Failed to synchronize fuel tracking data');
    } finally {
      setLoading(false);
    }
  };

  // Use Memo for heavy calculations
  const analysisData = useMemo(() => {
    let filteredFuel = [...fuelEntries];
    let filteredRoutes = [...routes];
    let filteredTrips = trips;

    // Apply Filters
    if (filters.vehicle_id) {
      filteredFuel = filteredFuel.filter(f => f.vehicle_id === parseInt(filters.vehicle_id));
      const vNum = vehicles.find(v => v.id === parseInt(filters.vehicle_id))?.vehicle_number;
      if (vNum) {
        filteredRoutes = filteredRoutes.filter(r => r.fuel_vehicle_number === vNum);
      }
      filteredTrips = filteredTrips.filter(t => t.vehicle_id === parseInt(filters.vehicle_id));
    }
    if (filters.driver_id) {
      filteredTrips = filteredTrips.filter(t => t.driver_id === parseInt(filters.driver_id));
    }
    if (filters.startDate) {
      filteredFuel = filteredFuel.filter(f => new Date(f.date) >= new Date(filters.startDate));
      filteredRoutes = filteredRoutes.filter(r => r.fuel_date && new Date(r.fuel_date) >= new Date(filters.startDate));
      filteredTrips = filteredTrips.filter(t => new Date(t.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filteredFuel = filteredFuel.filter(f => new Date(f.date) <= new Date(filters.endDate));
      filteredRoutes = filteredRoutes.filter(r => r.fuel_date && new Date(r.fuel_date) <= new Date(filters.endDate));
      filteredTrips = filteredTrips.filter(t => new Date(t.date) <= new Date(filters.endDate));
    }

    // Vehicle Grouping
    const vehicleStats = {};
    
    vehicles.forEach(v => {
      vehicleStats[v.id] = {
        vehicle_id: v.id,
        vehicle_number: v.vehicle_number,
        total_fuel_liters: 0,
        total_fuel_cost: 0,
        total_distance: 0, 
        manual_distance: 0, 
        trip_count: 0,
        min_odometer: Number.MAX_SAFE_INTEGER,
        max_odometer: 0,
        entries: []
      };
    });

    // Populate Fuel Data
    filteredFuel.forEach(f => {
      if (vehicleStats[f.vehicle_id]) {
        vehicleStats[f.vehicle_id].total_fuel_liters += (f.quantity_liters || 0);
        vehicleStats[f.vehicle_id].total_fuel_cost += (f.total_amount || 0);
        
        if (f.odometer_reading) {
          if (f.odometer_reading < vehicleStats[f.vehicle_id].min_odometer) vehicleStats[f.vehicle_id].min_odometer = f.odometer_reading;
          if (f.odometer_reading > vehicleStats[f.vehicle_id].max_odometer) vehicleStats[f.vehicle_id].max_odometer = f.odometer_reading;
        }
        
        vehicleStats[f.vehicle_id].entries.push(f);
      }
    });

    // Populate Fuel & Distance Data from Routes
    filteredRoutes.forEach(r => {
      const vNum = r.fuel_vehicle_number || r.vehicle_number;
      if (vNum) {
        const vehicle = vehicles.find(v => v.vehicle_number === vNum);
        if (vehicle && vehicleStats[vehicle.id]) {
          if (r.distance_km) {
            vehicleStats[vehicle.id].manual_distance += parseFloat(r.distance_km || 0);
          }

          if (r.fuel_quantity_liters > 0) {
            const cost = (r.fuel_quantity_liters || 0) * (r.fuel_rate_per_liter || 0);
            vehicleStats[vehicle.id].total_fuel_liters += (r.fuel_quantity_liters || 0);
            vehicleStats[vehicle.id].total_fuel_cost += cost;
            
            if (r.fuel_odometer_reading) {
              if (r.fuel_odometer_reading < vehicleStats[vehicle.id].min_odometer) vehicleStats[vehicle.id].min_odometer = r.fuel_odometer_reading;
              if (r.fuel_odometer_reading > vehicleStats[vehicle.id].max_odometer) vehicleStats[vehicle.id].max_odometer = r.fuel_odometer_reading;
            }
            
            vehicleStats[vehicle.id].entries.push({
              date: r.fuel_date,
              total_amount: cost,
              quantity_liters: r.fuel_quantity_liters
            });
          }
        }
      }
    });

    // Populate Trip Data
    filteredTrips.forEach(t => {
      if (vehicleStats[t.vehicle_id]) {
        vehicleStats[t.vehicle_id].trip_count += 1;
      }
    });

    // Finalize Calculations
    const finalTableData = [];
    let grandTotalLiters = 0;
    let grandTotalCost = 0;
    let grandTotalDistance = 0;

    Object.values(vehicleStats).forEach(stat => {
      if (stat.entries.length > 0 || stat.trip_count > 0) {
        if (stat.min_odometer !== Number.MAX_SAFE_INTEGER && stat.max_odometer > stat.min_odometer) {
           stat.total_distance = stat.max_odometer - stat.min_odometer;
        } else {
           stat.total_distance = stat.manual_distance > 0 ? stat.manual_distance : (stat.trip_count * 150);
        }

        grandTotalLiters += stat.total_fuel_liters;
        grandTotalCost += stat.total_fuel_cost;
        grandTotalDistance += stat.total_distance;

        stat.mileage = stat.total_fuel_liters > 0 ? (stat.total_distance / stat.total_fuel_liters).toFixed(2) : 0;
        stat.cost_per_km = stat.total_distance > 0 ? (stat.total_fuel_cost / stat.total_distance).toFixed(2) : 0;

        finalTableData.push(stat);
      }
    });

    const summary = {
      total_liters: grandTotalLiters.toFixed(2),
      total_cost: grandTotalCost.toFixed(2),
      total_distance: grandTotalDistance.toFixed(2),
      average_mileage: grandTotalLiters > 0 ? (grandTotalDistance / grandTotalLiters).toFixed(2) : 0
    };

    // Chart Data Generation (Date trend of Fuel Cost)
    const trendMap = {};
    const allEntries = [];
    Object.values(vehicleStats).forEach(s => allEntries.push(...s.entries));

    allEntries.forEach(f => {
      if (!f.date) return;
      const d = new Date(f.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (!trendMap[d]) trendMap[d] = { date: d, Cost: 0, Liters: 0, rawDate: new Date(f.date) };
      trendMap[d].Cost += (f.total_amount || 0);
      trendMap[d].Liters += (f.quantity_liters || 0);
    });
    const trendChartData = Object.values(trendMap).sort((a,b) => a.rawDate - b.rawDate).slice(-14);

    return { finalTableData, summary, trendChartData };
  }, [fuelEntries, routes, trips, vehicles, filters]);

  const { finalTableData, summary, trendChartData } = analysisData;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ vehicle_id: '', driver_id: '', startDate: '', endDate: '' });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Fuel Consumption Analysis Report", 14, 15);
    const tableColumn = ["Vehicle", "Total Fuel (L)", "Total Cost (INR)", "Distance (KM)", "Mileage (KM/L)", "Cost/KM (INR)"];
    const tableRows = [];

    finalTableData.forEach(row => {
      const rowData = [
        row.vehicle_number || '-',
        row.total_fuel_liters.toFixed(2),
        `INR ${row.total_fuel_cost.toFixed(2)}`,
        `${row.total_distance.toLocaleString()} KM`,
        `${row.mileage} KM/L`,
        `INR ${row.cost_per_km}/KM`
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Fuel_Consumption_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = finalTableData.map(row => ({
      "Vehicle": row.vehicle_number,
      "Total Fuel Used (Liters)": row.total_fuel_liters,
      "Total Fuel Cost (INR)": row.total_fuel_cost,
      "Total Distance (KM)": row.total_distance,
      "Average Mileage (KM/L)": row.mileage,
      "Operative Cost per KM (INR)": row.cost_per_km,
      "Trips Count": row.trip_count
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fuel Consumption");
    XLSX.writeFile(workbook, `Fuel_Consumption_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {/* Header Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={24} color="var(--primary)" /> Fuel Consumption Analysis
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Analyze and optimize fuel consumption patterns, track mileage, and investigate vehicle ROI.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          
          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Export
            </button>

            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden' }}>
                <button
                  onClick={() => { exportPDF(); setShowExportMenu(false); }}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <FileText size={16} color="#ef4444" /> PDF Report
                </button>
                <button
                  onClick={() => { exportExcel(); setShowExportMenu(false); }}
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

      {/* Summary Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Droplets size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Fuel Used</h3>
            <div className="value">
              {summary.total_liters} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>L</span>
            </div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Distance</h3>
            <div className="value">
              {Number(summary.total_distance).toLocaleString()} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>KM</span>
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Activity size={24} />
          </div>
          <div className="stat-details">
            <h3>Average Mileage</h3>
            <div className="value">
              {summary.average_mileage} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>KM/L</span>
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Fuel Cost</h3>
            <div className="value">
              ₹ {Number(summary.total_cost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
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
          <select 
            name="vehicle_id" 
            value={filters.vehicle_id} 
            onChange={handleFilterChange} 
            className="form-control"
            style={{ width: 180, margin: 0, height: 38 }}
          >
            <option value="">All Vehicles</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
          </select>
          
          <select 
            name="driver_id" 
            value={filters.driver_id} 
            onChange={handleFilterChange} 
            className="form-control"
            style={{ width: 180, margin: 0, height: 38 }}
          >
            <option value="">All Drivers</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input 
              type="date" 
              name="startDate" 
              value={filters.startDate} 
              onChange={handleFilterChange} 
              className="form-control"
              style={{ width: 140, margin: 0, height: 38 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input 
              type="date" 
              name="endDate" 
              value={filters.endDate} 
              onChange={handleFilterChange} 
              className="form-control"
              style={{ width: 140, margin: 0, height: 38 }}
            />
          </div>

          {(filters.vehicle_id || filters.driver_id || filters.startDate || filters.endDate) && (
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

      {/* Main Grid: Left Trend Chart, Right Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Trend Chart Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="var(--primary)" /> Fuel Usage Trend (Date-wise Expenditure)
          </h3>
          <div style={{ height: 300, width: '100%' }}>
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{fontSize: 11, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" orientation="left" stroke="#10b981" tick={{fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" tick={{fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}L`} />
                  <Tooltip cursor={{fill: 'var(--bg-hover)'}} contentStyle={{background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)'}} />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="Cost" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} name="Cost (₹)" />
                  <Bar yAxisId="right" dataKey="Liters" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} name="Volume (L)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
                Not enough data to graph trends.
              </div>
            )}
          </div>
        </div>

        {/* Table Data */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
             <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
               <Truck size={20} color="var(--text-muted)" /> Individual Vehicle Analysis
             </h3>
             {finalTableData.length > 0 && (
               <span className="badge badge-active" style={{ fontSize: 11 }}>{finalTableData.length} vehicles calculated</span>
             )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Stats</th>
                  <th>Volume & Cost</th>
                  <th>Mileage Computations</th>
                </tr>
              </thead>
              <tbody>
                {finalTableData.map((row, idx) => (
                  <tr key={idx} style={{ transition: 'background 0.2s' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          padding: 8,
                          borderRadius: 10,
                          background: 'rgba(79, 70, 229, 0.08)',
                          color: 'var(--primary)'
                        }}>
                          <Truck size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>
                            {row.vehicle_number}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            VHC-{row.vehicle_id.toString().padStart(3, '0')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 16 }}>
                         <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Distance</div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.total_distance.toLocaleString()} KM</div>
                         </div>
                         <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Trips</div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.trip_count}</div>
                         </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                         <Droplets size={14} style={{ color: '#3b82f6' }} /> {row.total_fuel_liters.toFixed(2)} L
                      </div>
                      <div style={{ fontWeight: 700, color: '#e11d48', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                         <IndianRupee size={14} /> {row.total_fuel_cost.toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ 
                          background: 'rgba(16, 185, 129, 0.08)', 
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          padding: '6px 12px', 
                          borderRadius: 8
                        }}>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#047857' }}>Mileage</div>
                          <div style={{ fontWeight: 800, color: '#10b981', fontSize: 14 }}>
                            {row.mileage} <span style={{ fontSize: 10, fontWeight: 600 }}>KM/L</span>
                          </div>
                        </div>
                        <div style={{ 
                          background: 'rgba(244, 63, 94, 0.08)', 
                          border: '1px solid rgba(244, 63, 94, 0.2)',
                          padding: '6px 12px', 
                          borderRadius: 8
                        }}>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#be123c' }}>Cost / KM</div>
                          <div style={{ fontWeight: 800, color: '#f43f5e', fontSize: 14 }}>
                            ₹{row.cost_per_km}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {finalTableData.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                       No fuel analysis data matches your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelConsumption;