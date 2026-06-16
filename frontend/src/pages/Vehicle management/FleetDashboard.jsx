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
  Power,
  Search
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
  const [searchTerm, setSearchTerm] = useState('');

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

  const quickActions = [
    { label: 'New Trip', icon: MapPin, path: '/fleet/trip-planning', color: 'bg-blue-500' },
    { label: 'Fuel Entry', icon: Fuel, path: '/fleet/fuel-entry', color: 'bg-green-500' },
    { label: 'Breakdown Entry', icon: Wrench, path: '/fleet/breakdown-entry', color: 'bg-red-500' },
    { label: 'Add Vehicle', icon: Truck, path: '/fleet/vehicles', color: 'bg-purple-500' }
  ];

  const operationalMetrics = [
    {
      title: 'Total Vehicles',
      value: dashboardData.total_vehicles || vehicles.length || 0,
      icon: Truck,
      change: 'Active inventory'
    },
    {
      title: 'Running',
      value: dashboardData.active_trips || 0,
      icon: MapPin,
      change: 'Currently moving'
    },
    {
      title: 'Idle',
      value: dashboardData.idle_vehicles || 0,
      icon: Clock,
      change: 'Engine on, no movement'
    },
    {
      title: 'Stopped',
      value: dashboardData.stopped_vehicles || 0,
      icon: Power,
      change: 'Engine off'
    },
    {
      title: 'Expiring Docs',
      value: dashboardData.expiring_documents || 0,
      icon: FileText,
      change: 'Action required'
    }
  ];

  const filteredVehicles = vehicles.filter(v => 
    (v.vehicle_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.model || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Upper header action row matching Sales Invoice style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={28} color="var(--primary)" /> Fleet Management Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Monitor and manage your vehicle fleet operations</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last Updated</span>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, marginTop: 2 }}>
            {new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {operationalMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="card stat-card" style={{ margin: 0, padding: 16 }}>
              <div className="stat-icon" style={{ 
                background: index === 0 ? 'rgba(59,130,246,0.1)' : index === 1 ? 'rgba(16,185,129,0.1)' : index === 2 ? 'rgba(245,158,11,0.1)' : index === 3 ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', 
                color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : index === 2 ? '#f97316' : index === 3 ? '#ef4444' : '#eab308' 
              }}>
                <IconComponent size={24} />
              </div>
              <div className="stat-details">
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{metric.title}</span>
                <div className="value" style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 2px 0', color: 'var(--text-primary)' }}>{metric.value}</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{metric.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Live Track Button Section */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <button
          onClick={() => window.open('https://navilap.com/gps/', '_blank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 36px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 50,
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: '0 8px 20px 0 rgba(79, 70, 229, 0.35)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 24px 0 rgba(79, 70, 229, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 20px 0 rgba(79, 70, 229, 0.35)';
          }}
        >
          <Radio size={22} className="animate-pulse" />
          <span style={{ trackingWide: '0.05em' }}>Live Track</span>
          <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, marginLeft: 4 }}>GPS</span>
        </button>
      </div>

      {/* Quick Actions Panel */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="var(--primary)" /> Quick Operational Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '16px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.background = 'var(--bg-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
              >
                <div style={{
                  padding: 8,
                  borderRadius: 8,
                  background: idx === 0 ? 'rgba(59,130,246,0.1)' : idx === 1 ? 'rgba(16,185,129,0.1)' : idx === 2 ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                  color: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : idx === 2 ? '#ef4444' : '#8b5cf6'
                }}>
                  <Icon size={20} />
                </div>
                <span style={{ color: 'var(--text-primary)' }}>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Fleet Status Section */}
      <div className="card" style={{ padding: 20 }}>
        {/* Table Header Row with Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: 10, borderRadius: 8 }}>
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Live Fleet Status</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Tracking {filteredVehicles.length} Units</p>
            </div>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search truck number, make or model..." 
              className="form-control"
              style={{ paddingLeft: 38, width: '100%', margin: 0, height: 38 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>Vehicle Details</th>
                <th style={{ padding: '12px 16px' }}>Current Status</th>
                <th style={{ padding: '12px 16px' }}>Live Speed</th>
                <th style={{ padding: '12px 16px' }}>Document Expiry</th>
                <th style={{ padding: '12px 16px' }}>Driver</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle, idx) => {
                  const statuses = [
                    { label: 'IGNITION ON', color: '#10b981', speed: '7 km/h' },
                    { label: 'IGNITION OFF', color: '#ef4444', speed: '0 km/h' },
                    { label: 'IDLE', color: '#f97316', speed: '0 km/h' }
                  ];
                  const status = statuses[idx % 3];
                  
                  return (
                    <tr key={vehicle.id}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ padding: 8, background: 'var(--bg-primary)', borderRadius: 8, color: 'var(--text-muted)' }}>
                            <Truck size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{vehicle.vehicle_number}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{vehicle.make} {vehicle.model}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: status.color, boxShadow: `0 0 6px ${status.color}` }}></span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{status.label}</span>
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 16 }}>4:50:27 PM</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 700 }}>
                          <TrendingUp size={16} />
                          <span>{status.speed}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', width: 70 }}>INSURANCE:</span>
                            <span className="badge badge-active" style={{ fontSize: 10, padding: '2px 6px' }}>
                              {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : '6/1/2026'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', width: 70 }}>FITNESS:</span>
                            <span className="badge" style={{ fontSize: 10, padding: '2px 6px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                              {idx === 0 ? '17 days' : '9 days'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Not Assigned</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => navigate(`/fleet/vehicles`)}
                          className="btn btn-secondary"
                          style={{ padding: 8, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Activity size={16} />
                        </button>
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
};

export default FleetDashboard;