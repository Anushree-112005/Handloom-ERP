import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDownLeft, Search, Plus, Printer, Check, CheckCircle,
  Clock, Truck, Trash2, Eye, Calendar, ShieldAlert, X, Edit, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { partyAPI, dropdownAPI, subMasterAPI, buyerOrderAPI } from '../../services/api';

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

        // Check and seed local storage if empty
        const saved = localStorage.getItem('gate_inward_data');
        if (!saved || JSON.parse(saved).length === 0) {
          const seedData = [];
          for (let i = 0; i < 10; i++) {
            const vehicle = fetchedVehicles[i % fetchedVehicles.length] || { vehicle_number: `TN-33-AA-100${i+1}` };
            const bo = fetchedBOs[i % fetchedBOs.length] || { ibpo_number: `IBPO-26-00${i+1}`, buyer_name: 'HM Sweden' };
            const party = fetchedParties[i % fetchedParties.length] || { company_name: bo.buyer_name || 'Raymond Ltd' };
            
            seedData.push({
              id: `GIN-2026-00${i + 1}`,
              dateTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
              vehicleNo: vehicle.vehicle_number,
              driverName: `Driver ${i + 1}`,
              driverMobile: `987654300${i}`,
              partyName: party.company_name,
              materialType: i % 2 === 0 ? "Yarn" : "Fabric / Cloth",
              purpose: "Material Delivery",
              dcNo: `DC-IN-00${i + 1}`,
              dcDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
              itemDesc: i % 2 === 0 ? "40s Cotton Weft Combed Cones" : "Finished Cotton Fabric Rolls",
              qty: 1000 + i * 200,
              unit: i % 2 === 0 ? "Kg" : "Meter",
              weight: 1050 + i * 200,
              packages: 20 + i * 2,
              guardName: "S. Rajendran",
              inTime: `09:${30 + i}`,
              remarks: `Seeded entry for order ${bo.ibpo_number}`,
              status: i % 3 === 0 ? "Open" : "Closed"
            });
          }
          localStorage.setItem('gate_inward_data', JSON.stringify(seedData));
          setInwards(seedData);
        }
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
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('All');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Form Section active tab
  const [activeFormTab, setActiveFormTab] = useState('Reference Info');

  // Form input fields state
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [partyName, setPartyName] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dcNo, setDcNo] = useState('');
  const [dcDate, setDcDate] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [weight, setWeight] = useState('');
  const [packages, setPackages] = useState('');
  const [guardName, setGuardName] = useState('S. Rajendran');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('');

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
    const nextId = `GIN-2026-00${inwards.length + 1}`;
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
    setItemDesc('');
    setQty('');
    setUnit('');
    setWeight('');
    setPackages('');
    setGuardName('S. Rajendran');
    setRemarks('');
    setStatus('');

    setActiveFormTab('Reference Info');
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
    setItemDesc(item.itemDesc);
    setQty(item.qty);
    setUnit(item.unit);
    setWeight(item.weight);
    setPackages(item.packages);
    setGuardName(item.guardName);
    setRemarks(item.remarks);
    setStatus(item.status);

    setActiveFormTab('Reference Info');
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

    if (isExisting) {
      const updated = inwards.map(i => {
        if (i.id === currentFormId) {
          return {
            ...i,
            vehicleNo,
            driverName,
            driverMobile,
            partyName,
            materialType,
            purpose,
            dcNo,
            dcDate,
            itemDesc,
            qty: Number(qty),
            unit,
            weight: Number(weight),
            packages: Number(packages),
            guardName,
            remarks,
            status: status || 'Open'
          };
        }
        return i;
      });
      setInwards(updated);
      localStorage.setItem('gate_inward_data', JSON.stringify(updated));
    } else {
      const newEntry = {
        id: currentFormId,
        dateTime: dateStr,
        vehicleNo,
        driverName,
        driverMobile,
        partyName,
        materialType,
        purpose,
        dcNo,
        dcDate,
        itemDesc,
        qty: Number(qty),
        unit,
        weight: Number(weight),
        packages: Number(packages),
        guardName,
        inwardTime: timeStr,
        remarks,
        status: status || 'Open'
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Packing Slips / Inwards</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0 0 0' }}>{totalInwards}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Closed Inwards</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: '8px 0 0 0' }}>{closedInwards}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Active In Yard (Open)</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', margin: '8px 0 0 0' }}>{openInwards}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Packed (Packages)</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6', margin: '8px 0 0 0' }}>{totalPackages} <span style={{ fontSize: '14px', fontWeight: 500 }}>Nos</span></h3>
            </div>

          </div>

          {/* FILTER TOOLBAR BAR */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'white' }}>
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
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
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
                            <button className="btn btn-secondary" title="Edit Inward" onClick={() => handleEdit(item)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                              <Edit size={12} /> Edit
                            </button>
                            <button className="btn btn-secondary" title="Print Slip" onClick={() => handlePrintSlip(item)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                              <Printer size={12} /> Print
                            </button>
                            <button className="btn btn-secondary" title="Delete" onClick={() => handleDelete(item.id)} style={{ padding: '4px 8px', color: 'var(--danger)' }}>
                              <Trash2 size={12} />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                {inwards.some(i => i.id === currentFormId) ? `Edit Gate Inward Record (${currentFormId})` : `Add New Gate Inward / Vehicle Entry`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Security Checkpost Material Entry Register</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <X size={15} /> Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Check size={15} /> Save Slip
              </button>
            </div>
          </div>

          {/* Form Section Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px', position: 'sticky', top: '0', background: 'white', zIndex: 10, paddingTop: '10px' }}>
            {['Reference Info', 'Material & Weight Details', 'Security Signatures'].map(tab => {
              const isSelected = activeFormTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveFormTab(tab);
                    const elId = tab === 'Reference Info' ? 'ref-info' : tab === 'Material & Weight Details' ? 'mat-info' : 'sec-info';
                    document.getElementById(elId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: 'none',
                    background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                    color: isSelected ? '#7c3aed' : 'var(--text-secondary)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab}
                </button>
              );
            })}
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
                    <label>Quantity *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={qty}
                      onChange={e => setQty(e.target.value)}
                      required
                    />
                  </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Unit *</label>
                    {isCustomUnit ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input 
                          autoFocus
                          className="form-control" 
                          placeholder="Type new unit..."
                          value={customUnitVal}
                          onChange={(e) => setCustomUnitVal(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await handleSaveCustomUnit();
                            }
                          }}
                        />
                        <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomUnit} title="Save">
                          <CheckCircle size={16} />
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomUnit(false); setUnit(''); }} title="Cancel">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select className="form-control" value={unit} onChange={e => {
                        if (e.target.value === 'custom_add_new') {
                          setIsCustomUnit(true);
                          setCustomUnitVal('');
                        } else {
                          setUnit(e.target.value);
                        }
                      }}>
                        <option value="">Select Unit...</option>
                        {Array.from(new Set([
                          "Kg", "Meter", "Nos",
                          ...(options.masters?.unit_master || [])
                        ])).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Unit...</option>
                      </select>
                    )}
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

                <div className="form-group">
                  <label>Item Description Details *</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Enter detailed description of incoming packages..."
                    value={itemDesc}
                    onChange={e => setItemDesc(e.target.value)}
                    style={{ resize: 'none' }}
                    required
                  />
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

        </div>
      )}

      <datalist id="vehicles-list">
        {dbVehicles.map(v => (
          <option key={v.id} value={v.vehicle_number}>{v.vehicle_number} ({v.make} {v.model})</option>
        ))}
      </datalist>

    </div>
  );
}
