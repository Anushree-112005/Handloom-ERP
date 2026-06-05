import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, Factory, CheckSquare, ShoppingBag, Truck, FileText, Globe, Sparkles,
  Scissors, Scale, Percent, Clock, FileImage, CreditCard, User, AlertCircle, ShieldCheck, Shield,
  FolderKanban, Database, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { workOrderTransactionAPI } from '../../services/api';

export default function GreigeTransaction({ defaultSection = 'Greige Operations' }) {
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');

  // Static lists for selections
  const VENDORS = ['Standard Weaving Co.', 'Senthil Loom Mills', 'Own Loom Unit A', 'Standard Gears Ltd'];
  const EMPLOYEES = [
    'Senthil Kumar (General Manager)', 
    'Mani Bharathi (Store Head)', 
    'Dinesh Balasamy (MD)', 
    'Murugan Swamy (Maintenance In-charge)'
  ];
  const SHIFTS = ['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)'];
  const DESIGNS = ['DES-4091 Premium Satin', 'DES-5011 Weave Twill', 'DES-2012 Plain Voile', 'DES-8812 Indigo Chambray'];

  // State hooks for 12 sub-modules
  const [vendorInwards, setVendorInwards] = useState([]);
  const [greigeCheckings, setGreigeCheckings] = useState([]);
  const [clothMendings, setClothMendings] = useState([]);
  const [greigePackings, setGreigePackings] = useState([]);
  const [greigeDeliveries, setGreigeDeliveries] = useState([]);
  const [baleDeliveries, setBaleDeliveries] = useState([]);
  const [baleAmds, setBaleAmds] = useState([]);
  const [lotAmds, setLotAmds] = useState([]);
  const [goodsReleases, setGoodsReleases] = useState([]);
  const [greigeInvoices, setGreigeInvoices] = useState([]);
  const [ewayBills, setEwayBills] = useState([]);
  const [einvoiceEways, setEinvoiceEways] = useState([]);

  const getSubModuleCount = (key) => {
    switch (key) {
      case 'vendor_inward': return vendorInwards.length;
      case 'ot_checking': return greigeCheckings.length;
      case 'cloth_mending': return clothMendings.length;
      case 'cloth_packing': return greigePackings.length;
      case 'cloth_delivery': return greigeDeliveries.length;
      case 'bale_delivery': return baleDeliveries.length;
      case 'bale_amd': return baleAmds.length;
      case 'lot_amd': return lotAmds.length;
      case 'goods_release': return goodsReleases.length;
      case 'gry_invoice': return greigeInvoices.length;
      case 'eway_bill': return ewayBills.length;
      case 'einvoice_eway': return einvoiceEways.length;
      default: return 0;
    }
  };

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [fields, setFields] = useState({});

  const loadData = async () => {
    try {
      const response = await workOrderTransactionAPI.getAll();
      const allTxns = response.data;
      const mapTxn = (t) => ({ ...t.details, id: t.transaction_no, db_id: t.id, status: t.status });

      setVendorInwards(allTxns.filter(t => t.module_type === 'vendor_inward').map(mapTxn));
      setGreigeCheckings(allTxns.filter(t => t.module_type === 'ot_checking').map(mapTxn));
      setClothMendings(allTxns.filter(t => t.module_type === 'cloth_mending').map(mapTxn));
      setGreigePackings(allTxns.filter(t => t.module_type === 'cloth_packing').map(mapTxn));
      setGreigeDeliveries(allTxns.filter(t => t.module_type === 'cloth_delivery').map(mapTxn));
      setBaleDeliveries(allTxns.filter(t => t.module_type === 'bale_delivery').map(mapTxn));
      setBaleAmds(allTxns.filter(t => t.module_type === 'bale_amd').map(mapTxn));
      setLotAmds(allTxns.filter(t => t.module_type === 'lot_amd').map(mapTxn));
      setGoodsReleases(allTxns.filter(t => t.module_type === 'goods_release').map(mapTxn));
      setGreigeInvoices(allTxns.filter(t => t.module_type === 'gry_invoice').map(mapTxn));
      setEwayBills(allTxns.filter(t => t.module_type === 'eway_bill').map(mapTxn));
      setEinvoiceEways(allTxns.filter(t => t.module_type === 'einvoice_eway').map(mapTxn));
    } catch (err) {
      console.error("Failed to load greige transactions", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Real-time calculations hook
  useEffect(() => {
    if (activePage === 'vendor_inward') {
      const sent = parseFloat(fields.sentQuantity) || 0;
      const recd = parseFloat(fields.receivedQuantity) || 0;
      const short = sent > recd ? sent - recd : 0;
      const excess = recd > sent ? recd - sent : 0;
      let days = 0;
      if (fields.dispatchDate && fields.receivedDate) {
        const d1 = new Date(fields.dispatchDate);
        const d2 = new Date(fields.receivedDate);
        days = Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
      }
      if (short.toString() !== fields.shortQuantity || excess.toString() !== fields.excessQuantity || days.toString() !== fields.delayDays) {
        setFields(prev => ({ ...prev, shortQuantity: short.toString(), excessQuantity: excess.toString(), delayDays: days.toString() }));
      }
    } else if (activePage === 'ot_checking') {
      const checked = parseFloat(fields.checkedQuantity) || 0;
      const rejected = parseFloat(fields.rejectedQuantity) || 0;
      const passed = checked - rejected;
      if (passed.toString() !== fields.passedQuantity) {
        setFields(prev => ({ ...prev, passedQuantity: passed.toString() }));
      }
    } else if (activePage === 'cloth_mending') {
      const total = parseFloat(fields.totalRollLength) || 0;
      const repaired = parseFloat(fields.repairedQuantity) || 0;
      const rejected = parseFloat(fields.rejectedQuantity) || 0;
      const pending = Math.max(0, total - repaired - rejected);
      if (pending.toString() !== fields.pendingQuantity) {
        setFields(prev => ({ ...prev, pendingQuantity: pending.toString() }));
      }
    } else if (activePage === 'cloth_packing') {
      const rolled = parseFloat(fields.rollQuantity) || 0;
      const packed = parseFloat(fields.packedQuantity) || 0;
      const bal = Math.max(0, rolled - packed);
      if (bal.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ ...prev, balanceQuantity: bal.toString() }));
      }
    } else if (activePage === 'cloth_delivery') {
      const delivered = parseFloat(fields.deliveredQuantity) || 0;
      const rolls = parseFloat(fields.rollCount) || 0;
      const bal = Math.max(0, rolls - delivered);
      if (bal.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ ...prev, balanceQuantity: bal.toString() }));
      }
    } else if (activePage === 'bale_delivery') {
      const delivered = parseFloat(fields.deliveredQuantity) || 0;
      const weight = parseFloat(fields.baleWeight) || 0;
      const bal = Math.max(0, weight - delivered);
      if (bal.toString() !== fields.pendingQuantity) {
        setFields(prev => ({ ...prev, pendingQuantity: bal.toString() }));
      }
    } else if (activePage === 'lot_amd') {
      const prevQty = parseFloat(fields.previousQuantity) || 0;
      const revQty = parseFloat(fields.revisedQuantity) || 0;
      const diff = revQty - prevQty;
      if (diff.toString() !== fields.differenceQuantity) {
        setFields(prev => ({ ...prev, differenceQuantity: diff.toString() }));
      }
    } else if (activePage === 'goods_release') {
      const appQty = parseFloat(fields.approvedQuantity) || 0;
      const relQty = parseFloat(fields.releasedQuantity) || 0;
      const bal = Math.max(0, appQty - relQty);
      if (bal.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ ...prev, balanceQuantity: bal.toString() }));
      }
    } else if (activePage === 'gry_invoice') {
      const qty = parseFloat(fields.invoiceQuantity) || 0;
      const rate = parseFloat(fields.rate) || 0;
      const disc = parseFloat(fields.discount) || 0;
      const taxPct = parseFloat(fields.taxPercent) || 0;
      const freight = parseFloat(fields.freightCharges) || 0;
      const advance = parseFloat(fields.advanceAmount) || 0;
      const subtotal = (qty * rate) * (1 - disc / 100);
      const gst = subtotal * (taxPct / 100);
      const net = subtotal + gst + freight;
      const bal = net - advance;
      if (gst.toFixed(2) !== fields.gstAmount || net.toFixed(2) !== fields.netAmount || bal.toFixed(2) !== fields.balanceAmount) {
        setFields(prev => ({ ...prev, gstAmount: gst.toFixed(2), netAmount: net.toFixed(2), balanceAmount: bal.toFixed(2) }));
      }
    } else if (activePage === 'eway_bill' || activePage === 'einvoice_eway') {
      const taxable = parseFloat(fields.taxableAmount) || 0;
      const gstPct = parseFloat(fields.gstPercent) || 0;
      const cgst = taxable * (gstPct / 2 / 100);
      const sgst = taxable * (gstPct / 2 / 100);
      const igst = taxable * (gstPct / 100);
      const totTax = taxable * (gstPct / 100);
      if (cgst.toFixed(2) !== fields.cgst || sgst.toFixed(2) !== fields.sgst || igst.toFixed(2) !== fields.igst || (activePage === 'einvoice_eway' && totTax.toFixed(2) !== fields.totalTaxAmount)) {
        setFields(prev => ({ ...prev, cgst: cgst.toFixed(2), sgst: sgst.toFixed(2), igst: igst.toFixed(2), totalTaxAmount: totTax.toFixed(2) }));
      }
    }
  }, [
    fields.sentQuantity, fields.receivedQuantity, fields.dispatchDate, fields.receivedDate,
    fields.checkedQuantity, fields.rejectedQuantity, fields.totalRollLength, fields.repairedQuantity,
    fields.rollQuantity, fields.packedQuantity, fields.deliveredQuantity, fields.rollCount,
    fields.baleWeight, fields.previousQuantity, fields.revisedQuantity, fields.approvedQuantity, fields.releasedQuantity,
    fields.invoiceQuantity, fields.rate, fields.discount, fields.taxPercent, fields.freightCharges, fields.advanceAmount,
    fields.taxableAmount, fields.gstPercent, activePage
  ]);

  const PAGES_METADATA = {
    // Greige Operations
    vendor_inward: { key: 'vendor_inward', label: "Vendor Inward", category: 'Greige Operations', desc: "Record fabric received from weaving vendors", icon: Factory, color: '#2563eb' },
    ot_checking: { key: 'ot_checking', label: "ON Table Checking", category: 'Greige Operations', desc: "Quality inspection of greige fabric on checking table", icon: CheckSquare, color: '#4f46e5' },
    cloth_mending: { key: 'cloth_mending', label: "Cloth Mending Entry", category: 'Greige Operations', desc: "Record repair/mending work done on defective fabric", icon: Layers, color: '#d946ef' },
    cloth_packing: { key: 'cloth_packing', label: "Cloth Packing (Greige)", category: 'Greige Operations', desc: "Pack greige fabric rolls into bales", icon: ShoppingBag, color: '#ec4899' },
    cloth_delivery: { key: 'cloth_delivery', label: "Cloth Delivery (Greige)", category: 'Greige Operations', desc: "Record delivery of greige cloth to buyers", icon: Truck, color: '#0d9488' },
    bale_delivery: { key: 'bale_delivery', label: "Bale Delivery (Greige)", category: 'Greige Operations', desc: "Record greige cloth delivery in bale format", icon: ShoppingBag, color: '#0f766e' },

    // Greige Administration
    bale_amd: { key: 'bale_amd', label: "Greige Bale AMD", category: 'Greige Administration', desc: "Amend packed bale details", icon: Edit, color: '#475569' },
    lot_amd: { key: 'lot_amd', label: "Greige LOT AMD", category: 'Greige Administration', desc: "Amend greige lot information", icon: Edit, color: '#64748b' },
    goods_release: { key: 'goods_release', label: "Greige Goods Release Advice", category: 'Greige Administration', desc: "Authorize release of greige goods for dispatch", icon: FileText, color: '#10b981' },
    gry_invoice: { key: 'gry_invoice', label: "Gry Sales Invoice", category: 'Greige Administration', desc: "Link to central sales invoicing module (Link)", icon: FileText, isLink: true, route: '/sales-invoice', color: '#0284c7' },
    eway_bill: { key: 'eway_bill', label: "Cloth Delivery Eway Bill (Greige)", category: 'Greige Administration', desc: "Generate E-Way Bill for greige delivery (Link)", icon: Globe, isLink: true, route: '/eway-bill', color: '#8b5cf6' },
    einvoice_eway: { key: 'einvoice_eway', label: "Einvoice / Eway Bill (Greige)", category: 'Greige Administration', desc: "Generate integrated E-Invoice & E-Way Bill (Link)", icon: Sparkles, isLink: true, route: '/eway-bill', color: '#a855f7' }
  };

  // Declarative configurations of cards/fields for all 12 modules
  const FORM_SCHEMAS = {
    vendor_inward: [
      { title: "Inward Information", icon: FileText, fields: [
        { name: "vendorInwardNo", label: "Vendor Inward No *", type: "text", required: true },
        { name: "inwardDate", label: "Inward Date *", type: "date", required: true },
        { name: "inwardType", label: "Inward Type *", type: "select", options: ["Weaving", "Processing Return", "Job Work Return"] }
      ]},
      { title: "Vendor Details", icon: Factory, fields: [
        { name: "vendorName", label: "Vendor Name *", type: "select", options: VENDORS },
        { name: "vendorCode", label: "Vendor Code", type: "text" },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "vendorOrderNo", label: "Vendor Order No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "challanNo", label: "Challan / DC No *", type: "text", required: true }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "construction", label: "Construction", type: "text" },
        { name: "composition", label: "Composition", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "sentQuantity", label: "Sent Quantity *", type: "number", required: true },
        { name: "receivedQuantity", label: "Received Quantity *", type: "number", required: true },
        { name: "shortQuantity", label: "Short Quantity", type: "number", readOnly: true },
        { name: "excessQuantity", label: "Excess Quantity", type: "number", readOnly: true },
        { name: "rejectedQuantity", label: "Rejected Quantity", type: "number" },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Kgs", "Pieces"] }
      ]},
      { title: "Bale / Roll Details", icon: Database, fields: [
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" },
        { name: "lotNo", label: "Lot No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" }
      ]},
      { title: "Quality Details", icon: CheckSquare, fields: [
        { name: "fabricCondition", label: "Fabric Condition", type: "text" },
        { name: "defectStatus", label: "Defect Status", type: "text" },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "QC Approved", "Rejected"] },
        { name: "inspectionResult", label: "Inspection Result", type: "text" }
      ]},
      { title: "Delivery Details", icon: Truck, fields: [
        { name: "dispatchDate", label: "Dispatch Date", type: "date" },
        { name: "receivedDate", label: "Received Date", type: "date" },
        { name: "delayDays", label: "Delay Days", type: "number", readOnly: true }
      ]},
      { title: "Approvals & Status Tracking", icon: ShieldCheck, fields: [
        { name: "receivedBy", label: "Received By", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Pending QC", "QC Approved", "Completed", "Rejected"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "inwardChallanUpload", label: "Inward Challan (Link)", type: "text" },
        { name: "fabricImageUpload", label: "Fabric Image (Link)", type: "text" },
        { name: "qcReportUpload", label: "QC Report (Link)", type: "text" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "vendorRemarks", label: "Vendor Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    ot_checking: [
      { title: "Checking Information", icon: FileText, fields: [
        { name: "otCheckingNo", label: "Table Checking No *", type: "text", required: true },
        { name: "checkingDate", label: "Checking Date *", type: "date", required: true },
        { name: "shift", label: "Shift *", type: "select", options: SHIFTS },
        { name: "checkerName", label: "Checker Name *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Reference & Fabric Details", icon: FolderKanban, fields: [
        { name: "vendorInwardRef", label: "Vendor Inward No *", type: "text", required: true },
        { name: "rollNo", label: "Roll No *", type: "text", required: true },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" }
      ]},
      { title: "Inspection Quantity & Defects", icon: AlertTriangle, fields: [
        { name: "rollLength", label: "Roll Length (Mtr) *", type: "number", required: true },
        { name: "checkedQuantity", label: "Checked Qty (Mtr) *", type: "number", required: true },
        { name: "passedQuantity", label: "Passed Qty (Mtr)", type: "number", readOnly: true },
        { name: "rejectedQuantity", label: "Rejected Qty (Mtr) *", type: "number", required: true },
        { name: "holeDefects", label: "Hole Defects", type: "number" },
        { name: "stainDefects", label: "Stain Defects", type: "number" },
        { name: "weavingDefects", label: "Weaving Defects", type: "number" },
        { name: "yarnDefects", label: "Yarn Defects", type: "number" },
        { name: "oilMarks", label: "Oil Marks", type: "number" },
        { name: "shadeVariation", label: "Shade Variation", type: "checkbox" }
      ]},
      { title: "Quality & Machine Details", icon: CheckSquare, fields: [
        { name: "gsmCheck", label: "GSM Check", type: "checkbox" },
        { name: "widthCheck", label: "Width Check", type: "checkbox" },
        { name: "shrinkageCheck", label: "Shrinkage Check", type: "checkbox" },
        { name: "handFeelCheck", label: "Hand Feel Check", type: "select", options: ["Normal", "Soft", "Medium", "Stiff"] },
        { name: "tableNo", label: "Table No", type: "text" },
        { name: "lightCondition", label: "Light Condition", type: "select", options: ["Good", "Dimm", "Poor"] },
        { name: "machineStatus", label: "Machine Status", type: "select", options: ["Running", "Maintenance", "Stop"] }
      ]},
      { title: "QC & Approvals", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Checked", "Approved", "Rejected", "Recheck"] },
        { name: "defectPoints", label: "Defect Points", type: "number" },
        { name: "inspectionResult", label: "Inspection Result", type: "text" },
        { name: "recheckRequired", label: "Recheck Required", type: "checkbox" },
        { name: "checkedBy", label: "Checked By", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By", type: "select", options: EMPLOYEES }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "fabricImageUpload", label: "Fabric Image (Link)", type: "text" },
        { name: "qcReportUpload", label: "QC Report (Link)", type: "text" },
        { name: "inspectionSheetUpload", label: "Inspection Sheet (Link)", type: "text" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "defectNotes", label: "Defect Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    cloth_mending: [
      { title: "Mending Information", icon: FileText, fields: [
        { name: "mendingEntryNo", label: "Mending Entry No *", type: "text", required: true },
        { name: "mendingDate", label: "Mending Date *", type: "date", required: true },
        { name: "shift", label: "Shift *", type: "select", options: SHIFTS },
        { name: "operatorName", label: "Operator Name *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "tableCheckingRef", label: "Table Checking No *", type: "text", required: true },
        { name: "rollNo", label: "Roll No *", type: "text", required: true },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" }
      ]},
      { title: "Fabric & Defect Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "defectType", label: "Defect Type", type: "select", options: ["Weaving Defect", "Hole", "Stain", "Shade Variation", "Oil Marks"] },
        { name: "defectPosition", label: "Defect Position", type: "text" },
        { name: "defectCount", label: "Defect Count", type: "number" },
        { name: "severityLevel", label: "Severity Level", type: "select", options: ["Minor", "Major", "Critical"] }
      ]},
      { title: "Mending Process", icon: Settings, fields: [
        { name: "mendingType", label: "Mending Type", type: "select", options: ["Hand Mending", "Weaving Repair", "Machine Mending"] },
        { name: "repairMethod", label: "Repair Method", type: "text" },
        { name: "repairedQuantity", label: "Repaired Qty (Mtr)", type: "number" },
        { name: "pendingQuantity", label: "Pending Qty (Mtr)", type: "number", readOnly: true },
        { name: "totalRollLength", label: "Total Roll Length (Mtr) *", type: "number", required: true },
        { name: "mendableQuantity", label: "Mendable Qty (Mtr) *", type: "number", required: true },
        { name: "rejectedQuantity", label: "Rejected Quantity (Mtr)", type: "number" }
      ]},
      { title: "QC & Approvals", icon: ShieldCheck, fields: [
        { name: "repairQualityStatus", label: "Repair Quality Status", type: "select", options: ["Ok", "Needs Re-mending", "Rejected"] },
        { name: "recheckStatus", label: "Recheck Status", type: "select", options: ["Pending", "Passed", "Failed"] },
        { name: "qcApproval", label: "QC Approved", type: "checkbox" },
        { name: "mendedBy", label: "Mended By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Pending", "Under Repair", "Completed", "Rejected"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "beforeRepairImage", label: "Before Repair Image (Link)", type: "text" },
        { name: "afterRepairImage", label: "After Repair Image (Link)", type: "text" },
        { name: "qcReportUpload", label: "QC Report (Link)", type: "text" },
        { name: "repairNotes", label: "Repair Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    cloth_packing: [
      { title: "Packing Information", icon: FileText, fields: [
        { name: "packingEntryNo", label: "Packing Entry No *", type: "text", required: true },
        { name: "packingDate", label: "Packing Date *", type: "date", required: true },
        { name: "packingType", label: "Packing Type *", type: "select", options: ["Roll Packing", "Bale Packing"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" }
      ]},
      { title: "Fabric & Quantity details", icon: Scale, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "rollQuantity", label: "Roll Quantity *", type: "number", required: true },
        { name: "baleQuantity", label: "Bale Quantity", type: "number" },
        { name: "packedQuantity", label: "Packed Quantity *", type: "number", required: true },
        { name: "balanceQuantity", label: "Balance Quantity", type: "number", readOnly: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Kgs", "Pieces"] }
      ]},
      { title: "Packing Parameters", icon: ShoppingBag, fields: [
        { name: "packingMethod", label: "Packing Method", type: "select", options: ["Plastic Wrap", "Gunny Packing", "Box Packing"] },
        { name: "packingMaterial", label: "Packing Material", type: "text" },
        { name: "packingWeight", label: "Packing Weight (Kg)", type: "number" },
        { name: "netWeight", label: "Net Weight (Kg)", type: "number" },
        { name: "grossWeight", label: "Gross Weight (Kg)", type: "number" },
        { name: "barcodeNo", label: "Barcode No", type: "text" },
        { name: "tagNo", label: "Tag No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "lotNo", label: "Lot No", type: "text" }
      ]},
      { title: "Dispatch & QC", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "finalInspectionResult", label: "Final Inspection", type: "text" },
        { name: "packingQualityStatus", label: "Packing Quality", type: "select", options: ["Good", "Hold", "Damaged"] },
        { name: "readyForDispatch", label: "Ready For Dispatch", type: "checkbox" },
        { name: "dispatchLocation", label: "Dispatch Location", type: "text" },
        { name: "transportPreparation", label: "Transport Prep", type: "select", options: ["Pending", "Arranged", "Dispatched"] },
        { name: "packedBy", label: "Packed By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Pending", "Packed", "Ready Dispatch", "Completed"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "packingImageUpload", label: "Packing Image (Link)", type: "text" },
        { name: "labelUpload", label: "Label Upload (Link)", type: "text" },
        { name: "qcReportUpload", label: "QC Report (Link)", type: "text" },
        { name: "packingNotes", label: "Packing Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    cloth_delivery: [
      { title: "Delivery Information", icon: FileText, fields: [
        { name: "deliveryNo", label: "Delivery No *", type: "text", required: true },
        { name: "deliveryDate", label: "Delivery Date *", type: "date", required: true },
        { name: "deliveryType", label: "Delivery Type *", type: "select", options: ["Processing", "Customer", "Internal Transfer"] }
      ]},
      { title: "Party Details", icon: Factory, fields: [
        { name: "partyName", label: "Customer / Vendor *", type: "text", required: true },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "deliveryAddress", label: "Delivery Address", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "packingEntryNo", label: "Packing Entry No", type: "text" },
        { name: "challanNo", label: "Challan No *", type: "text", required: true }
      ]},
      { title: "Fabric & Quantities", icon: Scale, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "deliveredQuantity", label: "Delivered Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "balanceQuantity", label: "Balance Quantity", type: "number", readOnly: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Kgs", "Pieces"] }
      ]},
      { title: "Transport & Quality Details", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "driverName", label: "Driver Name", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" },
        { name: "dispatchTime", label: "Dispatch Time", type: "time" },
        { name: "expectedDeliveryDate", label: "Expected Delivery Date", type: "date" },
        { name: "deliveryStatus", label: "Delivery Status", type: "select", options: ["Dispatching", "In Transit", "Delivered"] },
        { name: "dispatchQcStatus", label: "Dispatch QC Status", type: "select", options: ["Passed", "Failed", "Pending"] },
        { name: "finalInspectionStatus", label: "Final Inspection Status", type: "select", options: ["Passed", "Failed", "Pending"] }
      ]},
      { title: "Approvals & Status Tracking", icon: ShieldCheck, fields: [
        { name: "deliveredBy", label: "Delivered By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Pending", "Dispatched", "In Transit", "Delivered"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "deliveryChallanUpload", label: "Delivery Challan (Link)", type: "text" },
        { name: "transportReceiptUpload", label: "Transport Receipt (Link)", type: "text" },
        { name: "dispatchImageUpload", label: "Dispatch Image (Link)", type: "text" },
        { name: "deliveryNotes", label: "Delivery Notes", type: "textarea" },
        { name: "transportRemarks", label: "Transport Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    bale_delivery: [
      { title: "Bale Delivery Information", icon: FileText, fields: [
        { name: "baleDeliveryNo", label: "Bale Delivery No *", type: "text", required: true },
        { name: "deliveryDate", label: "Delivery Date *", type: "date", required: true },
        { name: "dispatchType", label: "Dispatch Type *", type: "select", options: ["Processing", "Customer", "Internal Transfer"] }
      ]},
      { title: "Party Details", icon: Factory, fields: [
        { name: "partyName", label: "Customer / Vendor *", type: "text", required: true },
        { name: "deliveryLocation", label: "Delivery Location", type: "text" },
        { name: "contactPerson", label: "Contact Person", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "baleNo", label: "Bale No *", type: "text", required: true },
        { name: "packingEntryNo", label: "Packing Entry No", type: "text" }
      ]},
      { title: "Bale & Fabric Details", icon: Scissors, fields: [
        { name: "baleWeight", label: "Bale Weight (Kg) *", type: "number", required: true },
        { name: "baleQuantity", label: "Bale Quantity", type: "number" },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "netWeight", label: "Net Weight (Kg)", type: "number" },
        { name: "grossWeight", label: "Gross Weight (Kg)", type: "number" },
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantities & Transport", icon: Truck, fields: [
        { name: "deliveredQuantity", label: "Delivered Quantity *", type: "number", required: true },
        { name: "pendingQuantity", label: "Pending Quantity", type: "number", readOnly: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Kgs", "Meters", "Pieces"] },
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "driverName", label: "Driver Name", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" }
      ]},
      { title: "Dispatch Tracking & Quality", icon: CheckSquare, fields: [
        { name: "dispatchDate", label: "Dispatch Date", type: "date" },
        { name: "transitStatus", label: "Transit Status", type: "select", options: ["Loading", "In Transit", "Delivered"] },
        { name: "deliveryStatus", label: "Delivery Status", type: "select", options: ["Dispatching", "In Transit", "Delivered"] },
        { name: "baleCondition", label: "Bale Condition", type: "select", options: ["Good", "Minor Damage", "Torn"] },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Passed", "Failed", "Pending"] },
        { name: "damageStatus", label: "Damage Status", type: "select", options: ["No Damage", "Minor", "Major"] }
      ]},
      { title: "Approvals & Tracking Status", icon: ShieldCheck, fields: [
        { name: "dispatchBy", label: "Dispatch By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Pending", "Dispatched", "Delivered", "Returned"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "baleImageUpload", label: "Bale Image (Link)", type: "text" },
        { name: "deliveryChallanUpload", label: "Delivery Challan (Link)", type: "text" },
        { name: "transportReceiptUpload", label: "Transport Receipt (Link)", type: "text" },
        { name: "deliveryNotes", label: "Delivery Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    bale_amd: [
      { title: "Amendment Information", icon: FileText, fields: [
        { name: "baleAmdNo", label: "Bale AMD No *", type: "text", required: true },
        { name: "amendmentDate", label: "Amendment Date *", type: "date", required: true },
        { name: "amendmentType", label: "Amendment Type *", type: "select", options: ["Weight Correction", "Quantity Correction", "Bale Change", "Roll Adjustment"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "baleNo", label: "Bale No *", type: "text", required: true },
        { name: "packingEntryNo", label: "Packing Entry No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" }
      ]},
      { title: "Existing Bale Details", icon: Scale, fields: [
        { name: "oldBaleWeight", label: "Old Bale Weight", type: "number" },
        { name: "oldRollCount", label: "Old Roll Count", type: "number" },
        { name: "oldQuantity", label: "Old Quantity", type: "number" },
        { name: "oldLotNo", label: "Old Lot No", type: "text" }
      ]},
      { title: "Revised Bale Details", icon: Scale, fields: [
        { name: "newBaleWeight", label: "New Bale Weight", type: "number" },
        { name: "newRollCount", label: "New Roll Count", type: "number" },
        { name: "newQuantity", label: "New Quantity", type: "number" },
        { name: "newLotNo", label: "New Lot No", type: "text" }
      ]},
      { title: "Fabric Details & Reason", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "amendmentReason", label: "Amendment Reason", type: "select", options: ["QC Correction", "Packing Error", "Dispatch Adjustment", "System Correction"] }
      ]},
      { title: "QC & Approvals", icon: ShieldCheck, fields: [
        { name: "qcVerificationRequired", label: "QC Verification Required", type: "checkbox" },
        { name: "recheckStatus", label: "Recheck Status", type: "select", options: ["Pending", "Passed", "Failed"] },
        { name: "damageStatus", label: "Damage Status", type: "select", options: ["No Damage", "Minor", "Major"] },
        { name: "requestedBy", label: "Requested By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Draft", "Pending Approval", "Approved", "Rejected"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "baleImageUpload", label: "Bale Image (Link)", type: "text" },
        { name: "amendmentSheetUpload", label: "Amendment Sheet (Link)", type: "text" },
        { name: "qcReportUpload", label: "QC Report (Link)", type: "text" },
        { name: "amendmentNotes", label: "Amendment Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    lot_amd: [
      { title: "Amendment Information", icon: FileText, fields: [
        { name: "lotAmdNo", label: "LOT AMD No *", type: "text", required: true },
        { name: "amendmentDate", label: "Amendment Date *", type: "date", required: true },
        { name: "amendmentType", label: "Amendment Type *", type: "select", options: ["Lot Merge", "Lot Split", "Lot Correction", "Batch Adjustment"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "lotNo", label: "Lot No *", type: "text", required: true },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" }
      ]},
      { title: "Existing & Revised LOT Details", icon: Scale, fields: [
        { name: "oldLotQuantity", label: "Old Lot Qty", type: "number" },
        { name: "oldRollCount", label: "Old Roll Count", type: "number" },
        { name: "oldBaleCount", label: "Old Bale Count", type: "number" },
        { name: "oldBatchNo", label: "Old Batch No", type: "text" },
        { name: "newLotQuantity", label: "New Lot Qty", type: "number" },
        { name: "newRollCount", label: "New Roll Count", type: "number" },
        { name: "newBaleCount", label: "New Bale Count", type: "number" },
        { name: "newBatchNo", label: "New Batch No", type: "text" }
      ]},
      { title: "Fabric Details & Quantities", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "previousQuantity", label: "Previous Quantity", type: "number" },
        { name: "revisedQuantity", label: "Revised Quantity", type: "number" },
        { name: "differenceQuantity", label: "Difference Quantity", type: "number", readOnly: true },
        { name: "amendmentReason", label: "Amendment Reason", type: "select", options: ["Production Adjustment", "QC Correction", "Dispatch Change", "System Update"] }
      ]},
      { title: "Approvals & Remarks", icon: ShieldCheck, fields: [
        { name: "requestedBy", label: "Requested By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Pending", "Under Review", "Approved", "Rejected"] },
        { name: "lotSheetUpload", label: "Lot Sheet (Link)", type: "text" },
        { name: "qcReportUpload", label: "QC Report (Link)", type: "text" },
        { name: "supportingDocUpload", label: "Supporting Doc (Link)", type: "text" },
        { name: "amendmentNotes", label: "Amendment Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    goods_release: [
      { title: "Release Information", icon: FileText, fields: [
        { name: "releaseAdviceNo", label: "Release Advice No *", type: "text", required: true },
        { name: "releaseDate", label: "Release Date *", type: "date", required: true },
        { name: "releaseType", label: "Release Type *", type: "select", options: ["Processing", "Sales", "Internal Transfer"] }
      ]},
      { title: "Party Details & Reference", icon: Factory, fields: [
        { name: "partyName", label: "Customer/Vendor Name *", type: "text", required: true },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "deliveryLocation", label: "Delivery Location", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "deliveryNo", label: "Delivery No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" }
      ]},
      { title: "Fabric & Quantities", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "approvedQuantity", label: "Approved Quantity", type: "number" },
        { name: "releasedQuantity", label: "Released Quantity", type: "number" },
        { name: "balanceQuantity", label: "Balance Quantity", type: "number", readOnly: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" }
      ]},
      { title: "Stock & Dispatch Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "lotNo", label: "Lot No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" },
        { name: "dispatchDate", label: "Dispatch Date", type: "date" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "transportName", label: "Transport Name", type: "text" }
      ]},
      { title: "QC & Approvals", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "releaseQcApproval", label: "Release QC Approval", type: "checkbox" },
        { name: "inspectionStatus", label: "Inspection Status", type: "select", options: ["Pending", "Passed", "Failed"] },
        { name: "requestedBy", label: "Requested By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Pending", "Approved", "Released", "Closed"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "releaseAdviceUpload", label: "Release Advice (Link)", type: "text" },
        { name: "qcReportUpload", label: "QC Report (Link)", type: "text" },
        { name: "deliveryDocUpload", label: "Delivery Doc (Link)", type: "text" },
        { name: "dispatchNotes", label: "Dispatch Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    gry_invoice: [
      { title: "Invoice & Customer Details", icon: FileText, fields: [
        { name: "invoiceNo", label: "Invoice No *", type: "text", required: true },
        { name: "invoiceDate", label: "Invoice Date *", type: "date", required: true },
        { name: "invoiceType", label: "Invoice Type *", type: "select", options: ["Local", "Export", "Sample"] },
        { name: "partyName", label: "Customer Name *", type: "text", required: true },
        { name: "gstNo", label: "GST No", type: "text" },
        { name: "billingAddress", label: "Billing Address", type: "text" },
        { name: "shippingAddress", label: "Shipping Address", type: "text" },
        { name: "contactPerson", label: "Contact Person", type: "text" }
      ]},
      { title: "Reference & Fabric Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "deliveryNo", label: "Delivery No", type: "text" },
        { name: "ewayBillNo", label: "Eway Bill No", type: "text" },
        { name: "poNo", label: "PO No", type: "text" },
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantities & Commercials", icon: CreditCard, fields: [
        { name: "invoiceQuantity", label: "Invoice Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Kgs", "Pieces"] },
        { name: "rate", label: "Rate *", type: "number", required: true },
        { name: "discount", label: "Discount %", type: "number" },
        { name: "taxPercent", label: "Tax %", type: "number" },
        { name: "gstAmount", label: "GST Amount", type: "number", readOnly: true },
        { name: "freightCharges", label: "Freight Charges", type: "number" },
        { name: "netAmount", label: "Net Amount", type: "number", readOnly: true },
        { name: "paymentTerms", label: "Payment Terms", type: "select", options: ["30 Days", "60 Days", "Advance", "COD"] },
        { name: "dueDate", label: "Due Date", type: "date" },
        { name: "advanceAmount", label: "Advance Amount", type: "number" },
        { name: "balanceAmount", label: "Balance Amount", type: "number", readOnly: true }
      ]},
      { title: "Transport & Approvals", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" },
        { name: "preparedBy", label: "Prepared By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Draft", "Approved", "Posted", "Cancelled"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "invoicePdfUpload", label: "Invoice PDF (Link)", type: "text" },
        { name: "deliveryChallanUpload", label: "Delivery Challan (Link)", type: "text" },
        { name: "transportReceiptUpload", label: "Transport Receipt (Link)", type: "text" },
        { name: "accountsNotes", label: "Accounts Notes", type: "textarea" },
        { name: "customerNotes", label: "Customer Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    eway_bill: [
      { title: "Eway Bill Information", icon: FileText, fields: [
        { name: "ewayBillNo", label: "Eway Bill No *", type: "text", required: true },
        { name: "ewayBillDate", label: "Eway Bill Date *", type: "date", required: true },
        { name: "validUpto", label: "Valid Upto", type: "date" }
      ]},
      { title: "Customer & Reference Details", icon: Factory, fields: [
        { name: "partyName", label: "Customer Name *", type: "text", required: true },
        { name: "gstNo", label: "GST No", type: "text" },
        { name: "deliveryAddress", label: "Delivery Address", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "deliveryNo", label: "Delivery No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" }
      ]},
      { title: "Fabric & Quantity Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "deliveredQuantity", label: "Delivered Qty *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "invoiceValue", label: "Invoice Value", type: "number" }
      ]},
      { title: "Transport & Taxes", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "driverName", label: "Driver Name", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" },
        { name: "distanceKm", label: "Distance (KM)", type: "number" },
        { name: "hsnCode", label: "HSN Code", type: "text" },
        { name: "gstPercent", label: "GST %", type: "number" },
        { name: "taxableAmount", label: "Taxable Amount", type: "number" },
        { name: "cgst", label: "CGST", type: "number", readOnly: true },
        { name: "sgst", label: "SGST", type: "number", readOnly: true },
        { name: "igst", label: "IGST", type: "number", readOnly: true }
      ]},
      { title: "Approvals & Remarks", icon: ShieldCheck, fields: [
        { name: "generatedBy", label: "Generated By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Generated", "Active", "Expired", "Cancelled"] },
        { name: "ewayBillPdfUpload", label: "Eway Bill PDF (Link)", type: "text" },
        { name: "invoiceUpload", label: "Invoice (Link)", type: "text" },
        { name: "transportDocUpload", label: "Transport Doc (Link)", type: "text" },
        { name: "transportNotes", label: "Transport Notes", type: "textarea" },
        { name: "accountsRemarks", label: "Accounts Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    einvoice_eway: [
      { title: "E-Invoice Information", icon: FileText, fields: [
        { name: "eInvoiceNo", label: "E-Invoice No *", type: "text", required: true },
        { name: "irnNo", label: "IRN No", type: "text" },
        { name: "eInvoiceDate", label: "E-Invoice Date *", type: "date", required: true },
        { name: "ackNo", label: "Ack No", type: "text" },
        { name: "ackDate", label: "Ack Date", type: "date" }
      ]},
      { title: "Customer & Invoice Details", icon: Factory, fields: [
        { name: "partyName", label: "Customer Name *", type: "text", required: true },
        { name: "gstNo", label: "GST No", type: "text" },
        { name: "billingAddress", label: "Billing Address", type: "text" },
        { name: "shippingAddress", label: "Shipping Address", type: "text" },
        { name: "salesInvoiceNo", label: "Sales Invoice No", type: "text" },
        { name: "invoiceDate", label: "Invoice Date", type: "date" },
        { name: "invoiceValue", label: "Invoice Value", type: "number" },
        { name: "currency", label: "Currency", type: "select", options: ["INR", "USD", "EUR"] }
      ]},
      { title: "Fabric & Quantity Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS, required: true },
        { name: "hsnCode", label: "HSN Code", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "uom", label: "UOM", type: "select", options: ["Meters", "Kgs", "Pieces"] }
      ]},
      { title: "Taxes & Transport Details", icon: CreditCard, fields: [
        { name: "taxableAmount", label: "Taxable Amount", type: "number" },
        { name: "gstPercent", label: "GST %", type: "number" },
        { name: "cgst", label: "CGST", type: "number", readOnly: true },
        { name: "sgst", label: "SGST", type: "number", readOnly: true },
        { name: "igst", label: "IGST", type: "number", readOnly: true },
        { name: "totalTaxAmount", label: "Total Tax Amount", type: "number", readOnly: true },
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" },
        { name: "distance", label: "Distance", type: "number" }
      ]},
      { title: "Eway Bill & Approvals", icon: Globe, fields: [
        { name: "ewayBillNo", label: "Eway Bill No", type: "text" },
        { name: "ewayBillDate", label: "Eway Bill Date", type: "date" },
        { name: "validUpto", label: "Valid Upto", type: "date" },
        { name: "generatedBy", label: "Generated By", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By", type: "select", options: EMPLOYEES },
        { name: "statusTracking", label: "Status Tracking", type: "select", options: ["Draft", "Generated", "Cancelled", "Filed"] }
      ]},
      { title: "Attachments & Remarks", icon: AlertCircle, fields: [
        { name: "eInvoicePdfUpload", label: "E-Invoice PDF (Link)", type: "text" },
        { name: "qrCodeUpload", label: "QR Code Upload (Link)", type: "text" },
        { name: "gstDocUpload", label: "GST Document (Link)", type: "text" },
        { name: "gstNotes", label: "GST Notes", type: "textarea" },
        { name: "accountsRemarks", label: "Accounts Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ]
  };

  const handleOpenPage = (p) => {
    if (p.isLink) {
      navigate(p.route);
    } else {
      setActivePage(p.key);
      setIsFormOpen(false);
    }
  };

  const handleCreateNew = () => {
    const dateToday = new Date().toISOString().substring(0, 10);
    let initFields = { date: dateToday, status: 'Active' };

    // Fill defaults based on schema field names
    const schema = FORM_SCHEMAS[activePage] || [];
    schema.forEach(card => {
      card.fields.forEach(f => {
        if (f.name.toLowerCase().includes('date')) {
          initFields[f.name] = dateToday;
        } else if (f.type === 'select' && f.options && f.options.length > 0) {
          initFields[f.name] = f.options[0];
        } else if (f.type === 'number') {
          initFields[f.name] = '';
        } else if (f.type === 'checkbox') {
          initFields[f.name] = false;
        } else {
          initFields[f.name] = '';
        }
      });
    });

    setFields(initFields);
    setSelectedRecord(null);
    setCurrentFormId('NEW RECORD');
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedRecord(row);
    const formIdVal = row.vendorInwardNo || row.otCheckingNo || row.mendingEntryNo || 
                      row.packingEntryNo || row.deliveryNo || row.baleDeliveryNo || 
                      row.baleAmdNo || row.lotAmdNo || row.releaseAdviceNo || 
                      row.invoiceNo || row.ewayBillNo || row.eInvoiceNo || row.id;
    setCurrentFormId(formIdVal);
    setFields({ ...row });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const manualTxnNo = fields.vendorInwardNo || fields.otCheckingNo || fields.mendingEntryNo || 
                        fields.packingEntryNo || fields.deliveryNo || fields.baleDeliveryNo || 
                        fields.baleAmdNo || fields.lotAmdNo || fields.releaseAdviceNo || 
                        fields.invoiceNo || fields.ewayBillNo || fields.eInvoiceNo || fields.voucherRefNo;

    const payload = {
      module_type: activePage,
      date: fields.date || fields.inwardDate || fields.checkingDate || fields.mendingDate || 
            fields.packingDate || fields.deliveryDate || fields.receivedDate || fields.amendmentDate ||
            fields.releaseDate || fields.invoiceDate || fields.ewayBillDate || fields.eInvoiceDate || new Date().toISOString().substring(0, 10),
      buyer_name: fields.vendorName || fields.checkerName || fields.operatorName || fields.packedBy || 
                  fields.partyName || fields.deliveredBy || fields.dispatchBy || "Internal",
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
      alert("Greige production record processed and saved!");
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
    if (confirm("Are you sure you want to remove this greige transaction entry?")) {
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

  const activeColor = PAGES_METADATA[activePage]?.color || '#2563eb';

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      {!isFormOpen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={24} color="#2563eb" /> {activeSection}
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
                    {PAGES_METADATA[activePage].label} Records Audit
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure raw fabric ledgers and dispatch logs</span>
                </div>
                <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: activeColor, borderColor: activeColor }}>
                  <Plus size={16} /> Add Greige Entry
                </button>
              </div>

              {/* DYNAMIC LIST TABLE RENDERER */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    {activePage === 'vendor_inward' && (
                      <tr>
                        <th>INWARD NO</th><th>DATE</th><th>INWARD TYPE</th><th>VENDOR NAME</th><th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>RECEIVED QTY</th><th>QC STATUS</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'ot_checking' && (
                      <tr>
                        <th>CHECKING NO</th><th>DATE</th><th>SHIFT</th><th>CHECKER NAME</th><th>INWARD REF</th>
                        <th style={{ textAlign: 'right' }}>CHECKED QTY</th><th>QC STATUS</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'cloth_mending' && (
                      <tr>
                        <th>MENDING NO</th><th>DATE</th><th>SHIFT</th><th>OPERATOR NAME</th><th>DEFECT TYPE</th>
                        <th style={{ textAlign: 'right' }}>REPAIRED QTY</th><th>QUALITY</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'cloth_packing' && (
                      <tr>
                        <th>PACKING NO</th><th>DATE</th><th>PACKING TYPE</th><th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>PACKED QTY</th><th>BARCODE</th><th>QC STATUS</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'cloth_delivery' && (
                      <tr>
                        <th>DELIVERY NO</th><th>DATE</th><th>DELIVERY TYPE</th><th>CUSTOMER/VENDOR</th><th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>DELIVERED QTY</th><th>VEHICLE NO</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'bale_delivery' && (
                      <tr>
                        <th>BALE DELIVERY NO</th><th>DATE</th><th>DISPATCH TYPE</th><th>CUSTOMER/VENDOR</th>
                        <th>BALE WEIGHT</th><th style={{ textAlign: 'right' }}>DELIVERED QTY</th><th>VEHICLE NO</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'bale_amd' && (
                      <tr>
                        <th>AMD NO</th><th>DATE</th><th>TYPE</th><th>BALE NO</th><th>OLD WT</th><th>NEW WT</th><th>REASON</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'lot_amd' && (
                      <tr>
                        <th>AMD NO</th><th>DATE</th><th>TYPE</th><th>LOT NO</th><th>OLD QTY</th><th>NEW QTY</th><th>DIFF</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'goods_release' && (
                      <tr>
                        <th>RELEASE NO</th><th>DATE</th><th>TYPE</th><th>PARTY NAME</th><th>DESIGN NO</th><th>RELEASED QTY</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'gry_invoice' && (
                      <tr>
                        <th>INVOICE NO</th><th>DATE</th><th>TYPE</th><th>CUSTOMER NAME</th><th>NET AMOUNT</th><th>DUE DATE</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'eway_bill' && (
                      <tr>
                        <th>EWAY BILL NO</th><th>DATE</th><th>VALID UPTO</th><th>CUSTOMER NAME</th><th>INVOICE VALUE</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                    {activePage === 'einvoice_eway' && (
                      <tr>
                        <th>E-INVOICE NO</th><th>IRN NO</th><th>DATE</th><th>CUSTOMER NAME</th><th>TOTAL TAX</th><th>STATUS</th><th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {/* Render corresponding rows */}
                    {activePage === 'vendor_inward' && vendorInwards.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.vendorInwardNo || row.id}</td>
                        <td>{row.inwardDate || row.date}</td>
                        <td>{row.inwardType}</td>
                        <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                        <td>{row.designNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.receivedQuantity} {row.uom}</td>
                        <td><span className={`badge ${row.qcStatus === 'QC Approved' ? 'badge-active' : 'badge-inactive'}`}>{row.qcStatus || 'Pending'}</span></td>
                        <td><span className="badge badge-active">{row.statusTracking || row.status || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'ot_checking' && greigeCheckings.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.otCheckingNo || row.id}</td>
                        <td>{row.checkingDate || row.date}</td>
                        <td>{row.shift}</td>
                        <td>{row.checkerName}</td>
                        <td>{row.vendorInwardRef}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.checkedQuantity} Mtr</td>
                        <td><span className={`badge ${row.qcStatus === 'Approved' ? 'badge-active' : 'badge-inactive'}`}>{row.qcStatus || 'Pending'}</span></td>
                        <td><span className="badge badge-active">{row.statusTracking || row.status || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'cloth_mending' && clothMendings.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.mendingEntryNo || row.id}</td>
                        <td>{row.mendingDate || row.date}</td>
                        <td>{row.shift}</td>
                        <td>{row.operatorName}</td>
                        <td>{row.defectType}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.repairedQuantity} Mtr</td>
                        <td><span className={`badge ${row.repairQualityStatus === 'Ok' ? 'badge-active' : 'badge-inactive'}`}>{row.repairQualityStatus || 'Pending'}</span></td>
                        <td><span className="badge badge-active">{row.statusTracking || row.status || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'cloth_packing' && greigePackings.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.packingEntryNo || row.id}</td>
                        <td>{row.packingDate || row.date}</td>
                        <td>{row.packingType}</td>
                        <td>{row.designNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.packedQuantity} {row.uom}</td>
                        <td>{row.barcodeNo}</td>
                        <td><span className={`badge ${row.qcStatus === 'Approved' ? 'badge-active' : 'badge-inactive'}`}>{row.qcStatus || 'Pending'}</span></td>
                        <td><span className="badge badge-active">{row.statusTracking || row.status || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'cloth_delivery' && greigeDeliveries.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.deliveryNo || row.id}</td>
                        <td>{row.deliveryDate || row.date}</td>
                        <td>{row.deliveryType}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td>{row.designNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.deliveredQuantity} {row.uom}</td>
                        <td>{row.vehicleNo}</td>
                        <td><span className="badge badge-active">{row.statusTracking || row.status || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'bale_delivery' && baleDeliveries.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.baleDeliveryNo || row.id}</td>
                        <td>{row.deliveryDate || row.date}</td>
                        <td>{row.dispatchType}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td>{row.baleWeight} Kg</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.deliveredQuantity} {row.uom}</td>
                        <td>{row.vehicleNo}</td>
                        <td><span className="badge badge-active">{row.statusTracking || row.status || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'bale_amd' && baleAmds.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.baleAmdNo || row.id}</td>
                        <td>{row.amendmentDate || row.date}</td>
                        <td>{row.amendmentType}</td>
                        <td>{row.baleNo}</td>
                        <td>{row.oldBaleWeight} Kg</td>
                        <td style={{ fontWeight: 800 }}>{row.newBaleWeight} Kg</td>
                        <td>{row.amendmentReason}</td>
                        <td><span className="badge badge-active">{row.statusTracking || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'lot_amd' && lotAmds.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.lotAmdNo || row.id}</td>
                        <td>{row.amendmentDate || row.date}</td>
                        <td>{row.amendmentType}</td>
                        <td>{row.lotNo}</td>
                        <td>{row.oldLotQuantity}</td>
                        <td>{row.newLotQuantity}</td>
                        <td style={{ fontWeight: 800, color: '#f59e0b' }}>{row.differenceQuantity}</td>
                        <td><span className="badge badge-active">{row.statusTracking || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'goods_release' && goodsReleases.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.releaseAdviceNo || row.id}</td>
                        <td>{row.releaseDate || row.date}</td>
                        <td>{row.releaseType}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td>{row.designNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.releasedQuantity} Mtr</td>
                        <td><span className="badge badge-active">{row.statusTracking || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'gry_invoice' && greigeInvoices.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.invoiceNo || row.id}</td>
                        <td>{row.invoiceDate || row.date}</td>
                        <td>{row.invoiceType}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 800 }}>₹{row.netAmount}</td>
                        <td>{row.dueDate}</td>
                        <td><span className="badge badge-active">{row.statusTracking || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'eway_bill' && ewayBills.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.ewayBillNo || row.id}</td>
                        <td>{row.ewayBillDate || row.date}</td>
                        <td>{row.validUpto}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{row.invoiceValue}</td>
                        <td><span className="badge badge-active">{row.statusTracking || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activePage === 'einvoice_eway' && einvoiceEways.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.eInvoiceNo || row.id}</td>
                        <td>{row.irnNo}</td>
                        <td>{row.eInvoiceDate || row.date}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{row.totalTaxAmount}</td>
                        <td><span className="badge badge-active">{row.statusTracking || 'Pending'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Empty State */}
                    {getSubModuleCount(activePage) === 0 && (
                      <tr>
                        <td colSpan="15" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure raw material traceability and quality tracking</span>
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

              {/* DYNAMIC CARD-GROUPED FORM RENDERER */}
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(FORM_SCHEMAS[activePage] || []).map((card, cIndex) => {
                  const IconComp = card.icon;
                  return (
                    <div 
                      key={cIndex}
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '16px' 
                      }}
                    >
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: activeColor, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconComp size={16} /> {card.title}
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        {card.fields.map((f, fIndex) => {
                          const isTextarea = f.type === 'textarea';
                          const isCheckbox = f.type === 'checkbox';
                          const isSelect = f.type === 'select';

                          return (
                            <div 
                              key={fIndex} 
                              className="form-group" 
                              style={{ 
                                gridColumn: isTextarea ? 'span 3' : 'span 1',
                                display: isCheckbox ? 'flex' : 'block',
                                alignItems: isCheckbox ? 'center' : 'stretch',
                                gap: isCheckbox ? '8px' : '0',
                                marginTop: isCheckbox ? '30px' : '0'
                              }}
                            >
                              {!isCheckbox && <label>{f.label}</label>}
                              
                              {isSelect ? (
                                <select 
                                  className="form-control" 
                                  name={f.name} 
                                  value={fields[f.name] || ''} 
                                  onChange={handleInputChange} 
                                  required={f.required}
                                  disabled={f.readOnly}
                                >
                                  <option value="">-- Select --</option>
                                  {(f.options || []).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : isTextarea ? (
                                <textarea 
                                  className="form-control" 
                                  rows="3" 
                                  name={f.name} 
                                  value={fields[f.name] || ''} 
                                  onChange={handleInputChange} 
                                  required={f.required}
                                  readOnly={f.readOnly}
                                  style={{ background: f.readOnly ? '#e2e8f0' : 'white' }}
                                />
                              ) : isCheckbox ? (
                                <>
                                  <input 
                                    type="checkbox" 
                                    name={f.name} 
                                    checked={fields[f.name] || false} 
                                    onChange={handleInputChange} 
                                    disabled={f.readOnly}
                                  />
                                  <label style={{ margin: 0 }}>{f.label}</label>
                                </>
                              ) : (
                                <input 
                                  type={f.type || 'text'} 
                                  className="form-control" 
                                  name={f.name} 
                                  value={fields[f.name] || ''} 
                                  onChange={handleInputChange} 
                                  required={f.required}
                                  readOnly={f.readOnly}
                                  style={{ background: f.readOnly ? '#e2e8f0' : 'white', fontWeight: f.readOnly ? 'bold' : 'normal' }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
