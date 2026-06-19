import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Layers, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Scissors, Clock,
  FileImage, CreditCard, User, AlertCircle, ShieldCheck, Scale, Percent
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { workOrderTransactionAPI, partyAPI } from '../../services/api';

export default function WarpSizingTransaction({ defaultSection = 'Beam & Transaction Entries' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState(defaultSection);
  const [activePage, setActivePage] = useState(null);

  useEffect(() => {
    setActiveSection(defaultSection);
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    if (tabParam && PAGES_METADATA[tabParam] && PAGES_METADATA[tabParam].category === defaultSection) {
      setActivePage(tabParam);
    } else {
      const firstSubModule = Object.values(PAGES_METADATA).find(p => p.category === defaultSection);
      if (firstSubModule) {
        setActivePage(firstSubModule.key);
      } else {
        setActivePage(null);
      }
    }
    setIsFormOpen(false);
  }, [defaultSection, location.search]);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  const [partiesList, setPartiesList] = useState([]);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await partyAPI.list();
        if (res.data && res.data.length > 0) {
          setPartiesList(res.data.map(p => p.company_name));
        }
      } catch (err) {
        console.error("Failed to fetch parties in WarpSizingTransaction", err);
      }
    };
    fetchParties();
  }, []);

  // Static lists for selections
  const SHIFTS = ['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)'];
  const EMPLOYEES = [
    'Senthil Kumar (General Manager)', 
    'Mani Bharathi (Store Head)', 
    'Dinesh Balasamy (MD)', 
    'Murugan Swamy (Maintenance In-charge)'
  ];
  const BUYERS = useMemo(() => {
    return partiesList.length > 0 ? partiesList : ['Raymond Ltd', 'Vardhman Spinning', 'Reliance Retail', 'Standard Gears Ltd'];
  }, [partiesList]);

  // =========================================================================
  // STATE STORE FOR ALL 7 SUB-MODULES
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

  // Real-time Calculations Effect
  useEffect(() => {
    if (activePage === 'ws_bills') {
      const rate = parseFloat(fields.processRate) || 0;
      const qty = parseFloat(fields.processQuantity) || 0;
      const addChg = parseFloat(fields.additionalCharges) || 0;
      const tax = parseFloat(fields.taxPercent) || 0;
      const adv = parseFloat(fields.advanceAmount) || 0;

      const calcTotal = rate * qty;
      const calcGst = calcTotal * (tax / 100);
      const calcNet = calcTotal + calcGst + addChg;
      const calcBal = calcNet - adv;

      if (
        calcTotal.toFixed(2) !== fields.totalAmount ||
        calcGst.toFixed(2) !== fields.gstAmount ||
        calcNet.toFixed(2) !== fields.netAmount ||
        calcBal.toFixed(2) !== fields.balanceAmount
      ) {
        setFields(prev => ({
          ...prev,
          totalAmount: calcTotal.toFixed(2),
          gstAmount: calcGst.toFixed(2),
          netAmount: calcNet.toFixed(2),
          balanceAmount: calcBal.toFixed(2)
        }));
      }
    }
  }, [fields.processRate, fields.processQuantity, fields.additionalCharges, fields.taxPercent, fields.advanceAmount, activePage]);

  useEffect(() => {
    if ((activePage === 'warping_report' || activePage === 'sizing_report') && fields.startTime && fields.endTime) {
      const [sh, sm] = fields.startTime.split(':').map(Number);
      const [eh, em] = fields.endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh) && !isNaN(sm) && !isNaN(em)) {
        let diffMs = (eh * 60 + em) - (sh * 60 + sm);
        if (diffMs < 0) diffMs += 24 * 60; // handles overnight shifts
        const hrs = (diffMs / 60).toFixed(2);
        if (hrs !== fields.totalRunningHours) {
          setFields(prev => ({
            ...prev,
            totalRunningHours: hrs
          }));
        }
      }
    }
  }, [fields.startTime, fields.endTime, activePage]);

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
    sizing_report: { key: 'sizing_report', label: "Sizing Set Report Entry", section: 'Reports', category: 'Reports, Bills & Amendments', desc: "Record sizing process details — chemical consumption, beam details, efficiency", icon: FileText, color: '#ec4899' },
    ws_bills: { key: 'ws_bills', label: "Warping/Sizing Bills Entry", section: 'Bills', category: 'Reports, Bills & Amendments', desc: "Record bills from warping and sizing job workers/vendors", icon: CreditCard, color: '#10b981' },
    set_amend: { key: 'set_amend', label: "SET Detail Amendment Entry", section: 'Amendment', category: 'Reports, Bills & Amendments', desc: "Correct or amend warping/sizing set details after entry", icon: Edit, color: '#64748b' }
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
    navigate(`?tab=${p.key}`, { replace: true });
  };

  const handleCreateNew = () => {
    const dateToday = new Date().toISOString().substring(0, 10);
    let initFields = { date: dateToday, status: 'Active' };

    if (activePage === 'warping_report') {
      initFields = {
        ...initFields,
        setReportNo: '',
        reportDate: dateToday,
        shift: 'Morning (6AM-2PM)',
        operatorName: 'Murugan Swamy',
        warpingOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: 'DES-4091',
        yarnType: '',
        yarnCount: '',
        millName: '',
        lotNo: '',
        shade: '',
        beamNo: '',
        setNo: '',
        totalEnds: '',
        beamWidth: '',
        beamLength: '',
        warpMeter: '',
        machineName: '',
        machineSpeed: '',
        startTime: '',
        endTime: '',
        totalRunningHours: '',
        inputYarnQty: '',
        outputBeamQty: '',
        wastageQty: '',
        breakageCount: '',
        tensionStatus: 'Normal',
        beamHardness: '',
        yarnBreakageStatus: 'Normal',
        qcStatus: 'Passed',
        statusTracking: 'Running',
        preparedBy: 'Murugan Swamy',
        verifiedBy: '',
        approvedBy: '',
        beamImageUpload: '',
        qcReportUpload: '',
        machineReportUpload: '',
        productionRemarks: '',
        qcNotes: '',
        internalNotes: ''
      };
    } else if (activePage === 'sizing_report') {
      initFields = {
        ...initFields,
        sizingReportNo: '',
        reportDate: dateToday,
        shift: 'Afternoon (2PM-10PM)',
        operatorName: 'Senthil Kumar (General Manager)',
        sizingOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: 'DES-4091',
        beamNo: '',
        yarnType: '',
        yarnCount: '',
        totalEnds: '',
        beamWidth: '',
        warpMeter: '',
        sizeMaterialType: '',
        sizePercentage: '',
        moisturePercentage: '',
        stretchPercentage: '',
        temperature: '',
        machineSpeed: '',
        machineName: '',
        startTime: '',
        endTime: '',
        totalRunningHours: '',
        inputYarnQty: '',
        outputBeamQty: '',
        wastagePercent: '',
        breakageCount: '',
        beamHardness: '',
        tensionResult: 'Normal',
        moistureResult: '',
        sizingQualityStatus: 'Good',
        qcStatus: 'Passed',
        completionDate: dateToday,
        readyForWeavingStatus: 'Ready',
        preparedBy: 'Senthil Kumar (General Manager)',
        qcApprovedBy: '',
        productionApprovedBy: '',
        statusTracking: 'Running',
        qcReportUpload: '',
        beamImageUpload: '',
        sizingSheetUpload: '',
        technicalRemarks: '',
        qcNotes: '',
        internalNotes: ''
      };
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
      initFields = {
        ...initFields,
        billNo: '',
        billDate: dateToday,
        billType: 'Combined Bill',
        vendorName: 'Standard Weaving Co.',
        vendorCode: 'VND-082',
        gstNo: '',
        warpingSizingOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        setReportNo: '',
        beamNo: '',
        setNo: '',
        totalEnds: '',
        warpMeter: '',
        processQuantity: '',
        processRate: '',
        totalAmount: '',
        additionalCharges: '0',
        taxPercent: '18',
        gstAmount: '',
        netAmount: '',
        processedQuantity: '',
        billableQuantity: '',
        rejectedQuantity: '',
        paymentTerms: '30 Days',
        dueDate: dateToday,
        advanceAmount: '0',
        balanceAmount: '',
        invoiceStatus: 'Draft',
        accountsVerifiedBy: '',
        paymentStatus: 'Pending',
        preparedBy: 'Mani Bharathi (Store Head)',
        verifiedBy: '',
        approvedBy: '',
        statusTracking: 'Draft',
        vendorInvoiceUpload: '',
        billCopyUpload: '',
        processReportUpload: '',
        accountsRemarks: '',
        vendorNotes: '',
        internalNotes: ''
      };
    } else if (activePage === 'set_amend') {
      initFields = {
        ...initFields,
        amendmentNo: '',
        amendmentDate: dateToday,
        amendmentType: 'Quantity Change',
        setReportNo: '',
        warpingSizingOrderNo: '',
        buyerOrderNo: '',
        designNo: 'DES-4091',
        oldBeamNo: '',
        oldTotalEnds: '',
        oldWarpMeter: '',
        oldWidth: '',
        oldQuantity: '',
        newBeamNo: '',
        newTotalEnds: '',
        newWarpMeter: '',
        newWidth: '',
        newQuantity: '',
        amendmentReason: 'Technical Correction',
        qcVerificationRequired: false,
        productionRecheckStatus: 'Pending',
        reworkRequired: false,
        requestedBy: 'Dinesh Balasamy (MD)',
        verifiedBy: '',
        approvedBy: '',
        approvalStatus: 'Pending',
        statusTracking: 'Draft',
        amendmentSheetUpload: '',
        qcReportUpload: '',
        supportingDocumentUpload: '',
        amendmentNotes: '',
        technicalRemarks: '',
        internalNotes: ''
      };
    }

    setFields(initFields);
    setSelectedRecord(null);
    setCurrentFormId('NEW RECORD');
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedRecord(row);
    setCurrentFormId(row.billNo || row.amendmentNo || row.setReportNo || row.sizingReportNo || row.id);
    setFields({
      ...row,
      voucherNo: row.voucherNo || row.id,
      deliveryVoucherNo: row.deliveryVoucherNo || row.id,
      emptyBeamVoucherNo: row.emptyBeamVoucherNo || row.id,
      setReportNo: row.setReportNo || row.id,
      sizingReportNo: row.sizingReportNo || row.id,
      billNo: row.billNo || row.id,
      amendmentNo: row.amendmentNo || row.id
    });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const manualTxnNo = fields.voucherNo || fields.deliveryVoucherNo || fields.emptyBeamVoucherNo || 
                        fields.setReportNo || fields.sizingReportNo || fields.billNo || fields.amendmentNo;

    const payload = {
      module_type: activePage,
      date: fields.date || fields.reportDate || fields.billDate || fields.amendmentDate || 
            fields.voucherDate || fields.deliveryDate || fields.returnDate || new Date().toISOString().substring(0, 10),
      buyer_name: fields.supplierName || fields.weaverName || fields.operatorName || fields.vendorName || 
                  fields.preparedBy || fields.requestedBy || "Internal",
      status: fields.status || fields.statusTracking || 'Active',
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

  const activeColor = PAGES_METADATA[activePage]?.color || '#3b82f6';
  const PageIcon = PAGES_METADATA[activePage]?.icon || Layers;
  const pageTitle = PAGES_METADATA[activePage]?.label || activeSection;
  const pageDesc = PAGES_METADATA[activePage]?.desc || `Manage ${activeSection.toLowerCase()} operations, approvals, and records.`;

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      {!isFormOpen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PageIcon size={24} color={activeColor} /> {pageTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {pageDesc}
            </p>
          </div>
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
                        <th>MACHINE NAME</th>
                        <th>OPERATOR NAME</th>
                        <th style={{ textAlign: 'right' }}>TOTAL ENDS</th>
                        <th style={{ textAlign: 'right' }}>BEAM WIDTH (MM)</th>
                        <th style={{ textAlign: 'right' }}>BEAM LENGTH</th>
                        <th style={{ textAlign: 'right' }}>WARP METER</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warpingReports.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.setReportNo || row.id}</td>
                          <td>{row.reportDate || row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.setNo}</td>
                          <td>{row.shift}</td>
                          <td>{row.machineName}</td>
                          <td>{row.operatorName}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalEnds}</td>
                          <td style={{ textAlign: 'right' }}>{row.beamWidth}</td>
                          <td style={{ textAlign: 'right' }}>{row.beamLength} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.warpMeter} Mtr</td>
                          <td>
                            <span className={`badge ${row.statusTracking === 'Completed' ? 'badge-active' : 'badge-inactive'}`}>
                              {row.statusTracking || 'Running'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {warpingReports.length === 0 && (
                        <tr>
                          <td colSpan="12" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No warping set reports found.</td>
                        </tr>
                      )}
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
                        <th>SHIFT</th>
                        <th>MACHINE NAME</th>
                        <th>OPERATOR NAME</th>
                        <th style={{ textAlign: 'right' }}>BEAM WIDTH</th>
                        <th style={{ textAlign: 'right' }}>WARP METER</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizingReports.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.sizingReportNo || row.id}</td>
                          <td>{row.reportDate || row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.setNo}</td>
                          <td>{row.shift}</td>
                          <td>{row.machineName}</td>
                          <td>{row.operatorName}</td>
                          <td style={{ textAlign: 'right' }}>{row.beamWidth} mm</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.warpMeter} Mtr</td>
                          <td>
                            <span className={`badge ${row.statusTracking === 'Completed' ? 'badge-active' : 'badge-inactive'}`}>
                              {row.statusTracking || 'Running'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {sizingReports.length === 0 && (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No sizing set reports found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* WS BILLS TABLE */}
              {activePage === 'ws_bills' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>BILL NO</th>
                        <th>DATE</th>
                        <th>BILL TYPE</th>
                        <th>VENDOR NAME</th>
                        <th>SET REPORT NO</th>
                        <th style={{ textAlign: 'right' }}>PROCESS QTY</th>
                        <th style={{ textAlign: 'right' }}>RATE</th>
                        <th style={{ textAlign: 'right' }}>NET AMOUNT</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobBills.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.billNo || row.id}</td>
                          <td>{row.billDate || row.date}</td>
                          <td>{row.billType}</td>
                          <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                          <td>{row.setReportNo}</td>
                          <td style={{ textAlign: 'right' }}>{row.processQuantity} Mtr</td>
                          <td style={{ textAlign: 'right' }}>₹{row.processRate}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{row.netAmount}</td>
                          <td>
                            <span className={`badge ${row.statusTracking === 'Paid' ? 'badge-active' : 'badge-inactive'}`}>
                              {row.statusTracking || 'Draft'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {jobBills.length === 0 && (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No vendor bills found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SET AMEND TABLE */}
              {activePage === 'set_amend' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>AMENDMENT NO</th>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>SET REPORT NO</th>
                        <th>REASON</th>
                        <th>REWORK</th>
                        <th>APPROVAL</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {setAmendments.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.amendmentNo || row.id}</td>
                          <td>{row.amendmentDate || row.date}</td>
                          <td>{row.amendmentType}</td>
                          <td style={{ fontWeight: 650 }}>{row.setReportNo}</td>
                          <td>{row.amendmentReason}</td>
                          <td>{row.reworkRequired ? 'Yes' : 'No'}</td>
                          <td>
                            <span className={`badge ${row.approvalStatus === 'Approved' ? 'badge-active' : 'badge-inactive'}`}>
                              {row.approvalStatus || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-active">{row.statusTracking || 'Draft'}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {setAmendments.length === 0 && (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No set detail amendments found.</td>
                        </tr>
                      )}
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
              {!['warping_report', 'sizing_report', 'beam_received', 'beam_delivery', 'empty_beam', 'ws_bills', 'set_amend'].includes(activePage) && (
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
            <div className="card animate-fade" style={{ padding: '32px', background: 'white', borderTop: `4px solid ${activeColor}` }}>
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
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: activeColor, borderColor: activeColor }}>
                    <Check size={15} /> Save Record
                  </button>
                </div>
              </div>

              {/* WARPING REPORT FORM */}
              {activePage === 'warping_report' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Card 1: Report Information */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} /> Report Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warping Set Report No *</label>
                        <input type="text" className="form-control" name="setReportNo" value={fields.setReportNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Report Date *</label>
                        <input type="date" className="form-control" name="reportDate" value={fields.reportDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Shift *</label>
                        <select className="form-control" name="shift" value={fields.shift || ''} onChange={handleInputChange}>
                          {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Operator Name *</label>
                        <select className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Reference Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FolderKanban size={16} /> Reference Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warping Order No</label>
                        <input type="text" className="form-control" name="warpingOrderNo" value={fields.warpingOrderNo || ''} onChange={handleInputChange} />
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
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Yarn Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scissors size={16} /> Yarn Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Type</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} placeholder="e.g. Cotton, Polyester" />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} placeholder="e.g. 40s, 60s" />
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
                    </div>
                  </div>

                  {/* Card 4: Beam / Set Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} /> Beam / Set Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Set No *</label>
                        <input type="text" className="form-control" name="setNo" value={fields.setNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Ends *</label>
                        <input type="number" className="form-control" name="totalEnds" value={fields.totalEnds || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Beam Width (mm)</label>
                        <input type="number" className="form-control" name="beamWidth" value={fields.beamWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Length (Mtr)</label>
                        <input type="number" className="form-control" name="beamLength" value={fields.beamLength || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Meter *</label>
                        <input type="number" className="form-control" name="warpMeter" value={fields.warpMeter || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Production Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Factory size={16} /> Production Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Machine Name *</label>
                        <input type="text" className="form-control" name="machineName" value={fields.machineName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Machine Speed (RPM)</label>
                        <input type="text" className="form-control" name="machineSpeed" value={fields.machineSpeed || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Start Time</label>
                        <input type="time" className="form-control" name="startTime" value={fields.startTime || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>End Time</label>
                        <input type="time" className="form-control" name="endTime" value={fields.endTime || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Running Hours</label>
                        <input type="number" step="0.01" className="form-control" name="totalRunningHours" value={fields.totalRunningHours || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Quantity Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={16} /> Quantity Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Input Yarn Qty (Kg)</label>
                        <input type="number" className="form-control" name="inputYarnQty" value={fields.inputYarnQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Output Beam Qty (Kg)</label>
                        <input type="number" className="form-control" name="outputBeamQty" value={fields.outputBeamQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Wastage Qty (Kg)</label>
                        <input type="number" className="form-control" name="wastageQty" value={fields.wastageQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Breakage Count</label>
                        <input type="number" className="form-control" name="breakageCount" value={fields.breakageCount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 7: Quality Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquare size={16} /> Quality Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Tension Status</label>
                        <select className="form-control" name="tensionStatus" value={fields.tensionStatus || 'Normal'} onChange={handleInputChange}>
                          <option value="Normal">Normal</option>
                          <option value="Low">Low</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Beam Hardness</label>
                        <input type="text" className="form-control" name="beamHardness" value={fields.beamHardness || ''} onChange={handleInputChange} placeholder="e.g. 70 Shore" />
                      </div>
                      <div className="form-group">
                        <label>Yarn Breakage Status</label>
                        <select className="form-control" name="yarnBreakageStatus" value={fields.yarnBreakageStatus || 'Normal'} onChange={handleInputChange}>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Passed'} onChange={handleInputChange}>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 8: Status & Approvals */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} /> Approval & Status Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Status Tracking</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Running'} onChange={handleInputChange}>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Hold">Hold</option>
                          <option value="Rework">Rework</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Prepared By</label>
                        <select className="form-control" name="preparedBy" value={fields.preparedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Verified By</label>
                        <select className="form-control" name="verifiedBy" value={fields.verifiedBy || ''} onChange={handleInputChange}>
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

                  {/* Card 9: Attachments */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileImage size={16} /> Attachments
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam Image Upload (URL/Link)</label>
                        <input type="text" className="form-control" name="beamImageUpload" value={fields.beamImageUpload || ''} onChange={handleInputChange} placeholder="e.g. uploads/beam_img.png" />
                      </div>
                      <div className="form-group">
                        <label>QC Report Upload (URL/Link)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/qc_rpt.pdf" />
                      </div>
                      <div className="form-group">
                        <label>Machine Report Upload (URL/Link)</label>
                        <input type="text" className="form-control" name="machineReportUpload" value={fields.machineReportUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/mach_rpt.pdf" />
                      </div>
                    </div>
                  </div>

                  {/* Card 10: Remarks */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> Remarks & Notes
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Production Remarks</label>
                        <textarea className="form-control" rows="3" name="productionRemarks" value={fields.productionRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Notes</label>
                        <textarea className="form-control" rows="3" name="qcNotes" value={fields.qcNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* SIZING REPORT FORM */}
              {activePage === 'sizing_report' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Card 1: Report Information */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} /> Report Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sizing Set Report No *</label>
                        <input type="text" className="form-control" name="sizingReportNo" value={fields.sizingReportNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Report Date *</label>
                        <input type="date" className="form-control" name="reportDate" value={fields.reportDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Shift *</label>
                        <select className="form-control" name="shift" value={fields.shift || ''} onChange={handleInputChange}>
                          {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Operator Name *</label>
                        <select className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Reference Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FolderKanban size={16} /> Reference Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sizing Order No</label>
                        <input type="text" className="form-control" name="sizingOrderNo" value={fields.sizingOrderNo || ''} onChange={handleInputChange} />
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
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Yarn & Beam Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} /> Yarn & Beam Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Type</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Ends</label>
                        <input type="number" className="form-control" name="totalEnds" value={fields.totalEnds || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Width (mm)</label>
                        <input type="number" className="form-control" name="beamWidth" value={fields.beamWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Meter *</label>
                        <input type="number" className="form-control" name="warpMeter" value={fields.warpMeter || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Sizing Parameters */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Settings size={16} /> Sizing Parameters
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Size Material Type</label>
                        <input type="text" className="form-control" name="sizeMaterialType" value={fields.sizeMaterialType || ''} onChange={handleInputChange} placeholder="e.g. Starch, PVA" />
                      </div>
                      <div className="form-group">
                        <label>Size %</label>
                        <input type="number" step="0.01" className="form-control" name="sizePercentage" value={fields.sizePercentage || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Moisture %</label>
                        <input type="number" step="0.01" className="form-control" name="moisturePercentage" value={fields.moisturePercentage || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Stretch %</label>
                        <input type="number" step="0.01" className="form-control" name="stretchPercentage" value={fields.stretchPercentage || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Temperature (°C)</label>
                        <input type="number" className="form-control" name="temperature" value={fields.temperature || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Machine Speed (RPM)</label>
                        <input type="number" className="form-control" name="machineSpeed" value={fields.machineSpeed || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Production Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Factory size={16} /> Production Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Machine Name *</label>
                        <input type="text" className="form-control" name="machineName" value={fields.machineName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Start Time</label>
                        <input type="time" className="form-control" name="startTime" value={fields.startTime || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>End Time</label>
                        <input type="time" className="form-control" name="endTime" value={fields.endTime || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Running Hours</label>
                        <input type="number" step="0.01" className="form-control" name="totalRunningHours" value={fields.totalRunningHours || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Quantity Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={16} /> Quantity Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Input Yarn Qty (Kg)</label>
                        <input type="number" className="form-control" name="inputYarnQty" value={fields.inputYarnQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Output Beam Qty (Kg)</label>
                        <input type="number" className="form-control" name="outputBeamQty" value={fields.outputBeamQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Wastage %</label>
                        <input type="number" step="0.01" className="form-control" name="wastagePercent" value={fields.wastagePercent || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Breakage Count</label>
                        <input type="number" className="form-control" name="breakageCount" value={fields.breakageCount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 7: Quality Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquare size={16} /> Quality Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam Hardness</label>
                        <input type="text" className="form-control" name="beamHardness" value={fields.beamHardness || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tension Result</label>
                        <select className="form-control" name="tensionResult" value={fields.tensionResult || 'Normal'} onChange={handleInputChange}>
                          <option value="Normal">Normal</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                          <option value="Bad">Bad</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Moisture Result</label>
                        <input type="text" className="form-control" name="moistureResult" value={fields.moistureResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sizing Quality Status</label>
                        <select className="form-control" name="sizingQualityStatus" value={fields.sizingQualityStatus || 'Good'} onChange={handleInputChange}>
                          <option value="Good">Good</option>
                          <option value="Hold">Hold</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Passed'} onChange={handleInputChange}>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 8: Delivery Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={16} /> Delivery Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Completion Date</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Ready For Weaving Status</label>
                        <select className="form-control" name="readyForWeavingStatus" value={fields.readyForWeavingStatus || 'Ready'} onChange={handleInputChange}>
                          <option value="Ready">Ready</option>
                          <option value="Pending">Pending</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 9: Approvals & Status */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} /> Approval & Status Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Status Tracking</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Running'} onChange={handleInputChange}>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Hold">Hold</option>
                          <option value="Rework">Rework</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Prepared By</label>
                        <select className="form-control" name="preparedBy" value={fields.preparedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Approved By</label>
                        <select className="form-control" name="qcApprovedBy" value={fields.qcApprovedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Production Approved By</label>
                        <select className="form-control" name="productionApprovedBy" value={fields.productionApprovedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 10: Attachments */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileImage size={16} /> Attachments
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Report Upload</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/qc_sizing.pdf" />
                      </div>
                      <div className="form-group">
                        <label>Beam Image Upload</label>
                        <input type="text" className="form-control" name="beamImageUpload" value={fields.beamImageUpload || ''} onChange={handleInputChange} placeholder="e.g. uploads/sizing_beam.png" />
                      </div>
                      <div className="form-group">
                        <label>Sizing Sheet Upload</label>
                        <input type="text" className="form-control" name="sizingSheetUpload" value={fields.sizingSheetUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/sizing_sheet.pdf" />
                      </div>
                    </div>
                  </div>

                  {/* Card 11: Remarks */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> Remarks & Notes
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Notes</label>
                        <textarea className="form-control" rows="3" name="qcNotes" value={fields.qcNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* WARPING/SIZING BILLS ENTRY FORM */}
              {activePage === 'ws_bills' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Card 1: Bill Information */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} /> Bill Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Bill No *</label>
                        <input type="text" className="form-control" name="billNo" value={fields.billNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Bill Date *</label>
                        <input type="date" className="form-control" name="billDate" value={fields.billDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Bill Type *</label>
                        <select className="form-control" name="billType" value={fields.billType || ''} onChange={handleInputChange}>
                          <option value="Warping">Warping Bill</option>
                          <option value="Sizing">Sizing Bill</option>
                          <option value="Combined Bill">Combined Bill</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Vendor Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Factory size={16} /> Vendor Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Vendor Code</label>
                        <input type="text" className="form-control" name="vendorCode" value={fields.vendorCode || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GST No</label>
                        <input type="text" className="form-control" name="gstNo" value={fields.gstNo || ''} onChange={handleInputChange} placeholder="e.g. 33AAAAA1111A1Z1" />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Reference Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FolderKanban size={16} /> Reference Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warping/Sizing Order No</label>
                        <input type="text" className="form-control" name="warpingSizingOrderNo" value={fields.warpingSizingOrderNo || ''} onChange={handleInputChange} />
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
                        <label>Set Report No</label>
                        <input type="text" className="form-control" name="setReportNo" value={fields.setReportNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Production Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} /> Production Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Set No</label>
                        <input type="text" className="form-control" name="setNo" value={fields.setNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Ends</label>
                        <input type="number" className="form-control" name="totalEnds" value={fields.totalEnds || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Meter</label>
                        <input type="number" className="form-control" name="warpMeter" value={fields.warpMeter || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Process Quantity *</label>
                        <input type="number" className="form-control" name="processQuantity" value={fields.processQuantity || ''} onChange={handleInputChange} required placeholder="Quantity in Mtr/Kg" />
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Commercial Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={16} /> Commercial Details (Auto-calculated)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Process Rate (₹) *</label>
                        <input type="number" step="0.01" className="form-control" name="processRate" value={fields.processRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Amount (₹)</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} readOnly style={{ background: '#e2e8f0', fontWeight: 'bold' }} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges (₹)</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tax %</label>
                        <input type="number" className="form-control" name="taxPercent" value={fields.taxPercent || '18'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GST Amount (₹)</label>
                        <input type="number" className="form-control" name="gstAmount" value={fields.gstAmount || ''} readOnly style={{ background: '#e2e8f0' }} />
                      </div>
                      <div className="form-group">
                        <label>Net Amount (₹)</label>
                        <input type="number" className="form-control" name="netAmount" value={fields.netAmount || ''} readOnly style={{ background: '#cbd5e1', fontWeight: '800' }} />
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Quantity Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={16} /> Quantity Logs
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processed Quantity</label>
                        <input type="number" className="form-control" name="processedQuantity" value={fields.processedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Billable Quantity</label>
                        <input type="number" className="form-control" name="billableQuantity" value={fields.billableQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rejected Quantity</label>
                        <input type="number" className="form-control" name="rejectedQuantity" value={fields.rejectedQuantity || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 7: Payment Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CreditCard size={16} /> Payment Terms & Balance
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Payment Terms</label>
                        <select className="form-control" name="paymentTerms" value={fields.paymentTerms || '30 Days'} onChange={handleInputChange}>
                          <option value="30 Days">30 Days</option>
                          <option value="60 Days">60 Days</option>
                          <option value="Immediate">Immediate Cash/UPI</option>
                          <option value="LC">Letter of Credit (LC)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Due Date</label>
                        <input type="date" className="form-control" name="dueDate" value={fields.dueDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Advance Amount Paid (₹)</label>
                        <input type="number" className="form-control" name="advanceAmount" value={fields.advanceAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Amount Due (₹)</label>
                        <input type="number" className="form-control" name="balanceAmount" value={fields.balanceAmount || ''} readOnly style={{ background: '#e2e8f0', fontWeight: 'bold' }} />
                      </div>
                    </div>
                  </div>

                  {/* Card 8: Accounts Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={16} /> Accounts & Audit details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Invoice Verification Status</label>
                        <select className="form-control" name="invoiceStatus" value={fields.invoiceStatus || 'Draft'} onChange={handleInputChange}>
                          <option value="Draft">Draft / Unverified</option>
                          <option value="Pending Verification">Pending Verification</option>
                          <option value="Verified">Verified & Confirmed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Accounts Verified By</label>
                        <select className="form-control" name="accountsVerifiedBy" value={fields.accountsVerifiedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Payment Status</label>
                        <select className="form-control" name="paymentStatus" value={fields.paymentStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid">Paid / Settled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 9: Approvals & Status */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} /> Approvals & Workflow Status
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Prepared By</label>
                        <select className="form-control" name="preparedBy" value={fields.preparedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Verified By</label>
                        <select className="form-control" name="verifiedBy" value={fields.verifiedBy || ''} onChange={handleInputChange}>
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
                      <div className="form-group">
                        <label>Status Tracking</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Draft'} onChange={handleInputChange}>
                          <option value="Draft">Draft</option>
                          <option value="Pending Verification">Pending Verification</option>
                          <option value="Approved">Approved</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 10: Attachments */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileImage size={16} /> Attachments
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Invoice Upload</label>
                        <input type="text" className="form-control" name="vendorInvoiceUpload" value={fields.vendorInvoiceUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/invoice_491.pdf" />
                      </div>
                      <div className="form-group">
                        <label>Bill Copy Upload</label>
                        <input type="text" className="form-control" name="billCopyUpload" value={fields.billCopyUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/bill_copy.pdf" />
                      </div>
                      <div className="form-group">
                        <label>Process Report Upload</label>
                        <input type="text" className="form-control" name="processReportUpload" value={fields.processReportUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/process_report.pdf" />
                      </div>
                    </div>
                  </div>

                  {/* Card 11: Remarks */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> Remarks & Notes
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Accounts Remarks</label>
                        <textarea className="form-control" rows="3" name="accountsRemarks" value={fields.accountsRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Notes</label>
                        <textarea className="form-control" rows="3" name="vendorNotes" value={fields.vendorNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* SET DETAIL AMENDMENT ENTRY FORM */}
              {activePage === 'set_amend' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Card 1: Amendment Information */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} /> Amendment Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Amendment No *</label>
                        <input type="text" className="form-control" name="amendmentNo" value={fields.amendmentNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Amendment Date *</label>
                        <input type="date" className="form-control" name="amendmentDate" value={fields.amendmentDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Amendment Type *</label>
                        <select className="form-control" name="amendmentType" value={fields.amendmentType || ''} onChange={handleInputChange}>
                          <option value="Quantity Change">Quantity Change</option>
                          <option value="Beam Change">Beam Change</option>
                          <option value="Ends Correction">Ends Correction</option>
                          <option value="Meter Correction">Meter Correction</option>
                          <option value="Process Correction">Process Correction</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Reference Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FolderKanban size={16} /> Reference Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Set Report No *</label>
                        <input type="text" className="form-control" name="setReportNo" value={fields.setReportNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Warping/Sizing Order No</label>
                        <input type="text" className="form-control" name="warpingSizingOrderNo" value={fields.warpingSizingOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Existing Set Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} /> Existing Set Details (Before amendment)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Old Beam No</label>
                        <input type="text" className="form-control" name="oldBeamNo" value={fields.oldBeamNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Old Total Ends</label>
                        <input type="number" className="form-control" name="oldTotalEnds" value={fields.oldTotalEnds || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Old Warp Meter</label>
                        <input type="number" className="form-control" name="oldWarpMeter" value={fields.oldWarpMeter || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Old Width (mm)</label>
                        <input type="number" className="form-control" name="oldWidth" value={fields.oldWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Old Quantity (Kg)</label>
                        <input type="number" className="form-control" name="oldQuantity" value={fields.oldQuantity || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Revised Set Details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} /> Revised Set Details (After amendment)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>New Beam No</label>
                        <input type="text" className="form-control" name="newBeamNo" value={fields.newBeamNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>New Total Ends</label>
                        <input type="number" className="form-control" name="newTotalEnds" value={fields.newTotalEnds || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>New Warp Meter</label>
                        <input type="number" className="form-control" name="newWarpMeter" value={fields.newWarpMeter || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>New Width (mm)</label>
                        <input type="number" className="form-control" name="newWidth" value={fields.newWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>New Quantity (Kg)</label>
                        <input type="number" className="form-control" name="newQuantity" value={fields.newQuantity || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Amendment Reason */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HelpCircle size={16} /> Amendment Reason
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Reason *</label>
                        <select className="form-control" name="amendmentReason" value={fields.amendmentReason || 'Technical Correction'} onChange={handleInputChange}>
                          <option value="Technical Correction">Technical Correction</option>
                          <option value="QC Correction">QC Correction</option>
                          <option value="Production Adjustment">Production Adjustment</option>
                          <option value="Operator Error">Operator Error</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Quality Impact */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} /> Quality Impact
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                        <input type="checkbox" name="qcVerificationRequired" checked={fields.qcVerificationRequired || false} onChange={handleInputChange} />
                        <label style={{ margin: 0 }}>QC Verification Required</label>
                      </div>
                      <div className="form-group">
                        <label>Production Recheck Status</label>
                        <select className="form-control" name="productionRecheckStatus" value={fields.productionRecheckStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending Recheck</option>
                          <option value="Rechecked">Rechecked & Verified</option>
                          <option value="Rework Required">Rework Required</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                        <input type="checkbox" name="reworkRequired" checked={fields.reworkRequired || false} onChange={handleInputChange} />
                        <label style={{ margin: 0 }}>Rework Required</label>
                      </div>
                    </div>
                  </div>

                  {/* Card 7: Approval details */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={16} /> Approvals & Workflow Status
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Requested By</label>
                        <select className="form-control" name="requestedBy" value={fields.requestedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Verified By</label>
                        <select className="form-control" name="verifiedBy" value={fields.verifiedBy || ''} onChange={handleInputChange}>
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
                      <div className="form-group">
                        <label>Approval Status</label>
                        <select className="form-control" name="approvalStatus" value={fields.approvalStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 8: Status Tracking */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={16} /> Status Tracking
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Overall Amendment Status</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Draft'} onChange={handleInputChange}>
                          <option value="Draft">Draft</option>
                          <option value="Pending Approval">Pending Approval</option>
                          <option value="Approved">Approved / Active</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 9: Attachments */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileImage size={16} /> Attachments
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Amendment Sheet Upload</label>
                        <input type="text" className="form-control" name="amendmentSheetUpload" value={fields.amendmentSheetUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/amend_sheet.pdf" />
                      </div>
                      <div className="form-group">
                        <label>QC Report Upload</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/qc_amend.pdf" />
                      </div>
                      <div className="form-group">
                        <label>Supporting Document Upload</label>
                        <input type="text" className="form-control" name="supportingDocumentUpload" value={fields.supportingDocumentUpload || ''} onChange={handleInputChange} placeholder="e.g. docs/support_doc.pdf" />
                      </div>
                    </div>
                  </div>

                  {/* Card 10: Remarks */}
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} /> Remarks & Notes
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Amendment Notes</label>
                        <textarea className="form-control" rows="3" name="amendmentNotes" value={fields.amendmentNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* BEAM RECEIVED ENTRY FORM */}
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

            </div>
          )}
        </>
      )}

    </div>
  );
}
