import React, { useState, useEffect, useMemo } from 'react';
import { 
  Fuel, BarChart3, TrendingUp, Filter, Calendar, Truck, 
  ArrowRight, Download, RefreshCw, Activity, Zap, 
  DollarSign, Gauge, Navigation
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
import { showError } from '../../utils/notifications';

const DieselKmReport = () => {
  const [data, setData] = useState({ summary: {}, details: [] });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    vehicleId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchVehicles();
    fetchReport();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/fleet/vehicles');
      setVehicles(res.data || []);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.vehicleId) params.append('vehicle_id', filters.vehicleId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      
      const res = await api.get(`/fleet/diesel-km-report?${params.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch diesel report:', error);
      showError('Failed to load diesel vs km report');
    } finally {
      setLoading(false);
    }
  };

  const mileageTrendData = useMemo(() => {
    return [...data.details].reverse().map(d => ({
      date: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      mileage: d.mileage,
      vehicle: d.vehicle_number
    }));
  }, [data.details]);

  const vehicleComparisonData = useMemo(() => {
    const vMap = {};
    data.details.forEach(d => {
      if (!vMap[d.vehicle_number]) vMap[d.vehicle_number] = { name: d.vehicle_number, totalDist: 0, totalFuel: 0 };
      vMap[d.vehicle_number].totalDist += d.distance_km;
      vMap[d.vehicle_number].totalFuel += d.fuel_liters;
    });

    return Object.values(vMap).map(v => ({
      name: v.name,
      mileage: parseFloat((v.totalDist / v.totalFuel).toFixed(2))
    })).sort((a, b) => b.mileage - a.mileage);
  }, [data.details]);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm animate-pulse-slow">
              <Fuel className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tightest">
                Diesel <span className="text-orange-600">vs</span> KM Matrix
              </h1>
              <p className="text-slate-500 font-bold text-sm tracking-wide">Precise fuel efficiency tracking and mileage analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchReport}
              className="btn btn-secondary"
            >
              <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn btn-secondary">
              <Download size={20} /> Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="form-row">
        {[
          { label: 'Total Distance', value: `${(data.summary.total_distance || 0).toLocaleString()} KM`, icon: Navigation, color: '#6366f1', bg: 'bg-indigo-50' },
          { label: 'Total Fuel Used', value: `${(data.summary.total_fuel_liters || 0).toLocaleString()} L`, icon: Fuel, color: '#f97316', bg: 'bg-orange-50' },
          { label: 'Average Mileage', value: `${data.summary.avg_mileage || 0} km/L`, icon: Gauge, color: '#10b981', bg: 'bg-emerald-50' },
          { label: 'Total Fuel Cost', value: `₹${(data.summary.total_fuel_cost || 0).toLocaleString()}`, icon: DollarSign, color: '#f43f5e', bg: 'bg-rose-50' }
        ].map((stat, idx) => (
          <div key={idx} className="card">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500 opacity-60`} />
            <div className="relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg} w-fit mb-4 text-slate-900 shadow-sm`}>
                <stat.icon size={26} style={{color: stat.color}} />
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h3>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 w-1/2" />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase">Baseline</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="form-row">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Truck size={14} className="text-orange-500" /> Selective Vehicle
            </label>
            <MasterDropdown
              value={filters.vehicleId}
              onChange={(val) => setFilters({...filters, vehicleId: val})}
              options={[
                { value: '', label: 'All Fleet Vehicles' },
                ...vehicles.map(v => ({ value: v.id, label: `${v.vehicle_number} (${v.model || ''})` }))
              ]}
              placeholder="All Fleet Vehicles"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Calendar size={14} className="text-orange-500" /> Start Window
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
              <Calendar size={14} className="text-orange-500" /> End Window
            </label>
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
              Update Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="form-row">
        <div className="card">
          <div className="card-header">
            <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-xs tracking-widest">
              <Zap className="text-orange-600" size={18} />
              Efficiency Trend
            </h3>
            <span className="bg-slate-100 text-[10px] font-black px-2 py-1 rounded text-slate-500 uppercase tracking-tighter">km/liter</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mileageTrendData}>
                <defs>
                  <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900}}
                />
                <Area type="monotone" dataKey="mileage" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorMileage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase text-xs tracking-widest">
              <Truck className="text-indigo-600" size={18} />
              Vehicle Comparisons
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleComparisonData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900}}
                />
                <Bar dataKey="mileage" radius={[10, 10, 10, 10]} barSize={24}>
                  {vehicleComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mileage > 15 ? '#10b981' : entry.mileage > 10 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="card">
        <div className="btn btn-secondary">
          <div>
            <h3 className="font-black text-slate-900 tracking-tight text-lg">Fuel Consumption Registry</h3>
            <p className="text-slate-400 text-xs font-bold mt-1">Detailed odometer and fuel data for fleet analysis</p>
          </div>
          <div className="flex gap-2">
            <div className="btn btn-success">
               <div className="btn btn-success" />
               <span className="text-[10px] font-black text-emerald-700">GOOD EFFICIENCY</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="btn btn-secondary">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Vehicle</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Odometer Space</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Distance</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Fuel Loaded</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cost</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-emerald-600">Mileage</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-rose-500 text-right">Cost/KM</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.details.map((entry, idx) => (
                <tr key={idx} className="btn btn-secondary">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs ring-2 ring-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                        {new Date(entry.date).getDate()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 leading-tight tracking-tight">{entry.vehicle_number}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter leading-none mt-1">
                          {new Date(entry.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 group/odo">
                       <span className="text-xs font-black text-slate-400">{entry.start_km}</span>
                       <ArrowRight size={12} className="text-slate-300 transform group-hover/odo:translate-x-1 transition-transform" />
                       <span className="text-xs font-black text-slate-900">{entry.end_km}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-black text-slate-900 text-sm">{entry.distance_km} KM</td>
                  <td className="px-6 py-6 font-black text-slate-900 text-sm tracking-tighter">{entry.fuel_liters} L</td>
                  <td className="px-6 py-6 font-black text-slate-900 text-sm">₹{entry.fuel_cost.toLocaleString()}</td>
                  <td className="px-6 py-6">
                    <div className="btn btn-success">
                      {entry.mileage} km/L
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right font-black text-rose-600 text-sm tracking-tighter italic">₹{entry.cost_per_km} / km</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 shadow-sm ${
                        entry.status === 'Good' 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                          : entry.status === 'Average'
                          ? 'text-amber-700 bg-amber-50 border-amber-100'
                          : 'text-rose-700 bg-rose-50 border-rose-100'
                      }`}>
                        {entry.status} Efficiency
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {data.details.length === 0 && !loading && (
                <tr>
                   <td colSpan="8" className="px-8 py-32 text-center">
                     <div className="max-w-xs mx-auto space-y-4">
                       <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-slate-300 ring-4 ring-white shadow-inner">
                         <Fuel size={40} />
                       </div>
                       <div>
                         <h4 className="text-slate-900 font-black tracking-tight uppercase text-sm">No Fuel Logs Found</h4>
                         <p className="text-slate-400 text-xs font-bold leading-relaxed px-4">There are no fuel entries recorded for the selected criteria in the system.</p>
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
    </div>
  );
};

export default DieselKmReport;