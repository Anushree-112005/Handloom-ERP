import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { Play, MapPin, Truck, User, Package, CheckCircle, Clock } from 'lucide-react';

const TripExecution = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/fleet/trips'),
        api.get('/fleet/vehicles'),
        api.get('/fleet/drivers')
      ]);
      setTrips(tripsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load trip execution data');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.vehicle_number || '';
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || '';

  const getStatusColor = (status) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusUpdate = async (tripId, newStatus) => {
    try {
      await api.put(`/fleet/trips/${tripId}`, { status: newStatus });
      showSuccess(`Trip marked as ${newStatus}`);
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to update trip status:', error);
      showError(error.response?.data?.detail || 'Failed to update trip status');
    }
  };

  const handleReportIssue = async (trip, issueText) => {
    try {
      const issuesArray = trip.remarks ? [trip.remarks, issueText] : [issueText];
      await api.put(`/fleet/trips/${trip.id}`, { remarks: issuesArray.join(' | ') });
      showSuccess('Issue reported');
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to report issue:', error);
      showError('Failed to report issue');
    }
  };

  if (loading) return <div className="p-6">Loading Trip Execution...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Play className="h-7 w-7 text-green-600" /> Trip Execution
          </h1>
        </div>
      </div>

      <div className="form-row">
        {trips.filter(t => !['COMPLETED', 'CANCELLED'].includes(String(t.status).toUpperCase())).map((trip) => (
          <div key={trip.id} className="card">
            <div className="p-4 border-b bg-gray-50 flex justify-between">
              <div>
                <h3 className="font-semibold text-lg">Trip {trip.trip_number}</h3>
                <p className="text-sm text-gray-600">{trip.customer_name}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(trip.status)}`}>
                {trip.status}
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div className="form-row">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-400" /> {getVehicleName(trip.vehicle_id)}
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" /> {getDriverName(trip.driver_id)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" /> {trip.from_location} &rarr; {trip.to_location}
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" /> {trip.material} ({trip.quantity_tons}T)
                </div>
              </div>

              {trip.remarks && (
                <div className="btn btn-danger">
                  <strong>Issues Reported:</strong> {trip.remarks}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {String(trip.status).toUpperCase() === 'PLANNED' && (
                  <button onClick={() => handleStatusUpdate(trip.id, 'IN_PROGRESS')} className="btn btn-primary">
                    Start Trip
                  </button>
                )}
                {String(trip.status).toUpperCase() === 'IN_PROGRESS' && (
                  <>
                    <button onClick={() => handleStatusUpdate(trip.id, 'COMPLETED')} className="btn btn-success">
                      Complete Trip
                    </button>
                    <button onClick={() => {
                      const issue = window.prompt("Enter issue detail:");
                      if (issue) handleReportIssue(trip, issue);
                    }} className="btn btn-secondary">
                      Report Issue
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {trips.filter(t => !['COMPLETED', 'CANCELLED'].includes(String(t.status).toUpperCase())).length === 0 && (
          <div className="col-span-1 lg:col-span-2 text-center py-12 text-gray-500 bg-white rounded-lg border">
            No active trips currently. Please plan trips in Trip Planning.
          </div>
        )}
      </div>
    </div>
  );
};
export default TripExecution;