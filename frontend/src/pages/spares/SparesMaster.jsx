import { useState, useMemo } from 'react';
import {
  Plus, Search, Trash2, Edit, Check, X,
  Settings, Wrench, Layers, Users, ShieldAlert, Download
} from 'lucide-react';

export default function SparesMaster() {
  // Master Category tab: 'Sections' | 'Spares'
  const [activeTab, setActiveTab] = useState('Sections');

  // Search filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Form toggle state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  // Static masters for references
  const PARTIES = ['Vardhman Spinning', 'Raymond Ltd', 'Reliance Retail', 'Chemical Traders', 'Standard Gears Ltd', 'Zenith Electricals'];
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];

  // ----------------------------------------------------
  // 1. SECTION MASTER DATA & FORM STATE
  // ----------------------------------------------------
  const [sections, setSections] = useState([
    { id: 'SEC-001', name: 'Weaving Division A', type: 'Weaving', dept: 'Production', incharge: 'Murugan Swamy (Maintenance In-charge)', machines: 24, desc: 'High-speed airjet loom section', status: 'Active' },
    { id: 'SEC-002', name: 'Dyeing Processing', type: 'Dyeing', dept: 'Processing', incharge: 'Senthil Kumar (General Manager)', machines: 12, desc: 'Yarn and package dyeing unit', status: 'Active' }
  ]);

  // Form Fields for Section Creation
  const [secName, setSecName] = useState('');
  const [secType, setSecType] = useState('Weaving');
  const [secDept, setSecDept] = useState('Production');
  const [secIncharge, setSecIncharge] = useState('Murugan Swamy (Maintenance In-charge)');
  const [secMachines, setSecMachines] = useState('');
  const [secDesc, setSecDesc] = useState('');
  const [secStatus, setSecStatus] = useState('Active');

  // ----------------------------------------------------
  // 2. SPARES MASTER DATA & FORM STATE
  // ----------------------------------------------------
  const [spares, setSpares] = useState([
    { id: 'SPR-001', name: 'Airjet Loom Solenoid Valve', category: 'Loom Parts', section: 'Weaving Division A', machineType: 'Airjet Loom', brand: 'Toyota', modelNo: 'TY-AJ-800', partNo: 'SLND-4409', uom: 'Nos', reorder: 5, minStock: 2, maxStock: 20, standardRate: 4500, hsnCode: '8448', gstPercent: 18, preferredSupplier: 'Standard Gears Ltd', leadTime: 7, status: 'Active' },
    { id: 'SPR-002', name: 'Syntron Lubricant oil T6', category: 'Lubricants', section: 'Dyeing Processing', machineType: 'Dyeing Vessel', brand: 'Mobil', modelNo: 'T6-Lub', partNo: 'LUB-8891', uom: 'Nos', reorder: 10, minStock: 5, maxStock: 50, standardRate: 850, hsnCode: '2710', gstPercent: 18, preferredSupplier: 'Chemical Traders', leadTime: 3, status: 'Active' }
  ]);

  // Form Fields for Spares Creation
  const [sprName, setSprName] = useState('');
  const [sprCategory, setSprCategory] = useState('Mechanical Parts');
  const [sprSection, setSprSection] = useState('Weaving Division A');
  const [sprMachineType, setSprMachineType] = useState('Airjet Loom');
  const [sprBrand, setSprBrand] = useState('');
  const [sprModelNo, setSprModelNo] = useState('');
  const [sprPartNo, setSprPartNo] = useState('');
  const [sprUom, setSprUom] = useState('Nos');
  const [sprReorder, setSprReorder] = useState('');
  const [sprMinStock, setSprMinStock] = useState('');
  const [sprMaxStock, setSprMaxStock] = useState('');
  const [sprStandardRate, setSprStandardRate] = useState('');
  const [sprHsn, setSprHsn] = useState('');
  const [sprGst, setSprGst] = useState(18);
  const [sprSupplier, setSprSupplier] = useState('Standard Gears Ltd');
  const [sprLeadTime, setSprLeadTime] = useState('');
  const [sprStatus, setSprStatus] = useState('Active');

  // Filtered lists
  const filteredSections = useMemo(() => {
    return sections.filter(sec => sec.name.toLowerCase().includes(searchTerm.toLowerCase()) || sec.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sections, searchTerm]);

  const filteredSpares = useMemo(() => {
    return spares.filter(spr => spr.name.toLowerCase().includes(searchTerm.toLowerCase()) || spr.id.toLowerCase().includes(searchTerm.toLowerCase()) || spr.partNo.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [spares, searchTerm]);

  // KPI Calculations
  const totalSectionsCount = sections.length;
  const activeSectionsCount = sections.filter(s => s.status === 'Active').length;
  const totalSparesCount = spares.length;
  const lowStockAlerts = spares.filter(s => s.minStock > 10).length; // dummy rule

  // Handlers
  const handleCreateNew = () => {
    let nextId = '';
    if (activeTab === 'Sections') {
      nextId = `SEC-00${sections.length + 1}`;
      setSecName('');
      setSecType('Weaving');
      setSecDept('Production');
      setSecIncharge('Murugan Swamy (Maintenance In-charge)');
      setSecMachines('');
      setSecDesc('');
      setSecStatus('Active');
    } else {
      nextId = `SPR-00${spares.length + 1}`;
      setSprName('');
      setSprCategory('Mechanical Parts');
      setSprSection('Weaving Division A');
      setSprMachineType('Airjet Loom');
      setSprBrand('');
      setSprModelNo('');
      setSprPartNo('');
      setSprUom('Nos');
      setSprReorder('');
      setSprMinStock('');
      setSprMaxStock('');
      setSprStandardRate('');
      setSprHsn('');
      setSprGst(18);
      setSprSupplier('Standard Gears Ltd');
      setSprLeadTime('');
      setSprStatus('Active');
    }
    setCurrentFormId(nextId);
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setCurrentFormId(row.id);
    if (activeTab === 'Sections') {
      setSecName(row.name);
      setSecType(row.type);
      setSecDept(row.dept);
      setSecIncharge(row.incharge);
      setSecMachines(row.machines);
      setSecDesc(row.desc);
      setSecStatus(row.status);
    } else {
      setSprName(row.name);
      setSprCategory(row.category);
      setSprSection(row.section);
      setSprMachineType(row.machineType);
      setSprBrand(row.brand);
      setSprModelNo(row.modelNo);
      setSprPartNo(row.partNo);
      setSprUom(row.uom);
      setSprReorder(row.reorder);
      setSprMinStock(row.minStock);
      setSprMaxStock(row.maxStock);
      setSprStandardRate(row.standardRate);
      setSprHsn(row.hsnCode);
      setSprGst(row.gstPercent);
      setSprSupplier(row.preferredSupplier);
      setSprLeadTime(row.leadTime);
      setSprStatus(row.status);
    }
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (activeTab === 'Sections') {
      if (!secName) {
        alert("Please enter the section name!");
        return;
      }
      const isExisting = sections.some(s => s.id === currentFormId);
      const newSec = {
        id: currentFormId,
        name: secName,
        type: secType,
        dept: secDept,
        incharge: secIncharge,
        machines: Number(secMachines) || 0,
        desc: secDesc,
        status: secStatus
      };
      if (isExisting) {
        setSections(sections.map(s => s.id === currentFormId ? newSec : s));
      } else {
        setSections([...sections, newSec]);
      }
    } else {
      if (!sprName || !sprReorder || !sprStandardRate) {
        alert("Please fill in spare name, reorder level, and rates!");
        return;
      }
      const isExisting = spares.some(s => s.id === currentFormId);
      const newSpr = {
        id: currentFormId,
        name: sprName,
        category: sprCategory,
        section: sprSection,
        machineType: sprMachineType,
        brand: sprBrand,
        modelNo: sprModelNo,
        partNo: sprPartNo,
        uom: sprUom,
        reorder: Number(sprReorder),
        minStock: Number(sprMinStock),
        maxStock: Number(sprMaxStock),
        standardRate: Number(sprStandardRate),
        hsnCode: sprHsn,
        gstPercent: Number(sprGst) || 18,
        preferredSupplier: sprSupplier,
        leadTime: Number(sprLeadTime) || 0,
        status: sprStatus
      };
      if (isExisting) {
        setSpares(spares.map(s => s.id === currentFormId ? newSpr : s));
      } else {
        setSpares([...spares, newSpr]);
      }
    }
    setIsFormOpen(false);
    alert("Master Record saved successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this master record?")) {
      if (activeTab === 'Sections') setSections(sections.filter(s => s.id !== id));
      else setSpares(spares.filter(s => s.id !== id));
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {!isFormOpen ? (
        /* ========================================================================= */
        /* =========================== 1. LIST MASTER MODE ========================= */
        /* ========================================================================= */
        <>
          {/* HEADER BAR */}
          <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Settings size={24} style={{ color: '#7c3aed' }} /> Spares & Section Master Registry
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
                Manage physical loom divisions, shop floors, spare part identifiers, and warehouse stocking levels.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => alert('Exporting Master registry ledger...')}>
                <Download size={15} /> Export Registry
              </button>
              <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Plus size={16} /> Add Master Record
              </button>
            </div>
          </div>

          {/* MASTER CATEGORY NAVIGATION TABS (PREMIUM ICON CARDS) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {[
              {
                key: 'Sections',
                label: 'Section Creation Master',
                desc: 'Define and audit loom rooms, shop floors, and active mechanical divisions.',
                icon: Layers
              },
              {
                key: 'Spares',
                label: 'Spares Creation Master',
                desc: 'Create, catalog, and manage inventory levels for all machinery spare parts.',
                icon: Wrench
              }
            ].map(tab => {
              const isSelected = activeTab === tab.key;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchTerm('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 24px',
                    borderRadius: '12px',
                    background: 'white',
                    border: isSelected ? '2px solid #7c3aed' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    boxShadow: isSelected ? '0 10px 25px -5px rgba(124, 58, 237, 0.12), 0 8px 10px -6px rgba(124, 58, 237, 0.12)' : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    outline: 'none'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? 'rgba(124, 58, 237, 0.1)' : 'rgba(100, 116, 139, 0.06)',
                    color: isSelected ? '#7c3aed' : '#64748b',
                    flexShrink: 0
                  }}>
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 style={{
                      fontWeight: '850',
                      fontSize: '15px',
                      color: isSelected ? '#7c3aed' : 'var(--text-primary)',
                      margin: 0
                    }}>
                      {tab.label}
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: '4px 0 0 0',
                      fontWeight: '500',
                      lineHeight: '1.4'
                    }}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* MASTER SUMMARY KPI METRICS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Sections Created</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0 0 0' }}>{totalSectionsCount}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Active Sections</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: '8px 0 0 0' }}>{activeSectionsCount}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Spares Catalogued</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6', margin: '8px 0 0 0' }}>{totalSparesCount}</h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Reorder Level Flags</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444', margin: '8px 0 0 0' }}>{lowStockAlerts}</h3>
            </div>

          </div>

          {/* DUAL MASTER DATA TABLES */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>

            {/* Global search filter toolbar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#f9fafb' }}>
              <div style={{ position: 'relative', maxWidth: '380px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder={activeTab === 'Sections' ? "Search Section Code or Name..." : "Search Spares Code, Name, or Part No..."}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '32px', margin: 0, fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {activeTab === 'Sections' ? (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>SECTION CODE</th>
                      <th>SECTION NAME</th>
                      <th>TYPE</th>
                      <th>DEPARTMENT</th>
                      <th>IN-CHARGE</th>
                      <th style={{ textAlign: 'center' }}>MACHINE COUNT</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSections.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td style={{ fontWeight: 650 }}>{row.name}</td>
                        <td>{row.type}</td>
                        <td>{row.dept}</td>
                        <td>{row.incharge}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.machines} Loom units</td>
                        <td>
                          <span className={`badge ${row.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{row.status}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>SPARE CODE</th>
                      <th>SPARE NAME</th>
                      <th>CATEGORY</th>
                      <th>SECTION</th>
                      <th>BRAND / MODEL / PART</th>
                      <th>UOM</th>
                      <th style={{ textAlign: 'right' }}>STD RATE</th>
                      <th style={{ textAlign: 'center' }}>REORDER / MIN / MAX</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpares.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td style={{ fontWeight: 650 }}>{row.name}</td>
                        <td>{row.category}</td>
                        <td style={{ fontWeight: 550 }}>{row.section}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {row.brand} | {row.modelNo || 'N/A'} | Pt: {row.partNo || 'N/A'}
                        </td>
                        <td>{row.uom}</td>
                        <td style={{ textAlign: 'right', fontWeight: 750 }}>₹ {row.standardRate.toLocaleString()}</td>
                        <td style={{ textAlign: 'center', fontWeight: 650, color: '#2563eb' }}>
                          {row.reorder} / {row.minStock} / {row.maxStock}
                        </td>
                        <td>
                          <span className={`badge ${row.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{row.status}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* =========================== 2. FORM VIEW MODE =========================== */
        /* ========================================================================= */
        <div className="card animate-fade" style={{ padding: '32px', minHeight: '520px', background: 'white' }}>

          {/* Form Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                {activeTab === 'Sections' ? `Factory Section Setup Matrix — ${currentFormId}` : `Catalog Spare Part Master Setup — ${currentFormId}`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorized physical machinery and inventory layout master registers</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <X size={15} /> Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Check size={15} /> Save Record
              </button>
            </div>
          </div>

          {/* Form navigation tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px' }}>
            {['General Info', 'Detailed Configurations'].map(tab => {
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
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Form Scroll Content */}
          <div style={{ minHeight: '300px' }}>
            {activeTab === 'Sections' ? (
              /* ================== SECTION MASTER CREATION FORM ================== */
              <>
                {activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Section Master Basic Setup</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Section Code</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Section Name *</label>
                        <input type="text" className="form-control" placeholder="e.g. Loom Room A" value={secName} onChange={e => setSecName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Section Type *</label>
                        <select className="form-control" value={secType} onChange={e => setSecType(e.target.value)}>
                          <option value="Weaving">Weaving</option>
                          <option value="Warping">Warping</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Processing">Processing</option>
                          <option value="Finishing">Finishing</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Department *</label>
                        <select className="form-control" value={secDept} onChange={e => setSecDept(e.target.value)}>
                          <option value="Production">Production</option>
                          <option value="Processing">Processing</option>
                          <option value="Maintenance Dept">Maintenance Dept</option>
                          <option value="Stores">Stores</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>In-charge Person *</label>
                        <select className="form-control" value={secIncharge} onChange={e => setSecIncharge(e.target.value)}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Machine Count ⚠️</label>
                        <input type="number" className="form-control" placeholder="No. of machine units installed" value={secMachines} onChange={e => setSecMachines(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Detailed Configurations' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Remarks & Operational Status</h4>
                    <div className="form-group">
                      <label>Section Notes / Machine Description ⚠️</label>
                      <textarea className="form-control" rows="3" placeholder="Setup notes..." value={secDesc} onChange={e => setSecDesc(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Operation Status Toggle *</label>
                      <select className="form-control" value={secStatus} onChange={e => setSecStatus(e.target.value)}>
                        <option value="Active">Active (Functional)</option>
                        <option value="Inactive">Inactive (Suspended)</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ================== SPARES MASTER CREATION FORM ================== */
              <>
                {activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Spare Part Code Cataloging</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Spare Code</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Spare Name *</label>
                        <input type="text" className="form-control" placeholder="Spare Part Name" value={sprName} onChange={e => setSprName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Spare Category *</label>
                        <select className="form-control" value={sprCategory} onChange={e => setSprCategory(e.target.value)}>
                          <option value="Mechanical Parts">Mechanical Parts</option>
                          <option value="Electrical Parts">Electrical Parts</option>
                          <option value="Electronic Parts">Electronic Parts</option>
                          <option value="Loom Parts">Loom Parts</option>
                          <option value="Consumables">Consumables</option>
                          <option value="Lubricants">Lubricants</option>
                          <option value="Tools">Tools</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Allocated Factory Section *</label>
                        <select className="form-control" value={sprSection} onChange={e => setSprSection(e.target.value)}>
                          {sections.map(sec => <option key={sec.id} value={sec.name}>{sec.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Target Machine Type *</label>
                        <select className="form-control" value={sprMachineType} onChange={e => setSprMachineType(e.target.value)}>
                          <option value="Airjet Loom">Airjet Loom</option>
                          <option value="Warping Beam Reel">Warping Beam Reel</option>
                          <option value="Dyeing Vessel">Dyeing Vessel</option>
                          <option value="Finishing Stenter">Finishing Stenter</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Brand / Make *</label>
                        <input type="text" className="form-control" placeholder="e.g. Toyota, Mobil" value={sprBrand} onChange={e => setSprBrand(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Model No. ⚠️</label>
                        <input type="text" className="form-control" placeholder="Model No" value={sprModelNo} onChange={e => setSprModelNo(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Part Number ⚠️</label>
                        <input type="text" className="form-control" placeholder="OEM Part Code" value={sprPartNo} onChange={e => setSprPartNo(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Detailed Configurations' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Stocking Thresholds, Valuations & Suppliers</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Unit of Measure *</label>
                        <select className="form-control" value={sprUom} onChange={e => setSprUom(e.target.value)}>
                          <option value="Nos">Nos</option>
                          <option value="Kg">Kg</option>
                          <option value="Meter">Meter</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Reorder Level (Qty) *</label>
                        <input type="number" className="form-control" value={sprReorder} onChange={e => setSprReorder(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Minimum Stock (Qty) *</label>
                        <input type="number" className="form-control" value={sprMinStock} onChange={e => setSprMinStock(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Maximum Stock (Qty) *</label>
                        <input type="number" className="form-control" value={sprMaxStock} onChange={e => setSprMaxStock(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Standard Rate (₹) *</label>
                        <input type="number" className="form-control" value={sprStandardRate} onChange={e => setSprStandardRate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>HSN Code ⚠️</label>
                        <input type="text" className="form-control" value={sprHsn} onChange={e => setSprHsn(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>GST % *</label>
                        <input type="number" className="form-control" value={sprGst} onChange={e => setSprGst(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Preferred Supplier ⚠️</label>
                        <select className="form-control" value={sprSupplier} onChange={e => setSprSupplier(e.target.value)}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Supplier Lead Time (Days) ⚠️</label>
                        <input type="number" className="form-control" placeholder="Lead Time" value={sprLeadTime} onChange={e => setSprLeadTime(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Operational Status Toggle *</label>
                        <select className="form-control" value={sprStatus} onChange={e => setSprStatus(e.target.value)}>
                          <option value="Active">Active (Functional)</option>
                          <option value="Inactive">Inactive (Suspended)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
