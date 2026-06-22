import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpRight, Search, Plus, Printer, Check, CheckCircle,
  Clock, Truck, Trash2, Eye, Calendar, ShieldAlert, X, Edit, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { partyAPI, dropdownAPI, subMasterAPI, buyerOrderAPI } from '../../services/api';

export default function GateOutward() {
  // Local Storage Database
  const [outwards, setOutwards] = useState(() => {
    const saved = localStorage.getItem('gate_outward_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [dbVehicles, setDbVehicles] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [isCustomPurpose, setIsCustomPurpose] = useState(false);
  const [customPurposeVal, setCustomPurposeVal] = useState('');
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [customMaterialVal, setCustomMaterialVal] = useState('');
  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [customStatusVal, setCustomStatusVal] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitVal, setCustomUnitVal] = useState('');

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
        const savedOut = localStorage.getItem('gate_outward_data');
        if (!savedOut || JSON.parse(savedOut).length === 0) {
          const seedData = [];
          for (let i = 0; i < 10; i++) {
            const vehicle = fetchedVehicles[(i + 2) % fetchedVehicles.length] || { vehicle_number: `TN-33-AA-100${i+1}` };
            const bo = fetchedBOs[(i + 1) % fetchedBOs.length] || { ibpo_number: `IBPO-${String(i+1).padStart(5, '0')}`, buyer_name: 'HM Sweden' };
            const party = fetchedParties[(i + 1) % fetchedParties.length] || { company_name: bo.buyer_name || 'Raymond Ltd' };
            
            seedData.push({
              id: `GOT-${String(i + 1).padStart(5, '0')}`,
              dateTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
              inwardRef: `GIN-${String(i + 1).padStart(5, '0')}`,
              vehicleNo: vehicle.vehicle_number,
              driverName: `Driver ${i + 5}`,
              driverMobile: `987654311${i}`,
              partyName: party.company_name,
              materialType: i % 2 === 0 ? "Fabric / Cloth" : "Yarn",
              purpose: "Sales Delivery",
              dcNo: `DC-OUT-00${i + 1}`,
              invoiceNo: bo.ibpo_number, // Link directly to IBPO order number
              itemDesc: i % 2 === 0 ? "Finished Cotton Fabric Rolls" : "40s Cotton Weft Combed Cones",
              qty: 800 + i * 150,
              unit: i % 2 === 0 ? "Meter" : "Kg",
              weight: 850 + i * 150,
              packages: 15 + i,
              gatePassNo: `GP-${String(i + 1).padStart(5, '0')}`,
              guardName: "K. Palanisamy",
              outTime: `17:${10 + i}`,
              remarks: `Sales delivery clearance for order ${bo.ibpo_number}`,
              status: i % 4 === 0 ? "Open" : "Closed"
            });
          }
          localStorage.setItem('gate_outward_data', JSON.stringify(seedData));
          setOutwards(seedData);
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
      alert('Error saving custom purpose');
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

  const handleSaveCustomStatus = async () => {
    if (!customStatusVal.trim()) return;
    try {
      await subMasterAPI.create('outward_status_master', { 
        entity: 'outward_status_master', 
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
  const [filterPurpose, setFilterPurpose] = useState('All');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Form Section active tab
  const [activeFormTab, setActiveFormTab] = useState('Reference Info');

  // Form input fields state
  const [inwardRef, setInwardRef] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [partyName, setPartyName] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dcNo, setDcNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('Meter');
  const [weight, setWeight] = useState('');
  const [packages, setPackages] = useState('');
  const [gatePassNo, setGatePassNo] = useState('');
  const [guardName, setGuardName] = useState('K. Palanisamy');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('');

  // KPI Calculations
  const totalOutwards = outwards.length;
  const totalWeightCleared = outwards.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
  const totalPackagesDispatched = outwards.reduce((acc, curr) => acc + (Number(curr.packages) || 0), 0);
  const totalReturned = outwards.filter(o => o.purpose === 'Material Return').length;

  // Filtered List
  const filteredList = useMemo(() => {
    return outwards.filter(item => {
      const vNo = String(item.vehicleNo || '');
      const pName = String(item.partyName || '');
      const idStr = String(item.id || '');
      const sTerm = String(searchTerm || '');
      
      const matchSearch = vNo.toLowerCase().includes(sTerm.toLowerCase()) || 
                          pName.toLowerCase().includes(sTerm.toLowerCase()) || 
                          idStr.toLowerCase().includes(sTerm.toLowerCase());
      const matchPurpose = filterPurpose === 'All' || item.purpose === filterPurpose;
      const matchFrom = filterFromDate ? item.dateTime >= filterFromDate : true;
      const matchTo = filterToDate ? item.dateTime <= filterToDate : true;
      return matchSearch && matchPurpose && matchFrom && matchTo;
    });
  }, [outwards, searchTerm, filterPurpose, filterFromDate, filterToDate]);

  const handleCreateNew = () => {
    const nextId = `GOT-${String(outwards.length + 1).padStart(5, '0')}`;
    setCurrentFormId(nextId);

    // Reset Form Fields
    setInwardRef('');
    setVehicleNo('');
    setDriverName('');
    setDriverMobile('');
    setPartyName('');
    setMaterialType('');
    setPurpose('');
    setDcNo('');
    setInvoiceNo('');
    setItemDesc('');
    setQty('');
    setUnit('Meter');
    setWeight('');
    setPackages('');
    setGatePassNo('');
    setGuardName('K. Palanisamy');
    setRemarks('');
    setStatus('');

    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setCurrentFormId(item.id);
    setInwardRef(item.inwardRef);
    setVehicleNo(item.vehicleNo);
    setDriverName(item.driverName);
    setDriverMobile(item.driverMobile);
    setPartyName(item.partyName);
    setMaterialType(item.materialType);
    setPurpose(item.purpose);
    setDcNo(item.dcNo);
    setInvoiceNo(item.invoiceNo);
    setItemDesc(item.itemDesc);
    setQty(item.qty);
    setUnit(item.unit);
    setWeight(item.weight);
    setPackages(item.packages);
    setGatePassNo(item.gatePassNo);
    setGuardName(item.guardName);
    setRemarks(item.remarks);
    setStatus(item.status);

    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!vehicleNo || !driverName || !gatePassNo) {
      alert("Please fill in all mandatory fields!");
      return;
    }

    const dateStr = new Date().toISOString().substring(0, 10);
    const timeStr = new Date().toISOString().substring(11, 16);
    const isExisting = outwards.some(o => o.id === currentFormId);

    if (isExisting) {
      const updated = outwards.map(o => {
        if (o.id === currentFormId) {
          return {
            ...o,
            inwardRef,
            vehicleNo,
            driverName,
            driverMobile,
            partyName,
            materialType,
            purpose,
            dcNo,
            invoiceNo,
            itemDesc,
            qty: Number(qty),
            unit,
            weight: Number(weight),
            packages: Number(packages),
            gatePassNo,
            guardName,
            remarks,
            status
          };
        }
        return o;
      });
      setOutwards(updated);
      localStorage.setItem('gate_outward_data', JSON.stringify(updated));
    } else {
      const newEntry = {
        id: currentFormId,
        dateTime: dateStr,
        inwardRef,
        vehicleNo,
        driverName,
        driverMobile,
        partyName,
        materialType,
        purpose,
        dcNo,
        invoiceNo,
        itemDesc,
        qty: Number(qty),
        unit,
        weight: Number(weight),
        packages: Number(packages),
        gatePassNo,
        guardName,
        outTime: timeStr,
        remarks,
        status
      };
      const updated = [newEntry, ...outwards];
      setOutwards(updated);
      localStorage.setItem('gate_outward_data', JSON.stringify(updated));
    }
    setIsFormOpen(false);
    alert("Gate Outward saved successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this gate outward record?")) {
      const updated = outwards.filter(o => o.id !== id);
      setOutwards(updated);
      localStorage.setItem('gate_outward_data', JSON.stringify(updated));
    }
  };

  const handlePrintSlip = (item) => {
    alert(`Triggering print for Gate Outward Exit Pass: ${item.id}`);
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
                <ArrowUpRight size={24} style={{ color: '#7c3aed' }} /> Gate Outward Register
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
                Log and authorize all outgoing material shipments, sales dispatches, returns, and machinery movement.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={() => alert('Exporting outwards ledger...')}>
                <Download size={15} /> Export
              </button>
              <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Plus size={16} /> Add New Outward
              </button>
            </div>
          </div>

          {/* KPI METRICS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Outwards Cleared</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0 0 0' }}>{totalOutwards}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Cargo Weight Dispatched</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: '8px 0 0 0' }}>{totalWeightCleared.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>Kg</span></h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Packages Dispatched</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', margin: '8px 0 0 0' }}>{totalPackagesDispatched} <span style={{ fontSize: '14px', fontWeight: 500 }}>Bales</span></h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Material Returns Logged</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444', margin: '8px 0 0 0' }}>{totalReturned}</h3>
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
                  placeholder="Search by Outward No, Vehicle, or Recipient..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', margin: 0, fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Purpose:</span>
                <select className="form-control" value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                  <option value="All">All Purposes</option>
                  <option value="Sales Delivery">Sales Delivery</option>
                  <option value="Job Work Out">Job Work Out</option>
                  <option value="Material Return">Material Return</option>
                  <option value="Sample Dispatch">Sample Dispatch</option>
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
                    <th>DELIVERY CHALLAN</th>
                    <th>TOTAL QUANTITY</th>
                    <th>GATE PASS</th>
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
                        <td style={{ fontWeight: 700 }}>🎫 {item.gatePassNo}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button className="btn btn-secondary" title="Edit Outward" onClick={() => handleEdit(item)} style={{ padding: '4px 8px', fontSize: '12px' }}>
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
                {outwards.some(o => o.id === currentFormId) ? `Edit Gate Outward Record (${currentFormId})` : `Add New Gate Outward / Clearance`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Official Security Checkpost Material Dispatch Clearance Register</span>
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
            {['Reference Info', 'Driver & Recipient Details', 'Cargo & Security'].map(tab => {
              const isSelected = activeFormTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveFormTab(tab);
                    const elId = tab === 'Reference Info' ? 'ref-info' : tab === 'Driver & Recipient Details' ? 'driver-info' : 'cargo-info';
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
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Gate Outward Reference Information</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Gate Outward No *</label>
                    <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                  </div>

                  <div className="form-group">
                    <label>Gate Pass No *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. GP-9011" 
                      value={gatePassNo}
                      onChange={e => setGatePassNo(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gate Inward Ref No ⚠️</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="GIN-xxxx ref" 
                      value={inwardRef}
                      onChange={e => setInwardRef(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-group">
                    <label>Sales Invoice Ref ⚠️</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="INV-xxxx link" 
                      value={invoiceNo}
                      onChange={e => setInvoiceNo(e.target.value.toUpperCase())}
                      list="orders-list"
                    />
                  </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Vehicle Register Number *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. TN-30-AA-8877" 
                      value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                      required
                      list="vehicles-list"
                    />
                  </div>

                  <div className="form-group">
                    <label>Gate Outward Status</label>
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
                          ...(options.masters?.outward_status_master || [])
                        ])).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Status...</option>
                      </select>
                    )}
                  </div>
                </div>

            </div>

            <div id="driver-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Driver & Consignee Recipient Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
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
                      placeholder="10-digit phone" 
                      value={driverMobile}
                      onChange={e => setDriverMobile(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Recipient Party / Customer *</label>
                    <select className="form-control" value={partyName} onChange={e => setPartyName(e.target.value)}>
                      <option value="">Select Party...</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.company_name}>{p.company_name}</option>
                      ))}
                    </select>
                  </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
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
                          "Fabric / Cloth", "Yarn", "Dyes & Chemicals", "Spare Parts", "Others",
                          ...(options.masters?.material_type_master || [])
                        ])).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Material...</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Purpose Dropdown *</label>
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
                          "Sales Delivery", "Job Work Out", "Material Return", "Sample Dispatch", "Machinery Out", "Others",
                          ...(options.masters?.purpose_of_visit_master || [])
                        ])).map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Purpose...</option>
                      </select>
                    )}
                  </div>

                </div>

            </div>

            <div id="cargo-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Cargo Inward details & Gate Checkpost verification</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Delivery Challan No *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="DC number" 
                      value={dcNo}
                      onChange={e => setDcNo(e.target.value)}
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

                  <div className="form-group">
                    <label>Unit *</label>
                    {isCustomUnit ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                          <Check size={16} />
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
                        <option value="Meter">Meter</option>
                        <option value="Kg">Kg</option>
                        <option value="Nos">Nos</option>
                        {Array.from(new Set([
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

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Weight (KG) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Total gross cargo weight" 
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      required
                    />
                  </div>

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

                </div>

                <div className="form-group">
                  <label>Item Description Details *</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Enter detailed description of exiting cargo packages..."
                    value={itemDesc}
                    onChange={e => setItemDesc(e.target.value)}
                    style={{ resize: 'none' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Remarks ⚠️</label>
                  <input type="text" className="form-control" placeholder="Checklist remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
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

      <datalist id="orders-list">
        {dbOrders.map(o => (
          <option key={o.id} value={o.ibpo_number}>{o.ibpo_number} ({o.buyer_name})</option>
        ))}
      </datalist>

    </div>
  );
}
