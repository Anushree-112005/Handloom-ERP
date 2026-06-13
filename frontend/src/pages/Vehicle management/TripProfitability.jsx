import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Filter, Calendar, Truck, User, 
  MapPin, Clock, Gauge, ArrowUpRight, Download, RefreshCw,
  TrendingDown, PieChart as PieChartIcon, Activity, Receipt,
  Wallet, Landmark
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import api from '../../services/api';
import { showError } from '../../utils/notifications';

const TripProfitability = () => {
  const [data, setData] = useState({ summary: {}, details: [] });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    vehicleId: '',
    driverId: '',
    tripId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStaticData();
    fetchReport();
  }, []);

  const fetchStaticData = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/fleet/vehicles'),
        api.get('/fleet/drivers')
      ]);
      setVehicles(vRes.data || []);
      setDrivers(dRes.data || []);
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
      if (filters.tripId) params.append('trip_id', filters.tripId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      
      const res = await api.get(`/fleet/profitability-report?${params.toString()}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      showError('Failed to load profitability report');
    } finally {
      setLoading(false);
    }
  };

  const expenseSplitData = useMemo(() => {
    if (!data.details.length) return [];
    const totals = data.details.reduce((acc, curr) => ({
      fuel: acc.fuel + curr.fuel_cost,
      driver: acc.driver + curr.driver_cost,
      toll: acc.toll + curr.toll_charges,
      maint: acc.maint + curr.maintenance_cost,
      other: acc.other + curr.other_expenses
    }), { fuel: 0, driver: 0, toll: 0, maint: 0, other: 0 });

    return [
      { name: 'Fuel', value: totals.fuel, color: '#ef4444' },
      { name: 'Driver', value: totals.driver, color: '#f59e0b' },
      { name: 'Tolls', value: totals.toll, color: '#6366f1' },
      { name: 'Maintenance', value: totals.maint, color: '#10b981' },
      { name: 'Other', value: totals.other, color: '#94a3b8' }
    ].filter(item => item.value > 0);
  }, [data.details]);

  const profitTrendData = useMemo(() => {
    return data.details.slice(-10).map(d => ({
      name: d.trip_number,
      profit: d.profit,
      margin: d.profit_margin
    }));
  }, [data.details]);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="btn btn-success">
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-emerald-800">
                Trip Profitability Analysis
              </h1>
              <p className="text-slate-500 font-medium">Evaluate revenue vs expense breakdown per trip</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchReport} className="btn btn-secondary">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn btn-success">
              <Download size={18} /> Export Financials
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="form-row">
        {[
          { label: 'Total Trips', value: data.summary.total_trips || 0, icon: Activity, color: 'indigo' },
          { label: 'Total Revenue', value: `₹${(data.summary.total_revenue || 0).toLocaleString()}`, icon: Wallet, color: 'emerald' },
          { label: 'Total Expenses', value: `₹${(data.summary.total_expenses || 0).toLocaleString()}`, icon: Receipt, color: 'rose' },
          { label: 'Total Profit', value: `₹${(data.summary.total_profit || 0).toLocaleString()}`, icon: Landmark, color: 'blue' }
        ].map((stat, idx) => (
          <div key={idx} className="card">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700`} />
            <div className="card-header">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:rotate-12 transition-transform duration-300`}>
                <stat.icon size={24} />
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
                Live Data
              </div>
            </div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-none mb-2">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Filter size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-900 tracking-tight uppercase text-xs">Analysis Filters</h3>
          </div>
          <div className="form-row">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle</label>
              <select 
                className="form-control"
                value={filters.vehicleId}
                onChange={(e) => setFilters({...filters, vehicleId: e.target.value})}
              >
                <option value="">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver</label>
              <select 
                className="form-control"
                value={filters.driverId}
                onChange={(e) => setFilters({...filters, driverId: e.target.value})}
              >
                <option value="">All Drivers</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
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
                Run Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Charts */}
      <div className="form-row">
        <div className="card">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-8">
            <TrendingUp className="text-emerald-600" size={20} />
            Profit Margin Trend (%)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6, stroke: '#fff', strokeWidth: 2}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-8">
            <PieChartIcon className="text-indigo-600" size={20} />
            Expense Distribution
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseSplitData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseSplitData.map((entry, index) => (
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
          <h3 className="font-bold text-slate-900 tracking-tight">Trip-wise Profitability Matrix</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Segment</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="card">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Trip Info</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Distance</th>
                <th className="btn btn-success">Revenue</th>
                <th className="btn btn-danger">Expense Segments (₹)</th>
                <th className="btn btn-primary">Tot. Exp</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">Net Profit</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.details.map((trip, idx) => (
                <tr key={idx} className="btn btn-secondary">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-tight">{trip.trip_number}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Truck size={12} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-500">{trip.vehicle_number}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{trip.distance_km} KM</span>
                      <span className="text-[10px] text-slate-400 font-medium">{trip.route_name}</span>
                    </div>
                  </td>
                  <td className="btn btn-success">
                    ₹{trip.revenue.toLocaleString()}
                  </td>
                  <td className="btn btn-danger">
                    <div className="flex justify-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Fuel</span>
                        <span className="text-[11px] font-bold text-rose-500">₹{trip.fuel_cost}</span>
                      </div>
                      <div className="btn btn-secondary">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Driver</span>
                        <span className="text-[11px] font-bold text-amber-600">₹{trip.driver_cost}</span>
                      </div>
                      <div className="btn btn-secondary">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Toll</span>
                        <span className="text-[11px] font-bold text-indigo-500">₹{trip.toll_charges}</span>
                      </div>
                      <div className="btn btn-secondary">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Maint</span>
                        <span className="text-[11px] font-bold text-emerald-600">₹{trip.maintenance_cost}</span>
                      </div>
                    </div>
                  </td>
                  <td className="btn btn-danger">
                    ₹{trip.total_expense.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col">
                      <span className={`font-black text-sm tracking-tight ${trip.profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        ₹{trip.profit.toLocaleString()}
                      </span>
                      <div className="flex items-center justify-end gap-1 text-[10px] font-black text-slate-400">
                        {trip.profit >= 0 ? <TrendingUp size={10} className="text-emerald-500" /> : <TrendingDown size={10} className="text-rose-500" />}
                        {trip.profit_margin}% Margin
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm ${
                        trip.status === 'High Profit' 
                          ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
                          : trip.status === 'Low Profit'
                          ? 'text-amber-700 bg-amber-100 border-amber-200'
                          : 'text-rose-700 bg-rose-100 border-rose-200'
                      }`}>
                        {trip.status}
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
                        <DollarSign size={32} />
                      </div>
                      <h4 className="text-slate-900 font-bold mb-1 tracking-tight">No Financial Records Found</h4>
                      <p className="text-slate-500 text-sm">Please check the filters or complete more trips to see profitability data.</p>
                      <button onClick={fetchReport} className="btn btn-secondary">
                        Reload Analysis
                      </button>
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

export default TripProfitability;