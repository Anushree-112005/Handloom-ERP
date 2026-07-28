import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDownLeft, ArrowLeft, Search, Plus, Printer, Check, CheckCircle,
  Clock, Truck, Trash2, Eye, Calendar, ShieldAlert, X, Edit, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { partyAPI, dropdownAPI, subMasterAPI, buyerOrderAPI } from '../../services/api';
import A4DocumentPreview from '../../components/A4DocumentPreview';
export default function GateInward() {
  // Local Storage Database
  const [inwards, setInwards] = useState(() => {
    const saved = localStorage.getItem('gate_inward_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [dbVehicles, setDbVehicles] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [isCustomPurpose, setIsCustomPurpose] = useState(false);
  const [customPurposeVal, setCustomPurposeVal] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitVal, setCustomUnitVal] = useState('');
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [customMaterialVal, setCustomMaterialVal] = useState('');
  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [customStatusVal, setCustomStatusVal] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partRes, dropRes, vehRes, boRes] = await Promise.all([
          partyAPI.list().catch(() => ({ data: [] })),
          dropdownAPI.getAll().catch(() => ({ data: {} })),
          api.get('/fleet/vehicles').catch(() => ({ data: [] })),
          buyerOrderAPI.list().catch(() => ({ data: [] }))
        ]);
        setParties(partRes.data || []);
        setOptions(dropRes.data || {});
        setDbVehicles(vehRes.data || []);
        setDbOrders(boRes.data || []);

        const fetchedVehicles = vehRes.data || [];
        const fetchedBOs = boRes.data || [];
        const fetchedParties = partRes.data || [];

        // No auto-seeding — start with empty data if localStorage is empty
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleSaveCustomPurpose = async () => {
    if (!customPurposeVal.trim()) return;
    try {
      await subMasterAPI.create('purpose_of_visit_master', { 
        entity: 'purpose_of_visit_master', 
        name: customPurposeVal.trim(), 
        is_active: true 
      });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setPurpose(customPurposeVal.trim());
      setIsCustomPurpose(false);
      setCustomPurposeVal('');
    } catch (err) {
      alert('Error saving custom purpose of visit');
    }
  };

  const handleSaveCustomUnit = async () => {
    if (!customUnitVal.trim()) return;
    try {
      await subMasterAPI.create('unit_master', { 
        entity: 'unit_master', 
        name: customUnitVal.trim(), 
        is_active: true 
      });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setUnit(customUnitVal.trim());
      setIsCustomUnit(false);
      setCustomUnitVal('');
    } catch (err) {
      alert('Error saving custom unit');
    }
  };

  const handleSaveCustomMaterial = async () => {
    if (!customMaterialVal.trim()) return;
    try {
      await subMasterAPI.create('material_type_master', { 
        entity: 'material_type_master', 
        name: customMaterialVal.trim(), 
        is_active: true 
      });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setMaterialType(customMaterialVal.trim());
      setIsCustomMaterial(false);
      setCustomMaterialVal('');
    } catch (err) {
      alert('Error saving custom material type');
    }
  };

  const handleSaveCustomStatus = async () => {
    if (!customStatusVal.trim()) return;
    try {
      await subMasterAPI.create('inward_status_master', { 
        entity: 'inward_status_master', 
        name: customStatusVal.trim(), 
        is_active: true 
      });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setStatus(customStatusVal.trim());
      setIsCustomStatus(false);
      setCustomStatusVal('');
    } catch (err) {
      alert('Error saving custom status');
    }
  };

  // View state: list mode or form mode
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [viewModalInward, setViewModalInward] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('All');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');


  // Form input fields state
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [partyName, setPartyName] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dcNo, setDcNo] = useState('');
  const [dcDate, setDcDate] = useState('');
  const [weight, setWeight] = useState('');
  const [packages, setPackages] = useState('');
  const [guardName, setGuardName] = useState('S. Rajendran');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('');

  // Line Items table
  const emptyLineItem = () => ({ item: '', qty: '', rate: '', uom: '', amount: '' });
  const [lineItems, setLineItems] = useState([emptyLineItem()]);

  const addLineItem = () => setLineItems(prev => [...prev, emptyLineItem()]);
  const removeLineItem = (idx) => setLineItems(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  const updateLineItem = (idx, field, val) => {
    setLineItems(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const updated = { ...row, [field]: val };
      const q = parseFloat(updated.qty) || 0;
      const r = parseFloat(updated.rate) || 0;
      updated.amount = q && r ? (q * r).toFixed(2) : '';
      return updated;
    }));
  };

  // KPI Calculations
  const totalInwards = inwards.length;
  const openInwards = inwards.filter(i => i.status === 'Open').length;
  const closedInwards = inwards.filter(i => i.status === 'Closed').length;
  const totalPackages = inwards.reduce((acc, curr) => acc + (Number(curr.packages) || 0), 0);

  // Filtered List
  const filteredList = useMemo(() => {
    return inwards.filter(item => {
      const vNo = String(item.vehicleNo || '');
      const pName = String(item.partyName || '');
      const idStr = String(item.id || '');
      const sTerm = String(searchTerm || '');
      
      const matchSearch = vNo.toLowerCase().includes(sTerm.toLowerCase()) || 
                          pName.toLowerCase().includes(sTerm.toLowerCase()) || 
                          idStr.toLowerCase().includes(sTerm.toLowerCase());
      const matchMaterial = filterMaterial === 'All' || item.materialType === filterMaterial;
      const matchFrom = filterFromDate ? item.dateTime >= filterFromDate : true;
      const matchTo = filterToDate ? item.dateTime <= filterToDate : true;
      return matchSearch && matchMaterial && matchFrom && matchTo;
    });
  }, [inwards, searchTerm, filterMaterial, filterFromDate, filterToDate]);

  const handleCreateNew = () => {
    const nextId = `GIN-${String(inwards.length + 1).padStart(5, '0')}`;
    setCurrentFormId(nextId);
    
    // Reset Form Fields
    setVehicleNo('');
    setDriverName('');
    setDriverMobile('');
    setPartyName('');
    setMaterialType('');
    setPurpose('');
    setDcNo('');
    setDcDate('');
    setWeight('');
    setPackages('');
    setGuardName('S. Rajendran');
    setRemarks('');
    setStatus('');
    setLineItems([emptyLineItem()]);

    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setCurrentFormId(item.id);
    setVehicleNo(item.vehicleNo);
    setDriverName(item.driverName);
    setDriverMobile(item.driverMobile);
    setPartyName(item.partyName);
    setMaterialType(item.materialType);
    setPurpose(item.purpose);
    setDcNo(item.dcNo);
    setDcDate(item.dcDate);
    setWeight(item.weight);
    setPackages(item.packages);
    setGuardName(item.guardName);
    setRemarks(item.remarks);
    setStatus(item.status);
    setLineItems(item.lineItems && item.lineItems.length > 0 ? item.lineItems : [emptyLineItem()]);

    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!vehicleNo || !driverName || !dcNo) {
      alert("Please fill in all mandatory fields!");
      return;
    }

    const dateStr = new Date().toISOString().substring(0, 10);
    const timeStr = new Date().toISOString().substring(11, 16);
    const isExisting = inwards.some(i => i.id === currentFormId);

    const totalQty = lineItems.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
    const firstUnit = lineItems[0]?.uom || '';
    if (isExisting) {
      const updated = inwards.map(i => {
        if (i.id === currentFormId) {
          return {
            ...i,
            vehicleNo, driverName, driverMobile, partyName,
            materialType, purpose, dcNo, dcDate,
            qty: totalQty, unit: firstUnit,
            weight: Number(weight), packages: Number(packages),
            guardName, remarks, status: status || 'Open',
            lineItems
          };
        }
        return i;
      });
      setInwards(updated);
      localStorage.setItem('gate_inward_data', JSON.stringify(updated));
    } else {
      const newEntry = {
        id: currentFormId, dateTime: dateStr,
        vehicleNo, driverName, driverMobile, partyName,
        materialType, purpose, dcNo, dcDate,
        qty: totalQty, unit: firstUnit,
        weight: Number(weight), packages: Number(packages),
        guardName, inwardTime: timeStr, remarks,
        status: status || 'Open',
        lineItems
      };
      const updated = [newEntry, ...inwards];
      setInwards(updated);
      localStorage.setItem('gate_inward_data', JSON.stringify(updated));
    }
    setIsFormOpen(false);
    alert("Gate Inward saved successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this gate inward record?")) {
      const updated = inwards.filter(i => i.id !== id);
      setInwards(updated);
      localStorage.setItem('gate_inward_data', JSON.stringify(updated));
    }
  };

  const handlePrintSlip = (item) => {
    alert(`Generating print invoice spooled for Inward No: ${item.id}`);
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {!isFormOpen ? (
        /* ========================================================================= */
        /* =========================== 1. LIST VIEW MODE =========================== */
        /* ========================================================================= */
        <>
          {/* HEADER BAR */}
          <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <ArrowDownLeft size={24} style={{ color: '#7c3aed' }} /> Gate Inward Register
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
                Log and monitor raw materials, yarn, chemical supplies, and vehicles entering the factory yard.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={() => alert('Exporting inwards ledger...')}>
                <Download size={15} /> Export
              </button>
              <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Plus size={16} /> Add New Inward
              </button>
            </div>
          </div>

          {/* KPI METRICS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
            
            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
                <ArrowDownLeft size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Inwards</h3>
                <div className="value">{totalInwards}</div>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckCircle size={24} />
              </div>
              <div className="stat-details">
                <h3>Closed Inwards</h3>
                <div className="value">{closedInwards}</div>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div className="stat-details">
                <h3>Active In Yard</h3>
                <div className="value">{openInwards}</div>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Truck size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Packages</h3>
                <div className="value">{totalPackages}</div>
              </div>
            </div>

          </div>

          {/* FILTER TOOLBAR BAR */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'var(--bg-secondary)', border: 'none', boxShadow: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by Inward No, Vehicle, or Party..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', margin: 0, fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter:</span>
                <select className="form-control" value={filterMaterial} onChange={e => setFilterMaterial(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                  <option value="All">All Materials</option>
                  <option value="Yarn">Yarn</option>
                  <option value="Fabric / Cloth">Fabric / Cloth</option>
                  <option value="Dyes & Chemicals">Dyes & Chemicals</option>
                  <option value="Spare Parts">Spare Parts</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>From:</span>
                <input type="date" className="form-control" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} style={{ margin: 0, fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To:</span>
                <input type="date" className="form-control" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} style={{ margin: 0, fontSize: '13px' }} />
              </div>

            </div>
          </div>

          {/* DUAL TABLE REPORT LIST */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', border: 'none', boxShadow: 'none' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>REF NO</th>
                    <th>DATE</th>
                    <th>PARTY NAME</th>
                    <th>VEHICLE NO</th>
                    <th>MATERIAL TYPE</th>
                    <th>DC/CHALLAN</th>
                    <th>TOTAL QUANTITY</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.id}</td>
                        <td>{item.dateTime}</td>
                        <td style={{ fontWeight: 600 }}>{item.partyName}</td>
                        <td style={{ fontWeight: 600, color: '#4b5563' }}>🚚 {item.vehicleNo}</td>
                        <td>{item.materialType}</td>
                        <td>{item.dcNo}</td>
                        <td style={{ fontWeight: 800 }}>{item.qty} {item.unit}</td>
                        <td>
                          <span className={`badge ${item.status === 'Closed' ? 'badge-active' : 'badge-pending'}`} style={{ borderRadius: '4px', fontSize: '11px', padding: '2px 8px' }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewModalInward(item)} title="View Inward">
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleEdit(item)} title="Edit Inward">
                              <Edit size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }} onClick={() => handleDelete(item.id)} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* =========================== 2. FORM VIEW MODE =========================== */
        /* ========================================================================= */
        <div className="card animate-fade" style={{ padding: '32px', minHeight: '600px', background: 'white' }}>
          
          {/* Form Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }}
              title="Back to List"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                {inwards.some(i => i.id === currentFormId) ? `Edit Gate Inward Record (${currentFormId})` : `Add New Gate Inward / Vehicle Entry`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Security Checkpost Material Entry Register</span>
            </div>
          </div>

          {/* Form Content Scrolling Area */}
          <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            <div id="ref-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Gate Inward Reference Information</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Gate Inward No *</label>
                    <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                  </div>

                  <div className="form-group">
                    <label>Vehicle No *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. TN-37-BY-1204" 
                      value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                      required
                      list="vehicles-list"
                    />
                  </div>

                  <div className="form-group">
                    <label>Driver Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Driver full name" 
                      value={driverName}
                      onChange={e => setDriverName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Driver Mobile No *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="10-digit number" 
                      value={driverMobile}
                      onChange={e => setDriverMobile(e.target.value)}
                      required
                    />
                  </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Purpose of Visit *</label>
                    {isCustomPurpose ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input 
                          autoFocus
                          className="form-control" 
                          placeholder="Type new purpose..."
                          value={customPurposeVal}
                          onChange={(e) => setCustomPurposeVal(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await handleSaveCustomPurpose();
                            }
                          }}
                        />
                        <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPurpose} title="Save">
                          <CheckCircle size={16} />
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPurpose(false); setPurpose(''); }} title="Cancel">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select className="form-control" value={purpose} onChange={e => {
                        if (e.target.value === 'custom_add_new') {
                          setIsCustomPurpose(true);
                          setCustomPurposeVal('');
                        } else {
                          setPurpose(e.target.value);
                        }
                      }}>
                        <option value="">Select Purpose...</option>
                        {Array.from(new Set([
                          "Material Delivery", "Returnable Spares", "Visitor Log", "Contractor entry", "Others",
                          ...(options.masters?.purpose_of_visit_master || [])
                        ])).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Purpose...</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Party / Vendor Name *</label>
                    <select className="form-control" value={partyName} onChange={e => setPartyName(e.target.value)}>
                      <option value="">Select Party...</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.company_name}>{p.company_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
            </div>

            <div id="mat-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Material & Weight Metrics Info</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Material Type *</label>
                    {isCustomMaterial ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input 
                          autoFocus
                          className="form-control" 
                          placeholder="Type new material..."
                          value={customMaterialVal}
                          onChange={(e) => setCustomMaterialVal(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await handleSaveCustomMaterial();
                            }
                          }}
                        />
                        <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomMaterial} title="Save">
                          <CheckCircle size={16} />
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomMaterial(false); setMaterialType(''); }} title="Cancel">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select className="form-control" value={materialType} onChange={e => {
                        if (e.target.value === 'custom_add_new') {
                          setIsCustomMaterial(true);
                          setCustomMaterialVal('');
                        } else {
                          setMaterialType(e.target.value);
                        }
                      }}>
                        <option value="">Select Material Type...</option>
                        {Array.from(new Set([
                          "Yarn", "Fabric / Cloth", "Dyes & Chemicals", "Spare Parts", "Machinery", "Stationery", "Others",
                          ...(options.masters?.material_type_master || [])
                        ])).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Material...</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>DC No. / Challan No. *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="DC reference no" 
                      value={dcNo}
                      onChange={e => setDcNo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>DC Date *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={dcDate}
                      onChange={e => setDcDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>No. of Packages *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={packages}
                      onChange={e => setPackages(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Weight (KG) ⚠️</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Gross cargo weight in KG" 
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                    />
                  </div>

                </div>

                {/* ---- LINE ITEMS TABLE ---- */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4b5563' }}>Item Details</span>
                    <button
                      type="button"
                      onClick={addLineItem}
                      style={{
                        background: 'rgba(124,58,237,0.09)',
                        border: '1px dashed #7c3aed',
                        color: '#7c3aed',
                        borderRadius: 6,
                        padding: '5px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5
                      }}
                    >
                      <Plus size={14} /> Add Row
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f5f3ff' }}>
                          <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, color: '#7c3aed', borderBottom: '1px solid var(--border)', width: 44 }}>S.No</th>
                          <th style={{ padding: '9px 10px', textAlign: 'left',   fontWeight: 800, color: '#7c3aed', borderBottom: '1px solid var(--border)' }}>Item / Description</th>
                          <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, color: '#7c3aed', borderBottom: '1px solid var(--border)', width: 90 }}>Qty</th>
                          <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, color: '#7c3aed', borderBottom: '1px solid var(--border)', width: 100 }}>Rate</th>
                          <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, color: '#7c3aed', borderBottom: '1px solid var(--border)', width: 100 }}>UOM</th>
                          <th style={{ padding: '9px 10px', textAlign: 'right',  fontWeight: 800, color: '#7c3aed', borderBottom: '1px solid var(--border)', width: 110 }}>Amount (₹)</th>
                          <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, color: '#7c3aed', borderBottom: '1px solid var(--border)', width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '7px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ padding: '5px 8px' }}>
                              <input
                                className="form-control"
                                style={{ margin: 0, fontSize: 13 }}
                                placeholder="Enter item name..."
                                value={row.item}
                                onChange={e => updateLineItem(idx, 'item', e.target.value)}
                              />
                            </td>
                            <td style={{ padding: '5px 8px' }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ margin: 0, fontSize: 13, textAlign: 'right' }}
                                placeholder="0"
                                value={row.qty}
                                onChange={e => updateLineItem(idx, 'qty', e.target.value)}
                              />
                            </td>
                            <td style={{ padding: '5px 8px' }}>
                              <input
                                type="number"
                                className="form-control"
                                style={{ margin: 0, fontSize: 13, textAlign: 'right' }}
                                placeholder="0.00"
                                value={row.rate}
                                onChange={e => updateLineItem(idx, 'rate', e.target.value)}
                              />
                            </td>
                            <td style={{ padding: '5px 8px' }}>
                              <select
                                className="form-control"
                                style={{ margin: 0, fontSize: 13 }}
                                value={row.uom}
                                onChange={e => updateLineItem(idx, 'uom', e.target.value)}
                              >
                                <option value="">UOM</option>
                                {Array.from(new Set(['Kg','Meter','Nos','Box','Roll','Bundle',...(options.masters?.unit_master||[])])).map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#065f46' }}>
                              {row.amount ? `₹ ${Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                                title="Remove row"
                                disabled={lineItems.length === 1}
                              >
                                <X size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f5f3ff', borderTop: '2px solid #ddd6fe' }}>
                          <td colSpan={5} style={{ padding: '9px 12px', fontWeight: 800, fontSize: 13, textAlign: 'right', color: '#4b5563' }}>Grand Total</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 900, fontSize: 14, color: '#7c3aed' }}>
                            ₹ {lineItems.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

            </div>

            <div id="sec-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Security Guard Sign-Off & Verification</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Security Guard Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={guardName}
                      onChange={e => setGuardName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Inward Verification Status</label>
                    {isCustomStatus ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input 
                          autoFocus
                          className="form-control" 
                          placeholder="Type new status..."
                          value={customStatusVal}
                          onChange={(e) => setCustomStatusVal(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await handleSaveCustomStatus();
                            }
                          }}
                        />
                        <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomStatus} title="Save">
                          <CheckCircle size={16} />
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomStatus(false); setStatus(''); }} title="Cancel">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select className="form-control" value={status} onChange={e => {
                        if (e.target.value === 'custom_add_new') {
                          setIsCustomStatus(true);
                          setCustomStatusVal('');
                        } else {
                          setStatus(e.target.value);
                        }
                      }}>
                        <option value="">Select Status...</option>
                        {Array.from(new Set([
                          "Open", "Closed",
                          ...(options.masters?.inward_status_master || [])
                        ])).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Status...</option>
                      </select>
                    )}
                  </div>

                </div>

                <div className="form-group">
                  <label>Security Checklist / Remarks ⚠️</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Verification remarks or seal details..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>

            </div>

          </div>


          {/* Bottom Action Bar */}
          <div style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 100 }}>
              <X size={15} /> Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed', minWidth: 120 }}>
              <Check size={15} /> Save Slip
            </button>
          </div>

        </div>
      )}

      <datalist id="vehicles-list">
        {dbVehicles.map(v => (
          <option key={v.id} value={v.vehicle_number}>{v.vehicle_number} ({v.make} {v.model})</option>
        ))}
      </datalist>

      {/* A4 Modal View Preview */}
      {viewModalInward && (
        <A4DocumentPreview
          isOpen={!!viewModalInward}
          onClose={() => setViewModalInward(null)}
          title="Gate Inward Entry"
          documentNumber={viewModalInward.id}
          status={viewModalInward.status}
          sections={[
            {
              title: 'Reference Info',
              type: 'grid',
              icon: 'Truck',
              data: [
                { label: 'Date', value: viewModalInward.dateTime },
                { label: 'Party Name', value: viewModalInward.partyName },
                { label: 'Vehicle No', value: viewModalInward.vehicleNo },
                { label: 'Driver Name', value: viewModalInward.driverName },
                { label: 'Driver Mobile', value: viewModalInward.driverMobile }
              ]
            },
            {
              title: 'Material & Delivery Info',
              type: 'grid',
              icon: 'Box',
              data: [
                { label: 'Material Type', value: viewModalInward.materialType },
                { label: 'Purpose', value: viewModalInward.purpose },
                { label: 'DC / Challan No', value: viewModalInward.dcNo },
                { label: 'DC Date', value: viewModalInward.dcDate },
                { label: 'Item Description', value: viewModalInward.itemDesc }
              ]
            },
            {
              title: 'Quantity & Weights',
              type: 'grid',
              icon: 'Scale',
              data: [
                { label: 'Quantity', value: `${viewModalInward.qty} ${viewModalInward.unit}` },
                { label: 'Weight', value: `${viewModalInward.weight} Kg` },
                { label: 'Packages', value: `${viewModalInward.packages} Nos` }
              ]
            },
            {
              title: 'Security Logs',
              type: 'grid',
              icon: 'Shield',
              data: [
                { label: 'Guard Name', value: viewModalInward.guardName },
                { label: 'Inward Time', value: viewModalInward.inwardTime || viewModalInward.inTime || '-' },
                { label: 'Remarks', value: viewModalInward.remarks || '-' }
              ]
            }
          ]}
        />
      )}

    </div>
  );
}
