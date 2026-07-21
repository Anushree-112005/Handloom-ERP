import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Search, Plus, Trash2, Edit, Check, X, Download,
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle,
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen,
  MapPin, HelpCircle, Sparkles, Database, Shield, Scissors, ShoppingCart,
  Percent, DollarSign, Activity, Palette, Box
} from 'lucide-react';
import { workOrderTransactionAPI, partyAPI, dropdownAPI, subMasterAPI } from '../../services/api';

export default function WorkOrderDesk({ defaultSection = 'Transactions' }) {
  const navigate = useNavigate();

  // Switch tabs between the categories
  const [activeSection, setActiveSection] = useState('Design & Development');

  // Synchronize state when routing changes prop
  useEffect(() => {
    const targetSection = defaultSection === 'Transactions' ? 'Design & Development' : defaultSection;
    setActiveSection(targetSection);

    // Automatically select the first sub-module
    const firstSubModule = Object.values(PAGES_METADATA).find(p => p.category === targetSection || p.section === targetSection);
    if (firstSubModule) {
      setActivePage(firstSubModule.key);
    } else {
      setActivePage(null);
    }
    setIsFormOpen(false);
  }, [defaultSection]);

  // Currently open sub-page key (e.g. 'design_create')
  const [activePage, setActivePage] = useState(null);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Static lists for selections
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];

  // =========================================================================
  // DYNAMIC DROPDOWNS & MASTERS
  // =========================================================================
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});

  const BUYERS = useMemo(() => {
    const list = parties.filter(p => p.party_type === 'Sales').map(p => p.company_name);
    return list.length > 0 ? list : ['Raymond Ltd', 'Vardhman Spinning', 'Reliance Retail', 'Standard Gears Ltd'];
  }, [parties]);
  const [isCustomSeason, setIsCustomSeason] = useState(false);
  const [customSeasonVal, setCustomSeasonVal] = useState('');
  const [isCustomFabricType, setIsCustomFabricType] = useState(false);
  const [customFabricTypeVal, setCustomFabricTypeVal] = useState('');

  const handleSaveCustomSeason = async () => {
    if (!customSeasonVal.trim()) { setIsCustomSeason(false); return; }
    try {
      await subMasterAPI.create('season_master', { entity: 'season_master', name: customSeasonVal.trim(), is_active: true });
      const dRes = await dropdownAPI.getAll();
      setOptions(dRes.data);
      setFields({ ...fields, season: customSeasonVal.trim() });
      setIsCustomSeason(false);
      setCustomSeasonVal('');
    } catch (e) { console.error(e); alert("Failed to save custom season"); }
  };

  const handleSaveCustomFabricType = async () => {
    if (!customFabricTypeVal.trim()) { setIsCustomFabricType(false); return; }
    try {
      await subMasterAPI.create('fabric_type_master', { entity: 'fabric_type_master', name: customFabricTypeVal.trim(), is_active: true });
      const dRes = await dropdownAPI.getAll();
      setOptions(dRes.data);
      setFields({ ...fields, fabricType: customFabricTypeVal.trim() });
      setIsCustomFabricType(false);
      setCustomFabricTypeVal('');
    } catch (e) { console.error(e); alert("Failed to save custom fabric type"); }
  };

  const loadMasters = async () => {
    try {
      const pRes = await partyAPI.list();
      setParties(pRes.data);
      const dRes = await dropdownAPI.getAll();
      setOptions(dRes.data);
    } catch (e) { console.error(e); }
  };

  // =========================================================================
  // STATE STORE FOR ALL WORKSPACES
  // =========================================================================

  // 1. DESIGN CREATE
  const [designOrders, setDesignOrders] = useState([]);

  // 2. SHORT AMD
  const [shortAmendments, setShortAmendments] = useState([]);

  // 3. HSN CODE AMD
  const [hsnAmendments, setHsnAmendments] = useState([]);

  // 4. VENDOR ORDER
  const [vendorOrders, setVendorOrders] = useState([]);

  // 5. DYEING ORDER
  const [dyeingOrders, setDyeingOrders] = useState([]);

  // 6. DOUBLING/TWISTING ORDER
  const [twistingOrders, setTwistingOrders] = useState([]);

  // 7. WARPING/SIZING ORDER
  const [warpingOrders, setWarpingOrders] = useState([]);

  // 8. INTERNAL FABRIC REQUEST
  const [fabricRequests, setFabricRequests] = useState([]);

  // 9. CLOTH PURCHASE ORDER
  const [clothPurchaseOrders, setClothPurchaseOrders] = useState([]);

  // 10. CLOTH DYEING/PROCESSING ORDER
  const [clothProcessingOrders, setClothProcessingOrders] = useState([]);

  // 11. DEVELOPMENT/BULK ORDER
  const [bulkOrders, setBulkOrders] = useState([]);

  // 12. DEVELOPMENT/BULK FOLLOWUP
  const [orderFollowups, setOrderFollowups] = useState([]);

  // COMPLETIONS
  const [vendorCompletions, setVendorCompletions] = useState([]);
  const [clothPoCompletions, setClothPoCompletions] = useState([]);
  const [dyeingCompletions, setDyeingCompletions] = useState([]);
  const [warpSizingCompletions, setWarpSizingCompletions] = useState([]);
  const [clothDyeingCompletions, setClothDyeingCompletions] = useState([]);

  // APPROVALS
  const [buyerOrderApprovals, setBuyerOrderApprovals] = useState([]);
  const [piApprovals, setPiApprovals] = useState([]);
  const [vendorWorkApprovals, setVendorWorkApprovals] = useState([]);
  const [internalFabricApprovals, setInternalFabricApprovals] = useState([]);
  const [yarnReqApprovals, setYarnReqApprovals] = useState([]);
  const [yarnWorkApprovals, setYarnWorkApprovals] = useState([]);

  const loadData = async () => {
    try {
      const res = await workOrderTransactionAPI.list();
      const allTxns = res.data;

      const mapTxn = (t) => ({ db_id: t.id, id: t.transaction_no, date: t.date, status: t.status, buyerName: t.buyer_name, ...t.details });

      setDesignOrders(allTxns.filter(t => t.module_type === 'design_create').map(mapTxn));
      setShortAmendments(allTxns.filter(t => t.module_type === 'short_amd').map(mapTxn));
      setHsnAmendments(allTxns.filter(t => t.module_type === 'hsn_amd').map(mapTxn));
      setVendorOrders(allTxns.filter(t => t.module_type === 'vendor_order').map(mapTxn));
      setDyeingOrders(allTxns.filter(t => t.module_type === 'dyeing_order').map(mapTxn));
      setTwistingOrders(allTxns.filter(t => t.module_type === 'doubling_twisting').map(mapTxn));
      setWarpingOrders(allTxns.filter(t => t.module_type === 'warp_sizing_order').map(mapTxn));
      setFabricRequests(allTxns.filter(t => t.module_type === 'internal_fabric_req').map(mapTxn));
      setClothPurchaseOrders(allTxns.filter(t => t.module_type === 'cloth_po').map(mapTxn));
      setClothProcessingOrders(allTxns.filter(t => t.module_type === 'cloth_dyeing_order').map(mapTxn));
      setBulkOrders(allTxns.filter(t => t.module_type === 'dev_bulk_order').map(mapTxn));
      setOrderFollowups(allTxns.filter(t => t.module_type === 'dev_bulk_followup').map(mapTxn));

      setVendorCompletions(allTxns.filter(t => t.module_type === 'vendor_order_comp').map(mapTxn));
      setClothPoCompletions(allTxns.filter(t => t.module_type === 'cloth_po_comp').map(mapTxn));
      setDyeingCompletions(allTxns.filter(t => t.module_type === 'dyeing_order_comp').map(mapTxn));
      setWarpSizingCompletions(allTxns.filter(t => t.module_type === 'warp_sizing_comp').map(mapTxn));
      setClothDyeingCompletions(allTxns.filter(t => t.module_type === 'cloth_dyeing_comp').map(mapTxn));

      setBuyerOrderApprovals(allTxns.filter(t => t.module_type === 'buyer_order_app').map(mapTxn));
      setPiApprovals(allTxns.filter(t => t.module_type === 'pi_app').map(mapTxn));
      setVendorWorkApprovals(allTxns.filter(t => t.module_type === 'vendor_work_app').map(mapTxn));
      setInternalFabricApprovals(allTxns.filter(t => t.module_type === 'internal_fabric_app').map(mapTxn));
      setYarnReqApprovals(allTxns.filter(t => t.module_type === 'yarn_req_app').map(mapTxn));
      setYarnWorkApprovals(allTxns.filter(t => t.module_type === 'yarn_work_app').map(mapTxn));
    } catch (err) {
      console.error("Failed to load work order transactions", err);
    }
  };

  useEffect(() => {
    loadData();
    loadMasters();
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
    // 1. WORK ORDER TRANSACTION
    design_create: { key: 'design_create', label: "Design Create", section: 'Transactions', category: 'Design & Development', desc: "Create new design orders linked to buyer requirements", icon: FileText, color: '#3b82f6' },
    dev_bulk_order: { key: 'dev_bulk_order', label: "Development/Bulk Order", section: 'Transactions', category: 'Design & Development', desc: "Create development samples or bulk production orders", icon: Box, color: '#3b82f6' },
    dev_bulk_followup: { key: 'dev_bulk_followup', label: "Development/Bulk Followup", section: 'Transactions', category: 'Design & Development', desc: "Track progress and followup on development and bulk orders", icon: Activity, color: '#3b82f6' },

    vendor_order: { key: 'vendor_order', label: "Vendor Order", section: 'Transactions', category: 'Order Management', desc: "Create work orders for external weaving/processing vendors", icon: Factory, color: '#8b5cf6' },
    cloth_po: { key: 'cloth_po', label: "Cloth Purchase Order", section: 'Transactions', category: 'Order Management', desc: "Create purchase orders for buying cloth/fabric from market", icon: ShoppingCart, color: '#8b5cf6' },

    dyeing_order: { key: 'dyeing_order', label: "Dyeing Order", section: 'Transactions', category: 'Processing', desc: "Create orders for yarn/fabric dyeing to dyeing vendors", icon: Palette, color: '#10b981' },
    cloth_dyeing_order: { key: 'cloth_dyeing_order', label: "Cloth Dyeing/Processing Order", section: 'Transactions', category: 'Processing', desc: "Send cloth for dyeing, printing, or processing to vendors", icon: Palette, color: '#10b981' },

    doubling_twisting: { key: 'doubling_twisting', label: "Doubling/Twisting Order", section: 'Transactions', category: 'Yarn & Fabric Prep', desc: "Create orders for yarn doubling and twisting process", icon: Layers, color: '#0891b2' },
    warp_sizing_order: { key: 'warp_sizing_order', label: "Warping/Sizing Order", section: 'Transactions', category: 'Yarn & Fabric Prep', desc: "Create warping/sizing orders specifically for yarn-dyed fabric", icon: Layers, color: '#0891b2' },
    internal_fabric_req: { key: 'internal_fabric_req', label: "Internal Fabric Request", section: 'Transactions', category: 'Yarn & Fabric Prep', desc: "Request fabric from internal stock for production/sampling", icon: ShoppingBag, color: '#0891b2' },

    short_amd: { key: 'short_amd', label: "Short AMD", section: 'Transactions', category: 'Amendments & Codes', desc: "Record short/partial amendments to existing orders", icon: Edit, color: '#475569' },
    hsn_amd: { key: 'hsn_amd', label: "HSN Code AMD", section: 'Transactions', category: 'Amendments & Codes', desc: "Update or correct HSN codes on existing orders/invoices", icon: Edit, color: '#475569' },

    // 2. WORK ORDER APPROVAL
    buyer_order_app: { key: 'buyer_order_app', label: "Buyer Order Approval", section: 'Approvals', category: 'External Order Approvals', desc: "Formally approve buyer orders before production starts", icon: CheckSquare, color: '#6366f1' },
    pi_app: { key: 'pi_app', label: "PI Approval", section: 'Approvals', category: 'External Order Approvals', desc: "Approve Proforma Invoice before sending to buyer", icon: CheckSquare, color: '#6366f1' },
    vendor_work_app: { key: 'vendor_work_app', label: "Vendor Work Order Approval", section: 'Approvals', category: 'External Order Approvals', desc: "Approve work orders issued to vendors before release", icon: CheckSquare, color: '#6366f1' },

    internal_fabric_app: { key: 'internal_fabric_app', label: "Internal Fabric Request Approval", section: 'Approvals', category: 'Material & Yarn Approvals', desc: "Approve internal fabric requests from departments", icon: CheckSquare, color: '#0d9488' },
    yarn_req_app: { key: 'yarn_req_app', label: "Yarn Requirement Approval", section: 'Approvals', category: 'Material & Yarn Approvals', desc: "Approve yarn requirement requests before purchase/issue", icon: CheckSquare, color: '#0d9488' },
    yarn_work_app: { key: 'yarn_work_app', label: "Yarn Work Orders Approval", section: 'Approvals', category: 'Material & Yarn Approvals', desc: "Approve work orders for yarn processing (dyeing/twisting)", icon: CheckSquare, color: '#0d9488' },

    // 3. WORK ORDER COMPLETION
    vendor_order_comp: { key: 'vendor_order_comp', label: "Vendor Order Completion", section: 'Completions', category: 'Vendor & Purchase Completion', desc: "Mark vendor weaving orders as complete after fabric received", icon: CheckSquare, color: '#10b981' },
    cloth_po_comp: { key: 'cloth_po_comp', label: "Cloth Purchase Order Completion", section: 'Completions', category: 'Vendor & Purchase Completion', desc: "Mark cloth purchase orders complete after full receipt", icon: CheckSquare, color: '#10b981' },

    dyeing_order_comp: { key: 'dyeing_order_comp', label: "Dyeing Order Completion", section: 'Completions', category: 'Processing & Fabric Completion', desc: "Mark dyeing orders complete after dyed material received", icon: CheckSquare, color: '#3b82f6' },
    warp_sizing_comp: { key: 'warp_sizing_comp', label: "Warping/Sizing Order Completion", section: 'Completions', category: 'Processing & Fabric Completion', desc: "Mark warping/sizing orders complete", icon: CheckSquare, color: '#3b82f6' },
    cloth_dyeing_comp: { key: 'cloth_dyeing_comp', label: "Cloth Dyeing/Processing Order Completion", section: 'Completions', category: 'Processing & Fabric Completion', desc: "Mark cloth dyeing/processing orders complete", icon: CheckSquare, color: '#3b82f6' },

    // 4. DC APPROVAL
    gra_approval: { key: 'gra_approval', label: "GRA Approval", section: 'DCApprovals', category: 'DC Approvals', desc: "Approve Goods Release Advice before fabric dispatch", icon: CheckSquare },
    surplus_dc_app: { key: 'surplus_dc_app', label: "Surplus DC Approval", section: 'DCApprovals', category: 'DC Approvals', desc: "Approve delivery challans for surplus stock dispatch", icon: CheckSquare }
  };

  // =========================================================================
  // ACTIONS HANDLERS
  // =========================================================================
  const getSubModuleCount = (key) => {
    switch (key) {
      case 'design_create': return designOrders.length;
      case 'dev_bulk_order': return bulkOrders.length;
      case 'dev_bulk_followup': return orderFollowups.length;
      case 'short_amd': return shortAmendments.length;
      case 'hsn_amd': return hsnAmendments.length;
      case 'vendor_order': return vendorOrders.length;
      case 'dyeing_order': return dyeingOrders.length;
      case 'doubling_twisting': return twistingOrders.length;
      case 'warp_sizing_order': return warpingOrders.length;
      case 'internal_fabric_req': return fabricRequests.length;
      case 'cloth_po': return clothPurchaseOrders.length;
      case 'cloth_dyeing_order': return clothProcessingOrders.length;
      case 'vendor_order_comp': return vendorCompletions.length;
      case 'cloth_po_comp': return clothPoCompletions.length;
      case 'dyeing_order_comp': return dyeingCompletions.length;
      case 'warp_sizing_comp': return warpSizingCompletions.length;
      case 'cloth_dyeing_comp': return clothDyeingCompletions.length;
      case 'buyer_order_app': return buyerOrderApprovals.length;
      case 'pi_app': return piApprovals.length;
      case 'vendor_work_app': return vendorWorkApprovals.length;
      case 'internal_fabric_app': return internalFabricApprovals.length;
      case 'yarn_req_app': return yarnReqApprovals.length;
      case 'yarn_work_app': return yarnWorkApprovals.length;
      default: return 0;
    }
  };

  const handleOpenPage = (p) => {
    setActivePage(p.key);
    setSelectedRecord(null);
    setIsFormOpen(false);
  };

  const handleCreateNew = () => {
    let nextId = '';
    const dateToday = new Date().toISOString().substring(0, 10);

    if (activePage === 'design_create') {
      nextId = `DES-ORD-${designOrders.length + 1}`;
      setFields({
        id: nextId,
        designDate: dateToday,
        buyerName: 'Raymond Ltd',
        season: 'Summer 2026',
        collectionName: '',
        designName: '',
        developmentType: 'Sample',
        fabricType: '',
        construction: '',
        composition: '',
        width: 58,
        gsm: '',
        finishType: '',
        weaveType: '',
        warpYarnCount: '',
        weftYarnCount: '',
        yarnType: '',
        yarnQuality: '',
        millName: '',
        groundColor: '',
        designColor: '',
        patternType: '',
        repeatSize: '',
        cadRefNo: '',
        targetRate: '',
        estimatedCost: '',
        moq: '',
        buyerTargetDate: dateToday,
        assignedMerchant: '',
        assignedDesigner: '',
        samplingRequired: 'No',
        loomType: '',
        processRoute: '',
        designStatus: 'Draft',
        approvedBy: 'Dinesh Balasamy (MD)',
        designImage: '',
        cadUpload: '',
        refImage: '',
        technicalRemarks: '',
        buyerRemarks: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'short_amd') {
      nextId = `SHT-AMD-00${shortAmendments.length + 1}`;
      setFields({
        id: nextId,
        amendmentDate: dateToday,
        amendmentType: 'Quantity Change',
        buyerOrderNo: '',
        workOrderNo: '',
        invoiceNo: '',
        dispatchNo: '',
        buyerName: 'Raymond Ltd',
        merchantName: '',
        fabricName: '',
        designNo: '',
        composition: '',
        width: '',
        gsm: '',
        shade: '',
        originalQuantity: '',
        revisedQuantity: '',
        shortQuantity: '',
        excessQuantity: '',
        balanceQuantity: '',
        uom: 'Mtrs',
        oldRate: '',
        newRate: '',
        differenceAmount: '',
        originalDeliveryDate: dateToday,
        revisedDeliveryDate: dateToday,
        delayDays: '0',
        amendmentReason: '',
        buyerRequestRef: '',
        internalApprovalReason: '',
        requestedBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        approvalStatus: 'Pending Approval',
        buyerEmailUpload: '',
        approvalDocUpload: '',
        supportingFileUpload: '',
        amendmentNotes: '',
        internalNotes: '',
        productionRemarks: ''
      });
    }
    else if (activePage === 'hsn_amd') {
      nextId = `HSN-AMD-00${hsnAmendments.length + 1}`;
      setFields({
        id: nextId,
        amendmentDate: dateToday,
        amendmentCategory: 'Invoice',
        productName: '',
        fabricName: '',
        invoiceNo: '',
        poNo: '',
        buyerOrderNo: '',
        oldHsnCode: '',
        oldGstPct: '5',
        existingProductCategory: '',
        newHsnCode: '',
        newGstPct: '5',
        revisedProductCategory: '',
        taxDifferenceAmount: '',
        previousTaxValue: '',
        revisedTaxValue: '',
        hsnCorrectionReason: '',
        gstComplianceReason: '',
        auditCorrectionNotes: '',
        requestedBy: '',
        verifiedBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        approvedDate: dateToday,
        gstFilingImpact: 'No',
        eInvoiceUpdateRequired: 'No',
        accountsUpdateStatus: 'Pending',
        approvalStatus: 'Pending',
        gstDocUpload: '',
        invoiceUpload: '',
        auditReportUpload: '',
        taxNotes: '',
        complianceRemarks: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'vendor_order') {
      nextId = `VND-ORD-00${vendorOrders.length + 1}`;
      setFields({
        id: nextId,
        orderDate: dateToday,
        orderType: 'Weaving',
        vendorName: 'Standard Weaving Co.',
        vendorCode: 'VND-082',
        contactPerson: '',
        mobileNo: '',
        gstNo: '',
        address: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        fabricName: '',
        yarnCount: '',
        yarnType: '',
        composition: '',
        fabricWidth: '',
        gsm: '',
        shade: '',
        orderedQuantity: '',
        uom: 'Mtrs',
        sentQuantity: '',
        balanceQuantity: '',
        processName: '',
        machineType: '',
        requiredFinish: '',
        deliveryDate: dateToday,
        expectedReturnDate: dateToday,
        transportDetails: '',
        vendorRate: '',
        totalAmount: '',
        taxPct: '5',
        paymentTerms: '',
        qcRequired: 'No',
        qualityStandard: '',
        inspectionRequired: 'No',
        orderStatus: 'Pending',
        createdBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        approvalDate: dateToday,
        poDocumentUpload: '',
        yarnFabricImageUpload: '',
        technicalSheetUpload: '',
        vendorInstructions: '',
        internalNotes: '',
        technicalRemarks: ''
      });
    }
    else if (activePage === 'cloth_po') {
      nextId = `CPO-${String(clothPurchaseOrders.length + 1).padStart(5, '0')}`;
      setFields({
        id: nextId,
        purchaseDate: dateToday,
        purchaseType: 'Grey Cloth',
        supplierName: 'Raymond Ltd',
        supplierCode: 'SUP-001',
        contactPerson: '',
        mobileNo: '',
        gstNo: '',
        fabricName: '',
        designNo: '',
        fabricType: '',
        construction: '',
        composition: '',
        width: '',
        gsm: '',
        shadeColor: '',
        orderedQuantity: '',
        receivedQuantity: '',
        pendingQuantity: '',
        uom: 'Mtrs',
        purchaseRate: '',
        discount: '0',
        taxPct: '5',
        totalAmount: '',
        currency: 'INR',
        deliveryDate: dateToday,
        deliveryLocation: '',
        transportName: '',
        vehicleNo: '',
        qcStatus: 'Pending',
        inspectionStatus: 'Pending',
        defectDetails: '',
        warehouseLocation: '',
        rackNo: '',
        batchNo: '',
        lotNo: '',
        paymentTerms: '',
        advanceAmount: '',
        dueAmount: '',
        poStatus: 'Draft',
        createdBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        purchaseInvoiceUpload: '',
        fabricImageUpload: '',
        qualityReportUpload: '',
        purchaseNotes: '',
        qcRemarks: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'dyeing_order') {
      nextId = `DYE-ORD-00${dyeingOrders.length + 1}`;
      setFields({
        id: nextId,
        orderDate: dateToday,
        dyeingType: 'Yarn Dyeing',
        dyeingUnitName: 'Standard Dyehouse A',
        vendorCode: 'VND-DYE-04',
        contactPerson: '',
        mobileNo: '',
        gstNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        sampleRefNo: '',
        yarnFabricType: '',
        yarnCount: '',
        composition: '',
        gsm: '',
        width: '',
        lotNo: '',
        batchNo: '',
        shadeName: '',
        shadeCode: '',
        pantoneRef: '',
        colorCategory: '',
        labDipStatus: 'Pending',
        sentQuantity: '',
        uom: 'Kgs',
        expectedReturnQuantity: '',
        wastageAllowancePct: '2',
        dyeingMethod: '',
        machineType: '',
        processRoute: '',
        chemicalType: '',
        softenerRequired: 'No',
        finishRequired: '',
        sentDate: dateToday,
        expectedDeliveryDate: dateToday,
        transportDetails: '',
        vehicleNo: '',
        dyeingRate: '',
        totalAmount: '',
        taxPct: '5',
        paymentTerms: '',
        colorFastnessRequired: '',
        shrinkageControl: '',
        gsmTolerance: '',
        shadeMatchingStatus: '',
        qcRequired: 'No',
        orderStatus: 'Pending',
        createdBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        approvedDate: dateToday,
        shadeImageUpload: '',
        labReportUpload: '',
        dyeingInstructionsUpload: '',
        technicalRemarks: '',
        dyeingInstructions: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'cloth_dyeing_order') {
      nextId = `CL-PROC-00${clothProcessingOrders.length + 1}`;
      setFields({
        id: nextId,
        processingDate: dateToday,
        processingType: 'Dyeing',
        processingUnitName: 'Apex Dyeing & Printing Ltd',
        vendorName: 'Apex Processing Unit',
        contactPerson: '',
        mobileNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        fabricBatchNo: '',
        designNo: '',
        fabricName: '',
        fabricType: '',
        construction: '',
        composition: '',
        gsm: '',
        width: '',
        shade: '',
        greyFabricQty: '',
        sentQty: '',
        receivedQty: '',
        balanceQty: '',
        uom: 'Mtrs',
        processRoute: '',
        requiredFinish: '',
        shrinkagePct: '',
        widthRequirement: '',
        gsmRequirement: '',
        softFinish: 'No',
        peachFinish: 'No',
        bioWash: 'No',
        siliconWash: 'No',
        printType: '',
        printRepeat: '',
        screenNo: '',
        printColorCount: '',
        machineName: '',
        machineCapacity: '',
        operatorName: '',
        sentDate: dateToday,
        expectedDeliveryDate: dateToday,
        actualDeliveryDate: '',
        processingRate: '',
        totalCost: '',
        additionalCharges: '',
        taxPct: '5',
        shadeMatching: '',
        shrinkageTest: '',
        colorFastness: '',
        handFeelCheck: '',
        qcStatus: 'Pending',
        inspectionResult: 'Pending',
        productionStatus: 'Pending',
        createdBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        qcApprovedBy: '',
        processingSheetUpload: '',
        qcReportUpload: '',
        fabricImageUpload: '',
        technicalInstructions: '',
        qcRemarks: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'dev_bulk_order') {
      nextId = `DBO-${String(bulkOrders.length + 1).padStart(5, '0')}`;
      setFields({
        id: nextId,
        orderDate: dateToday,
        orderType: 'Development',
        designRefNo: '',
        buyerName: 'Raymond Ltd',
        buyerOrderNo: '',
        customerPoNo: '',
        merchantName: '',
        fabricName: '',
        designName: '',
        composition: '',
        width: '',
        gsm: '',
        finish: '',
        orderQuantity: '',
        uom: 'Mtrs',
        sampleQuantity: '',
        productionQuantity: '',
        deliveryDate: dateToday,
        shipmentDate: dateToday,
        priorityLevel: 'Medium',
        loomAllocation: '',
        processRoute: '',
        dyeingRequired: 'No',
        printingRequired: 'No',
        finishingRequired: 'No',
        targetCost: '',
        sellingPrice: '',
        marginPct: '',
        currency: 'INR',
        createdBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        approvalStatus: 'Pending',
        orderStatus: 'Pending',
        techPackUpload: '',
        buyerSpecUpload: '',
        sampleImageUpload: '',
        technicalRemarks: '',
        productionNotes: ''
      });
    }
    else if (activePage === 'dev_bulk_followup') {
      nextId = `DBF-${String(orderFollowups.length + 1).padStart(5, '0')}`;
      setFields({
        id: nextId,
        followupDate: dateToday,
        relatedOrderNo: '',
        buyerName: 'Raymond Ltd',
        productionStatus: 'Warping',
        processCompletionPct: 0,
        orderedQty: '',
        producedQty: '',
        pendingQty: '',
        rejectedQty: '',
        plannedDate: dateToday,
        actualDate: dateToday,
        delayDays: 0,
        nextFollowupDate: dateToday,
        qcStatus: 'Pending',
        inspectionResult: '',
        defectDetails: '',
        readyForDispatch: 'No',
        packingStatus: 'Pending',
        dispatchDate: dateToday,
        followupBy: '',
        productionIncharge: 'Dinesh Balasamy (MD)',
        merchantName: '',
        status: 'Running',
        progressImages: '',
        qcReports: '',
        productionReports: '',
        followupRemarks: '',
        delayReason: '',
        actionTaken: ''
      });
    }
    else if (activePage === 'doubling_twisting') {
      nextId = `DBT-ORD-00${twistingOrders.length + 1}`;
      setFields({
        id: nextId,
        orderDate: dateToday,
        processType: 'Doubling + Twisting',
        twistingUnitName: 'Apex Twisting Unit',
        vendorName: 'Apex Textiles',
        contactPerson: '',
        mobileNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        yarnType: '',
        yarnCount: '',
        singlePlyCount: '',
        finalCount: '',
        yarnQuality: '',
        millName: '',
        lotNo: '',
        tpm: '',
        twistDirection: 'Z Twist',
        plyCount: '2',
        coneType: '',
        inputQuantity: '',
        outputQuantity: '',
        wastagePct: '1.5',
        uom: 'Kgs',
        machineName: '',
        spindleCount: '',
        operatorName: '',
        sentDate: dateToday,
        expectedDeliveryDate: dateToday,
        returnDate: '',
        processRate: '',
        totalAmount: '',
        additionalCharges: '',
        strengthCheck: '',
        yarnEvenness: '',
        breakageStatus: '',
        qcStatus: 'Pending',
        orderStatus: 'Pending',
        createdBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        yarnImageUpload: '',
        qcReportUpload: '',
        technicalSheetUpload: '',
        technicalRemarks: '',
        productionNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'warp_sizing_order') {
      nextId = `WARP-SIZ-00${warpingOrders.length + 1}`;
      setFields({
        id: nextId,
        orderDate: dateToday,
        processType: 'Warping + Sizing',
        warpingUnitName: 'Dinesh Warping Unit',
        sizingUnitName: 'Dinesh Sizing Unit',
        vendorName: 'Dinesh Exports',
        operatorName: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        loomPlanNo: '',
        warpYarnCount: '',
        yarnType: '',
        millName: '',
        lotNo: '',
        shade: '',
        beamNo: '',
        beamWidth: '',
        totalEnds: '',
        beamLength: '',
        noOfBeams: '1',
        sizeMaterialType: '',
        sizePct: '',
        moisturePct: '',
        stretchPct: '',
        speed: '',
        reedCount: '',
        dentingPlan: '',
        epi: '',
        warpMeter: '',
        inputYarnQty: '',
        outputBeamQty: '',
        wastagePct: '1',
        machineName: '',
        machineCapacity: '',
        shift: 'Shift A',
        startDate: dateToday,
        expectedCompletionDate: dateToday,
        deliveryDate: '',
        beamHardness: '',
        tensionCheck: '',
        moistureCheck: '',
        breakageStatus: '',
        qcStatus: 'Pending',
        processRate: '',
        totalCost: '',
        orderStatus: 'Pending',
        createdBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        beamImageUpload: '',
        warpPlanUpload: '',
        qcReportUpload: '',
        technicalInstructions: '',
        processNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'internal_fabric_req') {
      nextId = `IFR-REQ-00${fabricRequests.length + 1}`;
      setFields({
        id: nextId,
        requestDate: dateToday,
        requestType: 'Production',
        requestedDepartment: 'Production Planning',
        requestedBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        fabricBatchNo: '',
        fabricName: '',
        fabricType: '',
        construction: '',
        composition: '',
        gsm: '',
        width: '',
        shade: '',
        requestedQuantity: '',
        availableQuantity: '',
        issuedQuantity: '',
        balanceQuantity: '',
        uom: 'Mtrs',
        requestPurpose: '',
        priorityLevel: 'Medium',
        requiredDate: dateToday,
        warehouseLocation: '',
        rackNo: '',
        rollNo: '',
        lotNo: '',
        issueDate: '',
        receivedDate: '',
        issuedBy: '',
        receivedBy: '',
        qcRequired: 'No',
        inspectionStatus: 'Pending',
        defectRemarks: '',
        requestStatus: 'Pending',
        fabricImageUpload: '',
        requestSheetUpload: '',
        internalNotes: '',
        approvalRemarks: '',
        technicalRemarks: ''
      });
    }
    else if (activePage === 'vendor_order_comp') {
      nextId = `VND-COMP-00${vendorCompletions.length + 1}`;
      setFields({
        id: nextId,
        completionDate: dateToday,
        completionType: 'Weaving Completion',
        vendorName: 'Standard Weaving Co.',
        vendorCode: 'VND-082',
        contactPerson: '',
        vendorOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        fabricName: '',
        yarnCount: '',
        fabricType: '',
        composition: '',
        gsm: '',
        width: '',
        shade: '',
        sentQuantity: '',
        receivedQuantity: '',
        shortQuantity: '',
        excessQuantity: '',
        rejectedQuantity: '',
        wastageQuantity: '',
        uom: 'Mtrs',
        processName: 'Weaving',
        machineUsed: '',
        completionStatus: 'Completed',
        processResult: '',
        qcStatus: 'QC Approved',
        inspectionResult: '',
        shadeMatching: '',
        shrinkageResult: '',
        defectDetails: '',
        reworkRequired: 'No',
        sentDate: dateToday,
        receivedDate: dateToday,
        delayDays: '0',
        transportDetails: '',
        vendorRate: '',
        totalProcessCost: '',
        additionalCharges: '',
        penaltyAmount: '',
        warehouseLocation: '',
        batchNo: '',
        lotNo: '',
        stockUpdatedStatus: 'Yes',
        receivedBy: '',
        qcApprovedBy: '',
        accountsVerifiedBy: 'Dinesh Balasamy (MD)',
        qcReportUpload: '',
        vendorInvoiceUpload: '',
        materialImageUpload: '',
        qcRemarks: '',
        vendorRemarks: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'cloth_po_comp') {
      nextId = `CPO-COMP-00${clothPoCompletions.length + 1}`;
      setFields({
        id: nextId,
        completionDate: dateToday,
        completionType: 'Full Receipt',
        supplierName: 'Raymond Ltd',
        supplierCode: 'SUP-001',
        contactPerson: '',
        gstNo: '',
        clothPurchaseOrderNo: '',
        invoiceNo: '',
        grnNo: '',
        buyerOrderNo: '',
        fabricName: '',
        designNo: '',
        fabricType: '',
        construction: '',
        composition: '',
        gsm: '',
        width: '',
        shadeColor: '',
        orderedQuantity: '',
        receivedQuantity: '',
        pendingQuantity: '',
        shortQuantity: '',
        rejectedQuantity: '',
        uom: 'Mtrs',
        qcStatus: 'QC Approved',
        fabricInspectionResult: '',
        shadeMatching: '',
        gsmCheck: '',
        widthCheck: '',
        defectPoints: '',
        shrinkageTest: '',
        purchaseRate: '',
        invoiceAmount: '',
        taxAmount: '',
        discount: '0',
        finalAmount: '',
        warehouseLocation: '',
        rackNo: '',
        rollNo: '',
        batchNo: '',
        lotNo: '',
        deliveryDate: dateToday,
        vehicleNo: '',
        transportName: '',
        paymentStatus: 'Paid',
        accountsVerification: 'Verified',
        debitCreditNoteRequired: 'No',
        receivedBy: '',
        qcApprovedBy: '',
        storeApprovedBy: 'Dinesh Balasamy (MD)',
        supplierInvoiceUpload: '',
        qcReportUpload: '',
        fabricImageUpload: '',
        qcRemarks: '',
        purchaseRemarks: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'dyeing_order_comp') {
      nextId = `DYE-COMP-00${dyeingCompletions.length + 1}`;
      setFields({
        id: nextId,
        completionDate: dateToday,
        completionType: 'Fabric Dyeing',
        dyeingUnitName: 'Standard Dyeing Unit',
        vendorName: '',
        contactPerson: '',
        dyeingOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        fabricName: '',
        yarnCount: '',
        fabricType: '',
        composition: '',
        gsm: '',
        width: '',
        shadeName: '',
        shadeCode: '',
        sentQuantity: '',
        receivedQuantity: '',
        shortQuantity: '',
        rejectedQuantity: '',
        balanceQuantity: '',
        uom: 'Kgs',
        shadeMatchingStatus: 'Approved',
        labDipApproval: 'Yes',
        colorFastnessResult: 'Passed',
        shrinkageResult: '1.5%',
        handFeelResult: 'Soft',
        qcStatus: 'QC Approved',
        inspectionResult: 'No Defects Found',
        defectDetails: '',
        reprocessRequired: 'No',
        qcApprovedBy: '',
        sentDate: dateToday,
        receivedDate: dateToday,
        delayDays: '0',
        transportDetails: '',
        dyeingRate: '',
        totalAmount: '',
        additionalCharges: '0',
        penaltyAmount: '0',
        batchNo: '',
        lotNo: '',
        warehouseLocation: '',
        stockUpdateStatus: 'Yes',
        qcReportUpload: '',
        shadeApprovalUpload: '',
        dyedFabricImageUpload: '',
        qcRemarks: '',
        dyeingRemarks: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'warp_sizing_comp') {
      nextId = `WS-COMP-00${warpSizingCompletions.length + 1}`;
      setFields({
        id: nextId,
        completionDate: dateToday,
        completionType: 'Sizing',
        warpingUnitName: 'Apex Warping Mills',
        sizingUnitName: 'Apex Sizing Mills',
        operatorName: '',
        warpingSizingOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        loomPlanNo: '',
        beamNo: '',
        beamWidth: '',
        beamLength: '',
        totalEnds: '',
        noOfBeams: '',
        warpMeter: '',
        warpYarnCount: '',
        yarnType: '',
        millName: '',
        lotNo: '',
        shade: '',
        inputYarnQty: '',
        outputBeamQty: '',
        wastagePercent: '',
        breakageCount: '',
        moisturePercent: '',
        stretchPercent: '',
        beamHardness: '',
        tensionResult: '',
        sizingQuality: 'Good',
        qcStatus: 'QC Approved',
        beamInspectionResult: '',
        damageStatus: 'No Damage',
        reworkRequired: 'No',
        machineName: '',
        machineSpeed: '',
        shift: 'Day',
        startDate: dateToday,
        deliveryDate: dateToday,
        processRate: '',
        totalCost: '',
        additionalCharges: '0',
        beamStorageLocation: '',
        beamStatus: 'Ready',
        readyForWeavingStatus: 'Yes',
        beamImageUpload: '',
        qcReportUpload: '',
        warpPlanUpload: '',
        technicalRemarks: '',
        qcNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'cloth_dyeing_comp') {
      nextId = `CP-COMP-00${clothDyeingCompletions.length + 1}`;
      setFields({
        id: nextId,
        completionDate: dateToday,
        completionType: 'Finishing',
        processingUnitName: 'Modern Textile Processors',
        vendorName: '',
        contactPerson: '',
        processingOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        fabricBatchNo: '',
        designNo: '',
        fabricName: '',
        fabricType: '',
        construction: '',
        composition: '',
        gsm: '',
        width: '',
        shade: '',
        greyFabricQty: '',
        sentQty: '',
        processedQty: '',
        rejectedQty: '',
        balanceQty: '',
        uom: 'Mtrs',
        finalWidth: '',
        finalGsm: '',
        shrinkagePercent: '',
        shadeMatching: 'Approved',
        handFeelResult: 'Soft',
        finishResult: 'Passed',
        printType: '',
        printRepeat: '',
        printQualityResult: '',
        qcStatus: 'QC Approved',
        inspectionResult: '',
        defectPoints: '',
        colorFastness: 'Passed',
        reprocessRequired: 'No',
        machineName: '',
        operatorName: '',
        shift: 'Day',
        sentDate: dateToday,
        deliveryDate: dateToday,
        processingRate: '',
        totalCost: '',
        additionalCharges: '0',
        penaltyAmount: '0',
        warehouseLocation: '',
        rollNo: '',
        batchNo: '',
        lotNo: '',
        readyForDispatchStatus: 'Yes',
        qcApprovedBy: '',
        storeApprovedBy: '',
        productionApprovedBy: '',
        qcReportUpload: '',
        fabricImageUpload: '',
        processingSheetUpload: '',
        technicalRemarks: '',
        qcNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'buyer_order_app') {
      nextId = `BOA-00${buyerOrderApprovals.length + 1}`;
      setFields({
        id: nextId,
        approvalDate: dateToday,
        approvalType: 'Sample Approval',
        buyerName: '',
        buyerOrderNo: '',
        customerPoNumber: '',
        merchantName: '',
        orderDate: dateToday,
        deliveryDate: dateToday,
        shipmentDate: dateToday,
        priorityLevel: 'Medium',
        fabricName: '',
        designNo: '',
        fabricType: '',
        construction: '',
        composition: '',
        gsm: '',
        width: '',
        shadeColor: '',
        orderedQuantity: '',
        approvedQuantity: '',
        balanceQuantity: '',
        uom: 'Mtrs',
        buyerRate: '',
        currency: 'INR',
        totalOrderValue: '',
        paymentTerms: '',
        sampleApprovalStatus: 'Pending',
        labDipApproval: 'Pending',
        qualityStandard: '',
        packingInstructions: '',
        loomAllocation: '',
        processRoute: '',
        dyeingRequired: 'No',
        printingRequired: 'No',
        finishingRequired: 'No',
        qcApprovalStatus: 'Pending',
        inspectionRequirement: '',
        testingRequirement: '',
        approvedBy: '',
        approvedDate: dateToday,
        finalApprovalStatus: 'Pending',
        statusTracking: 'Pending',
        buyerPoUpload: '',
        techPackUpload: '',
        sampleApprovalUpload: '',
        buyerRemarks: '',
        technicalNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'pi_app') {
      nextId = `PIA-00${piApprovals.length + 1}`;
      setFields({
        id: nextId,
        piNumber: '',
        piDate: dateToday,
        buyerName: '',
        buyerCountry: '',
        contactPerson: '',
        currency: 'INR',
        buyerOrderNo: '',
        salesOrderNo: '',
        designNo: '',
        fabricProductName: '',
        fabricType: '',
        composition: '',
        gsm: '',
        width: '',
        shade: '',
        piQuantity: '',
        uom: 'Mtrs',
        unitRate: '',
        totalAmount: '',
        exchangeRate: '1',
        discount: '0',
        taxPercent: '0',
        freightCharges: '0',
        insuranceCharges: '0',
        paymentMode: '',
        advancePercent: '0',
        creditDays: '0',
        bankDetails: '',
        deliveryDate: dateToday,
        shipmentMode: 'Sea',
        portOfLoading: '',
        destinationPort: '',
        incoterms: 'FOB',
        preparedBy: '',
        verifiedBy: '',
        approvedBy: '',
        approvalDate: dateToday,
        exportComplianceStatus: 'Pending',
        documentationStatus: 'Pending',
        gstStatus: 'Pending',
        statusTracking: 'Draft',
        piDocumentUpload: '',
        buyerConfirmationUpload: '',
        commercialSheetUpload: '',
        commercialRemarks: '',
        exportNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'vendor_work_app') {
      nextId = `VWA-00${vendorWorkApprovals.length + 1}`;
      setFields({
        id: nextId,
        approvalDate: dateToday,
        approvalType: 'Dyeing',
        vendorName: '',
        vendorCode: '',
        contactPerson: '',
        mobileNo: '',
        vendorWorkOrderNo: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        yarnFabricName: '',
        yarnCount: '',
        fabricType: '',
        composition: '',
        gsm: '',
        width: '',
        shade: '',
        orderedQuantity: '',
        approvedQuantity: '',
        uom: 'Kgs',
        processName: '',
        machineType: '',
        processRoute: '',
        requiredFinish: '',
        vendorRate: '',
        totalAmount: '',
        additionalCharges: '0',
        paymentTerms: '',
        sentDate: dateToday,
        expectedDeliveryDate: dateToday,
        transportDetails: '',
        qcRequirement: '',
        inspectionRequirement: '',
        qualityStandard: '',
        rejectionAllowancePercent: '0',
        technicalParametersApproved: 'No',
        processSheetApproved: 'No',
        sampleApproved: 'No',
        preparedBy: '',
        verifiedBy: '',
        approvedBy: '',
        statusTracking: 'Pending',
        workOrderUpload: '',
        technicalSheetUpload: '',
        qcInstructionsUpload: '',
        technicalRemarks: '',
        vendorInstructions: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'internal_fabric_app') {
      nextId = `IFA-00${internalFabricApprovals.length + 1}`;
      setFields({
        id: nextId,
        approvalDate: dateToday,
        approvalType: 'Production',
        internalFabricRequestNo: '',
        requestDate: dateToday,
        requestedDepartment: '',
        requestedBy: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        fabricBatchNo: '',
        fabricName: '',
        fabricType: '',
        construction: '',
        composition: '',
        gsm: '',
        width: '',
        shade: '',
        requestedQuantity: '',
        approvedQuantity: '',
        availableQuantity: '',
        balanceQuantity: '',
        uom: 'Mtrs',
        warehouseLocation: '',
        rackNo: '',
        rollNo: '',
        lotNo: '',
        requestPurpose: '',
        priorityLevel: 'Medium',
        requiredDate: dateToday,
        qcStatus: 'Pending',
        inspectionRequired: 'No',
        fabricCondition: '',
        defectRemarks: '',
        verifiedBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        approvalStatus: 'Pending',
        issueStatus: 'Pending',
        issuedBy: '',
        issueDate: dateToday,
        statusTracking: 'Pending',
        fabricImageUpload: '',
        requestDocumentUpload: '',
        qcReportUpload: '',
        approvalRemarks: '',
        qcNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'yarn_req_app') {
      nextId = `YRA-00${yarnReqApprovals.length + 1}`;
      setFields({
        id: nextId,
        approvalDate: dateToday,
        yarnRequirementNo: '',
        requirementDate: dateToday,
        requestedBy: '',
        departmentName: '',
        buyerOrderNo: '',
        workOrderNo: '',
        designNo: '',
        yarnType: '',
        yarnCount: '',
        ply: '',
        yarnQuality: '',
        millName: '',
        shade: '',
        requiredQuantity: '',
        approvedQuantity: '',
        availableStockQuantity: '',
        pendingQuantity: '',
        uom: 'Kgs',
        warpConsumption: '',
        weftConsumption: '',
        totalConsumption: '',
        loomAllocation: '',
        productionTarget: '',
        requiredDate: dateToday,
        priorityLevel: 'Medium',
        purchaseRequired: 'No',
        preferredVendor: '',
        expectedPurchaseDate: dateToday,
        yarnQualityStandard: '',
        qcRequirement: '',
        testingRequirement: '',
        estimatedRate: '',
        estimatedCost: '',
        verifiedBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        approvalStatus: 'Pending',
        statusTracking: 'Pending',
        requirementSheetUpload: '',
        consumptionSheetUpload: '',
        yarnSpecificationUpload: '',
        technicalRemarks: '',
        planningNotes: '',
        internalNotes: ''
      });
    }
    else if (activePage === 'yarn_work_app') {
      nextId = `YWA-00${yarnWorkApprovals.length + 1}`;
      setFields({
        id: nextId,
        approvalDate: dateToday,
        workOrderType: 'Dyeing',
        yarnWorkOrderNo: '',
        workOrderDate: dateToday,
        vendorName: '',
        contactPerson: '',
        buyerOrderNo: '',
        designNo: '',
        productionPlanNo: '',
        yarnType: '',
        yarnCount: '',
        ply: '',
        yarnQuality: '',
        millName: '',
        lotNo: '',
        shade: '',
        orderedQuantity: '',
        approvedQuantity: '',
        sentQuantity: '',
        balanceQuantity: '',
        uom: 'Kgs',
        processName: '',
        machineType: '',
        technicalParameters: '',
        twistRequirement: '',
        shadeRequirement: '',
        sentDate: dateToday,
        expectedDeliveryDate: dateToday,
        priorityLevel: 'Medium',
        vendorRate: '',
        totalAmount: '',
        additionalCharges: '0',
        paymentTerms: '',
        qcRequirement: '',
        strengthTestRequired: 'No',
        shadeMatchingRequired: 'No',
        qualityStandard: '',
        preparedBy: '',
        verifiedBy: '',
        approvedBy: 'Dinesh Balasamy (MD)',
        statusTracking: 'Pending',
        workOrderUpload: '',
        yarnSpecificationUpload: '',
        qcInstructionsUpload: '',
        technicalInstructions: '',
        vendorNotes: '',
        internalNotes: ''
      });
    }
    else {
      // General Fallback
      nextId = `WO-TXN-00${designOrders.length + 1}`;
      setFields({ id: nextId, date: dateToday, remarks: '', status: 'Active' });
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activePage) return;

    try {
      const { id, db_id, date, status, buyerName, partyName, ...restFields } = fields;
      const payload = {
        module_type: activePage,
        date: fields.date || fields.designDate || fields.orderDate || fields.followupDate || fields.purchaseDate || fields.processingDate || fields.requestDate || fields.amendmentDate || fields.completionDate || fields.approvalDate || fields.piDate || new Date().toISOString().split('T')[0],
        buyer_name: fields.buyerName || fields.partyName || fields.vendorName || fields.supplierName || fields.dyeingUnitName || fields.processingUnitName || fields.requestedDepartment || fields.departmentName || fields.productName || fields.fabricName || fields.fabricProductName || fields.yarnFabricName || null,
        status: 'Active',
        details: restFields
      };

      if (currentFormId) {
        // Find the database ID
        const activeList = [
          ...designOrders, ...shortAmendments, ...hsnAmendments, ...vendorOrders,
          ...dyeingOrders, ...twistingOrders, ...warpingOrders, ...fabricRequests,
          ...clothPurchaseOrders, ...clothProcessingOrders, ...bulkOrders, ...orderFollowups,
          ...vendorCompletions, ...clothPoCompletions, ...dyeingCompletions, ...warpSizingCompletions, ...clothDyeingCompletions,
          ...buyerOrderApprovals, ...piApprovals, ...vendorWorkApprovals, ...internalFabricApprovals, ...yarnReqApprovals, ...yarnWorkApprovals
        ];
        const record = activeList.find(r => r.id === currentFormId);
        if (record && record.db_id) {
          await workOrderTransactionAPI.update(record.db_id, payload);
        } else {
          await workOrderTransactionAPI.create(payload);
        }
      } else {
        await workOrderTransactionAPI.create(payload);
      }

      setIsFormOpen(false);
      setSelectedRecord(null);
      alert("Work order transaction record saved successfully!");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction.");
    }
  };

  const handleDelete = async (id, db_id) => {
    if (!db_id) return;
    if (confirm("Are you sure you want to remove this work order ledger entry?")) {
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
              <ShoppingCart size={24} color="var(--primary)" /> {activeSection}
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
            .filter(p => (['Design & Development', 'Order Management', 'Processing', 'Yarn & Fabric Prep', 'Amendments & Codes', 'Transactions', 'Vendor & Purchase Completion', 'Processing & Fabric Completion', 'External Order Approvals', 'Material & Yarn Approvals'].includes(defaultSection) ? p.category === activeSection : p.section === activeSection))
            .map(p => {
              const isSelected = activePage === p.key;
              const IconComp = p.icon;
              const cardColor = p.color || '#3b82f6';
              const r = parseInt(cardColor.slice(1, 3), 16);
              const g = parseInt(cardColor.slice(3, 5), 16);
              const b = parseInt(cardColor.slice(5, 7), 16);

              return (
                <div
                  key={p.key}
                  className="card"
                  onClick={() => handleOpenPage(p)}
                  style={{
                    flex: '1 0 220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 16,
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${cardColor}` : '1px solid transparent',
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
            /* ========================================================================= */
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, overflowX: 'auto' }}>
                <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                      {PAGES_METADATA[activePage].label} Records Audit
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Complete audit-log and quality checks directory</span>
                  </div>
                  <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Plus size={16} /> Log New {PAGES_METADATA[activePage].label}
                  </button>
                </div>

                {/* DESIGN CREATE TABLE */}
                {activePage === 'design_create' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>DESIGN ORDER NO</th>
                          <th>DESIGN DATE</th>
                          <th>BUYER NAME</th>
                          <th>SEASON</th>
                          <th>DESIGN NAME</th>
                          <th style={{ textAlign: 'right' }}>GSM</th>
                          <th>CONSTRUCTION</th>
                          <th>WARP/WEFT COUNT</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {designOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.designDate || row.date}</td>
                            <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                            <td>{row.season}</td>
                            <td>{row.designName}</td>
                            <td style={{ textAlign: 'right' }}>{row.gsm || '-'}</td>
                            <td>{row.construction || '-'}</td>
                            <td>{row.warpYarnCount || row.weftYarnCount ? `${row.warpYarnCount || '-'}/${row.weftYarnCount || '-'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.designStatus || 'Draft').toLowerCase().replace(' ', '-')}`}>
                                {row.designStatus || 'Draft'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* DEVELOPMENT/BULK ORDER TABLE */}
                {activePage === 'dev_bulk_order' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>ORDER NO</th>
                          <th>ORDER DATE</th>
                          <th>ORDER TYPE</th>
                          <th>BUYER NAME</th>
                          <th>DESIGN REF</th>
                          <th style={{ textAlign: 'right' }}>QUANTITY</th>
                          <th>DELIVERY DATE</th>
                          <th>ORDER STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.orderDate || row.date}</td>
                            <td>{row.orderType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                            <td>{row.designRefNo || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.orderQuantity ? `${row.orderQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>{row.deliveryDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.orderStatus || 'Pending').toLowerCase()}`}>
                                {row.orderStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* DEVELOPMENT/BULK FOLLOWUP TABLE */}
                {activePage === 'dev_bulk_followup' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>FOLLOWUP NO</th>
                          <th>FOLLOWUP DATE</th>
                          <th>ORDER LINK</th>
                          <th>BUYER NAME</th>
                          <th>PRODUCTION STATUS</th>
                          <th style={{ textAlign: 'right' }}>COMPLETION %</th>
                          <th>NEXT FOLLOWUP</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderFollowups.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.followupDate || row.date}</td>
                            <td>{row.relatedOrderNo || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                            <td>{row.productionStatus || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.processCompletionPct || 0}%</td>
                            <td>{row.nextFollowupDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.status || 'Running').toLowerCase()}`}>
                                {row.status || 'Running'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* SHORT AMD TABLE */}
                {activePage === 'short_amd' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>AMENDMENT NO</th>
                          <th>DATE</th>
                          <th>AMENDMENT TYPE</th>
                          <th>ORDER/INV REF</th>
                          <th>BUYER NAME</th>
                          <th style={{ textAlign: 'right' }}>ORIGINAL QTY</th>
                          <th style={{ textAlign: 'right' }}>REVISED QTY</th>
                          <th style={{ textAlign: 'right' }}>SHORT QTY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shortAmendments.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.amendmentDate || row.date}</td>
                            <td>{row.amendmentType || '-'}</td>
                            <td>{row.buyerOrderNo || row.workOrderNo || row.invoiceNo || row.dispatchNo || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                            <td style={{ textAlign: 'right' }}>{row.originalQuantity ? `${row.originalQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.revisedQuantity ? `${row.revisedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>{row.shortQuantity ? `${row.shortQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.approvalStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.approvalStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* HSN CODE AMD TABLE */}
                {activePage === 'hsn_amd' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>HSN AMD NO</th>
                          <th>DATE</th>
                          <th>CATEGORY</th>
                          <th>REF NAME/NO</th>
                          <th>OLD HSN</th>
                          <th>NEW HSN</th>
                          <th style={{ textAlign: 'right' }}>OLD GST %</th>
                          <th style={{ textAlign: 'right' }}>NEW GST %</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hsnAmendments.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.amendmentDate || row.date}</td>
                            <td>{row.amendmentCategory || '-'}</td>
                            <td>{row.productName || row.fabricName || row.invoiceNo || row.poNo || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.oldHsnCode || '-'}</td>
                            <td style={{ fontWeight: 650, color: 'var(--primary)' }}>{row.newHsnCode || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.oldGstPct || '0'}%</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.newGstPct || '0'}%</td>
                            <td>
                              <span className={`badge badge-${(row.approvalStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.approvalStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* WARPING / SIZING ORDER TABLE */}
                {/* DOUBLING/TWISTING ORDER TABLE */}
                {activePage === 'doubling_twisting' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>TWISTING NO</th>
                          <th>ORDER DATE</th>
                          <th>PROCESS TYPE</th>
                          <th>TWISTING UNIT</th>
                          <th>YARN TYPE</th>
                          <th style={{ textAlign: 'right' }}>INPUT QTY</th>
                          <th>EXPECTED RETURN</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {twistingOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.orderDate || row.date}</td>
                            <td>{row.processType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.twistingUnitName}</td>
                            <td>{row.yarnType || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.inputQuantity ? `${row.inputQuantity} ${row.uom || 'Kgs'}` : '-'}</td>
                            <td>{row.expectedDeliveryDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.orderStatus || 'Pending').toLowerCase()}`}>
                                {row.orderStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* WARPING/SIZING ORDER TABLE */}
                {activePage === 'warp_sizing_order' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>WARPING NO</th>
                          <th>ORDER DATE</th>
                          <th>PROCESS TYPE</th>
                          <th>WARPING UNIT</th>
                          <th>DESIGN NO</th>
                          <th style={{ textAlign: 'right' }}>TOTAL ENDS</th>
                          <th style={{ textAlign: 'right' }}>WARP METER</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warpingOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.orderDate || row.date}</td>
                            <td>{row.processType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.warpingUnitName}</td>
                            <td>{row.designNo || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.totalEnds || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.warpMeter || '-'} Mtr</td>
                            <td>
                              <span className={`badge badge-${(row.orderStatus || 'Pending').toLowerCase()}`}>
                                {row.orderStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* INTERNAL FABRIC REQUEST TABLE */}
                {activePage === 'internal_fabric_req' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>REQUEST NO</th>
                          <th>REQUEST DATE</th>
                          <th>REQUEST TYPE</th>
                          <th>DEPARTMENT</th>
                          <th>FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>REQUESTED QTY</th>
                          <th>REQUIRED DATE</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fabricRequests.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.requestDate || row.date}</td>
                            <td>{row.requestType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.requestedDepartment}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.requestedQuantity ? `${row.requestedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>{row.requiredDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.requestStatus || 'Pending').toLowerCase()}`}>
                                {row.requestStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* VENDOR ORDER TABLE */}
                {activePage === 'vendor_order' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>VENDOR ORDER NO</th>
                          <th>ORDER DATE</th>
                          <th>ORDER TYPE</th>
                          <th>VENDOR NAME</th>
                          <th>DESIGN NO</th>
                          <th style={{ textAlign: 'right' }}>ORDERED QTY</th>
                          <th>EXPECTED RETURN</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.orderDate || row.date}</td>
                            <td>{row.orderType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                            <td>{row.designNo || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.orderedQuantity ? `${row.orderedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>{row.expectedReturnDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.orderStatus || 'Pending').toLowerCase()}`}>
                                {row.orderStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* CLOTH PURCHASE ORDER TABLE */}
                {activePage === 'cloth_po' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>CPO NO</th>
                          <th>PURCHASE DATE</th>
                          <th>PURCHASE TYPE</th>
                          <th>SUPPLIER NAME</th>
                          <th>FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>ORDERED QTY</th>
                          <th>DELIVERY DATE</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clothPurchaseOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.purchaseDate || row.date}</td>
                            <td>{row.purchaseType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.supplierName}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.orderedQuantity ? `${row.orderedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>{row.deliveryDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.poStatus || 'Draft').toLowerCase()}`}>
                                {row.poStatus || 'Draft'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* VENDOR ORDER COMPLETION TABLE */}
                {activePage === 'vendor_order_comp' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>COMPLETION NO</th>
                          <th>COMPLETION DATE</th>
                          <th>COMPLETION TYPE</th>
                          <th>VENDOR NAME</th>
                          <th>FABRIC/YARN NAME</th>
                          <th style={{ textAlign: 'right' }}>SENT QTY</th>
                          <th style={{ textAlign: 'right' }}>RECEIVED QTY</th>
                          <th style={{ textAlign: 'right' }}>SHORT QTY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorCompletions.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.completionDate || row.date}</td>
                            <td>{row.completionType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.sentQuantity ? `${row.sentQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.receivedQuantity ? `${row.receivedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{row.shortQuantity ? `${row.shortQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.completionStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.completionStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* CLOTH PURCHASE ORDER COMPLETION TABLE */}
                {activePage === 'cloth_po_comp' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>COMPLETION NO</th>
                          <th>COMPLETION DATE</th>
                          <th>COMPLETION TYPE</th>
                          <th>SUPPLIER NAME</th>
                          <th>FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>ORDERED QTY</th>
                          <th style={{ textAlign: 'right' }}>RECEIVED QTY</th>
                          <th>QC STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clothPoCompletions.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.completionDate || row.date}</td>
                            <td>{row.completionType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.supplierName}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.orderedQuantity ? `${row.orderedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.receivedQuantity ? `${row.receivedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.qcStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.qcStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* DYEING ORDER TABLE */}
                {activePage === 'dyeing_order' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>DYEING ORDER NO</th>
                          <th>ORDER DATE</th>
                          <th>DYEING TYPE</th>
                          <th>DYEING UNIT NAME</th>
                          <th>YARN/FABRIC TYPE</th>
                          <th style={{ textAlign: 'right' }}>SENT QUANTITY</th>
                          <th>EXPECTED DELIVERY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dyeingOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.orderDate || row.date}</td>
                            <td>{row.dyeingType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.dyeingUnitName}</td>
                            <td>{row.yarnFabricType || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.sentQuantity ? `${row.sentQuantity} ${row.uom || 'Kgs'}` : '-'}</td>
                            <td>{row.expectedDeliveryDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.orderStatus || 'Pending').toLowerCase()}`}>
                                {row.orderStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* CLOTH DYEING/PROCESSING ORDER TABLE */}
                {activePage === 'cloth_dyeing_order' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>PROCESSING ORDER NO</th>
                          <th>PROCESSING DATE</th>
                          <th>PROCESSING TYPE</th>
                          <th>PROCESSING UNIT</th>
                          <th>FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>SENT QTY</th>
                          <th>EXPECTED DELIVERY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clothProcessingOrders.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.processingDate || row.date}</td>
                            <td>{row.processingType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.processingUnitName}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.sentQty ? `${row.sentQty} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>{row.expectedDeliveryDate || '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.productionStatus || 'Pending').toLowerCase()}`}>
                                {row.productionStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* DYEING ORDER COMPLETION TABLE */}
                {activePage === 'dyeing_order_comp' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>COMPLETION NO</th>
                          <th>COMPLETION DATE</th>
                          <th>COMPLETION TYPE</th>
                          <th>DYEING UNIT</th>
                          <th>FABRIC/YARN NAME</th>
                          <th style={{ textAlign: 'right' }}>SENT QTY</th>
                          <th style={{ textAlign: 'right' }}>RECEIVED QTY</th>
                          <th>QC STATUS</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dyeingCompletions.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.completionDate || row.date}</td>
                            <td>{row.completionType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.dyeingUnitName}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.sentQuantity ? `${row.sentQuantity} ${row.uom || 'Kgs'}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.receivedQuantity ? `${row.receivedQuantity} ${row.uom || 'Kgs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.qcStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.qcStatus || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${(row.status || 'Completed').toLowerCase().replace(' ', '-')}`}>
                                {row.status || 'Completed'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* WARPING/SIZING ORDER COMPLETION TABLE */}
                {activePage === 'warp_sizing_comp' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>COMPLETION NO</th>
                          <th>COMPLETION DATE</th>
                          <th>COMPLETION TYPE</th>
                          <th>SIZING UNIT</th>
                          <th>BEAM NO</th>
                          <th style={{ textAlign: 'right' }}>INPUT YARN</th>
                          <th style={{ textAlign: 'right' }}>OUTPUT BEAM QTY</th>
                          <th>QC STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warpSizingCompletions.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.completionDate || row.date}</td>
                            <td>{row.completionType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.sizingUnitName}</td>
                            <td>{row.beamNo || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.inputYarnQty ? `${row.inputYarnQty} Kgs` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.outputBeamQty ? `${row.outputBeamQty} Mtrs` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.qcStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.qcStatus || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* CLOTH DYEING/PROCESSING ORDER COMPLETION TABLE */}
                {activePage === 'cloth_dyeing_comp' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>COMPLETION NO</th>
                          <th>COMPLETION DATE</th>
                          <th>COMPLETION TYPE</th>
                          <th>PROCESSING UNIT</th>
                          <th>FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>SENT QTY</th>
                          <th style={{ textAlign: 'right' }}>PROCESSED QTY</th>
                          <th>QC STATUS</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clothDyeingCompletions.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.completionDate || row.date}</td>
                            <td>{row.completionType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.processingUnitName}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.sentQty ? `${row.sentQty} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.processedQty ? `${row.processedQty} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.qcStatus || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.qcStatus || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge badge-${(row.status || 'Completed').toLowerCase().replace(' ', '-')}`}>
                                {row.status || 'Completed'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* BUYER ORDER APPROVAL TABLE */}
                {activePage === 'buyer_order_app' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>APPROVAL NO</th>
                          <th>APPROVAL DATE</th>
                          <th>APPROVAL TYPE</th>
                          <th>BUYER NAME</th>
                          <th>BUYER ORDER NO</th>
                          <th>FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>APPROVED QTY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buyerOrderApprovals.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.approvalDate || row.date}</td>
                            <td>{row.approvalType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.buyerName || '-'}</td>
                            <td>{row.buyerOrderNo || '-'}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.approvedQuantity ? `${row.approvedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.statusTracking || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.statusTracking || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* PI APPROVAL TABLE */}
                {activePage === 'pi_app' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>APPROVAL NO</th>
                          <th>PI NUMBER / DATE</th>
                          <th>BUYER NAME</th>
                          <th>PRODUCT NAME</th>
                          <th style={{ textAlign: 'right' }}>PI QTY</th>
                          <th style={{ textAlign: 'right' }}>TOTAL AMOUNT</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {piApprovals.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td style={{ fontWeight: 650 }}>{row.piNumber || '-'} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({row.piDate || row.date})</span></td>
                            <td>{row.buyerName || '-'}</td>
                            <td>{row.fabricProductName || '-'}</td>
                            <td style={{ textAlign: 'right' }}>{row.piQuantity ? `${row.piQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.totalAmount ? `${row.currency || 'INR'} ${Number(row.totalAmount).toLocaleString()}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.statusTracking || 'Draft').toLowerCase().replace(' ', '-')}`}>
                                {row.statusTracking || 'Draft'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* VENDOR WORK ORDER APPROVAL TABLE */}
                {activePage === 'vendor_work_app' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>APPROVAL NO</th>
                          <th>APPROVAL DATE</th>
                          <th>APPROVAL TYPE</th>
                          <th>VENDOR NAME</th>
                          <th>VENDOR WO NO</th>
                          <th>YARN/FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>APPROVED QTY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorWorkApprovals.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.approvalDate || row.date}</td>
                            <td>{row.approvalType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.vendorName || '-'}</td>
                            <td>{row.vendorWorkOrderNo || '-'}</td>
                            <td>{row.yarnFabricName || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.approvedQuantity ? `${row.approvedQuantity} ${row.uom || 'Kgs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.statusTracking || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.statusTracking || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* INTERNAL FABRIC REQUEST APPROVAL TABLE */}
                {activePage === 'internal_fabric_app' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>APPROVAL NO</th>
                          <th>APPROVAL DATE</th>
                          <th>APPROVAL TYPE</th>
                          <th>REQ DEPARTMENT</th>
                          <th>FABRIC NAME</th>
                          <th style={{ textAlign: 'right' }}>APPROVED QTY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {internalFabricApprovals.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.approvalDate || row.date}</td>
                            <td>{row.approvalType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.requestedDepartment || '-'}</td>
                            <td>{row.fabricName || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.approvedQuantity ? `${row.approvedQuantity} ${row.uom || 'Mtrs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.statusTracking || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.statusTracking || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* YARN REQUIREMENT APPROVAL TABLE */}
                {activePage === 'yarn_req_app' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>APPROVAL NO</th>
                          <th>APPROVAL DATE</th>
                          <th>YARN TYPE / COUNT</th>
                          <th>REQUESTED BY</th>
                          <th>MILL NAME</th>
                          <th style={{ textAlign: 'right' }}>APPROVED QTY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yarnReqApprovals.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.approvalDate || row.date}</td>
                            <td style={{ fontWeight: 650 }}>{row.yarnType || '-'} {row.yarnCount ? `(${row.yarnCount})` : ''}</td>
                            <td>{row.requestedBy || '-'}</td>
                            <td>{row.millName || '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.approvedQuantity ? `${row.approvedQuantity} ${row.uom || 'Kgs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.statusTracking || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.statusTracking || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* YARN WORK ORDERS APPROVAL TABLE */}
                {activePage === 'yarn_work_app' && (
                  <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                    <table className="data-table" style={{ width: '100%', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>APPROVAL NO</th>
                          <th>APPROVAL DATE</th>
                          <th>WO TYPE</th>
                          <th>VENDOR NAME</th>
                          <th>YARN TYPE / COUNT</th>
                          <th style={{ textAlign: 'right' }}>APPROVED QTY</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yarnWorkApprovals.map(row => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecord(row)}
                            style={{ cursor: 'pointer', background: selectedRecord?.id === row.id ? 'var(--bg-secondary)' : 'transparent' }}
                          >
                            <td style={{ fontWeight: 700 }}>{row.id}</td>
                            <td>{row.approvalDate || row.date}</td>
                            <td>{row.workOrderType || '-'}</td>
                            <td style={{ fontWeight: 650 }}>{row.vendorName || '-'}</td>
                            <td>{row.yarnType || '-'} {row.yarnCount ? `(${row.yarnCount})` : ''}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.approvedQuantity ? `${row.approvedQuantity} ${row.uom || 'Kgs'}` : '-'}</td>
                            <td>
                              <span className={`badge badge-${(row.statusTracking || 'Pending').toLowerCase().replace(' ', '-')}`}>
                                {row.statusTracking || 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
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

                {/* FALLBACK INFO PANEL */}
                {!['design_create', 'short_amd', 'hsn_amd', 'vendor_order_comp', 'cloth_po_comp', 'dyeing_order_comp', 'warp_sizing_comp', 'cloth_dyeing_comp', 'warp_sizing_order', 'dev_bulk_order', 'dev_bulk_followup', 'vendor_order', 'cloth_po', 'dyeing_order', 'cloth_dyeing_order', 'doubling_twisting', 'internal_fabric_req', 'buyer_order_app', 'pi_app', 'vendor_work_app', 'internal_fabric_app', 'yarn_req_app', 'yarn_work_app'].includes(activePage) && (
                  <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'white', width: '100%' }}>
                    <Sparkles size={36} style={{ color: '#0891b2', marginBottom: '12px', margin: '0 auto' }} />
                    <h4 style={{ fontWeight: 800, margin: 0 }}>{PAGES_METADATA[activePage].label} Database Active</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Record sheets and dynamic checklists are loaded. Click "Log New {PAGES_METADATA[activePage].label}" to populate details.
                    </p>
                  </div>
                )}

              </div>

              {/* RECORD DETAILS SIDE PANEL */}
              {selectedRecord && (
                <div style={{ flex: '0 0 350px' }}>
                  <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                        <ShoppingCart size={18} /> {selectedRecord.id}
                      </h3>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(selectedRecord)} title="Edit"><Edit size={14} /></button>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--text-muted)' }} onClick={() => setSelectedRecord(null)} title="Close"><X size={14} /></button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '4px' }}>
                      {Object.entries(selectedRecord)
                        .filter(([k]) => !['id'].includes(k))
                        .map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 500, textTransform: 'capitalize', fontSize: '13px' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%', fontSize: '13px', wordBreak: 'break-word' }}>{v || '-'}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure quality verification & order life-cycle registry</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <X size={15} /> Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#ec4899', borderColor: '#ec4899' }}>
                    <Check size={15} /> Save Record
                  </button>
                </div>
              </div>

              {/* DESIGN CREATE FORM */}
              {activePage === 'design_create' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Design Order No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Buyer Name *</label>
                      <select className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange}>
                        <option value="">Select Buyer</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label>Season *</label>
                      {!isCustomSeason ? (
                        <select className="form-control" name="season" value={fields.season || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomSeason(true);
                          else handleInputChange(e);
                        }}>
                          <option value="">Select Season</option>
                          {options.masters?.season_master?.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Season...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" className="form-control" placeholder="New season name..." value={customSeasonVal} onChange={e => setCustomSeasonVal(e.target.value)} autoFocus />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomSeason} style={{ padding: '6px 12px' }}><Check size={14} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => { setIsCustomSeason(false); setCustomSeasonVal(''); }} style={{ padding: '6px 12px' }}><X size={14} /></button>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Design Name *</label>
                      <input type="text" className="form-control" name="designName" value={fields.designName || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label>Fabric Type *</label>
                      {!isCustomFabricType ? (
                        <select className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomFabricType(true);
                          else handleInputChange(e);
                        }}>
                          <option value="">Select Fabric Type</option>
                          {options.masters?.fabric_type_master?.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Fabric Type...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" className="form-control" placeholder="New fabric type..." value={customFabricTypeVal} onChange={e => setCustomFabricTypeVal(e.target.value)} autoFocus />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomFabricType} style={{ padding: '6px 12px' }}><Check size={14} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => { setIsCustomFabricType(false); setCustomFabricTypeVal(''); }} style={{ padding: '6px 12px' }}><X size={14} /></button>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Composition *</label>
                      <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Width (Inch) *</label>
                      <input type="number" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Target Rate (₹) *</label>
                      <input type="number" className="form-control" name="targetRate" value={fields.targetRate || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  {/* CARD 3: Yarn Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Yarn Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warp Yarn Count *</label>
                        <input type="text" className="form-control" name="warpYarnCount" value={fields.warpYarnCount || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Weft Yarn Count *</label>
                        <input type="text" className="form-control" name="weftYarnCount" value={fields.weftYarnCount || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Yarn Type</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Quality</label>
                        <input type="text" className="form-control" name="yarnQuality" value={fields.yarnQuality || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mill Name</label>
                        <input type="text" className="form-control" name="millName" value={fields.millName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Color, Design & CAD */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Color, Design & CAD
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Ground Color</label>
                        <input type="text" className="form-control" name="groundColor" value={fields.groundColor || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design Color</label>
                        <input type="text" className="form-control" name="designColor" value={fields.designColor || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Pattern Type</label>
                        <input type="text" className="form-control" name="patternType" value={fields.patternType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Repeat Size</label>
                        <input type="text" className="form-control" name="repeatSize" value={fields.repeatSize || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>CAD Reference No</label>
                        <input type="text" className="form-control" name="cadRefNo" value={fields.cadRefNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Commercial Details & Planning */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details & Planning
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Target Rate (₹) *</label>
                        <input type="number" className="form-control" name="targetRate" value={fields.targetRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Estimated Cost (₹)</label>
                        <input type="number" className="form-control" name="estimatedCost" value={fields.estimatedCost || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>MOQ</label>
                        <input type="number" className="form-control" name="moq" value={fields.moq || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Target Date</label>
                        <input type="date" className="form-control" name="buyerTargetDate" value={fields.buyerTargetDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Assigned Merchant *</label>
                        <input type="text" className="form-control" name="assignedMerchant" value={fields.assignedMerchant || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Assigned Designer</label>
                        <input type="text" className="form-control" name="assignedDesigner" value={fields.assignedDesigner || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sampling Required *</label>
                        <select className="form-control" name="samplingRequired" value={fields.samplingRequired || 'No'} onChange={handleInputChange} required>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Loom Type</label>
                        <input type="text" className="form-control" name="loomType" value={fields.loomType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Process Route</label>
                        <input type="text" className="form-control" name="processRoute" value={fields.processRoute || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Approval, Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval, Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Design Status *</label>
                        <select className="form-control" name="designStatus" value={fields.designStatus || 'Draft'} onChange={handleInputChange} required>
                          <option value="Draft">Draft</option>
                          <option value="Under Development">Under Development</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Design Image Upload (URL/Path)</label>
                        <input type="text" className="form-control" name="designImage" value={fields.designImage || ''} onChange={handleInputChange} placeholder="e.g. /uploads/image.png" />
                      </div>
                      <div className="form-group">
                        <label>CAD File Upload (URL/Path) *</label>
                        <input type="text" className="form-control" name="cadUpload" value={fields.cadUpload || ''} onChange={handleInputChange} placeholder="e.g. /uploads/design.cad" required />
                      </div>
                      <div className="form-group">
                        <label>Reference Image (URL/Path)</label>
                        <input type="text" className="form-control" name="refImage" value={fields.refImage || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Remarks</label>
                        <textarea className="form-control" rows="3" name="buyerRemarks" value={fields.buyerRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* WARPING / SIZING ORDER FORM */}
              {activePage === 'warp_sizing_order' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Warping Order No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Vendor / Party Name *</label>
                      <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Design No *</label>
                      <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Order Type *</label>
                      <select className="form-control" name="orderType" value={fields.orderType || ''} onChange={handleInputChange}>
                        <option value="">Select Type</option>
                        <option value="Warping">Warping Only</option>
                        <option value="Sizing">Sizing Only</option>
                        <option value="Warping + Sizing">Warping + Sizing</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Total Ends *</label>
                      <input type="number" className="form-control" name="totalEnds" value={fields.totalEnds || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Warp Length (Meters) *</label>
                      <input type="number" className="form-control" name="warpLength" value={fields.warpLength || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Number of Beams *</label>
                      <input type="number" className="form-control" name="noOfBeams" value={fields.noOfBeams || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Total Order Value (₹)</label>
                      <input type="number" className="form-control" name="totalOrderValue" value={fields.totalOrderValue || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              )}

              {/* SHORT AMD FORM */}
              {/* SHORT AMD FORM */}
              {activePage === 'short_amd' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Amendment Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Amendment Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Amendment No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Amendment Date *</label>
                        <input type="date" className="form-control" name="amendmentDate" value={fields.amendmentDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Amendment Type *</label>
                        <select className="form-control" name="amendmentType" value={fields.amendmentType || 'Quantity Change'} onChange={handleInputChange} required>
                          <option value="Quantity Change">Quantity Change</option>
                          <option value="Rate Change">Rate Change</option>
                          <option value="Delivery Change">Delivery Change</option>
                          <option value="Specification Change">Specification Change</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Work Order No</label>
                        <input type="text" className="form-control" name="workOrderNo" value={fields.workOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Invoice No</label>
                        <input type="text" className="form-control" name="invoiceNo" value={fields.invoiceNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Dispatch No</label>
                        <input type="text" className="form-control" name="dispatchNo" value={fields.dispatchNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Party Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Party & Merchant Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <input type="text" className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Merchant Name</label>
                        <input type="text" className="form-control" name="merchantName" value={fields.merchantName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Fabric / Product Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric / Product Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Amendment */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Amendment
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
                      <div className="form-group">
                        <label>Original Qty</label>
                        <input type="number" className="form-control" name="originalQuantity" value={fields.originalQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Revised Qty</label>
                        <input type="number" className="form-control" name="revisedQuantity" value={fields.revisedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Short Qty</label>
                        <input type="number" className="form-control" name="shortQuantity" value={fields.shortQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Excess Qty</label>
                        <input type="number" className="form-control" name="excessQuantity" value={fields.excessQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Qty</label>
                        <input type="number" className="form-control" name="balanceQuantity" value={fields.balanceQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Commercial & Delivery Amendment */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial & Delivery Amendment
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
                      <div className="form-group">
                        <label>Old Rate (₹)</label>
                        <input type="number" className="form-control" name="oldRate" value={fields.oldRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>New Rate (₹)</label>
                        <input type="number" className="form-control" name="newRate" value={fields.newRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Difference (₹)</label>
                        <input type="number" className="form-control" name="differenceAmount" value={fields.differenceAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Original Delivery Date</label>
                        <input type="date" className="form-control" name="originalDeliveryDate" value={fields.originalDeliveryDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Revised Delivery Date</label>
                        <input type="date" className="form-control" name="revisedDeliveryDate" value={fields.revisedDeliveryDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delay Days</label>
                        <input type="number" className="form-control" name="delayDays" value={fields.delayDays || '0'} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Reason Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reason Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Amendment Reason *</label>
                        <input type="text" className="form-control" name="amendmentReason" value={fields.amendmentReason || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Buyer Request Ref</label>
                        <input type="text" className="form-control" name="buyerRequestRef" value={fields.buyerRequestRef || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Approval Reason</label>
                        <input type="text" className="form-control" name="internalApprovalReason" value={fields.internalApprovalReason || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Approval & Status Tracking */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Status Tracking
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Requested By</label>
                        <input type="text" className="form-control" name="requestedBy" value={fields.requestedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approval Status *</label>
                        <select className="form-control" name="approvalStatus" value={fields.approvalStatus || 'Pending Approval'} onChange={handleInputChange} required>
                          <option value="Draft">Draft</option>
                          <option value="Pending Approval">Pending Approval</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Buyer Email Upload (URL)</label>
                        <input type="text" className="form-control" name="buyerEmailUpload" value={fields.buyerEmailUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approval Document (URL)</label>
                        <input type="text" className="form-control" name="approvalDocUpload" value={fields.approvalDocUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Supporting File (URL)</label>
                        <input type="text" className="form-control" name="supportingFileUpload" value={fields.supportingFileUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Amendment Notes</label>
                        <textarea className="form-control" rows="3" name="amendmentNotes" value={fields.amendmentNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Remarks</label>
                        <textarea className="form-control" rows="3" name="productionRemarks" value={fields.productionRemarks || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* HSN CODE AMD FORM */}
              {activePage === 'hsn_amd' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Amendment Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Amendment Information & Category
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>HSN AMD No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Amendment Date *</label>
                        <input type="date" className="form-control" name="amendmentDate" value={fields.amendmentDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Amendment Category *</label>
                        <select className="form-control" name="amendmentCategory" value={fields.amendmentCategory || 'Invoice'} onChange={handleInputChange} required>
                          <option value="Product">Product</option>
                          <option value="Invoice">Invoice</option>
                          <option value="Purchase">Purchase</option>
                          <option value="Dispatch">Dispatch</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                      <div className="form-group">
                        <label>Product Name</label>
                        <input type="text" className="form-control" name="productName" value={fields.productName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Name</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Invoice No</label>
                        <input type="text" className="form-control" name="invoiceNo" value={fields.invoiceNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>PO No</label>
                        <input type="text" className="form-control" name="poNo" value={fields.poNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Existing HSN Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Existing HSN Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Old HSN Code *</label>
                        <input type="text" className="form-control" name="oldHsnCode" value={fields.oldHsnCode || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Old GST % *</label>
                        <select className="form-control" name="oldGstPct" value={fields.oldGstPct || '5'} onChange={handleInputChange} required>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Existing Product Category</label>
                        <input type="text" className="form-control" name="existingProductCategory" value={fields.existingProductCategory || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Revised HSN Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Revised HSN Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>New HSN Code *</label>
                        <input type="text" className="form-control" name="newHsnCode" value={fields.newHsnCode || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>New GST % *</label>
                        <select className="form-control" name="newGstPct" value={fields.newGstPct || '5'} onChange={handleInputChange} required>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Revised Product Category</label>
                        <input type="text" className="form-control" name="revisedProductCategory" value={fields.revisedProductCategory || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Tax Impact Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Tax Impact Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Tax Difference Amount (₹)</label>
                        <input type="number" className="form-control" name="taxDifferenceAmount" value={fields.taxDifferenceAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Previous Tax Value (₹)</label>
                        <input type="number" className="form-control" name="previousTaxValue" value={fields.previousTaxValue || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Revised Tax Value (₹)</label>
                        <input type="number" className="form-control" name="revisedTaxValue" value={fields.revisedTaxValue || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Amendment Reason */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Amendment Reason
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>HSN Correction Reason *</label>
                        <input type="text" className="form-control" name="hsnCorrectionReason" value={fields.hsnCorrectionReason || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>GST Compliance Reason</label>
                        <input type="text" className="form-control" name="gstComplianceReason" value={fields.gstComplianceReason || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Audit Correction Notes</label>
                        <input type="text" className="form-control" name="auditCorrectionNotes" value={fields.auditCorrectionNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Approval & Compliance Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Compliance Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Requested By</label>
                        <input type="text" className="form-control" name="requestedBy" value={fields.requestedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Verified By</label>
                        <input type="text" className="form-control" name="verifiedBy" value={fields.verifiedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approved Date *</label>
                        <input type="date" className="form-control" name="approvedDate" value={fields.approvedDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>GST Filing Impact</label>
                        <select className="form-control" name="gstFilingImpact" value={fields.gstFilingImpact || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>E-Invoice Update Required</label>
                        <select className="form-control" name="eInvoiceUpdateRequired" value={fields.eInvoiceUpdateRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Accounts Update Status</label>
                        <select className="form-control" name="accountsUpdateStatus" value={fields.accountsUpdateStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                          <option value="Updated">Updated</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approval Status *</label>
                        <select className="form-control" name="approvalStatus" value={fields.approvalStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Under Verification">Under Verification</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Updated">Updated</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>GST Document (URL)</label>
                        <input type="text" className="form-control" name="gstDocUpload" value={fields.gstDocUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Invoice (URL)</label>
                        <input type="text" className="form-control" name="invoiceUpload" value={fields.invoiceUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Audit Report (URL)</label>
                        <input type="text" className="form-control" name="auditReportUpload" value={fields.auditReportUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Tax Notes</label>
                        <textarea className="form-control" rows="3" name="taxNotes" value={fields.taxNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Compliance Remarks</label>
                        <textarea className="form-control" rows="3" name="complianceRemarks" value={fields.complianceRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* DEVELOPMENT / BULK ORDER FORM */}
              {activePage === 'dev_bulk_order' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Order Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Order Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Development/Bulk Order No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Order Date *</label>
                        <input type="date" className="form-control" name="orderDate" value={fields.orderDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Order Type *</label>
                        <select className="form-control" name="orderType" value={fields.orderType || 'Development'} onChange={handleInputChange} required>
                          <option value="Development">Development</option>
                          <option value="Bulk">Bulk</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Design Reference No *</label>
                        <input type="text" className="form-control" name="designRefNo" value={fields.designRefNo || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Buyer Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Buyer Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <select className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange} required>
                          <option value="">Select Buyer</option>
                          {BUYERS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Customer PO Number</label>
                        <input type="text" className="form-control" name="customerPoNo" value={fields.customerPoNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Merchant Name</label>
                        <input type="text" className="form-control" name="merchantName" value={fields.merchantName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design Name</label>
                        <input type="text" className="form-control" name="designName" value={fields.designName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Finish</label>
                        <input type="text" className="form-control" name="finish" value={fields.finish || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Quantity & Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity & Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Order Quantity *</label>
                        <input type="number" className="form-control" name="orderQuantity" value={fields.orderQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Sample Quantity</label>
                        <input type="number" className="form-control" name="sampleQuantity" value={fields.sampleQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Quantity</label>
                        <input type="number" className="form-control" name="productionQuantity" value={fields.productionQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date *</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Shipment Date</label>
                        <input type="date" className="form-control" name="shipmentDate" value={fields.shipmentDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Priority Level</label>
                        <select className="form-control" name="priorityLevel" value={fields.priorityLevel || 'Medium'} onChange={handleInputChange}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Production Planning */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Production Planning
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Loom Allocation</label>
                        <input type="text" className="form-control" name="loomAllocation" value={fields.loomAllocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Process Route</label>
                        <input type="text" className="form-control" name="processRoute" value={fields.processRoute || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Dyeing Required</label>
                        <select className="form-control" name="dyeingRequired" value={fields.dyeingRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Printing Required</label>
                        <select className="form-control" name="printingRequired" value={fields.printingRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Finishing Required</label>
                        <select className="form-control" name="finishingRequired" value={fields.finishingRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Commercial Section */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Section
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Target Cost</label>
                        <input type="number" className="form-control" name="targetCost" value={fields.targetCost || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Selling Price</label>
                        <input type="number" className="form-control" name="sellingPrice" value={fields.sellingPrice || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Margin %</label>
                        <input type="number" className="form-control" name="marginPct" value={fields.marginPct || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Currency</label>
                        <select className="form-control" name="currency" value={fields.currency || 'INR'} onChange={handleInputChange}>
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Approval & Status */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Created By</label>
                        <input type="text" className="form-control" name="createdBy" value={fields.createdBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
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
                      <div className="form-group">
                        <label>Order Status *</label>
                        <select className="form-control" name="orderStatus" value={fields.orderStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Tech Pack Upload (URL/Path)</label>
                        <input type="text" className="form-control" name="techPackUpload" value={fields.techPackUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Spec Upload (URL/Path)</label>
                        <input type="text" className="form-control" name="buyerSpecUpload" value={fields.buyerSpecUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sample Image Upload (URL/Path)</label>
                        <input type="text" className="form-control" name="sampleImageUpload" value={fields.sampleImageUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Parameters Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Notes</label>
                        <textarea className="form-control" rows="3" name="productionNotes" value={fields.productionNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* DEVELOPMENT / BULK FOLLOWUP FORM */}
              {activePage === 'dev_bulk_followup' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Followup Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Followup Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Followup No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Followup Date *</label>
                        <input type="date" className="form-control" name="followupDate" value={fields.followupDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Related Order No * (Order Link)</label>
                        <input type="text" className="form-control" name="relatedOrderNo" value={fields.relatedOrderNo || ''} onChange={handleInputChange} placeholder="e.g. DBO-00001" required />
                      </div>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <select className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange} required>
                          <option value="">Select Buyer</option>
                          {BUYERS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Production Status */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Production Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Production Status / Current Process *</label>
                        <select className="form-control" name="productionStatus" value={fields.productionStatus || 'Warping'} onChange={handleInputChange} required>
                          <option value="Warping">Warping</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Weaving">Weaving</option>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Finishing">Finishing</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Process Completion % *</label>
                        <input type="number" className="form-control" name="processCompletionPct" min="0" max="100" value={fields.processCompletionPct || 0} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Quantity Tracking */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Tracking
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Ordered Qty *</label>
                        <input type="number" className="form-control" name="orderedQty" value={fields.orderedQty || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Produced Qty *</label>
                        <input type="number" className="form-control" name="producedQty" value={fields.producedQty || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Pending Qty *</label>
                        <input type="number" className="form-control" name="pendingQty" value={fields.pendingQty || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Rejected Qty</label>
                        <input type="number" className="form-control" name="rejectedQty" value={fields.rejectedQty || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Timeline Tracking */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Timeline Tracking
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Planned Date *</label>
                        <input type="date" className="form-control" name="plannedDate" value={fields.plannedDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Actual Date</label>
                        <input type="date" className="form-control" name="actualDate" value={fields.actualDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delay Days</label>
                        <input type="number" className="form-control" name="delayDays" value={fields.delayDays || 0} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Next Followup Date *</label>
                        <input type="date" className="form-control" name="nextFollowupDate" value={fields.nextFollowupDate || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: QC / Quality Tracking */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      QC Tracking
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Result</label>
                        <input type="text" className="form-control" name="inspectionResult" value={fields.inspectionResult || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Defect Details</label>
                      <textarea className="form-control" rows="2" name="defectDetails" value={fields.defectDetails || ''} onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* CARD 6: Dispatch Tracking */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Dispatch Tracking
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Ready for Dispatch *</label>
                        <select className="form-control" name="readyForDispatch" value={fields.readyForDispatch || 'No'} onChange={handleInputChange} required>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Packing Status *</label>
                        <select className="form-control" name="packingStatus" value={fields.packingStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Dispatch Date</label>
                        <input type="date" className="form-control" name="dispatchDate" value={fields.dispatchDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Responsibility & Status */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Responsibility & Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Followup By</label>
                        <input type="text" className="form-control" name="followupBy" value={fields.followupBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Incharge *</label>
                        <select className="form-control" name="productionIncharge" value={fields.productionIncharge || ''} onChange={handleInputChange} required>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Merchant Name</label>
                        <input type="text" className="form-control" name="merchantName" value={fields.merchantName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Overall Status *</label>
                        <select className="form-control" name="status" value={fields.status || 'Running'} onChange={handleInputChange} required>
                          <option value="Running">Running</option>
                          <option value="Delay">Delay</option>
                          <option value="Hold">Hold</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Progress Images (URL)</label>
                        <input type="text" className="form-control" name="progressImages" value={fields.progressImages || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Reports (URL)</label>
                        <input type="text" className="form-control" name="qcReports" value={fields.qcReports || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Reports (URL)</label>
                        <input type="text" className="form-control" name="productionReports" value={fields.productionReports || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Followup Remarks</label>
                        <textarea className="form-control" rows="3" name="followupRemarks" value={fields.followupRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delay Reason</label>
                        <textarea className="form-control" rows="3" name="delayReason" value={fields.delayReason || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Action Taken</label>
                        <textarea className="form-control" rows="3" name="actionTaken" value={fields.actionTaken || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* VENDOR ORDER FORM */}
              {activePage === 'vendor_order' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Order Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Order Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Order No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Order Date *</label>
                        <input type="date" className="form-control" name="orderDate" value={fields.orderDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Order Type *</label>
                        <select className="form-control" name="orderType" value={fields.orderType || 'Weaving'} onChange={handleInputChange} required>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Warping">Warping</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Weaving">Weaving</option>
                          <option value="Processing">Processing</option>
                          <option value="Finishing">Finishing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Vendor Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Vendor Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Vendor Code</label>
                        <input type="text" className="form-control" name="vendorCode" value={fields.vendorCode || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mobile No</label>
                        <input type="text" className="form-control" name="mobileNo" value={fields.mobileNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GST No</label>
                        <input type="text" className="form-control" name="gstNo" value={fields.gstNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea className="form-control" rows="2" name="address" value={fields.address || ''} onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
                      <div className="form-group">
                        <label>Fabric Name</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Yarn/Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Yarn/Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Type</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Width</label>
                        <input type="text" className="form-control" name="fabricWidth" value={fields.fabricWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Ordered Quantity *</label>
                        <input type="number" className="form-control" name="orderedQuantity" value={fields.orderedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Sent Quantity</label>
                        <input type="number" className="form-control" name="sentQuantity" value={fields.sentQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Quantity</label>
                        <input type="number" className="form-control" name="balanceQuantity" value={fields.balanceQuantity || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Process Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Process Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Process Name</label>
                        <input type="text" className="form-control" name="processName" value={fields.processName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Machine Type</label>
                        <input type="text" className="form-control" name="machineType" value={fields.machineType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Required Finish</label>
                        <input type="text" className="form-control" name="requiredFinish" value={fields.requiredFinish || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Delivery & Transport Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery & Transport Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Delivery Date *</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Expected Return Date *</label>
                        <input type="date" className="form-control" name="expectedReturnDate" value={fields.expectedReturnDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Transport Details</label>
                        <input type="text" className="form-control" name="transportDetails" value={fields.transportDetails || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Rate (₹)</label>
                        <input type="number" className="form-control" name="vendorRate" value={fields.vendorRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Amount (₹)</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tax %</label>
                        <input type="number" className="form-control" name="taxPct" value={fields.taxPct || '5'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms</label>
                        <input type="text" className="form-control" name="paymentTerms" value={fields.paymentTerms || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Quality & Status Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality & Status Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Required</label>
                        <select className="form-control" name="qcRequired" value={fields.qcRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Quality Standard</label>
                        <input type="text" className="form-control" name="qualityStandard" value={fields.qualityStandard || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Inspection Required</label>
                        <select className="form-control" name="inspectionRequired" value={fields.inspectionRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Order Status *</label>
                        <select className="form-control" name="orderStatus" value={fields.orderStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Sent">Sent</option>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Approval & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Created By</label>
                        <input type="text" className="form-control" name="createdBy" value={fields.createdBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approval Date</label>
                        <input type="date" className="form-control" name="approvalDate" value={fields.approvalDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>PO Document Upload (URL)</label>
                        <input type="text" className="form-control" name="poDocumentUpload" value={fields.poDocumentUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn/Fabric Image (URL)</label>
                        <input type="text" className="form-control" name="yarnFabricImageUpload" value={fields.yarnFabricImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Sheet (URL)</label>
                        <input type="text" className="form-control" name="technicalSheetUpload" value={fields.technicalSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Instructions</label>
                        <textarea className="form-control" rows="3" name="vendorInstructions" value={fields.vendorInstructions || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* CLOTH PURCHASE ORDER FORM */}
              {activePage === 'cloth_po' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Purchase Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Purchase Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Cloth Purchase Order No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Purchase Date *</label>
                        <input type="date" className="form-control" name="purchaseDate" value={fields.purchaseDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Purchase Type *</label>
                        <select className="form-control" name="purchaseType" value={fields.purchaseType || 'Grey Cloth'} onChange={handleInputChange} required>
                          <option value="Grey Cloth">Grey Cloth</option>
                          <option value="Finished Cloth">Finished Cloth</option>
                          <option value="Sample Cloth">Sample Cloth</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Supplier Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Supplier Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Supplier Name *</label>
                        <select className="form-control" name="supplierName" value={fields.supplierName || ''} onChange={handleInputChange} required>
                          <option value="">Select Supplier</option>
                          {BUYERS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Supplier Code</label>
                        <input type="text" className="form-control" name="supplierCode" value={fields.supplierCode || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mobile No</label>
                        <input type="text" className="form-control" name="mobileNo" value={fields.mobileNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GST No</label>
                        <input type="text" className="form-control" name="gstNo" value={fields.gstNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name *</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Construction</label>
                        <input type="text" className="form-control" name="construction" value={fields.construction || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade/Color</label>
                        <input type="text" className="form-control" name="shadeColor" value={fields.shadeColor || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Ordered Quantity *</label>
                        <input type="number" className="form-control" name="orderedQuantity" value={fields.orderedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Received Quantity</label>
                        <input type="number" className="form-control" name="receivedQuantity" value={fields.receivedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Pending Quantity</label>
                        <input type="number" className="form-control" name="pendingQuantity" value={fields.pendingQuantity || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Purchase Rate (₹) *</label>
                        <input type="number" className="form-control" name="purchaseRate" value={fields.purchaseRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Discount</label>
                        <input type="number" className="form-control" name="discount" value={fields.discount || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tax %</label>
                        <input type="number" className="form-control" name="taxPct" value={fields.taxPct || '5'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Amount (₹)</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Currency</label>
                        <select className="form-control" name="currency" value={fields.currency || 'INR'} onChange={handleInputChange}>
                          <option value="INR">INR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Delivery Date *</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Delivery Location</label>
                        <input type="text" className="form-control" name="deliveryLocation" value={fields.deliveryLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Transport Name</label>
                        <input type="text" className="form-control" name="transportName" value={fields.transportName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vehicle No</label>
                        <input type="text" className="form-control" name="vehicleNo" value={fields.vehicleNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Quality Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Status</label>
                        <select className="form-control" name="inspectionStatus" value={fields.inspectionStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Defect Details</label>
                      <textarea className="form-control" rows="2" name="defectDetails" value={fields.defectDetails || ''} onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* CARD 8: Stock Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Stock Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warehouse Location</label>
                        <input type="text" className="form-control" name="warehouseLocation" value={fields.warehouseLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rack No</label>
                        <input type="text" className="form-control" name="rackNo" value={fields.rackNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Batch No</label>
                        <input type="text" className="form-control" name="batchNo" value={fields.batchNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Payment & Status Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Payment & Status Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Payment Terms</label>
                        <input type="text" className="form-control" name="paymentTerms" value={fields.paymentTerms || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Advance Amount</label>
                        <input type="number" className="form-control" name="advanceAmount" value={fields.advanceAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Due Amount</label>
                        <input type="number" className="form-control" name="dueAmount" value={fields.dueAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>PO Status *</label>
                        <select className="form-control" name="poStatus" value={fields.poStatus || 'Draft'} onChange={handleInputChange} required>
                          <option value="Draft">Draft</option>
                          <option value="Approved">Approved</option>
                          <option value="Partially Received">Partially Received</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Approval & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Created By</label>
                        <input type="text" className="form-control" name="createdBy" value={fields.createdBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Purchase Invoice Upload (URL)</label>
                        <input type="text" className="form-control" name="purchaseInvoiceUpload" value={fields.purchaseInvoiceUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Image Upload (URL)</label>
                        <input type="text" className="form-control" name="fabricImageUpload" value={fields.fabricImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Quality Report Upload (URL)</label>
                        <input type="text" className="form-control" name="qualityReportUpload" value={fields.qualityReportUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Purchase Notes</label>
                        <textarea className="form-control" rows="3" name="purchaseNotes" value={fields.purchaseNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Remarks</label>
                        <textarea className="form-control" rows="3" name="qcRemarks" value={fields.qcRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* DYEING ORDER FORM */}
              {activePage === 'dyeing_order' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Order Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Order Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Order No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Order Date *</label>
                        <input type="date" className="form-control" name="orderDate" value={fields.orderDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Dyeing Type *</label>
                        <select className="form-control" name="dyeingType" value={fields.dyeingType || 'Yarn Dyeing'} onChange={handleInputChange} required>
                          <option value="Yarn Dyeing">Yarn Dyeing</option>
                          <option value="Fabric Dyeing">Fabric Dyeing</option>
                          <option value="Piece Dyeing">Piece Dyeing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Vendor / Dyeing Unit Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Vendor / Dyeing Unit Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Unit Name *</label>
                        <input type="text" className="form-control" name="dyeingUnitName" value={fields.dyeingUnitName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Vendor Code</label>
                        <input type="text" className="form-control" name="vendorCode" value={fields.vendorCode || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mobile No</label>
                        <input type="text" className="form-control" name="mobileNo" value={fields.mobileNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GST No</label>
                        <input type="text" className="form-control" name="gstNo" value={fields.gstNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
                      <div className="form-group">
                        <label>Sample Reference No</label>
                        <input type="text" className="form-control" name="sampleRefNo" value={fields.sampleRefNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Material Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Material Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn/Fabric Type</label>
                        <input type="text" className="form-control" name="yarnFabricType" value={fields.yarnFabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Batch No</label>
                        <input type="text" className="form-control" name="batchNo" value={fields.batchNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Color Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Color Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Shade Name</label>
                        <input type="text" className="form-control" name="shadeName" value={fields.shadeName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade Code</label>
                        <input type="text" className="form-control" name="shadeCode" value={fields.shadeCode || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Pantone Reference</label>
                        <input type="text" className="form-control" name="pantoneRef" value={fields.pantoneRef || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Color Category</label>
                        <input type="text" className="form-control" name="colorCategory" value={fields.colorCategory || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lab Dip Status</label>
                        <select className="form-control" name="labDipStatus" value={fields.labDipStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Quantity *</label>
                        <input type="number" className="form-control" name="sentQuantity" value={fields.sentQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Kgs'} onChange={handleInputChange} required>
                          <option value="Kgs">Kgs</option>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Expected Return Qty</label>
                        <input type="number" className="form-control" name="expectedReturnQuantity" value={fields.expectedReturnQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Wastage Allowance %</label>
                        <input type="number" className="form-control" name="wastageAllowancePct" value={fields.wastageAllowancePct || '2'} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Dyeing Process Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Dyeing Process Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Method</label>
                        <input type="text" className="form-control" name="dyeingMethod" value={fields.dyeingMethod || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Machine Type</label>
                        <input type="text" className="form-control" name="machineType" value={fields.machineType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Process Route</label>
                        <input type="text" className="form-control" name="processRoute" value={fields.processRoute || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Chemical Type</label>
                        <input type="text" className="form-control" name="chemicalType" value={fields.chemicalType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Softener Required</label>
                        <select className="form-control" name="softenerRequired" value={fields.softenerRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Finish Required</label>
                        <input type="text" className="form-control" name="finishRequired" value={fields.finishRequired || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Date *</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Expected Delivery Date *</label>
                        <input type="date" className="form-control" name="expectedDeliveryDate" value={fields.expectedDeliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Transport Details</label>
                        <input type="text" className="form-control" name="transportDetails" value={fields.transportDetails || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vehicle No</label>
                        <input type="text" className="form-control" name="vehicleNo" value={fields.vehicleNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Rate (₹) *</label>
                        <input type="number" className="form-control" name="dyeingRate" value={fields.dyeingRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Amount (₹)</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tax %</label>
                        <input type="number" className="form-control" name="taxPct" value={fields.taxPct || '5'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms</label>
                        <input type="text" className="form-control" name="paymentTerms" value={fields.paymentTerms || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Quality Details & Status */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality & Status Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Color Fastness Required</label>
                        <input type="text" className="form-control" name="colorFastnessRequired" value={fields.colorFastnessRequired || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shrinkage Control</label>
                        <input type="text" className="form-control" name="shrinkageControl" value={fields.shrinkageControl || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM Tolerance</label>
                        <input type="text" className="form-control" name="gsmTolerance" value={fields.gsmTolerance || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade Matching Status</label>
                        <input type="text" className="form-control" name="shadeMatchingStatus" value={fields.shadeMatchingStatus || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Required</label>
                        <select className="form-control" name="qcRequired" value={fields.qcRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Order Status *</label>
                        <select className="form-control" name="orderStatus" value={fields.orderStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Sent">Sent</option>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Approval & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Created By</label>
                        <input type="text" className="form-control" name="createdBy" value={fields.createdBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approval Date</label>
                        <input type="date" className="form-control" name="approvedDate" value={fields.approvedDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Shade Image (URL)</label>
                        <input type="text" className="form-control" name="shadeImageUpload" value={fields.shadeImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lab Report (URL)</label>
                        <input type="text" className="form-control" name="labReportUpload" value={fields.labReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Dyeing Instructions File (URL)</label>
                        <input type="text" className="form-control" name="dyeingInstructionsUpload" value={fields.dyeingInstructionsUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 12: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Dyeing Instructions</label>
                        <textarea className="form-control" rows="3" name="dyeingInstructions" value={fields.dyeingInstructions || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* CLOTH DYEING/PROCESSING ORDER FORM */}
              {activePage === 'cloth_dyeing_order' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Order Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Order Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Order No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Processing Date *</label>
                        <input type="date" className="form-control" name="processingDate" value={fields.processingDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Processing Type *</label>
                        <select className="form-control" name="processingType" value={fields.processingType || 'Dyeing'} onChange={handleInputChange} required>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Printing">Printing</option>
                          <option value="Washing">Washing</option>
                          <option value="Stenter">Stenter</option>
                          <option value="Compacting">Compacting</option>
                          <option value="Finishing">Finishing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Processing Unit Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Processing Unit Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Unit Name *</label>
                        <input type="text" className="form-control" name="processingUnitName" value={fields.processingUnitName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mobile No</label>
                        <input type="text" className="form-control" name="mobileNo" value={fields.mobileNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Work Order No</label>
                        <input type="text" className="form-control" name="workOrderNo" value={fields.workOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Batch No</label>
                        <input type="text" className="form-control" name="fabricBatchNo" value={fields.fabricBatchNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name *</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Construction</label>
                        <input type="text" className="form-control" name="construction" value={fields.construction || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Grey Fabric Qty</label>
                        <input type="number" className="form-control" name="greyFabricQty" value={fields.greyFabricQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sent Qty *</label>
                        <input type="number" className="form-control" name="sentQty" value={fields.sentQty || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Received Qty</label>
                        <input type="number" className="form-control" name="receivedQty" value={fields.receivedQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Qty</label>
                        <input type="number" className="form-control" name="balanceQty" value={fields.balanceQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Processing Parameters */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Processing Parameters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Process Route</label>
                        <input type="text" className="form-control" name="processRoute" value={fields.processRoute || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Required Finish</label>
                        <input type="text" className="form-control" name="requiredFinish" value={fields.requiredFinish || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shrinkage %</label>
                        <input type="text" className="form-control" name="shrinkagePct" value={fields.shrinkagePct || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Width Requirement</label>
                        <input type="text" className="form-control" name="widthRequirement" value={fields.widthRequirement || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>GSM Requirement</label>
                        <input type="text" className="form-control" name="gsmRequirement" value={fields.gsmRequirement || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Soft Finish</label>
                        <select className="form-control" name="softFinish" value={fields.softFinish || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Peach Finish</label>
                        <select className="form-control" name="peachFinish" value={fields.peachFinish || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Bio Wash</label>
                        <select className="form-control" name="bioWash" value={fields.bioWash || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Silicon Wash</label>
                        <select className="form-control" name="siliconWash" value={fields.siliconWash || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Printing Details (Optional) */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Printing Details (Optional)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Print Type</label>
                        <input type="text" className="form-control" name="printType" value={fields.printType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Print Repeat</label>
                        <input type="text" className="form-control" name="printRepeat" value={fields.printRepeat || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Screen No</label>
                        <input type="text" className="form-control" name="screenNo" value={fields.screenNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Print Color Count</label>
                        <input type="number" className="form-control" name="printColorCount" value={fields.printColorCount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Machine & Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Machine & Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Machine Name</label>
                        <input type="text" className="form-control" name="machineName" value={fields.machineName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Machine Capacity</label>
                        <input type="text" className="form-control" name="machineCapacity" value={fields.machineCapacity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Operator Name</label>
                        <input type="text" className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Date *</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Expected Delivery Date *</label>
                        <input type="date" className="form-control" name="expectedDeliveryDate" value={fields.expectedDeliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Actual Delivery Date</label>
                        <input type="date" className="form-control" name="actualDeliveryDate" value={fields.actualDeliveryDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Rate (₹) *</label>
                        <input type="number" className="form-control" name="processingRate" value={fields.processingRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Cost (₹)</label>
                        <input type="number" className="form-control" name="totalCost" value={fields.totalCost || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges (₹)</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tax %</label>
                        <input type="number" className="form-control" name="taxPct" value={fields.taxPct || '5'} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Quality Control & Production Status */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Control & Production Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Shade Matching</label>
                        <input type="text" className="form-control" name="shadeMatching" value={fields.shadeMatching || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shrinkage Test</label>
                        <input type="text" className="form-control" name="shrinkageTest" value={fields.shrinkageTest || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Color Fastness</label>
                        <input type="text" className="form-control" name="colorFastness" value={fields.colorFastness || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Hand Feel Check</label>
                        <input type="text" className="form-control" name="handFeelCheck" value={fields.handFeelCheck || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Result</label>
                        <input type="text" className="form-control" name="inspectionResult" value={fields.inspectionResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Status *</label>
                        <select className="form-control" name="productionStatus" value={fields.productionStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="In Process">In Process</option>
                          <option value="Completed">Completed</option>
                          <option value="Hold">Hold</option>
                          <option value="Reprocess">Reprocess</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Approval & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Created By</label>
                        <input type="text" className="form-control" name="createdBy" value={fields.createdBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Approved By</label>
                        <input type="text" className="form-control" name="qcApprovedBy" value={fields.qcApprovedBy || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Sheet (URL)</label>
                        <input type="text" className="form-control" name="processingSheetUpload" value={fields.processingSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Report Upload (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Image Upload (URL)</label>
                        <input type="text" className="form-control" name="fabricImageUpload" value={fields.fabricImageUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 12: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Instructions</label>
                        <textarea className="form-control" rows="3" name="technicalInstructions" value={fields.technicalInstructions || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Remarks</label>
                        <textarea className="form-control" rows="3" name="qcRemarks" value={fields.qcRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* DOUBLING/TWISTING ORDER FORM */}
              {activePage === 'doubling_twisting' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Order Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Order Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Order No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Order Date *</label>
                        <input type="date" className="form-control" name="orderDate" value={fields.orderDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Process Type *</label>
                        <select className="form-control" name="processType" value={fields.processType || 'Doubling + Twisting'} onChange={handleInputChange} required>
                          <option value="Doubling">Doubling</option>
                          <option value="Twisting">Twisting</option>
                          <option value="Doubling + Twisting">Doubling + Twisting</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Vendor / Unit Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Vendor / Twisting Unit Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Twisting Unit Name *</label>
                        <input type="text" className="form-control" name="twistingUnitName" value={fields.twistingUnitName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mobile No</label>
                        <input type="text" className="form-control" name="mobileNo" value={fields.mobileNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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

                  {/* CARD 4: Yarn Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Yarn Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Type</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Single Ply Count</label>
                        <input type="text" className="form-control" name="singlePlyCount" value={fields.singlePlyCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Final Count</label>
                        <input type="text" className="form-control" name="finalCount" value={fields.finalCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Quality</label>
                        <input type="text" className="form-control" name="yarnQuality" value={fields.yarnQuality || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mill Name</label>
                        <input type="text" className="form-control" name="millName" value={fields.millName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Process Parameters */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Process Parameters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>TPM (Twist/Meter)</label>
                        <input type="text" className="form-control" name="tpm" value={fields.tpm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Twist Direction</label>
                        <select className="form-control" name="twistDirection" value={fields.twistDirection || 'Z Twist'} onChange={handleInputChange}>
                          <option value="S Twist">S Twist</option>
                          <option value="Z Twist">Z Twist</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Ply Count</label>
                        <input type="text" className="form-control" name="plyCount" value={fields.plyCount || '2'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Cone Type</label>
                        <input type="text" className="form-control" name="coneType" value={fields.coneType || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Input Quantity *</label>
                        <input type="number" className="form-control" name="inputQuantity" value={fields.inputQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Output Quantity</label>
                        <input type="number" className="form-control" name="outputQuantity" value={fields.outputQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Wastage %</label>
                        <input type="number" className="form-control" name="wastagePct" value={fields.wastagePct || '1.5'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Kgs'} onChange={handleInputChange} required>
                          <option value="Kgs">Kgs</option>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Machine Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Machine Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Machine Name</label>
                        <input type="text" className="form-control" name="machineName" value={fields.machineName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Spindle Count</label>
                        <input type="number" className="form-control" name="spindleCount" value={fields.spindleCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Operator Name</label>
                        <input type="text" className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Date *</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Expected Delivery Date *</label>
                        <input type="date" className="form-control" name="expectedDeliveryDate" value={fields.expectedDeliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Return Date</label>
                        <input type="date" className="form-control" name="returnDate" value={fields.returnDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Process Rate (₹) *</label>
                        <input type="number" className="form-control" name="processRate" value={fields.processRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Amount (₹)</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges (₹)</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Quality Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Details & Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Strength Check</label>
                        <input type="text" className="form-control" name="strengthCheck" value={fields.strengthCheck || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Evenness</label>
                        <input type="text" className="form-control" name="yarnEvenness" value={fields.yarnEvenness || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Breakage Status</label>
                        <input type="text" className="form-control" name="breakageStatus" value={fields.breakageStatus || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Order Status *</label>
                        <select className="form-control" name="orderStatus" value={fields.orderStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Approval & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Created By</label>
                        <input type="text" className="form-control" name="createdBy" value={fields.createdBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Image (URL)</label>
                        <input type="text" className="form-control" name="yarnImageUpload" value={fields.yarnImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Report (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Sheet (URL)</label>
                        <input type="text" className="form-control" name="technicalSheetUpload" value={fields.technicalSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 12: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Notes</label>
                        <textarea className="form-control" rows="3" name="productionNotes" value={fields.productionNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* WARPING/SIZING ORDER FORM */}
              {activePage === 'warp_sizing_order' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Order Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Order Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Order No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Order Date *</label>
                        <input type="date" className="form-control" name="orderDate" value={fields.orderDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Process Type *</label>
                        <select className="form-control" name="processType" value={fields.processType || 'Warping + Sizing'} onChange={handleInputChange} required>
                          <option value="Warping">Warping</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Direct Warping">Direct Warping</option>
                          <option value="Warping + Sizing">Warping + Sizing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Unit Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Unit & Operator Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warping Unit Name</label>
                        <input type="text" className="form-control" name="warpingUnitName" value={fields.warpingUnitName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sizing Unit Name</label>
                        <input type="text" className="form-control" name="sizingUnitName" value={fields.sizingUnitName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Operator Name</label>
                        <input type="text" className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
                      <div className="form-group">
                        <label>Loom Plan No</label>
                        <input type="text" className="form-control" name="loomPlanNo" value={fields.loomPlanNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Yarn Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Yarn Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warp Yarn Count</label>
                        <input type="text" className="form-control" name="warpYarnCount" value={fields.warpYarnCount || ''} onChange={handleInputChange} />
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
                    </div>
                  </div>

                  {/* CARD 5: Beam Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Beam Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No *</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Beam Width (Inch)</label>
                        <input type="text" className="form-control" name="beamWidth" value={fields.beamWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Ends</label>
                        <input type="number" className="form-control" name="totalEnds" value={fields.totalEnds || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Length (Mtr)</label>
                        <input type="number" className="form-control" name="beamLength" value={fields.beamLength || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>No of Beams</label>
                        <input type="number" className="form-control" name="noOfBeams" value={fields.noOfBeams || '1'} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Sizing Parameters */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Sizing Parameters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Size Material Type</label>
                        <input type="text" className="form-control" name="sizeMaterialType" value={fields.sizeMaterialType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Size %</label>
                        <input type="text" className="form-control" name="sizePct" value={fields.sizePct || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Moisture %</label>
                        <input type="text" className="form-control" name="moisturePct" value={fields.moisturePct || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Stretch %</label>
                        <input type="text" className="form-control" name="stretchPct" value={fields.stretchPct || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Speed (m/min)</label>
                        <input type="text" className="form-control" name="speed" value={fields.speed || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Production Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Production Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Reed Count</label>
                        <input type="text" className="form-control" name="reedCount" value={fields.reedCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Denting Plan</label>
                        <input type="text" className="form-control" name="dentingPlan" value={fields.dentingPlan || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Ends Per Inch (EPI)</label>
                        <input type="number" className="form-control" name="epi" value={fields.epi || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Meter *</label>
                        <input type="number" className="form-control" name="warpMeter" value={fields.warpMeter || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Quantity & Machine Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity & Machine Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Input Yarn Qty (Kgs)</label>
                        <input type="number" className="form-control" name="inputYarnQty" value={fields.inputYarnQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Output Beam Qty</label>
                        <input type="number" className="form-control" name="outputBeamQty" value={fields.outputBeamQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Wastage %</label>
                        <input type="number" className="form-control" name="wastagePct" value={fields.wastagePct || '1'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Machine Name</label>
                        <input type="text" className="form-control" name="machineName" value={fields.machineName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Machine Capacity</label>
                        <input type="text" className="form-control" name="machineCapacity" value={fields.machineCapacity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Shift</label>
                        <select className="form-control" name="shift" value={fields.shift || 'Shift A'} onChange={handleInputChange}>
                          <option value="Shift A">Shift A</option>
                          <option value="Shift B">Shift B</option>
                          <option value="Shift C">Shift C</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Start Date *</label>
                        <input type="date" className="form-control" name="startDate" value={fields.startDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Expected Completion Date *</label>
                        <input type="date" className="form-control" name="expectedCompletionDate" value={fields.expectedCompletionDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Quality Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam Hardness</label>
                        <input type="text" className="form-control" name="beamHardness" value={fields.beamHardness || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tension Check</label>
                        <input type="text" className="form-control" name="tensionCheck" value={fields.tensionCheck || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Moisture Check</label>
                        <input type="text" className="form-control" name="moistureCheck" value={fields.moistureCheck || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Breakage Status</label>
                        <input type="text" className="form-control" name="breakageStatus" value={fields.breakageStatus || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Commercial & Status Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial & Status Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                      <div className="form-group">
                        <label>Process Rate (₹) *</label>
                        <input type="number" className="form-control" name="processRate" value={fields.processRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Cost (₹)</label>
                        <input type="number" className="form-control" name="totalCost" value={fields.totalCost || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Order Status *</label>
                        <select className="form-control" name="orderStatus" value={fields.orderStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Created By</label>
                        <input type="text" className="form-control" name="createdBy" value={fields.createdBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
                      <div className="form-group">
                        <label>Beam Image (URL)</label>
                        <input type="text" className="form-control" name="beamImageUpload" value={fields.beamImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Plan File (URL)</label>
                        <input type="text" className="form-control" name="warpPlanUpload" value={fields.warpPlanUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Report (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 12: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Instructions</label>
                        <textarea className="form-control" rows="3" name="technicalInstructions" value={fields.technicalInstructions || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Process Notes</label>
                        <textarea className="form-control" rows="3" name="processNotes" value={fields.processNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* INTERNAL FABRIC REQUEST FORM */}
              {activePage === 'internal_fabric_req' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Request Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Request Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Request No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Request Date *</label>
                        <input type="date" className="form-control" name="requestDate" value={fields.requestDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Request Type *</label>
                        <select className="form-control" name="requestType" value={fields.requestType || 'Production'} onChange={handleInputChange} required>
                          <option value="Sample">Sample</option>
                          <option value="Production">Production</option>
                          <option value="QC">QC</option>
                          <option value="Buyer Approval">Buyer Approval</option>
                          <option value="Dispatch">Dispatch</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Department Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Department Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Requested Department *</label>
                        <input type="text" className="form-control" name="requestedDepartment" value={fields.requestedDepartment || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Requested By</label>
                        <input type="text" className="form-control" name="requestedBy" value={fields.requestedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
                      <div className="form-group">
                        <label>Fabric Batch No</label>
                        <input type="text" className="form-control" name="fabricBatchNo" value={fields.fabricBatchNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name *</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Construction</label>
                        <input type="text" className="form-control" name="construction" value={fields.construction || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Requested Qty *</label>
                        <input type="number" className="form-control" name="requestedQuantity" value={fields.requestedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Available Qty</label>
                        <input type="number" className="form-control" name="availableQuantity" value={fields.availableQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Issued Qty</label>
                        <input type="number" className="form-control" name="issuedQuantity" value={fields.issuedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Qty</label>
                        <input type="number" className="form-control" name="balanceQuantity" value={fields.balanceQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Purpose Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Purpose Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Request Purpose</label>
                        <input type="text" className="form-control" name="requestPurpose" value={fields.requestPurpose || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Priority Level</label>
                        <select className="form-control" name="priorityLevel" value={fields.priorityLevel || 'Medium'} onChange={handleInputChange}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Required Date *</label>
                        <input type="date" className="form-control" name="requiredDate" value={fields.requiredDate || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Stock Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Stock Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warehouse Location</label>
                        <input type="text" className="form-control" name="warehouseLocation" value={fields.warehouseLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rack No</label>
                        <input type="text" className="form-control" name="rackNo" value={fields.rackNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Roll No</label>
                        <input type="text" className="form-control" name="rollNo" value={fields.rollNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Dispatch Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Dispatch Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Issue Date</label>
                        <input type="date" className="form-control" name="issueDate" value={fields.issueDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received Date</label>
                        <input type="date" className="form-control" name="receivedDate" value={fields.receivedDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Issued By</label>
                        <input type="text" className="form-control" name="issuedBy" value={fields.issuedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received By</label>
                        <input type="text" className="form-control" name="receivedBy" value={fields.receivedBy || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Quality Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Required</label>
                        <select className="form-control" name="qcRequired" value={fields.qcRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Status</label>
                        <input type="text" className="form-control" name="inspectionStatus" value={fields.inspectionStatus || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Defect Remarks</label>
                        <input type="text" className="form-control" name="defectRemarks" value={fields.defectRemarks || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Status & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Status & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Request Status *</label>
                        <select className="form-control" name="requestStatus" value={fields.requestStatus || 'Pending'} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Issued">Issued</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fabric Image (URL)</label>
                        <input type="text" className="form-control" name="fabricImageUpload" value={fields.fabricImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Request Sheet (URL)</label>
                        <input type="text" className="form-control" name="requestSheetUpload" value={fields.requestSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Approval Remarks</label>
                        <textarea className="form-control" rows="3" name="approvalRemarks" value={fields.approvalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* VENDOR ORDER COMPLETION FORM */}
              {activePage === 'vendor_order_comp' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Completion Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Completion Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Completion No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Completion Date *</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Completion Type *</label>
                        <select className="form-control" name="completionType" value={fields.completionType || 'Weaving Completion'} onChange={handleInputChange} required>
                          <option value="Dyeing Completion">Dyeing Completion</option>
                          <option value="Warping Completion">Warping Completion</option>
                          <option value="Sizing Completion">Sizing Completion</option>
                          <option value="Weaving Completion">Weaving Completion</option>
                          <option value="Processing Completion">Processing Completion</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Vendor Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Vendor Details
                    </h3>
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
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Order No</label>
                        <input type="text" className="form-control" name="vendorOrderNo" value={fields.vendorOrderNo || ''} onChange={handleInputChange} />
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

                  {/* CARD 4: Material Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Material Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric/Yarn Name *</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Qty</label>
                        <input type="number" className="form-control" name="sentQuantity" value={fields.sentQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received Qty *</label>
                        <input type="number" className="form-control" name="receivedQuantity" value={fields.receivedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Short Qty</label>
                        <input type="number" className="form-control" name="shortQuantity" value={fields.shortQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Excess Qty</label>
                        <input type="number" className="form-control" name="excessQuantity" value={fields.excessQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rejected Qty</label>
                        <input type="number" className="form-control" name="rejectedQuantity" value={fields.rejectedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Wastage Qty</label>
                        <input type="number" className="form-control" name="wastageQuantity" value={fields.wastageQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Process Completion & Quality Check */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Process Completion & Quality Check
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Process Name</label>
                        <input type="text" className="form-control" name="processName" value={fields.processName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Machine Used</label>
                        <input type="text" className="form-control" name="machineUsed" value={fields.machineUsed || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Completion Status</label>
                        <select className="form-control" name="completionStatus" value={fields.completionStatus || 'Completed'} onChange={handleInputChange}>
                          <option value="Pending QC">Pending QC</option>
                          <option value="QC Approved">QC Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Rework">Rework</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Status</label>
                        <input type="text" className="form-control" name="qcStatus" value={fields.qcStatus || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Inspection Result</label>
                        <input type="text" className="form-control" name="inspectionResult" value={fields.inspectionResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade Matching</label>
                        <input type="text" className="form-control" name="shadeMatching" value={fields.shadeMatching || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shrinkage Result</label>
                        <input type="text" className="form-control" name="shrinkageResult" value={fields.shrinkageResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rework Required</label>
                        <select className="form-control" name="reworkRequired" value={fields.reworkRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginTop: '16px' }}>
                      <div className="form-group">
                        <label>Defect Details / Process Result</label>
                        <textarea className="form-control" rows="2" name="defectDetails" value={fields.defectDetails || ''} onChange={handleInputChange} placeholder="Specify defect points, process results, etc." />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Delivery & Stock Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery & Stock Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Date</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received Date *</label>
                        <input type="date" className="form-control" name="receivedDate" value={fields.receivedDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Delay Days</label>
                        <input type="number" className="form-control" name="delayDays" value={fields.delayDays || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Transport Details</label>
                        <input type="text" className="form-control" name="transportDetails" value={fields.transportDetails || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warehouse Location</label>
                        <input type="text" className="form-control" name="warehouseLocation" value={fields.warehouseLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Batch No</label>
                        <input type="text" className="form-control" name="batchNo" value={fields.batchNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Stock Updated Status</label>
                        <select className="form-control" name="stockUpdatedStatus" value={fields.stockUpdatedStatus || 'Yes'} onChange={handleInputChange}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Commercial & Approval Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial & Approval Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Vendor Rate</label>
                        <input type="number" className="form-control" name="vendorRate" value={fields.vendorRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Process Cost</label>
                        <input type="number" className="form-control" name="totalProcessCost" value={fields.totalProcessCost || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Penalty Amount</label>
                        <input type="number" className="form-control" name="penaltyAmount" value={fields.penaltyAmount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Received By</label>
                        <input type="text" className="form-control" name="receivedBy" value={fields.receivedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Approved By</label>
                        <input type="text" className="form-control" name="qcApprovedBy" value={fields.qcApprovedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Accounts Verified By</label>
                        <select className="form-control" name="accountsVerifiedBy" value={fields.accountsVerifiedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Remarks & Uploads */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks & Uploads
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>QC Report Upload (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Invoice Upload (URL)</label>
                        <input type="text" className="form-control" name="vendorInvoiceUpload" value={fields.vendorInvoiceUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Material Image (URL)</label>
                        <input type="text" className="form-control" name="materialImageUpload" value={fields.materialImageUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Remarks</label>
                        <textarea className="form-control" rows="3" name="qcRemarks" value={fields.qcRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Remarks</label>
                        <textarea className="form-control" rows="3" name="vendorRemarks" value={fields.vendorRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* CLOTH PURCHASE ORDER COMPLETION FORM */}
              {activePage === 'cloth_po_comp' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Completion Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Completion Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Purchase Completion No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Completion Date *</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Completion Type *</label>
                        <select className="form-control" name="completionType" value={fields.completionType || 'Full Receipt'} onChange={handleInputChange} required>
                          <option value="Full Receipt">Full Receipt</option>
                          <option value="Partial Receipt">Partial Receipt</option>
                          <option value="Final Receipt">Final Receipt</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Supplier Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Supplier Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Supplier Name *</label>
                        <input type="text" className="form-control" name="supplierName" value={fields.supplierName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Supplier Code</label>
                        <input type="text" className="form-control" name="supplierCode" value={fields.supplierCode || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GST No</label>
                        <input type="text" className="form-control" name="gstNo" value={fields.gstNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Cloth Purchase Order No</label>
                        <input type="text" className="form-control" name="clothPurchaseOrderNo" value={fields.clothPurchaseOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Invoice No</label>
                        <input type="text" className="form-control" name="invoiceNo" value={fields.invoiceNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GRN No</label>
                        <input type="text" className="form-control" name="grnNo" value={fields.grnNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name *</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Construction</label>
                        <input type="text" className="form-control" name="construction" value={fields.construction || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade / Color</label>
                        <input type="text" className="form-control" name="shadeColor" value={fields.shadeColor || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Ordered Qty</label>
                        <input type="number" className="form-control" name="orderedQuantity" value={fields.orderedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received Qty *</label>
                        <input type="number" className="form-control" name="receivedQuantity" value={fields.receivedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Pending Qty</label>
                        <input type="number" className="form-control" name="pendingQuantity" value={fields.pendingQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Short Qty</label>
                        <input type="number" className="form-control" name="shortQuantity" value={fields.shortQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rejected Qty</label>
                        <input type="number" className="form-control" name="rejectedQuantity" value={fields.rejectedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM *</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange} required>
                          <option value="Mtrs">Mtrs</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Pcs">Pcs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Quality Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'QC Approved'} onChange={handleInputChange}>
                          <option value="Pending Inspection">Pending Inspection</option>
                          <option value="QC Approved">QC Approved</option>
                          <option value="Partially Completed">Partially Completed</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Result</label>
                        <input type="text" className="form-control" name="fabricInspectionResult" value={fields.fabricInspectionResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade Matching</label>
                        <input type="text" className="form-control" name="shadeMatching" value={fields.shadeMatching || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GSM Check</label>
                        <input type="text" className="form-control" name="gsmCheck" value={fields.gsmCheck || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width Check</label>
                        <input type="text" className="form-control" name="widthCheck" value={fields.widthCheck || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Defect Points</label>
                        <input type="text" className="form-control" name="defectPoints" value={fields.defectPoints || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shrinkage Test</label>
                        <input type="text" className="form-control" name="shrinkageTest" value={fields.shrinkageTest || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Purchase Rate</label>
                        <input type="number" className="form-control" name="purchaseRate" value={fields.purchaseRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Invoice Amount</label>
                        <input type="number" className="form-control" name="invoiceAmount" value={fields.invoiceAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tax Amount</label>
                        <input type="number" className="form-control" name="taxAmount" value={fields.taxAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Discount</label>
                        <input type="number" className="form-control" name="discount" value={fields.discount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Final Amount</label>
                        <input type="number" className="form-control" name="finalAmount" value={fields.finalAmount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Stock & Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Stock & Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Warehouse Location</label>
                        <input type="text" className="form-control" name="warehouseLocation" value={fields.warehouseLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rack No</label>
                        <input type="text" className="form-control" name="rackNo" value={fields.rackNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Roll No</label>
                        <input type="text" className="form-control" name="rollNo" value={fields.rollNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Batch No</label>
                        <input type="text" className="form-control" name="batchNo" value={fields.batchNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date *</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Vehicle No</label>
                        <input type="text" className="form-control" name="vehicleNo" value={fields.vehicleNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Transport Name</label>
                        <input type="text" className="form-control" name="transportName" value={fields.transportName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Accounts & Approvals */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Accounts & Approvals
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Payment Status</label>
                        <select className="form-control" name="paymentStatus" value={fields.paymentStatus || 'Paid'} onChange={handleInputChange}>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Accounts Verification</label>
                        <select className="form-control" name="accountsVerification" value={fields.accountsVerification || 'Verified'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Debit/Credit Note Required</label>
                        <select className="form-control" name="debitCreditNoteRequired" value={fields.debitCreditNoteRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Received By</label>
                        <input type="text" className="form-control" name="receivedBy" value={fields.receivedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Approved By</label>
                        <input type="text" className="form-control" name="qcApprovedBy" value={fields.qcApprovedBy || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Store Approved By</label>
                        <select className="form-control" name="storeApprovedBy" value={fields.storeApprovedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Remarks & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Supplier Invoice (URL)</label>
                        <input type="text" className="form-control" name="supplierInvoiceUpload" value={fields.supplierInvoiceUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Report (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Image (URL)</label>
                        <input type="text" className="form-control" name="fabricImageUpload" value={fields.fabricImageUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Remarks</label>
                        <textarea className="form-control" rows="3" name="qcRemarks" value={fields.qcRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Purchase Remarks</label>
                        <textarea className="form-control" rows="3" name="purchaseRemarks" value={fields.purchaseRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* DYEING ORDER COMPLETION FORM */}
              {activePage === 'dyeing_order_comp' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Completion Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Completion Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Completion No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Completion Date *</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Completion Type *</label>
                        <select className="form-control" name="completionType" value={fields.completionType || 'Fabric Dyeing'} onChange={handleInputChange} required>
                          <option value="Yarn Dyeing">Yarn Dyeing</option>
                          <option value="Fabric Dyeing">Fabric Dyeing</option>
                          <option value="Piece Dyeing">Piece Dyeing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Dyeing Unit Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Dyeing Unit Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Unit Name</label>
                        <input type="text" className="form-control" name="dyeingUnitName" value={fields.dyeingUnitName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Name</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Order No</label>
                        <input type="text" className="form-control" name="dyeingOrderNo" value={fields.dyeingOrderNo || ''} onChange={handleInputChange} />
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

                  {/* CARD 4: Material Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Material Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Yarn/Fabric Name</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width (Inches)</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade Name</label>
                        <input type="text" className="form-control" name="shadeName" value={fields.shadeName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade Code</label>
                        <input type="text" className="form-control" name="shadeCode" value={fields.shadeCode || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Qty</label>
                        <input type="number" className="form-control" name="sentQuantity" value={fields.sentQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received Qty</label>
                        <input type="number" className="form-control" name="receivedQuantity" value={fields.receivedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Short Qty</label>
                        <input type="number" className="form-control" name="shortQuantity" value={fields.shortQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rejected Qty</label>
                        <input type="number" className="form-control" name="rejectedQuantity" value={fields.rejectedQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Qty</label>
                        <input type="number" className="form-control" name="balanceQuantity" value={fields.balanceQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <input type="text" className="form-control" name="uom" value={fields.uom || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Dyeing Result Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Dyeing Result Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Shade Matching Status</label>
                        <select className="form-control" name="shadeMatchingStatus" value={fields.shadeMatchingStatus || 'Approved'} onChange={handleInputChange}>
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Lab Dip Approval</label>
                        <select className="form-control" name="labDipApproval" value={fields.labDipApproval || 'Yes'} onChange={handleInputChange}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Color Fastness Result</label>
                        <input type="text" className="form-control" name="colorFastnessResult" value={fields.colorFastnessResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shrinkage Result</label>
                        <input type="text" className="form-control" name="shrinkageResult" value={fields.shrinkageResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Hand Feel Result</label>
                        <input type="text" className="form-control" name="handFeelResult" value={fields.handFeelResult || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Quality Check */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Check & Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'QC Approved'} onChange={handleInputChange}>
                          <option value="Pending QC">Pending QC</option>
                          <option value="QC Approved">QC Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Reprocess">Reprocess</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Result</label>
                        <input type="text" className="form-control" name="inspectionResult" value={fields.inspectionResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Defect Details</label>
                        <input type="text" className="form-control" name="defectDetails" value={fields.defectDetails || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Reprocess Required</label>
                        <select className="form-control" name="reprocessRequired" value={fields.reprocessRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>QC Approved By</label>
                        <select className="form-control" name="qcApprovedBy" value={fields.qcApprovedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Date</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received Date</label>
                        <input type="date" className="form-control" name="receivedDate" value={fields.receivedDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delay Days</label>
                        <input type="number" className="form-control" name="delayDays" value={fields.delayDays || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Transport Details</label>
                        <input type="text" className="form-control" name="transportDetails" value={fields.transportDetails || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Dyeing Rate</label>
                        <input type="number" className="form-control" name="dyeingRate" value={fields.dyeingRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Amount</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Penalty Amount</label>
                        <input type="number" className="form-control" name="penaltyAmount" value={fields.penaltyAmount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Stock Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Stock Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Batch No</label>
                        <input type="text" className="form-control" name="batchNo" value={fields.batchNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warehouse Location</label>
                        <input type="text" className="form-control" name="warehouseLocation" value={fields.warehouseLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Stock Update Status</label>
                        <select className="form-control" name="stockUpdateStatus" value={fields.stockUpdateStatus || 'Yes'} onChange={handleInputChange}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Report Upload (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade Approval Upload (URL)</label>
                        <input type="text" className="form-control" name="shadeApprovalUpload" value={fields.shadeApprovalUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Dyed Fabric Image (URL)</label>
                        <input type="text" className="form-control" name="dyedFabricImageUpload" value={fields.dyedFabricImageUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 12: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Remarks</label>
                        <textarea className="form-control" rows="3" name="qcRemarks" value={fields.qcRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Dyeing Remarks</label>
                        <textarea className="form-control" rows="3" name="dyeingRemarks" value={fields.dyeingRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* WARPING/SIZING ORDER COMPLETION FORM */}
              {activePage === 'warp_sizing_comp' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Completion Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Completion Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warping/Sizing Completion No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Completion Date *</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Completion Type *</label>
                        <select className="form-control" name="completionType" value={fields.completionType || 'Sizing'} onChange={handleInputChange} required>
                          <option value="Warping">Warping</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Beam Preparation">Beam Preparation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Unit Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Unit Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warping Unit Name</label>
                        <input type="text" className="form-control" name="warpingUnitName" value={fields.warpingUnitName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sizing Unit Name</label>
                        <input type="text" className="form-control" name="sizingUnitName" value={fields.sizingUnitName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Operator Name</label>
                        <input type="text" className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
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
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Loom Plan No</label>
                        <input type="text" className="form-control" name="loomPlanNo" value={fields.loomPlanNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Beam Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Beam Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam No</label>
                        <input type="text" className="form-control" name="beamNo" value={fields.beamNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Width</label>
                        <input type="text" className="form-control" name="beamWidth" value={fields.beamWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Length</label>
                        <input type="text" className="form-control" name="beamLength" value={fields.beamLength || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Ends</label>
                        <input type="number" className="form-control" name="totalEnds" value={fields.totalEnds || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>No of Beams</label>
                        <input type="number" className="form-control" name="noOfBeams" value={fields.noOfBeams || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Meter</label>
                        <input type="number" className="form-control" name="warpMeter" value={fields.warpMeter || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Yarn Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Yarn Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warp Yarn Count</label>
                        <input type="text" className="form-control" name="warpYarnCount" value={fields.warpYarnCount || ''} onChange={handleInputChange} />
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
                    </div>
                  </div>

                  {/* CARD 6: Production Result */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Production Result
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Input Yarn Qty</label>
                        <input type="number" className="form-control" name="inputYarnQty" value={fields.inputYarnQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Output Beam Qty</label>
                        <input type="number" className="form-control" name="outputBeamQty" value={fields.outputBeamQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Wastage %</label>
                        <input type="number" className="form-control" name="wastagePercent" value={fields.wastagePercent || ''} onChange={handleInputChange} step="0.01" />
                      </div>
                      <div className="form-group">
                        <label>Breakage Count</label>
                        <input type="number" className="form-control" name="breakageCount" value={fields.breakageCount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Sizing Result Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Sizing Result Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Moisture %</label>
                        <input type="number" className="form-control" name="moisturePercent" value={fields.moisturePercent || ''} onChange={handleInputChange} step="0.01" />
                      </div>
                      <div className="form-group">
                        <label>Stretch %</label>
                        <input type="number" className="form-control" name="stretchPercent" value={fields.stretchPercent || ''} onChange={handleInputChange} step="0.01" />
                      </div>
                      <div className="form-group">
                        <label>Beam Hardness</label>
                        <input type="text" className="form-control" name="beamHardness" value={fields.beamHardness || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tension Result</label>
                        <input type="text" className="form-control" name="tensionResult" value={fields.tensionResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sizing Quality</label>
                        <input type="text" className="form-control" name="sizingQuality" value={fields.sizingQuality || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Quality Check */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Check & Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'QC Approved'} onChange={handleInputChange}>
                          <option value="Pending QC">Pending QC</option>
                          <option value="QC Approved">QC Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Hold">Hold</option>
                          <option value="Rework">Rework</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Beam Inspection Result</label>
                        <input type="text" className="form-control" name="beamInspectionResult" value={fields.beamInspectionResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Damage Status</label>
                        <input type="text" className="form-control" name="damageStatus" value={fields.damageStatus || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rework Required</label>
                        <select className="form-control" name="reworkRequired" value={fields.reworkRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Machine Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Machine Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Machine Name</label>
                        <input type="text" className="form-control" name="machineName" value={fields.machineName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Machine Speed</label>
                        <input type="text" className="form-control" name="machineSpeed" value={fields.machineSpeed || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shift</label>
                        <select className="form-control" name="shift" value={fields.shift || 'Day'} onChange={handleInputChange}>
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Start Date</label>
                        <input type="date" className="form-control" name="startDate" value={fields.startDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Completion Date</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Process Rate</label>
                        <input type="number" className="form-control" name="processRate" value={fields.processRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Cost</label>
                        <input type="number" className="form-control" name="totalCost" value={fields.totalCost || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 12: Stock Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Stock Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam Storage Location</label>
                        <input type="text" className="form-control" name="beamStorageLocation" value={fields.beamStorageLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Beam Status</label>
                        <select className="form-control" name="beamStatus" value={fields.beamStatus || 'Ready'} onChange={handleInputChange}>
                          <option value="Ready">Ready</option>
                          <option value="Pending">Pending</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Ready For Weaving Status</label>
                        <select className="form-control" name="readyForWeavingStatus" value={fields.readyForWeavingStatus || 'Yes'} onChange={handleInputChange}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 13: Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Beam Image Upload (URL)</label>
                        <input type="text" className="form-control" name="beamImageUpload" value={fields.beamImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Report Upload (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Warp Plan Upload (URL)</label>
                        <input type="text" className="form-control" name="warpPlanUpload" value={fields.warpPlanUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 14: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
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

              {/* CLOTH DYEING/PROCESSING ORDER COMPLETION FORM */}
              {activePage === 'cloth_dyeing_comp' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Completion Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Completion Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Completion No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Completion Date *</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Completion Type *</label>
                        <select className="form-control" name="completionType" value={fields.completionType || 'Finishing'} onChange={handleInputChange} required>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Printing">Printing</option>
                          <option value="Washing">Washing</option>
                          <option value="Stenter">Stenter</option>
                          <option value="Compacting">Compacting</option>
                          <option value="Finishing">Finishing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Processing Unit Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Processing Unit Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Unit Name</label>
                        <input type="text" className="form-control" name="processingUnitName" value={fields.processingUnitName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Name</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Order No</label>
                        <input type="text" className="form-control" name="processingOrderNo" value={fields.processingOrderNo || ''} onChange={handleInputChange} />
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
                        <label>Fabric Batch No</label>
                        <input type="text" className="form-control" name="fabricBatchNo" value={fields.fabricBatchNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Fabric Name</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Construction</label>
                        <input type="text" className="form-control" name="construction" value={fields.construction || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="text" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="text" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Grey Fabric Qty</label>
                        <input type="number" className="form-control" name="greyFabricQty" value={fields.greyFabricQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sent Qty</label>
                        <input type="number" className="form-control" name="sentQty" value={fields.sentQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Processed Qty</label>
                        <input type="number" className="form-control" name="processedQty" value={fields.processedQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rejected Qty</label>
                        <input type="number" className="form-control" name="rejectedQty" value={fields.rejectedQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Qty</label>
                        <input type="number" className="form-control" name="balanceQty" value={fields.balanceQty || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <input type="text" className="form-control" name="uom" value={fields.uom || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Processing Result Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Processing Result Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Final Width</label>
                        <input type="text" className="form-control" name="finalWidth" value={fields.finalWidth || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Final GSM</label>
                        <input type="text" className="form-control" name="finalGsm" value={fields.finalGsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shrinkage %</label>
                        <input type="number" className="form-control" name="shrinkagePercent" value={fields.shrinkagePercent || ''} onChange={handleInputChange} step="0.01" />
                      </div>
                      <div className="form-group">
                        <label>Shade Matching</label>
                        <input type="text" className="form-control" name="shadeMatching" value={fields.shadeMatching || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Hand Feel Result</label>
                        <input type="text" className="form-control" name="handFeelResult" value={fields.handFeelResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Finish Result</label>
                        <input type="text" className="form-control" name="finishResult" value={fields.finishResult || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Printing Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Printing Details (Optional)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Print Type</label>
                        <input type="text" className="form-control" name="printType" value={fields.printType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Print Repeat</label>
                        <input type="text" className="form-control" name="printRepeat" value={fields.printRepeat || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Print Quality Result</label>
                        <input type="text" className="form-control" name="printQualityResult" value={fields.printQualityResult || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Quality Check */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Check & Status
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'QC Approved'} onChange={handleInputChange}>
                          <option value="Pending QC">Pending QC</option>
                          <option value="QC Approved">QC Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Reprocess">Reprocess</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Result</label>
                        <input type="text" className="form-control" name="inspectionResult" value={fields.inspectionResult || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Defect Points</label>
                        <input type="number" className="form-control" name="defectPoints" value={fields.defectPoints || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Color Fastness</label>
                        <input type="text" className="form-control" name="colorFastness" value={fields.colorFastness || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Reprocess Required</label>
                        <select className="form-control" name="reprocessRequired" value={fields.reprocessRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Machine Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Machine Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Machine Name</label>
                        <input type="text" className="form-control" name="machineName" value={fields.machineName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Operator Name</label>
                        <input type="text" className="form-control" name="operatorName" value={fields.operatorName || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shift</label>
                        <select className="form-control" name="shift" value={fields.shift || 'Day'} onChange={handleInputChange}>
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 10: Delivery Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Sent Date</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Completion Date</label>
                        <input type="date" className="form-control" name="completionDate" value={fields.completionDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 11: Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Processing Rate</label>
                        <input type="number" className="form-control" name="processingRate" value={fields.processingRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Total Cost</label>
                        <input type="number" className="form-control" name="totalCost" value={fields.totalCost || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Penalty Amount</label>
                        <input type="number" className="form-control" name="penaltyAmount" value={fields.penaltyAmount || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 12: Stock Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Stock Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warehouse Location</label>
                        <input type="text" className="form-control" name="warehouseLocation" value={fields.warehouseLocation || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Roll No</label>
                        <input type="text" className="form-control" name="rollNo" value={fields.rollNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Batch No</label>
                        <input type="text" className="form-control" name="batchNo" value={fields.batchNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Ready For Dispatch Status</label>
                        <select className="form-control" name="readyForDispatchStatus" value={fields.readyForDispatchStatus || 'Yes'} onChange={handleInputChange}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 13: Approval Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Approved By</label>
                        <select className="form-control" name="qcApprovedBy" value={fields.qcApprovedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Store Approved By</label>
                        <select className="form-control" name="storeApprovedBy" value={fields.storeApprovedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Production Approved By</label>
                        <select className="form-control" name="productionApprovedBy" value={fields.productionApprovedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 14: Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Report Upload (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Fabric Image (URL)</label>
                        <input type="text" className="form-control" name="fabricImageUpload" value={fields.fabricImageUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Processing Sheet (URL)</label>
                        <input type="text" className="form-control" name="processingSheetUpload" value={fields.processingSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 15: Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks
                    </h3>
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

              {/* BUYER ORDER APPROVAL FORM */}
              {activePage === 'buyer_order_app' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Approval Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Order Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Approval Date *</label>
                        <input type="date" className="form-control" name="approvalDate" value={fields.approvalDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approval Type *</label>
                        <select className="form-control" name="approvalType" value={fields.approvalType || 'Sample Approval'} onChange={handleInputChange} required>
                          <option value="Sample Approval">Sample Approval</option>
                          <option value="Bulk Approval">Bulk Approval</option>
                          <option value="Final Approval">Final Approval</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Buyer & Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Buyer & Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <input type="text" className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No *</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Customer PO Number</label>
                        <input type="text" className="form-control" name="customerPoNumber" value={fields.customerPoNumber || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Merchant Name</label>
                        <input type="text" className="form-control" name="merchantName" value={fields.merchantName || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Order Dates & Schedule */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Order Dates & Schedule
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Order Date</label>
                        <input type="date" className="form-control" name="orderDate" value={fields.orderDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delivery Date</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shipment Date</label>
                        <input type="date" className="form-control" name="shipmentDate" value={fields.shipmentDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Priority Level</label>
                        <select className="form-control" name="priorityLevel" value={fields.priorityLevel || 'Medium'} onChange={handleInputChange}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Fabric / Product Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric & Product Specifications
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Name *</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Design No *</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} placeholder="e.g. Cotton Woven" />
                      </div>
                      <div className="form-group">
                        <label>Construction</label>
                        <input type="text" className="form-control" name="construction" value={fields.construction || ''} onChange={handleInputChange} placeholder="e.g. 40s x 40s / 120 x 80" />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} placeholder="e.g. 100% Cotton" />
                      </div>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="number" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width (inches)</label>
                        <input type="number" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade / Color</label>
                        <input type="text" className="form-control" name="shadeColor" value={fields.shadeColor || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity & Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity & Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Ordered Quantity *</label>
                        <input type="number" className="form-control" name="orderedQuantity" value={fields.orderedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approved Quantity *</label>
                        <input type="number" className="form-control" name="approvedQuantity" value={fields.approvedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Balance Quantity</label>
                        <input type="number" className="form-control" name="balanceQuantity" value={fields.balanceQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange}>
                          <option value="Mtrs">Meters (Mtrs)</option>
                          <option value="Kgs">Kilograms (Kgs)</option>
                          <option value="Pcs">Pieces (Pcs)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Rate *</label>
                        <input type="number" className="form-control" name="buyerRate" value={fields.buyerRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Currency</label>
                        <select className="form-control" name="currency" value={fields.currency || 'INR'} onChange={handleInputChange}>
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Total Order Value</label>
                        <input type="number" className="form-control" name="totalOrderValue" value={fields.totalOrderValue || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms</label>
                        <input type="text" className="form-control" name="paymentTerms" value={fields.paymentTerms || ''} onChange={handleInputChange} placeholder="e.g. 30 Days Credit" />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Technical & Production Parameters */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Technical & Production Parameters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Sample Approval Status</label>
                        <select className="form-control" name="sampleApprovalStatus" value={fields.sampleApprovalStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Lab Dip Approval</label>
                        <select className="form-control" name="labDipApproval" value={fields.labDipApproval || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Quality Standard</label>
                        <input type="text" className="form-control" name="qualityStandard" value={fields.qualityStandard || ''} onChange={handleInputChange} placeholder="e.g. AATCC / ISO" />
                      </div>
                      <div className="form-group">
                        <label>Loom Allocation</label>
                        <input type="text" className="form-control" name="loomAllocation" value={fields.loomAllocation || ''} onChange={handleInputChange} placeholder="e.g. Airjet Loom #4" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Process Route</label>
                        <input type="text" className="form-control" name="processRoute" value={fields.processRoute || ''} onChange={handleInputChange} placeholder="e.g. Dyeing -> Sizing -> Weaving" />
                      </div>
                      <div className="form-group">
                        <label>Dyeing Required?</label>
                        <select className="form-control" name="dyeingRequired" value={fields.dyeingRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Printing Required?</label>
                        <select className="form-control" name="printingRequired" value={fields.printingRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Finishing Required?</label>
                        <select className="form-control" name="finishingRequired" value={fields.finishingRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Quality & Final Approval Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality & Final Approval Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>QC Approval Status</label>
                        <select className="form-control" name="qcApprovalStatus" value={fields.qcApprovalStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Requirement</label>
                        <input type="text" className="form-control" name="inspectionRequirement" value={fields.inspectionRequirement || ''} onChange={handleInputChange} placeholder="e.g. 4-Point System" />
                      </div>
                      <div className="form-group">
                        <label>Testing Requirement</label>
                        <input type="text" className="form-control" name="testingRequirement" value={fields.testingRequirement || ''} onChange={handleInputChange} placeholder="e.g. Shrinkage / Rubbing Fastness" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Approved By</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approved Date</label>
                        <input type="date" className="form-control" name="approvedDate" value={fields.approvedDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Final Approval Status</label>
                        <select className="form-control" name="finalApprovalStatus" value={fields.finalApprovalStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status Tracking</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Remarks & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Buyer PO (URL)</label>
                        <input type="text" className="form-control" name="buyerPoUpload" value={fields.buyerPoUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tech Pack (URL)</label>
                        <input type="text" className="form-control" name="techPackUpload" value={fields.techPackUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Sample Approval (URL)</label>
                        <input type="text" className="form-control" name="sampleApprovalUpload" value={fields.sampleApprovalUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Remarks</label>
                        <textarea className="form-control" rows="3" name="buyerRemarks" value={fields.buyerRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Notes</label>
                        <textarea className="form-control" rows="3" name="technicalNotes" value={fields.technicalNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* PI APPROVAL FORM */}
              {activePage === 'pi_app' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: PI Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Proforma Invoice (PI) Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>PI Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>PI Number *</label>
                        <input type="text" className="form-control" name="piNumber" value={fields.piNumber || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>PI Date *</label>
                        <input type="date" className="form-control" name="piDate" value={fields.piDate || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Buyer & Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Buyer & Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <input type="text" className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Buyer Country</label>
                        <input type="text" className="form-control" name="buyerCountry" value={fields.buyerCountry || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No *</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Sales Order No</label>
                        <input type="text" className="form-control" name="salesOrderNo" value={fields.salesOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Product Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Product Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Fabric / Product Name *</label>
                        <input type="text" className="form-control" name="fabricProductName" value={fields.fabricProductName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} placeholder="e.g. 100% Cotton" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="number" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="number" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange}>
                          <option value="Mtrs">Meters (Mtrs)</option>
                          <option value="Kgs">Kilograms (Kgs)</option>
                          <option value="Pcs">Pieces (Pcs)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Quantity & Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity & Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>PI Quantity *</label>
                        <input type="number" className="form-control" name="piQuantity" value={fields.piQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Unit Rate *</label>
                        <input type="number" className="form-control" name="unitRate" value={fields.unitRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Amount</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Currency</label>
                        <select className="form-control" name="currency" value={fields.currency || 'INR'} onChange={handleInputChange}>
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Exchange Rate</label>
                        <input type="number" step="0.0001" className="form-control" name="exchangeRate" value={fields.exchangeRate || '1'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Discount</label>
                        <input type="number" className="form-control" name="discount" value={fields.discount || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Tax %</label>
                        <input type="number" className="form-control" name="taxPercent" value={fields.taxPercent || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Freight Charges</label>
                        <input type="number" className="form-control" name="freightCharges" value={fields.freightCharges || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Insurance Charges</label>
                        <input type="number" className="form-control" name="insuranceCharges" value={fields.insuranceCharges || '0'} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Payment & Shipment Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Payment & Shipment Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Payment Mode</label>
                        <input type="text" className="form-control" name="paymentMode" value={fields.paymentMode || ''} onChange={handleInputChange} placeholder="e.g. L/C, T/T" />
                      </div>
                      <div className="form-group">
                        <label>Advance %</label>
                        <input type="number" className="form-control" name="advancePercent" value={fields.advancePercent || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Credit Days</label>
                        <input type="number" className="form-control" name="creditDays" value={fields.creditDays || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Bank Details</label>
                        <input type="text" className="form-control" name="bankDetails" value={fields.bankDetails || ''} onChange={handleInputChange} placeholder="e.g. SBI Account" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Delivery Date</label>
                        <input type="date" className="form-control" name="deliveryDate" value={fields.deliveryDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shipment Mode</label>
                        <select className="form-control" name="shipmentMode" value={fields.shipmentMode || 'Sea'} onChange={handleInputChange}>
                          <option value="Sea">Sea</option>
                          <option value="Air">Air</option>
                          <option value="Road">Road</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Port of Loading</label>
                        <input type="text" className="form-control" name="portOfLoading" value={fields.portOfLoading || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Destination Port</label>
                        <input type="text" className="form-control" name="destinationPort" value={fields.destinationPort || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Incoterms</label>
                        <select className="form-control" name="incoterms" value={fields.incoterms || 'FOB'} onChange={handleInputChange}>
                          <option value="FOB">FOB</option>
                          <option value="CIF">CIF</option>
                          <option value="EXW">EXW</option>
                          <option value="CFR">CFR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Compliance, Status & Approvals */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Compliance & Internal Approvals
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Export Compliance Status</label>
                        <select className="form-control" name="exportComplianceStatus" value={fields.exportComplianceStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Documentation Status</label>
                        <select className="form-control" name="documentationStatus" value={fields.documentationStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>GST Status</label>
                        <select className="form-control" name="gstStatus" value={fields.gstStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status Tracking</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Draft'} onChange={handleInputChange}>
                          <option value="Draft">Draft</option>
                          <option value="Pending Approval">Pending Approval</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Revised">Revised</option>
                        </select>
                      </div>
                    </div>
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
                        <label>Approval Date</label>
                        <input type="date" className="form-control" name="approvalDate" value={fields.approvalDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Remarks & Attachments */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Remarks & Attachments
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>PI Document (URL)</label>
                        <input type="text" className="form-control" name="piDocumentUpload" value={fields.piDocumentUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Confirmation (URL)</label>
                        <input type="text" className="form-control" name="buyerConfirmationUpload" value={fields.buyerConfirmationUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Commercial Sheet (URL)</label>
                        <input type="text" className="form-control" name="commercialSheetUpload" value={fields.commercialSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Commercial Remarks</label>
                        <textarea className="form-control" rows="3" name="commercialRemarks" value={fields.commercialRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Export Notes</label>
                        <textarea className="form-control" rows="3" name="exportNotes" value={fields.exportNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* VENDOR WORK ORDER APPROVAL FORM */}
              {activePage === 'vendor_work_app' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Approval Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor WO Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Approval Date *</label>
                        <input type="date" className="form-control" name="approvalDate" value={fields.approvalDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approval Type *</label>
                        <select className="form-control" name="approvalType" value={fields.approvalType || 'Dyeing'} onChange={handleInputChange} required>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Warping">Warping</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Weaving">Weaving</option>
                          <option value="Processing">Processing</option>
                          <option value="Finishing">Finishing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Vendor Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Vendor Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Vendor Code</label>
                        <input type="text" className="form-control" name="vendorCode" value={fields.vendorCode || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Mobile No</label>
                        <input type="text" className="form-control" name="mobileNo" value={fields.mobileNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Work Order References */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Work Order Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Work Order No *</label>
                        <input type="text" className="form-control" name="vendorWorkOrderNo" value={fields.vendorWorkOrderNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Buyer Order No *</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Work Order No *</label>
                        <input type="text" className="form-control" name="workOrderNo" value={fields.workOrderNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Material & Quantity Specifications */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Material & Quantity Specifications
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Yarn/Fabric Name *</label>
                        <input type="text" className="form-control" name="yarnFabricName" value={fields.yarnFabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} placeholder="e.g. 40s Comb" />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="number" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input type="number" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Ordered Qty *</label>
                        <input type="number" className="form-control" name="orderedQuantity" value={fields.orderedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approved Qty *</label>
                        <input type="number" className="form-control" name="approvedQuantity" value={fields.approvedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Kgs'} onChange={handleInputChange}>
                          <option value="Kgs">Kilograms (Kgs)</option>
                          <option value="Mtrs">Meters (Mtrs)</option>
                          <option value="Pcs">Pieces (Pcs)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Process & Commercial Parameters */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Process & Commercial Parameters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Process Name *</label>
                        <input type="text" className="form-control" name="processName" value={fields.processName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Machine Type</label>
                        <input type="text" className="form-control" name="machineType" value={fields.machineType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Process Route</label>
                        <input type="text" className="form-control" name="processRoute" value={fields.processRoute || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Required Finish</label>
                        <input type="text" className="form-control" name="requiredFinish" value={fields.requiredFinish || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Rate *</label>
                        <input type="number" className="form-control" name="vendorRate" value={fields.vendorRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Amount</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms</label>
                        <input type="text" className="form-control" name="paymentTerms" value={fields.paymentTerms || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Delivery & QC details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery & Quality Control details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Sent Date</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Expected Delivery Date</label>
                        <input type="date" className="form-control" name="expectedDeliveryDate" value={fields.expectedDeliveryDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Transport Details</label>
                        <input type="text" className="form-control" name="transportDetails" value={fields.transportDetails || ''} onChange={handleInputChange} placeholder="e.g. VRL Logistics" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Requirement</label>
                        <input type="text" className="form-control" name="qcRequirement" value={fields.qcRequirement || ''} onChange={handleInputChange} placeholder="e.g. GSM and shade match" />
                      </div>
                      <div className="form-group">
                        <label>Inspection Requirement</label>
                        <input type="text" className="form-control" name="inspectionRequirement" value={fields.inspectionRequirement || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Quality Standard</label>
                        <input type="text" className="form-control" name="qualityStandard" value={fields.qualityStandard || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rejection Allowance %</label>
                        <input type="number" step="0.1" className="form-control" name="rejectionAllowancePercent" value={fields.rejectionAllowancePercent || '0'} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Technical & Final Approvals */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Technical & Verification Approvals
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Technical Parameters Approved?</label>
                        <select className="form-control" name="technicalParametersApproved" value={fields.technicalParametersApproved || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Process Sheet Approved?</label>
                        <select className="form-control" name="processSheetApproved" value={fields.processSheetApproved || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Sample Approved?</label>
                        <select className="form-control" name="sampleApproved" value={fields.sampleApproved || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
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
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Hold">Hold</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Work Order Document (URL)</label>
                        <input type="text" className="form-control" name="workOrderUpload" value={fields.workOrderUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Sheet (URL)</label>
                        <input type="text" className="form-control" name="technicalSheetUpload" value={fields.technicalSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Instructions (URL)</label>
                        <input type="text" className="form-control" name="qcInstructionsUpload" value={fields.qcInstructionsUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Instructions</label>
                        <textarea className="form-control" rows="3" name="vendorInstructions" value={fields.vendorInstructions || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* INTERNAL FABRIC REQUEST APPROVAL FORM */}
              {activePage === 'internal_fabric_app' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Approval Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Fabric Request Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Approval Date *</label>
                        <input type="date" className="form-control" name="approvalDate" value={fields.approvalDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approval Type *</label>
                        <select className="form-control" name="approvalType" value={fields.approvalType || 'Sample'} onChange={handleInputChange} required>
                          <option value="Sample">Sample</option>
                          <option value="Production">Production</option>
                          <option value="QC">QC</option>
                          <option value="Buyer Approval">Buyer Approval</option>
                          <option value="Dispatch">Dispatch</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Request Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Request Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Internal Fabric Request No *</label>
                        <input type="text" className="form-control" name="internalFabricRequestNo" value={fields.internalFabricRequestNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Request Date</label>
                        <input type="date" className="form-control" name="requestDate" value={fields.requestDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Requested Department *</label>
                        <input type="text" className="form-control" name="requestedDepartment" value={fields.requestedDepartment || ''} onChange={handleInputChange} required placeholder="e.g. Weaving, Sampling" />
                      </div>
                      <div className="form-group">
                        <label>Requested By</label>
                        <select className="form-control" name="requestedBy" value={fields.requestedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
                      <div className="form-group">
                        <label>Fabric Batch No</label>
                        <input type="text" className="form-control" name="fabricBatchNo" value={fields.fabricBatchNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Fabric Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Fabric Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Fabric Name *</label>
                        <input type="text" className="form-control" name="fabricName" value={fields.fabricName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Fabric Type</label>
                        <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} placeholder="e.g. Linen Woven" />
                      </div>
                      <div className="form-group">
                        <label>Construction</label>
                        <input type="text" className="form-control" name="construction" value={fields.construction || ''} onChange={handleInputChange} placeholder="e.g. 60s x 60s / 100 x 92" />
                      </div>
                      <div className="form-group">
                        <label>Composition</label>
                        <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} placeholder="e.g. 100% Linen" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>GSM</label>
                        <input type="number" className="form-control" name="gsm" value={fields.gsm || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width (inches)</label>
                        <input type="number" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} placeholder="e.g. Indigo Blue" />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Requested Qty *</label>
                        <input type="number" className="form-control" name="requestedQuantity" value={fields.requestedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approved Qty *</label>
                        <input type="number" className="form-control" name="approvedQuantity" value={fields.approvedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Available Qty</label>
                        <input type="number" className="form-control" name="availableQuantity" value={fields.availableQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Qty</label>
                        <input type="number" className="form-control" name="balanceQuantity" value={fields.balanceQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Mtrs'} onChange={handleInputChange}>
                          <option value="Mtrs">Meters (Mtrs)</option>
                          <option value="Kgs">Kilograms (Kgs)</option>
                          <option value="Pcs">Pieces (Pcs)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Stock Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Stock Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warehouse Location</label>
                        <input type="text" className="form-control" name="warehouseLocation" value={fields.warehouseLocation || ''} onChange={handleInputChange} placeholder="e.g. Section A-3" />
                      </div>
                      <div className="form-group">
                        <label>Rack No</label>
                        <input type="text" className="form-control" name="rackNo" value={fields.rackNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Roll No</label>
                        <input type="text" className="form-control" name="rollNo" value={fields.rollNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Purpose & Quality Approval */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Purpose & Quality Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Request Purpose</label>
                        <input type="text" className="form-control" name="requestPurpose" value={fields.requestPurpose || ''} onChange={handleInputChange} placeholder="e.g. Buyer Sampling" />
                      </div>
                      <div className="form-group">
                        <label>Priority Level</label>
                        <select className="form-control" name="priorityLevel" value={fields.priorityLevel || 'Medium'} onChange={handleInputChange}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Required Date</label>
                        <input type="date" className="form-control" name="requiredDate" value={fields.requiredDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>QC Status</label>
                        <select className="form-control" name="qcStatus" value={fields.qcStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Inspection Required</label>
                        <select className="form-control" name="inspectionRequired" value={fields.inspectionRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fabric Condition</label>
                        <input type="text" className="form-control" name="fabricCondition" value={fields.fabricCondition || ''} onChange={handleInputChange} placeholder="e.g. Good, Checked" />
                      </div>
                      <div className="form-group">
                        <label>Defect Remarks</label>
                        <input type="text" className="form-control" name="defectRemarks" value={fields.defectRemarks || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Verification & Dispatch Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Verification & Dispatch Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
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
                      <div className="form-group">
                        <label>Status Tracking</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Issued">Issued</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Issue Status</label>
                        <select className="form-control" name="issueStatus" value={fields.issueStatus || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Partially Issued">Partially Issued</option>
                          <option value="Fully Issued">Fully Issued</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Issued By</label>
                        <select className="form-control" name="issuedBy" value={fields.issuedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Issue Date</label>
                        <input type="date" className="form-control" name="issueDate" value={fields.issueDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Fabric Image Upload (URL)</label>
                        <input type="text" className="form-control" name="fabricImageUpload" value={fields.fabricImageUpload || ''} onChange={handleInputChange} placeholder="http://..." />
                      </div>
                      <div className="form-group">
                        <label>Request Document Upload (URL)</label>
                        <input type="text" className="form-control" name="requestDocumentUpload" value={fields.requestDocumentUpload || ''} onChange={handleInputChange} placeholder="http://..." />
                      </div>
                      <div className="form-group">
                        <label>QC Report Upload (URL)</label>
                        <input type="text" className="form-control" name="qcReportUpload" value={fields.qcReportUpload || ''} onChange={handleInputChange} placeholder="http://..." />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Approval Remarks</label>
                        <textarea className="form-control" rows="3" name="approvalRemarks" value={fields.approvalRemarks || ''} onChange={handleInputChange} />
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

              {/* YARN REQUIREMENT APPROVAL FORM */}
              {activePage === 'yarn_req_app' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Approval Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Requirement Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Approval Date *</label>
                        <input type="date" className="form-control" name="approvalDate" value={fields.approvalDate || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Requirement Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Requirement Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Requirement No *</label>
                        <input type="text" className="form-control" name="yarnRequirementNo" value={fields.yarnRequirementNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Requirement Date</label>
                        <input type="date" className="form-control" name="requirementDate" value={fields.requirementDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Requested By</label>
                        <select className="form-control" name="requestedBy" value={fields.requestedBy || ''} onChange={handleInputChange}>
                          <option value="">-- Select Employee --</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Department Name *</label>
                        <input type="text" className="form-control" name="departmentName" value={fields.departmentName || ''} onChange={handleInputChange} required placeholder="e.g. Yarn Store, Planning" />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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

                  {/* CARD 4: Yarn Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Yarn Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Yarn Type *</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} required placeholder="e.g. Cotton Carded" />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count *</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} required placeholder="e.g. 40s" />
                      </div>
                      <div className="form-group">
                        <label>Ply</label>
                        <input type="text" className="form-control" name="ply" value={fields.ply || '1'} onChange={handleInputChange} placeholder="e.g. 1, 2" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Quality</label>
                        <input type="text" className="form-control" name="yarnQuality" value={fields.yarnQuality || ''} onChange={handleInputChange} placeholder="e.g. Semi-Combed" />
                      </div>
                      <div className="form-group">
                        <label>Mill Name</label>
                        <input type="text" className="form-control" name="millName" value={fields.millName || ''} onChange={handleInputChange} placeholder="e.g. Vardhman Mills" />
                      </div>
                      <div className="form-group">
                        <label>Shade</label>
                        <input type="text" className="form-control" name="shade" value={fields.shade || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: Requirement & Consumption Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Requirement & Consumption Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Required Qty *</label>
                        <input type="number" className="form-control" name="requiredQuantity" value={fields.requiredQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approved Qty *</label>
                        <input type="number" className="form-control" name="approvedQuantity" value={fields.approvedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Available Stock Qty</label>
                        <input type="number" className="form-control" name="availableStockQuantity" value={fields.availableStockQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Pending Qty</label>
                        <input type="number" className="form-control" name="pendingQuantity" value={fields.pendingQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Kgs'} onChange={handleInputChange}>
                          <option value="Kgs">Kilograms (Kgs)</option>
                          <option value="Mtrs">Meters (Mtrs)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Warp Consumption</label>
                        <input type="text" className="form-control" name="warpConsumption" value={fields.warpConsumption || ''} onChange={handleInputChange} placeholder="e.g. 1.2 kg/mtr" />
                      </div>
                      <div className="form-group">
                        <label>Weft Consumption</label>
                        <input type="text" className="form-control" name="weftConsumption" value={fields.weftConsumption || ''} onChange={handleInputChange} placeholder="e.g. 0.8 kg/mtr" />
                      </div>
                      <div className="form-group">
                        <label>Total Consumption</label>
                        <input type="text" className="form-control" name="totalConsumption" value={fields.totalConsumption || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Production Planning & Purchase Planning */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Production & Purchase Planning
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Loom Allocation</label>
                        <input type="text" className="form-control" name="loomAllocation" value={fields.loomAllocation || ''} onChange={handleInputChange} placeholder="e.g. Airjet Loom #4" />
                      </div>
                      <div className="form-group">
                        <label>Production Target</label>
                        <input type="text" className="form-control" name="productionTarget" value={fields.productionTarget || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Required Date</label>
                        <input type="date" className="form-control" name="requiredDate" value={fields.requiredDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Priority Level</label>
                        <select className="form-control" name="priorityLevel" value={fields.priorityLevel || 'Medium'} onChange={handleInputChange}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Purchase Required?</label>
                        <select className="form-control" name="purchaseRequired" value={fields.purchaseRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Preferred Vendor</label>
                        <input type="text" className="form-control" name="preferredVendor" value={fields.preferredVendor || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Expected Purchase Date</label>
                        <input type="date" className="form-control" name="expectedPurchaseDate" value={fields.expectedPurchaseDate || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Quality & Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality & Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Quality Standard</label>
                        <input type="text" className="form-control" name="yarnQualityStandard" value={fields.yarnQualityStandard || ''} onChange={handleInputChange} placeholder="e.g. Uster Class 1" />
                      </div>
                      <div className="form-group">
                        <label>QC Requirement</label>
                        <input type="text" className="form-control" name="qcRequirement" value={fields.qcRequirement || ''} onChange={handleInputChange} placeholder="e.g. CSP Strength Test" />
                      </div>
                      <div className="form-group">
                        <label>Testing Requirement</label>
                        <input type="text" className="form-control" name="testingRequirement" value={fields.testingRequirement || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Estimated Rate (INR/Kg)</label>
                        <input type="number" className="form-control" name="estimatedRate" value={fields.estimatedRate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Estimated Cost</label>
                        <input type="number" className="form-control" name="estimatedCost" value={fields.estimatedCost || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Verification & Approval Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Verification & Approval Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
                      <div className="form-group">
                        <label>Status Tracking</label>
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Purchase Planned">Purchase Planned</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Requirement Sheet Upload (URL)</label>
                        <input type="text" className="form-control" name="requirementSheetUpload" value={fields.requirementSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Consumption Sheet Upload (URL)</label>
                        <input type="text" className="form-control" name="consumptionSheetUpload" value={fields.consumptionSheetUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Specification Upload (URL)</label>
                        <input type="text" className="form-control" name="yarnSpecificationUpload" value={fields.yarnSpecificationUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Remarks</label>
                        <textarea className="form-control" rows="3" name="technicalRemarks" value={fields.technicalRemarks || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Planning Notes</label>
                        <textarea className="form-control" rows="3" name="planningNotes" value={fields.planningNotes || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Internal Notes</label>
                        <textarea className="form-control" rows="3" name="internalNotes" value={fields.internalNotes || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* YARN WORK ORDERS APPROVAL FORM */}
              {activePage === 'yarn_work_app' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* CARD 1: Approval Information */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Approval Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Work Order Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Approval Date *</label>
                        <input type="date" className="form-control" name="approvalDate" value={fields.approvalDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Work Order Type *</label>
                        <select className="form-control" name="workOrderType" value={fields.workOrderType || 'Dyeing'} onChange={handleInputChange} required>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Doubling">Doubling</option>
                          <option value="Twisting">Twisting</option>
                          <option value="Warping">Warping</option>
                          <option value="Sizing">Sizing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Work Order Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Work Order Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Yarn Work Order No *</label>
                        <input type="text" className="form-control" name="yarnWorkOrderNo" value={fields.yarnWorkOrderNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Work Order Date</label>
                        <input type="date" className="form-control" name="workOrderDate" value={fields.workOrderDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange} required placeholder="e.g. Standard Dyehouse" />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input type="text" className="form-control" name="contactPerson" value={fields.contactPerson || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Reference Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Reference Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Buyer Order No</label>
                        <input type="text" className="form-control" name="buyerOrderNo" value={fields.buyerOrderNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input type="text" className="form-control" name="designNo" value={fields.designNo || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Production Plan No</label>
                        <input type="text" className="form-control" name="productionPlanNo" value={fields.productionPlanNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Yarn Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Yarn Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Yarn Type *</label>
                        <input type="text" className="form-control" name="yarnType" value={fields.yarnType || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Yarn Count *</label>
                        <input type="text" className="form-control" name="yarnCount" value={fields.yarnCount || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Ply</label>
                        <input type="text" className="form-control" name="ply" value={fields.ply || '1'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Quality</label>
                        <input type="text" className="form-control" name="yarnQuality" value={fields.yarnQuality || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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

                  {/* CARD 5: Quantity Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quantity Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Ordered Qty *</label>
                        <input type="number" className="form-control" name="orderedQuantity" value={fields.orderedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approved Qty *</label>
                        <input type="number" className="form-control" name="approvedQuantity" value={fields.approvedQuantity || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Sent Qty</label>
                        <input type="number" className="form-control" name="sentQuantity" value={fields.sentQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Balance Qty</label>
                        <input type="number" className="form-control" name="balanceQuantity" value={fields.balanceQuantity || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>UOM</label>
                        <select className="form-control" name="uom" value={fields.uom || 'Kgs'} onChange={handleInputChange}>
                          <option value="Kgs">Kilograms (Kgs)</option>
                          <option value="Mtrs">Meters (Mtrs)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Process Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Process Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Process Name *</label>
                        <input type="text" className="form-control" name="processName" value={fields.processName || ''} onChange={handleInputChange} required placeholder="e.g. Yarn Dyeing" />
                      </div>
                      <div className="form-group">
                        <label>Machine Type</label>
                        <input type="text" className="form-control" name="machineType" value={fields.machineType || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Technical Parameters</label>
                        <input type="text" className="form-control" name="technicalParameters" value={fields.technicalParameters || ''} onChange={handleInputChange} placeholder="e.g. Temperature 100C" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Twist Requirement</label>
                        <input type="text" className="form-control" name="twistRequirement" value={fields.twistRequirement || ''} onChange={handleInputChange} placeholder="e.g. 600 TPM Z-Twist" />
                      </div>
                      <div className="form-group">
                        <label>Shade Requirement</label>
                        <input type="text" className="form-control" name="shadeRequirement" value={fields.shadeRequirement || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 7: Delivery & Commercial Details */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Delivery & Commercial Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>Sent Date</label>
                        <input type="date" className="form-control" name="sentDate" value={fields.sentDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Expected Delivery Date</label>
                        <input type="date" className="form-control" name="expectedDeliveryDate" value={fields.expectedDeliveryDate || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Priority Level</label>
                        <select className="form-control" name="priorityLevel" value={fields.priorityLevel || 'Medium'} onChange={handleInputChange}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Vendor Rate *</label>
                        <input type="number" className="form-control" name="vendorRate" value={fields.vendorRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Amount</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Additional Charges</label>
                        <input type="number" className="form-control" name="additionalCharges" value={fields.additionalCharges || '0'} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms</label>
                        <input type="text" className="form-control" name="paymentTerms" value={fields.paymentTerms || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  {/* CARD 8: Quality Approval & Verification */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Quality Approval & Verification
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label>QC Requirement</label>
                        <input type="text" className="form-control" name="qcRequirement" value={fields.qcRequirement || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Strength Test Required?</label>
                        <select className="form-control" name="strengthTestRequired" value={fields.strengthTestRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Shade Matching Required?</label>
                        <select className="form-control" name="shadeMatchingRequired" value={fields.shadeMatchingRequired || 'No'} onChange={handleInputChange}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Quality Standard</label>
                        <input type="text" className="form-control" name="qualityStandard" value={fields.qualityStandard || ''} onChange={handleInputChange} />
                      </div>
                    </div>
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
                        <select className="form-control" name="statusTracking" value={fields.statusTracking || 'Pending'} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Sent For Processing">Sent For Processing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CARD 9: Attachments & Remarks */}
                  <div className="card" style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      Attachments & Remarks
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Work Order Upload (URL)</label>
                        <input type="text" className="form-control" name="workOrderUpload" value={fields.workOrderUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Yarn Specification Upload (URL)</label>
                        <input type="text" className="form-control" name="yarnSpecificationUpload" value={fields.yarnSpecificationUpload || ''} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>QC Instructions Upload (URL)</label>
                        <input type="text" className="form-control" name="qcInstructionsUpload" value={fields.qcInstructionsUpload || ''} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Technical Instructions</label>
                        <textarea className="form-control" rows="3" name="technicalInstructions" value={fields.technicalInstructions || ''} onChange={handleInputChange} />
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

              {/* FALLBACK SIMPLE CONFIGS FORM FOR REMAINING MODULES */}
              {!['design_create', 'short_amd', 'hsn_amd', 'vendor_order_comp', 'cloth_po_comp', 'dyeing_order_comp', 'warp_sizing_comp', 'cloth_dyeing_comp', 'dev_bulk_order', 'dev_bulk_followup', 'vendor_order', 'cloth_po', 'dyeing_order', 'cloth_dyeing_order', 'doubling_twisting', 'warp_sizing_order', 'internal_fabric_req', 'buyer_order_app', 'pi_app', 'vendor_work_app', 'internal_fabric_app', 'yarn_req_app', 'yarn_work_app'].includes(activePage) && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ color: '#ec4899', fontSize: '14px', fontWeight: 800, margin: 0 }}>Voucher Details & Audit Configs</h4>
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
