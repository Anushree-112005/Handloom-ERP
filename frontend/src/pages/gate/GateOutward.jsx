import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, Search, Plus, Printer, Check, 
  Clock, Truck, Trash2, Eye, Calendar, ShieldAlert, X, Edit, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GateOutward() {
  // Mock Outwards Database
  const [outwards, setOutwards] = useState([]);

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
  const [partyName, setPartyName] = useState('Raymond Ltd');
  const [materialType, setMaterialType] = useState('Fabric / Cloth');
  const [purpose, setPurpose] = useState('Sales Delivery');
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
  const [status, setStatus] = useState('Closed');

  // KPI Calculations
  const totalOutwards = outwards.length;
  const totalWeightCleared = outwards.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
  const totalPackagesDispatched = outwards.reduce((acc, curr) => acc + (Number(curr.packages) || 0), 0);
  const totalReturned = outwards.filter(o => o.purpose === 'Material Return').length;

  // Filtered List
  const filteredList = useMemo(() => {
    return outwards.filter(item => {
      const matchSearch = item.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPurpose = filterPurpose === 'All' || item.purpose === filterPurpose;
      const matchFrom = filterFromDate ? item.dateTime >= filterFromDate : true;
      const matchTo = filterToDate ? item.dateTime <= filterToDate : true;
      return matchSearch && matchPurpose && matchFrom && matchTo;
    });
  }, [outwards, searchTerm, filterPurpose, filterFromDate, filterToDate]);

  const handleCreateNew = () => {
    const nextId = `GOT-2026-00${outwards.length + 1}`;
    setCurrentFormId(nextId);

    // Reset Form Fields
    setInwardRef('');
    setVehicleNo('');
    setDriverName('');
    setDriverMobile('');
    setPartyName('Raymond Ltd');
    setMaterialType('Fabric / Cloth');
    setPurpose('Sales Delivery');
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
    setStatus('Closed');

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
      setOutwards(outwards.map(o => {
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
      }));
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
      setOutwards([newEntry, ...outwards]);
    }
    setIsFormOpen(false);
    alert("Gate Outward saved successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this gate outward record?")) {
      setOutwards(outwards.filter(o => o.id !== id));
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
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px' }}>
            {['Reference Info', 'Driver & Recipient Details', 'Cargo & Security'].map(tab => {
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
                    />
                  </div>

                  <div className="form-group">
                    <label>Gate Outward Status</label>
                    <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {activeFormTab === 'Driver & Recipient Details' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                      <option value="Raymond Ltd">Raymond Ltd</option>
                      <option value="Reliance Retail">Reliance Retail</option>
                      <option value="Vardhman Spinning">Vardhman Spinning Mills</option>
                      <option value="Chemical Traders">Chemical Traders</option>
                    </select>
                  </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label>Material Type *</label>
                    <select className="form-control" value={materialType} onChange={e => setMaterialType(e.target.value)}>
                      <option value="Fabric / Cloth">Fabric / Cloth</option>
                      <option value="Yarn">Yarn</option>
                      <option value="Dyes & Chemicals">Dyes & Chemicals</option>
                      <option value="Spare Parts">Spare Parts</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Purpose Dropdown *</label>
                    <select className="form-control" value={purpose} onChange={e => setPurpose(e.target.value)}>
                      <option value="Sales Delivery">Sales Delivery</option>
                      <option value="Job Work Out">Job Work Out</option>
                      <option value="Material Return">Material Return</option>
                      <option value="Sample Dispatch">Sample Dispatch</option>
                      <option value="Machinery Out">Machinery Out</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                </div>

              </div>
            )}

            {activeFormTab === 'Cargo & Security' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                    <select className="form-control" value={unit} onChange={e => setUnit(e.target.value)}>
                      <option value="Meter">Meter</option>
                      <option value="Kg">Kg</option>
                      <option value="Nos">Nos</option>
                    </select>
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
            )}

          </div>

        </div>
      )}

    </div>
  );
}
