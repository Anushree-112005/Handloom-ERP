import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Scissors, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Layers,
  Palette, Scale, ShieldCheck, Info, FileImage, Users, Eye, Edit2
} from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import * as XLSX from 'xlsx';
import { workOrderTransactionAPI, partyAPI, designEntryAPI, finishedFabricAPI } from '../../services/api';

export default function FabricTransaction({ defaultSection = 'Fabric Checking' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getAuditNoFromDesignNo = (dNo) => {
    if (!dNo) return '';
    const match = dNo.match(/\d+/);
    return match ? `AUD-${match[0]}` : 'AUD-00001';
  };

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

  // Search Filter state
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');
  const [viewModalTransaction, setViewModalTransaction] = useState(null);

  const [partiesList, setPartiesList] = useState([]);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await partyAPI.list();
        if (res.data && res.data.length > 0) {
          setPartiesList(res.data.map(p => p.company_name));
        }
      } catch (err) {
        console.error("Failed to fetch parties in FabricTransaction", err);
      }
    };
    fetchParties();
  }, []);

  // Static lists for selections
  const BUYERS = useMemo(() => {
    return partiesList.length > 0 ? partiesList : ['Raymond Ltd', 'Vardhman Spinning', 'Reliance Retail', 'Standard Gears Ltd'];
  }, [partiesList]);
  const VENDORS = useMemo(() => {
    return partiesList.length > 0 ? partiesList : ['Sri Raja Rajeshwari Tex', 'Kalaignar Weaving Mills', 'Dinesh Processing Unit', 'Vignesh Warping & Sizing'];
  }, [partiesList]);
  const EMPLOYEES = [
    'Senthil Kumar (General Manager)', 
    'Mani Bharathi (Store Head)', 
    'Dinesh Balasamy (MD)', 
    'Murugan Swamy (Maintenance In-charge)'
  ];
  const SHIFTS = ['Morning (6AM-2PM)', 'Afternoon (2PM-10PM)', 'Night (10PM-6AM)'];
  const DESIGNS = ['DES-4091 Premium Satin', 'DES-5011 Weave Twill', 'DES-2012 Plain Voile', 'DES-8812 Indigo Chambray'];

  // =========================================================================
  // STATE STORE FOR SUB-PAGES
  // =========================================================================
  const [designs, setDesigns] = useState([]);
  const [clothCheckings, setClothCheckings] = useState([]);
  const [lotCompletions, setLotCompletions] = useState([]);
  const [clothInwards, setClothInwards] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [pcWiseDeliveries, setPcWiseDeliveries] = useState([]);
  const [m2mDeliveries, setM2mDeliveries] = useState([]);
  const [baleDeliveries, setBaleDeliveries] = useState([]);
  const [lotApprovals, setLotApprovals] = useState([]);
  const [baleAmends, setBaleAmends] = useState([]);
  const [balePackings, setBalePackings] = useState([]);
  const [plCheckings, setPlCheckings] = useState([]);
  const [goodsReleaseAdvices, setGoodsReleaseAdvices] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [vendorBills, setVendorBills] = useState([]);
  const [printingBills, setPrintingBills] = useState([]);
  const [dlDevelopmentBills, setDlDevelopmentBills] = useState([]);
  const [surplusOpening, setSurplusOpening] = useState([]);
  const [surplusReports, setSurplusReports] = useState([]);
  const [surplusDownloads, setSurplusDownloads] = useState([]);
  const [surplusReportsNew, setSurplusReportsNew] = useState([]);
  const [surplusInwards, setSurplusInwards] = useState([]);
  const [surplusDeliveries, setSurplusDeliveries] = useState([]);
  const [customerHangers, setCustomerHangers] = useState([]);
  const [finalInspections, setFinalInspections] = useState([]);
  const [dbDesigns, setDbDesigns] = useState([]);
  const [finishedFabricsList, setFinishedFabricsList] = useState([]);

  const getSubModuleCount = (key) => {
    switch (key) {
      case 'design_upload': return designs.length;
      case 'cloth_checking': return clothCheckings.length;
      case 'lot_completion': return lotCompletions.length;
      case 'cloth_inward': return clothInwards.length;
      case 'cloth_purchase_bill': return purchaseBills.length;
      case 'del_pcwise': return pcWiseDeliveries.length;
      case 'm2m_delivery': return m2mDeliveries.length;
      case 'bale_delivery': return baleDeliveries.length;
      case 'lot_approval': return lotApprovals.length;
      case 'bale_amend': return baleAmends.length;
      case 'bale_packing': return balePackings.length;
      case 'pl_checking': return plCheckings.length;
      case 'goods_release': return goodsReleaseAdvices.length;
      case 'gate_pass': return gatePasses.length;
      case 'vendor_bills': return vendorBills.length;
      case 'printing_bills': return printingBills.length;
      case 'dl_development': return dlDevelopmentBills.length;
      case 'surplus_opening': return surplusOpening.length;
      case 'surplus_report': return surplusReports.length;
      case 'surplus_download': return surplusDownloads.length;
      case 'surplus_report_new': return surplusReportsNew.length;
      case 'surplus_inward': return surplusInwards.length;
      case 'surplus_delivery': return surplusDeliveries.length;
      case 'customer_hanger': return customerHangers.length;
      case 'final_inspection': return finalInspections.length;
      default: return 0;
    }
  };

  const [fields, setFields] = useState({});

  const loadData = async () => {
    try {
      const response = await workOrderTransactionAPI.getAll();
      const allTxns = response.data;
      const mapTxn = (t) => ({ ...t.details, id: t.transaction_no, db_id: t.id, status: t.status });

      setDesigns(allTxns.filter(t => t.module_type === 'design_upload').map(mapTxn));
      setClothCheckings(allTxns.filter(t => t.module_type === 'cloth_checking').map(mapTxn));
      setLotCompletions(allTxns.filter(t => t.module_type === 'lot_completion').map(mapTxn));
      setClothInwards(allTxns.filter(t => t.module_type === 'cloth_inward').map(mapTxn));
      setPurchaseBills(allTxns.filter(t => t.module_type === 'cloth_purchase_bill').map(mapTxn));
      setPcWiseDeliveries(allTxns.filter(t => t.module_type === 'del_pcwise').map(mapTxn));
      setM2mDeliveries(allTxns.filter(t => t.module_type === 'm2m_delivery').map(mapTxn));
      setBaleDeliveries(allTxns.filter(t => t.module_type === 'bale_delivery').map(mapTxn));
      setLotApprovals(allTxns.filter(t => t.module_type === 'lot_approval').map(mapTxn));
      setBaleAmends(allTxns.filter(t => t.module_type === 'bale_amend').map(mapTxn));
      setBalePackings(allTxns.filter(t => t.module_type === 'bale_packing').map(mapTxn));
      setPlCheckings(allTxns.filter(t => t.module_type === 'pl_checking').map(mapTxn));
      setGoodsReleaseAdvices(allTxns.filter(t => t.module_type === 'goods_release').map(mapTxn));
      setGatePasses(allTxns.filter(t => t.module_type === 'gate_pass').map(mapTxn));
      setVendorBills(allTxns.filter(t => t.module_type === 'vendor_bills').map(mapTxn));
      setPrintingBills(allTxns.filter(t => t.module_type === 'printing_bills').map(mapTxn));
      setDlDevelopmentBills(allTxns.filter(t => t.module_type === 'dl_development').map(mapTxn));
      setSurplusOpening(allTxns.filter(t => t.module_type === 'surplus_opening').map(mapTxn));
      setSurplusReports(allTxns.filter(t => t.module_type === 'surplus_report').map(mapTxn));
      setSurplusDownloads(allTxns.filter(t => t.module_type === 'surplus_download').map(mapTxn));
      setSurplusReportsNew(allTxns.filter(t => t.module_type === 'surplus_report_new').map(mapTxn));
      setSurplusInwards(allTxns.filter(t => t.module_type === 'surplus_inward').map(mapTxn));
      setSurplusDeliveries(allTxns.filter(t => t.module_type === 'surplus_delivery').map(mapTxn));
      setCustomerHangers(allTxns.filter(t => t.module_type === 'customer_hanger').map(mapTxn));
      const fetchedFinalInspections = allTxns.filter(t => t.module_type === 'final_inspection').map(mapTxn);
      setFinalInspections(fetchedFinalInspections);

      try {
        const dRes = await designEntryAPI.list();
        if (dRes.data) setDbDesigns(dRes.data);
      } catch (deErr) {
        console.error("Failed to load design entries in FabricTransaction", deErr);
      }

      try {
        const fRes = await finishedFabricAPI.list();
        if (fRes.data) setFinishedFabricsList(fRes.data);
      } catch (ffErr) {
        console.error("Failed to load finished fabrics in FabricTransaction", ffErr);
      }
    } catch (err) {
      console.error("Failed to load fabric transactions", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (activePage === 'final_inspection' && name === 'designNo' && value) {
      const design = dbDesigns.find(d => d.design_no === value);
      if (design) {
        // Look up corresponding dyed/finished fabric receipt (Dyed Fabric Receipt)
        const matchedReceipt = finishedFabricsList.find(r => r.design_no === value || r.order_no === design.ibpo_no);
        let rolls = [];
        if (matchedReceipt && matchedReceipt.items && matchedReceipt.items.length > 0) {
          rolls = matchedReceipt.items.map(item => ({
            pieceNo: item.piece_no || '',
            meters: item.meters || '0.00',
            colorCheck: 'OK',
            widthCheck: matchedReceipt.width ? `${matchedReceipt.width}"` : '59.68"',
            status: 'Approved',
            grade: 'A'
          }));
        } else {
          // fallback to empty rolls list
          rolls = [];
        }

        setFields(prev => ({
          ...prev,
          designNo: value,
          auditNo: getAuditNoFromDesignNo(value),
          buyerName: design.buyer_name || prev.buyerName,
          buyerOrderNo: design.ibpo_no || prev.buyerOrderNo,
          rolls: rolls
        }));
        return;
      }
    }

    setFields(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Real-time calculations hook
  useEffect(() => {
    if (activePage === 'cloth_checking') {
      const length = parseFloat(fields.rollLength) || 0;
      const checked = parseFloat(fields.checkedQuantity) || 0;
      const rejected = parseFloat(fields.rejectedQuantity) || 0;
      const passed = Math.max(0, length - rejected);
      const balance = Math.max(0, length - checked);
      if (passed.toString() !== fields.passedQuantity || balance.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ 
          ...prev, 
          passedQuantity: passed.toString(), 
          balanceQuantity: balance.toString() 
        }));
      }
    } else if (activePage === 'lot_completion') {
      const total = parseFloat(fields.totalLotQuantity) || 0;
      const passed = parseFloat(fields.passedQuantity) || 0;
      const rejected = parseFloat(fields.rejectedQuantity) || 0;
      const balance = Math.max(0, total - passed - rejected);
      if (balance.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ 
          ...prev, 
          balanceQuantity: balance.toString() 
        }));
      }
    } else if (activePage === 'cloth_inward') {
      const ordered = parseFloat(fields.orderedQuantity) || 0;
      const received = parseFloat(fields.receivedQuantity) || 0;
      const short = ordered > received ? ordered - received : 0;
      const excess = received > ordered ? received - ordered : 0;
      let delay = 0;
      if (fields.dispatchDate && fields.receivedDate) {
        const d1 = new Date(fields.dispatchDate);
        const d2 = new Date(fields.receivedDate);
        delay = Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
      }
      if (short.toString() !== fields.shortQuantity || excess.toString() !== fields.excessQuantity || delay.toString() !== fields.delayDays) {
        setFields(prev => ({ 
          ...prev, 
          shortQuantity: short.toString(), 
          excessQuantity: excess.toString(), 
          delayDays: delay.toString() 
        }));
      }
    } else if (activePage === 'cloth_purchase_bill') {
      const qty = parseFloat(fields.purchasedQuantity) || 0;
      const rate = parseFloat(fields.purchaseRate) || 0;
      const disc = parseFloat(fields.discount) || 0;
      const gstPct = parseFloat(fields.gstPercent) || 0;
      const freight = parseFloat(fields.freightCharges) || 0;
      const other = parseFloat(fields.otherCharges) || 0;
      const advance = parseFloat(fields.advanceAmount) || 0;

      const taxable = (qty * rate) * (1 - disc / 100);
      const cgst = taxable * (gstPct / 2 / 100);
      const sgst = taxable * (gstPct / 2 / 100);
      const igst = taxable * (gstPct / 100);
      const net = taxable + (taxable * gstPct / 100) + freight + other;
      const bal = net - advance;

      if (
        taxable.toFixed(2) !== fields.taxableAmount ||
        cgst.toFixed(2) !== fields.cgst ||
        sgst.toFixed(2) !== fields.sgst ||
        igst.toFixed(2) !== fields.igst ||
        net.toFixed(2) !== fields.netAmount ||
        bal.toFixed(2) !== fields.balanceAmount
      ) {
        setFields(prev => ({ 
          ...prev, 
          taxableAmount: taxable.toFixed(2), 
          cgst: cgst.toFixed(2), 
          sgst: sgst.toFixed(2), 
          igst: igst.toFixed(2), 
          netAmount: net.toFixed(2), 
          balanceAmount: bal.toFixed(2) 
        }));
      }
    } else if (activePage === 'del_pcwise') {
      const length = parseFloat(fields.rollLength) || 0;
      const deliv = parseFloat(fields.deliveredQuantity) || 0;
      const balance = Math.max(0, length - deliv);
      if (balance.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ ...prev, balanceQuantity: balance.toString() }));
      }
    } else if (activePage === 'bale_delivery') {
      const total = parseFloat(fields.totalQuantity) || 0;
      const deliv = parseFloat(fields.deliveredQuantity) || 0;
      const pending = Math.max(0, total - deliv);
      if (pending.toString() !== fields.pendingQuantity) {
        setFields(prev => ({ ...prev, pendingQuantity: pending.toString() }));
      }
    } else if (activePage === 'lot_approval') {
      const total = parseFloat(fields.totalLotQuantity) || 0;
      const passed = parseFloat(fields.passedQuantity) || 0;
      const rejected = parseFloat(fields.rejectedQuantity) || 0;
      const balance = Math.max(0, total - passed - rejected);
      if (balance.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ ...prev, balanceQuantity: balance.toString() }));
      }
    } else if (activePage === 'bale_amend') {
      const prevQty = parseFloat(fields.previousQuantity) || 0;
      const revQty = parseFloat(fields.revisedQuantity) || 0;
      const diff = revQty - prevQty;
      if (diff.toString() !== fields.differenceQuantity) {
        setFields(prev => ({ ...prev, differenceQuantity: diff.toString() }));
      }
    } else if (activePage === 'bale_packing') {
      const total = parseFloat(fields.totalQuantity) || 0;
      const packed = parseFloat(fields.packedQuantity) || 0;
      const balance = Math.max(0, total - packed);
      if (balance.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ ...prev, balanceQuantity: balance.toString() }));
      }
    } else if (activePage === 'goods_release') {
      const approved = parseFloat(fields.approvedQuantity) || 0;
      const released = parseFloat(fields.releasedQuantity) || 0;
      const balance = Math.max(0, approved - released);
      if (balance.toString() !== fields.balanceQuantity) {
        setFields(prev => ({ ...prev, balanceQuantity: balance.toString() }));
      }
    } else if (activePage === 'vendor_bills') {
      const processedQty = parseFloat(fields.processedQuantity) || 0;
      const approvedQty = parseFloat(fields.approvedQuantity) || 0;
      const billableQty = parseFloat(fields.billableQuantity) || 0;
      const rate = parseFloat(fields.processRate) || 0;
      const disc = parseFloat(fields.discount) || 0;
      const gstPct = parseFloat(fields.gstPercent) || 0;
      const other = parseFloat(fields.additionalCharges) || 0;
      const advance = parseFloat(fields.advanceAmount) || 0;

      const taxable = (billableQty * rate) * (1 - disc / 100);
      const cgst = taxable * (gstPct / 2 / 100);
      const sgst = taxable * (gstPct / 2 / 100);
      const igst = taxable * (gstPct / 100);
      const net = taxable + (taxable * gstPct / 100) + other;
      const bal = net - advance;

      if (
        taxable.toFixed(2) !== fields.taxableAmount ||
        cgst.toFixed(2) !== fields.cgst ||
        sgst.toFixed(2) !== fields.sgst ||
        igst.toFixed(2) !== fields.igst ||
        net.toFixed(2) !== fields.netAmount ||
        bal.toFixed(2) !== fields.balanceAmount
      ) {
        setFields(prev => ({
          ...prev,
          taxableAmount: taxable.toFixed(2),
          cgst: cgst.toFixed(2),
          sgst: sgst.toFixed(2),
          igst: igst.toFixed(2),
          netAmount: net.toFixed(2),
          balanceAmount: bal.toFixed(2)
        }));
      }
    } else if (activePage === 'printing_bills') {
      const billableQty = parseFloat(fields.billableQuantity) || 0;
      const rate = parseFloat(fields.printingWashingRate) || 0;
      const colorChg = parseFloat(fields.colorCharges) || 0;
      const screenChg = parseFloat(fields.screenCharges) || 0;
      const chemChg = parseFloat(fields.chemicalCharges) || 0;
      const gstPct = parseFloat(fields.gstPercent) || 0;

      const taxable = (billableQty * rate) + colorChg + screenChg + chemChg;
      const net = taxable * (1 + gstPct / 100);

      if (net.toFixed(2) !== fields.netAmount) {
        setFields(prev => ({
          ...prev,
          netAmount: net.toFixed(2)
        }));
      }
    } else if (activePage === 'dl_development') {
      const devChg = parseFloat(fields.developmentCharges) || 0;
      const cadChg = parseFloat(fields.cadCharges) || 0;
      const sampChg = parseFloat(fields.samplingCharges) || 0;
      const dyeChg = parseFloat(fields.dyeingCharges) || 0;
      const printChg = parseFloat(fields.printingCharges) || 0;
      const gstPct = parseFloat(fields.gstPercent) || 0;

      const taxable = devChg + cadChg + sampChg + dyeChg + printChg;
      const net = taxable * (1 + gstPct / 100);

      if (net.toFixed(2) !== fields.netAmount) {
        setFields(prev => ({
          ...prev,
          netAmount: net.toFixed(2)
        }));
      }
    } else if (activePage === 'surplus_opening') {
      const rate = parseFloat(fields.estimatedRate) || 0;
      const qty = parseFloat(fields.openingQuantity) || 0;
      const val = rate * qty;
      if (val.toFixed(2) !== fields.stockValue) {
        setFields(prev => ({ ...prev, stockValue: val.toFixed(2) }));
      }
    } else if (activePage === 'surplus_report') {
      const rate = parseFloat(fields.estimatedRate) || 0;
      const qty = parseFloat(fields.availableQuantity) || 0;
      const val = rate * qty;
      if (val.toFixed(2) !== fields.stockValue) {
        setFields(prev => ({ ...prev, stockValue: val.toFixed(2) }));
      }
    } else if (activePage === 'surplus_report_new') {
      const rate = parseFloat(fields.rate) || 0;
      const qty = parseFloat(fields.availableQuantity) || 0;
      const val = rate * qty;
      if (val.toFixed(2) !== fields.stockValue) {
        setFields(prev => ({ ...prev, stockValue: val.toFixed(2) }));
      }
    } else if (activePage === 'final_inspection') {
      const rollsList = fields.rolls || [];
      const totalMeters = rollsList.reduce((sum, r) => sum + (parseFloat(r.meters) || 0), 0);
      const approvedMeters = rollsList.reduce((sum, r) => sum + (r.status === 'Approved' ? (parseFloat(r.meters) || 0) : 0), 0);
      const rejectedMeters = rollsList.reduce((sum, r) => sum + (r.status === 'Rejected' ? (parseFloat(r.meters) || 0) : 0), 0);
      if (
        totalMeters.toFixed(2) !== fields.totalMetersInspected ||
        approvedMeters.toFixed(2) !== fields.approvedMeters ||
        rejectedMeters.toFixed(2) !== fields.rejectedQuantity
      ) {
        setFields(prev => ({
          ...prev,
          totalMetersInspected: totalMeters.toFixed(2),
          approvedMeters: approvedMeters.toFixed(2),
          rejectedQuantity: rejectedMeters.toFixed(2)
        }));
      }
    }
  }, [
    fields.rollLength, fields.checkedQuantity, fields.rejectedQuantity, 
    fields.totalLotQuantity, fields.passedQuantity, fields.orderedQuantity, 
    fields.receivedQuantity, fields.dispatchDate, fields.receivedDate,
    fields.purchasedQuantity, fields.purchaseRate, fields.discount, 
    fields.gstPercent, fields.freightCharges, fields.otherCharges, fields.advanceAmount,
    fields.deliveredQuantity, fields.totalQuantity, fields.previousQuantity,
    fields.revisedQuantity, fields.packedQuantity, fields.approvedQuantity,
    fields.releasedQuantity,
    fields.processedQuantity, fields.billableQuantity, fields.processRate,
    fields.additionalCharges, fields.printingWashingRate, fields.colorCharges,
    fields.screenCharges, fields.chemicalCharges, fields.developmentCharges,
    fields.cadCharges, fields.samplingCharges, fields.dyeingCharges, fields.printingCharges,
    fields.estimatedRate, fields.openingQuantity, fields.availableQuantity, fields.rate, fields.saleRate,
    fields.rolls,
    activePage
  ]);

  // =========================================================================
  // SECTIONS & PAGES DEFINITIONS
  // =========================================================================
  const PAGES_METADATA = {
    // Fabric Checking
    final_inspection: { key: 'final_inspection', label: "Final Inspection Entry", category: 'Fabric Checking', desc: "Last quality audit of finished fabric rolls before packing and shipping", icon: ShieldCheck, color: '#3b82f6' },
    design_upload: { key: 'design_upload', label: "Design Upload", category: 'Fabric Checking', desc: "Upload and manage fabric design files digitally", icon: FileText, color: '#3b82f6' },
    cloth_checking: { key: 'cloth_checking', label: "Cloth Checking Entry", category: 'Fabric Checking', desc: "Record quality checking of cloth before inward", icon: CheckSquare, color: '#3b82f6' },
    ot_checking: { key: 'ot_checking', label: "ON Table Checking Entry", category: 'Fabric Checking', desc: "Detailed on-table fabric quality inspection (Link)", icon: Layers, isLink: true, route: '/cloth/checking', color: '#3b82f6' },
    lot_completion: { key: 'lot_completion', label: "Cloth LOT Completion", category: 'Fabric Checking', desc: "Mark fabric lot as complete after all checking done", icon: CheckSquare, color: '#3b82f6' },

    // Fabric Inward
    cloth_inward: { key: 'cloth_inward', label: "Cloth Inward", category: 'Fabric Inward', desc: "Record stock receiving and rack allocation", icon: Factory, color: '#10b981' },
    cloth_purchase_bill: { key: 'cloth_purchase_bill', label: "Cloth Purchase Bills Entry", category: 'Fabric Inward', desc: "Record purchase bills for cloth/fabric bought", icon: FileText, color: '#10b981' },

    // Fabric Delivery
    del_pcwise: { key: 'del_pcwise', label: "Cloth Delivery PC-Wise Entry", category: 'Fabric Delivery', desc: "Record cloth delivery piece-by-piece to buyers", icon: Truck, color: '#6366f1' },
    m2m_delivery: { key: 'm2m_delivery', label: "Mill to Mill Delivery Entry", category: 'Fabric Delivery', desc: "Record fabric transfer between mills/units", icon: Layers, color: '#6366f1' },
    del_eway: { key: 'del_eway', label: "Cloth Delivery Eway Bill", category: 'Fabric Delivery', desc: "Generate E-Way Bill for cloth delivery (Link)", icon: Globe, isLink: true, route: '/eway-bill', color: '#6366f1' },
    bale_delivery: { key: 'bale_delivery', label: "Cloth Bale Delivery Entry", category: 'Fabric Delivery', desc: "Record delivery of cloth in bale format", icon: ShoppingBag, color: '#6366f1' },

    // Lot & Bale
    lot_approval: { key: 'lot_approval', label: "Lot Approval Entry", category: 'Lot & Bale', desc: "Formal approval of fabric lot for dispatch/sale", icon: CheckSquare, color: '#0284c7' },
    bale_amend: { key: 'bale_amend', label: "Bale Amendment Entry", category: 'Lot & Bale', desc: "Amend bale details after packing if corrections needed", icon: Edit, color: '#0284c7' },
    bale_packing: { key: 'bale_packing', label: "Cloth Bale Packing", category: 'Lot & Bale', desc: "Record packing of cloth into bales for dispatch", icon: ShoppingBag, color: '#0284c7' },
    pl_checking: { key: 'pl_checking', label: "Packinglist Checking", category: 'Lot & Bale', desc: "Verify packing list before dispatch", icon: CheckSquare, color: '#0284c7' },

    // Gate & Dispatch
    goods_release: { key: 'goods_release', label: "New Goods Release Advice", category: 'Gate & Dispatch', desc: "Authorize release of goods from warehouse for dispatch", icon: FileText, color: '#0d9488' },
    gate_pass: { key: 'gate_pass', label: "Cloth Gate Pass Entry", category: 'Gate & Dispatch', desc: "Create gate pass specifically for cloth dispatch", icon: Layers, color: '#0d9488' },
    sales_invoice: { key: 'sales_invoice', label: "Sales Invoice", category: 'Gate & Dispatch', desc: "Link to central sales invoicing module (Link)", icon: FileText, isLink: true, route: '/sales-invoice', color: '#0d9488' },
    einvoice_eway: { key: 'einvoice_eway', label: "Einvoice / Eway Bill", category: 'Gate & Dispatch', desc: "Generate combined E-Invoice and E-Way Bill for fabric (Link)", icon: Sparkles, isLink: true, route: '/eway-bill', color: '#0d9488' },

    // Vendor Bills
    vendor_bills: { key: 'vendor_bills', label: "Vendor Bills Entry", category: 'Vendor Bills', desc: "Record bills from fabric processing vendors", icon: FileText, color: '#64748b' },
    printing_bills: { key: 'printing_bills', label: "Printing/Washing Bills Entry", category: 'Vendor Bills', desc: "Record bills from printing and washing job workers", icon: Printer, color: '#64748b' },
    dl_development: { key: 'dl_development', label: "DL Development Bills Entry", category: 'Vendor Bills', desc: "Record bills for design/development work done by vendors", icon: Settings, color: '#64748b' },

    // Surplus Stock
    surplus_opening: { key: 'surplus_opening', label: "Surplus Stock Opening", category: 'Surplus Stock', desc: "Enter opening surplus/excess stock when starting system", icon: Database, color: '#0ea5e9' },
    surplus_report: { key: 'surplus_report', label: "Surplus Stock Report", category: 'Surplus Stock', desc: "View current surplus stock position", icon: FileText, color: '#0ea5e9' },
    surplus_download: { key: 'surplus_download', label: "Surplus Stock Excel Download", category: 'Surplus Stock', desc: "Export surplus stock data directly to Excel sheet", icon: Download, color: '#0ea5e9' },
    surplus_report_new: { key: 'surplus_report_new', label: "Surplus Stock Report New", category: 'Surplus Stock', desc: "Enhanced surplus stock report with seasonal filters", icon: FileText, color: '#0ea5e9' },
    surplus_inward: { key: 'surplus_inward', label: "Surplus Stock Inward", category: 'Surplus Stock', desc: "Record surplus stock coming back from buyers/market", icon: Factory, color: '#0ea5e9' },
    surplus_delivery: { key: 'surplus_delivery', label: "Surplus Stock Delivery", category: 'Surplus Stock', desc: "Record delivery of surplus stock to buyers/traders", icon: Truck, color: '#0ea5e9' },
    customer_hanger: { key: 'customer_hanger', label: "Customer Enquiry Hanger", category: 'Surplus Stock', desc: "Manage customer enquiries for fabric hangers/samples", icon: ShoppingBag, color: '#0ea5e9' }
  };

  // Declarative configurations of cards/fields for all active modules
  const FORM_SCHEMAS = {
    final_inspection: [
      { title: "Audit Information", icon: FileText, fields: [
        { name: "auditNo", label: "Audit No *", type: "text", required: true },
        { name: "auditDate", label: "Audit Date *", type: "date", required: true },
        { name: "overallStatus", label: "Overall Status *", type: "select", options: ["APPROVED", "REJECTED", "HOLD"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "buyerName", label: "Buyer Name *", type: "select", options: BUYERS },
        { name: "buyerOrderNo", label: "Order No *", type: "text", required: true }
      ]},
      { title: "Quantity Summaries (Auto-Calculated from Rolls)", icon: Scale, fields: [
        { name: "totalMetersInspected", label: "Total Meters Inspected (Auto)", type: "number", readOnly: true },
        { name: "approvedMeters", label: "Approved Meters (Auto)", type: "number", readOnly: true },
        { name: "rejectedQuantity", label: "Rejected Meters (Auto)", type: "number", readOnly: true }
      ]}
    ],
    design_upload: [
      { title: "Upload Information", icon: FileText, fields: [
        { name: "designUploadNo", label: "Design Upload No *", type: "text", required: true },
        { name: "uploadDate", label: "Upload Date *", type: "date", required: true },
        { name: "uploadType", label: "Upload Type *", type: "select", options: ["CAD", "Artwork", "Fabric Image", "Buyer Reference"] }
      ]},
      { title: "Design Details", icon: Palette, fields: [
        { name: "designNo", label: "Design No *", type: "text", required: true },
        { name: "designName", label: "Design Name *", type: "text", required: true },
        { name: "patternType", label: "Pattern Type", type: "text" },
        { name: "collectionName", label: "Collection Name", type: "text" },
        { name: "season", label: "Season", type: "text" }
      ]},
      { title: "Buyer Details", icon: Users, fields: [
        { name: "buyerName", label: "Buyer Name *", type: "select", options: BUYERS },
        { name: "buyerDesignRef", label: "Buyer Design Reference", type: "text" },
        { name: "merchantName", label: "Merchant Name", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricType", label: "Fabric Type *", type: "text", required: true },
        { name: "construction", label: "Construction", type: "text" },
        { name: "composition", label: "Composition", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" }
      ]},
      { title: "Color Details", icon: Palette, fields: [
        { name: "groundColor", label: "Ground Color", type: "text" },
        { name: "designColor", label: "Design Color", type: "text" },
        { name: "pantoneCode", label: "Pantone Code", type: "text" }
      ]},
      { title: "Technical Details", icon: Settings, fields: [
        { name: "repeatSize", label: "Repeat Size", type: "text" },
        { name: "weaveType", label: "Weave Type", type: "text" },
        { name: "printType", label: "Print Type", type: "text" },
        { name: "finishType", label: "Finish Type", type: "text" }
      ]},
      { title: "File Upload Details (Simulation)", icon: FileImage, fields: [
        { name: "cadFileUpload", label: "CAD File Upload", type: "text" },
        { name: "designImageUpload", label: "Design Image Upload", type: "text" },
        { name: "refImageUpload", label: "Reference Image Upload", type: "text" },
        { name: "techSheetUpload", label: "Technical Sheet Upload", type: "text" }
      ]},
      { title: "Approval Details", icon: ShieldCheck, fields: [
        { name: "uploadedBy", label: "Uploaded By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Remarks", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Uploaded", "Under Review", "Approved", "Rejected"] },
        { name: "designNotes", label: "Design Notes", type: "textarea" },
        { name: "buyerRemarks", label: "Buyer Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    cloth_checking: [
      { title: "Checking Information", icon: FileText, fields: [
        { name: "clothCheckingNo", label: "Cloth Checking No *", type: "text", required: true },
        { name: "checkingDate", label: "Checking Date *", type: "date", required: true },
        { name: "shift", label: "Shift *", type: "select", options: SHIFTS },
        { name: "checkerName", label: "Checker Name *", type: "text", required: true }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "lotNo", label: "LOT No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "rollLength", label: "Roll Length *", type: "number", required: true },
        { name: "checkedQuantity", label: "Checked Quantity *", type: "number", required: true },
        { name: "passedQuantity", label: "Passed Quantity (Auto) *", type: "number", readOnly: true },
        { name: "rejectedQuantity", label: "Rejected Quantity *", type: "number", required: true },
        { name: "balanceQuantity", label: "Balance Quantity (Auto) *", type: "number", readOnly: true }
      ]},
      { title: "Inspection & Defects", icon: AlertTriangle, fields: [
        { name: "holeDefects", label: "Hole Defects", type: "number" },
        { name: "stainDefects", label: "Stain Defects", type: "number" },
        { name: "shadeVariation", label: "Shade Variation", type: "number" },
        { name: "weavingDefects", label: "Weaving Defects", type: "number" },
        { name: "oilMarks", label: "Oil Marks", type: "number" },
        { name: "printDefects", label: "Print Defects", type: "number" }
      ]},
      { title: "Quality Parameters Check", icon: ShieldCheck, fields: [
        { name: "gsmCheck", label: "GSM Check Status", type: "select", options: ["Ok", "Underweight", "Overweight"] },
        { name: "widthCheck", label: "Width Check Status", type: "select", options: ["Ok", "Narrow", "Wide"] },
        { name: "shrinkageCheck", label: "Shrinkage Check", type: "text" },
        { name: "colorFastness", label: "Color Fastness Result", type: "text" },
        { name: "handFeelCheck", label: "Hand Feel Check", type: "select", options: ["Soft", "Medium", "Stiff", "Rejected"] }
      ]},
      { title: "Defect Grading & Rework", icon: Settings, fields: [
        { name: "totalDefectPoints", label: "Total Defect Points", type: "number" },
        { name: "defectGrade", label: "Defect Grade", type: "select", options: ["A Grade", "B Grade", "C Grade", "F/Second Quality"] },
        { name: "reworkRequired", label: "Rework Required", type: "checkbox" }
      ]},
      { title: "QC Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "QC Approved", "QC Rejected", "Rework"] },
        { name: "inspectionResult", label: "Inspection Result", type: "select", options: ["Passed", "Passed with Major Defect", "Rejected"] },
        { name: "finalApprovalStatus", label: "Final Approval Status", type: "select", options: ["Pending", "Approved", "Hold", "Rejected"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "checkedBy", label: "Checked By *", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By *", type: "select", options: EMPLOYEES },
        { name: "productionApprovedBy", label: "Production Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status, Attachments & Remarks", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Checked", "Approved", "Rejected", "Recheck"] },
        { name: "fabricImageUpload", label: "Fabric Image Upload Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Upload Link", type: "text" },
        { name: "inspectionSheetUpload", label: "Inspection Sheet Link", type: "text" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "defectNotes", label: "Defect Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    lot_completion: [
      { title: "LOT Completion Information", icon: FileText, fields: [
        { name: "lotCompletionNo", label: "LOT Completion No *", type: "text", required: true },
        { name: "completionDate", label: "Completion Date *", type: "date", required: true },
        { name: "completionType", label: "Completion Type *", type: "select", options: ["Production Completion", "QC Completion", "Dispatch Ready"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "lotNo", label: "LOT No *", type: "text", required: true },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "totalLotQuantity", label: "Total LOT Quantity *", type: "number", required: true },
        { name: "passedQuantity", label: "Passed Quantity *", type: "number", required: true },
        { name: "rejectedQuantity", label: "Rejected Quantity *", type: "number", required: true },
        { name: "balanceQuantity", label: "Balance Quantity (Auto) *", type: "number", readOnly: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" }
      ]},
      { title: "Production Details", icon: Settings, fields: [
        { name: "processCompletionStatus", label: "Process Completion Status", type: "select", options: ["Completed", "Partial", "Pending"] },
        { name: "finalProcessName", label: "Final Process Name", type: "text" },
        { name: "completionPercentage", label: "Completion Percentage (%)", type: "number" }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "QC Approved", "QC Rejected", "Rework"] },
        { name: "finalInspectionResult", label: "Final Inspection Result", type: "select", options: ["Pass", "Fail", "Hold"] },
        { name: "shadeMatchingStatus", label: "Shade Matching Status", type: "select", options: ["100% Match", "Minor Deviation", "Major Deviation"] },
        { name: "shrinkageResult", label: "Shrinkage Result", type: "text" },
        { name: "defectStatus", label: "Defect Status", type: "text" }
      ]},
      { title: "Stock & Storage Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" },
        { name: "readyForDispatch", label: "Ready For Dispatch", type: "checkbox" }
      ]},
      { title: "Dispatch Details", icon: Truck, fields: [
        { name: "dispatchReadyDate", label: "Dispatch Ready Date", type: "date" },
        { name: "deliveryStatus", label: "Delivery Status", type: "select", options: ["Ready", "In-Transit", "Delivered", "Cancelled"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "completedBy", label: "Completed By *", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By *", type: "select", options: EMPLOYEES },
        { name: "storeApprovedBy", label: "Store Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status, Attachments & Remarks", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending QC", "QC Approved", "Completed", "Hold", "Ready Dispatch"] },
        { name: "lotReportUpload", label: "LOT Report Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "fabricImageUpload", label: "Fabric Image Link", type: "text" },
        { name: "completionNotes", label: "Completion Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    cloth_inward: [
      { title: "Inward Information", icon: FileText, fields: [
        { name: "clothInwardNo", label: "Cloth Inward No *", type: "text", required: true },
        { name: "inwardDate", label: "Inward Date *", type: "date", required: true },
        { name: "inwardType", label: "Inward Type *", type: "select", options: ["Purchase", "Processing Return", "Production Return", "Job Work Return"] }
      ]},
      { title: "Party Details", icon: Factory, fields: [
        { name: "supplierName", label: "Supplier / Vendor Name *", type: "select", options: BUYERS },
        { name: "vendorCode", label: "Vendor Code", type: "text" },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "poNo", label: "PO No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "composition", label: "Composition", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "orderedQuantity", label: "Ordered Quantity *", type: "number", required: true },
        { name: "receivedQuantity", label: "Received Quantity *", type: "number", required: true },
        { name: "shortQuantity", label: "Short Quantity (Auto) *", type: "number", readOnly: true },
        { name: "excessQuantity", label: "Excess Quantity (Auto) *", type: "number", readOnly: true },
        { name: "rejectedQuantity", label: "Rejected Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Roll / LOT Details", icon: Database, fields: [
        { name: "rollNo", label: "Roll No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" }
      ]},
      { title: "Quality & Check Details", icon: ShieldCheck, fields: [
        { name: "fabricCondition", label: "Fabric Condition", type: "select", options: ["Good", "Damaged", "Wet", "Dirty"] },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "QC Approved", "QC Rejected", "Hold"] },
        { name: "inspectionResult", label: "Inspection Result", type: "select", options: ["Passed", "Passed with minor defect", "Rejected"] },
        { name: "shadeMatching", label: "Shade Matching Status", type: "text" },
        { name: "widthCheck", label: "Width Check Result", type: "text" },
        { name: "gsmCheck", label: "GSM Check Result", type: "text" },
        { name: "defectPoints", label: "Defect Points", type: "number" }
      ]},
      { title: "Stock Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" },
        { name: "stockUpdatedStatus", label: "Stock Updated", type: "checkbox" }
      ]},
      { title: "Delivery Details (Auto-Calculations)", icon: Truck, fields: [
        { name: "dispatchDate", label: "Dispatch Date", type: "date" },
        { name: "receivedDate", label: "Received Date", type: "date" },
        { name: "delayDays", label: "Delay Days (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "receivedBy", label: "Received By *", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By *", type: "select", options: EMPLOYEES },
        { name: "storeApprovedBy", label: "Store Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending QC", "QC Approved", "Completed", "Rejected", "Hold"] },
        { name: "invoiceUpload", label: "Invoice Upload Link", type: "text" },
        { name: "challanUpload", label: "Challan Upload Link", type: "text" },
        { name: "fabricImageUpload", label: "Fabric Image Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "vendorRemarks", label: "Vendor Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    cloth_purchase_bill: [
      { title: "Bill Information", icon: FileText, fields: [
        { name: "purchaseBillNo", label: "Purchase Bill No *", type: "text", required: true },
        { name: "billDate", label: "Bill Date *", type: "date", required: true },
        { name: "billType", label: "Bill Type *", type: "select", options: ["Local Purchase", "Import Purchase", "Sample Purchase"] }
      ]},
      { title: "Supplier Details", icon: Factory, fields: [
        { name: "supplierName", label: "Supplier Name *", type: "select", options: BUYERS },
        { name: "supplierCode", label: "Supplier Code", type: "text" },
        { name: "gstNo", label: "GST No", type: "text" },
        { name: "contactPerson", label: "Contact Person", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "clothPurchaseOrderNo", label: "Cloth Purchase Order No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "grnNo", label: "GRN No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "purchasedQuantity", label: "Purchased Quantity *", type: "number", required: true },
        { name: "receivedQuantity", label: "Received Quantity *", type: "number", required: true },
        { name: "billQuantity", label: "Bill Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Commercial & Tax Details (Auto-Calculations)", icon: Palette, fields: [
        { name: "purchaseRate", label: "Purchase Rate *", type: "number", required: true },
        { name: "discount", label: "Discount (%) *", type: "number", required: true },
        { name: "taxableAmount", label: "Taxable Amount (Auto)", type: "number", readOnly: true },
        { name: "gstPercent", label: "GST (%) *", type: "select", options: ["5", "12", "18", "28"] },
        { name: "cgst", label: "CGST (Auto)", type: "number", readOnly: true },
        { name: "sgst", label: "SGST (Auto)", type: "number", readOnly: true },
        { name: "igst", label: "IGST (Auto)", type: "number", readOnly: true },
        { name: "freightCharges", label: "Freight Charges", type: "number" },
        { name: "otherCharges", label: "Other Charges", type: "number" },
        { name: "netAmount", label: "Net Amount (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Payment & Term Details (Auto-Calculations)", icon: Palette, fields: [
        { name: "paymentTerms", label: "Payment Terms", type: "text" },
        { name: "dueDate", label: "Due Date *", type: "date", required: true },
        { name: "advanceAmount", label: "Advance Amount", type: "number" },
        { name: "balanceAmount", label: "Balance Amount (Auto)", type: "number", readOnly: true },
        { name: "paymentStatus", label: "Payment Status", type: "select", options: ["Unpaid", "Partially Paid", "Fully Paid"] }
      ]},
      { title: "Accounts Details", icon: FolderKanban, fields: [
        { name: "accountsVerifiedBy", label: "Accounts Verified By *", type: "select", options: EMPLOYEES },
        { name: "ledgerPostingStatus", label: "Ledger Posting Status", type: "checkbox" },
        { name: "debitCreditNoteStatus", label: "Debit/Credit Note Status", type: "text" }
      ]},
      { title: "Quality Check Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "QC Approved", "QC Rejected"] },
        { name: "inspectionResult", label: "Inspection Result", type: "select", options: ["Passed", "Passed with minor defect", "Rejected"] },
        { name: "rejectedQuantity", label: "Rejected Quantity", type: "number" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "preparedBy", label: "Prepared By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Pending Verification", "Approved", "Paid", "Cancelled"] },
        { name: "supplierInvoiceUpload", label: "Supplier Invoice Link", type: "text" },
        { name: "purchaseBillUpload", label: "Purchase Bill Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "gstDocumentUpload", label: "GST Document Link", type: "text" },
        { name: "accountsRemarks", label: "Accounts Remarks", type: "textarea" },
        { name: "purchaseNotes", label: "Purchase Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    del_pcwise: [
      { title: "Delivery Information", icon: FileText, fields: [
        { name: "clothDeliveryNo", label: "Cloth Delivery No *", type: "text", required: true },
        { name: "deliveryDate", label: "Delivery Date *", type: "date", required: true },
        { name: "deliveryType", label: "Delivery Type *", type: "select", options: ["Customer Delivery", "Processing Delivery", "Internal Transfer"] }
      ]},
      { title: "Party Details", icon: Factory, fields: [
        { name: "customerVendorName", label: "Customer/Vendor Name *", type: "select", options: BUYERS },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "deliveryAddress", label: "Delivery Address", type: "textarea" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Piece / Roll Details", icon: Database, fields: [
        { name: "pieceNo", label: "Piece No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" },
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "rollLength", label: "Roll Length *", type: "number", required: true },
        { name: "deliveredQuantity", label: "Delivered Quantity *", type: "number", required: true },
        { name: "balanceQuantity", label: "Balance Quantity (Auto)", type: "number", readOnly: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Packing Details", icon: ShoppingBag, fields: [
        { name: "packingType", label: "Packing Type", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "netWeight", label: "Net Weight", type: "number" },
        { name: "grossWeight", label: "Gross Weight", type: "number" }
      ]},
      { title: "Transport Details", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "driverName", label: "Driver Name", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "dispatchQcStatus", label: "Dispatch QC Status", type: "select", options: ["Pending", "QC Passed", "QC Rejected"] },
        { name: "finalInspectionResult", label: "Final Inspection Result", type: "select", options: ["Passed", "Passed with minor defect", "Rejected"] },
        { name: "fabricCondition", label: "Fabric Condition", type: "select", options: ["Good", "Damaged", "Wet", "Dirty"] }
      ]},
      { title: "Dispatch Details", icon: Truck, fields: [
        { name: "dispatchTime", label: "Dispatch Time", type: "text" },
        { name: "expectedDeliveryDate", label: "Expected Delivery Date", type: "date" },
        { name: "deliveryStatus", label: "Delivery Status", type: "select", options: ["Pending", "Dispatched", "In Transit", "Delivered", "Returned"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "deliveredBy", label: "Delivered By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Dispatched", "In Transit", "Delivered", "Returned"] },
        { name: "deliveryChallanUpload", label: "Delivery Challan Link", type: "text" },
        { name: "fabricImageUpload", label: "Fabric Image Link", type: "text" },
        { name: "dispatchReceiptUpload", label: "Dispatch Receipt Link", type: "text" },
        { name: "deliveryNotes", label: "Delivery Notes", type: "textarea" },
        { name: "transportRemarks", label: "Transport Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    m2m_delivery: [
      { title: "Delivery Information", icon: FileText, fields: [
        { name: "millTransferNo", label: "Mill Transfer No *", type: "text", required: true },
        { name: "transferDate", label: "Transfer Date *", type: "date", required: true },
        { name: "transferType", label: "Transfer Type *", type: "select", options: ["Dyeing", "Processing", "Finishing", "Internal Transfer"] }
      ]},
      { title: "Source Mill Details", icon: Factory, fields: [
        { name: "fromMillName", label: "From Mill Name *", type: "text", required: true },
        { name: "fromWarehouse", label: "From Warehouse", type: "text" },
        { name: "fromContactPerson", label: "Contact Person", type: "text" }
      ]},
      { title: "Destination Mill Details", icon: Factory, fields: [
        { name: "toMillName", label: "To Mill Name *", type: "text", required: true },
        { name: "toProcessingUnit", label: "To Processing Unit", type: "text" },
        { name: "toContactPerson", label: "Contact Person", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" },
        { name: "transferReferenceNo", label: "Transfer Reference No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "transferQuantity", label: "Transfer Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "balanceQuantity", label: "Balance Quantity", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "LOT / Batch Details", icon: Database, fields: [
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" }
      ]},
      { title: "Process Details", icon: Settings, fields: [
        { name: "currentProcess", label: "Current Process", type: "text" },
        { name: "nextProcess", label: "Next Process", type: "text" },
        { name: "processInstructions", type: "textarea", label: "Process Instructions" }
      ]},
      { title: "Transport Details", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "driverName", label: "Driver Name", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "QC Passed", "QC Rejected"] },
        { name: "fabricCondition", label: "Fabric Condition", type: "select", options: ["Good", "Damaged", "Wet", "Dirty"] },
        { name: "inspectionStatus", label: "Inspection Status", type: "text" }
      ]},
      { title: "Dispatch Details", icon: Truck, fields: [
        { name: "dispatchDate", label: "Dispatch Date", type: "date" },
        { name: "expectedArrivalDate", label: "Expected Arrival Date", type: "date" },
        { name: "deliveryStatus", label: "Delivery Status", type: "select", options: ["Pending", "Dispatched", "In Transit", "Received", "Completed"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "dispatchBy", label: "Dispatch By *", type: "select", options: EMPLOYEES },
        { name: "receivedBy", label: "Received By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Dispatched", "In Transit", "Received", "Completed"] },
        { name: "transferChallanUpload", label: "Transfer Challan Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "fabricImageUpload", label: "Fabric Image Link", type: "text" },
        { name: "transferNotes", label: "Transfer Notes", type: "textarea" },
        { name: "processRemarks", label: "Process Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    bale_delivery: [
      { title: "Bale Delivery Information", icon: FileText, fields: [
        { name: "baleDeliveryNo", label: "Bale Delivery No *", type: "text", required: true },
        { name: "deliveryDate", label: "Delivery Date *", type: "date", required: true },
        { name: "dispatchType", label: "Dispatch Type *", type: "select", options: ["Customer Dispatch", "Processing Dispatch", "Export Dispatch"] }
      ]},
      { title: "Customer Details", icon: Factory, fields: [
        { name: "customerName", label: "Customer Name *", type: "select", options: BUYERS },
        { name: "deliveryAddress", label: "Delivery Address", type: "textarea" },
        { name: "contactPerson", label: "Contact Person", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" }
      ]},
      { title: "Bale Details", icon: ShoppingBag, fields: [
        { name: "baleNo", label: "Bale No *", type: "text", required: true },
        { name: "baleWeight", label: "Bale Weight (Kg)", type: "number" },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "netWeight", label: "Net Weight (Kg)", type: "number" },
        { name: "grossWeight", label: "Gross Weight (Kg)", type: "number" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "totalQuantity", label: "Total Ordered Quantity *", type: "number", required: true },
        { name: "deliveredQuantity", label: "Delivered Quantity *", type: "number", required: true },
        { name: "pendingQuantity", label: "Pending Quantity (Auto)", type: "number", readOnly: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Packing Details", icon: ShoppingBag, fields: [
        { name: "packingType", label: "Packing Type", type: "text" },
        { name: "packingMaterial", label: "Packing Material", type: "text" },
        { name: "labelNo", label: "Label No", type: "text" },
        { name: "barcodeNo", label: "Barcode No", type: "text" }
      ]},
      { title: "Transport Details", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "driverName", label: "Driver Name", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "dispatchQcStatus", label: "Dispatch QC Status", type: "select", options: ["Pending", "QC Passed", "QC Rejected"] },
        { name: "baleCondition", label: "Bale Condition", type: "select", options: ["Good", "Damaged", "Wet", "Dirty"] },
        { name: "damageStatus", label: "Damage Status", type: "select", options: ["No Damage", "Minor Damage", "Heavy Damage"] }
      ]},
      { title: "Dispatch Details", icon: Truck, fields: [
        { name: "dispatchDate", label: "Dispatch Date", type: "date" },
        { name: "expectedDeliveryDate", label: "Expected Delivery Date", type: "date" },
        { name: "deliveryStatus", label: "Delivery Status", type: "select", options: ["Pending", "Dispatched", "In Transit", "Delivered", "Returned"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "packedBy", label: "Packed By *", type: "select", options: EMPLOYEES },
        { name: "deliveredBy", label: "Delivered By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Dispatched", "In Transit", "Delivered", "Returned"] },
        { name: "deliveryChallanUpload", label: "Delivery Challan Link", type: "text" },
        { name: "baleImageUpload", label: "Bale Image Link", type: "text" },
        { name: "transportReceiptUpload", label: "Transport Receipt Link", type: "text" },
        { name: "dispatchNotes", label: "Dispatch Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    lot_approval: [
      { title: "Approval Information", icon: FileText, fields: [
        { name: "lotApprovalNo", label: "LOT Approval No *", type: "text", required: true },
        { name: "approvalDate", label: "Approval Date *", type: "date", required: true },
        { name: "approvalType", label: "Approval Type *", type: "select", options: ["Production Approval", "QC Approval", "Dispatch Approval"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "lotNo", label: "LOT No *", type: "text", required: true },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "totalLotQuantity", label: "Total LOT Quantity *", type: "number", required: true },
        { name: "passedQuantity", label: "Passed Quantity *", type: "number", required: true },
        { name: "rejectedQuantity", label: "Rejected Quantity *", type: "number", required: true },
        { name: "balanceQuantity", label: "Balance Quantity (Auto)", type: "number", readOnly: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Production Details", icon: Settings, fields: [
        { name: "processCompleted", label: "Process Completed", type: "checkbox" },
        { name: "finalProcessName", label: "Final Process Name", type: "text" },
        { name: "completionStatus", label: "Completion Status", type: "select", options: ["Completed", "Pending", "Rework"] }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "Under Review", "Approved", "Rejected", "Hold"] },
        { name: "inspectionResult", label: "Inspection Result", type: "select", options: ["Passed", "Passed with minor defect", "Rejected"] },
        { name: "shadeMatching", label: "Shade Matching Status", type: "text" },
        { name: "gsmResult", label: "GSM Result", type: "text" },
        { name: "widthResult", label: "Width Result", type: "text" },
        { name: "shrinkageResult", label: "Shrinkage Result", type: "text" },
        { name: "defectPoints", label: "Defect Points", type: "number" }
      ]},
      { title: "Stock Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" },
        { name: "readyForPackingStatus", label: "Ready For Packing", type: "checkbox" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "checkedBy", label: "Checked By *", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By *", type: "select", options: EMPLOYEES },
        { name: "storeApprovedBy", label: "Store Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending QC", "Under Review", "Approved", "Rejected", "Hold"] },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "lotSheetUpload", label: "LOT Sheet Link", type: "text" },
        { name: "fabricImageUpload", label: "Fabric Image Link", type: "text" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "productionNotes", label: "Production Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    bale_amend: [
      { title: "Amendment Information", icon: FileText, fields: [
        { name: "baleAmendmentNo", label: "Bale Amendment No *", type: "text", required: true },
        { name: "amendmentDate", label: "Amendment Date *", type: "date", required: true },
        { name: "amendmentType", label: "Amendment Type *", type: "select", options: ["Weight Correction", "Quantity Change", "Roll Adjustment", "Label Correction"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "baleNo", label: "Bale No *", type: "text", required: true },
        { name: "packingNo", label: "Packing No", type: "text" },
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" }
      ]},
      { title: "Existing Bale Details", icon: ShoppingBag, fields: [
        { name: "oldBaleWeight", label: "Old Bale Weight (Kg)", type: "number" },
        { name: "oldRollCount", label: "Old Roll Count", type: "number" },
        { name: "oldQuantity", label: "Old Quantity", type: "number" },
        { name: "oldBarcodeNo", label: "Old Barcode No", type: "text" }
      ]},
      { title: "Revised Bale Details", icon: ShoppingBag, fields: [
        { name: "newBaleWeight", label: "New Bale Weight (Kg)", type: "number" },
        { name: "newRollCount", label: "New Roll Count", type: "number" },
        { name: "newQuantity", label: "New Quantity", type: "number" },
        { name: "newBarcodeNo", label: "New Barcode No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "previousQuantity", label: "Previous Quantity *", type: "number", required: true },
        { name: "revisedQuantity", label: "Revised Quantity *", type: "number", required: true },
        { name: "differenceQuantity", label: "Difference Quantity (Auto)", type: "number", readOnly: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Amendment Reason", icon: Info, fields: [
        { name: "amendmentReason", label: "Amendment Reason *", type: "select", options: ["QC Correction", "Packing Error", "Dispatch Adjustment", "System Update"] }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "recheckRequired", label: "Recheck Required", type: "checkbox" },
        { name: "qcVerificationStatus", label: "QC Verification Status", type: "text" },
        { name: "damageStatus", label: "Damage Status", type: "select", options: ["No Damage", "Minor Damage", "Heavy Damage"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "requestedBy", label: "Requested By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Remarks", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Pending Approval", "Approved", "Rejected"] },
        { name: "baleImageUpload", label: "Bale Image Link", type: "text" },
        { name: "amendmentSheetUpload", label: "Amendment Sheet Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "amendmentNotes", label: "Amendment Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    bale_packing: [
      { title: "Packing Information", icon: FileText, fields: [
        { name: "balePackingNo", label: "Bale Packing No *", type: "text", required: true },
        { name: "packingDate", label: "Packing Date *", type: "date", required: true },
        { name: "packingType", label: "Packing Type *", type: "select", options: ["Roll Packing", "Bale Packing", "Export Packing"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "lotNo", label: "LOT No *", type: "text", required: true },
        { name: "batchNo", label: "Batch No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Bale Details", icon: ShoppingBag, fields: [
        { name: "baleNo", label: "Bale No *", type: "text", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "pieceCount", label: "Piece Count", type: "number" },
        { name: "netWeight", label: "Net Weight (Kg)", type: "number" },
        { name: "grossWeight", label: "Gross Weight (Kg)", type: "number" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "totalQuantity", label: "Total LOT Quantity *", type: "number", required: true },
        { name: "packedQuantity", label: "Packed Quantity *", type: "number", required: true },
        { name: "balanceQuantity", label: "Balance Quantity (Auto)", type: "number", readOnly: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Packing Details", icon: ShoppingBag, fields: [
        { name: "packingMaterial", label: "Packing Material", type: "text" },
        { name: "packingMethod", label: "Packing Method", type: "text" },
        { name: "labelNo", label: "Label No", type: "text" },
        { name: "barcodeNo", label: "Barcode No", type: "text" },
        { name: "tagNo", label: "Tag No", type: "text" }
      ]},
      { title: "Stock Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" },
        { name: "readyForDispatchStatus", label: "Ready For Dispatch", type: "checkbox" }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "packingQcStatus", label: "Packing QC Status", type: "select", options: ["Pending QC", "QC Approved", "QC Rejected"] },
        { name: "baleCondition", label: "Bale Condition", type: "select", options: ["Good", "Damaged", "Wet", "Dirty"] },
        { name: "finalInspectionResult", label: "Final Inspection Result", type: "select", options: ["Passed", "Passed with minor defect", "Rejected"] }
      ]},
      { title: "Dispatch Preparation", icon: Truck, fields: [
        { name: "dispatchReadyDate", label: "Dispatch Ready Date", type: "date" },
        { name: "transportPreparationStatus", label: "Transport Preparation Status", type: "select", options: ["Pending", "In Progress", "Ready"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "packedBy", label: "Packed By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Packed", "Ready Dispatch", "Completed"] },
        { name: "baleImageUpload", label: "Bale Image Link", type: "text" },
        { name: "packingLabelUpload", label: "Packing Label Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "packingNotes", label: "Packing Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    pl_checking: [
      { title: "Checking Information", icon: FileText, fields: [
        { name: "packinglistCheckingNo", label: "Packinglist Checking No *", type: "text", required: true },
        { name: "checkingDate", label: "Checking Date *", type: "date", required: true },
        { name: "checkingType", label: "Checking Type *", type: "select", options: ["Domestic", "Export", "Internal Dispatch"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "packingListNo", label: "Packing List No *", type: "text", required: true },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "deliveryNo", label: "Delivery No", type: "text" }
      ]},
      { title: "Customer Details", icon: Users, fields: [
        { name: "customerName", label: "Customer Name *", type: "select", options: BUYERS },
        { name: "destination", label: "Destination", type: "text" },
        { name: "shipmentMode", label: "Shipment Mode *", type: "select", options: ["Sea Freight", "Air Freight", "Road Transport"] }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Packing Details", icon: ShoppingBag, fields: [
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "pieceCount", label: "Piece Count", type: "number" },
        { name: "packedQuantity", label: "Packed Quantity *", type: "number", required: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Verification Details", icon: ShieldCheck, fields: [
        { name: "barcodeVerification", label: "Barcode Verification Completed", type: "checkbox" },
        { name: "labelVerification", label: "Label Verification Completed", type: "checkbox" },
        { name: "quantityVerification", label: "Quantity Verification Completed", type: "checkbox" },
        { name: "weightVerification", label: "Weight Verification Completed", type: "checkbox" },
        { name: "packingStandardVerification", label: "Packing Standard Verification Completed", type: "checkbox" }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "Approved", "Rejected"] },
        { name: "inspectionResult", label: "Inspection Result", type: "select", options: ["Passed", "Passed with minor defect", "Rejected"] },
        { name: "damageStatus", label: "Damage Status", type: "select", options: ["No Damage", "Minor Damage", "Heavy Damage"] },
        { name: "missingItemStatus", label: "Missing Item Detected", type: "checkbox" }
      ]},
      { title: "Dispatch Details", icon: Truck, fields: [
        { name: "containerNo", label: "Container No", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "checkedBy", label: "Checked By *", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By *", type: "select", options: EMPLOYEES },
        { name: "dispatchApprovedBy", label: "Dispatch Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Verified", "Approved", "Rejected", "Ready Dispatch"] },
        { name: "packingListUpload", label: "Packing List Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "dispatchDocumentUpload", label: "Dispatch Document Link", type: "text" },
        { name: "checkingNotes", label: "Checking Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    goods_release: [
      { title: "Release Information", icon: FileText, fields: [
        { name: "goodsReleaseAdviceNo", label: "Goods Release Advice No *", type: "text", required: true },
        { name: "releaseDate", label: "Release Date *", type: "date", required: true },
        { name: "releaseType", label: "Release Type *", type: "select", options: ["Sales Dispatch", "Internal Transfer", "Processing Dispatch", "Export Dispatch"] }
      ]},
      { title: "Party Details", icon: Factory, fields: [
        { name: "customerVendorName", label: "Customer/Vendor Name *", type: "select", options: BUYERS },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "deliveryAddress", label: "Delivery Address", type: "textarea" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "deliveryChallanNo", label: "Delivery Challan No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "approvedQuantity", label: "Approved Quantity *", type: "number", required: true },
        { name: "releasedQuantity", label: "Released Quantity *", type: "number", required: true },
        { name: "balanceQuantity", label: "Balance Quantity (Auto)", type: "number", readOnly: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "LOT / Bale Details", icon: Database, fields: [
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" }
      ]},
      { title: "Stock Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" },
        { name: "stockAvailabilityStatus", label: "Stock Availability Status", type: "select", options: ["Available", "Out of Stock", "Reserved"] }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["QC Approved", "QC Rejected", "Pending QC"] },
        { name: "finalInspectionResult", label: "Final Inspection Result", type: "select", options: ["Passed", "Passed with minor defect", "Rejected"] },
        { name: "releaseApprovalStatus", label: "Release Approval Status", type: "select", options: ["Approved", "Hold", "Rejected"] }
      ]},
      { title: "Dispatch Details", icon: Truck, fields: [
        { name: "dispatchDate", label: "Dispatch Date", type: "date" },
        { name: "dispatchLocation", label: "Dispatch Location", type: "text" },
        { name: "transportPreparationStatus", label: "Transport Preparation Status", type: "select", options: ["Pending", "In Progress", "Ready"] }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "requestedBy", label: "Requested By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Approved", "Released", "Closed", "Cancelled"] },
        { name: "releaseAdviceUpload", label: "Release Advice Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "dispatchDocumentUpload", label: "Dispatch Document Link", type: "text" },
        { name: "dispatchNotes", label: "Dispatch Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    gate_pass: [
      { title: "Gate Pass Information", icon: FileText, fields: [
        { name: "gatePassNo", label: "Gate Pass No *", type: "text", required: true },
        { name: "gatePassDate", label: "Gate Pass Date *", type: "date", required: true },
        { name: "gatePassType", label: "Gate Pass Type *", type: "select", options: ["Inward", "Outward", "Returnable", "Non-Returnable"] }
      ]},
      { title: "Party Details", icon: Factory, fields: [
        { name: "customerVendorName", label: "Customer/Vendor Name *", type: "select", options: BUYERS },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "vehicleNo", label: "Vehicle No *", type: "text", required: true },
        { name: "driverName", label: "Driver Name", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" },
        { name: "deliveryNo", label: "Delivery No", type: "text" }
      ]},
      { title: "Fabric / Material Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "quantity", label: "Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "netWeight", label: "Net Weight (Kg)", type: "number" },
        { name: "grossWeight", label: "Gross Weight (Kg)", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "LOT / Bale Details", icon: Database, fields: [
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" }
      ]},
      { title: "Movement Details", icon: MapPin, fields: [
        { name: "fromLocation", label: "From Location", type: "text" },
        { name: "toLocation", label: "To Location", type: "text" },
        { name: "purposeOfMovement", label: "Purpose of Movement", type: "text" },
        { name: "returnableStatus", label: "Returnable Status", type: "select", options: ["Non-Returnable", "Returnable Pending", "Returned"] }
      ]},
      { title: "Transport Details", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "driverMobileNo", label: "Driver Mobile No", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" }
      ]},
      { title: "Security Verification", icon: Shield, fields: [
        { name: "securityCheckedBy", label: "Security Checked By", type: "text" },
        { name: "materialVerificationStatus", label: "Material Verification Status", type: "select", options: ["Match", "Mismatch", "Pending Verification"] },
        { name: "exitTime", label: "Exit Time", type: "text" },
        { name: "entryTime", label: "Entry Time", type: "text" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "preparedBy", label: "Prepared By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Approved", "Dispatched", "Returned", "Closed"] },
        { name: "gatePassCopyUpload", label: "Gate Pass Copy Link", type: "text" },
        { name: "invoiceUpload", label: "Invoice Link", type: "text" },
        { name: "vehicleDocumentUpload", label: "Vehicle Document Link", type: "text" },
        { name: "securityNotes", label: "Security Notes", type: "textarea" },
        { name: "dispatchRemarks", label: "Dispatch Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    vendor_bills: [
      { title: "Bill Information", icon: FileText, fields: [
        { name: "vendorBillNo", label: "Vendor Bill No *", type: "text", required: true },
        { name: "billDate", label: "Bill Date *", type: "date", required: true },
        { name: "billType", label: "Bill Type *", type: "select", options: ["Dyeing Bill", "Weaving Bill", "Processing Bill", "Warping Bill", "Sizing Bill"] }
      ]},
      { title: "Vendor Details", icon: Factory, fields: [
        { name: "vendorName", label: "Vendor Name *", type: "select", options: VENDORS },
        { name: "vendorCode", label: "Vendor Code", type: "text" },
        { name: "gstNo", label: "GST No", type: "text" },
        { name: "contactPerson", label: "Contact Person", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "vendorOrderNo", label: "Vendor Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" }
      ]},
      { title: "Material Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Yarn/Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "processedQuantity", label: "Processed Quantity *", type: "number", required: true },
        { name: "approvedQuantity", label: "Approved Quantity *", type: "number", required: true },
        { name: "rejectedQuantity", label: "Rejected Quantity", type: "number" },
        { name: "billableQuantity", label: "Billable Quantity *", type: "number", required: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Commercial Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "processRate", label: "Process Rate *", type: "number", required: true },
        { name: "discount", label: "Discount (%)", type: "number" },
        { name: "taxableAmount", label: "Taxable Amount (Auto)", type: "number", readOnly: true },
        { name: "gstPercent", label: "GST (%) *", type: "select", options: ["5", "12", "18", "28"] },
        { name: "cgst", label: "CGST (Auto)", type: "number", readOnly: true },
        { name: "sgst", label: "SGST (Auto)", type: "number", readOnly: true },
        { name: "igst", label: "IGST (Auto)", type: "number", readOnly: true },
        { name: "additionalCharges", label: "Additional Charges", type: "number" },
        { name: "netAmount", label: "Net Amount (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Payment & Quality Details", icon: ShieldCheck, fields: [
        { name: "paymentTerms", label: "Payment Terms", type: "text" },
        { name: "dueDate", label: "Due Date", type: "date" },
        { name: "advanceAmount", label: "Advance Amount", type: "number" },
        { name: "balanceAmount", label: "Balance Amount (Auto)", type: "number", readOnly: true },
        { name: "paymentStatus", label: "Payment Status", type: "select", options: ["Unpaid", "Partially Paid", "Paid"] },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "inspectionResult", label: "Inspection Result", type: "text" },
        { name: "reworkCharges", label: "Rework Charges", type: "number" },
        { name: "penaltyAmount", label: "Penalty Amount", type: "number" }
      ]},
      { title: "Accounts Details & Approval", icon: Users, fields: [
        { name: "ledgerPostingStatus", label: "Ledger Posting Status", type: "checkbox" },
        { name: "accountsVerifiedBy", label: "Accounts Verified By", type: "select", options: EMPLOYEES },
        { name: "debitCreditNoteStatus", label: "Debit/Credit Note Status", type: "text" },
        { name: "preparedBy", label: "Prepared By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Attachments, Status & Remarks", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Pending Verification", "Approved", "Paid", "Hold"] },
        { name: "vendorInvoiceUpload", label: "Vendor Invoice Link", type: "text" },
        { name: "billCopyUpload", label: "Bill Copy Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "gstDocumentUpload", label: "GST Document Link", type: "text" },
        { name: "accountsRemarks", label: "Accounts Remarks", type: "textarea" },
        { name: "vendorNotes", label: "Vendor Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    printing_bills: [
      { title: "Bill Information", icon: FileText, fields: [
        { name: "printingWashingBillNo", label: "Printing/Washing Bill No *", type: "text", required: true },
        { name: "billDate", label: "Bill Date *", type: "date", required: true },
        { name: "processType", label: "Process Type *", type: "select", options: ["Printing", "Pigment Printing", "Rotary Printing", "Washing", "Bio Wash", "Silicon Wash"] }
      ]},
      { title: "Vendor Details", icon: Factory, fields: [
        { name: "vendorName", label: "Vendor Name *", type: "select", options: VENDORS },
        { name: "vendorCode", label: "Vendor Code", type: "text" },
        { name: "gstNo", label: "GST No", type: "text" }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "processingOrderNo", label: "Processing Order No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "workOrderNo", label: "Work Order No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" }
      ]},
      { title: "Fabric & Process Details", icon: Settings, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" },
        { name: "printType", label: "Print Type", type: "text" },
        { name: "printColorCount", label: "Print Color Count", type: "number" },
        { name: "washType", label: "Wash Type", type: "text" },
        { name: "finishType", label: "Finish Type", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "processedQuantity", label: "Processed Quantity *", type: "number", required: true },
        { name: "rejectedQuantity", label: "Rejected Quantity", type: "number" },
        { name: "billableQuantity", label: "Billable Quantity *", type: "number", required: true },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "Commercial Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "printingWashingRate", label: "Printing/Washing Rate *", type: "number", required: true },
        { name: "colorCharges", label: "Color Charges", type: "number" },
        { name: "screenCharges", label: "Screen Charges", type: "number" },
        { name: "chemicalCharges", label: "Chemical Charges", type: "number" },
        { name: "gstPercent", label: "GST (%) *", type: "select", options: ["5", "12", "18", "28"] },
        { name: "netAmount", label: "Net Amount (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Quality & Delivery Details", icon: ShieldCheck, fields: [
        { name: "shadeMatching", label: "Shade Matching", type: "text" },
        { name: "printQualityResult", label: "Print Quality Result", type: "text" },
        { name: "washQualityResult", label: "Wash Quality Result", type: "text" },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "processCompletionDate", label: "Process Completion Date", type: "date" },
        { name: "deliveryDate", label: "Delivery Date", type: "date" }
      ]},
      { title: "Accounts Details & Approval", icon: Users, fields: [
        { name: "paymentTerms", label: "Payment Terms", type: "text" },
        { name: "dueAmount", label: "Due Amount", type: "number" },
        { name: "paymentStatus", label: "Payment Status", type: "select", options: ["Unpaid", "Paid", "Hold"] },
        { name: "preparedBy", label: "Prepared By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Attachments, Status & Remarks", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Pending Approval", "Approved", "Paid", "Cancelled"] },
        { name: "vendorInvoiceUpload", label: "Vendor Invoice Link", type: "text" },
        { name: "processReportUpload", label: "Process Report Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "processNotes", label: "Process Notes", type: "textarea" },
        { name: "accountsRemarks", label: "Accounts Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    dl_development: [
      { title: "Bill Information", icon: FileText, fields: [
        { name: "dlDevelopmentBillNo", label: "DL Development Bill No *", type: "text", required: true },
        { name: "billDate", label: "Bill Date *", type: "date", required: true },
        { name: "developmentType", label: "Development Type *", type: "select", options: ["Sample Development", "Design Development", "Lab Development"] }
      ]},
      { title: "Party Details & References", icon: Factory, fields: [
        { name: "vendorName", label: "Vendor Name *", type: "select", options: VENDORS },
        { name: "buyerName", label: "Buyer Name *", type: "select", options: BUYERS },
        { name: "merchantName", label: "Merchant Name", type: "select", options: EMPLOYEES },
        { name: "developmentOrderNo", label: "Development Order No", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "sampleRequestNo", label: "Sample Request No", type: "text" },
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" }
      ]},
      { title: "Fabric/Yarn Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "yarnType", label: "Yarn Type", type: "text" },
        { name: "yarnCount", label: "Yarn Count", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Development Details & Quantities", icon: Settings, fields: [
        { name: "sampleType", label: "Sample Type", type: "text" },
        { name: "cadDevelopment", label: "CAD Development", type: "checkbox" },
        { name: "labDipDevelopment", label: "Lab Dip Development", type: "checkbox" },
        { name: "printDevelopment", label: "Print Development", type: "checkbox" },
        { name: "washDevelopment", label: "Wash Development", type: "checkbox" },
        { name: "sampleQuantity", label: "Sample Quantity", type: "number" },
        { name: "developedQuantity", label: "Developed Quantity", type: "number" },
        { name: "approvedQuantity", label: "Approved Quantity", type: "number" },
        { name: "rejectedQuantity", label: "Rejected Quantity", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Pcs", "Kgs"] }
      ]},
      { title: "Commercial Details (Auto-Calculations)", icon: Scale, fields: [
        { name: "developmentCharges", label: "Development Charges", type: "number" },
        { name: "cadCharges", label: "CAD Charges", type: "number" },
        { name: "samplingCharges", label: "Sampling Charges", type: "number" },
        { name: "dyeingCharges", label: "Dyeing Charges", type: "number" },
        { name: "printingCharges", label: "Printing Charges", type: "number" },
        { name: "gstPercent", label: "GST (%) *", type: "select", options: ["5", "12", "18", "28"] },
        { name: "netAmount", label: "Net Amount (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Quality & Delivery Details", icon: ShieldCheck, fields: [
        { name: "sampleApprovalStatus", label: "Sample Approval Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "labDipStatus", label: "Lab Dip Status", type: "text" },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "buyerApprovalStatus", label: "Buyer Approval Status", type: "text" },
        { name: "submissionDate", label: "Submission Date", type: "date" },
        { name: "approvalDate", label: "Approval Date", type: "date" },
        { name: "dispatchDate", label: "Dispatch Date", type: "date" }
      ]},
      { title: "Accounts Details & Approval", icon: Users, fields: [
        { name: "paymentTerms", label: "Payment Terms", type: "text" },
        { name: "dueAmount", label: "Due Amount", type: "number" },
        { name: "paymentStatus", label: "Payment Status", type: "select", options: ["Unpaid", "Paid", "Hold"] },
        { name: "preparedBy", label: "Prepared By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Attachments, Status & Remarks", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Under Development", "Approved", "Paid", "Closed"] },
        { name: "sampleImageUpload", label: "Sample Image Link", type: "text" },
        { name: "developmentSheetUpload", label: "Development Sheet Link", type: "text" },
        { name: "buyerApprovalUpload", label: "Buyer Approval Link", type: "text" },
        { name: "invoiceUpload", label: "Invoice Link", type: "text" },
        { name: "developmentNotes", label: "Development Notes", type: "textarea" },
        { name: "buyerRemarks", label: "Buyer Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    surplus_opening: [
      { title: "Opening Information", icon: FileText, fields: [
        { name: "openingEntryNo", label: "Opening Entry No *", type: "text", required: true },
        { name: "openingDate", label: "Opening Date *", type: "date", required: true },
        { name: "openingType", label: "Opening Type *", type: "select", options: ["Fabric", "Yarn", "Finished Goods"] }
      ]},
      { title: "Stock Details", icon: Database, fields: [
        { name: "stockCategory", label: "Stock Category", type: "text" },
        { name: "stockSource", label: "Stock Source", type: "text" },
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "construction", label: "Construction", type: "text" },
        { name: "composition", label: "Composition", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "openingQuantity", label: "Opening Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs", "Pcs"] },
        { name: "weight", label: "Weight (Kgs)", type: "number" }
      ]},
      { title: "LOT Details", icon: Layers, fields: [
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" }
      ]},
      { title: "Commercial Details", icon: Scale, fields: [
        { name: "estimatedRate", label: "Estimated Rate *", type: "number", required: true },
        { name: "stockValue", label: "Stock Value (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "fabricCondition", label: "Fabric Condition", type: "text" },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "defectStatus", label: "Defect Status", type: "text" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "enteredBy", label: "Entered By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Draft", "Active", "Hold", "Closed"] },
        { name: "stockImageUpload", label: "Stock Image Link", type: "text" },
        { name: "openingSheetUpload", label: "Opening Sheet Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "stockNotes", label: "Stock Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    surplus_report: [
      { title: "Report Information", icon: FileText, fields: [
        { name: "reportNo", label: "Report No *", type: "text", required: true },
        { name: "reportDate", label: "Report Date *", type: "date", required: true },
        { name: "reportType", label: "Report Type *", type: "select", options: ["Current Stock", "Available Stock", "Aging Stock"] }
      ]},
      { title: "Stock Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" },
        { name: "stockCategory", label: "Stock Category", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "availableQuantity", label: "Available Quantity *", type: "number", required: true },
        { name: "reservedQuantity", label: "Reserved Quantity", type: "number" },
        { name: "deliveredQuantity", label: "Delivered Quantity", type: "number" },
        { name: "balanceQuantity", label: "Balance Quantity", type: "number" },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" }
      ]},
      { title: "LOT Details", icon: Layers, fields: [
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" }
      ]},
      { title: "Commercial Details", icon: Scale, fields: [
        { name: "estimatedRate", label: "Estimated Rate *", type: "number", required: true },
        { name: "stockValue", label: "Stock Value (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "fabricCondition", label: "Fabric Condition", type: "text" },
        { name: "defectStatus", label: "Defect Status", type: "text" }
      ]},
      { title: "Aging & Approvals", icon: Users, fields: [
        { name: "stockAge", label: "Stock Age (Days)", type: "number" },
        { name: "slowMovingStatus", label: "Slow Moving Status", type: "checkbox" },
        { name: "deadStockStatus", label: "Dead Stock Status", type: "checkbox" },
        { name: "generatedBy", label: "Generated By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Active", "Reserved", "Delivered", "Closed"] },
        { name: "reportUpload", label: "Report Link", type: "text" },
        { name: "stockSummaryUpload", label: "Stock Summary Link", type: "text" },
        { name: "stockNotes", label: "Stock Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    surplus_download: [
      { title: "Export Information", icon: FileText, fields: [
        { name: "exportNo", label: "Export No *", type: "text", required: true },
        { name: "exportDate", label: "Export Date *", type: "date", required: true },
        { name: "exportType", label: "Export Type *", type: "select", options: ["Full Export", "Filtered Export", "Buyer Wise", "Design Wise"] }
      ]},
      { title: "Filter Details", icon: Search, fields: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        { name: "buyerName", label: "Buyer Name", type: "select", options: BUYERS },
        { name: "designNo", label: "Design No", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "warehouse", label: "Warehouse Location", type: "text" }
      ]},
      { title: "Stock Summary", icon: Scale, fields: [
        { name: "totalQuantity", label: "Total Quantity", type: "number" },
        { name: "totalRollCount", label: "Total Roll Count", type: "number" },
        { name: "totalBaleCount", label: "Total Bale Count", type: "number" },
        { name: "totalStockValue", label: "Total Stock Value", type: "number" }
      ]},
      { title: "Settings & Status", icon: Info, fields: [
        { name: "fileFormat", label: "File Format", type: "select", options: ["Excel", "CSV"] },
        { name: "downloadStatus", label: "Download Status", type: "select", options: ["Pending", "Generated", "Downloaded"] },
        { name: "exportedBy", label: "Exported By *", type: "select", options: EMPLOYEES },
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Generated", "Downloaded"] },
        { name: "excelFileUpload", label: "Excel File Link", type: "text" },
        { name: "exportNotes", label: "Export Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    surplus_report_new: [
      { title: "Report Information", icon: FileText, fields: [
        { name: "reportNo", label: "Report No *", type: "text", required: true },
        { name: "reportDate", label: "Report Date *", type: "date", required: true },
        { name: "reportCategory", label: "Report Category *", type: "select", options: ["Buyer Wise", "Design Wise", "GSM Wise", "Shade Wise"] }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "openingQuantity", label: "Opening Quantity", type: "number" },
        { name: "availableQuantity", label: "Available Quantity *", type: "number", required: true },
        { name: "reservedQuantity", label: "Reserved Quantity", type: "number" },
        { name: "deliveredQuantity", label: "Delivered Quantity", type: "number" },
        { name: "balanceQuantity", label: "Balance Quantity", type: "number" }
      ]},
      { title: "Warehouse Details", icon: Database, fields: [
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" }
      ]},
      { title: "Commercial Details", icon: Scale, fields: [
        { name: "rate", label: "Rate *", type: "number", required: true },
        { name: "stockValue", label: "Stock Value (Auto)", type: "number", readOnly: true },
        { name: "estimatedSalesValue", label: "Estimated Sales Value", type: "number" }
      ]},
      { title: "Quality Details", icon: ShieldCheck, fields: [
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
        { name: "defectStatus", label: "Defect Status", type: "text" },
        { name: "fabricCondition", label: "Fabric Condition", type: "text" }
      ]},
      { title: "Aging Analysis & Approvals", icon: Users, fields: [
        { name: "ageDays", label: "Age Days", type: "number" },
        { name: "fastMoving", label: "Fast Moving", type: "checkbox" },
        { name: "slowMoving", label: "Slow Moving", type: "checkbox" },
        { name: "deadStock", label: "Dead Stock", type: "checkbox" },
        { name: "generatedBy", label: "Generated By *", type: "select", options: EMPLOYEES },
        { name: "reviewedBy", label: "Reviewed By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Active", "Hold", "Sold", "Closed"] },
        { name: "reportUpload", label: "Report Link", type: "text" },
        { name: "analyticsSheetUpload", label: "Analytics Sheet Link", type: "text" },
        { name: "analysisNotes", label: "Analysis Notes", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    surplus_inward: [
      { title: "Inward Information", icon: FileText, fields: [
        { name: "surplusInwardNo", label: "Surplus Inward No *", type: "text", required: true },
        { name: "inwardDate", label: "Inward Date *", type: "date", required: true },
        { name: "inwardType", label: "Inward Type *", type: "select", options: ["Customer Return", "Production Excess", "QC Return", "Dead Stock Return"] }
      ]},
      { title: "Reference Details", icon: FolderKanban, fields: [
        { name: "buyerOrderNo", label: "Buyer Order No", type: "text" },
        { name: "deliveryNo", label: "Delivery No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "inwardQuantity", label: "Inward Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "weight", label: "Weight (Kgs)", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "LOT Details", icon: Layers, fields: [
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" },
        { name: "rollNo", label: "Roll No", type: "text" }
      ]},
      { title: "Quality & Warehouse", icon: ShieldCheck, fields: [
        { name: "fabricCondition", label: "Fabric Condition", type: "text" },
        { name: "qcStatus", label: "QC Status", type: "select", options: ["Pending QC", "Approved", "Hold"] },
        { name: "defectStatus", label: "Defect Status", type: "text" },
        { name: "warehouseLocation", label: "Warehouse Location", type: "text" },
        { name: "rackNo", label: "Rack No", type: "text" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "receivedBy", label: "Received By *", type: "select", options: EMPLOYEES },
        { name: "qcApprovedBy", label: "QC Approved By *", type: "select", options: EMPLOYEES },
        { name: "storeApprovedBy", label: "Store Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending QC", "Approved", "Stock Updated", "Hold"] },
        { name: "inwardChallanUpload", label: "Inward Challan Link", type: "text" },
        { name: "fabricImageUpload", label: "Fabric Image Link", type: "text" },
        { name: "qcReportUpload", label: "QC Report Link", type: "text" },
        { name: "stockNotes", label: "Stock Notes", type: "textarea" },
        { name: "qcRemarks", label: "QC Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    surplus_delivery: [
      { title: "Delivery Information", icon: FileText, fields: [
        { name: "surplusDeliveryNo", label: "Surplus Delivery No *", type: "text", required: true },
        { name: "deliveryDate", label: "Delivery Date *", type: "date", required: true },
        { name: "deliveryType", label: "Delivery Type *", type: "select", options: ["Sales", "Transfer", "Clearance"] }
      ]},
      { title: "Customer Details & References", icon: Factory, fields: [
        { name: "customerName", label: "Customer Name *", type: "select", options: BUYERS },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "deliveryAddress", label: "Delivery Address", type: "textarea" },
        { name: "salesOrderNo", label: "Sales Order No", type: "text" },
        { name: "invoiceNo", label: "Invoice No", type: "text" },
        { name: "challanNo", label: "Challan No", type: "text" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Quantity Details", icon: Scale, fields: [
        { name: "deliveredQuantity", label: "Delivered Quantity *", type: "number", required: true },
        { name: "rollCount", label: "Roll Count", type: "number" },
        { name: "baleCount", label: "Bale Count", type: "number" },
        { name: "balanceQuantity", label: "Balance Quantity", type: "number" },
        { name: "uom", label: "UOM *", type: "select", options: ["Meters", "Yards", "Kgs"] }
      ]},
      { title: "LOT Details", icon: Layers, fields: [
        { name: "lotNo", label: "LOT No", type: "text" },
        { name: "batchNo", label: "Batch No", type: "text" },
        { name: "baleNo", label: "Bale No", type: "text" }
      ]},
      { title: "Commercial Details", icon: Scale, fields: [
        { name: "saleRate", label: "Sale Rate *", type: "number", required: true },
        { name: "discount", label: "Discount (%)", type: "number" },
        { name: "netAmount", label: "Net Amount (Auto)", type: "number", readOnly: true }
      ]},
      { title: "Transport Details", icon: Truck, fields: [
        { name: "transportName", label: "Transport Name", type: "text" },
        { name: "vehicleNo", label: "Vehicle No", type: "text" },
        { name: "lrNo", label: "LR No", type: "text" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "deliveredBy", label: "Delivered By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["Pending", "Dispatched", "Delivered", "Closed"] },
        { name: "deliveryChallanUpload", label: "Delivery Challan Link", type: "text" },
        { name: "invoiceUpload", label: "Invoice Link", type: "text" },
        { name: "transportReceiptUpload", label: "Transport Receipt Link", type: "text" },
        { name: "deliveryNotes", label: "Delivery Notes", type: "textarea" },
        { name: "customerRemarks", label: "Customer Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ],
    customer_hanger: [
      { title: "Enquiry Information", icon: FileText, fields: [
        { name: "enquiryNo", label: "Enquiry No *", type: "text", required: true },
        { name: "enquiryDate", label: "Enquiry Date *", type: "date", required: true },
        { name: "enquiryType", label: "Enquiry Type *", type: "select", options: ["Hanger Request", "Sample Request", "Swatch Request"] }
      ]},
      { title: "Customer Details", icon: Factory, fields: [
        { name: "customerName", label: "Customer Name *", type: "select", options: BUYERS },
        { name: "contactPerson", label: "Contact Person", type: "text" },
        { name: "mobileNo", label: "Mobile No", type: "text" },
        { name: "emailId", label: "Email ID", type: "text" },
        { name: "address", label: "Address", type: "textarea" }
      ]},
      { title: "Fabric Details", icon: Scissors, fields: [
        { name: "fabricName", label: "Fabric Name", type: "text" },
        { name: "designNo", label: "Design No *", type: "select", options: DESIGNS },
        { name: "fabricType", label: "Fabric Type", type: "text" },
        { name: "gsm", label: "GSM", type: "number" },
        { name: "width", label: "Width (Inch)", type: "number" },
        { name: "shade", label: "Shade", type: "text" }
      ]},
      { title: "Sample Details & Sales", icon: Settings, fields: [
        { name: "hangerQuantity", label: "Hanger Quantity", type: "number" },
        { name: "sampleSize", label: "Sample Size", type: "text" },
        { name: "dispatchMethod", label: "Dispatch Method", type: "text" },
        { name: "requiredDate", label: "Required Date", type: "date" },
        { name: "salesExecutive", label: "Sales Executive *", type: "select", options: EMPLOYEES },
        { name: "followUpDate", label: "Follow-up Date", type: "date" },
        { name: "priorityLevel", label: "Priority Level *", type: "select", options: ["Low", "Medium", "High"] }
      ]},
      { title: "Dispatch Details", icon: Truck, fields: [
        { name: "courierName", label: "Courier Name", type: "text" },
        { name: "trackingNo", label: "Tracking No", type: "text" },
        { name: "dispatchDate", label: "Dispatch Date", type: "date" }
      ]},
      { title: "Approval Details", icon: Users, fields: [
        { name: "enteredBy", label: "Entered By *", type: "select", options: EMPLOYEES },
        { name: "verifiedBy", label: "Verified By *", type: "select", options: EMPLOYEES },
        { name: "approvedBy", label: "Approved By *", type: "select", options: EMPLOYEES }
      ]},
      { title: "Status & Attachments", icon: Info, fields: [
        { name: "status", label: "Status *", type: "select", options: ["New Enquiry", "Sample Sent", "Follow-up Pending", "Converted", "Closed"] },
        { name: "fabricImageUpload", label: "Fabric Image Link", type: "text" },
        { name: "hangerImageUpload", label: "Hanger Image Link", type: "text" },
        { name: "customerRequirementUpload", label: "Customer Requirement Link", type: "text" },
        { name: "customerNotes", label: "Customer Notes", type: "textarea" },
        { name: "salesRemarks", label: "Sales Remarks", type: "textarea" },
        { name: "internalNotes", label: "Internal Notes", type: "textarea" }
      ]}
    ]
  };

  // =========================================================================
  // ACTIONS HANDLERS
  // =========================================================================
  const handleOpenPage = (p) => {
    if (p.isLink) {
      navigate(p.route);
    } else {
      setActivePage(p.key);
      setIsFormOpen(false);
      navigate(`?tab=${p.key}`, { replace: true });
    }
  };

  const handleCreateNew = () => {
    let nextId = '';
    const dateToday = new Date().toISOString().substring(0, 10);
    let initialFields = { date: dateToday, status: 'Draft' };

    if (activePage === 'design_upload') {
      nextId = `DUP-FAB-${designs.length + 101}`;
      initialFields = {
        designUploadNo: nextId,
        uploadDate: dateToday,
        uploadType: 'CAD',
        designNo: '',
        designName: '',
        patternType: 'Stripes',
        collectionName: '',
        season: 'Summer 2026',
        buyerName: BUYERS[0],
        buyerDesignRef: '',
        merchantName: '',
        fabricType: 'Cotton Finished',
        construction: '',
        composition: '100% Cotton',
        gsm: '150',
        width: '58',
        groundColor: 'Navy Blue',
        designColor: 'White',
        pantoneCode: '19-4052 TCX',
        repeatSize: '',
        weaveType: 'Twill',
        printType: 'None',
        finishType: 'Soft Finish',
        cadFileUpload: '',
        designImageUpload: '',
        refImageUpload: '',
        techSheetUpload: '',
        uploadedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Draft',
        designNotes: '',
        buyerRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'cloth_checking') {
      nextId = `CHK-FAB-${clothCheckings.length + 101}`;
      initialFields = {
        clothCheckingNo: nextId,
        checkingDate: dateToday,
        shift: SHIFTS[0],
        checkerName: '',
        buyerOrderNo: '',
        workOrderNo: '',
        rollNo: '',
        batchNo: '',
        lotNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        gsm: '',
        width: '',
        shade: 'A',
        rollLength: '100',
        checkedQuantity: '0',
        passedQuantity: '100',
        rejectedQuantity: '0',
        balanceQuantity: '100',
        holeDefects: '0',
        stainDefects: '0',
        shadeVariation: '0',
        weavingDefects: '0',
        oilMarks: '0',
        printDefects: '0',
        gsmCheck: 'Ok',
        widthCheck: 'Ok',
        shrinkageCheck: 'Normal',
        colorFastness: 'Good',
        handFeelCheck: 'Soft',
        totalDefectPoints: '0',
        defectGrade: 'A Grade',
        reworkRequired: false,
        qcStatus: 'Pending QC',
        inspectionResult: 'Passed',
        finalApprovalStatus: 'Pending',
        checkedBy: EMPLOYEES[0],
        qcApprovedBy: EMPLOYEES[1],
        productionApprovedBy: EMPLOYEES[2],
        status: 'Pending',
        fabricImageUpload: '',
        qcReportUpload: '',
        inspectionSheetUpload: '',
        qcRemarks: '',
        defectNotes: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'lot_completion') {
      nextId = `LTC-FAB-${lotCompletions.length + 101}`;
      initialFields = {
        lotCompletionNo: nextId,
        completionDate: dateToday,
        completionType: 'Production Completion',
        lotNo: '',
        batchNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        gsm: '',
        width: '',
        shade: 'A',
        totalLotQuantity: '1000',
        passedQuantity: '1000',
        rejectedQuantity: '0',
        balanceQuantity: '0',
        rollCount: '10',
        baleCount: '2',
        processCompletionStatus: 'Completed',
        finalProcessName: 'Sanforizing',
        completionPercentage: '100',
        qcStatus: 'Pending QC',
        finalInspectionResult: 'Pass',
        shadeMatchingStatus: '100% Match',
        shrinkageResult: 'Ok',
        defectStatus: 'None',
        warehouseLocation: 'Bld A - Sect 2',
        rackNo: 'R-14',
        readyForDispatch: true,
        dispatchReadyDate: dateToday,
        deliveryStatus: 'Ready',
        completedBy: EMPLOYEES[0],
        qcApprovedBy: EMPLOYEES[1],
        storeApprovedBy: EMPLOYEES[2],
        status: 'Pending QC',
        lotReportUpload: '',
        qcReportUpload: '',
        fabricImageUpload: '',
        completionNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'cloth_inward') {
      nextId = `CIN-FAB-${clothInwards.length + 101}`;
      initialFields = {
        clothInwardNo: nextId,
        inwardDate: dateToday,
        inwardType: 'Purchase',
        supplierName: BUYERS[0],
        vendorCode: '',
        contactPerson: '',
        vehicleNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        poNo: '',
        challanNo: '',
        invoiceNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        composition: '100% Cotton',
        gsm: '',
        width: '',
        shade: 'A',
        orderedQuantity: '1000',
        receivedQuantity: '1000',
        shortQuantity: '0',
        excessQuantity: '0',
        rejectedQuantity: '0',
        rollCount: '10',
        baleCount: '2',
        uom: 'Meters',
        rollNo: '',
        baleNo: '',
        lotNo: '',
        batchNo: '',
        fabricCondition: 'Good',
        qcStatus: 'Pending QC',
        inspectionResult: 'Passed',
        shadeMatching: '100% Match',
        widthCheck: 'Ok',
        gsmCheck: 'Ok',
        defectPoints: '0',
        warehouseLocation: 'Warehouse B',
        rackNo: 'R-05',
        stockUpdatedStatus: true,
        dispatchDate: dateToday,
        receivedDate: dateToday,
        delayDays: '0',
        receivedBy: EMPLOYEES[0],
        qcApprovedBy: EMPLOYEES[1],
        storeApprovedBy: EMPLOYEES[2],
        status: 'Pending QC',
        invoiceUpload: '',
        challanUpload: '',
        fabricImageUpload: '',
        qcReportUpload: '',
        qcRemarks: '',
        vendorRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'cloth_purchase_bill') {
      nextId = `CPB-FAB-${purchaseBills.length + 101}`;
      initialFields = {
        purchaseBillNo: nextId,
        billDate: dateToday,
        billType: 'Local Purchase',
        supplierName: BUYERS[0],
        supplierCode: '',
        gstNo: '',
        contactPerson: '',
        clothPurchaseOrderNo: '',
        invoiceNo: '',
        grnNo: '',
        buyerOrderNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        gsm: '',
        width: '',
        shade: 'A',
        purchasedQuantity: '1000',
        receivedQuantity: '1000',
        billQuantity: '1000',
        rollCount: '10',
        baleCount: '2',
        uom: 'Meters',
        purchaseRate: '150',
        discount: '0',
        taxableAmount: '150000',
        gstPercent: '5',
        cgst: '3750',
        sgst: '3750',
        igst: '7500',
        freightCharges: '0',
        otherCharges: '0',
        netAmount: '157500',
        paymentTerms: '30 Days',
        dueDate: dateToday,
        advanceAmount: '0',
        balanceAmount: '157500',
        paymentStatus: 'Unpaid',
        accountsVerifiedBy: EMPLOYEES[0],
        ledgerPostingStatus: true,
        debitCreditNoteStatus: 'None',
        qcStatus: 'QC Approved',
        inspectionResult: 'Passed',
        rejectedQuantity: '0',
        preparedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Draft',
        supplierInvoiceUpload: '',
        purchaseBillUpload: '',
        qcReportUpload: '',
        gstDocumentUpload: '',
        accountsRemarks: '',
        purchaseNotes: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'del_pcwise') {
      nextId = `DPC-FAB-${pcWiseDeliveries.length + 101}`;
      initialFields = {
        clothDeliveryNo: nextId,
        deliveryDate: dateToday,
        deliveryType: 'Customer Delivery',
        customerVendorName: BUYERS[0],
        contactPerson: '',
        deliveryAddress: '',
        buyerOrderNo: '',
        workOrderNo: '',
        challanNo: '',
        invoiceNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        gsm: '',
        width: '',
        shade: 'A',
        pieceNo: '',
        rollNo: '',
        lotNo: '',
        batchNo: '',
        rollLength: '100',
        deliveredQuantity: '100',
        balanceQuantity: '0',
        rollCount: '1',
        uom: 'Meters',
        packingType: 'Roll Packing',
        baleNo: '',
        netWeight: '',
        grossWeight: '',
        transportName: '',
        vehicleNo: '',
        driverName: '',
        lrNo: '',
        dispatchQcStatus: 'QC Passed',
        finalInspectionResult: 'Passed',
        fabricCondition: 'Good',
        dispatchTime: '12:00 PM',
        expectedDeliveryDate: dateToday,
        deliveryStatus: 'Pending',
        deliveredBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Pending',
        deliveryChallanUpload: '',
        fabricImageUpload: '',
        dispatchReceiptUpload: '',
        deliveryNotes: '',
        transportRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'm2m_delivery') {
      nextId = `M2M-FAB-${m2mDeliveries.length + 101}`;
      initialFields = {
        millTransferNo: nextId,
        transferDate: dateToday,
        transferType: 'Dyeing',
        fromMillName: 'Mill A - Weaving Unit',
        fromWarehouse: 'Weaving Warehouse',
        fromContactPerson: '',
        toMillName: 'Mill B - Dyeing Unit',
        toProcessingUnit: 'Dyeing Processors Ltd',
        toContactPerson: '',
        buyerOrderNo: '',
        workOrderNo: '',
        challanNo: '',
        transferReferenceNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        gsm: '',
        width: '',
        shade: 'A',
        transferQuantity: '1500',
        rollCount: '15',
        baleCount: '0',
        balanceQuantity: '0',
        uom: 'Meters',
        lotNo: '',
        batchNo: '',
        baleNo: '',
        rollNo: '',
        currentProcess: 'Sizing',
        nextProcess: 'Dyeing',
        processInstructions: '',
        transportName: '',
        vehicleNo: '',
        driverName: '',
        lrNo: '',
        qcStatus: 'QC Passed',
        fabricCondition: 'Good',
        inspectionStatus: 'Passed',
        dispatchDate: dateToday,
        expectedArrivalDate: dateToday,
        deliveryStatus: 'Pending',
        dispatchBy: EMPLOYEES[0],
        receivedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Pending',
        transferChallanUpload: '',
        qcReportUpload: '',
        fabricImageUpload: '',
        transferNotes: '',
        processRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'bale_delivery') {
      nextId = `BDL-FAB-${baleDeliveries.length + 101}`;
      initialFields = {
        baleDeliveryNo: nextId,
        deliveryDate: dateToday,
        dispatchType: 'Customer Dispatch',
        customerName: BUYERS[0],
        deliveryAddress: '',
        contactPerson: '',
        buyerOrderNo: '',
        workOrderNo: '',
        challanNo: '',
        invoiceNo: '',
        baleNo: '',
        baleWeight: '150',
        rollCount: '10',
        netWeight: '145',
        grossWeight: '150',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        gsm: '',
        width: '',
        shade: 'A',
        totalQuantity: '1000',
        deliveredQuantity: '1000',
        pendingQuantity: '0',
        uom: 'Meters',
        packingType: 'Standard Bale',
        packingMaterial: 'Gunny Bags',
        labelNo: '',
        barcodeNo: '',
        transportName: '',
        vehicleNo: '',
        driverName: '',
        lrNo: '',
        dispatchQcStatus: 'QC Passed',
        baleCondition: 'Good',
        damageStatus: 'No Damage',
        dispatchDate: dateToday,
        expectedDeliveryDate: dateToday,
        deliveryStatus: 'Pending',
        packedBy: EMPLOYEES[0],
        deliveredBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Pending',
        deliveryChallanUpload: '',
        baleImageUpload: '',
        transportReceiptUpload: '',
        dispatchNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'lot_approval') {
      nextId = `LAP-FAB-${lotApprovals.length + 101}`;
      initialFields = {
        lotApprovalNo: nextId,
        approvalDate: dateToday,
        approvalType: 'Production Approval',
        lotNo: '',
        batchNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        gsm: '',
        width: '',
        shade: 'A',
        totalLotQuantity: '2000',
        passedQuantity: '2000',
        rejectedQuantity: '0',
        balanceQuantity: '0',
        rollCount: '20',
        baleCount: '4',
        uom: 'Meters',
        processCompleted: true,
        finalProcessName: 'Sanforizing',
        completionStatus: 'Completed',
        qcStatus: 'Pending QC',
        inspectionResult: 'Passed',
        shadeMatching: '100% Match',
        gsmResult: 'Ok',
        widthResult: 'Ok',
        shrinkageResult: 'Ok',
        defectPoints: '0',
        warehouseLocation: 'Warehouse A',
        rackNo: 'R-12',
        readyForPackingStatus: true,
        checkedBy: EMPLOYEES[0],
        qcApprovedBy: EMPLOYEES[1],
        storeApprovedBy: EMPLOYEES[2],
        status: 'Pending QC',
        qcReportUpload: '',
        lotSheetUpload: '',
        fabricImageUpload: '',
        qcRemarks: '',
        productionNotes: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'bale_amend') {
      nextId = `BAM-FAB-${baleAmends.length + 101}`;
      initialFields = {
        baleAmendmentNo: nextId,
        amendmentDate: dateToday,
        amendmentType: 'Weight Correction',
        baleNo: '',
        packingNo: '',
        lotNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        oldBaleWeight: '150',
        oldRollCount: '10',
        oldQuantity: '1000',
        oldBarcodeNo: '',
        newBaleWeight: '150',
        newRollCount: '10',
        newQuantity: '1000',
        newBarcodeNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        gsm: '',
        width: '',
        shade: 'A',
        previousQuantity: '1000',
        revisedQuantity: '1000',
        differenceQuantity: '0',
        uom: 'Meters',
        amendmentReason: 'QC Correction',
        recheckRequired: false,
        qcVerificationStatus: 'Pending Verification',
        damageStatus: 'No Damage',
        requestedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Draft',
        baleImageUpload: '',
        amendmentSheetUpload: '',
        qcReportUpload: '',
        amendmentNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'bale_packing') {
      nextId = `BPK-FAB-${balePackings.length + 101}`;
      initialFields = {
        balePackingNo: nextId,
        packingDate: dateToday,
        packingType: 'Bale Packing',
        buyerOrderNo: '',
        workOrderNo: '',
        lotNo: '',
        batchNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        gsm: '',
        width: '',
        shade: 'A',
        baleNo: '',
        rollCount: '10',
        pieceCount: '10',
        netWeight: '145',
        grossWeight: '150',
        totalQuantity: '3000',
        packedQuantity: '3000',
        balanceQuantity: '0',
        uom: 'Meters',
        packingMaterial: 'Gunny Bags',
        packingMethod: 'Standard Bale Pressing',
        labelNo: '',
        barcodeNo: '',
        tagNo: '',
        warehouseLocation: 'Warehouse B',
        rackNo: 'R-08',
        readyForDispatchStatus: true,
        packingQcStatus: 'QC Approved',
        baleCondition: 'Good',
        finalInspectionResult: 'Passed',
        dispatchReadyDate: dateToday,
        transportPreparationStatus: 'Pending',
        packedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Pending',
        baleImageUpload: '',
        packingLabelUpload: '',
        qcReportUpload: '',
        packingNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'pl_checking') {
      nextId = `PLC-FAB-${plCheckings.length + 101}`;
      initialFields = {
        packinglistCheckingNo: nextId,
        checkingDate: dateToday,
        checkingType: 'Domestic',
        packingListNo: '',
        invoiceNo: '',
        buyerOrderNo: '',
        deliveryNo: '',
        customerName: BUYERS[0],
        destination: '',
        shipmentMode: 'Road Transport',
        fabricName: '',
        designNo: DESIGNS[0],
        gsm: '',
        width: '',
        shade: 'A',
        baleCount: '5',
        rollCount: '50',
        pieceCount: '50',
        packedQuantity: '3000',
        uom: 'Meters',
        barcodeVerification: true,
        labelVerification: true,
        quantityVerification: true,
        weightVerification: true,
        packingStandardVerification: true,
        qcStatus: 'Approved',
        inspectionResult: 'Passed',
        damageStatus: 'No Damage',
        missingItemStatus: false,
        containerNo: '',
        vehicleNo: '',
        transportName: '',
        lrNo: '',
        checkedBy: EMPLOYEES[0],
        qcApprovedBy: EMPLOYEES[1],
        dispatchApprovedBy: EMPLOYEES[2],
        status: 'Pending',
        packingListUpload: '',
        qcReportUpload: '',
        dispatchDocumentUpload: '',
        checkingNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'goods_release') {
      nextId = `GRA-FAB-${goodsReleaseAdvices.length + 101}`;
      initialFields = {
        goodsReleaseAdviceNo: nextId,
        releaseDate: dateToday,
        releaseType: 'Sales Dispatch',
        customerVendorName: BUYERS[0],
        contactPerson: '',
        deliveryAddress: '',
        buyerOrderNo: '',
        workOrderNo: '',
        invoiceNo: '',
        deliveryChallanNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        construction: '',
        gsm: '',
        width: '',
        shade: 'A',
        approvedQuantity: '3000',
        releasedQuantity: '3000',
        balanceQuantity: '0',
        rollCount: '30',
        baleCount: '6',
        uom: 'Meters',
        lotNo: '',
        batchNo: '',
        baleNo: '',
        rollNo: '',
        warehouseLocation: 'Warehouse A',
        rackNo: 'R-03',
        stockAvailabilityStatus: 'Available',
        qcStatus: 'QC Approved',
        finalInspectionResult: 'Passed',
        releaseApprovalStatus: 'Approved',
        dispatchDate: dateToday,
        dispatchLocation: '',
        transportPreparationStatus: 'Ready',
        requestedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Approved',
        releaseAdviceUpload: '',
        qcReportUpload: '',
        dispatchDocumentUpload: '',
        dispatchNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'gate_pass') {
      nextId = `GTP-FAB-${gatePasses.length + 101}`;
      initialFields = {
        gatePassNo: nextId,
        gatePassDate: dateToday,
        gatePassType: 'Outward',
        customerVendorName: BUYERS[0],
        contactPerson: '',
        vehicleNo: '',
        driverName: '',
        buyerOrderNo: '',
        workOrderNo: '',
        invoiceNo: '',
        challanNo: '',
        deliveryNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        gsm: '',
        width: '',
        shade: 'A',
        quantity: '3000',
        rollCount: '30',
        baleCount: '6',
        netWeight: '1450',
        grossWeight: '1500',
        uom: 'Meters',
        lotNo: '',
        batchNo: '',
        baleNo: '',
        rollNo: '',
        fromLocation: 'Warehouse A',
        toLocation: 'Raymond Gate 1',
        purposeOfMovement: 'Sales Order Delivery',
        returnableStatus: 'Non-Returnable',
        transportName: '',
        driverMobileNo: '',
        lrNo: '',
        securityCheckedBy: 'Guard Senthil',
        materialVerificationStatus: 'Match',
        exitTime: '10:00 AM',
        entryTime: '',
        preparedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Approved',
        gatePassCopyUpload: '',
        invoiceUpload: '',
        vehicleDocumentUpload: '',
        securityNotes: '',
        dispatchRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'vendor_bills') {
      nextId = `VBL-FAB-${vendorBills.length + 101}`;
      initialFields = {
        vendorBillNo: nextId,
        billDate: dateToday,
        billType: 'Processing Bill',
        vendorName: VENDORS[0],
        vendorCode: 'VND-301',
        gstNo: '33AAACD1234F1Z1',
        contactPerson: 'Ramanathan',
        vendorOrderNo: '',
        workOrderNo: '',
        buyerOrderNo: '',
        challanNo: '',
        invoiceNo: '',
        fabricName: 'Cotton Satin',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        gsm: '160',
        width: '58',
        shade: 'A',
        processedQuantity: '1000',
        approvedQuantity: '1000',
        rejectedQuantity: '0',
        billableQuantity: '1000',
        uom: 'Meters',
        processRate: '25',
        discount: '0',
        taxableAmount: '25000.00',
        gstPercent: '5',
        cgst: '625.00',
        sgst: '625.00',
        igst: '0.00',
        additionalCharges: '0',
        netAmount: '26250.00',
        paymentTerms: '30 Days',
        dueDate: dateToday,
        advanceAmount: '0',
        balanceAmount: '26250.00',
        paymentStatus: 'Unpaid',
        qcStatus: 'Approved',
        inspectionResult: 'Passed',
        reworkCharges: '0',
        penaltyAmount: '0',
        ledgerPostingStatus: true,
        accountsVerifiedBy: EMPLOYEES[1],
        debitCreditNoteStatus: 'None',
        preparedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Draft',
        vendorInvoiceUpload: '',
        billCopyUpload: '',
        qcReportUpload: '',
        gstDocumentUpload: '',
        accountsRemarks: '',
        vendorNotes: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'printing_bills') {
      nextId = `PRB-FAB-${printingBills.length + 101}`;
      initialFields = {
        printingWashingBillNo: nextId,
        billDate: dateToday,
        processType: 'Printing',
        vendorName: VENDORS[0],
        vendorCode: 'VND-302',
        gstNo: '33AAACD1234F1Z1',
        processingOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        challanNo: '',
        fabricName: 'Cotton Twill',
        designNo: DESIGNS[0],
        fabricType: 'Woven',
        gsm: '180',
        width: '58',
        shade: 'B',
        printType: 'Pigment Print',
        printColorCount: '4',
        washType: 'Silicon Wash',
        finishType: 'Soft Finish',
        processedQuantity: '1500',
        rejectedQuantity: '0',
        billableQuantity: '1500',
        uom: 'Meters',
        printingWashingRate: '35',
        colorCharges: '0',
        screenCharges: '0',
        chemicalCharges: '0',
        gstPercent: '5',
        netAmount: '55125.00',
        shadeMatching: '100% Match',
        printQualityResult: 'Passed',
        washQualityResult: 'Passed',
        qcStatus: 'Approved',
        processCompletionDate: dateToday,
        deliveryDate: dateToday,
        paymentTerms: '30 Days',
        dueAmount: '55125.00',
        paymentStatus: 'Unpaid',
        preparedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Draft',
        vendorInvoiceUpload: '',
        processReportUpload: '',
        qcReportUpload: '',
        processNotes: '',
        accountsRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'dl_development') {
      nextId = `DLB-FAB-${dlDevelopmentBills.length + 101}`;
      initialFields = {
        dlDevelopmentBillNo: nextId,
        billDate: dateToday,
        developmentType: 'Sample Development',
        vendorName: VENDORS[0],
        buyerName: BUYERS[0],
        merchantName: EMPLOYEES[0],
        developmentOrderNo: '',
        designNo: DESIGNS[0],
        sampleRequestNo: '',
        buyerOrderNo: '',
        fabricName: 'Cotton Chambray',
        yarnType: 'Cotton Combed',
        yarnCount: '40s',
        gsm: '120',
        width: '58',
        shade: 'C',
        sampleType: 'Yardage Sample',
        cadDevelopment: true,
        labDipDevelopment: true,
        printDevelopment: false,
        washDevelopment: false,
        sampleQuantity: '10',
        developedQuantity: '10',
        approvedQuantity: '10',
        rejectedQuantity: '0',
        uom: 'Meters',
        developmentCharges: '5000',
        cadCharges: '1500',
        samplingCharges: '2000',
        dyeingCharges: '1000',
        printingCharges: '0',
        gstPercent: '18',
        netAmount: '11210.00',
        sampleApprovalStatus: 'Approved',
        labDipStatus: 'Passed',
        qcStatus: 'Approved',
        buyerApprovalStatus: 'Approved',
        submissionDate: dateToday,
        approvalDate: dateToday,
        dispatchDate: dateToday,
        paymentTerms: 'Immediate',
        dueAmount: '11210.00',
        paymentStatus: 'Unpaid',
        preparedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Draft',
        sampleImageUpload: '',
        developmentSheetUpload: '',
        buyerApprovalUpload: '',
        invoiceUpload: '',
        developmentNotes: '',
        buyerRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'surplus_opening') {
      nextId = `SOP-FAB-${surplusOpening.length + 101}`;
      initialFields = {
        openingEntryNo: nextId,
        openingDate: dateToday,
        openingType: 'Fabric',
        stockCategory: 'Surplus',
        stockSource: 'Internal Production',
        warehouseLocation: 'Warehouse A',
        rackNo: 'R-12',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven Cotton',
        construction: '',
        composition: '100% Cotton',
        gsm: '160',
        width: '58',
        shade: 'Off-White',
        openingQuantity: '1000',
        rollCount: '20',
        baleCount: '2',
        uom: 'Meters',
        weight: '150',
        lotNo: '',
        batchNo: '',
        baleNo: '',
        rollNo: '',
        estimatedRate: '120',
        stockValue: '120000.00',
        fabricCondition: 'Good',
        qcStatus: 'Approved',
        defectStatus: 'Nil',
        enteredBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Draft',
        stockImageUpload: '',
        openingSheetUpload: '',
        qcReportUpload: '',
        stockNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'surplus_report') {
      nextId = `SRP-FAB-${surplusReports.length + 101}`;
      initialFields = {
        reportNo: nextId,
        reportDate: dateToday,
        reportType: 'Current Stock',
        warehouseLocation: 'Warehouse A',
        rackNo: 'R-12',
        stockCategory: 'Surplus',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: 'Woven Cotton',
        gsm: '160',
        width: '58',
        shade: 'Off-White',
        availableQuantity: '800',
        reservedQuantity: '100',
        deliveredQuantity: '100',
        balanceQuantity: '800',
        rollCount: '16',
        baleCount: '2',
        lotNo: '',
        batchNo: '',
        baleNo: '',
        estimatedRate: '120',
        stockValue: '96000.00',
        qcStatus: 'Approved',
        fabricCondition: 'Good',
        defectStatus: 'Nil',
        stockAge: '15',
        slowMovingStatus: false,
        deadStockStatus: false,
        generatedBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        status: 'Active',
        reportUpload: '',
        stockSummaryUpload: '',
        stockNotes: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'surplus_download') {
      nextId = `SED-FAB-${surplusDownloads.length + 101}`;
      initialFields = {
        exportNo: nextId,
        exportDate: dateToday,
        exportType: 'Full Export',
        fromDate: dateToday,
        toDate: dateToday,
        buyerName: BUYERS[0],
        designNo: DESIGNS[0],
        fabricType: '',
        warehouse: 'Warehouse A',
        totalQuantity: '1000',
        totalRollCount: '20',
        totalBaleCount: '2',
        totalStockValue: '120000.00',
        fileFormat: 'Excel',
        downloadStatus: 'Pending',
        exportedBy: EMPLOYEES[0],
        status: 'Pending',
        excelFileUpload: '',
        exportNotes: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'surplus_report_new') {
      nextId = `SRN-FAB-${surplusReportsNew.length + 101}`;
      initialFields = {
        reportNo: nextId,
        reportDate: dateToday,
        reportCategory: 'Buyer Wise',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: '',
        gsm: '',
        width: '',
        shade: '',
        openingQuantity: '1000',
        availableQuantity: '800',
        reservedQuantity: '100',
        deliveredQuantity: '100',
        balanceQuantity: '800',
        warehouseLocation: 'Warehouse A',
        rackNo: 'R-12',
        rate: '120',
        stockValue: '96000.00',
        estimatedSalesValue: '96000.00',
        qcStatus: 'Approved',
        defectStatus: 'Nil',
        fabricCondition: 'Good',
        ageDays: '20',
        fastMoving: true,
        slowMoving: false,
        deadStock: false,
        generatedBy: EMPLOYEES[0],
        reviewedBy: EMPLOYEES[1],
        status: 'Active',
        reportUpload: '',
        analyticsSheetUpload: '',
        analysisNotes: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'surplus_inward') {
      nextId = `SIW-FAB-${surplusInwards.length + 101}`;
      initialFields = {
        surplusInwardNo: nextId,
        inwardDate: dateToday,
        inwardType: 'Customer Return',
        buyerOrderNo: '',
        deliveryNo: '',
        invoiceNo: '',
        challanNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: '',
        gsm: '',
        width: '',
        shade: '',
        inwardQuantity: '500',
        rollCount: '10',
        baleCount: '1',
        weight: '80',
        uom: 'Meters',
        lotNo: '',
        batchNo: '',
        baleNo: '',
        rollNo: '',
        fabricCondition: 'Good',
        qcStatus: 'Pending QC',
        defectStatus: 'Nil',
        warehouseLocation: 'Warehouse A',
        rackNo: 'R-12',
        receivedBy: EMPLOYEES[0],
        qcApprovedBy: EMPLOYEES[1],
        storeApprovedBy: EMPLOYEES[2],
        status: 'Pending QC',
        inwardChallanUpload: '',
        fabricImageUpload: '',
        qcReportUpload: '',
        stockNotes: '',
        qcRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'surplus_delivery') {
      nextId = `SDE-FAB-${surplusDeliveries.length + 101}`;
      initialFields = {
        surplusDeliveryNo: nextId,
        deliveryDate: dateToday,
        deliveryType: 'Sales',
        customerName: BUYERS[0],
        contactPerson: '',
        deliveryAddress: '',
        salesOrderNo: '',
        invoiceNo: '',
        challanNo: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: '',
        gsm: '',
        width: '',
        shade: '',
        deliveredQuantity: '500',
        rollCount: '10',
        baleCount: '1',
        balanceQuantity: '0',
        uom: 'Meters',
        lotNo: '',
        batchNo: '',
        baleNo: '',
        saleRate: '135',
        discount: '0',
        netAmount: '67500.00',
        transportName: 'Dinesh Transport',
        vehicleNo: 'TN-37-BY-1234',
        lrNo: 'LR-98765',
        deliveredBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'Pending',
        deliveryChallanUpload: '',
        invoiceUpload: '',
        transportReceiptUpload: '',
        deliveryNotes: '',
        customerRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'customer_hanger') {
      nextId = `HNG-FAB-${customerHangers.length + 101}`;
      initialFields = {
        enquiryNo: nextId,
        enquiryDate: dateToday,
        enquiryType: 'Hanger Request',
        customerName: BUYERS[0],
        contactPerson: '',
        mobileNo: '',
        emailId: '',
        address: '',
        fabricName: '',
        designNo: DESIGNS[0],
        fabricType: '',
        gsm: '',
        width: '',
        shade: '',
        hangerQuantity: '5',
        sampleSize: '12x12 inch',
        dispatchMethod: 'Courier',
        requiredDate: dateToday,
        salesExecutive: EMPLOYEES[0],
        followUpDate: dateToday,
        priorityLevel: 'Medium',
        courierName: 'DHL Express',
        trackingNo: 'DHL123456789',
        dispatchDate: dateToday,
        enteredBy: EMPLOYEES[0],
        verifiedBy: EMPLOYEES[1],
        approvedBy: EMPLOYEES[2],
        status: 'New Enquiry',
        fabricImageUpload: '',
        hangerImageUpload: '',
        customerRequirementUpload: '',
        customerNotes: '',
        salesRemarks: '',
        internalNotes: ''
      };
    }
    else if (activePage === 'final_inspection') {
      let nextNum = 1;
      if (finalInspections.length > 0) {
        const nums = finalInspections.map(item => {
          const match = (item.auditNo || item.id || '').match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        });
        nextNum = Math.max(...nums, 0) + 1;
      }
      nextId = `AUD-${String(nextNum).padStart(5, '0')}`;

      initialFields = {
        auditNo: nextId,
        auditDate: dateToday,
        overallStatus: 'APPROVED',
        designNo: '',
        buyerName: '',
        buyerOrderNo: '',
        totalMetersInspected: '0.00',
        approvedMeters: '0.00',
        rejectedQuantity: '0.00',
        rolls: []
      };
    }
    else {
      // General Fallback
      nextId = `TXN-FAB-${Date.now().toString().slice(-4)}`;
      initialFields = { id: nextId, date: dateToday, remarks: '', status: 'Active' };
    }

    setFields(initialFields);
    setCurrentFormId(nextId);
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleRollChange = (index, field, value) => {
    setFields(prev => {
      const rolls = [...(prev.rolls || [])];
      rolls[index] = { ...rolls[index], [field]: value };
      return { ...prev, rolls };
    });
  };

  const handleRemoveRoll = (index) => {
    setFields(prev => {
      const rolls = (prev.rolls || []).filter((_, idx) => idx !== index);
      return { ...prev, rolls };
    });
  };

  const handleAddRoll = () => {
    setFields(prev => {
      const rolls = [...(prev.rolls || [])];
      rolls.push({ pieceNo: `PC-${rolls.length + 301}-F`, meters: '98.00', colorCheck: 'OK', widthCheck: '59.68"', status: 'Approved', grade: 'A' });
      return { ...prev, rolls };
    });
  };

  const handleEdit = (row) => {
    setCurrentFormId(row.id);
    setFields({ ...row });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const buyerNameField = fields.customerName || fields.vendorName || fields.buyerName || fields.supplierName || fields.supplier || fields.customerVendorName || 'Internal';
    const transactionNo = fields.auditNo || fields.openingEntryNo || fields.reportNo || fields.exportNo || fields.surplusInwardNo || fields.surplusDeliveryNo || fields.enquiryNo || fields.vendorBillNo || fields.printingWashingBillNo || fields.dlDevelopmentBillNo || fields.designUploadNo || fields.clothCheckingNo || fields.lotCompletionNo || fields.clothInwardNo || fields.purchaseBillNo || fields.clothDeliveryNo || fields.millTransferNo || fields.baleDeliveryNo || fields.lotApprovalNo || fields.baleAmendmentNo || fields.balePackingNo || fields.packinglistCheckingNo || fields.goodsReleaseAdviceNo || fields.gatePassNo || currentFormId;
    const transactionDate = fields.auditDate || fields.openingDate || fields.reportDate || fields.exportDate || fields.inwardDate || fields.deliveryDate || fields.enquiryDate || fields.billDate || fields.uploadDate || fields.checkingDate || fields.completionDate || fields.deliveryDate || fields.transferDate || fields.approvalDate || fields.amendmentDate || fields.packingDate || fields.checkingDate || fields.releaseDate || fields.gatePassDate || fields.date || new Date().toISOString().substring(0, 10);

    const payload = {
      module_type: activePage,
      date: transactionDate,
      buyer_name: buyerNameField,
      status: fields.status || 'Draft',
      details: { ...fields, id: transactionNo }
    };

    try {
      if (fields.db_id) {
        await workOrderTransactionAPI.update(fields.db_id, payload);
      } else {
        await workOrderTransactionAPI.create(payload);
      }
      loadData();
      setIsFormOpen(false);
      alert("Fabric production record processed and saved!");
    } catch (err) {
      console.error("Error saving fabric transaction", err);
      alert("Failed to save transaction: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id, db_id) => {
    if (confirm("Are you sure you want to remove this fabric transaction entry?")) {
      try {
        if (db_id) {
          await workOrderTransactionAPI.delete(db_id);
        }
        loadData();
      } catch (err) {
        console.error("Error deleting fabric transaction", err);
        alert("Failed to delete transaction: " + err.message);
      }
    }
  };

  // EXCEL DOWNLOAD FOR SURPLUS STOCK
  const handleExportExcelSurplus = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { 'Design No': 'DES-4091', 'Lot No': 'LOT-SAT-10', 'Grade': 'A', 'Opening Meters': 500, 'Inward Meters': 1200, 'Current Stock': 1700, 'Rate': 150, 'Stock Value': 255000 }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Surplus Stock');
    XLSX.writeFile(workbook, 'Surplus_Stock_Inventory.xlsx');
  };

  const activeColor = PAGES_METADATA[activePage]?.color || '#7c3aed';
  const PageIcon = PAGES_METADATA[activePage]?.icon || Scissors;
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
                    {PAGES_METADATA[activePage].label} Records Audit
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Central ledger logs for tracking digital receipts</span>
                </div>
                {activePage === 'surplus_download' ? (
                  <button className="btn btn-primary" onClick={handleExportExcelSurplus} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                    <Download size={16} /> Download Excel Spreadsheet
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                    <Plus size={16} /> Add Production Ledger Entry
                  </button>
                )}
              </div>

              {/* DESIGN UPLOAD TABLE */}
              {activePage === 'design_upload' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>DESIGN NO</th>
                        <th>DATE</th>
                        <th>DESIGN NAME</th>
                        <th>CATEGORY</th>
                        <th>BUYER NAME</th>
                        <th>FABRIC TYPE</th>
                        <th>COMPOSITION</th>
                        <th>WIDTH (INCH)</th>
                        <th>GSM</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {designs.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.designUploadNo || row.id}</td>
                          <td>{row.uploadDate || row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.designName || row.name}</td>
                          <td>{row.category || row.uploadType}</td>
                          <td>{row.buyerName}</td>
                          <td>{row.fabricType}</td>
                          <td>{row.composition}</td>
                          <td>{row.width}"</td>
                          <td>{row.gsm || row.weight}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewModalTransaction(row)} title="View"><Eye size={16} color="var(--primary)" /></button>
                              <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleEdit(row)} title="Edit"><Edit size={16} /></button>
                              <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)} title="Delete"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FINAL INSPECTION TABLE */}
              {activePage === 'final_inspection' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>AUDIT NO</th>
                        <th>DATE</th>
                        <th>DESIGN NO</th>
                        <th>BUYER</th>
                        <th>ORDER NO</th>
                        <th style={{ textAlign: 'right' }}>METERS INSPECTED</th>
                        <th style={{ textAlign: 'right' }}>APPROVED METERS</th>
                        <th style={{ textAlign: 'right' }}>REJECTED METERS</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalInspections.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.auditNo || row.id}</td>
                          <td>{row.auditDate || row.date}</td>
                          <td>{row.designNo}</td>
                          <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                          <td>{row.buyerOrderNo}</td>
                          <td style={{ textAlign: 'right' }}>{parseFloat(row.totalMetersInspected || 0).toFixed(2)} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{parseFloat(row.approvedMeters || 0).toFixed(2)} Mtr</td>
                          <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{parseFloat(row.rejectedQuantity || 0).toFixed(2)} Mtr</td>
                          <td>
                            <span className={`badge ${row.overallStatus === 'APPROVED' ? 'badge-active' : 'badge-pending'}`}>
                              {row.overallStatus}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH CHECKING TABLE */}
              {activePage === 'cloth_checking' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>CHECKING NO</th>
                        <th>DATE</th>
                        <th>SUPPLIER NAME</th>
                        <th>CHECKER NAME</th>
                        <th>LOT NO</th>
                        <th style={{ textAlign: 'right' }}>ROLL LENGTH</th>
                        <th style={{ textAlign: 'right' }}>PASSED QUANTITY</th>
                        <th>CHECKED BY</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clothCheckings.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.clothCheckingNo || row.id}</td>
                          <td>{row.checkingDate || row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.buyerName || row.supplierName}</td>
                          <td>{row.checkerName}</td>
                          <td>{row.lotNo}</td>
                          <td style={{ textAlign: 'right' }}>{row.rollLength} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.passedQuantity} Mtr</td>
                          <td>{row.checkedBy}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH LOT COMPLETION TABLE */}
              {activePage === 'lot_completion' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>COMPLETION NO</th>
                        <th>DATE</th>
                        <th>LOT NO</th>
                        <th>COMPLETION TYPE</th>
                        <th style={{ textAlign: 'right' }}>TOTAL LOT QTY</th>
                        <th style={{ textAlign: 'right' }}>PASSED QTY</th>
                        <th style={{ textAlign: 'right' }}>REJECTED QTY</th>
                        <th style={{ textAlign: 'right' }}>BALANCE QTY</th>
                        <th>COMPLETED BY</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotCompletions.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.lotCompletionNo || row.id}</td>
                          <td>{row.completionDate || row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.lotNo}</td>
                          <td>{row.completionType}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalLotQuantity} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.passedQuantity} Mtr</td>
                          <td style={{ textAlign: 'right' }}>{row.rejectedQuantity} Mtr</td>
                          <td style={{ textAlign: 'right' }}>{row.balanceQuantity} Mtr</td>
                          <td>{row.completedBy}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH INWARD TABLE */}
              {activePage === 'cloth_inward' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>INWARD NO</th>
                        <th>DATE</th>
                        <th>INWARD TYPE</th>
                        <th>SUPPLIER NAME</th>
                        <th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>RECEIVED QTY</th>
                        <th>QC STATUS</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clothInwards.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.clothInwardNo || row.id}</td>
                          <td>{row.inwardDate || row.date}</td>
                          <td>{row.inwardType}</td>
                          <td style={{ fontWeight: 650 }}>{row.buyerName || row.supplierName}</td>
                          <td>{row.designNo}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.receivedQuantity} {row.uom}</td>
                          <td><span className={`badge ${row.qcStatus === 'QC Approved' ? 'badge-active' : 'badge-inactive'}`}>{row.qcStatus}</span></td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH PURCHASE BILLS TABLE */}
              {activePage === 'cloth_purchase_bill' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>BILL NO</th>
                        <th>DATE</th>
                        <th>BILL TYPE</th>
                        <th>SUPPLIER NAME</th>
                        <th style={{ textAlign: 'right' }}>TAXABLE AMOUNT</th>
                        <th style={{ textAlign: 'right' }}>NET AMOUNT</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseBills.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.purchaseBillNo || row.id}</td>
                          <td>{row.billDate || row.date}</td>
                          <td>{row.billType}</td>
                          <td style={{ fontWeight: 650 }}>{row.buyerName || row.supplierName}</td>
                          <td style={{ textAlign: 'right' }}>₹{row.taxableAmount}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{row.netAmount}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH DELIVERY PC-WISE TABLE */}
              {activePage === 'del_pcwise' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>DELIVERY NO</th>
                        <th>DATE</th>
                        <th>DELIVERY TYPE</th>
                        <th>CUSTOMER NAME</th>
                        <th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>DELIVERED QTY</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pcWiseDeliveries.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.clothDeliveryNo || row.id}</td>
                          <td>{row.deliveryDate || row.date}</td>
                          <td>{row.deliveryType}</td>
                          <td style={{ fontWeight: 650 }}>{row.customerVendorName || row.buyerName}</td>
                          <td>{row.designNo}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.deliveredQuantity} {row.uom}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* MILL TO MILL DELIVERY TABLE */}
              {activePage === 'm2m_delivery' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>TRANSFER NO</th>
                        <th>DATE</th>
                        <th>TRANSFER TYPE</th>
                        <th>FROM MILL</th>
                        <th>TO MILL</th>
                        <th style={{ textAlign: 'right' }}>TRANSFER QTY</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m2mDeliveries.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.millTransferNo || row.id}</td>
                          <td>{row.transferDate || row.date}</td>
                          <td>{row.transferType}</td>
                          <td>{row.fromMillName}</td>
                          <td style={{ fontWeight: 650 }}>{row.toMillName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.transferQuantity} {row.uom}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH BALE DELIVERY TABLE */}
              {activePage === 'bale_delivery' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>DELIVERY NO</th>
                        <th>DATE</th>
                        <th>DISPATCH TYPE</th>
                        <th>CUSTOMER NAME</th>
                        <th style={{ textAlign: 'right' }}>DELIVERED QTY</th>
                        <th style={{ textAlign: 'right' }}>PENDING QTY</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baleDeliveries.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.baleDeliveryNo || row.id}</td>
                          <td>{row.deliveryDate || row.date}</td>
                          <td>{row.dispatchType}</td>
                          <td style={{ fontWeight: 650 }}>{row.customerName || row.buyerName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.deliveredQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right' }}>{row.pendingQuantity} {row.uom}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* LOT APPROVAL TABLE */}
              {activePage === 'lot_approval' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>APPROVAL NO</th>
                        <th>DATE</th>
                        <th>APPROVAL TYPE</th>
                        <th>LOT NO</th>
                        <th style={{ textAlign: 'right' }}>TOTAL LOT QTY</th>
                        <th style={{ textAlign: 'right' }}>PASSED QTY</th>
                        <th>QC STATUS</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotApprovals.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.lotApprovalNo || row.id}</td>
                          <td>{row.approvalDate || row.date}</td>
                          <td>{row.approvalType}</td>
                          <td style={{ fontWeight: 650 }}>{row.lotNo}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalLotQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.passedQuantity} {row.uom}</td>
                          <td><span className={`badge ${row.qcStatus === 'Approved' ? 'badge-active' : 'badge-inactive'}`}>{row.qcStatus}</span></td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* BALE AMENDMENT TABLE */}
              {activePage === 'bale_amend' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>AMENDMENT NO</th>
                        <th>DATE</th>
                        <th>AMENDMENT TYPE</th>
                        <th>BALE NO</th>
                        <th style={{ textAlign: 'right' }}>PREV QTY</th>
                        <th style={{ textAlign: 'right' }}>REVISED QTY</th>
                        <th style={{ textAlign: 'right' }}>DIFFERENCE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baleAmends.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.baleAmendmentNo || row.id}</td>
                          <td>{row.amendmentDate || row.date}</td>
                          <td>{row.amendmentType}</td>
                          <td>{row.baleNo}</td>
                          <td style={{ textAlign: 'right' }}>{row.previousQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.revisedQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right', color: parseFloat(row.differenceQuantity) < 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {parseFloat(row.differenceQuantity) > 0 ? '+' : ''}{row.differenceQuantity} {row.uom}
                          </td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH BALE PACKING TABLE */}
              {activePage === 'bale_packing' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>PACKING NO</th>
                        <th>DATE</th>
                        <th>PACKING TYPE</th>
                        <th>LOT NO</th>
                        <th>BALE NO</th>
                        <th style={{ textAlign: 'right' }}>PACKED QTY</th>
                        <th>QC STATUS</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balePackings.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.balePackingNo || row.id}</td>
                          <td>{row.packingDate || row.date}</td>
                          <td>{row.packingType}</td>
                          <td>{row.lotNo}</td>
                          <td style={{ fontWeight: 650 }}>{row.baleNo}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.packedQuantity} {row.uom}</td>
                          <td><span className={`badge ${row.packingQcStatus === 'QC Approved' ? 'badge-active' : 'badge-inactive'}`}>{row.packingQcStatus}</span></td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PACKINGLIST CHECKING TABLE */}
              {activePage === 'pl_checking' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>CHECKING NO</th>
                        <th>DATE</th>
                        <th>CHECKING TYPE</th>
                        <th>PACKING LIST NO</th>
                        <th>CUSTOMER NAME</th>
                        <th style={{ textAlign: 'right' }}>PACKED QTY</th>
                        <th>QC STATUS</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plCheckings.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.packinglistCheckingNo || row.id}</td>
                          <td>{row.checkingDate || row.date}</td>
                          <td>{row.checkingType}</td>
                          <td>{row.packingListNo}</td>
                          <td style={{ fontWeight: 650 }}>{row.customerName || row.buyerName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.packedQuantity} {row.uom}</td>
                          <td><span className={`badge ${row.qcStatus === 'Approved' ? 'badge-active' : 'badge-inactive'}`}>{row.qcStatus}</span></td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* NEW GOODS RELEASE ADVICE TABLE */}
              {activePage === 'goods_release' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>RELEASE VOUCHER</th>
                        <th>DATE</th>
                        <th>RELEASE TYPE</th>
                        <th>CUSTOMER NAME</th>
                        <th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>APPROVED QTY</th>
                        <th style={{ textAlign: 'right' }}>RELEASED QTY</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goodsReleaseAdvices.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.goodsReleaseAdviceNo || row.id}</td>
                          <td>{row.releaseDate || row.date}</td>
                          <td>{row.releaseType}</td>
                          <td style={{ fontWeight: 650 }}>{row.customerVendorName || row.buyerName}</td>
                          <td>{row.designNo}</td>
                          <td style={{ textAlign: 'right' }}>{row.approvedQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.releasedQuantity} {row.uom}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CLOTH GATE PASS TABLE */}
              {activePage === 'gate_pass' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>GATE PASS NO</th>
                        <th>DATE</th>
                        <th>GATE PASS TYPE</th>
                        <th>PARTY NAME</th>
                        <th>VEHICLE NO</th>
                        <th>DRIVER NAME</th>
                        <th style={{ textAlign: 'right' }}>QUANTITY</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gatePasses.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.gatePassNo || row.id}</td>
                          <td>{row.gatePassDate || row.date}</td>
                          <td>{row.gatePassType}</td>
                          <td style={{ fontWeight: 650 }}>{row.customerVendorName || row.buyerName}</td>
                          <td>{row.vehicleNo}</td>
                          <td>{row.driverName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.quantity} {row.uom}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VENDOR BILLS TABLE */}
              {activePage === 'vendor_bills' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>BILL NO</th>
                        <th>DATE</th>
                        <th>BILL TYPE</th>
                        <th>VENDOR NAME</th>
                        <th>FABRIC/YARN</th>
                        <th style={{ textAlign: 'right' }}>BILLABLE QTY</th>
                        <th style={{ textAlign: 'right' }}>NET AMOUNT</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorBills.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.vendorBillNo || row.id}</td>
                          <td>{row.billDate || row.date}</td>
                          <td>{row.billType}</td>
                          <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.billableQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>₹{row.netAmount}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* PRINTING BILLS TABLE */}
              {activePage === 'printing_bills' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>BILL NO</th>
                        <th>DATE</th>
                        <th>PROCESS TYPE</th>
                        <th>VENDOR NAME</th>
                        <th>FABRIC</th>
                        <th style={{ textAlign: 'right' }}>BILLABLE QTY</th>
                        <th style={{ textAlign: 'right' }}>NET AMOUNT</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printingBills.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.printingWashingBillNo || row.id}</td>
                          <td>{row.billDate || row.date}</td>
                          <td>{row.processType}</td>
                          <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.billableQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>₹{row.netAmount}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* DL DEVELOPMENT BILLS TABLE */}
              {activePage === 'dl_development' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>BILL NO</th>
                        <th>DATE</th>
                        <th>DEVELOPMENT TYPE</th>
                        <th>VENDOR NAME</th>
                        <th>BUYER NAME</th>
                        <th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>NET AMOUNT</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dlDevelopmentBills.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.dlDevelopmentBillNo || row.id}</td>
                          <td>{row.billDate || row.date}</td>
                          <td>{row.developmentType}</td>
                          <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                          <td>{row.buyerName}</td>
                          <td>{row.designNo}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>₹{row.netAmount}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SURPLUS STOCK OPENING TABLE */}
              {activePage === 'surplus_opening' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>ENTRY NO</th>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>FABRIC NAME</th>
                        <th style={{ textAlign: 'right' }}>OPENING QTY</th>
                        <th style={{ textAlign: 'right' }}>EST. RATE</th>
                        <th style={{ textAlign: 'right' }}>STOCK VALUE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusOpening.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.openingEntryNo || row.id}</td>
                          <td>{row.openingDate || row.date}</td>
                          <td>{row.openingType}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.openingQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right' }}>₹{row.estimatedRate}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>₹{row.stockValue}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SURPLUS STOCK REPORT TABLE */}
              {activePage === 'surplus_report' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>REPORT NO</th>
                        <th>DATE</th>
                        <th>REPORT TYPE</th>
                        <th>LOCATION</th>
                        <th>FABRIC NAME</th>
                        <th style={{ textAlign: 'right' }}>AVAILABLE QTY</th>
                        <th style={{ textAlign: 'right' }}>STOCK VALUE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusReports.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.reportNo || row.id}</td>
                          <td>{row.reportDate || row.date}</td>
                          <td>{row.reportType}</td>
                          <td>{row.warehouseLocation} / {row.rackNo}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.availableQuantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>₹{row.stockValue}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SURPLUS STOCK EXCEL DOWNLOAD TABLE */}
              {activePage === 'surplus_download' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>EXPORT NO</th>
                        <th>DATE</th>
                        <th>EXPORT TYPE</th>
                        <th>FORMAT</th>
                        <th>EXPORTED BY</th>
                        <th>DOWNLOAD STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusDownloads.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.exportNo || row.id}</td>
                          <td>{row.exportDate || row.date}</td>
                          <td>{row.exportType}</td>
                          <td>{row.fileFormat}</td>
                          <td>{row.exportedBy}</td>
                          <td><span className="badge badge-active">{row.downloadStatus}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SURPLUS STOCK REPORT NEW TABLE */}
              {activePage === 'surplus_report_new' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>REPORT NO</th>
                        <th>DATE</th>
                        <th>CATEGORY</th>
                        <th>FABRIC NAME</th>
                        <th style={{ textAlign: 'right' }}>AVAILABLE QTY</th>
                        <th style={{ textAlign: 'right' }}>STOCK VALUE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusReportsNew.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.reportNo || row.id}</td>
                          <td>{row.reportDate || row.date}</td>
                          <td>{row.reportCategory}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.availableQuantity}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>₹{row.stockValue}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SURPLUS STOCK INWARD TABLE */}
              {activePage === 'surplus_inward' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>INWARD NO</th>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>FABRIC NAME</th>
                        <th style={{ textAlign: 'right' }}>INWARD QTY</th>
                        <th>WAREHOUSE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusInwards.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.surplusInwardNo || row.id}</td>
                          <td>{row.inwardDate || row.date}</td>
                          <td>{row.inwardType}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.inwardQuantity} {row.uom}</td>
                          <td>{row.warehouseLocation}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SURPLUS STOCK DELIVERY TABLE */}
              {activePage === 'surplus_delivery' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>DELIVERY NO</th>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>CUSTOMER</th>
                        <th>FABRIC NAME</th>
                        <th style={{ textAlign: 'right' }}>DELIVERED QTY</th>
                        <th style={{ textAlign: 'right' }}>NET AMOUNT</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusDeliveries.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.surplusDeliveryNo || row.id}</td>
                          <td>{row.deliveryDate || row.date}</td>
                          <td>{row.deliveryType}</td>
                          <td style={{ fontWeight: 650 }}>{row.customerName}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.deliveredQuantity} {row.uom}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>₹{row.netAmount}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CUSTOMER ENQUIRY HANGER TABLE */}
              {activePage === 'customer_hanger' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>ENQUIRY NO</th>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>CUSTOMER</th>
                        <th>FABRIC NAME</th>
                        <th style={{ textAlign: 'right' }}>HANGER QTY</th>
                        <th>SALES EXEC</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHangers.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.enquiryNo || row.id}</td>
                          <td>{row.enquiryDate || row.date}</td>
                          <td>{row.enquiryType}</td>
                          <td style={{ fontWeight: 650 }}>{row.customerName}</td>
                          <td>{row.fabricName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.hangerQuantity}</td>
                          <td>{row.salesExecutive}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(row)}><Edit size={12} /> Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id, row.db_id)}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FALLBACK INFO PANEL FOR REMAINING MODULES */}
              {!['final_inspection', 'design_upload', 'cloth_checking', 'lot_completion', 'cloth_inward', 'cloth_purchase_bill', 'del_pcwise', 'm2m_delivery', 'bale_delivery', 'lot_approval', 'bale_amend', 'bale_packing', 'pl_checking', 'goods_release', 'gate_pass', 'vendor_bills', 'printing_bills', 'dl_development', 'surplus_opening', 'surplus_report', 'surplus_download', 'surplus_report_new', 'surplus_inward', 'surplus_delivery', 'customer_hanger'].includes(activePage) && (
                <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'white' }}>
                  <Sparkles size={36} style={{ color: '#7c3aed', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 800, margin: 0 }}>Operational Ledger Database Active</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Record sheets and dynamic tables are loaded in standard secure sandboxed modules. Click "Add Production Ledger Entry" to populate details.
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
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure quality verification & shipment tracking system</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <X size={15} /> Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                    <Check size={15} /> Save Record
                  </button>
                </div>
              </div>

              {/* DYNAMIC CARD-GROUPED FORM RENDERER */}
              {FORM_SCHEMAS[activePage] ? (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {FORM_SCHEMAS[activePage].map((card, cIndex) => {
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
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#7c3aed', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                    {(f.name === 'designNo' && dbDesigns && dbDesigns.length > 0 
                                      ? Array.from(new Set(dbDesigns.map(d => d.design_no).filter(Boolean))) 
                                      : (f.options || [])
                                    ).map(opt => (
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

                  {/* CUSTOM ROLLS TABLE FOR FINAL INSPECTION */}
                  {activePage === 'final_inspection' && (
                    <div 
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
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#7c3aed', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} /> Roll-wise Final Audit
                      </h4>
                      <table className="data-table" style={{ width: '100%', margin: 0 }}>
                        <thead>
                          <tr>
                            <th>PIECE NO</th>
                            <th>METERS</th>
                            <th>COLOR CHECK</th>
                            <th>WIDTH CHECK</th>
                            <th>STATUS</th>
                            <th>GRADE</th>
                            <th style={{ textAlign: 'center' }}>REMOVE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(fields.rolls || []).map((roll, idx) => (
                            <tr key={idx}>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  style={{ margin: 0 }} 
                                  value={roll.pieceNo || ''} 
                                  onChange={e => handleRollChange(idx, 'pieceNo', e.target.value)} 
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  style={{ margin: 0 }} 
                                  value={roll.meters || ''} 
                                  onChange={e => handleRollChange(idx, 'meters', e.target.value)} 
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  style={{ margin: 0 }} 
                                  value={roll.colorCheck || ''} 
                                  onChange={e => handleRollChange(idx, 'colorCheck', e.target.value)} 
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  style={{ margin: 0 }} 
                                  value={roll.widthCheck || ''} 
                                  onChange={e => handleRollChange(idx, 'widthCheck', e.target.value)} 
                                />
                              </td>
                              <td>
                                <select 
                                  className="form-control" 
                                  style={{ margin: 0 }} 
                                  value={roll.status || 'Approved'} 
                                  onChange={e => handleRollChange(idx, 'status', e.target.value)}
                                >
                                  <option value="Approved">Approved</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </td>
                              <td>
                                <select 
                                  className="form-control" 
                                  style={{ margin: 0 }} 
                                  value={roll.grade || 'A'} 
                                  onChange={e => handleRollChange(idx, 'grade', e.target.value)}
                                >
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="F">F</option>
                                </select>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  type="button" 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px', color: 'var(--danger)' }} 
                                  onClick={() => handleRemoveRoll(idx)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={handleAddRoll}
                        style={{ alignSelf: 'flex-start', marginTop: '10px' }}
                      >
                        + Add Roll Row
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                /* FALLBACK SIMPLE CONFIGS FORM FOR REMAINING MODULES */
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Voucher Details & Audit Configs</h4>
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

      {/* A4 Modal View Preview */}
      {viewModalTransaction && (
        <A4DocumentPreview
          isOpen={!!viewModalTransaction}
          onClose={() => setViewModalTransaction(null)}
          title="Design Upload Details"
          documentNumber={viewModalTransaction.designNo || viewModalTransaction.id}
          status={viewModalTransaction.status || 'Uploaded'}
          sections={[
            {
              title: 'General Information',
              type: 'grid',
              icon: 'FileText',
              data: [
                { label: 'Design No', value: viewModalTransaction.designNo },
                { label: 'Design Name', value: viewModalTransaction.designName || viewModalTransaction.name },
                { label: 'Date', value: viewModalTransaction.date },
                { label: 'Category', value: viewModalTransaction.category || viewModalTransaction.uploadType },
                { label: 'Status', value: viewModalTransaction.status || 'Active' }
              ]
            },
            {
              title: 'Product Specifications',
              type: 'grid',
              icon: 'Palette',
              data: [
                { label: 'Buyer Name', value: viewModalTransaction.buyerName },
                { label: 'Fabric Type', value: viewModalTransaction.fabricType },
                { label: 'Composition', value: viewModalTransaction.composition },
                { label: 'Width (Inch)', value: `${viewModalTransaction.width}"` },
                { label: 'GSM / Weight', value: viewModalTransaction.gsm || viewModalTransaction.weight }
              ]
            }
          ]}
        />
      )}

    </div>
  );
}
