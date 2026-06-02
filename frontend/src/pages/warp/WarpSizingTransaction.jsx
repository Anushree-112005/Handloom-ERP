import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Scissors
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { workOrderTransactionAPI } from '../../services/api';

export default function WarpSizingTransaction({ defaultSection = 'Beam & Transaction Entries' }) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(defaultSection);
  const [activePage, setActivePage] = useState(null);

  useEffect(() => {
    setActiveSection(defaultSection);
    const firstSubModule = Object.values(PAGES_METADATA).find(p => p.category === defaultSection);
    if (firstSubModule) {
      setActivePage(firstSubModule.key);
    } else {
      setActivePage(null);
    }
    setIsFormOpen(false);
  }, [defaultSection]);

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

  const [warpingReports, setWarpingReports] = useState([]);
  const [sizingReports, setSizingReports] = useState([]);
  const [beamReceipts, setBeamReceipts] = useState([]);
  const [beamDeliveries, setBeamDeliveries] = useState([]);
  const [emptyBeams, setEmptyBeams] = useState([]);
  const [jobBills, setJobBills] = useState([]);
  const [setAmendments, setSetAmendments] = useState([]);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadData = async () => {
    try {
      const response = await workOrderTransactionAPI.getAll();
      const allTxns = response.data;
      const mapTxn = (t) => ({ ...t.details, id: t.transaction_no, db_id: t.id, status: t.status });

      setWarpingReports(allTxns.filter(t => t.module_type === 'warping_report').map(mapTxn));
      setSizingReports(allTxns.filter(t => t.module_type === 'sizing_report').map(mapTxn));
      setBeamReceipts(allTxns.filter(t => t.module_type === 'beam_received').map(mapTxn));
      setBeamDeliveries(allTxns.filter(t => t.module_type === 'beam_delivery').map(mapTxn));
      setEmptyBeams(allTxns.filter(t => t.module_type === 'empty_beam').map(mapTxn));
      setJobBills(allTxns.filter(t => t.module_type === 'ws_bills').map(mapTxn));
      setSetAmendments(allTxns.filter(t => t.module_type === 'set_amend').map(mapTxn));
    } catch (err) {
      console.error("Failed to load warping/sizing transactions", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    // Beam & Transaction Entries
    beam_received: { key: 'beam_received', label: "Warp Beam Received Entry", section: 'BeamManagement', category: 'Beam & Transaction Entries', desc: "Record warp beams received from vendors or returned from weaving", icon: Factory, color: '#3b82f6' },
    beam_delivery: { key: 'beam_delivery', label: "Warp Beam Delivery Entry", section: 'BeamManagement', category: 'Beam & Transaction Entries', desc: "Record warp beams sent to weaving section or outside vendors", icon: Truck, color: '#3b82f6' },
    empty_beam: { key: 'empty_beam', label: "Empty Beam Entry", section: 'BeamManagement', category: 'Beam & Transaction Entries', desc: "Track empty beams returned from weaving after fabric production", icon: Database, color: '#3b82f6' },

    // Reports, Bills & Amendments
    warping_report: { key: 'warping_report', label: "Warping Set Report Entry", section: 'Reports', category: 'Reports, Bills & Amendments', desc: "Record complete details of each warping set — yarn consumed, beam details, efficiency", icon: FileText, color: '#8b5cf6' },
    sizing_report: { key: 'sizing_report', label: "Sizing Set Report Entry", section: 'Reports', category: 'Reports, Bills & Amendments', desc: "Record sizing process details — chemical consumption, beam details, efficiency", icon: FileText, color: '#8b5cf6' },
    ws_bills: { key: 'ws_bills', label: "Warping/Sizing Bills Entry", section: 'Bills', category: 'Reports, Bills & Amendments', desc: "Record bills from warping and sizing job workers/vendors", icon: FileText, color: '#10b981' },
    set_amend: { key: 'set_amend', label: "SET Detail Amendment Entry", section: 'Amendment', category: 'Reports, Bills & Amendments', desc: "Correct or amend warping/sizing set details after entry", icon: Edit, color: '#475569' }
  };

  const getSubModuleCount = (key) => {
    switch(key) {
      case 'warping_report': return warpingReports.length;
      case 'sizing_report': return sizingReports.length;
      case 'beam_received': return beamReceipts.length;
      case 'beam_delivery': return beamDeliveries.length;
      case 'empty_beam': return emptyBeams.length;
      case 'ws_bills': return jobBills.length;
      case 'set_amend': return setAmendments.length;
      default: return 0;
    }
  };

  // =========================================================================
  // ACTIONS HANDLERS
  // =========================================================================
  const handleOpenPage = (p) => {
    setActivePage(p.key);
    setIsFormOpen(false);
  };

  const handleCreateNew = () => {
    const dateToday = new Date().toISOString().substring(0, 10);
    let initFields = { date: dateToday, status: 'Active' };

    if (activePage === 'warping_report') {
      initFields = { ...initFields, setNo: '', shift: 'Morning (6AM-2PM)', machineNo: '', operatorName: 'Murugan Swamy', designNo: 'DES-4091', totalEnds: '', width: '', warpLength: '', noOfBeams: '', actualProduction: '', efficiency: '' };
    } else if (activePage === 'sizing_report') {
      initFields = { ...initFields, setNo: '', warpingSetRef: '', shift: 'Afternoon (2PM-10PM)', machineNo: '', operatorName: 'Senthil Kumar (General Manager)', designNo: 'DES-4091', beamLength: '', warpBeamsUsed: '', sizedBeamsOut: '', actualProduction: '', efficiency: '' };
    } else if (activePage === 'beam_received') {
      initFields = { ...initFields, receiptType: 'New Beam from Vendor', fromParty: 'Standard Weaving Co.', gateInwardRef: '', dcNo: '', dcDate: dateToday, totalBeams: '', totalWeight: '', receivedBy: 'Mani Bharathi (Store Head)', status: 'Approved' };
    } else if (activePage === 'beam_delivery') {
      initFields = { ...initFields, deliveryType: 'To Weaving Section (Internal)', toParty: 'Weaving Unit A', setNo: '', designNo: 'DES-4091', totalBeams: '', expectedReturn: dateToday, deliveredBy: 'Murugan Swamy', status: 'Dispatched' };
    } else if (activePage === 'empty_beam') {
      initFields = { ...initFields, transactionType: 'Empty Beam Received (from weaving)', fromSection: 'Weaving Unit B', totalBeams: '', totalWeight: '', receivedBy: 'Mani Bharathi (Store Head)' };
    } else if (activePage === 'ws_bills') {
      initFields = { ...initFields, vendorName: 'Standard Weaving Co.', vendorType: 'Warping + Sizing Combined', vendorBillNo: '', vendorBillDate: dateToday, processType: 'Warping + Sizing', setNo: '', taxableAmount: '', netPayable: '', dueDays: '30 Days', status: 'Approved' };
    } else if (activePage === 'set_amend') {
      initFields = { ...initFields, amendmentType: 'Beam Length Correction', originalReportType: 'Warping Set Report', originalReportRef: '', setNo: '', authorizedBy: 'Dinesh Balasamy (MD)', status: 'Approved' };
    }

    setFields(initFields);
    setSelectedRecord(null);
    setCurrentFormId('NEW RECORD');
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedRecord(row);
    setCurrentFormId(row.id);
    setFields({ ...row });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      module_type: activePage,
      date: fields.date || new Date().toISOString().substring(0, 10),
      buyer_name: fields.vendorName || fields.toParty || fields.fromParty || "Internal",
      status: fields.status || 'Active',
      details: fields
    };

    try {
      if (selectedRecord && selectedRecord.db_id) {
        await workOrderTransactionAPI.update(selectedRecord.db_id, payload);
      } else {
        await workOrderTransactionAPI.create(payload);
      }
      setIsFormOpen(false);
      loadData();
      alert("Warping/Sizing production record processed and saved!");
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save record.");
    }
  };

  const handleDelete = async (db_id) => {
    if (!db_id) return;
    if (confirm("Are you sure you want to remove this warping/sizing entry?")) {
      try {
        await workOrderTransactionAPI.delete(db_id);
        if (selectedRecord?.db_id === db_id) setSelectedRecord(null);
        loadData();
      } catch (err) {
        console.error("Failed to delete", err);
        alert("Failed to delete record.");
      }
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      {!isFormOpen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={24} color="#059669" /> {activeSection}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Manage {activeSection.toLowerCase()} operations, approvals, and records.
            </p>
          </div>
        </div>
      )}

      {/* STAT CARDS ACTING AS SUB-MODULE SWITCHERS */}
      {!isFormOpen && (
        <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', gap: 16, marginBottom: 24, paddingBottom: 8 }}>
          {Object.values(PAGES_METADATA)
            .filter(p => p.category === activeSection)
            .map(p => {
              const IconComp = p.icon;
              const cardColor = p.color || '#3b82f6';
              const r = parseInt(cardColor.slice(1, 3), 16);
              const g = parseInt(cardColor.slice(3, 5), 16);
              const b = parseInt(cardColor.slice(5, 7), 16);
              const isSelected = activePage === p.key;

              return (
                <div 
                  key={p.key}
                  onClick={() => handleOpenPage(p)}
                  className="card"
                  style={{
                    flex: '1 0 220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 16,
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${cardColor}` : '1px solid var(--border)',
                    background: isSelected ? `rgba(${r},${g},${b}, 0.05)` : 'var(--bg-secondary)',
                    transition: 'all 0.2s ease',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? `0 10px 15px -3px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 10, background: cardColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(0,0,0,0.15)` }}>
                      <IconComp size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                         <span style={{ fontWeight: 800, color: cardColor }}>{getSubModuleCount(p.key)}</span> Records
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
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
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
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
