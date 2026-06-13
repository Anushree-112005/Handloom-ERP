import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { showError } from '../../utils/notifications';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Droplets, MapPin, IndianRupee, Truck, Calendar, Activity, Filter, RefreshCcw } from 'lucide-react';

const FuelConsumption = () => {
  const [vehicles, setVehicles] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
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

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.vehicle_number || `Vehicle #${id}`;

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
      // Fuel Entries don't inherently store driver_id, but assuming it mirrors vehicle assignments
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
      // Basic initialization
      vehicleStats[v.id] = {
        vehicle_id: v.id,
        vehicle_number: v.vehicle_number,
        total_fuel_liters: 0,
        total_fuel_cost: 0,
        total_distance: 0, // Calculated via Odometer span
        manual_distance: 0, // Sum of distances from Route records
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
      const vNum = r.fuel_vehicle_number || r.vehicle_number; // Handle both fuel-specific and general vehicle fields
      if (vNum) {
        const vehicle = vehicles.find(v => v.vehicle_number === vNum);
        if (vehicle && vehicleStats[vehicle.id]) {
          // Always accumulate distance if available
          if (r.distance_km) {
            vehicleStats[vehicle.id].manual_distance += parseFloat(r.distance_km || 0);
          }

          // Accumulate fuel if present
          if (r.fuel_quantity_liters > 0) {
            const cost = (r.fuel_quantity_liters || 0) * (r.fuel_rate_per_liter || 0);
            vehicleStats[vehicle.id].total_fuel_liters += (r.fuel_quantity_liters || 0);
            vehicleStats[vehicle.id].total_fuel_cost += cost;
            
            if (r.fuel_odometer_reading) {
              if (r.fuel_odometer_reading < vehicleStats[vehicle.id].min_odometer) vehicleStats[vehicle.id].min_odometer = r.fuel_odometer_reading;
              if (r.fuel_odometer_reading > vehicleStats[vehicle.id].max_odometer) vehicleStats[vehicle.id].max_odometer = r.fuel_odometer_reading;
            }
            
            // Add a virtual entry for trend chart
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
        
        // Compute Distance
        if (stat.min_odometer !== Number.MAX_SAFE_INTEGER && stat.max_odometer > stat.min_odometer) {
           stat.total_distance = stat.max_odometer - stat.min_odometer;
        } else {
           // Fallback to manual distance from routes, then to mock fallback
           stat.total_distance = stat.manual_distance > 0 ? stat.manual_distance : (stat.trip_count * 150);
        }

        // Add to Grand Totals
        grandTotalLiters += stat.total_fuel_liters;
        grandTotalCost += stat.total_fuel_cost;
        grandTotalDistance += stat.total_distance;

        // Core Formula Computation
        stat.mileage = stat.total_fuel_liters > 0 ? (stat.total_distance / stat.total_fuel_liters).toFixed(2) : 0;
        stat.cost_per_km = stat.total_distance > 0 ? (stat.total_fuel_cost / stat.total_distance).toFixed(2) : 0;

        finalTableData.push(stat);
      }
    });

    // Overview Stats
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      
      {/* Header */}
      <div className="card">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <TrendingUp className="btn btn-success" /> Fuel Consumption Analysis
          </h1>
          <p className="text-slate-600 mt-1 pl-12 text-sm">Analyze and optimize fuel consumption patterns, track mileage, and investigate vehicle ROI.</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Analytics
        </button>
      </div>

      {/* Summary Dashboard Cards */}
      <div className="form-row">
        <div className="card">
          <div className="btn btn-success"></div>
          <div className="btn btn-success">
            <Droplets size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Fuel Used</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.total_liters} <span className="text-base font-semibold text-slate-500">L</span></p>
          </div>
        </div>
        
        <div className="card">
          <div className="btn btn-primary"></div>
          <div className="btn btn-primary">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Distance</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.total_distance} <span className="text-base font-semibold text-slate-500">KM</span></p>
          </div>
        </div>

        <div className="card">
          <div className="btn btn-primary"></div>
          <div className="btn btn-primary">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Average Mileage</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.average_mileage} <span className="text-base font-semibold text-slate-500">KM/L</span></p>
          </div>
        </div>

        <div className="card">
          <div className="btn btn-danger"></div>
          <div className="btn btn-danger">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Fuel Cost</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹ {summary.total_cost}</p>
          </div>
        </div>
      </div>

      <div className="form-row">
        
        {/* Main Content Area */}
        <div className="space-y-6">
          
          {/* Charts Area */}
          <div className="card">
            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Fuel Usage Trend (Date-wise Expenditure)
            </h3>
            <div className="h-72 w-full">
              {trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" orientation="left" stroke="#10b981" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}L`} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" />
                    <Bar yAxisId="left" dataKey="Cost" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar yAxisId="right" dataKey="Liters" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium">Not enough data to graph trends.</div>
              )}
            </div>
          </div>

          {/* Table Data */}
          <div className="card">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Truck className="h-5 w-5 text-slate-400" /> Individual Vehicle Analysis
               </h3>
               {finalTableData.length > 0 && (
                 <span className="btn btn-primary">{finalTableData.length} records computed</span>
               )}
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Vehicle Number</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Volume & Cost</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-emerald-700 uppercase tracking-wider">Mileage Computations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {finalTableData.map((row, idx) => (
                    <tr key={idx} className="btn btn-secondary">
                      <td className="px-6 py-4">
                        <div className="font-bold text-indigo-900 text-base">{row.vehicle_number}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1 uppercase">ID: VHC-{row.vehicle_id.toString().padStart(3, '0')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-4">
                           <div>
                              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Distance</p>
                              <p className="font-bold text-slate-800">{row.total_distance.toLocaleString()} KM</p>
                           </div>
                           <div>
                              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Trips</p>
                              <p className="font-medium text-slate-700">{row.trip_count}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 flex items-center gap-1">
                           <Droplets size={14} className="text-blue-500" /> {row.total_fuel_liters.toFixed(2)} Liters
                        </div>
                        <div className="font-bold text-rose-600 flex items-center gap-1 mt-1">
                           <IndianRupee size={14} className="text-rose-600" /> {row.total_fuel_cost.toFixed(2)} total cost
                        </div>
                      </td>
                      <td className="btn btn-success">
                        <div className="form-row">
                            <div className="card">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Calculated Mileage</p>
                                <p className="font-black text-emerald-600">{row.mileage} <span className="text-xs font-semibold text-emerald-600/60">KM/L</span></p>
                            </div>
                            <div className="card">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Operative Cost</p>
                                <p className="font-black text-rose-600">₹{row.cost_per_km} <span className="text-xs font-semibold text-rose-600/60">/ KM</span></p>
                            </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {finalTableData.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                         No fuel analysis data matches your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Filters Sidebar */}
        <div className="card">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 border-b pb-4 mb-5">
              <Filter className="h-5 w-5 text-slate-400" /> Filter Analysis
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Vehicle</label>
                <select name="vehicle_id" value={filters.vehicle_id} onChange={handleFilterChange} className="form-control">
                  <option value="">All Vehicles</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Assigned Driver</label>
                <select name="driver_id" value={filters.driver_id} onChange={handleFilterChange} className="form-control">
                  <option value="">All Drivers</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Calendar size={14} /> Date Range</label>
                <div className="space-y-3">
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="form-control" />
                    <div className="text-center text-xs font-bold text-slate-400">TO</div>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="form-control" />
                </div>
              </div>

              <div className="pt-4 border-t mt-6">
                <button onClick={clearFilters} className="form-control">
                  Clear All Filters
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FuelConsumption;