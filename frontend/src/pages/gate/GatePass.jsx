import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Search, Plus, Trash2, Printer, Check, CheckCircle,
  Clock, Truck, Edit, AlertCircle, UserCheck, X, Download
} from 'lucide-react';
import api, { dropdownAPI, subMasterAPI, partyAPI, employeeAPI, buyerOrderAPI } from '../../services/api';

export default function GatePass() {
  // Local Storage Database
  const [passes, setPasses] = useState(() => {
    const saved = localStorage.getItem('gate_pass_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [parties, setParties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [options, setOptions] = useState({});
  const [dbVehicles, setDbVehicles] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [isCustomPassType, setIsCustomPassType] = useState(false);
  const [customPassTypeVal, setCustomPassTypeVal] = useState('');
  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [customStatusVal, setCustomStatusVal] = useState('');

  // Grid Custom Options
  const [editingCustomUnitIndex, setEditingCustomUnitIndex] = useState(null);
  const [customUnitVal, setCustomUnitVal] = useState('');
  const [editingCustomReturnableIndex, setEditingCustomReturnableIndex] = useState(null);
  const [customReturnableVal, setCustomReturnableVal] = useState('');

  const handleSaveCustomGridOption = async (entity, value, rowIndex, field) => {
    if (!value.trim()) return;
    try {
      await subMasterAPI.create(entity, { 
        entity, 
        name: value.trim(), 
        is_active: true 
      });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      handleItemGridChange(rowIndex, field, value.trim());
      
      if (entity === 'uom_master') {
        setEditingCustomUnitIndex(null);
        setCustomUnitVal('');
      } else if (entity === 'gate_returnable_master') {
        setEditingCustomReturnableIndex(null);
        setCustomReturnableVal('');
      }
    } catch (err) {
      alert(`Error saving custom ${field}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partRes, dropRes, empRes, vehRes, boRes] = await Promise.all([
          partyAPI.list().catch(() => ({ data: [] })),
          dropdownAPI.getAll().catch(() => ({ data: {} })),
          employeeAPI.list().catch(() => ({ data: [] })),
          api.get('/fleet/vehicles').catch(() => ({ data: [] })),
          buyerOrderAPI.list().catch(() => ({ data: [] }))
        ]);
        setParties(partRes.data || []);
        setOptions(dropRes.data || {});
        setEmployees(empRes.data || []);
        setDbVehicles(vehRes.data || []);
        setDbOrders(boRes.data || []);

        const fetchedVehicles = vehRes.data || [];
        const fetchedBOs = boRes.data || [];
        const fetchedParties = partRes.data || [];

        // Check and seed local storage if empty
        const savedPass = localStorage.getItem('gate_pass_data');
        if (!savedPass || JSON.parse(savedPass).length === 0) {
          const seedData = [];
          for (let i = 0; i < 10; i++) {
            const vehicle = fetchedVehicles[(i + 4) % fetchedVehicles.length] || { vehicle_number: `TN-33-AA-100${i+1}` };
            const bo = fetchedBOs[(i + 2) % fetchedBOs.length] || { ibpo_number: `IBPO-26-00${i+1}`, buyer_name: 'HM Sweden' };
            const party = fetchedParties[(i + 2) % fetchedParties.length] || { company_name: bo.buyer_name || 'Raymond Ltd' };
            
            seedData.push({
              id: `GP-2026-00${i + 1}`,
              passDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
              passType: i % 2 === 0 ? "Returnable" : "Non-Returnable",
              partyName: party.company_name,
              partyAddress: party.address || party.billing_address || "123 Textile Zone, Coimbatore",
              contactPerson: party.contact_person || `Contact ${i + 1}`,
              mobileNo: party.mobile || party.phone || `987654322${i}`,
              vehicleNo: vehicle.vehicle_number,
              items: [
                {
                  name: i % 2 === 0 ? "Warping Beam Shell" : "Cardboard Packing Cones",
                  qty: 10 + i,
                  unit: "Nos",
                  returnable: i % 2 === 0 ? "Yes" : "No",
                  expectedReturn: i % 2 === 0 ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10) : ""
                }
              ],
              authorizedBy: "Manager A",
              validTill: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
              purpose: i % 2 === 0 ? "Material Return" : "Sample Dispatch",
              remarks: `Authorized gate pass for order ${bo.ibpo_number}`,
              status: i % 3 === 0 ? "Open" : "Used",
              printedBy: "Security Desk Admin"
            });
          }
          localStorage.setItem('gate_pass_data', JSON.stringify(seedData));
          setPasses(seedData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

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

  const handleSaveCustomPassType = async () => {
    if (!customPassTypeVal.trim()) return;
    try {
      await subMasterAPI.create('gate_pass_type_master', { 
        entity: 'gate_pass_type_master', 
        name: customPassTypeVal.trim(), 
        is_active: true 
      });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setPassType(customPassTypeVal.trim());
      setIsCustomPassType(false);
      setCustomPassTypeVal('');
    } catch (err) {
      alert('Error saving custom gate pass type');
    }
  };

  // View state: list mode or form mode
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Form Section active tab
  const [activeFormTab, setActiveFormTab] = useState('Reference Info');

  // Form input fields state
  const [passType, setPassType] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [validTill, setValidTill] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('Open');

  // Multi-row items grid state
  const [items, setItems] = useState([
    { name: '', qty: 1, unit: 'Nos', returnable: 'Yes', expectedReturn: '' }
  ]);

  // KPI Calculations
  const totalPasses = passes.length;
  const returnablePasses = passes.filter(p => p.passType === 'Returnable').length;
  const openPasses = passes.filter(p => p.status === 'Open').length;
  const expiredPasses = passes.filter(p => p.status === 'Expired').length;

  // Filtered list
  const filteredList = useMemo(() => {
    return passes.filter(p => {
      const pName = String(p.partyName || '');
      const vNo = String(p.vehicleNo || '');
      const idStr = String(p.id || '');
      const sTerm = String(searchTerm || '');
      const matchSearch = pName.toLowerCase().includes(sTerm.toLowerCase()) || 
                          vNo.toLowerCase().includes(sTerm.toLowerCase()) || 
                          idStr.toLowerCase().includes(sTerm.toLowerCase());
      const matchType = filterType === 'All' || p.passType === filterType;
      const matchFrom = filterFromDate ? p.passDate >= filterFromDate : true;
      const matchTo = filterToDate ? p.passDate <= filterToDate : true;
      return matchSearch && matchType && matchFrom && matchTo;
    });
  }, [passes, searchTerm, filterType, filterFromDate, filterToDate]);

  const handlePartyChange = (e) => {
    const pName = e.target.value;
    setPartyName(pName);
    const selectedParty = parties.find(p => p.company_name === pName);
    if (selectedParty) {
      setPartyAddress(selectedParty.address || selectedParty.billing_address || selectedParty.city || '');
      setContactPerson(selectedParty.contact_person || '');
      setMobileNo(selectedParty.mobile || selectedParty.phone || selectedParty.contact_number || '');
    } else {
      setPartyAddress('');
      setContactPerson('');
      setMobileNo('');
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { name: '', qty: 1, unit: 'Nos', returnable: 'Yes', expectedReturn: '' }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemGridChange = (index, field, value) => {
    setItems(items.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCreateNew = () => {
    const nextId = `GP-2026-00${passes.length + 1}`;
    setCurrentFormId(nextId);

    // Reset Form Fields
    setPassType('');
    setPartyName('');
    setPartyAddress('');
    setContactPerson('');
    setMobileNo('');
    setVehicleNo('');
    setItems([{ name: '', qty: 1, unit: 'Nos', returnable: 'Yes', expectedReturn: '' }]);
    setAuthorizedBy('');
    setValidTill('');
    setPurpose('');
    setRemarks('');
    setStatus('Open');

    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setCurrentFormId(item.id);
    setPassType(item.passType);
    setPartyName(item.partyName);
    setPartyAddress(item.partyAddress);
    setContactPerson(item.contactPerson);
    setMobileNo(item.mobileNo);
    setVehicleNo(item.vehicleNo);
    setItems(item.items);
    setAuthorizedBy(item.authorizedBy);
    setValidTill(item.validTill);
    setPurpose(item.purpose);
    setRemarks(item.remarks);
    setStatus(item.status);

    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!vehicleNo || items.some(item => !item.name || !item.qty)) {
      alert("Please enter the vehicle number and complete all item rows!");
      return;
    }

    const dateStr = new Date().toISOString().substring(0, 10);
    const isExisting = passes.some(p => p.id === currentFormId);

    if (isExisting) {
      const updated = passes.map(p => {
        if (p.id === currentFormId) {
          return {
            ...p,
            passType,
            partyName,
            partyAddress,
            contactPerson,
            mobileNo,
            vehicleNo,
            items,
            authorizedBy,
            validTill,
            purpose,
            remarks,
            status
          };
        }
        return p;
      });
      setPasses(updated);
      localStorage.setItem('gate_pass_data', JSON.stringify(updated));
    } else {
      const newPass = {
        id: currentFormId,
        passDate: dateStr,
        passType,
        partyName,
        partyAddress,
        contactPerson,
        mobileNo,
        vehicleNo,
        items,
        authorizedBy,
        validTill,
        purpose,
        remarks,
        status,
        printedBy: 'Security Desk Admin'
      };
      const updated = [newPass, ...passes];
      setPasses(updated);
      localStorage.setItem('gate_pass_data', JSON.stringify(updated));
    }
    setIsFormOpen(false);
    alert("Gate Pass created successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this Gate Pass?")) {
      const updated = passes.filter(p => p.id !== id);
      setPasses(updated);
      localStorage.setItem('gate_pass_data', JSON.stringify(updated));
    }
  };

  const handlePrintSlip = (item) => {
    alert(`Triggering spooler printing for Gate Pass: ${item.id}`);
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
                <FileText size={24} style={{ color: '#7c3aed' }} /> Gate Pass Creation Register
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
                Create, approve, and track Gate Passes for material inward, returnable warp beams, and machinery.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={() => alert('Exporting passes ledger...')}>
                <Download size={15} /> Export
              </button>
              <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Plus size={16} /> Add New Pass
              </button>
            </div>
          </div>

          {/* KPI METRICS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Gate Passes</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0 0 0' }}>{totalPasses}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Open Gate Passes</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: '8px 0 0 0' }}>{openPasses}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Returnable Passes</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6', margin: '8px 0 0 0' }}>{returnablePasses}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Expired Passes</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444', margin: '8px 0 0 0' }}>{expiredPasses}</h3>
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
                  placeholder="Search by Pass No, Recipient, or vehicle..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', margin: 0, fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Pass Type:</span>
                <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                  <option value="All">All Types</option>
                  <option value="Returnable">Returnable</option>
                  <option value="Non-Returnable">Non-Returnable</option>
                  <option value="Visitor Pass">Visitor Pass</option>
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
                    <th>PASS NO</th>
                    <th>DATE</th>
                    <th>PARTY NAME</th>
                    <th>VEHICLE NO</th>
                    <th>PASS TYPE</th>
                    <th>VALID TILL</th>
                    <th>AUTHORIZED BY</th>
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
                        <td>{item.passDate}</td>
                        <td style={{ fontWeight: 600 }}>{item.partyName}</td>
                        <td style={{ fontWeight: 650, color: '#4b5563' }}>🚚 {item.vehicleNo}</td>
                        <td style={{ fontWeight: 700, color: '#7c3aed' }}>{item.passType}</td>
                        <td style={{ color: '#ef4444', fontWeight: 600 }}>{item.validTill}</td>
                        <td>{item.authorizedBy}</td>
                        <td>
                          <span className={`badge ${item.status === 'Open' ? 'badge-pending' : item.status === 'Used' ? 'badge-active' : 'badge-draft'}`} style={{ borderRadius: '4px', fontSize: '11px', padding: '2px 8px' }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button className="btn btn-secondary" title="Edit Pass" onClick={() => handleEdit(item)} style={{ padding: '4px 8px', fontSize: '12px' }}>
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
                {passes.some(p => p.id === currentFormId) ? `Edit Gate Pass (${currentFormId})` : `Add New Gate Pass / Authorization Token`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorized Material Movement Verification Slip</span>
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

          {/* Form Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px', position: 'sticky', top: '0', background: 'white', zIndex: 10, paddingTop: '10px' }}>
            {['Reference Info', 'Contact Details', 'Material Grid Details', 'Security Status'].map(tab => {
              const isSelected = activeFormTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveFormTab(tab);
                    const elId = tab === 'Reference Info' ? 'ref-info' : 
                                 tab === 'Contact Details' ? 'contact-info' : 
                                 tab === 'Material Grid Details' ? 'material-info' : 'security-info';
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
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Gate Pass Reference Information</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Gate Pass No *</label>
                    <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                  </div>

                  <div className="form-group">
                    <label>Gate Pass Type *</label>
                    {isCustomPassType ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input 
                          autoFocus
                          className="form-control" 
                          placeholder="Type new pass type..."
                          value={customPassTypeVal}
                          onChange={(e) => setCustomPassTypeVal(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              await handleSaveCustomPassType();
                            }
                          }}
                        />
                        <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPassType} title="Save">
                          <CheckCircle size={16} />
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPassType(false); setPassType(''); }} title="Cancel">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select className="form-control" value={passType} onChange={e => {
                        if (e.target.value === 'custom_add_new') {
                          setIsCustomPassType(true);
                          setCustomPassTypeVal('');
                        } else {
                          setPassType(e.target.value);
                        }
                      }}>
                        <option value="">Select Pass Type...</option>
                        {Array.from(new Set([
                          "Returnable", "Non-Returnable", "Visitor Pass", "Vehicle Pass", "Sample Pass",
                          ...(options.masters?.gate_pass_type_master || [])
                        ])).map(pt => (
                          <option key={pt} value={pt}>{pt}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Pass Type...</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Valid Till Date *</label>
                    <input type="date" className="form-control" value={validTill} onChange={e => setValidTill(e.target.value)} required />
                  </div>

                </div>

                <div className="form-group">
                  <label>Vehicle Register Number *</label>
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

            </div>

            <div id="contact-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Recipient Party Contact & Address Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Recipient Party Name *</label>
                    <select className="form-control" value={partyName} onChange={handlePartyChange}>
                      <option value="">Select Party...</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.company_name}>{p.company_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input type="text" className="form-control" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="text" className="form-control" value={mobileNo} onChange={e => setMobileNo(e.target.value)} required />
                  </div>

                </div>

                <div className="form-group">
                  <label>Consignee Physical Address (Auto Fill) *</label>
                  <input type="text" className="form-control" value={partyAddress} onChange={e => setPartyAddress(e.target.value)} required />
                </div>

            </div>

            <div id="material-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Item details Log Matrix Grid</h4>
                  <button type="button" className="btn btn-secondary" onClick={handleAddItemRow} style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Plus size={12} /> Add Row
                  </button>
                </div>

                <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Item Name *</th>
                      <th style={{ width: '110px' }}>Quantity *</th>
                      <th style={{ width: '110px' }}>Unit</th>
                      <th style={{ width: '110px' }}>Returnable</th>
                      <th>Expected Return Date</th>
                      <th style={{ width: '60px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }} 
                            placeholder="Material Name"
                            value={item.name}
                            onChange={e => handleItemGridChange(index, 'name', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control" 
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }} 
                            value={item.qty}
                            min="1"
                            onChange={e => handleItemGridChange(index, 'qty', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td>
                          {editingCustomUnitIndex === index ? (
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <input 
                                autoFocus
                                className="form-control" 
                                style={{ margin: 0, padding: '4px 8px', fontSize: '12px', minWidth: '60px' }}
                                placeholder="New unit"
                                value={customUnitVal}
                                onChange={(e) => setCustomUnitVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveCustomGridOption('uom_master', customUnitVal, index, 'unit');
                                  }
                                }}
                              />
                              <button type="button" className="btn btn-primary" style={{ padding: '0 4px' }} onClick={() => handleSaveCustomGridOption('uom_master', customUnitVal, index, 'unit')}>
                                <Check size={12} />
                              </button>
                              <button type="button" className="btn btn-secondary" style={{ padding: '0 4px' }} onClick={() => { setEditingCustomUnitIndex(null); handleItemGridChange(index, 'unit', 'Nos'); }}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <select 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                              value={item.unit}
                              onChange={e => {
                                if (e.target.value === 'custom_add_new') {
                                  setEditingCustomUnitIndex(index);
                                  setCustomUnitVal('');
                                } else {
                                  handleItemGridChange(index, 'unit', e.target.value);
                                }
                              }}
                            >
                              {Array.from(new Set([
                                "Nos", "Kg", "Meter",
                                ...(options.masters?.uom_master || [])
                              ])).map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                              <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Custom Unit...</option>
                            </select>
                          )}
                        </td>
                        <td>
                          {editingCustomReturnableIndex === index ? (
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <input 
                                autoFocus
                                className="form-control" 
                                style={{ margin: 0, padding: '4px 8px', fontSize: '12px', minWidth: '70px' }}
                                placeholder="New option"
                                value={customReturnableVal}
                                onChange={(e) => setCustomReturnableVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveCustomGridOption('gate_returnable_master', customReturnableVal, index, 'returnable');
                                  }
                                }}
                              />
                              <button type="button" className="btn btn-primary" style={{ padding: '0 4px' }} onClick={() => handleSaveCustomGridOption('gate_returnable_master', customReturnableVal, index, 'returnable')}>
                                <Check size={12} />
                              </button>
                              <button type="button" className="btn btn-secondary" style={{ padding: '0 4px' }} onClick={() => { setEditingCustomReturnableIndex(null); handleItemGridChange(index, 'returnable', 'Yes'); }}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <select 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                              value={item.returnable}
                              onChange={e => {
                                if (e.target.value === 'custom_add_new') {
                                  setEditingCustomReturnableIndex(index);
                                  setCustomReturnableVal('');
                                } else {
                                  handleItemGridChange(index, 'returnable', e.target.value);
                                }
                              }}
                            >
                              {Array.from(new Set([
                                "Yes", "No",
                                ...(options.masters?.gate_returnable_master || [])
                              ])).map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                              <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Custom Option...</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <input 
                            type="date" 
                            className="form-control" 
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }} 
                            value={item.expectedReturn}
                            disabled={item.returnable === 'No'}
                            onChange={e => handleItemGridChange(index, 'expectedReturn', e.target.value)}
                            required={item.returnable === 'Yes'}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItemRow(index)} 
                            style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            disabled={items.length === 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

            </div>

            <div id="security-info" className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Approvals, Security Check & Status</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Authorized By Dropdown (Employee Master) *</label>
                    <select className="form-control" value={authorizedBy} onChange={e => setAuthorizedBy(e.target.value)}>
                      <option value="">Select Employee...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={`${emp.name} (${emp.designation || 'Staff'})`}>
                          {emp.name} ({emp.designation || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gate Pass Status</label>
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
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomStatus(false); setStatus('Open'); }} title="Cancel">
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
                          "Open", "Used", "Expired",
                          ...(options.masters?.outward_status_master || [])
                        ])).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="custom_add_new" style={{ color: '#7c3aed', fontWeight: 'bold' }}>+ Add Custom Status...</option>
                      </select>
                    )}
                  </div>

                </div>

                <div className="form-group">
                  <label>Purpose of Material Movement *</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Describe material purpose..."
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    style={{ resize: 'none' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Remarks ⚠️</label>
                  <input type="text" className="form-control" placeholder="Verification Remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} />
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
