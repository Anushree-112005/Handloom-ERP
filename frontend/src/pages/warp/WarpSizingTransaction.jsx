import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Scissors
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function WarpSizingTransaction() {
  const navigate = useNavigate();

  // Active category: 'Reports' | 'BeamManagement' | 'Bills' | 'Amendment'
  const [activeSection, setActiveSection] = useState('Reports');

  // Currently active sub-page
  const [activePage, setActivePage] = useState(null);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  // Static lists for selections
  const SHIFTS = ['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)'];
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];
  const BUYERS = ['Raymond Ltd', 'Vardhman Spinning', 'Reliance Retail', 'Standard Gears Ltd'];

  // =========================================================================
  // STATE STORE FOR ALL 7 NEW WORKSPACES
  // =========================================================================

  // 1. WARPING SET REPORT
  const [warpingReports, setWarpingReports] = useState([]);

  // 2. SIZING SET REPORT
  const [sizingReports, setSizingReports] = useState([]);

  // 3. WARP BEAM RECEIVED ENTRY
  const [beamReceipts, setBeamReceipts] = useState([]);

  // 4. WARP BEAM DELIVERY ENTRY
  const [beamDeliveries, setBeamDeliveries] = useState([]);

  // 5. EMPTY BEAM ENTRY
  const [emptyBeams, setEmptyBeams] = useState([]);

  // 6. WARPING/SIZING BILLS ENTRY
  const [jobBills, setJobBills] = useState([]);

  // 7. SET DETAIL AMENDMENT ENTRY
  const [setAmendments, setSetAmendments] = useState([]);

  // =========================================================================
  // DYNAMIC FORM FIELDS (GENERAL BINDINGS)
  // =========================================================================
  const [fields, setFields] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields({
      ...fields,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // =========================================================================
  // SECTIONS & PAGES DEFINITIONS
  // =========================================================================
  const PAGES_METADATA = {
    // Reports
    warping_report: { key: 'warping_report', label: "Warping Set Report Entry", section: 'Reports', desc: "Record complete details of each warping set — yarn consumed, beam details, efficiency", icon: FileText },
    sizing_report: { key: 'sizing_report', label: "Sizing Set Report Entry", section: 'Reports', desc: "Record sizing process details — chemical consumption, beam details, efficiency", icon: FileText },

    // Beam Management
    beam_received: { key: 'beam_received', label: "Warp Beam Received Entry", section: 'BeamManagement', desc: "Record warp beams received from vendors or returned from weaving", icon: Factory },
    beam_delivery: { key: 'beam_delivery', label: "Warp Beam Delivery Entry", section: 'BeamManagement', desc: "Record warp beams sent to weaving section or outside vendors", icon: Truck },
    empty_beam: { key: 'empty_beam', label: "Empty Beam Entry", section: 'BeamManagement', desc: "Track empty beams returned from weaving after fabric production", icon: Database },

    // Bills
    ws_bills: { key: 'ws_bills', label: "Warping/Sizing Bills Entry", section: 'Bills', desc: "Record bills from warping and sizing job workers/vendors", icon: FileText },

    // Amendment
    set_amend: { key: 'set_amend', label: "SET Detail Amendment Entry", section: 'Amendment', desc: "Correct or amend warping/sizing set details after entry", icon: Edit }
  };

  // =========================================================================
  // ACTIONS HANDLERS
  // =========================================================================
  const handleOpenPage = (p) => {
    setActivePage(p.key);
    setIsFormOpen(false);
  };

  const handleCreateNew = () => {
    let nextId = '';
    const dateToday = new Date().toISOString().substring(0, 10);

    if (activePage === 'warping_report') {
      nextId = `WSR-2026-00${warpingReports.length + 1}`;
      setFields({ id: nextId, date: dateToday, setNo: '', shift: 'Morning (6AM-2PM)', machineNo: 'M-12', operatorName: 'Murugan Swamy', designNo: 'DES-4091', totalEnds: '', width: '', warpLength: '', noOfBeams: '', actualProduction: '', efficiency: 100, status: 'Active' });
    }
    else if (activePage === 'sizing_report') {
      nextId = `SSR-2026-00${sizingReports.length + 1}`;
      setFields({ id: nextId, date: dateToday, setNo: '', warpingSetRef: '', shift: 'Afternoon (2PM-10PM)', machineNo: 'SZ-02', operatorName: 'Senthil Kumar (General Manager)', designNo: 'DES-4091', beamLength: '', warpBeamsUsed: '', sizedBeamsOut: '', actualProduction: '', efficiency: 100, status: 'Active' });
    }
    else if (activePage === 'beam_received') {
      nextId = `WBR-2026-00${beamReceipts.length + 1}`;
      setFields({ id: nextId, date: dateToday, receiptType: 'New Beam from Vendor', fromParty: 'Standard Weaving Co.', gateInwardRef: '', dcNo: '', dcDate: dateToday, totalBeams: '', totalWeight: '', receivedBy: 'Mani Bharathi (Store Head)', status: 'Approved' });
    }
    else if (activePage === 'beam_delivery') {
      nextId = `WBD-2026-00${beamDeliveries.length + 1}`;
      setFields({ id: nextId, date: dateToday, deliveryType: 'To Weaving Section (Internal)', toParty: 'Weaving Unit A', setNo: '', designNo: 'DES-4091', totalBeams: '', expectedReturn: dateToday, deliveredBy: 'Murugan Swamy', status: 'Dispatched' });
    }
    else if (activePage === 'empty_beam') {
      nextId = `EBE-2026-00${emptyBeams.length + 1}`;
      setFields({ id: nextId, date: dateToday, transactionType: 'Empty Beam Received (from weaving)', fromSection: 'Weaving Unit B', totalBeams: '', totalWeight: '', receivedBy: 'Mani Bharathi (Store Head)', status: 'Active' });
    }
    else if (activePage === 'ws_bills') {
      nextId = `WSB-2026-00${jobBills.length + 1}`;
      setFields({ id: nextId, date: dateToday, vendorName: 'Standard Weaving Co.', vendorType: 'Warping + Sizing Combined', vendorBillNo: '', vendorBillDate: dateToday, processType: 'Warping + Sizing', setNo: '', taxableAmount: '', netPayable: '', dueDays: '30 Days', status: 'Approved' });
    }
    else if (activePage === 'set_amend') {
      nextId = `SAM-2026-00${setAmendments.length + 1}`;
      setFields({ id: nextId, date: dateToday, amendmentType: 'Beam Length Correction', originalReportType: 'Warping Set Report', originalReportRef: '', setNo: '', authorizedBy: 'Dinesh Balasamy (MD)', status: 'Approved' });
    }

    setCurrentFormId(nextId);
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setCurrentFormId(row.id);
    setFields({ ...row });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (activePage === 'warping_report') {
      const exists = warpingReports.some(d => d.id === currentFormId);
      if (exists) setWarpingReports(warpingReports.map(d => d.id === currentFormId ? fields : d));
      else setWarpingReports([fields, ...warpingReports]);
    }
    else if (activePage === 'sizing_report') {
      const exists = sizingReports.some(d => d.id === currentFormId);
      if (exists) setSizingReports(sizingReports.map(d => d.id === currentFormId ? fields : d));
      else setSizingReports([fields, ...sizingReports]);
    }
    else if (activePage === 'beam_received') {
      const exists = beamReceipts.some(d => d.id === currentFormId);
      if (exists) setBeamReceipts(beamReceipts.map(d => d.id === currentFormId ? fields : d));
      else setBeamReceipts([fields, ...beamReceipts]);
    }
    else if (activePage === 'beam_delivery') {
      const exists = beamDeliveries.some(d => d.id === currentFormId);
      if (exists) setBeamDeliveries(beamDeliveries.map(d => d.id === currentFormId ? fields : d));
      else setBeamDeliveries([fields, ...beamDeliveries]);
    }
    else if (activePage === 'empty_beam') {
      const exists = emptyBeams.some(d => d.id === currentFormId);
      if (exists) setEmptyBeams(emptyBeams.map(d => d.id === currentFormId ? fields : d));
      else setEmptyBeams([fields, ...emptyBeams]);
    }
    else if (activePage === 'ws_bills') {
      const exists = jobBills.some(d => d.id === currentFormId);
      if (exists) setJobBills(jobBills.map(d => d.id === currentFormId ? fields : d));
      else setJobBills([fields, ...jobBills]);
    }
    else if (activePage === 'set_amend') {
      const exists = setAmendments.some(d => d.id === currentFormId);
      if (exists) setSetAmendments(setAmendments.map(d => d.id === currentFormId ? fields : d));
      else setSetAmendments([fields, ...setAmendments]);
    }

    setIsFormOpen(false);
    alert("Warping/Sizing production record processed and saved!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to remove this warping/sizing entry?")) {
      if (activePage === 'warping_report') setWarpingReports(warpingReports.filter(d => d.id !== id));
      if (activePage === 'sizing_report') setSizingReports(sizingReports.filter(d => d.id !== id));
      if (activePage === 'beam_received') setBeamReceipts(beamReceipts.filter(d => d.id !== id));
      if (activePage === 'beam_delivery') setBeamDeliveries(beamDeliveries.filter(d => d.id !== id));
      if (activePage === 'empty_beam') setEmptyBeams(emptyBeams.filter(d => d.id !== id));
      if (activePage === 'ws_bills') setJobBills(jobBills.filter(d => d.id !== id));
      if (activePage === 'set_amend') setSetAmendments(setAmendments.filter(d => d.id !== id));
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Layers size={24} style={{ color: '#059669' }} /> Warping & Sizing Transaction Desk
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            {activePage ? `Operational Sub-Page: ${PAGES_METADATA[activePage].label}` : "Complete Warping efficiency reports, chemical consumption, and Beam deliveries."}
          </p>
        </div>
        <div>
          {activePage ? (
            <button className="btn btn-secondary" onClick={() => setActivePage(null)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <X size={15} /> Exit Workspace
            </button>
          ) : (
            <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(5, 150, 105, 0.08)', color: '#059669', borderRadius: '4px', fontWeight: 800 }}>
              Audit-Ready Sizing Desk
            </span>
          )}
        </div>
      </div>

      {/* TOP DESK 4 CATEGORY SWITCH TABS */}
      {!activePage && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '28px' }}>
            {[
              { key: 'Reports', label: 'Warping & Sizing Reports' },
              { key: 'BeamManagement', label: 'Beam Management' },
              { key: 'Bills', label: 'Job Worker Bills' },
              { key: 'Amendment', label: 'Set Amendments' }
            ].map(sec => {
              const isSelected = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  style={{
                    padding: '12px 6px',
                    fontSize: '12px',
                    fontWeight: '850',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(5, 150, 105, 0.08)' : 'white',
                    color: isSelected ? '#059669' : 'var(--text-secondary)',
                    border: isSelected ? '2px solid #059669' : '1px solid var(--border)',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* ACTIVE DIVISION'S SUB-MODULE CARDS GRID */}
          <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
            📂 Select {activeSection} Module
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
            {Object.values(PAGES_METADATA)
              .filter(p => p.section === activeSection)
              .map(p => {
                const IconComp = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleOpenPage(p)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      padding: '20px',
                      borderRadius: '12px',
                      background: 'white',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      boxShadow: 'none',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#059669';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(5, 150, 105, 0.05)',
                      color: '#059669'
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '850', fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                        {p.label}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '500', lineHeight: '1.3' }}>
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </>
      )}

      {/* SUB PAGE WORKSPACE CONTAINER */}
      {activePage && (
        <>
          {!isFormOpen ? (
            /* ========================================================================= */
            /* ========================= LIST VIEW REGISTERS =========================== */
            /* ========================================================================= */
            <>
              <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                    {PAGES_METADATA[activePage].label} Records Directory
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Complete audit-log and quality checks directory</span>
                </div>
                <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#059669', borderColor: '#059669' }}>
                  <Plus size={16} /> Log Sizing/Warping Voucher
                </button>
              </div>

              {/* WARPING SET REPORT TABLE */}
              {activePage === 'warping_report' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>REPORT NO</th>
                        <th>DATE</th>
                        <th>SET NO</th>
                        <th>SHIFT</th>
                        <th>MACHINE NO</th>
                        <th>OPERATOR NAME</th>
                        <th style={{ textAlign: 'right' }}>TOTAL ENDS</th>
                        <th style={{ textAlign: 'right' }}>WARP LENGTH</th>
                        <th style={{ textAlign: 'right' }}>PRODUCTION (MTR)</th>
                        <th style={{ textAlign: 'right' }}>EFFICIENCY</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warpingReports.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.setNo}</td>
                          <td>{row.shift}</td>
                          <td>{row.machineNo}</td>
                          <td>{row.operatorName}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalEnds}</td>
                          <td style={{ textAlign: 'right' }}>{row.warpLength} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.actualProduction} Mtr</td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{row.efficiency}%</td>
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
                </div>
              )}

              {/* SIZING SET REPORT TABLE */}
              {activePage === 'sizing_report' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>REPORT NO</th>
                        <th>DATE</th>
                        <th>SET NO</th>
                        <th>WARPING REF</th>
                        <th>OPERATOR NAME</th>
                        <th style={{ textAlign: 'right' }}>BEAM LENGTH</th>
                        <th style={{ textAlign: 'right' }}>BEAMS OUT</th>
                        <th style={{ textAlign: 'right' }}>PRODUCTION</th>
                        <th style={{ textAlign: 'right' }}>EFFICIENCY</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizingReports.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.setNo}</td>
                          <td>{row.warpingSetRef}</td>
                          <td>{row.operatorName}</td>
                          <td style={{ textAlign: 'right' }}>{row.beamLength} Mtr</td>
                          <td style={{ textAlign: 'right' }}>{row.sizedBeamsOut}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.actualProduction} Mtr</td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{row.efficiency}%</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FALLBACK INFO PANEL */}
              {!['warping_report', 'sizing_report'].includes(activePage) && (
                <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'white' }}>
                  <Sparkles size={36} style={{ color: '#059669', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 800, margin: 0 }}>Sizing & Beam Operations Active</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Warping ledger registries and beam management databases are fully responsive. Click "Log Sizing/Warping Voucher" to create a new ticket.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* ========================================================================= */
            /* ========================= FORM WORKSPACE FOR SUB-PAGES ================== */
            /* ========================================================================= */
            <div className="card animate-fade" style={{ padding: '32px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                    {PAGES_METADATA[activePage].label} Voucher Entry — {currentFormId}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure sizing, yarn logs, and beam processing details</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <X size={15} /> Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#059669', borderColor: '#059669' }}>
                    <Check size={15} /> Save Record
                  </button>
                </div>
              </div>

              {/* WARPING REPORT FORM */}
              {activePage === 'warping_report' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Set Report No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Set No *</label>
                      <input type="text" className="form-control" name="setNo" value={fields.setNo || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Shift *</label>
                      <select className="form-control" name="shift" value={fields.shift || ''} onChange={handleInputChange}>
                        {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Machine No *</label>
                      <input type="text" className="form-control" name="machineNo" value={fields.machineNo || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Operator Name *</label>
                      <select className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Total Ends *</label>
                      <input type="number" className="form-control" name="totalEnds" value={fields.totalEnds || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Warp Length (Mtr) *</label>
                      <input type="number" className="form-control" name="warpLength" value={fields.warpLength || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Actual Production (Mtr) *</label>
                      <input type="number" className="form-control" name="actualProduction" value={fields.actualProduction || ''} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              )}

              {/* SIZING REPORT FORM */}
              {activePage === 'sizing_report' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Sizing Report No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Set No *</label>
                      <input type="text" className="form-control" name="setNo" value={fields.setNo || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Warping Set Ref *</label>
                      <input type="text" className="form-control" name="warpingSetRef" value={fields.warpingSetRef || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Shift *</label>
                      <select className="form-control" name="shift" value={fields.shift || ''} onChange={handleInputChange}>
                        {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Beam Length (Mtr) *</label>
                      <input type="number" className="form-control" name="beamLength" value={fields.beamLength || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>No. of Warp Beams Used *</label>
                      <input type="number" className="form-control" name="warpBeamsUsed" value={fields.warpBeamsUsed || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>No. of Sized Beams Out *</label>
                      <input type="number" className="form-control" name="sizedBeamsOut" value={fields.sizedBeamsOut || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Actual Production (Mtr) *</label>
                      <input type="number" className="form-control" name="actualProduction" value={fields.actualProduction || ''} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              )}

              {/* FALLBACK SIMPLE CONFIGS FORM FOR REMAINING MODULES */}
              {!['warping_report', 'sizing_report'].includes(activePage) && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ color: '#059669', fontSize: '14px', fontWeight: 800, margin: 0 }}>Voucher Details & Audit Configs</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Voucher Ref No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Record Category</label>
                      <input type="text" className="form-control" value={PAGES_METADATA[activePage].label} disabled style={{ background: 'var(--bg-secondary)' }} />
                    </div>
                    <div className="form-group">
                      <label>Approved By</label>
                      <select className="form-control" name="completedBy" value={fields.completedBy || 'Dinesh Balasamy (MD)'} onChange={handleInputChange}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description / Technical Parameters Remarks *</label>
                    <textarea className="form-control" rows="4" name="remarks" placeholder="Enter logs..." value={fields.remarks || ''} onChange={handleInputChange} required />
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}

    </div>
  );
}
