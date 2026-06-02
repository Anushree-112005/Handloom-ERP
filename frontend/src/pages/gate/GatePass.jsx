import { useState, useMemo } from 'react';
import { 
  FileText, Search, Plus, Trash2, Printer, Check, 
  Clock, Truck, Edit, AlertCircle, UserCheck, X, Download
} from 'lucide-react';

export default function GatePass() {
  // Mock Party Master Directory for Address Auto-fill
  const PARTY_DIRECTORY = {
    'Raymond Ltd': { address: 'Plot 4, Textile SEZ, Erode, Tamil Nadu', contact: 'Mr. Arvind Raymond', mobile: '9443322110' },
    'Reliance Retail': { address: '32/A, Industrial Ring Road, Coimbatore, Tamil Nadu', contact: 'Ms. Priyadarshini R.', mobile: '9500112233' },
    'Vardhman Spinning': { address: 'Spinning Mill Compound, Salem Bypass, Karur, Tamil Nadu', contact: 'Mr. Saravanan K.', mobile: '9842776655' },
    'Chemical Traders': { address: '12, SIPCOT Chemical Estate, Thoothukudi, Tamil Nadu', contact: 'Mr. Ganesan Moorthy', mobile: '9944883311' }
  };

  // Mock Employee Master for authorization
  const EMPLOYEES = [
    { code: 'EMP-010', name: 'Senthil Kumar (General Manager)' },
    { code: 'EMP-045', name: 'Mani Bharathi (Store Head)' },
    { code: 'EMP-088', name: 'Dinesh Balasamy (Managing Director)' }
  ];

  // Mock Gate Passes Database
  const [passes, setPasses] = useState([]);

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
  const [passType, setPassType] = useState('Returnable');
  const [partyName, setPartyName] = useState('Raymond Ltd');
  const [partyAddress, setPartyAddress] = useState(PARTY_DIRECTORY['Raymond Ltd'].address);
  const [contactPerson, setContactPerson] = useState(PARTY_DIRECTORY['Raymond Ltd'].contact);
  const [mobileNo, setMobileNo] = useState(PARTY_DIRECTORY['Raymond Ltd'].mobile);
  const [vehicleNo, setVehicleNo] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState(EMPLOYEES[0].name);
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
      const matchSearch = p.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'All' || p.passType === filterType;
      const matchFrom = filterFromDate ? p.passDate >= filterFromDate : true;
      const matchTo = filterToDate ? p.passDate <= filterToDate : true;
      return matchSearch && matchType && matchFrom && matchTo;
    });
  }, [passes, searchTerm, filterType, filterFromDate, filterToDate]);

  const handlePartyChange = (e) => {
    const pName = e.target.value;
    setPartyName(pName);
    if (PARTY_DIRECTORY[pName]) {
      setPartyAddress(PARTY_DIRECTORY[pName].address);
      setContactPerson(PARTY_DIRECTORY[pName].contact);
      setMobileNo(PARTY_DIRECTORY[pName].mobile);
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
    setPassType('Returnable');
    setPartyName('Raymond Ltd');
    setPartyAddress(PARTY_DIRECTORY['Raymond Ltd'].address);
    setContactPerson(PARTY_DIRECTORY['Raymond Ltd'].contact);
    setMobileNo(PARTY_DIRECTORY['Raymond Ltd'].mobile);
    setVehicleNo('');
    setItems([{ name: '', qty: 1, unit: 'Nos', returnable: 'Yes', expectedReturn: '' }]);
    setAuthorizedBy(EMPLOYEES[0].name);
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
      setPasses(passes.map(p => {
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
      }));
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
      setPasses([newPass, ...passes]);
    }
    setIsFormOpen(false);
    alert("Gate Pass created successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this Gate Pass?")) {
      setPasses(passes.filter(p => p.id !== id));
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
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px' }}>
            {['Reference Info', 'Contact Details', 'Material Grid Details', 'Security Status'].map(tab => {
              const isSelected = activeFormTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFormTab(tab)}
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
          <div style={{ minHeight: '400px' }}>
            
            {activeFormTab === 'Reference Info' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Gate Pass Reference Information</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Gate Pass No *</label>
                    <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                  </div>

                  <div className="form-group">
                    <label>Gate Pass Type *</label>
                    <select className="form-control" value={passType} onChange={e => setPassType(e.target.value)}>
                      <option value="Returnable">Returnable (Materials must return)</option>
                      <option value="Non-Returnable">Non-Returnable (Perm-out)</option>
                      <option value="Visitor Pass">Visitor Pass</option>
                      <option value="Vehicle Pass">Vehicle Pass</option>
                      <option value="Sample Pass">Sample Pass</option>
                    </select>
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
                  />
                </div>

              </div>
            )}

            {activeFormTab === 'Contact Details' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Recipient Party Contact & Address Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Recipient Party Name *</label>
                    <select className="form-control" value={partyName} onChange={handlePartyChange}>
                      {Object.keys(PARTY_DIRECTORY).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input type="text" className="form-control" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="number" className="form-control" value={mobileNo} onChange={e => setMobileNo(e.target.value)} required />
                  </div>

                </div>

                <div className="form-group">
                  <label>Consignee Physical Address (Auto Fill) *</label>
                  <input type="text" className="form-control" value={partyAddress} onChange={e => setPartyAddress(e.target.value)} required />
                </div>

              </div>
            )}

            {activeFormTab === 'Material Grid Details' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                          <select 
                            className="form-control" 
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            value={item.unit}
                            onChange={e => handleItemGridChange(index, 'unit', e.target.value)}
                          >
                            <option value="Nos">Nos</option>
                            <option value="Kg">Kg</option>
                            <option value="Meter">Meter</option>
                          </select>
                        </td>
                        <td>
                          <select 
                            className="form-control" 
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            value={item.returnable}
                            onChange={e => handleItemGridChange(index, 'returnable', e.target.value)}
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
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
            )}

            {activeFormTab === 'Security Status' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Approvals, Security Check & Status</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Authorized By Dropdown (Employee Master) *</label>
                    <select className="form-control" value={authorizedBy} onChange={e => setAuthorizedBy(e.target.value)}>
                      {EMPLOYEES.map(emp => (
                        <option key={emp.code} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gate Pass Status</label>
                    <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="Open">Open</option>
                      <option value="Used">Used</option>
                      <option value="Expired">Expired</option>
                    </select>
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
            )}

          </div>

        </div>
      )}

    </div>
  );
}
