import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Calendar, Search, Filter, Truck, User, 
  Download, RefreshCw, Bell, ShieldAlert, CheckCircle, Clock, X,
  FileText, FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import MasterDropdown from '../../components/MasterDropdown';
import api from '../../services/api';
import { showError } from '../../utils/notifications';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 6, paddingTop: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function FleetExpiryAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
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
      
      const alertsData = (alertsRes.data || []).map((item, index) => ({
        ...item,
        id: item.id || `alert-${index}`
      }));
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
        return (
          <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
            Expired
          </span>
        );
      case 'Expiring Soon': 
        return (
          <span className="badge" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
            Expiring Soon
          </span>
        );
      default: 
        return (
          <span className="badge badge-active" style={{ border: '1px solid #a7f3d0' }}>
            Valid
          </span>
        );
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchDocType = !filters.documentType || (alert.document_type || '').toLowerCase().includes(filters.documentType.toLowerCase());
    const matchVehicle = !filters.vehicle || (alert.vehicle_number && alert.vehicle_number === filters.vehicle);
    const matchDriver = !filters.driver || (alert.driver_name && alert.driver_name === filters.driver);
    const matchStatus = !filters.status || alert.status === filters.status;
    
    // Date range filter
    const expiryDate = new Date(alert.expiry_date);
    const matchDateRange = (!filters.startDate || expiryDate >= new Date(filters.startDate)) &&
                          (!filters.endDate || expiryDate <= new Date(filters.endDate));

    return matchDocType && matchVehicle && matchDriver && matchStatus && matchDateRange;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Fleet Expiry Alerts Report", 14, 15);
    const tableColumn = ["Resource / Vehicle", "Doc Type", "Doc Number", "Expiry Date", "Days Remaining", "Status"];
    const tableRows = [];

    filteredAlerts.forEach(alert => {
      const rowData = [
        alert.vehicle_number || alert.driver_name || '-',
        alert.document_type || '-',
        alert.document_number || '-',
        new Date(alert.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        alert.days_remaining < 0 ? `Overdue by ${Math.abs(alert.days_remaining)} days` : `${alert.days_remaining} days remaining`,
        alert.status || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Fleet_Expiry_Alerts_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredAlerts.map(alert => ({
      "Resource / Vehicle": alert.vehicle_number || alert.driver_name || '-',
      "Document Type": alert.document_type || '-',
      "Document Number": alert.document_number || '-',
      "Expiry Date": alert.expiry_date,
      "Days Remaining": alert.days_remaining,
      "Status": alert.status,
      "Blocking": alert.is_blocking ? "Yes" : "No"
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expiry Alerts");
    XLSX.writeFile(workbook, `Fleet_Expiry_Alerts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  
  const profilePreviewRef = React.useRef(null);
  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.document_type || 'Fleet Expiry Alert').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Fleet Expiry Alert_Profile_${safeName}.pdf`);
    }
  };

  return (
    <div className="animate-fade">
      {/* Upper header action row matching Sales Invoice */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={24} color="var(--primary)" /> Expiry Alerts
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor and manage document compliance across your fleet</p>
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

      {/* Blocking Alert Banner */}
      {stats.blocking > 0 && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#fee2e2', border: '1px solid #fca5a5', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
          <ShieldAlert size={24} color="#dc2626" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, color: '#991b1b', fontWeight: 700, fontSize: 14 }}>Critical Compliance Issues Found</h4>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: 13 }}>
              {stats.blocking} documents are expired. Impacted vehicles have been automatically blocked from trip planning.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards matching Sales Invoice grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div 
          className="card stat-card" 
          onClick={() => setFilters(prev => ({ ...prev, status: '' }))} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(79,70,229,0.1)', color: 'var(--primary)' }}>
            <Bell size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Scanned</h3>
            <div className="value">{stats.total}</div>
          </div>
        </div>

        <div 
          className="card stat-card" 
          onClick={() => setFilters(prev => ({ ...prev, status: 'Expired' }))} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Expired</h3>
            <div className="value">{stats.expired}</div>
          </div>
        </div>

        <div 
          className="card stat-card" 
          onClick={() => setFilters(prev => ({ ...prev, status: 'Expiring Soon' }))} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h3>Expiring Soon</h3>
            <div className="value">{stats.expiringSoon}</div>
          </div>
        </div>

        <div 
          className="card stat-card" 
          onClick={() => setFilters(prev => ({ ...prev, status: 'Valid' }))} 
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Documents Valid</h3>
            <div className="value">{stats.valid}</div>
          </div>
        </div>
      </div>

      {/* Filter Row matching Sales Invoice */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        {/* Left Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search Doc Type..." 
            className="form-control"
            style={{ paddingLeft: 38, width: '100%', margin: 0, height: 38 }}
            value={filters.documentType}
            onChange={(e) => setFilters({...filters, documentType: e.target.value})}
          />
        </div>

        {/* Right Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filters:</span>
          </div>

          <div style={{ width: 160 }}>
            <MasterDropdown
              value={filters.vehicle}
              onChange={(val) => setFilters({...filters, vehicle: val})}
              options={[
                { value: '', label: 'All Vehicles' },
                ...vehicles.map(v => ({ value: v.vehicle_number, label: v.vehicle_number }))
              ]}
              placeholder="--- All Vehicles ---"
            />
          </div>

          <div style={{ width: 160 }}>
            <MasterDropdown
              value={filters.driver}
              onChange={(val) => setFilters({...filters, driver: val})}
              options={[
                { value: '', label: 'All Drivers' },
                ...drivers.map(d => ({ value: d.name, label: d.name }))
              ]}
              placeholder="--- All Drivers ---"
            />
          </div>

          <div style={{ width: 160 }}>
            <MasterDropdown
              value={filters.status}
              onChange={(val) => setFilters({...filters, status: val})}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Expired', label: 'Expired' },
                { value: 'Expiring Soon', label: 'Expiring Soon' },
                { value: 'Valid', label: 'Valid' }
              ]}
              placeholder="--- All Statuses ---"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input 
              type="date" 
              className="form-control"
              style={{ width: 130, margin: 0, height: 38, padding: '8px' }}
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input 
              type="date" 
              className="form-control"
              style={{ width: 130, margin: 0, height: 38, padding: '8px' }}
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Split Layout */}
      {/* Full Width Table */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource / Vehicle</th>
                  <th>Document Detail</th>
                  <th>Expiration Info</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: 30 }}>Loading...</td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: 30 }}>No alerts found</td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert, idx) => (
                    <tr 
                      key={alert.id || idx}
                      onClick={() => setSelectedAlert(alert)}
                      style={{ 
                        cursor: 'pointer', 
                        background: selectedAlert?.id === (alert.id || idx) ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            padding: 8,
                            borderRadius: 10,
                            background: alert.driver_name ? 'rgba(79, 70, 229, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                            color: alert.driver_name ? 'var(--primary)' : 'var(--text-secondary)'
                          }}>
                            {alert.driver_name ? <User size={18} /> : <Truck size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {alert.vehicle_number || alert.driver_name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                {alert.driver_name ? 'Personnel' : alert.data_source} Document
                              </span>
                              {alert.is_blocking && (
                                <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: 9, padding: '2px 6px' }}>
                                  Blocked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{alert.document_type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{alert.document_number || '-'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ 
                            fontWeight: 600, 
                            color: alert.status === 'Expired' ? '#ef4444' : alert.status === 'Expiring Soon' ? '#f59e0b' : 'inherit' 
                          }}>
                            {new Date(alert.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: 11, 
                          fontWeight: 600, 
                          marginTop: 4,
                          color: alert.days_remaining < 0 ? '#ef4444' : 'var(--text-muted)'
                        }}>
                          {alert.days_remaining < 0 
                            ? `Overdue by ${Math.abs(alert.days_remaining)} days`
                            : `${alert.days_remaining} days remaining`}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getStatusBadge(alert.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Panel */}
        {selectedAlert && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={18} /> Alert Details
                </h3>
                <button onClick={() => setSelectedAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
                {selectedAlert.vehicle_number ? (
                  <DetailRow label="Vehicle Number" value={selectedAlert.vehicle_number} />
                ) : (
                  <DetailRow label="Personnel Name" value={selectedAlert.driver_name} />
                )}
                <DetailRow label="Document Category" value={selectedAlert.driver_name ? 'Driver / Staff' : 'Vehicle Asset'} />
                <DetailRow label="Document Type" value={selectedAlert.document_type} />
                <DetailRow label="Document Reference" value={selectedAlert.document_number || 'N/A'} />
                <DetailRow label="Expiration Date" value={new Date(selectedAlert.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
                <DetailRow label="Validity Period" value={
                  <span style={{ 
                    fontWeight: 700, 
                    color: selectedAlert.days_remaining < 0 ? '#ef4444' : selectedAlert.days_remaining <= 30 ? '#f59e0b' : '#10b981'
                  }}>
                    {selectedAlert.days_remaining < 0 
                      ? `Overdue by ${Math.abs(selectedAlert.days_remaining)} days`
                      : `${selectedAlert.days_remaining} days remaining`}
                  </span>
                } />
                <DetailRow label="Status" value={getStatusBadge(selectedAlert.status)} />
                <DetailRow label="Compliance Block" value={
                  selectedAlert.is_blocking ? (
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>ACTIVE (Vehicle Blocked)</span>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 800 }}>None</span>
                  )
                } />
                <DetailRow label="Data Registry" value={selectedAlert.driver_name ? 'Driver Registry' : 'Vehicle Fleet Registry'} />
              </div>
            </div>
          </div>
        )}
      
        {/* Profile View Modal */}
        {selectedAlert && (
          <div className="fixed inset-0" style={{ zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}>
            <div className="animate-scale-up" style={{ background: '#f8fafc', width: '95%', maxWidth: 900, height: '90vh', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} /> 
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Fleet Expiry Alert Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(selectedAlert)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => selectedAlert(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div ref={profilePreviewRef} style={{ width: '100%', maxWidth: 794, background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden', flexShrink: 0 }}>
                  
                  <div style={{ padding: '32px 40px 20px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div><img src={logoImg} alt="Dinesh Exports" style={{ width: 56, height: 56, objectFit: 'contain' }} /></div>
                        <div>
                           <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                           <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', width: 300 }}>
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>FLEET EXPIRY ALERT PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedAlert.status || 'ACTIVE').toUpperCase()}</span></div>
                        </div>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Generated On</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                  <div style={{ padding: '10px 40px 40px 40px' }}>
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <User size={14} /> 1. DETAILS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                        <div>
                          <InfoRow2 label="Vehicle Number" value={selectedAlert.vehicle_number} />\n                          <InfoRow2 label="Personnel Name" value={selectedAlert.driver_name} />\n                          <InfoRow2 label="Document Category" value={selectedAlert.driver_name ? 'Driver / Staff' : 'Vehicle Asset'} />\n                          <InfoRow2 label="Document Type" value={selectedAlert.document_type} />\n                          <InfoRow2 label="Document Reference" value={selectedAlert.document_number || 'N/A'} />\n                          <InfoRow2 label="Status" value={getStatusBadge(selectedAlert.status)} />\n                          <InfoRow2 label="Data Registry" value={selectedAlert.driver_name ? 'Driver Registry' : 'Vehicle Fleet Registry'} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
