import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowLeft, BarChart2, CheckCircle, ClipboardList, Edit, MapPin, Package, Plus, Receipt, RefreshCw, Save, Search, ShoppingBag, Trash2, TrendingUp, X } from 'lucide-react';

import { mockDb } from './mockDb';
import { storesService } from '../../services/storesService';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    stockValue: 0,
    todayIssues: 0,
    todayReceipts: 0,
    pendingRequests: 0,
    pendingApprovals: 0,
    lowStockItems: 0,
    deadStockItems: 0
  });

  const [departmentData, setDepartmentData] = useState([]);
  const [recentLedger, setRecentLedger] = useState([]);
  const [maxDeptValue, setMaxDeptValue] = useState(20000);
  const [auditScore, setAuditScore] = useState('100.0%');

  // Material Location States
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showLocForm, setShowLocForm] = useState(false);
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [locFilterType, setLocFilterType] = useState('All');
  const [locFilterZone, setLocFilterZone] = useState('');
  const [locFormValues, setLocFormValues] = useState({
    product_name: '',
    material_type: 'Yarn',
    zone: '',
    shelf: '',
    bin: '',
    quantity: 0,
    uom: 'Kg',
    received_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [editingLocId, setEditingLocId] = useState(null);

  const materialTypes = [
    "Yarn", "Fabric / Cloth", "Dyes & Chemicals", 
    "Spare Parts", "Machinery", "Stationery", "Others"
  ];

  const fetchLocations = async () => {
    setLocationsLoading(true);
    try {
      const res = await api.get('/stationary/locations');
      setLocations(res.data);
    } catch (err) {
      console.error("Failed to fetch material locations:", err);
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleLocSubmit = async (e) => {
    e.preventDefault();
    if (!locFormValues.product_name || !locFormValues.zone || !locFormValues.shelf) {
      alert("Product/Material Name, Zone, and Shelf are required.");
      return;
    }

    const payload = {
      ...locFormValues,
      quantity: Number(locFormValues.quantity) || 0
    };

    try {
      if (editingLocId) {
        await api.put(`/stationary/locations/${editingLocId}`, payload);
        alert("Material location updated successfully.");
      } else {
        await api.post('/stationary/locations/create', payload);
        alert("Material location recorded successfully.");
      }
      setShowLocForm(false);
      setEditingLocId(null);
      setLocFormValues({
        product_name: '',
        material_type: 'Yarn',
        zone: '',
        shelf: '',
        bin: '',
        quantity: 0,
        uom: 'Kg',
        received_date: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      fetchLocations();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to save material location.");
    }
  };

  const handleLocEdit = (loc) => {
    setLocFormValues({
      product_name: loc.product_name,
      material_type: loc.material_type || 'Yarn',
      zone: loc.zone,
      shelf: loc.shelf,
      bin: loc.bin || '',
      quantity: loc.quantity || 0,
      uom: loc.uom || 'Kg',
      received_date: loc.received_date || new Date().toISOString().split('T')[0],
      remarks: loc.remarks || ''
    });
    setEditingLocId(loc.id);
    setShowLocForm(true);
  };

  const handleLocDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material location?")) return;
    try {
      await api.delete(`/stationary/locations/${id}`);
      fetchLocations();
      alert("Material location deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete material location.");
    }
  };

  const filteredLocations = locations.filter(loc => {
    const query = locSearchQuery.toLowerCase();
    const matchesSearch = loc.product_name.toLowerCase().includes(query) || 
      (loc.remarks && loc.remarks.toLowerCase().includes(query));
    const matchesType = locFilterType === 'All' || loc.material_type === locFilterType;
    const matchesZone = !locFilterZone || 
      loc.zone.toLowerCase().includes(locFilterZone.toLowerCase()) || 
      loc.shelf.toLowerCase().includes(locFilterZone.toLowerCase()) || 
      (loc.bin && loc.bin.toLowerCase().includes(locFilterZone.toLowerCase()));
    return matchesSearch && matchesType && matchesZone;
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const loadDashboardStats = async () => {
      setStatsLoading(true);
      try {
        const data = await storesService.getDashboardStats();
        setStats({
          stockValue: data.totalInventoryValue,
          todayIssues: 200, // or dynamically simulated
          todayReceipts: 0,
          pendingRequests: data.pendingMaterialRequests,
          pendingApprovals: data.totalVendors,
          lowStockItems: data.lowStockItems,
          deadStockItems: data.outOfStockItems
        });

        // Set department consumption values
        setDepartmentData(data.departmentConsumption);
        
        // Find maximum value for progress bar scaling
        const maxVal = Math.max(...data.departmentConsumption.map(d => d.value), 20000);
        setMaxDeptValue(maxVal);

        // Map recent activity items to movements list
        const mappedMovements = data.recentActivity.map(act => ({
          id: act.id,
          refType: act.type,
          refId: act.id,
          date: act.date,
          inQty: act.type === 'Purchase' ? 500 : 0,
          outQty: act.type !== 'Purchase' ? 20 : 0
        }));
        setRecentLedger(mappedMovements);
      } catch (err) {
        console.error("Failed to load dashboard metrics from backend API:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  if (showLocForm) {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            type="button"
            onClick={() => {
              setShowLocForm(false);
              setEditingLocId(null);
            }} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {editingLocId ? "Edit Location Record" : "Record Material Placement Details"}
          </h2>
        </div>

        <div className="card" style={{ border: 'none', boxShadow: 'none' }}>
          <form onSubmit={handleLocSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Product / Material Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. 40s Comb Yarn, Red Dye"
                  value={locFormValues.product_name}
                  onChange={e => setLocFormValues({...locFormValues, product_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Material Type</label>
                <select 
                  className="form-control"
                  value={locFormValues.material_type}
                  onChange={e => setLocFormValues({...locFormValues, material_type: e.target.value})}
                >
                  {materialTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Received Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={locFormValues.received_date}
                  onChange={e => setLocFormValues({...locFormValues, received_date: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Warehouse Zone *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Zone A, Shed 2"
                  value={locFormValues.zone}
                  onChange={e => setLocFormValues({...locFormValues, zone: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Shelf / Rack *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Shelf 4, Row C"
                  value={locFormValues.shelf}
                  onChange={e => setLocFormValues({...locFormValues, shelf: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Bin / Box No</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Bin 12 (Optional)"
                  value={locFormValues.bin}
                  onChange={e => setLocFormValues({...locFormValues, bin: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Quantity</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-control" 
                  placeholder="0"
                  value={locFormValues.quantity}
                  onChange={e => setLocFormValues({...locFormValues, quantity: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>UOM</label>
                <select 
                  className="form-control"
                  value={locFormValues.uom}
                  onChange={e => setLocFormValues({...locFormValues, uom: e.target.value})}
                >
                  <option value="Kg">Kg</option>
                  <option value="Rolls">Rolls</option>
                  <option value="Bags">Bags</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Meters">Meters</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Location Remarks / Details</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Additional details (e.g., Near gate 2, fragile, handle with care)"
                  value={locFormValues.remarks}
                  onChange={e => setLocFormValues({...locFormValues, remarks: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowLocForm(false);
                  setEditingLocId(null);
                }}
                className="btn btn-secondary"
              >
                <X size={16} /> Close
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                <Save size={16} /> {editingLocId ? "Update Location" : "Save Location"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Package style={{ color: 'var(--primary)' }} size={28} />
            Stationery & Consumables Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>Real-time stock valuation, item requests, and consumption audits</p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Stock Value</h3>
            <div className="value">₹{stats.stockValue.toLocaleString()}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(8, 145, 178, 0.1)', color: '#0891b2' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <h3>Today's Issues</h3>
            <div className="value">₹{stats.todayIssues.toLocaleString()}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
            <Receipt size={24} />
          </div>
          <div className="stat-details">
            <h3>Pending POs</h3>
            <div className="value">{stats.pendingApprovals} POs</div>
          </div>
        </div>

        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Low Stock Alert</h3>
            <div className="value">{stats.lowStockItems} Items</div>
          </div>
        </div>
      </div>

      {/* Grid of Chart and Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Department Consumption */}
          <div className="card" style={{ border: 'none', boxShadow: 'none', boxShadow: 'none' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 style={{ color: 'var(--primary)' }} size={20} /> Department Wise Monthly Consumption
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {departmentData.map((dept, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{dept.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{dept.value.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', background: 'var(--bg-secondary)', borderRadius: 100, height: 8 }}>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 100,
                        width: `${maxDeptValue > 0 ? (dept.value / maxDeptValue) * 100 : 0}%`,
                        backgroundColor: dept.color,
                        transition: 'width 0.6s ease'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Breakdown */}
          <div className="card" style={{ border: 'none', boxShadow: 'none', boxShadow: 'none' }}>
            <div className="card-header">
              <h3 className="card-title">Stock Breakdown Status</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)' }}>{stats.pendingRequests}</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>Pending Material Requests</p>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)' }}>{auditScore}</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>Audit Score</p>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{stats.deadStockItems}</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>Dead Stock Items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Movement Ledger */}
        <div className="card" style={{ border: 'none', boxShadow: 'none', overflow: 'hidden' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList style={{ color: 'var(--primary)' }} size={20} /> Recent Stock Movements
            </h3>
          </div>
          <div>
            {recentLedger.map((log) => (
              <div key={log.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.refType} ({log.refId})
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Date: {log.date}
                  </p>
                </div>
                <div>
                  {log.inQty > 0 ? (
                    <span className="badge badge-active">+{log.inQty} In</span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)' }}>-{log.outQty} Out</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product & Material Location Section */}
      <div className="card" style={{ boxShadow: 'none', marginTop: 24, padding: 24, border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: 8, borderRadius: 'var(--radius-md)' }}>
              <MapPin size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Product & Material Location Tracking</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '2px 0 0 0' }}>Log and look up where materials are stored inside the warehouse (Zone, Shelf, Bin)</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setLocFormValues({
                product_name: '',
                material_type: 'Yarn',
                zone: '',
                shelf: '',
                bin: '',
                quantity: 0,
                uom: 'Kg',
                received_date: new Date().toISOString().split('T')[0],
                remarks: ''
              });
              setEditingLocId(null);
              setShowLocForm(true);
            }} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
          >
            <Plus size={16} /> Record New Location
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search material/product name or remarks..." 
                className="form-control"
                style={{ paddingLeft: 38 }}
                value={locSearchQuery}
                onChange={e => setLocSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative', width: 200 }}>
              <input 
                type="text" 
                placeholder="Filter by Zone / Shelf..." 
                className="form-control"
                value={locFilterZone}
                onChange={e => setLocFilterZone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            <button 
              onClick={() => setLocFilterType('All')}
              className={`btn ${locFilterType === 'All' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: 13 }}
            >
              All Types
            </button>
            {materialTypes.map(t => (
              <button 
                key={t}
                onClick={() => setLocFilterType(t)}
                className={`btn ${locFilterType === t ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: 13 }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Location Records Table */}
        <div style={{ overflowX: 'auto' }}>
          {locationsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', gap: 12, color: 'var(--text-muted)' }}>
              <RefreshCw className="animate-spin" size={20} />
              <span>Loading warehouse locations...</span>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
              <MapPin size={36} style={{ color: 'var(--border-light)', marginBottom: 12 }} />
              <p style={{ fontWeight: 600, fontSize: 14 }}>No material locations found</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search filters or click "Record New Location" to add one.</p>
            </div>
          ) : (
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Product / Material</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Warehouse Coordinates</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Received Date</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Remarks</th>
                  <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map(loc => {
                  let typeBg = 'rgba(100, 116, 139, 0.1)';
                  let typeColor = 'var(--text-muted)';
                  if (loc.material_type === 'Yarn') { typeBg = 'rgba(59, 130, 246, 0.1)'; typeColor = '#3b82f6'; }
                  else if (loc.material_type === 'Fabric / Cloth') { typeBg = 'rgba(16, 185, 129, 0.1)'; typeColor = '#10b981'; }
                  else if (loc.material_type === 'Dyes & Chemicals') { typeBg = 'rgba(139, 92, 246, 0.1)'; typeColor = '#8b5cf6'; }
                  else if (loc.material_type === 'Spare Parts') { typeBg = 'rgba(245, 158, 11, 0.1)'; typeColor = '#f59e0b'; }
                  else if (loc.material_type === 'Machinery') { typeBg = 'rgba(6, 182, 212, 0.1)'; typeColor = '#06b6d4'; }
                  else if (loc.material_type === 'Stationery') { typeBg = 'rgba(79, 70, 229, 0.1)'; typeColor = '#4f46e5'; }

                  return (
                    <tr key={loc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{loc.product_name}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '100px', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          backgroundColor: typeBg, 
                          color: typeColor,
                          display: 'inline-block'
                        }}>
                          {loc.material_type || 'Others'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loc.zone}</span>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span>{loc.shelf}</span>
                          {loc.bin && (
                            <>
                              <span style={{ color: 'var(--text-muted)' }}>→</span>
                              <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>{loc.bin}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)' }}>
                        {loc.quantity > 0 ? `${loc.quantity.toLocaleString()} ${loc.uom || 'Kg'}` : '-'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{loc.received_date || '-'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={loc.remarks}>
                        {loc.remarks || '-'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                          <button 
                            onClick={() => handleLocEdit(loc)}
                            className="btn btn-outline"
                            style={{ padding: '6px', minWidth: 'auto', borderRadius: '6px', color: 'var(--primary)' }}
                            title="Edit Location"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleLocDelete(loc.id)}
                            className="btn btn-outline"
                            style={{ padding: '6px', minWidth: 'auto', borderRadius: '6px', color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
