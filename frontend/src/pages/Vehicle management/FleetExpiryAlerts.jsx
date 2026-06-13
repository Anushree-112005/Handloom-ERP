import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Calendar, Search, Filter, Truck, User, 
  ArrowUpRight, Download, RefreshCw,
  Bell, ShieldAlert, CheckCircle2, Clock
} from 'lucide-react';
import api from '../../services/api';
import { showError } from '../../utils/notifications';

const ExpiryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    documentType: '',
    vehicle: '',
    driver: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    expired: 0,
    expiringSoon: 0,
    valid: 0,
    blocking: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/fleet/expiry-alerts'),
        api.get('/fleet/vehicles'),
        api.get('/fleet/drivers')
      ]);
      
      const alertsData = alertsRes.data || [];
      setAlerts(alertsData);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);

      // Calculate stats
      const newStats = alertsData.reduce((acc, curr) => {
        acc.total++;
        if (curr.status === 'Expired') acc.expired++;
        else if (curr.status === 'Expiring Soon') acc.expiringSoon++;
        else acc.valid++;
        
        if (curr.is_blocking) acc.blocking++;
        return acc;
      }, { total: 0, expired: 0, expiringSoon: 0, valid: 0, blocking: 0 });
      
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load expiry data:', error);
      showError('Failed to load expiry alerts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Expired': 
        return <span className="btn btn-danger">
          <div className="btn btn-danger" /> Expired
        </span>;
      case 'Expiring Soon': 
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
          <div className="h-1.5 w-1.5 rounded-full bg-orange-600" /> Expiring Soon
        </span>;
      default: 
        return <span className="btn btn-success">
          <div className="btn btn-success" /> Valid
        </span>;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchDocType = !filters.documentType || alert.document_type.toLowerCase().includes(filters.documentType.toLowerCase());
    const matchVehicle = !filters.vehicle || (alert.vehicle_number && alert.vehicle_number === filters.vehicle);
    const matchDriver = !filters.driver || (alert.driver_name && alert.driver_name === filters.driver);
    const matchStatus = !filters.status || alert.status === filters.status;
    
    // Date range filter
    const expiryDate = new Date(alert.expiry_date);
    const matchDateRange = (!filters.startDate || expiryDate >= new Date(filters.startDate)) &&
                          (!filters.endDate || expiryDate <= new Date(filters.endDate));

    return matchDocType && matchVehicle && matchDriver && matchStatus && matchDateRange;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 shadow-sm">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expiry Alerts</h1>
              <p className="text-slate-500 font-medium">Monitor and manage document compliance across your fleet</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="btn btn-secondary">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn btn-secondary">
              <Download size={18} /> Export Report
            </button>
          </div>
        </div>

        {/* Blocking Alert Bar */}
        {stats.blocking > 0 && (
          <div className="btn btn-danger">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <p className="text-red-900 font-bold">Critical Compliance Issues Found</p>
              <p className="text-red-700 text-sm">{stats.blocking} documents are expired. Impacted vehicles have been automatically blocked from trip planning.</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="form-row">
        {[
          { label: 'Total Scanned', value: stats.total, icon: Bell, color: 'slate' },
          { label: 'Expired', value: stats.expired, icon: AlertCircle, color: 'red' },
          { label: 'Expiring Soon', value: stats.expiringSoon, icon: Clock, color: 'orange' },
          { label: 'Documents Valid', value: stats.valid, icon: CheckCircle2, color: 'emerald' }
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

      {/* Filters Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Filter size={18} className="text-indigo-600" />
          <h3 className="font-bold text-slate-900">Advanced Filters</h3>
        </div>
        <div className="form-row">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Doc Type</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="RC, Insurance..." 
                className="form-control"
                value={filters.documentType}
                onChange={(e) => setFilters({...filters, documentType: e.target.value})}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle</label>
            <select 
              className="form-control"
              value={filters.vehicle}
              onChange={(e) => setFilters({...filters, vehicle: e.target.value})}
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.vehicle_number}>{v.vehicle_number}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver</label>
            <select 
              className="form-control"
              value={filters.driver}
              onChange={(e) => setFilters({...filters, driver: e.target.value})}
            >
              <option value="">All Drivers</option>
              {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
            <select 
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">All Statuses</option>
              <option value="Expired">Expired 🔴</option>
              <option value="Expiring Soon">Expiring Soon 🟠</option>
              <option value="Valid">Valid 🟢</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
            <input 
              type="date" 
              className="form-control"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Date</label>
            <input 
              type="date" 
              className="form-control"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Main Alerts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="btn btn-secondary">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Resource / Vehicle</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Document Detail</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Expiration Info</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length > 0 ? filteredAlerts.map((alert, idx) => (
                <tr key={idx} className="btn btn-secondary">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border transition-colors ${alert.driver_name ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        {alert.driver_name ? <User size={20} /> : <Truck size={20} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none mb-1 text-sm">{alert.vehicle_number || alert.driver_name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">
                            {alert.driver_name ? 'Personnel' : alert.data_source} Document
                          </span>
                          {alert.is_blocking && <span className="btn btn-danger" title="Vehicle Blocked" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-700 text-sm mb-0.5">{alert.document_type}</p>
                    <p className="btn btn-secondary">{alert.document_number}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-1.5">
                       <Calendar size={14} className="text-slate-400" />
                       <span className={`text-sm font-black ${alert.status === 'Expired' ? 'text-red-500' : alert.status === 'Expiring Soon' ? 'text-orange-500' : 'text-slate-600'}`}>
                         {new Date(alert.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </span>
                    </div>
                    <p className={`text-xs font-bold leading-none pl-5 ${alert.days_remaining < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                       {alert.days_remaining < 0 
                         ? `Overdue by ${Math.abs(alert.days_remaining)} days`
                         : `${alert.days_remaining} days remaining`}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      {getStatusBadge(alert.status)}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="btn btn-secondary">
                        <Clock size={40} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-1">No Alerts Found</h4>
                      <p className="text-slate-500 text-sm">All scanned documents are currently valid and compliant. We'll alert you when anything expires.</p>
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

export default ExpiryAlerts;