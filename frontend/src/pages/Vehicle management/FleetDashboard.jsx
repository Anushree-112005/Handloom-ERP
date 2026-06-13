import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Truck,
  MapPin,
  Fuel,
  Wrench,
  AlertTriangle,
  FileText,
  TrendingUp,
  Activity,
  Calendar,
  Radio,
  Clock,
  Power
} from 'lucide-react';

const FleetDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    total_vehicles: 0,
    active_trips: 0,
    fuel_cost_today: 0,
    breakdown_vehicles: 0,
    expiring_documents: 0,
    total_drivers: 0,
    completed_trips_today: 0,
    total_revenue: 0,
    idle_vehicles: 0,
    stopped_vehicles: 0,
    recent_activities: []
  });
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, vehiclesRes] = await Promise.all([
          api.get('/fleet/stats'),
          api.get('/fleet/vehicles')
        ]);
        setDashboardData(statsRes.data);
        const vList = vehiclesRes.data.items || vehiclesRes.data || [];
        setVehicles(vList);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const recentActivities = dashboardData.recent_activities || [];

  const quickActions = [
    { label: 'New Trip', icon: MapPin, path: '/fleet/trip-planning', color: 'bg-blue-500' },
    { label: 'Fuel Entry', icon: Fuel, path: '/fleet/fuel-entry', color: 'bg-green-500' },
    { label: 'Breakdown Entry', icon: Wrench, path: '/fleet/breakdown-entry', color: 'bg-red-500' },
    { label: 'Add Vehicle', icon: Truck, path: '/fleet/vehicles', color: 'bg-purple-500' }
  ];

  const operationalMetrics = [
    {
      title: 'Total Vehicles',
      value: dashboardData.total_vehicles || 0,
      icon: Truck,
      color: 'bg-blue-500',
      change: 'Active inventory'
    },
    {
      title: 'Running',
      value: dashboardData.active_trips || 0,
      icon: MapPin,
      color: 'bg-green-500',
      change: 'Currently moving'
    },
    {
      title: 'Idle',
      value: dashboardData.idle_vehicles || 0,
      icon: Clock,
      color: 'bg-orange-500',
      change: 'Engine on, no movement'
    },
    {
      title: 'Stopped',
      value: dashboardData.stopped_vehicles || 0,
      icon: Power,
      color: 'bg-red-500',
      change: 'Engine off'
    },
    {
      title: 'Expiring Docs',
      value: dashboardData.expiring_documents || 0,
      icon: FileText,
      color: 'bg-yellow-500',
      change: 'Action required'
    }
  ];



  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-600" />
              Fleet Management Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Monitor and manage your vehicle fleet operations</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div className="form-row">
        {operationalMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
                </div>
                <div className={`${metric.color} p-3 rounded-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Live Track Button Section (Matches User Image) */}
      <div className="flex justify-center py-4">
        <button
          onClick={() => window.open('https://navilap.com/gps/', '_blank')}
          className="group relative flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <span className="tracking-wide">Live Track</span>
          <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-widest border border-white/30 ml-2">
            GPS
          </span>
        </button>
      </div>

      {/* Recent Activities & Fleet List (Matches User Image precisely) */}
      <div className="card">
        <div className="btn btn-secondary">
          <div className="flex items-center gap-3">
             <div className="btn btn-primary">
                <Activity className="h-5 w-5" />
             </div>
             <div>
                <h3 className="font-bold text-slate-800">Live Fleet Status</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Tracking {vehicles.length} Units</p>
             </div>
          </div>
          <div className="relative">
             <input 
                type="text" 
                placeholder="Search truck number, make or model..." 
                className="btn btn-secondary"
             />
             <Activity className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4">Live Speed</th>
                <th className="px-6 py-4">Document Expiry</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.slice(0, 5).map((vehicle, idx) => {
                // Mock statuses for demo consistency with image
                const statuses = [
                  { label: 'IGNITION ON', color: 'bg-green-500', speed: '7 km/h' },
                  { label: 'IGNITION OFF', color: 'bg-red-500', speed: '0 km/h' },
                  { label: 'IDLE', color: 'bg-orange-500', speed: '0 km/h' }
                ];
                const status = statuses[idx % 3];
                
                return (
                  <tr key={vehicle.id} className="btn btn-secondary">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 uppercase">{vehicle.vehicle_number}</div>
                          <div className="text-xs text-slate-500">{vehicle.make} {vehicle.model}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className={`w-2.5 h-2.5 rounded-full ${status.color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`}></span>
                           <span className="text-xs font-bold text-slate-700">{status.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium ml-4">4:50:27 PM</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-bold">{status.speed}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">Insurance:</span>
                             <span className="btn btn-success">6/1/2026</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">Fitness:</span>
                             <span className="btn btn-danger">{idx === 0 ? '17 days' : '9 days'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                         <div className="btn btn-secondary">
                            <Activity className="h-4 w-4 text-slate-400" />
                       </div>
                       <span className="text-sm font-medium text-slate-600">Not Assigned</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">
                    <div className="btn btn-secondary">
                      <Activity className="h-4 w-4" />
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FleetDashboard;