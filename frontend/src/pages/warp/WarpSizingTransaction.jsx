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
      initFields = { ...initFields, setReportNo: '', setNo: '', shift: 'Morning (6AM-2PM)', machineNo: '', operatorName: 'Murugan Swamy', designNo: 'DES-4091', totalEnds: '', width: '', warpLength: '', noOfBeams: '', actualProduction: '', efficiency: '' };
    } else if (activePage === 'sizing_report') {
      initFields = { ...initFields, sizingReportNo: '', setNo: '', warpingSetRef: '', shift: 'Afternoon (2PM-10PM)', machineNo: '', operatorName: 'Senthil Kumar (General Manager)', designNo: 'DES-4091', beamLength: '', warpBeamsUsed: '', sizedBeamsOut: '', actualProduction: '', efficiency: '' };
    } else if (activePage === 'beam_received') {
      initFields = {
        ...initFields,
        voucherNo: '',
        voucherDate: dateToday,
        shift: 'Morning (6AM-2PM)',
        entryTime: new Date().toTimeString().substring(0, 5),
        financialYear: '2026-2027',
        sizingUnit: '',
        warpingUnit: '',
        jobWorkerName: '',
        supplierName: '',
        vehicleNo: '',
        driverName: '',
        challanNo: '',
        beamNo: '',
        beamType: 'Sized Beam',
        beamWidth: '',
        beamLength: '',
        beamWeight: '',
        grossWeight: '',
        netWeight: '',
        beamStatus: 'Good',
        yarnCount: '',
        yarnType: '',
        millName: '',
        lotNo: '',
        shade: '',
        endsCount: '',
        warpMeter: '',
        designNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        fabricType: '',
        loomType: '',
        beamCondition: 'Standard',
        tensionChecked: false,
        moistureChecked: false,
        damageStatus: 'No Damage',
        qcStatus: 'Passed',
        qcApprovedBy: '',
        remarks: '',
        attachmentUpload: '',
        receivedBy: '',
        approvedBy: ''
      };
    } else if (activePage === 'beam_delivery') {
      initFields = {
        ...initFields,
        deliveryVoucherNo: '',
        deliveryDate: dateToday,
        shift: 'Morning (6AM-2PM)',
        department: 'Weaving',
        loomNo: '',
        weaverName: '',
        operatorName: '',
        productionUnit: '',
        section: '',
        beamNo: '',
        beamType: 'Sized Beam',
        beamWidth: '',
        beamLength: '',
        availableMeter: '',
        remainingMeter: '',
        fabricName: '',
        designNo: '',
        gsm: '',
        pick: '',
        reed: '',
        ends: '',
        issuedQuantity: '',
        issuedMeter: '',
        targetProduction: '',
        expectedCompletionDate: dateToday,
        issuedBy: '',
        receivedBy: '',
        supervisorApproval: '',
        remarks: '',
        priority: 'Normal',
        machineCondition: 'Good'
      };
    } else if (activePage === 'empty_beam') {
      initFields = {
        ...initFields,
        emptyBeamVoucherNo: '',
        returnDate: dateToday,
        shift: 'Morning (6AM-2PM)',
        loomNo: '',
        operatorName: '',
        productionUnit: '',
        returnLocation: 'Store',
        beamNo: '',
        beamType: 'Empty Beam',
        beamCondition: 'Good',
        damageStatus: 'No Damage',
        reusableStatus: 'Ready',
        usedMeter: '',
        balanceMeter: '',
        fabricProduced: '',
        wasteMeter: '',
        repairRequired: false,
        maintenanceNotes: '',
        nextUsageStatus: 'Ready',
        checkedBy: '',
        storeIncharge: '',
        qcApproval: '',
        remarks: '',
        imageUpload: ''
      };
    } else if (activePage === 'ws_bills') {
      initFields = { ...initFields, voucherRefNo: '', vendorName: 'Standard Weaving Co.', vendorType: 'Warping + Sizing Combined', vendorBillNo: '', vendorBillDate: dateToday, processType: 'Warping + Sizing', setNo: '', taxableAmount: '', netPayable: '', dueDays: '30 Days', status: 'Approved' };
    } else if (activePage === 'set_amend') {
      initFields = { ...initFields, voucherRefNo: '', amendmentType: 'Beam Length Correction', originalReportType: 'Warping Set Report', originalReportRef: '', setNo: '', authorizedBy: 'Dinesh Balasamy (MD)', status: 'Approved' };
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
    setFields({
      ...row,
      voucherNo: row.voucherNo || row.id,
      deliveryVoucherNo: row.deliveryVoucherNo || row.id,
      emptyBeamVoucherNo: row.emptyBeamVoucherNo || row.id,
      setReportNo: row.setReportNo || row.id,
      sizingReportNo: row.sizingReportNo || row.id,
      voucherRefNo: row.voucherRefNo || row.id
    });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const manualTxnNo = fields.voucherNo || fields.deliveryVoucherNo || fields.emptyBeamVoucherNo || fields.setReportNo || fields.sizingReportNo || fields.voucherRefNo;

    const payload = {
      module_type: activePage,
      date: fields.date || fields.voucherDate || fields.deliveryDate || fields.returnDate || new Date().toISOString().substring(0, 10),
      buyer_name: fields.supplierName || fields.weaverName || fields.operatorName || fields.vendorName || fields.toParty || fields.fromParty || "Internal",
      status: fields.status || 'Active',
      transaction_no: manualTxnNo || undefined,
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
      if (err.response && err.response.data && err.response.data.detail) {
        alert("Failed to save record: " + err.response.data.detail);
      } else {
        alert("Failed to save record.");
      }
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

              {/* BEAM RECEIVED TABLE */}
              {activePage === 'beam_received' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>VOUCHER NO</th>
                        <th>DATE</th>
                        <th>FINANCIAL YEAR</th>
                        <th>SUPPLIER / JOB WORKER</th>
                        <th>BEAM NO / TYPE</th>
                        <th style={{ textAlign: 'right' }}>BEAM LENGTH</th>
                        <th style={{ textAlign: 'right' }}>NET WEIGHT</th>
                        <th>QC STATUS</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beamReceipts.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.voucherDate || row.date}</td>
                          <td>{row.financialYear}</td>
                          <td style={{ fontWeight: 650 }}>{row.supplierName || row.jobWorkerName}</td>
                          <td>{row.beamNo} ({row.beamType})</td>
                          <td style={{ textAlign: 'right' }}>{row.beamLength} Mtr</td>
                          <td style={{ textAlign: 'right' }}>{row.netWeight} Kg</td>
                          <td>
                            <span className={`badge ${row.qcStatus === 'Passed' ? 'badge-active' : 'badge-inactive'}`}>
                              {row.qcStatus || 'Pending'}
                            </span>
                          </td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {beamReceipts.length === 0 && (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No warp beam receipts found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* BEAM DELIVERY TABLE */}
              {activePage === 'beam_delivery' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>DELIVERY VOUCHER</th>
                        <th>DATE</th>
                        <th>LOOM NO</th>
                        <th>WEAVER / OPERATOR</th>
                        <th>BEAM NO / TYPE</th>
                        <th style={{ textAlign: 'right' }}>ISSUED METER</th>
                        <th>EXPECTED COMPLETION</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beamDeliveries.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.deliveryDate || row.date}</td>
                          <td>{row.loomNo}</td>
                          <td style={{ fontWeight: 650 }}>{row.weaverName || row.operatorName}</td>
                          <td>{row.beamNo} ({row.beamType})</td>
                          <td style={{ textAlign: 'right' }}>{row.issuedMeter} Mtr</td>
                          <td>{row.expectedCompletionDate}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {beamDeliveries.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No warp beam deliveries found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* EMPTY BEAM TABLE */}
              {activePage === 'empty_beam' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>EMPTY BEAM VOUCHER</th>
                        <th>RETURN DATE</th>
                        <th>LOOM NO</th>
                        <th>OPERATOR</th>
                        <th>BEAM NO / TYPE</th>
                        <th>REUSABLE STATUS</th>
                        <th style={{ textAlign: 'right' }}>USED METER</th>
                        <th style={{ textAlign: 'right' }}>WASTE METER</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emptyBeams.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.returnDate || row.date}</td>
                          <td>{row.loomNo}</td>
                          <td style={{ fontWeight: 650 }}>{row.operatorName}</td>
                          <td>{row.beamNo} ({row.beamType})</td>
                          <td>
                            <span className={`badge ${row.reusableStatus === 'Ready' ? 'badge-active' : 'badge-inactive'}`}>
                              {row.reusableStatus}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{row.usedMeter} Mtr</td>
                          <td style={{ textAlign: 'right' }}>{row.wasteMeter} Mtr</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {emptyBeams.length === 0 && (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No empty beam entries found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FALLBACK INFO PANEL */}
              {!['warping_report', 'sizing_report', 'beam_received', 'beam_delivery', 'empty_beam'].includes(activePage) && (
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
                      <label>Set Report No *</label>
                      <input type="text" className="form-control" name="setReportNo" value={fields.setReportNo || ''} onChange={handleInputChange} required />
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
                      <label>Sizing Report No *</label>
                      <input type="text" className="form-control" name="sizingReportNo" value={fields.sizingReportNo || ''} onChange={handleInputChange} required />
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

              {/* WARP BEAM RECEIVED ENTRY FORM */}
              {activePage === 'beam_received' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📋 Header Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Voucher No *</label>
                        <input type="text" className="form-control" name="voucherNo" value={fields.voucherNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Voucher Date *</label>
                        <input type="date" className="form-control" name="voucherDate" value={fields.voucherDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Shift *</label>
                        <select className="form-control" name="shift" value={fields.shift || ''} onChange={handleInputChange}>
                          {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Entry Time *</label>
                        <input type="time" className="form-control" name="entryTime" value={fields.entryTime || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Financial Year *</label>
                        <input type="text" className="form-control" name="financialYear" value={fields.financialYear || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      🏢 Party Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sizing Unit</label>
                        <input type="text" className="form-control" name="sizingUnit" value={fields.sizingUnit || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warping Unit</label>
                        <input type="text" className="form-control" name="warpingUnit" value={fields.warpingUnit || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Job Worker Name</label>
                        <input type="text" className="form-control" name="jobWorkerName" value={fields.jobWorkerName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Supplier Name</label>
                        <input type="text" className="form-control" name="supplierName" value={fields.supplierName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      🚚 Transport & Challan
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vehicle No</label>
                        <input type="text" className="form-control" name="vehicleNo" value={fields.vehicleNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Driver Name</label>
                        <input type="text" className="form-control" name="driverName" value={fields.driverName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Challan No</label>
                        <input type="text" className="form-control" name="challanNo" value={fields.challanNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      ⚙️ Beam Specifications
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No *</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Beam Type *</label>
                        <select className="form-control" name="beamType" value={fields.beamType || ''} onChange={handleInputChange}>
                          <option value="Sized Beam">Sized Beam</option>
                          <option value="Weavers Beam">Weavers Beam</option>
                          <option value="Warpers Beam">Warpers Beam</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Beam Width (mm)</label>
                        <input type="number" className="form-control" name="beamWidth" value={fields.beamWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Length (Mtr) *</label>
                        <input type="number" className="form-control" name="beamLength" value={fields.beamLength || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Beam Weight (Kg)</label>
                        <input type="number" className="form-control" name="beamWeight" value={fields.beamWeight || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Gross Weight (Kg)</label>
                        <input type="number" className="form-control" name="grossWeight" value={fields.grossWeight || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Net Weight (Kg)</label>
                        <input type="number" className="form-control" name="netWeight" value={fields.netWeight || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Status</label>
                        <select className="form-control" name="beamStatus" value={fields.beamStatus || ''} onChange={handleInputChange}>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                          <option value="Requires Mending">Requires Mending</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      🧵 Yarn Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Type</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mill Name</label>
                        <input type="text" className="form-control" name="millName" value={fields.millName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Ends Count</label>
                        <input type="number" className="form-control" name="endsCount" value={fields.endsCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Meter</label>
                        <input type="number" className="form-control" name="warpMeter" value={fields.warpMeter || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      🏭 Production Info
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Work Order No</label>
                        <input type="text" className="form-control" name="workOrderNo" value={fields.workOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Loom Type</label>
                        <input type="text" className="form-control" name="loomType" value={fields.loomType || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      🔬 Quality Assurance (QC)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam Condition</label>
                        <input type="text" className="form-control" name="beamCondition" value={fields.beamCondition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                        <input type="checkbox" name="tensionChecked" checked={fields.tensionChecked || false} onChange={handleInputChange} />
                        <label style={{ margin: 0 }}>Tension Checked</label>
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                        <input type="checkbox" name="moistureChecked" checked={fields.moistureChecked || false} onChange={handleInputChange} />
                        <label style={{ margin: 0 }}>Moisture Checked</label>
                      </div>
                      <div className="form-group">
                        <label>Damage Status</label>
                        <select className="form-control" name="damageStatus" value={fields.damageStatus || ''} onChange={handleInputChange}>
                          <option value="No Damage">No Damage</option>
                          <option value="Minor Damage">Minor Damage</option>
                          <option value="Major Damage">Major Damage</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || ''} onChange={handleInputChange}>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Approved By</label>
                        <select className="form-control" name="qcApprovedBy" value={fields.qcApprovedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📝 Additional Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>Remarks</label>
                        <textarea className="form-control" rows="3" name="remarks" value={fields.remarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Attachment Upload (File Link)</label>
                        <input type="text" className="form-control" name="attachmentUpload" placeholder="e.g. docs/challan.pdf" value={fields.attachmentUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received By</label>
                        <select className="form-control" name="receivedBy" value={fields.receivedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WARP BEAM DELIVERY ENTRY FORM */}
              {activePage === 'beam_delivery' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📋 Header Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Delivery Voucher No *</label>
                        <input type="text" className="form-control" name="deliveryVoucherNo" value={fields.deliveryVoucherNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date *</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Shift *</label>
                        <select className="form-control" name="shift" value={fields.shift || ''} onChange={handleInputChange}>
                          {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Department *</label>
                        <input type="text" className="form-control" name="department" value={fields.department || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📍 Delivery Destination Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Loom No *</label>
                        <input type="text" className="form-control" name="loomNo" value={fields.loomNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Weaver Name</label>
                        <input type="text" className="form-control" name="weaverName" value={fields.weaverName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Operator Name</label>
                        <select className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange}>
                          <option value="">-- Select Operator --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Production Unit</label>
                        <input type="text" className="form-control" name="productionUnit" value={fields.productionUnit || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Section</label>
                        <input type="text" className="form-control" name="section" value={fields.section || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      ⚙️ Beam Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 2fr) repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No *</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Beam Type *</label>
                        <select className="form-control" name="beamType" value={fields.beamType || ''} onChange={handleInputChange}>
                          <option value="Sized Beam">Sized Beam</option>
                          <option value="Weavers Beam">Weavers Beam</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Beam Width (mm)</label>
                        <input type="number" className="form-control" name="beamWidth" value={fields.beamWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Length (Mtr) *</label>
                        <input type="number" className="form-control" name="beamLength" value={fields.beamLength || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Available Meter</label>
                        <input type="number" className="form-control" name="availableMeter" value={fields.availableMeter || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Remaining Meter</label>
                        <input type="number" className="form-control" name="remainingMeter" value={fields.remainingMeter || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      🧵 Fabric Construction Specifications
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="number" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Pick</label>
                        <input type="number" className="form-control" name="pick" value={fields.pick || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Reed</label>
                        <input type="number" className="form-control" name="reed" value={fields.reed || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Ends</label>
                        <input type="number" className="form-control" name="ends" value={fields.ends || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📦 Issue Parameters
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Issued Quantity (Beams)</label>
                        <input type="number" className="form-control" name="issuedQuantity" value={fields.issuedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Issued Meter *</label>
                        <input type="number" className="form-control" name="issuedMeter" value={fields.issuedMeter || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Target Production</label>
                        <input type="text" className="form-control" name="targetProduction" value={fields.targetProduction || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Expected Completion</label>
                        <input type="date" className="form-control" name="expectedCompletionDate" value={fields.expectedCompletionDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      ✅ Approvals & Status
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Issued By</label>
                        <select className="form-control" name="issuedBy" value={fields.issuedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Received By</label>
                        <select className="form-control" name="receivedBy" value={fields.receivedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Supervisor Approval</label>
                        <input type="text" className="form-control" name="supervisorApproval" value={fields.supervisorApproval || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" name="status" value={fields.status || ''} onChange={handleInputChange}>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📝 Additional Info
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>Remarks</label>
                        <textarea className="form-control" rows="3" name="remarks" value={fields.remarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Priority</label>
                        <select className="form-control" name="priority" value={fields.priority || ''} onChange={handleInputChange}>
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Machine Condition</label>
                        <input type="text" className="form-control" name="machineCondition" value={fields.machineCondition || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPTY BEAM ENTRY FORM */}
              {activePage === 'empty_beam' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📋 Header Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Empty Beam Voucher No *</label>
                        <input type="text" className="form-control" name="emptyBeamVoucherNo" value={fields.emptyBeamVoucherNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Return Date *</label>
                        <input type="date" className="form-control" name="returnDate" value={fields.returnDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Shift *</label>
                        <select className="form-control" name="shift" value={fields.shift || ''} onChange={handleInputChange}>
                          {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📍 Return Source Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Loom No *</label>
                        <input type="text" className="form-control" name="loomNo" value={fields.loomNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Operator Name</label>
                        <select className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange}>
                          <option value="">-- Select Operator --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Production Unit</label>
                        <input type="text" className="form-control" name="productionUnit" value={fields.productionUnit || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Return Location</label>
                        <input type="text" className="form-control" name="returnLocation" value={fields.returnLocation || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      ⚙️ Beam Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No *</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Beam Type *</label>
                        <input type="text" className="form-control" name="beamType" value={fields.beamType || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Beam Condition</label>
                        <input type="text" className="form-control" name="beamCondition" value={fields.beamCondition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Damage Status</label>
                        <select className="form-control" name="damageStatus" value={fields.damageStatus || ''} onChange={handleInputChange}>
                          <option value="No Damage">No Damage</option>
                          <option value="Minor Damage">Minor Damage</option>
                          <option value="Major Damage">Major Damage</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Reusable Status</label>
                        <select className="form-control" name="reusableStatus" value={fields.reusableStatus || ''} onChange={handleInputChange}>
                          <option value="Ready">Ready</option>
                          <option value="Requires Repair">Requires Repair</option>
                          <option value="Scrap">Scrap</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📊 Usage Summary
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Used Meter</label>
                        <input type="number" className="form-control" name="usedMeter" value={fields.usedMeter || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Meter</label>
                        <input type="number" className="form-control" name="balanceMeter" value={fields.balanceMeter || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Produced (Mtr)</label>
                        <input type="number" className="form-control" name="fabricProduced" value={fields.fabricProduced || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Waste Meter</label>
                        <input type="number" className="form-control" name="wasteMeter" value={fields.wasteMeter || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      🛠️ Maintenance & Repair Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                        <input type="checkbox" name="repairRequired" checked={fields.repairRequired || false} onChange={handleInputChange} />
                        <label style={{ margin: 0 }}>Repair Required</label>
                      </div>
                      <div className="form-group">
                        <label>Maintenance Notes</label>
                        <input type="text" className="form-control" name="maintenanceNotes" value={fields.maintenanceNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Next Usage Status</label>
                        <select className="form-control" name="nextUsageStatus" value={fields.nextUsageStatus || ''} onChange={handleInputChange}>
                          <option value="Ready">Ready</option>
                          <option value="In Repair">In Repair</option>
                          <option value="Scrapped">Scrapped</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      ✅ Verification & Approvals
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Checked By</label>
                        <select className="form-control" name="checkedBy" value={fields.checkedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Store Incharge</label>
                        <select className="form-control" name="storeIncharge" value={fields.storeIncharge || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Approval</label>
                        <input type="text" className="form-control" name="qcApproval" value={fields.qcApproval || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      📝 Additional Info
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Remarks</label>
                        <textarea className="form-control" rows="3" name="remarks" value={fields.remarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Image Upload Link</label>
                        <input type="text" className="form-control" name="imageUpload" placeholder="e.g. images/beam_44.png" value={fields.imageUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FALLBACK SIMPLE CONFIGS FORM FOR REMAINING MODULES */}
              {!['warping_report', 'sizing_report', 'beam_received', 'beam_delivery', 'empty_beam'].includes(activePage) && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ color: '#059669', fontSize: '14px', fontWeight: 800, margin: 0 }}>Voucher Details & Audit Configs</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Voucher Ref No *</label>
                      <input type="text" className="form-control" name="voucherRefNo" value={fields.voucherRefNo || ''} onChange={handleInputChange} required />
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
