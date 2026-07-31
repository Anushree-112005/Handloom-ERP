import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Filter, Calendar, Truck, User, 
  MapPin, Clock, Gauge, ArrowUpRight, Download, RefreshCw,
  Activity, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
import { showError } from '../../utils/notifications';

const VehicleUtilization = () => {
  const [data, setData] = useState({ summary: {}, details: [] });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    vehicleId: '',
    driverId: '',
    routeId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStaticData();
    fetchReport();
  }, []);

  const fetchStaticData = async () => {
    try {
      const [vRes, dRes, rRes] = await Promise.all([
        api.get('/fleet/vehicles'),
        api.get('/fleet/drivers'),
        api.get('/fleet/routes')
      ]);
      setVehicles(vRes.data || []);
      setDrivers(dRes.data || []);
      setRoutes(rRes.data || []);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.vehicleId) params.append('vehicle_id', filters.vehicleId);
      if (filters.driverId) params.append('driver_id', filters.driverId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      
      const res = await api.get(`/fleet/utilization-report?${params.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      showError('Failed to load utilization report');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return data.details.map(d => ({
      name: d.vehicle_number,
      utilization: d.utilization_percentage,
      trips: d.total_trips
    })).sort((a, b) => b.utilization - a.utilization).slice(0, 8);
  }, [data.details]);

  const pieData = useMemo(() => [
    { name: 'Active', value: data.summary.active_vehicles || 0, color: '#10b981' },
    { name: 'Idle', value: data.summary.idle_vehicles || 0, color: '#ef4444' }
  ], [data.summary]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Efficient': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'Moderate': return 'text-orange-700 bg-orange-100 border-orange-200';
      default: return 'text-red-700 bg-red-100 border-red-200';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="btn btn-primary">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vehicle Utilization</h1>
              <p className="text-slate-500 font-medium">Detailed usage analytics and efficiency metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchReport} className="btn btn-secondary">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn btn-secondary">
              <Download size={18} /> Export Stats
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="form-row">
        {[
          { label: 'Total Vehicles', value: data.summary.total_vehicles || 0, icon: Truck, color: 'indigo' },
          { label: 'Active (Assigned)', value: data.summary.active_vehicles || 0, icon: Activity, color: 'emerald' },
          { label: 'Idle Vehicles', value: data.summary.idle_vehicles || 0, icon: Clock, color: 'rose' },
          { label: 'Avg Utilization', value: `${data.summary.avg_utilization_percentage || 0}%`, icon: Gauge, color: 'amber' }
        ].map((stat, idx) => (
          <div key={idx} className="card">
            <div className="card-header">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight className="text-slate-300 group-hover:text-slate-500 transition-colors" size={20} />
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-none mb-2">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Filter size={18} className="text-indigo-600" />
          <h3 className="font-bold text-slate-900">Report Conditions</h3>
        </div>
        <div className="form-row">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle</label>
            <MasterDropdown
              value={filters.vehicleId}
              onChange={(val) => setFilters({...filters, vehicleId: val})}
              options={[
                { value: '', label: 'All Vehicles' },
                ...vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))
              ]}
              placeholder="--- All Vehicles ---"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver</label>
            <MasterDropdown
              value={filters.driverId}
              onChange={(val) => setFilters({...filters, driverId: val})}
              options={[
                { value: '', label: 'All Drivers' },
                ...drivers.map(d => ({ value: d.id, label: d.driver_name || d.name }))
              ]}
              placeholder="--- All Drivers ---"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">From Date</label>
            <input 
              type="date" 
              className="form-control"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">To Date</label>
            <input 
              type="date" 
              className="form-control"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={fetchReport}
              className="form-control"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="form-row">
        <div className="btn btn-secondary">
          <div className="card-header">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={20} />
              Top Vehicle Utilization (%)
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="utilization" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.utilization > 75 ? '#10b981' : entry.utilization >= 40 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-8">
            <PieChartIcon className="text-indigo-600" size={20} />
            Fleet Status Split
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="card">
        <div className="btn btn-secondary">
          <h3 className="font-bold text-slate-900">Vehicle Usage Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="btn btn-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Vehicle</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Trips</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Distance (KM)</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Running Time</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Idle Time</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Utilization %</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Efficiency Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.details.map((detail, idx) => (
                <tr key={idx} className="btn btn-secondary">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="btn btn-primary">
                        <Truck size={18} />
                      </div>
                      <span className="font-black text-slate-900 tracking-tight">{detail.vehicle_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{detail.total_trips}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{detail.total_distance_km} km</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{detail.total_running_time_hours} hrs</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-400">{detail.idle_time_hours} hrs</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${detail.utilization_percentage > 75 ? 'bg-emerald-500' : detail.utilization_percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{width: `${Math.min(100, detail.utilization_percentage)}%`}}
                        />
                      </div>
                      <span className="text-[11px] font-black text-slate-900">{detail.utilization_percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(detail.status)}`}>
                        {detail.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {data.details.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="btn btn-secondary">
                        <Activity size={32} />
                      </div>
                      <h4 className="text-slate-900 font-bold mb-1">No Usage Data Found</h4>
                      <p className="text-slate-500 text-sm">There are no completed trips recorded for the selected period.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VehicleUtilization;
