import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, PlusCircle, Layers, FileText, FileDigit, CheckSquare
} from 'lucide-react';
import { workOrderTransactionAPI } from '../../services/api';

export default function SparesTransaction({ defaultSection = 'Master Setup' }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [activeTab, setActiveTab] = useState(null);

  // Search Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('Reference Info');

  useEffect(() => {
    setActiveSection(defaultSection);
    const firstSubModule = Object.values(PAGES_METADATA).find(p => p.category === defaultSection);
    if (firstSubModule) {
      setActiveTab(firstSubModule.key);
    } else {
      setActiveTab(null);
    }
    setIsFormOpen(false);
  }, [defaultSection]);

  const PAGES_METADATA = {
    // 1. Master Setup
    Sections: { key: 'Sections', label: "Section Creation", category: 'Master Setup', desc: "Define loom rooms and shop floors", icon: Layers, color: '#7c3aed' },
    Spares: { key: 'Spares', label: "Spares Creation", category: 'Master Setup', desc: "Catalog inventory for machinery spares", icon: Wrench, color: '#7c3aed' },
    OpeningStock: { key: 'OpeningStock', label: "Opening Stock Entry", category: 'Master Setup', desc: "Define initial physical spares balances", icon: FolderKanban, color: '#7c3aed' },

    // 2. Requests & Approvals (Changed from Orange to Blue)
    RequestIndent: { key: 'RequestIndent', label: "Spares Request Indent Entry", category: 'Requests & Approvals', desc: "Raise internal spare part requests", icon: FolderKanban, color: '#2563eb' },
    IndentApproval: { key: 'IndentApproval', label: "Request Indent Approval", category: 'Requests & Approvals', desc: "Audit and authorize requests", icon: CheckSquare, color: '#2563eb' },

    // 3. Purchase & Work Orders
    PurchaseOrder: { key: 'PurchaseOrder', label: "Purchase Order Entry - Spares", category: 'Purchase & Work Orders', desc: "Draft outbound supplier purchase orders", icon: ShoppingBag, color: '#10b981' },
    POApproval: { key: 'POApproval', label: "Purchase Order Approval", category: 'Purchase & Work Orders', desc: "Authorize outbound purchase orders", icon: CheckSquare, color: '#10b981' },
    WorkOrder: { key: 'WorkOrder', label: "Work Order Entry", category: 'Purchase & Work Orders', desc: "Schedule breakdown/preventive repairs", icon: Wrench, color: '#10b981' },
    PurchaseEntry: { key: 'PurchaseEntry', label: "Purchase Entry", category: 'Purchase & Work Orders', desc: "Register incoming supplier deliveries", icon: ShoppingBag, color: '#10b981' },

    // 4. Consumption & Jobwork (Changed from Pink to Cyan/Teal)
    Consumption: { key: 'Consumption', label: "Consumption Entry", category: 'Consumption & Jobwork', desc: "Log physical parts used during repairs", icon: Factory, color: '#0891b2' },
    JobWorkIssue: { key: 'JobWorkIssue', label: "JobWork / HandLoan Issue Entry", category: 'Consumption & Jobwork', desc: "Dispatch parts for external servicing", icon: AlertTriangle, color: '#0891b2' },
    JobWorkRecv: { key: 'JobWorkRecv', label: "JobWork / HandLoan Received Entry", category: 'Consumption & Jobwork', desc: "Log parts returned from external services", icon: Check, color: '#0891b2' }
  };

  const handleOpenPage = (p) => {
    if (p.isLink) {
      navigate(p.route);
    } else {
      setActiveTab(p.key);
      setIsFormOpen(false);
    }
  };

  // Static reference lists
  const SECTIONS = ['Weaving Division A', 'Dyeing Processing', 'Warping Section B', 'Sizing Room C'];
  const SPARES = [
    { code: 'SPR-001', name: 'Airjet Loom Solenoid Valve', unit: 'Nos', stock: 12, rate: 4500 },
    { code: 'SPR-002', name: 'Syntron Lubricant oil T6', unit: 'Nos', stock: 24, rate: 850 }
  ];
  const SUPPLIERS = ['Standard Gears Ltd', 'Zenith Electricals', 'Chemical Traders', 'Sai Logistics'];
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];

  // ----------------------------------------------------
  // SECTION & SPARES MASTER DATA & FORM STATES
  // ----------------------------------------------------
  const [sections, setSections] = useState([
    { id: 'SEC-001', name: 'Weaving Division A', type: 'Weaving', dept: 'Production', incharge: 'Murugan Swamy (Maintenance In-charge)', machines: 24, desc: 'High-speed airjet loom section', status: 'Active' },
    { id: 'SEC-002', name: 'Dyeing Processing', type: 'Dyeing', dept: 'Processing', incharge: 'Senthil Kumar (General Manager)', machines: 12, desc: 'Yarn and package dyeing unit', status: 'Active' }
  ]);

  const [secName, setSecName] = useState('');
  const [secType, setSecType] = useState('Weaving');
  const [secDept, setSecDept] = useState('Production');
  const [secIncharge, setSecIncharge] = useState('Murugan Swamy (Maintenance In-charge)');
  const [secMachines, setSecMachines] = useState('');
  const [secDesc, setSecDesc] = useState('');
  const [secStatus, setSecStatus] = useState('Active');

  // Section Creation Recommended Fields State
  const [secCode, setSecCode] = useState('');
  const [secDeptName, setSecDeptName] = useState('');
  const [secFloorUnitName, setSecFloorUnitName] = useState('');
  const [secLocation, setSecLocation] = useState('');
  const [secInchargeName, setSecInchargeName] = useState('');
  const [secEmployeeId, setSecEmployeeId] = useState('');
  const [secContactNumber, setSecContactNumber] = useState('');
  const [secMachineGroup, setSecMachineGroup] = useState('');
  const [secCriticalMachineStatus, setSecCriticalMachineStatus] = useState('Non-Critical');
  const [secSpareStorageLocation, setSecSpareStorageLocation] = useState('');
  const [secRackNo, setSecRackNo] = useState('');
  const [secBinNo, setSecBinNo] = useState('');
  const [secActiveStatus, setSecActiveStatus] = useState('Active');
  const [secMaintenanceRequiredStatus, setSecMaintenanceRequiredStatus] = useState('No');
  const [secCreatedBy, setSecCreatedBy] = useState('Murugan Swamy (Maintenance In-charge)');
  const [secVerifiedBy, setSecVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [secApprovedBy, setSecApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [secLayoutUpload, setSecLayoutUpload] = useState('');
  const [secMachineListUpload, setSecMachineListUpload] = useState('');
  const [secMaintenanceNotes, setSecMaintenanceNotes] = useState('');
  const [secInternalNotes, setSecInternalNotes] = useState('');

  const [spares, setSpares] = useState([
    { id: 'SPR-001', name: 'Airjet Loom Solenoid Valve', category: 'Loom Parts', section: 'Weaving Division A', machineType: 'Airjet Loom', brand: 'Toyota', modelNo: 'TY-AJ-800', partNo: 'SLND-4409', uom: 'Nos', reorder: 5, minStock: 2, maxStock: 20, standardRate: 4500, hsnCode: '8448', gstPercent: 18, preferredSupplier: 'Standard Gears Ltd', leadTime: 7, status: 'Active' },
    { id: 'SPR-002', name: 'Syntron Lubricant oil T6', category: 'Lubricants', section: 'Dyeing Processing', machineType: 'Dyeing Vessel', brand: 'Mobil', modelNo: 'T6-Lub', partNo: 'LUB-8891', uom: 'Nos', reorder: 10, minStock: 5, maxStock: 50, standardRate: 850, hsnCode: '2710', gstPercent: 18, preferredSupplier: 'Chemical Traders', leadTime: 3, status: 'Active' }
  ]);

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

  // Spares Creation Recommended Fields State
  const [sprCode, setSprCode] = useState('');
  const [sprMachineName, setSprMachineName] = useState('');
  const [sprMachineModel, setSprMachineModel] = useState('');
  const [sprMachineSection, setSprMachineSection] = useState('Weaving Division A');
  const [sprType, setSprType] = useState('');
  const [sprSize, setSprSize] = useState('');
  const [sprMaterial, setSprMaterial] = useState('');
  const [sprCurrentStock, setSprCurrentStock] = useState('');
  const [sprPreferredVendor, setSprPreferredVendor] = useState('Standard Gears Ltd');
  const [sprVendorCode, setSprVendorCode] = useState('');
  const [sprPurchaseRate, setSprPurchaseRate] = useState('');
  const [sprEstimatedValue, setSprEstimatedValue] = useState('');
  const [sprWarehouseLocation, setSprWarehouseLocation] = useState('');
  const [sprWarehouseRack, setSprWarehouseRack] = useState('');
  const [sprWarehouseBin, setSprWarehouseBin] = useState('');
  const [sprCriticalSpareStatus, setSprCriticalSpareStatus] = useState('No');
  const [sprMaintenanceFrequency, setSprMaintenanceFrequency] = useState('');
  const [sprReplacementCycle, setSprReplacementCycle] = useState('');
  const [sprCreatedBy, setSprCreatedBy] = useState('Murugan Swamy (Maintenance In-charge)');
  const [sprVerifiedBy, setSprVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [sprApprovedBy, setSprApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [sprImageUpload, setSprImageUpload] = useState('');
  const [sprSpecSheetUpload, setSprSpecSheetUpload] = useState('');
  const [sprVendorQuotationUpload, setSprVendorQuotationUpload] = useState('');
  const [sprTechnicalNotes, setSprTechnicalNotes] = useState('');
  const [sprMaintenanceNotes, setSprMaintenanceNotes] = useState('');
  const [sprInternalNotes, setSprInternalNotes] = useState('');

  const filteredSections = useMemo(() => {
    return sections.filter(sec => sec.name.toLowerCase().includes(searchTerm.toLowerCase()) || sec.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sections, searchTerm]);

  const filteredSpares = useMemo(() => {
    return spares.filter(spr => spr.name.toLowerCase().includes(searchTerm.toLowerCase()) || spr.id.toLowerCase().includes(searchTerm.toLowerCase()) || (spr.partNo || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [spares, searchTerm]);

  // ----------------------------------------------------
  // 1. OPENING STOCK DATA & FORM STATES
  // ----------------------------------------------------
  const [openingStocks, setOpeningStocks] = useState([]);

  // Form Fields for Opening Stock (Recommended Fields State)
  const [osFY, setOsFY] = useState('2026-2027');
  const [osSection, setOsSection] = useState('Weaving Division A');
  const [osNarration, setOsNarration] = useState('');
  const [osStatus, setOsStatus] = useState('Draft');
  const [osGridItems, setOsGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', unit: 'Nos', qty: 10, rate: 4500, value: 45000 }]);

  const [osDate, setOsDate] = useState('');
  const [osEntryType, setOsEntryType] = useState('Spare Opening');
  const [osSpareName, setOsSpareName] = useState('');
  const [osSpareCode, setOsSpareCode] = useState('SPR-001');
  const [osSpareCategory, setOsSpareCategory] = useState('Mechanical');
  const [osMachineName, setOsMachineName] = useState('');
  const [osOpeningQuantity, setOsOpeningQuantity] = useState('');
  const [osCurrentQuantity, setOsCurrentQuantity] = useState('');
  const [osUom, setOsUom] = useState('Nos');
  const [osBatchNo, setOsBatchNo] = useState('');
  const [osSerialNo, setOsSerialNo] = useState('');
  const [osWarehouseLocation, setOsWarehouseLocation] = useState('');
  const [osRackNo, setOsRackNo] = useState('');
  const [osBinNo, setOsBinNo] = useState('');
  const [osUnitRate, setOsUnitRate] = useState('');
  const [osValTotal, setOsValTotal] = useState('');
  const [osVendorName, setOsVendorName] = useState('');
  const [osPurchaseReferenceNo, setOsPurchaseReferenceNo] = useState('');
  const [osSpareCondition, setOsSpareCondition] = useState('New');
  const [osInspectionStatus, setOsInspectionStatus] = useState('Passed');
  const [osMinimumStockLevel, setOsMinimumStockLevel] = useState('');
  const [osReorderLevel, setOsReorderLevel] = useState('');
  const [osCriticalSpareStatus, setOsCriticalSpareStatus] = useState('No');
  const [osEnteredBy, setOsEnteredBy] = useState('Mani Bharathi (Store Head)');
  const [osVerifiedBy, setOsVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [osApprovedBy, setOsApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [osSheetUpload, setOsSheetUpload] = useState('');
  const [osImageUpload, setOsImageUpload] = useState('');
  const [osInvoiceUpload, setOsInvoiceUpload] = useState('');
  const [osStockNotes, setOsStockNotes] = useState('');
  const [osInventoryNotes, setOsInventoryNotes] = useState('');
  const [osInternalNotes, setOsInternalNotes] = useState('');

  // ----------------------------------------------------
  // 2. SPARES REQUEST INDENT DATA & FORM STATES
  // ----------------------------------------------------
  const [indents, setIndents] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poApprovals, setPoApprovals] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [purchaseEntries, setPurchaseEntries] = useState([]);

  // Recommended fields for Request Indent
  const [indDate, setIndDate] = useState('');
  const [indRequestType, setIndRequestType] = useState('Spare Request');
  const [indRequestedBy, setIndRequestedBy] = useState('Murugan Swamy (Maintenance In-charge)');
  const [indEmployeeId, setIndEmployeeId] = useState('');
  const [indDeptName, setIndDeptName] = useState('Production');
  const [indSectionName, setIndSectionName] = useState('Weaving Division A');
  const [indMachineName, setIndMachineName] = useState('');
  const [indMachineCode, setIndMachineCode] = useState('');
  const [indMachineSection, setIndMachineSection] = useState('Weaving Division A');
  const [indBreakdownStatus, setIndBreakdownStatus] = useState('No');
  const [indSpareName, setIndSpareName] = useState('');
  const [indSpareCode, setIndSpareCode] = useState('SPR-001');
  const [indSpareCategory, setIndSpareCategory] = useState('Mechanical');
  const [indPartNo, setIndPartNo] = useState('');
  const [indBrand, setIndBrand] = useState('');
  const [indModelNo, setIndModelNo] = useState('');
  const [indReqQty, setIndReqQty] = useState('');
  const [indAvailableQty, setIndAvailableQty] = useState('');
  const [indApprovedQty, setIndApprovedQty] = useState('');
  const [indUom, setIndUom] = useState('Nos');
  const [indReason, setIndReason] = useState('');
  const [indPriorityLevel, setIndPriorityLevel] = useState('Medium');
  const [indCurrentStock, setIndCurrentStock] = useState('');
  const [indMinStock, setIndMinStock] = useState('');
  const [indReorderLevel, setIndReorderLevel] = useState('');
  const [indPreferredVendor, setIndPreferredVendor] = useState('Standard Gears Ltd');
  const [indLastPurchaseRate, setIndLastPurchaseRate] = useState('');
  const [indMaintenanceType, setIndMaintenanceType] = useState('Preventive');
  const [indWorkOrderNo, setIndWorkOrderNo] = useState('');
  const [indVerifiedBy, setIndVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [indApprovedBy, setIndApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [indStatus, setIndStatus] = useState('Draft');
  const [indBreakdownImageUpload, setIndBreakdownImageUpload] = useState('');
  const [indSpareImageUpload, setIndSpareImageUpload] = useState('');
  const [indTechReqUpload, setIndTechReqUpload] = useState('');
  const [indMaintenanceNotes, setIndMaintenanceNotes] = useState('');
  const [indStoreNotes, setIndStoreNotes] = useState('');
  const [indInternalNotes, setIndInternalNotes] = useState('');

  // Dummy fallback states to avoid breaking grid references
  const [indSection, setIndSection] = useState('Weaving Division A');
  const [indMachineNo, setIndMachineNo] = useState('');
  const [indMachineType, setIndMachineType] = useState('Airjet Loom');
  const [indPriority, setIndPriority] = useState('Normal');
  const [indRequiredDate, setIndRequiredDate] = useState('');
  const [indNarration, setIndNarration] = useState('');
  const [indGridItems, setIndGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', currentStock: 12, requiredQty: 1, unit: 'Nos', purpose: 'Loom nozzle repair' }]);

  // ----------------------------------------------------
  // 3. REQUEST INDENT APPROVAL DATA & FORM STATES
  // ----------------------------------------------------
  const [indentApprovals, setIndentApprovals] = useState([]);

  // Recommended fields for Indent Approval
  const [iapApprovalNo, setIapApprovalNo] = useState('');
  const [iapApprovalDate, setIapApprovalDate] = useState('');
  const [iapApprovalType, setIapApprovalType] = useState('Stock Issue Approval');
  const [iapIndentNo, setIapIndentNo] = useState('');
  const [iapIndentDate, setIapIndentDate] = useState('');
  const [iapDeptName, setIapDeptName] = useState('Production');
  const [iapSectionName, setIapSectionName] = useState('Weaving Division A');
  const [iapEmployeeId, setIapEmployeeId] = useState('');
  const [iapMachineName, setIapMachineName] = useState('');
  const [iapSpareName, setIapSpareName] = useState('');
  const [iapSpareCode, setIapSpareCode] = useState('SPR-001');
  const [iapSpareCategory, setIapSpareCategory] = useState('Mechanical');
  const [iapPartNo, setIapPartNo] = useState('');
  const [iapBrand, setIapBrand] = useState('');
  const [iapReqQty, setIapReqQty] = useState('');
  const [iapAvailableQty, setIapAvailableQty] = useState('');
  const [iapApprovedQty, setIapApprovedQty] = useState('');
  const [iapRejectedQty, setIapRejectedQty] = useState('');
  const [iapUom, setIapUom] = useState('Nos');
  const [iapCurrentStock, setIapCurrentStock] = useState('');
  const [iapMinStockStatus, setIapMinStockStatus] = useState('Normal');
  const [iapReorderStatus, setIapReorderStatus] = useState('Normal');
  const [iapCriticalSpareStatus, setIapCriticalSpareStatus] = useState('No');
  const [iapApprovalStatus, setIapApprovalStatus] = useState('Approved');
  const [iapPurchaseRequired, setIapPurchaseRequired] = useState('No');
  const [iapPreferredVendor, setIapPreferredVendor] = useState('Standard Gears Ltd');
  const [iapExpectedPurchaseDate, setIapExpectedPurchaseDate] = useState('');
  const [iapMaintenanceType, setIapMaintenanceType] = useState('Preventive');
  const [iapBreakdownPriority, setIapBreakdownPriority] = useState('Medium');
  const [iapWorkOrderRef, setIapWorkOrderRef] = useState('');
  const [iapVerifiedBy, setIapVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [iapApprovedBy, setIapApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [iapApprovalLevel, setIapApprovalLevel] = useState('Level 1');
  const [iapStoreIssueStatus, setIapStoreIssueStatus] = useState('Pending');
  const [iapExpectedIssueDate, setIapExpectedIssueDate] = useState('');
  const [iapStatus, setIapStatus] = useState('Pending');
  const [iapIndentCopyUpload, setIapIndentCopyUpload] = useState('');
  const [iapTechApprovalUpload, setIapTechApprovalUpload] = useState('');
  const [iapVendorQuotationUpload, setIapVendorQuotationUpload] = useState('');
  const [iapApprovalNotes, setIapApprovalNotes] = useState('');
  const [iapStoreRemarks, setIapStoreRemarks] = useState('');
  const [iapInternalNotes, setIapInternalNotes] = useState('');

  // Dummy fallback states for old grid support
  const [iapIndentRef, setIapIndentRef] = useState('IND-00001');
  const [iapSection, setIapSection] = useState('Weaving Division A');
  const [iapRequestedBy, setIapRequestedBy] = useState('Murugan Swamy');
  const [iapPriority, setIapPriority] = useState('High');
  const [iapRemarks, setIapRemarks] = useState('');
  const [iapForward, setIapForward] = useState('Yes');
  const [iapGridItems, setIapGridItems] = useState([{ name: 'Airjet Loom Solenoid Valve', reqQty: 2, currentStock: 12, approvedQty: 2, remarks: 'Cleared', action: 'Approve' }]);

  // ----------------------------------------------------
  // 4. PURCHASE ORDER ENTRY DATA & FORM STATES (High Fidelity)
  // ----------------------------------------------------
  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState('');
  const [poType, setPoType] = useState('Spare Purchase');

  // Vendor Details
  const [poVendorName, setPoVendorName] = useState('Standard Gears Ltd');
  const [poVendorCode, setPoVendorCode] = useState('VND-001');
  const [poGstNo, setPoGstNo] = useState('33AAAES9890P1ZX');
  const [poContactPerson, setPoContactPerson] = useState('Mr. Subramaniam');
  const [poMobileNo, setPoMobileNo] = useState('9443210987');

  // Department Details
  const [poDeptName, setPoDeptName] = useState('Production');
  const [poSectionName, setPoSectionName] = useState('Weaving Division A');
  const [poRequestedBy, setPoRequestedBy] = useState('Murugan Swamy');

  // Spare Details
  const [poSpareName, setPoSpareName] = useState('');
  const [poSpareCode, setPoSpareCode] = useState('SPR-001');
  const [poSpareCategory, setPoSpareCategory] = useState('Mechanical');
  const [poPartNo, setPoPartNo] = useState('');
  const [poBrand, setPoBrand] = useState('');
  const [poModelNo, setPoModelNo] = useState('');

  // Machine Details
  const [poMachineName, setPoMachineName] = useState('');
  const [poMachineCode, setPoMachineCode] = useState('');
  const [poMachineSection, setPoMachineSection] = useState('Weaving Division A');

  // Quantity Details
  const [poOrderedQty, setPoOrderedQty] = useState('');
  const [poApprovedQty, setPoApprovedQty] = useState('');
  const [poPendingQty, setPoPendingQty] = useState('');
  const [poUom, setPoUom] = useState('Nos');

  // Commercial Details
  const [poUnitRate, setPoUnitRate] = useState('');
  const [poDiscount, setPoDiscount] = useState('');
  const [poTaxableAmount, setPoTaxableAmount] = useState('');
  const [poGstPercent, setPoGstPercent] = useState('18');
  const [poCgst, setPoCgst] = useState('');
  const [poSgst, setPoSgst] = useState('');
  const [poIgst, setPoIgst] = useState('');
  const [poFreightCharges, setPoFreightCharges] = useState('');
  const [poNetAmount, setPoNetAmount] = useState('');

  // Delivery Details
  const [poDeliveryDate, setPoDeliveryDate] = useState('');
  const [poDeliveryLocation, setPoDeliveryLocation] = useState('Main Store Room');
  const [poTransportDetails, setPoTransportDetails] = useState('');

  // Purchase Details
  const [poIndentNo, setPoIndentNo] = useState('');
  const [poQuotationNo, setPoQuotationNo] = useState('');
  const [poPurchaseTerms, setPoPurchaseTerms] = useState('30 Days');
  const [poWarrantyDetails, setPoWarrantyDetails] = useState('');

  // Approval Details
  const [poPreparedBy, setPoPreparedBy] = useState('Mani Bharathi (Store Head)');
  const [poVerifiedBy, setPoVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [poApprovedBy, setPoApprovedBy] = useState('Dinesh Balasamy (MD)');

  // Status Tracking & Uploads
  const [poStatus, setPoStatus] = useState('Draft');
  const [poVendorQuotationUpload, setPoVendorQuotationUpload] = useState('');
  const [poTechSpecUpload, setPoTechSpecUpload] = useState('');
  const [poPurchaseRequestUpload, setPoPurchaseRequestUpload] = useState('');
  
  // Remarks
  const [poPurchaseNotes, setPoPurchaseNotes] = useState('');
  const [poVendorNotes, setPoVendorNotes] = useState('');
  const [poInternalNotes, setPoInternalNotes] = useState('');

  // ----------------------------------------------------
  // 5. PURCHASE ORDER APPROVAL DATA & FORM STATES (High Fidelity)
  // ----------------------------------------------------
  // Approval Information
  const [poaApprovalNo, setPoaApprovalNo] = useState('');
  const [poaApprovalDate, setPoaApprovalDate] = useState('');
  const [poaApprovalType, setPoaApprovalType] = useState('Standard Approval');

  // Purchase Order Details
  const [poaPoNo, setPoaPoNo] = useState('');
  const [poaPoDate, setPoaPoDate] = useState('');
  const [poaIndentNo, setPoaIndentNo] = useState('');
  const [poaDeptName, setPoaDeptName] = useState('Production');

  // Vendor Details
  const [poaVendorName, setPoaVendorName] = useState('');
  const [poaVendorCode, setPoaVendorCode] = useState('');
  const [poaGstNo, setPoaGstNo] = useState('');

  // Spare Details
  const [poaSpareName, setPoaSpareName] = useState('');
  const [poaSpareCode, setPoaSpareCode] = useState('SPR-001');
  const [poaSpareCategory, setPoaSpareCategory] = useState('Mechanical');
  const [poaPartNo, setPoaPartNo] = useState('');
  const [poaBrand, setPoaBrand] = useState('');

  // Quantity Details
  const [poaOrderedQty, setPoaOrderedQty] = useState('');
  const [poaApprovedQty, setPoaApprovedQty] = useState('');
  const [poaPendingQty, setPoaPendingQty] = useState('');
  const [poaUom, setPoaUom] = useState('Nos');

  // Commercial Verification
  const [poaUnitRate, setPoaUnitRate] = useState('');
  const [poaTotalAmount, setPoaTotalAmount] = useState('');
  const [poaTaxVerification, setPoaTaxVerification] = useState('Verified');
  const [poaBudgetStatus, setPoaBudgetStatus] = useState('Within Budget');

  // Stock Verification
  const [poaCurrentStock, setPoaCurrentStock] = useState('');
  const [poaMinStockLevel, setPoaMinStockLevel] = useState('');
  const [poaReorderStatus, setPoaReorderStatus] = useState('Normal');
  const [poaCriticalSpareStatus, setPoaCriticalSpareStatus] = useState('No');

  // Delivery Verification
  const [poaExpectedDeliveryDate, setPoaExpectedDeliveryDate] = useState('');
  const [poaDeliveryTerms, setPoaDeliveryTerms] = useState('30 Days');

  // Approval Decision & Authority
  const [poaApprovalStatus, setPoaApprovalStatus] = useState('Approved');
  const [poaVerifiedBy, setPoaVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [poaApprovedBy, setPoaApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [poaApprovalLevel, setPoaApprovalLevel] = useState('Level 1');
  const [poaStatus, setPoaStatus] = useState('Pending');

  // Attachments
  const [poaCopyUpload, setPoaCopyUpload] = useState('');
  const [poaQuotationUpload, setPoaQuotationUpload] = useState('');
  const [poaTechApprovalUpload, setPoaTechApprovalUpload] = useState('');

  // Remarks
  const [poaApprovalNotes, setPoaApprovalNotes] = useState('');
  const [poaAccountsRemarks, setPoaAccountsRemarks] = useState('');
  const [poaInternalNotes, setPoaInternalNotes] = useState('');

  // ----------------------------------------------------
  // 6. WORK ORDER ENTRY DATA & FORM STATES (High Fidelity)
  // ----------------------------------------------------
  // Work Order Information
  const [woWorkOrderNo, setWoWorkOrderNo] = useState('');
  const [woWorkOrderDate, setWoWorkOrderDate] = useState('');
  const [woWorkOrderType, setWoWorkOrderType] = useState('Preventive Maintenance');

  // Machine Details
  const [woMachineName, setWoMachineName] = useState('');
  const [woMachineCode, setWoMachineCode] = useState('');
  const [woMachineSection, setWoMachineSection] = useState('Weaving Division A');
  const [woMachineLocation, setWoMachineLocation] = useState('Loom Room Floor 1');

  // Complaint Details
  const [woComplaintNo, setWoComplaintNo] = useState('');
  const [woComplaintDescription, setWoComplaintDescription] = useState('');
  const [woBreakdownReason, setWoBreakdownReason] = useState('');
  const [woPriorityLevel, setWoPriorityLevel] = useState('Medium');

  // Maintenance Details
  const [woMaintenanceCategory, setWoMaintenanceCategory] = useState('Mechanical Work');
  const [woWorkDescription, setWoWorkDescription] = useState('');
  const [woPlannedStartDate, setWoPlannedStartDate] = useState('');
  const [woPlannedEndDate, setWoPlannedEndDate] = useState('');

  // Spare Requirement Details
  const [woSpareName, setWoSpareName] = useState('');
  const [woSpareCode, setWoSpareCode] = useState('SPR-001');
  const [woRequiredQty, setWoRequiredQty] = useState('');
  const [woUom, setWoUom] = useState('Nos');

  // Technician Details
  const [woAssignedTechnician, setWoAssignedTechnician] = useState('Murugan Swamy');
  const [woMaintenanceTeam, setWoMaintenanceTeam] = useState('Team Alpha');
  const [woSupervisorName, setWoSupervisorName] = useState('Senthil Kumar');

  // Cost Details
  const [woEstimatedCost, setWoEstimatedCost] = useState('');
  const [woSpareCost, setWoSpareCost] = useState('');
  const [woServiceCost, setWoServiceCost] = useState('');

  // Completion Details
  const [woCompletionStatus, setWoCompletionStatus] = useState('Open');
  const [woActualCompletionDate, setWoActualCompletionDate] = useState('');
  const [woDowntimeHours, setWoDowntimeHours] = useState('');

  // Approval Details & Status
  const [woRequestedBy, setWoRequestedBy] = useState('Murugan Swamy');
  const [woVerifiedBy, setWoVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [woApprovedBy, setWoApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [woStatus, setWoStatus] = useState('Open');

  // Attachments
  const [woMachineImageUpload, setWoMachineImageUpload] = useState('');
  const [woBreakdownReportUpload, setWoBreakdownReportUpload] = useState('');
  const [woServiceReportUpload, setWoServiceReportUpload] = useState('');

  // Remarks
  const [woMaintenanceNotes, setWoMaintenanceNotes] = useState('');
  const [woTechnicianNotes, setWoTechnicianNotes] = useState('');
  const [woInternalNotes, setWoInternalNotes] = useState('');

  // ----------------------------------------------------
  // 7. PURCHASE ENTRY DATA & FORM STATES (High Fidelity)
  // ----------------------------------------------------
  // Purchase Entry Information
  const [pePurchaseEntryNo, setPePurchaseEntryNo] = useState('');
  const [peEntryDate, setPeEntryDate] = useState('');
  const [peEntryType, setPeEntryType] = useState('Spare Purchase');

  // Reference Details
  const [pePoNo, setPePoNo] = useState('');
  const [peInvoiceNo, setPeInvoiceNo] = useState('');
  const [peChallanNo, setPeChallanNo] = useState('');
  const [peVendorName, setPeVendorName] = useState('');

  // Spare Details
  const [peSpareName, setPeSpareName] = useState('');
  const [peSpareCode, setPeSpareCode] = useState('SPR-001');
  const [peSpareCategory, setPeSpareCategory] = useState('Mechanical');
  const [pePartNo, setPePartNo] = useState('');
  const [peBrand, setPeBrand] = useState('');

  // Machine Details
  const [peMachineName, setPeMachineName] = useState('');
  const [peMachineSection, setPeMachineSection] = useState('Weaving Division A');

  // Quantity Details
  const [peOrderedQty, setPeOrderedQty] = useState('');
  const [peReceivedQty, setPeReceivedQty] = useState('');
  const [peRejectedQty, setPeRejectedQty] = useState('');
  const [peAcceptedQty, setPeAcceptedQty] = useState('');
  const [peUom, setPeUom] = useState('Nos');

  // Commercial Details
  const [pePurchaseRate, setPePurchaseRate] = useState('');
  const [peTaxableAmount, setPeTaxableAmount] = useState('');
  const [peGstPercent, setPeGstPercent] = useState('18');
  const [peTotalAmount, setPeTotalAmount] = useState('');

  // Stock Details
  const [peWarehouseLocation, setPeWarehouseLocation] = useState('Main Store Room');
  const [peRackNo, setPeRackNo] = useState('Rack A-2');
  const [peBinNo, setPeBinNo] = useState('Bin 4');
  const [peBatchNo, setPeBatchNo] = useState('');
  const [peSerialNo, setPeSerialNo] = useState('');

  // Quality Details
  const [peInspectionStatus, setPeInspectionStatus] = useState('Pending');
  const [peQcStatus, setPeQcStatus] = useState('Approved');
  const [peSpareCondition, setPeSpareCondition] = useState('Good');

  // Vendor Details
  const [peVendorInvoiceDate, setPeVendorInvoiceDate] = useState('');
  const [peWarrantyStatus, setPeWarrantyStatus] = useState('1 Year Standard');
  const [peDeliveryStatus, setPeDeliveryStatus] = useState('Completed');

  // Approval Details & Status
  const [peReceivedBy, setPeReceivedBy] = useState('Mani Bharathi (Store Head)');
  const [peQcVerifiedBy, setPeQcVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [peStoreApprovedBy, setPeStoreApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [peStatus, setPeStatus] = useState('Pending QC');

  // Attachments
  const [peInvoiceUpload, setPeInvoiceUpload] = useState('');
  const [peQcReportUpload, setPeQcReportUpload] = useState('');
  const [peSpareImageUpload, setPeSpareImageUpload] = useState('');

  const handleAddOsGridRow = () => {
    setOsGridItems([...osGridItems, { spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', unit: 'Nos', qty: 1, rate: 4500, value: 45000 }]);
  };
  const handleRemoveOsGridRow = (idx) => {
    if (osGridItems.length === 1) return;
    setOsGridItems(osGridItems.filter((_, i) => i !== idx));
  };
  const handleOsGridChange = (idx, field, value) => {
    setOsGridItems(osGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'spareCode') {
          const match = SPARES.find(s => s.code === value);
          if (match) {
            updated.spareName = match.name;
            updated.unit = match.unit;
            updated.rate = match.rate;
          }
        }
        if (field === 'qty' || field === 'rate') {
          updated.value = (Number(updated.qty) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };
  const osTotalStockValue = useMemo(() => osGridItems.reduce((acc, curr) => acc + curr.value, 0), [osGridItems]);

  // ----------------------------------------------------
  // 2. SPARES REQUEST INDENT HELPERS
  // ----------------------------------------------------

  const handleAddIndGridRow = () => {
    setIndGridItems([...indGridItems, { spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', currentStock: 12, requiredQty: 1, unit: 'Nos', purpose: 'Loom nozzle repair' }]);
  };
  const handleRemoveIndGridRow = (idx) => {
    if (indGridItems.length === 1) return;
    setIndGridItems(indGridItems.filter((_, i) => i !== idx));
  };
  const handleIndGridChange = (idx, field, value) => {
    setIndGridItems(indGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        return updated;
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 3. REQUEST INDENT APPROVAL HELPERS
  // ----------------------------------------------------

  const handleIapGridChange = (idx, field, value) => {
    setIapGridItems(iapGridItems.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 4. PURCHASE ORDER ENTRY HELPERS & MEMOS
  // ----------------------------------------------------
  // Form Fields for PO (shadow/fallback states)
  const [poIndentRef, setPoIndentRef] = useState('IAP-00001');
  const [poSupplierName, setPoSupplierName] = useState('Standard Gears Ltd');
  const [poAddress, setPoAddress] = useState('Plot 10, Industrial Estate, Salem');
  const [poContact, setPoContact] = useState('Mr. Subramaniam');
  const [poMobile, setPoMobile] = useState('9443210987');
  const [poGstin, setPoGstin] = useState('33AAAES9890P1ZX');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poPaymentTerms, setPoPaymentTerms] = useState('30 Days');
  const [poNarration, setPoNarration] = useState('');
  const [poGridItems, setPoGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', qty: 2, unit: 'Nos', rate: 4500, gstPercent: 18, gstAmount: 1620, totalAmount: 10620 }]);

  const handleAddPoGridRow = () => {
    setPoGridItems([...poGridItems, { spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', qty: 1, unit: 'Nos', rate: 4500, gstPercent: 18, gstAmount: 810, totalAmount: 5310 }]);
  };
  const handleRemovePoGridRow = (idx) => {
    if (poGridItems.length === 1) return;
    setPoGridItems(poGridItems.filter((_, i) => i !== idx));
  };
  const handlePoGridChange = (idx, field, value) => {
    setPoGridItems(poGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'spareCode') {
          const match = SPARES.find(s => s.code === value);
          if (match) {
            updated.spareName = match.name;
            updated.unit = match.unit;
            updated.rate = match.rate;
          }
        }
        if (field === 'qty' || field === 'rate' || field === 'gstPercent') {
          const base = (Number(updated.qty) || 0) * (Number(updated.rate) || 0);
          updated.gstAmount = base * (Number(updated.gstPercent) || 0) / 100;
          updated.totalAmount = base + updated.gstAmount;
        }
        return updated;
      }
      return item;
    }));
  };
  const poTotalValue = useMemo(() => poGridItems.reduce((acc, curr) => acc + curr.totalAmount, 0), [poGridItems]);

  // ----------------------------------------------------
  // 5. PURCHASE ORDER APPROVAL HELPERS & MEMOS
  // ----------------------------------------------------
  const [poaPoRef, setPoaPoRef] = useState('SPO-00001');
  const [poaSupplierName, setPoaSupplierName] = useState('Standard Gears Ltd');
  const [poaTotalValue, setPoaTotalValue] = useState(10620);
  const [poaRemarks, setPoaRemarks] = useState('');
  const [poaSend, setPoaSend] = useState('Yes');
  const [poaGridItems, setPoaGridItems] = useState([{ name: 'Airjet Loom Solenoid Valve', qty: 2, rate: 4500, approvedRate: 4500, amount: 9000 }]);

  const handlePoaGridChange = (idx, field, value) => {
    setPoaGridItems(poaGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'approvedRate') {
          updated.amount = (Number(updated.qty) || 0) * (Number(updated.approvedRate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 6. PURCHASE ENTRY HELPERS & MEMOS
  // ----------------------------------------------------
  const [pePoRef, setPePoRef] = useState('SPO-00001');
  const [peSupplierName, setPeSupplierName] = useState('Standard Gears Ltd');
  const [peInvoiceDate, setPeInvoiceDate] = useState('');
  const [peGateInward, setPeGateInward] = useState('GIN-00001');
  const [peStoreLocation, setPeStoreLocation] = useState('Rack A-2');
  const [peRemarks, setPeRemarks] = useState('');
  const [peGridItems, setPeGridItems] = useState([{ name: 'Airjet Loom Solenoid Valve', poQty: 2, receivedQty: 2, pendingQty: 0, rate: 4500, amount: 9000, condition: 'Good' }]);

  const handlePeGridChange = (idx, field, value) => {
    setPeGridItems(peGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'receivedQty') {
          updated.pendingQty = Math.max(0, updated.poQty - Number(updated.receivedQty));
          updated.amount = (Number(updated.receivedQty) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };
  useEffect(() => {
    const total = peGridItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    setPeTotalAmount(total);
  }, [peGridItems]);

  const peGstAmount = useMemo(() => (Number(peTotalAmount) || 0) * 0.18, [peTotalAmount]);
  const peNetAmount = useMemo(() => (Number(peTotalAmount) || 0) + peGstAmount, [peTotalAmount, peGstAmount]);

  // ----------------------------------------------------
  // 7. WORK ORDER HELPERS & MEMOS
  // ----------------------------------------------------
  const [woType, setWoType] = useState('Breakdown Maintenance');
  const [woSection, setWoSection] = useState('Weaving Division A');
  const [woMachineNo, setWoMachineNo] = useState('');
  const [woMachineType, setWoMachineType] = useState('Airjet Loom');
  const [woProblem, setWoProblem] = useState('');
  const [woPriority, setWoPriority] = useState('Normal');
  const [woAssignedTo, setWoAssignedTo] = useState('Murugan Swamy');
  const [woExpectedDate, setWoExpectedDate] = useState('');
  const [woGridItems, setWoGridItems] = useState([{ name: 'Airjet Loom Solenoid Valve', qty: 1 }]);

  const handleAddWoGridRow = () => {
    setWoGridItems([...woGridItems, { name: 'Airjet Loom Solenoid Valve', qty: 1 }]);
  };
  const handleRemoveWoGridRow = (idx) => {
    if (woGridItems.length === 1) return;
    setWoGridItems(woGridItems.filter((_, i) => i !== idx));
  };
  const handleWoGridChange = (idx, field, value) => {
    setWoGridItems(woGridItems.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 8. CONSUMPTION DATA & FORM STATES (High Fidelity)
  // ----------------------------------------------------
  const [consumptions, setConsumptions] = useState([]);

  // Form Fields
  const [conDate, setConDate] = useState('');
  const [conType, setConType] = useState('Preventive Maintenance');

  // Machine Details
  const [conMachineName, setConMachineName] = useState('');
  const [conMachineCode, setConMachineCode] = useState('');
  const [conMachineSection, setConMachineSection] = useState('Weaving Division A');
  const [conMachineLocation, setConMachineLocation] = useState('');

  // Work Order Details
  const [conWoRef, setConWoRef] = useState('WO-00001');
  const [conComplaintNo, setConComplaintNo] = useState('');
  const [conMaintenanceType, setConMaintenanceType] = useState('Breakdown Maintenance');

  // Spare Details
  const [conSpareName, setConSpareName] = useState('');
  const [conSpareCode, setConSpareCode] = useState('SPR-001');
  const [conSpareCategory, setConSpareCategory] = useState('Mechanical');
  const [conPartNo, setConPartNo] = useState('');
  const [conBrand, setConBrand] = useState('');

  // Quantity Details
  const [conIssuedQty, setConIssuedQty] = useState('');
  const [conConsumedQty, setConConsumedQty] = useState('');
  const [conBalanceQty, setConBalanceQty] = useState('');
  const [conUom, setConUom] = useState('Nos');

  // Stock Details
  const [conWarehouseLocation, setConWarehouseLocation] = useState('Main Store Room');
  const [conRackNo, setConRackNo] = useState('Rack A-2');
  const [conBinNo, setConBinNo] = useState('Bin 4');
  const [conBatchNo, setConBatchNo] = useState('');
  const [conSerialNo, setConSerialNo] = useState('');

  // Maintenance Details
  const [conBreakdownReason, setConBreakdownReason] = useState('');
  const [conRepairDescription, setConRepairDescription] = useState('');
  const [conDowntimeHours, setConDowntimeHours] = useState('');

  // Technician Details
  const [conTechnicianName, setConTechnicianName] = useState('Murugan Swamy');
  const [conMaintenanceTeam, setConMaintenanceTeam] = useState('Mechanical Team');
  const [conSupervisorName, setConSupervisorName] = useState('Senthil Kumar (General Manager)');

  // Cost Details
  const [conUnitRate, setConUnitRate] = useState('');
  const [conTotalValue, setConTotalValue] = useState('');

  // Approval Details
  const [conIssuedBy, setConIssuedBy] = useState('Mani Bharathi (Store Head)');
  const [conConsumedBy, setConConsumedBy] = useState('Murugan Swamy');
  const [conVerifiedBy, setConVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [conApprovedBy, setConApprovedBy] = useState('Dinesh Balasamy (MD)');

  // Status Tracking
  const [conStatus, setConStatus] = useState('Completed');

  // Attachments
  const [conMaintenanceReportUpload, setConMaintenanceReportUpload] = useState('');
  const [conSpareImageUpload, setConSpareImageUpload] = useState('');
  const [conBreakdownImageUpload, setConBreakdownImageUpload] = useState('');

  // Remarks
  const [conMaintenanceNotes, setConMaintenanceNotes] = useState('');
  const [conConsumptionNotes, setConConsumptionNotes] = useState('');
  const [conInternalNotes, setConInternalNotes] = useState('');

  const [conGridItems, setConGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', availableStock: 12, consumedQty: 1, unit: 'Nos', rate: 4500, amount: 4500 }]);

  const handleConGridChange = (idx, field, value) => {
    setConGridItems(conGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'spareCode') {
          const match = spares.find(s => s.id === value);
          if (match) {
            updated.spareName = match.name;
            updated.availableStock = match.currentStock || match.stock || 10;
            updated.unit = match.uom || 'Nos';
            updated.rate = match.purchaseRate || match.standardRate || 0;
          }
        }
        if (field === 'consumedQty' || field === 'rate') {
          updated.amount = (Number(updated.consumedQty) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };
  const conTotalValueMemo = useMemo(() => conGridItems.reduce((acc, curr) => acc + curr.amount, 0), [conGridItems]);

  // ----------------------------------------------------
  // 9. JOBWORK / HANDLOAN ISSUE DATA & FORM STATES (High Fidelity)
  // ----------------------------------------------------
  const [issues, setIssues] = useState([]);

  // Issue Information
  const [jwDate, setJwDate] = useState('');
  const [jwType, setJwType] = useState('Job Work Issue');

  // Party Details
  const [jwPartyName, setJwPartyName] = useState('Standard Gears Ltd');
  const [jwContact, setJwContact] = useState('Subramaniam');
  const [jwMobile, setJwMobile] = useState('9443210987');
  const [jwDeptName, setJwDeptName] = useState('Maintenance');

  // Reference Details
  const [jwWoRef, setJwWoRef] = useState('');
  const [jwIndentRef, setJwIndentRef] = useState('');
  const [jwApprovalNo, setJwApprovalNo] = useState('');

  // Spare Details
  const [jwSpareName, setJwSpareName] = useState('');
  const [jwSpareCode, setJwSpareCode] = useState('SPR-001');
  const [jwSpareCategory, setJwSpareCategory] = useState('Mechanical');
  const [jwPartNo, setJwPartNo] = useState('');
  const [jwBrand, setJwBrand] = useState('');

  // Machine Details
  const [jwMachineName, setJwMachineName] = useState('');
  const [jwMachineSection, setJwMachineSection] = useState('Weaving Division A');

  // Quantity Details
  const [jwIssuedQty, setJwIssuedQty] = useState('');
  const [jwBalanceQty, setJwBalanceQty] = useState('');
  const [jwUom, setJwUom] = useState('Nos');

  // Stock Details
  const [jwWarehouseLocation, setJwWarehouseLocation] = useState('Main Store Room');
  const [jwRackNo, setJwRackNo] = useState('Rack A-2');
  const [jwBinNo, setJwBinNo] = useState('Bin 4');
  const [jwSerialNo, setJwSerialNo] = useState('');

  // Loan / Job Work Details
  const [jwReturnableStatus, setJwReturnableStatus] = useState('Yes');
  const [jwExpectedReturn, setJwExpectedReturn] = useState('');
  const [jwPurpose, setJwPurpose] = useState('');
  const [jwJobWorkDescription, setJwJobWorkDescription] = useState('');

  // Commercial Details
  const [jwSecurityDeposit, setJwSecurityDeposit] = useState('');
  const [jwIssueValue, setJwIssueValue] = useState('');
  const [jwPenaltyTerms, setJwPenaltyTerms] = useState('');

  // Approval Details
  const [jwIssuedBy, setJwIssuedBy] = useState('Mani Bharathi (Store Head)');
  const [jwVerifiedBy, setJwVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [jwApprovedBy, setJwApprovedBy] = useState('Dinesh Balasamy (MD)');

  // Status Tracking
  const [jwStatus, setJwStatus] = useState('Issued');

  // Attachments
  const [jwIssueSlipUpload, setJwIssueSlipUpload] = useState('');
  const [jwApprovalCopyUpload, setJwApprovalCopyUpload] = useState('');
  const [jwSpareImageUpload, setJwSpareImageUpload] = useState('');

  // Remarks
  const [jwJobWorkNotes, setJwJobWorkNotes] = useState('');
  const [jwLoanNotes, setJwLoanNotes] = useState('');
  const [jwInternalNotes, setJwInternalNotes] = useState('');

  const [jwGridItems, setJwGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', qty: 2, unit: 'Nos', rate: 4500, amount: 9000 }]);

  const handleJwGridChange = (idx, field, value) => {
    setJwGridItems(jwGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'spareCode') {
          const match = spares.find(s => s.id === value);
          if (match) {
            updated.spareName = match.name;
            updated.unit = match.uom || 'Nos';
            updated.rate = match.purchaseRate || match.standardRate || 0;
          }
        }
        if (field === 'qty' || field === 'rate') {
          updated.amount = (Number(updated.qty) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 10. JOBWORK / HANDLOAN RECEIVED DATA & FORM STATES (High Fidelity)
  // ----------------------------------------------------
  const [receipts, setReceipts] = useState([]);

  // Receipt Information
  const [jwrReceiptDate, setJwrReceiptDate] = useState('');
  const [jwrReceiptType, setJwrReceiptType] = useState('Job Work Return');

  // Reference Details
  const [jwrIssueRef, setJwrIssueRef] = useState('JWI-00001');
  const [jwrWoRef, setJwrWoRef] = useState('');
  const [jwrPartyName, setJwrPartyName] = useState('Standard Gears Ltd');

  // Spare Details
  const [jwrSpareName, setjwrSpareName] = useState('');
  const [jwrSpareCode, setjwrSpareCode] = useState('SPR-001');
  const [jwrSpareCategory, setjwrSpareCategory] = useState('Mechanical');
  const [jwrPartNo, setjwrPartNo] = useState('');
  const [jwrBrand, setjwrBrand] = useState('');

  // Machine Details
  const [jwrMachineName, setjwrMachineName] = useState('');
  const [jwrMachineSection, setjwrMachineSection] = useState('Weaving Division A');

  // Quantity Details
  const [jwrIssuedQty, setjwrIssuedQty] = useState('');
  const [jwrReturnedQty, setjwrReturnedQty] = useState('');
  const [jwrDamagedQty, setjwrDamagedQty] = useState('');
  const [jwrMissingQty, setjwrMissingQty] = useState('');
  const [jwrBalanceQty, setjwrBalanceQty] = useState('');
  const [jwrUom, setjwrUom] = useState('Nos');

  // Return Details
  const [jwrReturnCondition, setjwrReturnCondition] = useState('Perfect');
  const [jwrDamageStatus, setjwrDamageStatus] = useState('No Damage');
  const [jwrRepairRequiredStatus, setjwrRepairRequiredStatus] = useState('No');

  // Stock Details
  const [jwrWarehouseLocation, setjwrWarehouseLocation] = useState('Main Store Room');
  const [jwrRackNo, setjwrRackNo] = useState('Rack A-2');
  const [jwrBinNo, setjwrBinNo] = useState('Bin 4');
  const [jwrSerialNo, setjwrSerialNo] = useState('');

  // Inspection Details
  const [jwrInspectionStatus, setjwrInspectionStatus] = useState('Pending');
  const [jwrQcVerification, setjwrQcVerification] = useState('Yes');
  const [jwrFunctionalStatus, setjwrFunctionalStatus] = useState('Functional');

  // Commercial Details
  const [jwrPenaltyAmount, setjwrPenaltyAmount] = useState('');
  const [jwrDamageCharges, setjwrDamageCharges] = useState('');
  const [jwrFinalSettlementAmount, setjwrFinalSettlementAmount] = useState('');

  // Approval Details
  const [jwrReceivedBy, setjwrReceivedBy] = useState('Murugan Swamy');
  const [jwrVerifiedBy, setjwrVerifiedBy] = useState('Senthil Kumar (General Manager)');
  const [jwrApprovedBy, setjwrApprovedBy] = useState('Dinesh Balasamy (MD)');

  // Status Tracking
  const [jwrStatus, setjwrStatus] = useState('Completed');

  // Attachments
  const [jwrReturnSlipUpload, setjwrReturnSlipUpload] = useState('');
  const [jwrInspectionReportUpload, setjwrInspectionReportUpload] = useState('');
  const [jwrSpareImageUpload, setjwrSpareImageUpload] = useState('');

  // Remarks
  const [jwrRemarks, setjwrRemarks] = useState('');

  const [jwrGridItems, setJwrGridItems] = useState([{ name: 'Airjet Loom Solenoid Valve', issuedQty: 2, prevReceived: 0, receivedQty: 2, pendingQty: 0, condition: 'Good', remarks: 'Repaired successfully' }]);

  // loadData function and reactive hooks
  const loadData = async () => {
    try {
      const response = await workOrderTransactionAPI.getAll();
      const allTxns = response.data;
      const mapTxn = (t) => ({ ...t.details, id: t.transaction_no, db_id: t.id, status: t.status });

      const fetchedSections = allTxns.filter(t => t.module_type === 'spares_section').map(mapTxn);
      if (fetchedSections.length > 0) setSections(fetchedSections);
      
      const fetchedSpares = allTxns.filter(t => t.module_type === 'spares_creation').map(mapTxn);
      if (fetchedSpares.length > 0) setSpares(fetchedSpares);

      const fetchedOS = allTxns.filter(t => t.module_type === 'spares_opening').map(mapTxn);
      if (fetchedOS.length > 0) setOpeningStocks(fetchedOS);

      const fetchedIndents = allTxns.filter(t => t.module_type === 'spares_request_indent').map(mapTxn);
      if (fetchedIndents.length > 0) setIndents(fetchedIndents);

      const fetchedIAPs = allTxns.filter(t => t.module_type === 'spares_indent_approval').map(mapTxn);
      if (fetchedIAPs.length > 0) setIndentApprovals(fetchedIAPs);

      const fetchedPOs = allTxns.filter(t => t.module_type === 'spares_purchase_order').map(mapTxn);
      if (fetchedPOs.length > 0) setPurchaseOrders(fetchedPOs);

      const fetchedPOAs = allTxns.filter(t => t.module_type === 'spares_po_approval').map(mapTxn);
      if (fetchedPOAs.length > 0) setPoApprovals(fetchedPOAs);

      const fetchedWOs = allTxns.filter(t => t.module_type === 'spares_work_order').map(mapTxn);
      if (fetchedWOs.length > 0) setWorkOrders(fetchedWOs);

      const fetchedPEs = allTxns.filter(t => t.module_type === 'spares_purchase_entry').map(mapTxn);
      if (fetchedPEs.length > 0) setPurchaseEntries(fetchedPEs);

      const fetchedCons = allTxns.filter(t => t.module_type === 'spares_consumption').map(mapTxn);
      if (fetchedCons.length > 0) setConsumptions(fetchedCons);

      const fetchedJWIs = allTxns.filter(t => t.module_type === 'spares_jobwork_issue').map(mapTxn);
      if (fetchedJWIs.length > 0) setIssues(fetchedJWIs);

      const fetchedJWRs = allTxns.filter(t => t.module_type === 'spares_jobwork_recv').map(mapTxn);
      if (fetchedJWRs.length > 0) setReceipts(fetchedJWRs);
    } catch (err) {
      console.error("Failed to load spares setup data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reactive calculations
  useEffect(() => {
    const qty = parseFloat(osOpeningQuantity) || 0;
    const rate = parseFloat(osUnitRate) || 0;
    setOsValTotal(qty * rate);
  }, [osOpeningQuantity, osUnitRate]);

  useEffect(() => {
    const stock = parseFloat(sprCurrentStock) || 0;
    const rate = parseFloat(sprPurchaseRate) || 0;
    setSprEstimatedValue(stock * rate);
  }, [sprCurrentStock, sprPurchaseRate]);

  useEffect(() => {
    const match = spares.find(s => s.id === osSpareCode);
    if (match) {
      setOsSpareName(match.name);
      setOsSpareCategory(match.category);
      setOsMachineName(match.machineName || match.machineType || '');
      setOsUom(match.uom);
      setOsUnitRate(match.purchaseRate || match.standardRate || '');
      setOsReorderLevel(match.reorder || '');
      setOsMinimumStockLevel(match.minStock || '');
      setOsCriticalSpareStatus(match.criticalSpareStatus || match.criticalStatus || 'No');
    }
  }, [osSpareCode, spares]);

  useEffect(() => {
    const match = spares.find(s => s.id === indSpareCode);
    if (match) {
      setIndSpareName(match.name);
      setIndSpareCategory(match.category);
      setIndPartNo(match.partNo || '');
      setIndBrand(match.brand || '');
      setIndModelNo(match.modelNo || '');
      setIndUom(match.uom || 'Nos');
      setIndCurrentStock(match.currentStock || match.stock || '');
      setIndMinStock(match.minStock || '');
      setIndReorderLevel(match.reorder || '');
      setIndPreferredVendor(match.preferredVendor || match.preferredSupplier || 'Standard Gears Ltd');
      setIndLastPurchaseRate(match.purchaseRate || match.standardRate || '');
    }
  }, [indSpareCode, spares]);

  useEffect(() => {
    const match = indents.find(i => i.id === iapIndentNo);
    if (match) {
      setIapIndentDate(match.indDate || match.date || '');
      setIapDeptName(match.indDeptName || '');
      setIapSectionName(match.indSectionName || '');
      setIapRequestedBy(match.indRequestedBy || '');
      setIapEmployeeId(match.indEmployeeId || '');
      setIapMachineName(match.indMachineName || '');
      setIapSpareName(match.indSpareName || '');
      setIapSpareCode(match.indSpareCode || '');
      setIapSpareCategory(match.indSpareCategory || '');
      setIapPartNo(match.indPartNo || '');
      setIapBrand(match.indBrand || '');
      setIapReqQty(match.indReqQty || '');
      setIapAvailableQty(match.indAvailableQty || '');
      setIapApprovedQty(match.indApprovedQty || match.indReqQty || '');
      setIapUom(match.indUom || 'Nos');
      setIapCurrentStock(match.indCurrentStock || '');
      setIapMinStockStatus(Number(match.indCurrentStock) < Number(match.indMinStock) ? 'Below Minimum' : 'Normal');
      setIapReorderStatus(Number(match.indCurrentStock) < Number(match.indReorderLevel) ? 'Reorder Level Reached' : 'Normal');
      setIapCriticalSpareStatus(match.sprCriticalSpareStatus || 'No');
    }
  }, [iapIndentNo, indents]);

  // Purchase Order Entry lookups & commercial calculations
  useEffect(() => {
    const match = spares.find(s => s.id === poSpareCode);
    if (match) {
      setPoSpareName(match.name || '');
      setPoSpareCategory(match.category || '');
      setPoPartNo(match.partNo || '');
      setPoBrand(match.brand || '');
      setPoModelNo(match.modelNo || '');
      setPoUom(match.uom || 'Nos');
      setPoUnitRate(match.purchaseRate || match.standardRate || '');
    }
  }, [poSpareCode, spares]);

  useEffect(() => {
    const match = indents.find(i => i.id === poIndentNo);
    if (match) {
      setPoRequestedBy(match.indRequestedBy || '');
      setPoDeptName(match.indDeptName || '');
      setPoSectionName(match.indSectionName || '');
      setPoMachineName(match.indMachineName || '');
      setPoMachineCode(match.indMachineCode || '');
      setPoMachineSection(match.indSectionName || '');
      setPoSpareCode(match.indSpareCode || '');
      setPoOrderedQty(match.indReqQty || '');
      setPoApprovedQty(match.indApprovedQty || match.indReqQty || '');
      setPoPendingQty(0);
    }
  }, [poIndentNo, indents]);

  useEffect(() => {
    const qty = parseFloat(poOrderedQty) || 0;
    const rate = parseFloat(poUnitRate) || 0;
    const disc = parseFloat(poDiscount) || 0;
    const freight = parseFloat(poFreightCharges) || 0;
    const gstPct = parseFloat(poGstPercent) || 0;

    const taxable = Math.max(0, qty * rate - disc);
    setPoTaxableAmount(taxable);

    const gstAmt = taxable * gstPct / 100;
    if (poGstNo && poGstNo.startsWith('33')) {
      setPoCgst(gstAmt / 2);
      setPoSgst(gstAmt / 2);
      setPoIgst(0);
    } else {
      setPoCgst(0);
      setPoSgst(0);
      setPoIgst(gstAmt);
    }
    setPoNetAmount(taxable + gstAmt + freight);
  }, [poOrderedQty, poUnitRate, poDiscount, poFreightCharges, poGstPercent, poGstNo]);

  // Purchase Order Approval lookups
  useEffect(() => {
    const match = purchaseOrders.find(po => po.id === poaPoNo);
    if (match) {
      setPoaPoDate(match.poDate || match.date || '');
      setPoaIndentNo(match.poIndentNo || '');
      setPoaDeptName(match.poDeptName || '');
      setPoaVendorName(match.poVendorName || '');
      setPoaVendorCode(match.poVendorCode || '');
      setPoaGstNo(match.poGstNo || '');
      setPoaSpareCode(match.poSpareCode || '');
      setPoaSpareName(match.poSpareName || '');
      setPoaSpareCategory(match.poSpareCategory || '');
      setPoaPartNo(match.poPartNo || '');
      setPoaBrand(match.poBrand || '');
      setPoaOrderedQty(match.poOrderedQty || '');
      setPoaApprovedQty(match.poApprovedQty || match.poOrderedQty || '');
      setPoaPendingQty(0);
      setPoaUom(match.poUom || 'Nos');
      setPoaUnitRate(match.poUnitRate || '');
      setPoaTotalAmount(match.poNetAmount || '');
    }
  }, [poaPoNo, purchaseOrders]);

  // Work Order Entry lookups & calculations
  useEffect(() => {
    const match = spares.find(s => s.id === woSpareCode);
    if (match) {
      setWoSpareName(match.name || '');
      setWoUom(match.uom || 'Nos');
    }
  }, [woSpareCode, spares]);

  useEffect(() => {
    const spare = parseFloat(woSpareCost) || 0;
    const service = parseFloat(woServiceCost) || 0;
    setWoEstimatedCost(spare + service);
  }, [woSpareCost, woServiceCost]);

  // Purchase Entry lookups & calculations
  useEffect(() => {
    const match = purchaseOrders.find(po => po.id === pePoNo);
    if (match) {
      setPeVendorName(match.poVendorName || '');
      setPeSpareCode(match.poSpareCode || '');
      setPeSpareName(match.poSpareName || '');
      setPeSpareCategory(match.poSpareCategory || '');
      setPePartNo(match.poPartNo || '');
      setPeBrand(match.poBrand || '');
      setPeOrderedQty(match.poOrderedQty || '');
      setPeUom(match.poUom || 'Nos');
      setPePurchaseRate(match.poUnitRate || '');
      setPeTaxableAmount(match.poTaxableAmount || '');
      setPeGstPercent(match.poGstPercent || '');
      setPeTotalAmount(match.poNetAmount || '');
    }
  }, [pePoNo, purchaseOrders]);

  useEffect(() => {
    const rec = parseFloat(peReceivedQty) || 0;
    const rej = parseFloat(peRejectedQty) || 0;
    setPeAcceptedQty(Math.max(0, rec - rej));
  }, [peReceivedQty, peRejectedQty]);


  // Consumption lookups and calculators
  useEffect(() => {
    const match = spares.find(s => s.id === conSpareCode);
    if (match) {
      setConSpareName(match.name || '');
      setConSpareCategory(match.category || '');
      setConPartNo(match.partNo || '');
      setConBrand(match.brand || '');
      setConUom(match.uom || 'Nos');
      setConUnitRate(match.purchaseRate || match.standardRate || '');
    }
  }, [conSpareCode, spares]);

  useEffect(() => {
    const match = workOrders.find(wo => wo.id === conWoRef);
    if (match) {
      setConMachineName(match.machineType || match.machineName || '');
      setConMachineCode(match.machineNo || match.machineCode || '');
      setConMachineSection(match.section || match.machineSection || '');
      setConMaintenanceType(match.type || match.woWorkOrderType || 'Breakdown Maintenance');
    }
  }, [conWoRef, workOrders]);

  useEffect(() => {
    const issued = parseFloat(conIssuedQty) || 0;
    const consumed = parseFloat(conConsumedQty) || 0;
    setConBalanceQty(Math.max(0, issued - consumed));
  }, [conIssuedQty, conConsumedQty]);

  useEffect(() => {
    const rate = parseFloat(conUnitRate) || 0;
    const consumed = parseFloat(conConsumedQty) || 0;
    setConTotalValue(rate * consumed);
  }, [conUnitRate, conConsumedQty]);

  // Job Work Issue lookups
  useEffect(() => {
    const match = spares.find(s => s.id === jwSpareCode);
    if (match) {
      setJwSpareName(match.name || '');
      setJwSpareCategory(match.category || '');
      setJwPartNo(match.partNo || '');
      setJwBrand(match.brand || '');
      setJwUom(match.uom || 'Nos');
    }
  }, [jwSpareCode, spares]);

  useEffect(() => {
    const issued = parseFloat(jwIssuedQty) || 0;
    const rate = parseFloat(jwIssueValue) || 0;
    setJwBalanceQty(issued);
  }, [jwIssuedQty]);

  // Job Work Received lookups
  useEffect(() => {
    const match = issues.find(i => i.id === jwrIssueRef);
    if (match) {
      setJwrPartyName(match.jwPartyName || '');
      setjwrSpareCode(match.jwSpareCode || '');
      setjwrSpareName(match.jwSpareName || '');
      setjwrSpareCategory(match.jwSpareCategory || '');
      setjwrPartNo(match.jwPartNo || '');
      setjwrBrand(match.jwBrand || '');
      setjwrMachineName(match.jwMachineName || '');
      setjwrMachineSection(match.jwMachineSection || '');
      setjwrIssuedQty(match.jwIssuedQty || '');
      setjwrUom(match.jwUom || 'Nos');
      setJwrWoRef(match.jwWoRef || '');
    }
  }, [jwrIssueRef, issues]);

  useEffect(() => {
    const issued = parseFloat(jwrIssuedQty) || 0;
    const returned = parseFloat(jwrReturnedQty) || 0;
    const damaged = parseFloat(jwrDamagedQty) || 0;
    const missing = parseFloat(jwrMissingQty) || 0;
    setjwrBalanceQty(Math.max(0, issued - returned - damaged - missing));
  }, [jwrIssuedQty, jwrReturnedQty, jwrDamagedQty, jwrMissingQty]);

  const handleJwrGridChange = (idx, field, value) => {
    setJwrGridItems(jwrGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'receivedQty') {
          updated.pendingQty = Math.max(0, updated.issuedQty - updated.prevReceived - Number(updated.receivedQty));
        }
        return updated;
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // GENERAL ACTION HANDLERS
  // ----------------------------------------------------
  const handleCreateNew = () => {
    let nextId = '';
    if (activeTab === 'Sections') {
      nextId = `SEC-00${sections.length + 1}`;
      setSecName(''); setSecType('Weaving'); setSecDept('Production'); setSecIncharge('Murugan Swamy (Maintenance In-charge)'); setSecMachines(''); setSecDesc(''); setSecStatus('Active');

      // Reset recommended fields
      setSecCode('');
      setSecDeptName('');
      setSecFloorUnitName('');
      setSecLocation('');
      setSecInchargeName('');
      setSecEmployeeId('');
      setSecContactNumber('');
      setSecMachineGroup('');
      setSecCriticalMachineStatus('Non-Critical');
      setSecSpareStorageLocation('');
      setSecRackNo('');
      setSecBinNo('');
      setSecActiveStatus('Active');
      setSecMaintenanceRequiredStatus('No');
      setSecCreatedBy('Murugan Swamy (Maintenance In-charge)');
      setSecVerifiedBy('Senthil Kumar (General Manager)');
      setSecApprovedBy('Dinesh Balasamy (MD)');
      setSecLayoutUpload('');
      setSecMachineListUpload('');
      setSecMaintenanceNotes('');
      setSecInternalNotes('');
    }
    if (activeTab === 'Spares') {
      nextId = `SPR-00${spares.length + 1}`;
      setSprName(''); setSprCategory('Mechanical Parts'); setSprSection('Weaving Division A'); setSprMachineType('Airjet Loom'); setSprBrand(''); setSprModelNo(''); setSprPartNo(''); setSprUom('Nos'); setSprReorder(''); setSprMinStock(''); setSprMaxStock(''); setSprStandardRate(''); setSprHsn(''); setSprGst(18); setSprSupplier('Standard Gears Ltd'); setSprLeadTime(''); setSprStatus('Active');

      // Reset recommended fields
      setSprCode('');
      setSprMachineName('');
      setSprMachineModel('');
      setSprMachineSection('Weaving Division A');
      setSprType('');
      setSprSize('');
      setSprMaterial('');
      setSprCurrentStock('');
      setSprPreferredVendor('Standard Gears Ltd');
      setSprVendorCode('');
      setSprPurchaseRate('');
      setSprEstimatedValue('');
      setSprWarehouseLocation('');
      setSprWarehouseRack('');
      setSprWarehouseBin('');
      setSprCriticalSpareStatus('No');
      setSprMaintenanceFrequency('');
      setSprReplacementCycle('');
      setSprCreatedBy('Murugan Swamy (Maintenance In-charge)');
      setSprVerifiedBy('Senthil Kumar (General Manager)');
      setSprApprovedBy('Dinesh Balasamy (MD)');
      setSprImageUpload('');
      setSprSpecSheetUpload('');
      setSprVendorQuotationUpload('');
      setSprTechnicalNotes('');
      setSprMaintenanceNotes('');
      setSprInternalNotes('');
    }
    if (activeTab === 'OpeningStock') {
      nextId = `OS-${String(openingStocks.length + 1).padStart(5, '0')}`;
      
      // Reset recommended fields
      setOsDate(new Date().toISOString().substring(0, 10));
      setOsEntryType('Spare Opening');
      setOsSpareName('');
      setOsSpareCode('SPR-001');
      setOsSpareCategory('Mechanical');
      setOsMachineName('');
      setOsOpeningQuantity('');
      setOsCurrentQuantity('');
      setOsUom('Nos');
      setOsBatchNo('');
      setOsSerialNo('');
      setOsWarehouseLocation('');
      setOsRackNo('');
      setOsBinNo('');
      setOsUnitRate('');
      setOsValTotal('');
      setOsVendorName('');
      setOsPurchaseReferenceNo('');
      setOsSpareCondition('New');
      setOsInspectionStatus('Passed');
      setOsMinimumStockLevel('');
      setOsReorderLevel('');
      setOsCriticalSpareStatus('No');
      setOsEnteredBy('Mani Bharathi (Store Head)');
      setOsVerifiedBy('Senthil Kumar (General Manager)');
      setOsApprovedBy('Dinesh Balasamy (MD)');
      setOsSheetUpload('');
      setOsImageUpload('');
      setOsInvoiceUpload('');
      setOsStockNotes('');
      setOsInventoryNotes('');
      setOsInternalNotes('');
    }
    if (activeTab === 'RequestIndent') {
      nextId = `IND-${String(indents.length + 1).padStart(5, '0')}`;
      setIndDate(new Date().toISOString().substring(0, 10));
      setIndRequestType('Spare Request');
      setIndEmployeeId('');
      setIndDeptName('Production');
      setIndSectionName('Weaving Division A');
      setIndMachineName('');
      setIndMachineCode('');
      setIndMachineSection('Weaving Division A');
      setIndBreakdownStatus('No');
      setIndSpareName('');
      setIndSpareCode('SPR-001');
      setIndSpareCategory('Mechanical');
      setIndPartNo('');
      setIndBrand('');
      setIndModelNo('');
      setIndReqQty('');
      setIndAvailableQty('');
      setIndApprovedQty('');
      setIndUom('Nos');
      setIndReason('');
      setIndPriorityLevel('Medium');
      setIndCurrentStock('');
      setIndMinStock('');
      setIndReorderLevel('');
      setIndPreferredVendor('Standard Gears Ltd');
      setIndLastPurchaseRate('');
      setIndMaintenanceType('Preventive');
      setIndWorkOrderNo('');
      setIndVerifiedBy('Senthil Kumar (General Manager)');
      setIndApprovedBy('Dinesh Balasamy (MD)');
      setIndStatus('Draft');
      setIndBreakdownImageUpload('');
      setIndSpareImageUpload('');
      setIndTechReqUpload('');
      setIndMaintenanceNotes('');
      setIndStoreNotes('');
      setIndInternalNotes('');
    }
    if (activeTab === 'IndentApproval') {
      nextId = `IAP-${String(indentApprovals.length + 1).padStart(5, '0')}`;
      setIapApprovalNo(nextId);
      setIapApprovalDate(new Date().toISOString().substring(0, 10));
      setIapApprovalType('Stock Issue Approval');
      setIapIndentNo('');
      setIapIndentDate('');
      setIapDeptName('Production');
      setIapSectionName('Weaving Division A');
      setIapEmployeeId('');
      setIapMachineName('');
      setIapSpareName('');
      setIapSpareCode('SPR-001');
      setIapSpareCategory('Mechanical');
      setIapPartNo('');
      setIapBrand('');
      setIapReqQty('');
      setIapAvailableQty('');
      setIapApprovedQty('');
      setIapRejectedQty('');
      setIapUom('Nos');
      setIapCurrentStock('');
      setIapMinStockStatus('Normal');
      setIapReorderStatus('Normal');
      setIapCriticalSpareStatus('No');
      setIapApprovalStatus('Approved');
      setIapPurchaseRequired('No');
      setIapPreferredVendor('Standard Gears Ltd');
      setIapExpectedPurchaseDate('');
      setIapMaintenanceType('Preventive');
      setIapBreakdownPriority('Medium');
      setIapWorkOrderRef('');
      setIapVerifiedBy('Senthil Kumar (General Manager)');
      setIapApprovedBy('Dinesh Balasamy (MD)');
      setIapApprovalLevel('Level 1');
      setIapStoreIssueStatus('Pending');
      setIapExpectedIssueDate('');
      setIapStatus('Pending');
      setIapIndentCopyUpload('');
      setIapTechApprovalUpload('');
      setIapVendorQuotationUpload('');
      setIapApprovalNotes('');
      setIapStoreRemarks('');
      setIapInternalNotes('');
    }
    if (activeTab === 'PurchaseOrder') nextId = `SPO-${String(purchaseOrders.length + 1).padStart(5, '0')}`;
    if (activeTab === 'POApproval') nextId = `POA-${String(poApprovals.length + 1).padStart(5, '0')}`;
    if (activeTab === 'PurchaseEntry') nextId = `PE-${String(purchaseEntries.length + 1).padStart(5, '0')}`;
    if (activeTab === 'WorkOrder') nextId = `WO-${String(workOrders.length + 1).padStart(5, '0')}`;
    if (activeTab === 'Consumption') nextId = `CON-${String(consumptions.length + 1).padStart(5, '0')}`;
    if (activeTab === 'JobWorkIssue') nextId = `JWI-${String(issues.length + 1).padStart(5, '0')}`;
    if (activeTab === 'JobWorkRecv') nextId = `JWR-${String(receipts.length + 1).padStart(5, '0')}`;

    setCurrentFormId(nextId);
    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const dateToday = new Date().toISOString().substring(0, 10);

    let payload = {};
    let moduleType = '';
    let dbId = null;

    if (activeTab === 'Sections') {
      if (!secName) { alert("Please enter the section name!"); return; }
      const matched = sections.find(s => s.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        name: secName,
        type: secType,
        dept: secDept,
        incharge: secIncharge,
        machines: Number(secMachines) || 0,
        desc: secDesc,
        status: secStatus,
        secCode,
        secDeptName,
        secFloorUnitName,
        secLocation,
        secInchargeName,
        secEmployeeId,
        secContactNumber,
        secMachineGroup,
        secCriticalMachineStatus,
        secSpareStorageLocation,
        secRackNo,
        secBinNo,
        secActiveStatus,
        secMaintenanceRequiredStatus,
        secCreatedBy,
        secVerifiedBy,
        secApprovedBy,
        secLayoutUpload,
        secMachineListUpload,
        secMaintenanceNotes,
        secInternalNotes
      };

      payload = {
        module_type: 'spares_section',
        transaction_no: currentFormId,
        date: dateToday,
        buyer_name: secIncharge,
        status: secStatus,
        details
      };
      moduleType = 'spares_section';
    }
    else if (activeTab === 'Spares') {
      if (!sprName) { alert("Please fill in spare name!"); return; }
      const matched = spares.find(s => s.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        name: sprName,
        category: sprCategory,
        section: sprSection,
        machineType: sprMachineType,
        brand: sprBrand,
        modelNo: sprModelNo,
        partNo: sprPartNo,
        uom: sprUom,
        reorder: Number(sprReorder) || 0,
        minStock: Number(sprMinStock) || 0,
        maxStock: Number(sprMaxStock) || 0,
        standardRate: Number(sprStandardRate) || 0,
        hsnCode: sprHsn,
        gstPercent: Number(sprGst) || 18,
        preferredSupplier: sprSupplier,
        leadTime: Number(sprLeadTime) || 0,
        status: sprStatus,
        sprCode,
        sprMachineName,
        sprMachineModel,
        sprMachineSection,
        sprType,
        sprSize,
        sprMaterial,
        sprCurrentStock,
        sprPreferredVendor,
        sprVendorCode,
        sprPurchaseRate,
        sprEstimatedValue,
        sprWarehouseLocation,
        sprWarehouseRack,
        sprWarehouseBin,
        sprCriticalSpareStatus,
        sprMaintenanceFrequency,
        sprReplacementCycle,
        sprCreatedBy,
        sprVerifiedBy,
        sprApprovedBy,
        sprImageUpload,
        sprSpecSheetUpload,
        sprVendorQuotationUpload,
        sprTechnicalNotes,
        sprMaintenanceNotes,
        sprInternalNotes
      };

      payload = {
        module_type: 'spares_creation',
        transaction_no: currentFormId,
        date: dateToday,
        buyer_name: sprSupplier,
        status: sprStatus,
        details
      };
      moduleType = 'spares_creation';
    }
    else if (activeTab === 'OpeningStock') {
      const matched = openingStocks.find(o => o.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        date: dateToday,
        financialYear: osFY,
        section: osSection,
        narration: osNarration,
        status: osStatus,
        osDate,
        osEntryType,
        osSpareName,
        osSpareCode,
        osSpareCategory,
        osMachineName,
        osOpeningQuantity,
        osCurrentQuantity,
        osUom,
        osBatchNo,
        osSerialNo,
        osWarehouseLocation,
        osRackNo,
        osBinNo,
        osUnitRate,
        osValTotal,
        osVendorName,
        osPurchaseReferenceNo,
        osSpareCondition,
        osInspectionStatus,
        osMinimumStockLevel,
        osReorderLevel,
        osCriticalSpareStatus,
        osEnteredBy,
        osVerifiedBy,
        osApprovedBy,
        osSheetUpload,
        osImageUpload,
        osInvoiceUpload,
        osStockNotes,
        osInventoryNotes,
        osInternalNotes
      };

      payload = {
        module_type: 'spares_opening',
        transaction_no: currentFormId,
        date: osDate || dateToday,
        buyer_name: osVendorName || 'Internal',
        status: osStatus,
        details
      };
      moduleType = 'spares_opening';
    }
    else if (activeTab === 'RequestIndent') {
      const matched = indents.find(i => i.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        indDate,
        indRequestType,
        indRequestedBy,
        indEmployeeId,
        indDeptName,
        indSectionName,
        indMachineName,
        indMachineCode,
        indMachineSection,
        indBreakdownStatus,
        indSpareName,
        indSpareCode,
        indSpareCategory,
        indPartNo,
        indBrand,
        indModelNo,
        indReqQty,
        indAvailableQty,
        indApprovedQty,
        indUom,
        indReason,
        indPriorityLevel,
        indCurrentStock,
        indMinStock,
        indReorderLevel,
        indPreferredVendor,
        indLastPurchaseRate,
        indMaintenanceType,
        indWorkOrderNo,
        indVerifiedBy,
        indApprovedBy,
        indStatus,
        indBreakdownImageUpload,
        indSpareImageUpload,
        indTechReqUpload,
        indMaintenanceNotes,
        indStoreNotes,
        indInternalNotes,
        // Fallbacks for grid references
        section: indSectionName || indSection,
        machineNo: indMachineCode || indMachineNo,
        machineType: indMachineName || indMachineType,
        priority: indPriorityLevel || indPriority,
        requiredDate: indRequiredDate || indDate,
        requestedBy: indRequestedBy,
        reason: indReason,
        narration: indInternalNotes,
        items: []
      };

      payload = {
        module_type: 'spares_request_indent',
        transaction_no: currentFormId,
        date: indDate || dateToday,
        buyer_name: indRequestedBy || 'Internal',
        status: indStatus || 'Draft',
        details
      };
      moduleType = 'spares_request_indent';
    }
    else if (activeTab === 'IndentApproval') {
      const matched = indentApprovals.find(iap => iap.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        iapApprovalNo,
        iapApprovalDate,
        iapApprovalType,
        iapIndentNo,
        iapIndentDate,
        iapDeptName,
        iapSectionName,
        iapEmployeeId,
        iapMachineName,
        iapSpareName,
        iapSpareCode,
        iapSpareCategory,
        iapPartNo,
        iapBrand,
        iapReqQty,
        iapAvailableQty,
        iapApprovedQty,
        iapRejectedQty,
        iapUom,
        iapCurrentStock,
        iapMinStockStatus,
        iapReorderStatus,
        iapCriticalSpareStatus,
        iapApprovalStatus,
        iapPurchaseRequired,
        iapPreferredVendor,
        iapExpectedPurchaseDate,
        iapMaintenanceType,
        iapBreakdownPriority,
        iapWorkOrderRef,
        iapVerifiedBy,
        iapApprovedBy,
        iapApprovalLevel,
        iapStoreIssueStatus,
        iapExpectedIssueDate,
        iapStatus,
        iapIndentCopyUpload,
        iapTechApprovalUpload,
        iapVendorQuotationUpload,
        iapApprovalNotes,
        iapStoreRemarks,
        iapInternalNotes,
        // Fallbacks for grid references
        indentRef: iapIndentNo || iapIndentRef,
        section: iapSectionName || iapSection,
        requestedBy: iapRequestedBy,
        priority: iapBreakdownPriority || iapPriority,
        approvalStatus: iapApprovalStatus || iapStatus,
        approvedBy: iapApprovedBy,
        remarks: iapApprovalNotes || iapRemarks,
        forwardToPurchase: iapPurchaseRequired || iapForward,
        items: []
      };

      payload = {
        module_type: 'spares_indent_approval',
        transaction_no: currentFormId,
        date: iapApprovalDate || dateToday,
        buyer_name: iapApprovedBy || 'Internal',
        status: iapStatus || 'Pending',
        details
      };
      moduleType = 'spares_indent_approval';
    }
    else if (activeTab === 'PurchaseOrder') {
      const matched = purchaseOrders.find(po => po.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        poNo: currentFormId,
        poDate: poDate || dateToday,
        poType,
        poVendorName,
        poVendorCode,
        poGstNo,
        poContactPerson,
        poMobileNo,
        poDeptName,
        poSectionName,
        poRequestedBy,
        poSpareName,
        poSpareCode,
        poSpareCategory,
        poPartNo,
        poBrand,
        poModelNo,
        poMachineName,
        poMachineCode,
        poMachineSection,
        poOrderedQty,
        poApprovedQty,
        poPendingQty,
        poUom,
        poUnitRate,
        poDiscount,
        poTaxableAmount,
        poGstPercent,
        poCgst,
        poSgst,
        poIgst,
        poFreightCharges,
        poNetAmount,
        poDeliveryDate,
        poDeliveryLocation,
        poTransportDetails,
        poIndentNo,
        poQuotationNo,
        poPurchaseTerms,
        poWarrantyDetails,
        poPreparedBy,
        poVerifiedBy,
        poApprovedBy,
        poStatus,
        poVendorQuotationUpload,
        poTechSpecUpload,
        poPurchaseRequestUpload,
        poPurchaseNotes,
        poVendorNotes,
        poInternalNotes,

        // Fallbacks for grid & old details references
        indentRef: poIndentNo || poIndentRef,
        supplierName: poVendorName || poSupplierName,
        address: poAddress,
        contactPerson: poContactPerson || poContact,
        mobileNo: poMobileNo || poMobile,
        gstin: poGstNo || poGstin,
        expectedDate: poDeliveryDate || poExpectedDate,
        totalValue: poNetAmount || poTotalValue,
        paymentTerms: poPurchaseTerms || poPaymentTerms,
        narration: poInternalNotes || poNarration,
        status: poStatus || 'Pending Approval',
        items: poGridItems
      };

      payload = {
        module_type: 'spares_purchase_order',
        transaction_no: currentFormId,
        date: poDate || dateToday,
        buyer_name: poVendorName || poSupplierName,
        status: poStatus || 'Draft',
        details
      };
      moduleType = 'spares_purchase_order';
    }
    else if (activeTab === 'POApproval') {
      const matched = poApprovals.find(poa => poa.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        poaApprovalNo: currentFormId,
        poaApprovalDate: poaApprovalDate || dateToday,
        poaApprovalType,
        poaPoNo,
        poaPoDate,
        poaIndentNo,
        poaDeptName,
        poaVendorName,
        poaVendorCode,
        poaGstNo,
        poaSpareName,
        poaSpareCode,
        poaSpareCategory,
        poaPartNo,
        poaBrand,
        poaOrderedQty,
        poaApprovedQty,
        poaPendingQty,
        poaUom,
        poaUnitRate,
        poaTotalAmount,
        poaTaxVerification,
        poaBudgetStatus,
        poaCurrentStock,
        poaMinStockLevel,
        poaReorderStatus,
        poaCriticalSpareStatus,
        poaExpectedDeliveryDate,
        poaDeliveryTerms,
        poaApprovalStatus,
        poaVerifiedBy,
        poaApprovedBy,
        poaApprovalLevel,
        poaStatus,
        poaCopyUpload,
        poaQuotationUpload,
        poaTechApprovalUpload,
        poaApprovalNotes,
        poaAccountsRemarks,
        poaInternalNotes,

        // Fallbacks
        poRef: poaPoNo || poaPoRef,
        supplierName: poaVendorName || poaSupplierName,
        totalPOValue: poaTotalAmount || poaTotalValue,
        approvalStatus: poaApprovalStatus || poaStatus,
        approvedBy: poaApprovedBy,
        remarks: poaApprovalNotes || poaRemarks,
        sendToSupplier: poaSend,
        items: poaGridItems
      };

      payload = {
        module_type: 'spares_po_approval',
        transaction_no: currentFormId,
        date: poaApprovalDate || dateToday,
        buyer_name: poaApprovedBy,
        status: poaStatus || 'Pending',
        details
      };
      moduleType = 'spares_po_approval';
    }
    else if (activeTab === 'WorkOrder') {
      const matched = workOrders.find(wo => wo.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        woWorkOrderNo: currentFormId,
        woWorkOrderDate: woWorkOrderDate || dateToday,
        woWorkOrderType,
        woMachineName,
        woMachineCode,
        woMachineSection,
        woMachineLocation,
        woComplaintNo,
        woComplaintDescription,
        woBreakdownReason,
        woPriorityLevel,
        woMaintenanceCategory,
        woWorkDescription,
        woPlannedStartDate,
        woPlannedEndDate,
        woSpareName,
        woSpareCode,
        woRequiredQty,
        woUom,
        woAssignedTechnician,
        woMaintenanceTeam,
        woSupervisorName,
        woEstimatedCost,
        woSpareCost,
        woServiceCost,
        woCompletionStatus,
        woActualCompletionDate,
        woDowntimeHours,
        woRequestedBy,
        woVerifiedBy,
        woApprovedBy,
        woStatus,
        woMachineImageUpload,
        woBreakdownReportUpload,
        woServiceReportUpload,
        woMaintenanceNotes,
        woTechnicianNotes,
        woInternalNotes,

        // Fallbacks
        type: woWorkOrderType || woType,
        section: woMachineSection || woSection,
        machineNo: woMachineCode || woMachineNo,
        machineType: woMachineName || woMachineType,
        problem: woComplaintDescription || woProblem,
        priority: woPriorityLevel || woPriority,
        assignedTo: woAssignedTechnician || woAssignedTo,
        expectedDate: woPlannedEndDate || woExpectedDate,
        estimatedCost: Number(woEstimatedCost) || 0,
        status: woStatus,
        items: woGridItems
      };

      payload = {
        module_type: 'spares_work_order',
        transaction_no: currentFormId,
        date: woWorkOrderDate || dateToday,
        buyer_name: woAssignedTechnician || woAssignedTo,
        status: woStatus || 'Open',
        details
      };
      moduleType = 'spares_work_order';
    }
    else if (activeTab === 'PurchaseEntry') {
      const matched = purchaseEntries.find(pe => pe.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        pePurchaseEntryNo: currentFormId,
        peEntryDate: peEntryDate || dateToday,
        peEntryType,
        pePoNo,
        peInvoiceNo,
        peChallanNo,
        peVendorName,
        peSpareName,
        peSpareCode,
        peSpareCategory,
        pePartNo,
        peBrand,
        peMachineName,
        peMachineSection,
        peOrderedQty,
        peReceivedQty,
        peRejectedQty,
        peAcceptedQty,
        peUom,
        pePurchaseRate,
        peTaxableAmount,
        peGstPercent,
        peTotalAmount,
        peWarehouseLocation,
        peRackNo,
        peBinNo,
        peBatchNo,
        peSerialNo,
        peInspectionStatus,
        peQcStatus,
        peSpareCondition,
        peVendorInvoiceDate,
        peWarrantyStatus,
        peDeliveryStatus,
        peReceivedBy,
        peQcVerifiedBy,
        peStoreApprovedBy,
        peStatus,
        peInvoiceUpload,
        peQcReportUpload,
        peSpareImageUpload,

        // Fallbacks
        poRef: pePoNo || pePoRef,
        supplierName: peVendorName || peSupplierName,
        invoiceNo: peInvoiceNo,
        invoiceDate: peVendorInvoiceDate || peInvoiceDate,
        gateInwardRef: peGateInward,
        totalAmount: peTaxableAmount || peTotalAmount,
        gstAmount: peTotalAmount * 0.18,
        netAmount: peTotalAmount,
        storeLocation: peWarehouseLocation || peStoreLocation,
        receivedBy: peReceivedBy,
        remarks: peRemarks,
        items: peGridItems
      };

      payload = {
        module_type: 'spares_purchase_entry',
        transaction_no: currentFormId,
        date: peEntryDate || dateToday,
        buyer_name: peVendorName || peSupplierName,
        status: peStatus || 'Pending QC',
        details
      };
      moduleType = 'spares_purchase_entry';
    }
    else if (activeTab === 'Consumption') {
      const matched = consumptions.find(c => c.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        conDate: conDate || dateToday,
        conType,
        conMachineName,
        conMachineCode,
        conMachineSection,
        conMachineLocation,
        conWoRef,
        conComplaintNo,
        conMaintenanceType,
        conSpareName,
        conSpareCode,
        conSpareCategory,
        conPartNo,
        conBrand,
        conIssuedQty: Number(conIssuedQty) || 0,
        conConsumedQty: Number(conConsumedQty) || 0,
        conBalanceQty: Number(conBalanceQty) || 0,
        conUom,
        conWarehouseLocation,
        conRackNo,
        conBinNo,
        conBatchNo,
        conSerialNo,
        conBreakdownReason,
        conRepairDescription,
        conDowntimeHours: Number(conDowntimeHours) || 0,
        conTechnicianName,
        conMaintenanceTeam,
        conSupervisorName,
        conUnitRate: Number(conUnitRate) || 0,
        conTotalValue: Number(conTotalValue) || 0,
        conIssuedBy,
        conConsumedBy,
        conVerifiedBy,
        conApprovedBy,
        conStatus,
        conMaintenanceReportUpload,
        conSpareImageUpload,
        conBreakdownImageUpload,
        conMaintenanceNotes,
        conConsumptionNotes,
        conInternalNotes,

        // Fallbacks
        workOrderRef: conWoRef,
        section: conMachineSection,
        machineNo: conMachineCode,
        issuedBy: conIssuedBy,
        receivedBy: conConsumedBy,
        totalConsumptionValue: Number(conTotalValue) || 0,
        items: conGridItems
      };

      payload = {
        module_type: 'spares_consumption',
        transaction_no: currentFormId,
        date: conDate || dateToday,
        buyer_name: conConsumedBy,
        status: conStatus || 'Completed',
        details
      };
      moduleType = 'spares_consumption';
    }
    else if (activeTab === 'JobWorkIssue') {
      const matched = issues.find(i => i.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        jwDate: jwDate || dateToday,
        jwType,
        jwPartyName,
        jwContact,
        jwMobile,
        jwDeptName,
        jwWoRef,
        jwIndentRef,
        jwApprovalNo,
        jwSpareName,
        jwSpareCode,
        jwSpareCategory,
        jwPartNo,
        jwBrand,
        jwMachineName,
        jwMachineSection,
        jwIssuedQty: Number(jwIssuedQty) || 0,
        jwBalanceQty: Number(jwBalanceQty) || 0,
        jwUom,
        jwWarehouseLocation,
        jwRackNo,
        jwBinNo,
        jwSerialNo,
        jwReturnableStatus,
        jwExpectedReturn,
        jwPurpose,
        jwJobWorkDescription,
        jwSecurityDeposit: Number(jwSecurityDeposit) || 0,
        jwIssueValue: Number(jwIssueValue) || 0,
        jwPenaltyTerms,
        jwIssuedBy,
        jwVerifiedBy,
        jwApprovedBy,
        jwStatus,
        jwIssueSlipUpload,
        jwApprovalCopyUpload,
        jwSpareImageUpload,
        jwJobWorkNotes,
        jwLoanNotes,
        jwInternalNotes,

        // Fallbacks
        partyName: jwPartyName,
        expectedReturn: jwExpectedReturn,
        purpose: jwPurpose,
        status: jwStatus,
        items: jwGridItems
      };

      payload = {
        module_type: 'spares_jobwork_issue',
        transaction_no: currentFormId,
        date: jwDate || dateToday,
        buyer_name: jwPartyName,
        status: jwStatus || 'Issued',
        details
      };
      moduleType = 'spares_jobwork_issue';
    }
    else if (activeTab === 'JobWorkRecv') {
      const matched = receipts.find(r => r.id === currentFormId);
      dbId = matched?.db_id;

      const details = {
        jwrReceiptDate: jwrReceiptDate || dateToday,
        jwrReceiptType,
        jwrIssueRef,
        jwrWoRef,
        jwrPartyName,
        jwrSpareName,
        jwrSpareCode,
        jwrSpareCategory,
        jwrPartNo,
        jwrBrand,
        jwrMachineName,
        jwrMachineSection,
        jwrIssuedQty: Number(jwrIssuedQty) || 0,
        jwrReturnedQty: Number(jwrReturnedQty) || 0,
        jwrDamagedQty: Number(jwrDamagedQty) || 0,
        jwrMissingQty: Number(jwrMissingQty) || 0,
        jwrBalanceQty: Number(jwrBalanceQty) || 0,
        jwrUom,
        jwrReturnCondition,
        jwrDamageStatus,
        jwrRepairRequiredStatus,
        jwrWarehouseLocation,
        jwrRackNo,
        jwrBinNo,
        jwrSerialNo,
        jwrInspectionStatus,
        jwrQcVerification,
        jwrFunctionalStatus,
        jwrPenaltyAmount: Number(jwrPenaltyAmount) || 0,
        jwrDamageCharges: Number(jwrDamageCharges) || 0,
        jwrFinalSettlementAmount: Number(jwrFinalSettlementAmount) || 0,
        jwrReceivedBy,
        jwrVerifiedBy,
        jwrApprovedBy,
        jwrStatus,
        jwrReturnSlipUpload,
        jwrInspectionReportUpload,
        jwrSpareImageUpload,
        jwrRemarks,

        // Fallbacks
        issueRef: jwrIssueRef,
        partyName: jwrPartyName,
        receivedBy: jwrReceivedBy,
        charges: jwrFinalSettlementAmount || jwrDamageCharges,
        remarks: jwrRemarks,
        items: jwrGridItems
      };

      payload = {
        module_type: 'spares_jobwork_recv',
        transaction_no: currentFormId,
        date: jwrReceiptDate || dateToday,
        buyer_name: jwrPartyName,
        status: jwrStatus || 'Completed',
        details
      };
      moduleType = 'spares_jobwork_recv';
    }

    if (moduleType) {
      try {
        if (dbId) {
          await workOrderTransactionAPI.update(dbId, payload);
        } else {
          await workOrderTransactionAPI.create(payload);
        }
        await loadData();
        setIsFormOpen(false);
        alert("Transaction saved successfully!");
      } catch (err) {
        console.error("Failed to save transaction", err);
        alert("Error saving transaction to database. Please check backend.");
      }
      return;
    }

    if (activeTab === 'PurchaseOrder') {
      const isExisting = purchaseOrders.some(po => po.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        indentRef: poIndentRef,
        supplierName: poSupplierName,
        address: poAddress,
        contactPerson: poContact,
        mobileNo: poMobile,
        gstin: poGstin,
        expectedDate: poExpectedDate,
        totalValue: poTotalValue,
        paymentTerms: poPaymentTerms,
        narration: poNarration,
        status: 'Pending Approval',
        items: poGridItems
      };
      if (isExisting) {
        setPurchaseOrders(purchaseOrders.map(po => po.id === currentFormId ? newVoucher : po));
      } else {
        setPurchaseOrders([newVoucher, ...purchaseOrders]);
      }
    }

    if (activeTab === 'POApproval') {
      const isExisting = poApprovals.some(poa => poa.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        poRef: poaPoRef,
        supplierName: poaSupplierName,
        totalPOValue: poaTotalValue,
        approvalStatus: poaStatus,
        approvedBy: poaApprovedBy,
        remarks: poaRemarks,
        sendToSupplier: poaSend,
        items: poaGridItems
      };
      if (isExisting) {
        setPoApprovals(poApprovals.map(poa => poa.id === currentFormId ? newVoucher : poa));
      } else {
        setPoApprovals([newVoucher, ...poApprovals]);
      }
    }

    if (activeTab === 'PurchaseEntry') {
      const isExisting = purchaseEntries.some(pe => pe.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        poRef: pePoRef,
        supplierName: peSupplierName,
        invoiceNo: peInvoiceNo,
        invoiceDate: peInvoiceDate,
        gateInwardRef: peGateInward,
        totalAmount: peTotalAmount,
        gstAmount: peGstAmount,
        netAmount: peNetAmount,
        storeLocation: peStoreLocation,
        receivedBy: peReceivedBy,
        remarks: peRemarks,
        items: peGridItems
      };
      if (isExisting) {
        setPurchaseEntries(purchaseEntries.map(pe => pe.id === currentFormId ? newVoucher : pe));
      } else {
        setPurchaseEntries([newVoucher, ...purchaseEntries]);
      }
    }

    if (activeTab === 'WorkOrder') {
      const isExisting = workOrders.some(wo => wo.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        type: woType,
        section: woSection,
        machineNo: woMachineNo,
        machineType: woMachineType,
        problem: woProblem,
        priority: woPriority,
        assignedTo: woAssignedTo,
        expectedDate: woExpectedDate,
        estimatedCost: Number(woEstimatedCost) || 0,
        status: woStatus,
        items: woGridItems
      };
      if (isExisting) {
        setWorkOrders(workOrders.map(wo => wo.id === currentFormId ? newVoucher : wo));
      } else {
        setWorkOrders([newVoucher, ...workOrders]);
      }
    }

    if (activeTab === 'Consumption') {
      const isExisting = consumptions.some(c => c.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        workOrderRef: conWoRef,
        section: conSection,
        machineNo: conMachineNo,
        indentRef: conIndentRef,
        issuedBy: conIssuedBy,
        receivedBy: conReceivedBy,
        totalValue: conTotalValue,
        purpose: conPurpose,
        remarks: conRemarks,
        items: conGridItems
      };
      if (isExisting) {
        setConsumptions(consumptions.map(c => c.id === currentFormId ? newVoucher : c));
      } else {
        setConsumptions([newVoucher, ...consumptions]);
      }
    }

    if (activeTab === 'JobWorkIssue') {
      const isExisting = issues.some(j => j.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        type: jwType,
        partyName: jwPartyName,
        contactPerson: jwContact,
        mobileNo: jwMobile,
        gatePassNo: jwGatePass,
        expectedReturnDate: jwExpectedReturn,
        purpose: jwPurpose,
        authorizedBy: jwAuthorizedBy,
        remarks: jwRemarks,
        status: jwStatus,
        items: jwGridItems
      };
      if (isExisting) {
        setIssues(issues.map(j => j.id === currentFormId ? newVoucher : j));
      } else {
        setIssues([newVoucher, ...issues]);
      }
    }

    if (activeTab === 'JobWorkRecv') {
      const isExisting = receipts.some(r => r.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        issueRef: jwrIssueRef,
        partyName: jwrPartyName,
        issueDate: jwrIssueDate,
        gateInwardNo: jwrGateInward,
        charges: Number(jwrCharges) || 0,
        qcDone: jwrQc,
        receivedBy: jwrReceivedBy,
        remarks: jwrRemarks,
        status: jwrStatus,
        items: jwrGridItems
      };
      if (isExisting) {
        setReceipts(receipts.map(r => r.id === currentFormId ? newVoucher : r));
      } else {
        setReceipts([newVoucher, ...receipts]);
      }
    }

    setIsFormOpen(false);
    alert("Transaction saved and catalogued successfully!");
  };

  const handleEdit = (row) => {
    setCurrentFormId(row.id);
    if (activeTab === 'Sections') {
      setSecName(row.name || ''); 
      setSecType(row.type || 'Weaving'); 
      setSecDept(row.dept || 'Production'); 
      setSecIncharge(row.incharge || 'Murugan Swamy (Maintenance In-charge)'); 
      setSecMachines(row.machines || ''); 
      setSecDesc(row.desc || ''); 
      setSecStatus(row.status || 'Active');

      // Recommended fields
      setSecCode(row.secCode || '');
      setSecDeptName(row.secDeptName || '');
      setSecFloorUnitName(row.secFloorUnitName || '');
      setSecLocation(row.secLocation || '');
      setSecInchargeName(row.secInchargeName || '');
      setSecEmployeeId(row.secEmployeeId || '');
      setSecContactNumber(row.secContactNumber || '');
      setSecMachineGroup(row.secMachineGroup || '');
      setSecCriticalMachineStatus(row.secCriticalMachineStatus || 'Non-Critical');
      setSecSpareStorageLocation(row.secSpareStorageLocation || '');
      setSecRackNo(row.secRackNo || '');
      setSecBinNo(row.secBinNo || '');
      setSecActiveStatus(row.secActiveStatus || 'Active');
      setSecMaintenanceRequiredStatus(row.secMaintenanceRequiredStatus || 'No');
      setSecCreatedBy(row.secCreatedBy || 'Murugan Swamy (Maintenance In-charge)');
      setSecVerifiedBy(row.secVerifiedBy || 'Senthil Kumar (General Manager)');
      setSecApprovedBy(row.secApprovedBy || 'Dinesh Balasamy (MD)');
      setSecLayoutUpload(row.secLayoutUpload || '');
      setSecMachineListUpload(row.secMachineListUpload || '');
      setSecMaintenanceNotes(row.secMaintenanceNotes || '');
      setSecInternalNotes(row.secInternalNotes || '');
    }
    if (activeTab === 'Spares') {
      setSprName(row.name || ''); 
      setSprCategory(row.category || 'Mechanical Parts'); 
      setSprSection(row.section || 'Weaving Division A'); 
      setSprMachineType(row.machineType || 'Airjet Loom'); 
      setSprBrand(row.brand || ''); 
      setSprModelNo(row.modelNo || ''); 
      setSprPartNo(row.partNo || ''); 
      setSprUom(row.uom || 'Nos'); 
      setSprReorder(row.reorder || ''); 
      setSprMinStock(row.minStock || ''); 
      setSprMaxStock(row.maxStock || ''); 
      setSprStandardRate(row.standardRate || ''); 
      setSprHsn(row.hsnCode || ''); 
      setSprGst(row.gstPercent || 18); 
      setSprSupplier(row.preferredSupplier || 'Standard Gears Ltd'); 
      setSprLeadTime(row.leadTime || ''); 
      setSprStatus(row.status || 'Active');

      // Recommended fields
      setSprCode(row.sprCode || '');
      setSprMachineName(row.sprMachineName || '');
      setSprMachineModel(row.sprMachineModel || '');
      setSprMachineSection(row.sprMachineSection || 'Weaving Division A');
      setSprType(row.sprType || '');
      setSprSize(row.sprSize || '');
      setSprMaterial(row.sprMaterial || '');
      setSprCurrentStock(row.sprCurrentStock || '');
      setSprPreferredVendor(row.sprPreferredVendor || 'Standard Gears Ltd');
      setSprVendorCode(row.sprVendorCode || '');
      setSprPurchaseRate(row.sprPurchaseRate || '');
      setSprEstimatedValue(row.sprEstimatedValue || '');
      setSprWarehouseLocation(row.sprWarehouseLocation || '');
      setSprWarehouseRack(row.sprWarehouseRack || '');
      setSprWarehouseBin(row.sprWarehouseBin || '');
      setSprCriticalSpareStatus(row.sprCriticalSpareStatus || 'No');
      setSprMaintenanceFrequency(row.sprMaintenanceFrequency || '');
      setSprReplacementCycle(row.sprReplacementCycle || '');
      setSprCreatedBy(row.sprCreatedBy || 'Murugan Swamy (Maintenance In-charge)');
      setSprVerifiedBy(row.sprVerifiedBy || 'Senthil Kumar (General Manager)');
      setSprApprovedBy(row.sprApprovedBy || 'Dinesh Balasamy (MD)');
      setSprImageUpload(row.sprImageUpload || '');
      setSprSpecSheetUpload(row.sprSpecSheetUpload || '');
      setSprVendorQuotationUpload(row.sprVendorQuotationUpload || '');
      setSprTechnicalNotes(row.sprTechnicalNotes || '');
      setSprMaintenanceNotes(row.sprMaintenanceNotes || '');
      setSprInternalNotes(row.sprInternalNotes || '');
    }
    if (activeTab === 'OpeningStock') {
      setOsFY(row.financialYear || '2026-2027');
      setOsSection(row.section || 'Weaving Division A');
      setOsNarration(row.narration || '');
      setOsStatus(row.status || 'Draft');
      setOsGridItems(row.items || []);

      // Recommended fields
      setOsDate(row.osDate || '');
      setOsEntryType(row.osEntryType || 'Spare Opening');
      setOsSpareName(row.osSpareName || '');
      setOsSpareCode(row.osSpareCode || 'SPR-001');
      setOsSpareCategory(row.osSpareCategory || 'Mechanical');
      setOsMachineName(row.osMachineName || '');
      setOsOpeningQuantity(row.osOpeningQuantity || '');
      setOsCurrentQuantity(row.osCurrentQuantity || '');
      setOsUom(row.osUom || 'Nos');
      setOsBatchNo(row.osBatchNo || '');
      setOsSerialNo(row.osSerialNo || '');
      setOsWarehouseLocation(row.osWarehouseLocation || '');
      setOsRackNo(row.osRackNo || '');
      setOsBinNo(row.osBinNo || '');
      setOsUnitRate(row.osUnitRate || '');
      setOsValTotal(row.osValTotal || '');
      setOsVendorName(row.osVendorName || '');
      setOsPurchaseReferenceNo(row.osPurchaseReferenceNo || '');
      setOsSpareCondition(row.osSpareCondition || 'New');
      setOsInspectionStatus(row.osInspectionStatus || 'Passed');
      setOsMinimumStockLevel(row.osMinimumStockLevel || '');
      setOsReorderLevel(row.osReorderLevel || '');
      setOsCriticalSpareStatus(row.osCriticalSpareStatus || 'No');
      setOsEnteredBy(row.osEnteredBy || 'Mani Bharathi (Store Head)');
      setOsVerifiedBy(row.osVerifiedBy || 'Senthil Kumar (General Manager)');
      setOsApprovedBy(row.osApprovedBy || 'Dinesh Balasamy (MD)');
      setOsSheetUpload(row.osSheetUpload || '');
      setOsImageUpload(row.osImageUpload || '');
      setOsInvoiceUpload(row.osInvoiceUpload || '');
      setOsStockNotes(row.osStockNotes || '');
      setOsInventoryNotes(row.osInventoryNotes || '');
      setOsInternalNotes(row.osInternalNotes || '');
    }
    if (activeTab === 'RequestIndent') {
      setIndDate(row.indDate || '');
      setIndRequestType(row.indRequestType || 'Spare Request');
      setIndRequestedBy(row.indRequestedBy || '');
      setIndEmployeeId(row.indEmployeeId || '');
      setIndDeptName(row.indDeptName || '');
      setIndSectionName(row.indSectionName || '');
      setIndMachineName(row.indMachineName || '');
      setIndMachineCode(row.indMachineCode || '');
      setIndMachineSection(row.indMachineSection || '');
      setIndBreakdownStatus(row.indBreakdownStatus || 'No');
      setIndSpareName(row.indSpareName || '');
      setIndSpareCode(row.indSpareCode || 'SPR-001');
      setIndSpareCategory(row.indSpareCategory || '');
      setIndPartNo(row.indPartNo || '');
      setIndBrand(row.indBrand || '');
      setIndModelNo(row.indModelNo || '');
      setIndReqQty(row.indReqQty || '');
      setIndAvailableQty(row.indAvailableQty || '');
      setIndApprovedQty(row.indApprovedQty || '');
      setIndUom(row.indUom || 'Nos');
      setIndReason(row.indReason || '');
      setIndPriorityLevel(row.indPriorityLevel || 'Medium');
      setIndCurrentStock(row.indCurrentStock || '');
      setIndMinStock(row.indMinStock || '');
      setIndReorderLevel(row.indReorderLevel || '');
      setIndPreferredVendor(row.indPreferredVendor || 'Standard Gears Ltd');
      setIndLastPurchaseRate(row.indLastPurchaseRate || '');
      setIndMaintenanceType(row.indMaintenanceType || 'Preventive');
      setIndWorkOrderNo(row.indWorkOrderNo || '');
      setIndVerifiedBy(row.indVerifiedBy || 'Senthil Kumar (General Manager)');
      setIndApprovedBy(row.indApprovedBy || 'Dinesh Balasamy (MD)');
      setIndStatus(row.indStatus || 'Draft');
      setIndBreakdownImageUpload(row.indBreakdownImageUpload || '');
      setIndSpareImageUpload(row.indSpareImageUpload || '');
      setIndTechReqUpload(row.indTechReqUpload || '');
      setIndMaintenanceNotes(row.indMaintenanceNotes || '');
      setIndStoreNotes(row.indStoreNotes || '');
      setIndInternalNotes(row.indInternalNotes || '');

      // Fallbacks
      setIndSection(row.section || '');
      setIndMachineNo(row.machineNo || '');
      setIndMachineType(row.machineType || '');
      setIndPriority(row.priority || '');
      setIndRequiredDate(row.requiredDate || '');
      setIndNarration(row.narration || '');
      setIndGridItems(row.items || []);
    }
    if (activeTab === 'IndentApproval') {
      setIapApprovalNo(row.iapApprovalNo || row.id || '');
      setIapApprovalDate(row.iapApprovalDate || '');
      setIapApprovalType(row.iapApprovalType || 'Stock Issue Approval');
      setIapIndentNo(row.iapIndentNo || '');
      setIapIndentDate(row.iapIndentDate || '');
      setIapDeptName(row.iapDeptName || '');
      setIapSectionName(row.iapSectionName || '');
      setIapEmployeeId(row.iapEmployeeId || '');
      setIapMachineName(row.iapMachineName || '');
      setIapSpareName(row.iapSpareName || '');
      setIapSpareCode(row.iapSpareCode || 'SPR-001');
      setIapSpareCategory(row.iapSpareCategory || '');
      setIapPartNo(row.iapPartNo || '');
      setIapBrand(row.iapBrand || '');
      setIapReqQty(row.iapReqQty || '');
      setIapAvailableQty(row.iapAvailableQty || '');
      setIapApprovedQty(row.iapApprovedQty || '');
      setIapRejectedQty(row.iapRejectedQty || '');
      setIapUom(row.iapUom || 'Nos');
      setIapCurrentStock(row.iapCurrentStock || '');
      setIapMinStockStatus(row.iapMinStockStatus || 'Normal');
      setIapReorderStatus(row.iapReorderStatus || 'Normal');
      setIapCriticalSpareStatus(row.iapCriticalSpareStatus || 'No');
      setIapApprovalStatus(row.iapApprovalStatus || 'Approved');
      setIapPurchaseRequired(row.iapPurchaseRequired || 'No');
      setIapPreferredVendor(row.iapPreferredVendor || 'Standard Gears Ltd');
      setIapExpectedPurchaseDate(row.iapExpectedPurchaseDate || '');
      setIapMaintenanceType(row.iapMaintenanceType || 'Preventive');
      setIapBreakdownPriority(row.iapBreakdownPriority || 'Medium');
      setIapWorkOrderRef(row.iapWorkOrderRef || '');
      setIapVerifiedBy(row.iapVerifiedBy || 'Senthil Kumar (General Manager)');
      setIapApprovedBy(row.iapApprovedBy || 'Dinesh Balasamy (MD)');
      setIapApprovalLevel(row.iapApprovalLevel || 'Level 1');
      setIapStoreIssueStatus(row.iapStoreIssueStatus || 'Pending');
      setIapExpectedIssueDate(row.iapExpectedIssueDate || '');
      setIapStatus(row.iapStatus || 'Pending');
      setIapIndentCopyUpload(row.iapIndentCopyUpload || '');
      setIapTechApprovalUpload(row.iapTechApprovalUpload || '');
      setIapVendorQuotationUpload(row.iapVendorQuotationUpload || '');
      setIapApprovalNotes(row.iapApprovalNotes || '');
      setIapStoreRemarks(row.iapStoreRemarks || '');
      setIapInternalNotes(row.iapInternalNotes || '');

      // Fallbacks
      setIapIndentRef(row.indentRef || '');
      setIapSection(row.section || '');
      setIapRequestedBy(row.requestedBy || '');
      setIapPriority(row.priority || '');
      setIapApprovedBy(row.approvedBy || '');
      setIapRemarks(row.remarks || '');
      setIapForward(row.forwardToPurchase || 'No');
      setIapStatus(row.approvalStatus || 'Pending');
      setIapGridItems(row.items || []);
    }
    if (activeTab === 'PurchaseOrder') {
      const d = row.details || {};
      setPoDate(d.poDate || row.date || '');
      setPoType(d.poType || 'Spare Purchase');
      setPoIndentNo(d.poIndentNo || row.indentRef || '');
      setPoVendorName(d.poVendorName || row.supplierName || '');
      setPoVendorCode(d.poVendorCode || '');
      setPoGstNo(d.poGstNo || row.gstin || '');
      setPoContactPerson(d.poContactPerson || row.contactPerson || '');
      setPoMobileNo(d.poMobileNo || row.mobileNo || '');
      setPoDeptName(d.poDeptName || '');
      setPoSectionName(d.poSectionName || '');
      setPoRequestedBy(d.poRequestedBy || '');
      setPoSpareName(d.poSpareName || '');
      setPoSpareCode(d.poSpareCode || 'SPR-001');
      setPoSpareCategory(d.poSpareCategory || '');
      setPoPartNo(d.poPartNo || '');
      setPoBrand(d.poBrand || '');
      setPoModelNo(d.poModelNo || '');
      setPoMachineName(d.poMachineName || '');
      setPoMachineCode(d.poMachineCode || '');
      setPoMachineSection(d.poMachineSection || '');
      setPoOrderedQty(d.poOrderedQty || '');
      setPoApprovedQty(d.poApprovedQty || '');
      setPoPendingQty(d.poPendingQty || '');
      setPoUom(d.poUom || 'Nos');
      setPoUnitRate(d.poUnitRate || '');
      setPoDiscount(d.poDiscount || '');
      setPoTaxableAmount(d.poTaxableAmount || '');
      setPoGstPercent(d.poGstPercent || '18');
      setPoCgst(d.poCgst || '');
      setPoSgst(d.poSgst || '');
      setPoIgst(d.poIgst || '');
      setPoFreightCharges(d.poFreightCharges || '');
      setPoNetAmount(d.poNetAmount || row.totalValue || '');
      setPoDeliveryDate(d.poDeliveryDate || row.expectedDate || '');
      setPoDeliveryLocation(d.poDeliveryLocation || '');
      setPoTransportDetails(d.poTransportDetails || '');
      setPoQuotationNo(d.poQuotationNo || '');
      setPoPurchaseTerms(d.poPurchaseTerms || row.paymentTerms || '');
      setPoWarrantyDetails(d.poWarrantyDetails || '');
      setPoPreparedBy(d.poPreparedBy || '');
      setPoVerifiedBy(d.poVerifiedBy || '');
      setPoApprovedBy(d.poApprovedBy || '');
      setPoStatus(d.poStatus || row.status || 'Draft');
      setPoVendorQuotationUpload(d.poVendorQuotationUpload || '');
      setPoTechSpecUpload(d.poTechSpecUpload || '');
      setPoPurchaseRequestUpload(d.poPurchaseRequestUpload || '');
      setPoPurchaseNotes(d.poPurchaseNotes || '');
      setPoVendorNotes(d.poVendorNotes || '');
      setPoInternalNotes(d.poInternalNotes || row.narration || '');

      // Fallbacks
      setPoIndentRef(row.indentRef || d.poIndentNo || '');
      setPoSupplierName(row.supplierName || d.poVendorName || '');
      setPoAddress(row.address || d.poAddress || '');
      setPoContact(row.contactPerson || d.poContactPerson || '');
      setPoMobile(row.mobileNo || d.poMobileNo || '');
      setPoGstin(row.gstin || d.poGstNo || '');
      setPoExpectedDate(row.expectedDate || d.poDeliveryDate || '');
      setPoPaymentTerms(row.paymentTerms || d.poPurchaseTerms || '');
      setPoNarration(row.narration || d.poInternalNotes || '');
      setPoGridItems(row.items || []);
    }
    if (activeTab === 'POApproval') {
      const d = row.details || {};
      setPoaApprovalDate(d.poaApprovalDate || row.date || '');
      setPoaApprovalType(d.poaApprovalType || 'Standard Approval');
      setPoaPoNo(d.poaPoNo || row.poRef || '');
      setPoaPoDate(d.poaPoDate || '');
      setPoaIndentNo(d.poaIndentNo || '');
      setPoaDeptName(d.poaDeptName || '');
      setPoaVendorName(d.poaVendorName || row.supplierName || '');
      setPoaVendorCode(d.poaVendorCode || '');
      setPoaGstNo(d.poaGstNo || '');
      setPoaSpareName(d.poaSpareName || '');
      setPoaSpareCode(d.poaSpareCode || 'SPR-001');
      setPoaSpareCategory(d.poaSpareCategory || '');
      setPoaPartNo(d.poaPartNo || '');
      setPoaBrand(d.poaBrand || '');
      setPoaOrderedQty(d.poaOrderedQty || '');
      setPoaApprovedQty(d.poaApprovedQty || '');
      setPoaPendingQty(d.poaPendingQty || '');
      setPoaUom(d.poaUom || 'Nos');
      setPoaUnitRate(d.poaUnitRate || '');
      setPoaTotalAmount(d.poaTotalAmount || row.totalPOValue || '');
      setPoaTaxVerification(d.poaTaxVerification || 'Verified');
      setPoaBudgetStatus(d.poaBudgetStatus || 'Within Budget');
      setPoaCurrentStock(d.poaCurrentStock || '');
      setPoaMinStockLevel(d.poaMinStockLevel || '');
      setPoaReorderStatus(d.poaReorderStatus || 'Normal');
      setPoaCriticalSpareStatus(d.poaCriticalSpareStatus || 'No');
      setPoaExpectedDeliveryDate(d.poaExpectedDeliveryDate || '');
      setPoaDeliveryTerms(d.poaDeliveryTerms || '');
      setPoaApprovalStatus(d.poaApprovalStatus || row.approvalStatus || 'Approved');
      setPoaVerifiedBy(d.poaVerifiedBy || '');
      setPoaApprovedBy(d.poaApprovedBy || row.approvedBy || '');
      setPoaApprovalLevel(d.poaApprovalLevel || 'Level 1');
      setPoaStatus(d.poaStatus || row.status || 'Pending');
      setPoaCopyUpload(d.poaCopyUpload || '');
      setPoaQuotationUpload(d.poaQuotationUpload || '');
      setPoaTechApprovalUpload(d.poaTechApprovalUpload || '');
      setPoaApprovalNotes(d.poaApprovalNotes || row.remarks || '');
      setPoaAccountsRemarks(d.poaAccountsRemarks || '');
      setPoaInternalNotes(d.poaInternalNotes || '');

      // Fallbacks
      setPoaPoRef(row.poRef || d.poaPoNo || '');
      setPoaSupplierName(row.supplierName || d.poaVendorName || '');
      setPoaTotalValue(row.totalPOValue || d.poaTotalAmount || '');
      setPoaApprovedBy(row.approvedBy || d.poaApprovedBy || '');
      setPoaRemarks(row.remarks || d.poaApprovalNotes || '');
      setPoaSend(row.sendToSupplier || d.poaSend || 'No');
      setPoaStatus(row.approvalStatus || d.poaApprovalStatus || 'Pending');
      setPoaGridItems(row.items || []);
    }
    if (activeTab === 'PurchaseEntry') {
      const d = row.details || {};
      setPeEntryDate(d.peEntryDate || row.date || '');
      setPeEntryType(d.peEntryType || 'Spare Purchase');
      setPePoNo(d.pePoNo || row.poRef || '');
      setPeInvoiceNo(d.peInvoiceNo || row.invoiceNo || '');
      setPeChallanNo(d.peChallanNo || '');
      setPeVendorName(d.peVendorName || row.supplierName || '');
      setPeSpareName(d.peSpareName || '');
      setPeSpareCode(d.peSpareCode || 'SPR-001');
      setPeSpareCategory(d.peSpareCategory || '');
      setPePartNo(d.pePartNo || '');
      setPeBrand(d.peBrand || '');
      setPeMachineName(d.peMachineName || '');
      setPeMachineSection(d.peMachineSection || '');
      setPeOrderedQty(d.peOrderedQty || '');
      setPeReceivedQty(d.peReceivedQty || '');
      setPeRejectedQty(d.peRejectedQty || '');
      setPeAcceptedQty(d.peAcceptedQty || '');
      setPeUom(d.peUom || 'Nos');
      setPePurchaseRate(d.pePurchaseRate || '');
      setPeTaxableAmount(d.peTaxableAmount || '');
      setPeGstPercent(d.peGstPercent || '18');
      setPeTotalAmount(d.peTotalAmount || row.totalAmount || '');
      setPeWarehouseLocation(d.peWarehouseLocation || row.storeLocation || '');
      setPeRackNo(d.peRackNo || '');
      setPeBinNo(d.peBinNo || '');
      setPeBatchNo(d.peBatchNo || '');
      setPeSerialNo(d.peSerialNo || '');
      setPeInspectionStatus(d.peInspectionStatus || 'Pending');
      setPeQcStatus(d.peQcStatus || 'Approved');
      setPeSpareCondition(d.peSpareCondition || '');
      setPeVendorInvoiceDate(d.peVendorInvoiceDate || row.invoiceDate || '');
      setPeWarrantyStatus(d.peWarrantyStatus || '');
      setPeDeliveryStatus(d.peDeliveryStatus || 'Completed');
      setPeReceivedBy(d.peReceivedBy || row.receivedBy || '');
      setPeQcVerifiedBy(d.peQcVerifiedBy || '');
      setPeStoreApprovedBy(d.peStoreApprovedBy || '');
      setPeStatus(d.peStatus || row.status || 'Pending QC');
      setPeInvoiceUpload(d.peInvoiceUpload || '');
      setPeQcReportUpload(d.peQcReportUpload || '');
      setPeSpareImageUpload(d.peSpareImageUpload || '');

      // Fallbacks
      setPePoRef(row.poRef || d.pePoNo || '');
      setPeSupplierName(row.supplierName || d.peVendorName || '');
      setPeInvoiceNo(row.invoiceNo || d.peInvoiceNo || '');
      setPeInvoiceDate(row.invoiceDate || d.peVendorInvoiceDate || '');
      setPeGateInward(row.gateInwardRef || d.peGateInward || '');
      setPeStoreLocation(row.storeLocation || d.peWarehouseLocation || '');
      setPeReceivedBy(row.receivedBy || d.peReceivedBy || '');
      setPeRemarks(row.remarks || d.peRemarks || '');
      setPeGridItems(row.items || []);
    }
    if (activeTab === 'WorkOrder') {
      const d = row.details || {};
      setWoWorkOrderDate(d.woWorkOrderDate || row.date || '');
      setWoWorkOrderType(d.woWorkOrderType || row.type || 'Preventive Maintenance');
      setWoMachineName(d.woMachineName || row.machineType || '');
      setWoMachineCode(d.woMachineCode || row.machineNo || '');
      setWoMachineSection(d.woMachineSection || row.section || '');
      setWoMachineLocation(d.woMachineLocation || '');
      setWoComplaintNo(d.woComplaintNo || '');
      setWoComplaintDescription(d.woComplaintDescription || row.problem || '');
      setWoBreakdownReason(d.woBreakdownReason || '');
      setWoPriorityLevel(d.woPriorityLevel || row.priority || 'Medium');
      setWoMaintenanceCategory(d.woMaintenanceCategory || '');
      setWoWorkDescription(d.woWorkDescription || '');
      setWoPlannedStartDate(d.woPlannedStartDate || '');
      setWoPlannedEndDate(d.woPlannedEndDate || row.expectedDate || '');
      setWoSpareName(d.woSpareName || '');
      setWoSpareCode(d.woSpareCode || 'SPR-001');
      setWoRequiredQty(d.woRequiredQty || '');
      setWoUom(d.woUom || 'Nos');
      setWoAssignedTechnician(d.woAssignedTechnician || row.assignedTo || '');
      setWoMaintenanceTeam(d.woMaintenanceTeam || '');
      setWoSupervisorName(d.woSupervisorName || '');
      setWoSpareCost(d.woSpareCost || '');
      setWoServiceCost(d.woServiceCost || '');
      setWoEstimatedCost(d.woEstimatedCost || row.estimatedCost || '');
      setWoCompletionStatus(d.woCompletionStatus || 'Open');
      setWoActualCompletionDate(d.woActualCompletionDate || '');
      setWoDowntimeHours(d.woDowntimeHours || '');
      setWoRequestedBy(d.woRequestedBy || '');
      setWoVerifiedBy(d.woVerifiedBy || '');
      setWoApprovedBy(d.woApprovedBy || '');
      setWoStatus(d.woStatus || row.status || 'Open');
      setWoMachineImageUpload(d.woMachineImageUpload || '');
      setWoBreakdownReportUpload(d.woBreakdownReportUpload || '');
      setWoServiceReportUpload(d.woServiceReportUpload || '');
      setWoMaintenanceNotes(d.woMaintenanceNotes || '');
      setWoTechnicianNotes(d.woTechnicianNotes || '');
      setWoInternalNotes(d.woInternalNotes || '');

      // Fallbacks
      setWoType(row.type || d.woWorkOrderType || '');
      setWoSection(row.section || d.woMachineSection || '');
      setWoMachineNo(row.machineNo || d.woMachineCode || '');
      setWoMachineType(row.machineType || d.woMachineName || '');
      setWoProblem(row.problem || d.woComplaintDescription || '');
      setWoPriority(row.priority || d.woPriorityLevel || '');
      setWoAssignedTo(row.assignedTo || d.woAssignedTechnician || '');
      setWoExpectedDate(row.expectedDate || d.woPlannedEndDate || '');
      setWoEstimatedCost(row.estimatedCost || d.woEstimatedCost || '');
      setWoStatus(row.status || d.woStatus || '');
      setWoGridItems(row.items || []);
    }
    if (activeTab === 'Consumption') {
      setConWoRef(row.workOrderRef);
      setConSection(row.section);
      setConMachineNo(row.machineNo);
      setConIndentRef(row.indentRef);
      setConIssuedBy(row.issuedBy);
      setConReceivedBy(row.receivedBy);
      setConPurpose(row.purpose);
      setConRemarks(row.remarks);
      setConGridItems(row.items);
    }
    if (activeTab === 'JobWorkIssue') {
      setJwType(row.type);
      setJwPartyName(row.partyName);
      setJwContact(row.contactPerson);
      setJwMobile(row.mobileNo);
      setJwGatePass(row.gatePassNo);
      setJwExpectedReturn(row.expectedReturnDate);
      setJwPurpose(row.purpose);
      setJwAuthorizedBy(row.authorizedBy);
      setJwRemarks(row.remarks);
      setJwStatus(row.status);
      setJwGridItems(row.items);
    }
    if (activeTab === 'JobWorkRecv') {
      setJwrIssueRef(row.issueRef);
      setJwrPartyName(row.partyName);
      setJwrIssueDate(row.issueDate);
      setJwrGateInward(row.gateInwardNo);
      setJwrCharges(row.charges);
      setJwrQc(row.qcDone);
      setJwrReceivedBy(row.receivedBy);
      setJwrRemarks(row.remarks);
      setJwrStatus(row.status);
      setJwrGridItems(row.items);
    }

    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this spares transaction record?")) {
      if (activeTab === 'Sections' || activeTab === 'Spares' || activeTab === 'OpeningStock' || activeTab === 'RequestIndent' || activeTab === 'IndentApproval' || activeTab === 'PurchaseOrder' || activeTab === 'POApproval' || activeTab === 'PurchaseEntry' || activeTab === 'WorkOrder') {
        let matched = null;
        if (activeTab === 'Sections') matched = sections.find(s => s.id === id);
        if (activeTab === 'Spares') matched = spares.find(s => s.id === id);
        if (activeTab === 'OpeningStock') matched = openingStocks.find(o => o.id === id);
        if (activeTab === 'RequestIndent') matched = indents.find(i => i.id === id);
        if (activeTab === 'IndentApproval') matched = indentApprovals.find(iap => iap.id === id);
        if (activeTab === 'PurchaseOrder') matched = purchaseOrders.find(po => po.id === id);
        if (activeTab === 'POApproval') matched = poApprovals.find(poa => poa.id === id);
        if (activeTab === 'PurchaseEntry') matched = purchaseEntries.find(pe => pe.id === id);
        if (activeTab === 'WorkOrder') matched = workOrders.find(wo => wo.id === id);

        if (matched && matched.db_id) {
          try {
            await workOrderTransactionAPI.delete(matched.db_id);
            await loadData();
            alert("Deleted successfully!");
          } catch (err) {
            console.error("Failed to delete", err);
          }
          return;
        }
      }
      if (activeTab === 'Sections') setSections(sections.filter(s => s.id !== id));
      if (activeTab === 'Spares') setSpares(spares.filter(s => s.id !== id));
      if (activeTab === 'OpeningStock') setOpeningStocks(openingStocks.filter(o => o.id !== id));
      if (activeTab === 'RequestIndent') setIndents(indents.filter(i => i.id !== id));
      if (activeTab === 'IndentApproval') setIndentApprovals(indentApprovals.filter(iap => iap.id !== id));
      if (activeTab === 'PurchaseOrder') setPurchaseOrders(purchaseOrders.filter(po => po.id !== id));
      if (activeTab === 'POApproval') setPoApprovals(poApprovals.filter(poa => poa.id !== id));
      if (activeTab === 'PurchaseEntry') setPurchaseEntries(purchaseEntries.filter(pe => pe.id !== id));
      if (activeTab === 'WorkOrder') setWorkOrders(workOrders.filter(wo => wo.id !== id));
      if (activeTab === 'Consumption') setConsumptions(consumptions.filter(c => c.id !== id));
      if (activeTab === 'JobWorkIssue') setIssues(issues.filter(j => j.id !== id));
      if (activeTab === 'JobWorkRecv') setReceipts(receipts.filter(r => r.id !== id));
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {!isFormOpen ? (
        /* ========================================================================= */
        /* =========================== 1. LIST LEDGER MODE ========================= */
        /* ========================================================================= */
        <>
          {/* HEADER BAR */}
          <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <Wrench size={24} style={{ color: '#7c3aed' }} /> Spares & Maintenance Ledger Center
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
                Track machinery setups, spare requisitions, purchase flows, work orders, consumption records, and offsite job works.
              </p>
            </div>
            {/* Buttons moved below the cards */}
          </div>

          {/* DYNAMIC CARD-BASED TRANSACTION SELECTORS */}
          <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', gap: 16, marginBottom: 24, paddingBottom: 8 }}>
            {Object.values(PAGES_METADATA).filter(p => p.category === activeSection).map(p => {
              const isSelected = activeTab === p.key;
              const IconComp = p.icon;
              const cardColor = p.color || '#7c3aed';
              const r = parseInt(cardColor.slice(1, 3), 16) || 124;
              const g = parseInt(cardColor.slice(3, 5), 16) || 58;
              const b = parseInt(cardColor.slice(5, 7), 16) || 237;

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
                         <span style={{ fontWeight: 800, color: cardColor }}>-</span> Records
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC DATA TABLE PER ACTIVE TAB */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
            
            {/* Toolbar for the Data Table */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {PAGES_METADATA[activeTab]?.label || 'Transaction Records'}
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => alert('Exporting ledger files...')} style={{ fontSize: '13px', padding: '6px 12px' }}>
                  <Download size={14} style={{ marginRight: '6px' }} /> Export Ledger
                </button>
                <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed', fontSize: '13px', padding: '6px 12px' }}>
                  <Plus size={14} /> Add Transaction
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              
              {/* SECTIONS LIST */}
              {activeTab === 'Sections' && (
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
              )}

              {/* SPARES LIST */}
              {activeTab === 'Spares' && (
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

              {/* OPENING STOCK */}
              {activeTab === 'OpeningStock' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>ENTRY NO</th>
                      <th>DATE</th>
                      <th>FINANCIAL YEAR</th>
                      <th>SECTION</th>
                      <th>TOTAL STOCK VALUE</th>
                      <th>NARRATION</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openingStocks.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.financialYear}</td>
                        <td style={{ fontWeight: 600 }}>{row.section}</td>
                        <td style={{ fontWeight: 800 }}>₹ {row.totalValue.toLocaleString()}</td>
                        <td>{row.narration}</td>
                        <td>
                          <span className={`badge ${row.status === 'Confirmed' ? 'badge-active' : 'badge-pending'}`}>{row.status}</span>
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

              {/* REQUEST INDENT */}
              {activeTab === 'RequestIndent' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>INDENT NO</th>
                      <th>INDENT DATE</th>
                      <th>SECTION</th>
                      <th>MACHINE NO / TYPE</th>
                      <th>PRIORITY</th>
                      <th>REQUIRED DATE</th>
                      <th>REQUESTED BY</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indents.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.section}</td>
                        <td>{row.machineNo} ({row.machineType})</td>
                        <td style={{ fontWeight: 700, color: '#dc2626' }}>{row.priority}</td>
                        <td>{row.requiredDate}</td>
                        <td>{row.requestedBy}</td>
                        <td>
                          <span className="badge badge-pending">{row.status}</span>
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

              {/* INDENT APPROVAL */}
              {activeTab === 'IndentApproval' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>APPROVAL NO</th>
                      <th>DATE</th>
                      <th>INDENT REF</th>
                      <th>SECTION</th>
                      <th>REQUESTED BY</th>
                      <th>APPROVED BY</th>
                      <th>FORWARD TO PURCHASE</th>
                      <th>APPROVAL STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indentApprovals.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.indentRef}</td>
                        <td style={{ fontWeight: 600 }}>{row.section}</td>
                        <td>{row.requestedBy}</td>
                        <td>{row.approvedBy}</td>
                        <td style={{ fontWeight: 700 }}>{row.forwardToPurchase}</td>
                        <td>
                          <span className="badge badge-active">{row.approvalStatus}</span>
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

              {/* PURCHASE ORDER */}
              {activeTab === 'PurchaseOrder' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>PO NO</th>
                      <th>PO DATE</th>
                      <th>INDENT REF</th>
                      <th>SUPPLIER NAME</th>
                      <th>EXPECTED DELIVERY</th>
                      <th style={{ textAlign: 'right' }}>TOTAL VALUE</th>
                      <th>PAYMENT TERMS</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.indentRef}</td>
                        <td style={{ fontWeight: 650 }}>{row.supplierName}</td>
                        <td>{row.expectedDate}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>₹ {row.totalValue.toLocaleString()}</td>
                        <td>{row.paymentTerms}</td>
                        <td>
                          <span className="badge badge-pending">{row.status}</span>
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

              {/* PO APPROVAL */}
              {activeTab === 'POApproval' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>APPROVAL NO</th>
                      <th>DATE</th>
                      <th>PO REF</th>
                      <th>SUPPLIER NAME</th>
                      <th style={{ textAlign: 'right' }}>TOTAL PO VALUE</th>
                      <th>APPROVED BY</th>
                      <th>SEND TO SUPPLIER</th>
                      <th>APPROVAL STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poApprovals.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.poRef}</td>
                        <td style={{ fontWeight: 600 }}>{row.supplierName}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>₹ {row.totalPOValue.toLocaleString()}</td>
                        <td>{row.approvedBy}</td>
                        <td style={{ fontWeight: 700 }}>{row.sendToSupplier}</td>
                        <td>
                          <span className="badge badge-active">{row.approvalStatus}</span>
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

              {/* PURCHASE ENTRY */}
              {activeTab === 'PurchaseEntry' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>ENTRY NO</th>
                      <th>DATE</th>
                      <th>PO REF</th>
                      <th>SUPPLIER NAME</th>
                      <th>INVOICE NO</th>
                      <th>INVOICE DATE</th>
                      <th>GATE INWARD REF</th>
                      <th style={{ textAlign: 'right' }}>NET AMOUNT</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseEntries.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.poRef}</td>
                        <td style={{ fontWeight: 600 }}>{row.supplierName}</td>
                        <td>{row.invoiceNo}</td>
                        <td>{row.invoiceDate}</td>
                        <td>{row.gateInwardRef}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>₹ {row.netAmount.toLocaleString()}</td>
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

              {/* WORK ORDER */}
              {activeTab === 'WorkOrder' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>WORK ORDER NO</th>
                      <th>DATE</th>
                      <th>WO TYPE</th>
                      <th>SECTION</th>
                      <th>MACHINE NO / TYPE</th>
                      <th>PRIORITY</th>
                      <th>ASSIGNED TO</th>
                      <th style={{ textAlign: 'right' }}>ESTIMATED COST</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.type}</td>
                        <td style={{ fontWeight: 600 }}>{row.section}</td>
                        <td>{row.machineNo} ({row.machineType})</td>
                        <td style={{ fontWeight: 700, color: '#dc2626' }}>{row.priority}</td>
                        <td>{row.assignedTo}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>₹ {row.estimatedCost.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${row.status === 'Assigned' ? 'badge-pending' : 'badge-active'}`}>{row.status}</span>
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

              {/* CONSUMPTION */}
              {activeTab === 'Consumption' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>CONSUMPTION NO</th>
                      <th>DATE</th>
                      <th>WORK ORDER REF</th>
                      <th>SECTION</th>
                      <th>MACHINE NO</th>
                      <th>ISSUED BY</th>
                      <th>RECEIVED BY</th>
                      <th style={{ textAlign: 'right' }}>TOTAL CONSUMPTION VALUE</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumptions.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.workOrderRef}</td>
                        <td style={{ fontWeight: 600 }}>{row.section}</td>
                        <td>{row.machineNo}</td>
                        <td>{row.issuedBy}</td>
                        <td>{row.receivedBy}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>₹ {row.totalValue.toLocaleString()}</td>
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

              {/* JOB WORK ISSUE */}
              {activeTab === 'JobWorkIssue' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>ISSUE NO</th>
                      <th>ISSUE DATE</th>
                      <th>ISSUE TYPE</th>
                      <th>PARTY NAME</th>
                      <th>GATE PASS REF</th>
                      <th>EXPECTED RETURN</th>
                      <th>AUTHORIZED BY</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.type}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td>{row.gatePassNo}</td>
                        <td style={{ color: '#dc2626', fontWeight: 600 }}>{row.expectedReturnDate}</td>
                        <td>{row.authorizedBy}</td>
                        <td>
                          <span className="badge badge-pending">{row.status}</span>
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

              {/* JOB WORK RECEIVED */}
              {activeTab === 'JobWorkRecv' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>RECEIPT NO</th>
                      <th>RECEIPT DATE</th>
                      <th>ISSUE REF</th>
                      <th>PARTY NAME</th>
                      <th>GATE INWARD REF</th>
                      <th style={{ textAlign: 'right' }}>JW CHARGES</th>
                      <th>QC DONE</th>
                      <th>RECEIVED BY</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.issueRef}</td>
                        <td style={{ fontWeight: 650 }}>{row.partyName}</td>
                        <td>{row.gateInwardNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>₹ {row.charges.toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>{row.qcDone}</td>
                        <td>{row.receivedBy}</td>
                        <td>
                          <span className="badge badge-active">{row.status}</span>
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
        <div className="card animate-fade" style={{ padding: '32px', minHeight: '600px', background: 'white' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                {activeTab === 'Sections' && `Master Section Registry Setup — ${currentFormId}`}
                {activeTab === 'Spares' && `Spares Identifier Catalog Entry — ${currentFormId}`}
                {activeTab === 'OpeningStock' && `Opening Stock Entry Slip — ${currentFormId}`}
                {activeTab === 'RequestIndent' && `Spares Request Indent Form — ${currentFormId}`}
                {activeTab === 'IndentApproval' && `Request Indent Clearance Approval — ${currentFormId}`}
                {activeTab === 'PurchaseOrder' && `Purchase Order Form (Spares) — ${currentFormId}`}
                {activeTab === 'POApproval' && `Purchase Order Sanctioning — ${currentFormId}`}
                {activeTab === 'PurchaseEntry' && `Supplier Purchase Spare Inward Entry — ${currentFormId}`}
                {activeTab === 'WorkOrder' && `Maintenance Machine Work Order Setup — ${currentFormId}`}
                {activeTab === 'Consumption' && `Spare Parts Consumption Audit — ${currentFormId}`}
                {activeTab === 'JobWorkIssue' && `JobWork / HandLoan Outward Issue — ${currentFormId}`}
                {activeTab === 'JobWorkRecv' && `JobWork / HandLoan Return Receipt — ${currentFormId}`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Security and maintenance transactional tracking logs</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <X size={15} /> Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Check size={15} /> Save Transaction
              </button>
            </div>
          </div>

          {/* Multi-section tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px' }}>
            {(activeTab === 'Sections' || activeTab === 'Spares' || activeTab === 'OpeningStock' || activeTab === 'RequestIndent' || activeTab === 'IndentApproval' || activeTab === 'PurchaseOrder' || activeTab === 'POApproval' || activeTab === 'PurchaseEntry' || activeTab === 'WorkOrder' ? ['Reference Info'] : ['Reference Info', 'Transaction Setup Details', 'Grid Details Matrix']).map(tab => {
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

          {/* Form Scroll Area */}
          <div style={{ minHeight: '400px' }}>
            
            {activeFormTab === 'Reference Info' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Basic Transaction Linkage & Dates</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label>Transaction No</label>
                    <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                  </div>

                  {activeTab === 'Sections' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Section Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Section Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Section Name *</label><input type="text" className="form-control" value={secName} onChange={e => setSecName(e.target.value)} required /></div>
                          <div className="form-group"><label>Section Code *</label><input type="text" className="form-control" value={secCode} onChange={e => setSecCode(e.target.value)} required /></div>
                          <div className="form-group">
                            <label>Section Type</label>
                            <select className="form-control" value={secType} onChange={e => setSecType(e.target.value)}>
                              <option value="Production">Production</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Electrical">Electrical</option>
                              <option value="Mechanical">Mechanical</option>
                              <option value="Utility">Utility</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Department Name</label><input type="text" className="form-control" value={secDeptName} onChange={e => setSecDeptName(e.target.value)} /></div>
                          <div className="form-group"><label>Floor/Unit Name</label><input type="text" className="form-control" value={secFloorUnitName} onChange={e => setSecFloorUnitName(e.target.value)} /></div>
                          <div className="form-group"><label>Location</label><input type="text" className="form-control" value={secLocation} onChange={e => setSecLocation(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 2: Incharge Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Incharge Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Section Incharge Name</label>
                            <select className="form-control" value={secIncharge} onChange={e => { setSecIncharge(e.target.value); setSecInchargeName(e.target.value); }}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group"><label>Employee ID</label><input type="text" className="form-control" value={secEmployeeId} onChange={e => setSecEmployeeId(e.target.value)} /></div>
                          <div className="form-group"><label>Contact Number</label><input type="text" className="form-control" value={secContactNumber} onChange={e => setSecContactNumber(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 3: Machine & Store Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Machine & Store Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Machine Group</label><input type="text" className="form-control" value={secMachineGroup} onChange={e => setSecMachineGroup(e.target.value)} /></div>
                          <div className="form-group"><label>Total Machines</label><input type="number" className="form-control" value={secMachines} onChange={e => setSecMachines(e.target.value)} /></div>
                          <div className="form-group">
                            <label>Critical Machine Status</label>
                            <select className="form-control" value={secCriticalMachineStatus} onChange={e => setSecCriticalMachineStatus(e.target.value)}>
                              <option value="Critical">Critical</option>
                              <option value="Non-Critical">Non-Critical</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Spare Storage Location</label><input type="text" className="form-control" value={secSpareStorageLocation} onChange={e => setSecSpareStorageLocation(e.target.value)} /></div>
                          <div className="form-group"><label>Rack No</label><input type="text" className="form-control" value={secRackNo} onChange={e => setSecRackNo(e.target.value)} /></div>
                          <div className="form-group"><label>Bin No</label><input type="text" className="form-control" value={secBinNo} onChange={e => setSecBinNo(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 4: Status & Approvals */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Status & Approvals</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Active Status</label>
                            <select className="form-control" value={secActiveStatus} onChange={e => setSecActiveStatus(e.target.value)}>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Maintenance Required Status</label>
                            <select className="form-control" value={secMaintenanceRequiredStatus} onChange={e => setSecMaintenanceRequiredStatus(e.target.value)}>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Created By</label>
                            <select className="form-control" value={secCreatedBy} onChange={e => setSecCreatedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Verified By</label>
                            <select className="form-control" value={secVerifiedBy} onChange={e => setSecVerifiedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <select className="form-control" value={secApprovedBy} onChange={e => setSecApprovedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={secStatus} onChange={e => setSecStatus(e.target.value)}>
                              <option value="Draft">Draft</option>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 5: Remarks & Attachments */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Attachments</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Section Layout Document Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={secLayoutUpload} onChange={e => setSecLayoutUpload(e.target.value)} /></div>
                          <div className="form-group"><label>Machine List Document Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={secMachineListUpload} onChange={e => setSecMachineListUpload(e.target.value)} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Maintenance Notes</label><textarea className="form-control" rows="2" value={secMaintenanceNotes} onChange={e => setSecMaintenanceNotes(e.target.value)} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Internal Notes</label><textarea className="form-control" rows="2" value={secInternalNotes} onChange={e => setSecInternalNotes(e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Spares' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Spare Information */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Spare Name *</label><input type="text" className="form-control" value={sprName} onChange={e => setSprName(e.target.value)} required /></div>
                          <div className="form-group"><label>Spare Code *</label><input type="text" className="form-control" value={sprCode} onChange={e => setSprCode(e.target.value)} required /></div>
                          <div className="form-group">
                            <label>Spare Category</label>
                            <select className="form-control" value={sprCategory} onChange={e => setSprCategory(e.target.value)}>
                              <option value="Mechanical">Mechanical</option>
                              <option value="Electrical">Electrical</option>
                              <option value="Pneumatic">Pneumatic</option>
                              <option value="Hydraulic">Hydraulic</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Machine Name</label><input type="text" className="form-control" value={sprMachineName} onChange={e => setSprMachineName(e.target.value)} /></div>
                          <div className="form-group"><label>Machine Model</label><input type="text" className="form-control" value={sprMachineModel} onChange={e => setSprMachineModel(e.target.value)} /></div>
                          <div className="form-group">
                            <label>Machine Section</label>
                            <select className="form-control" value={sprMachineSection} onChange={e => { setSprMachineSection(e.target.value); setSprSection(e.target.value); }}>
                              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Spare Specifications */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare Specifications</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Spare Type</label><input type="text" className="form-control" value={sprType} onChange={e => setSprType(e.target.value)} /></div>
                          <div className="form-group"><label>Brand</label><input type="text" className="form-control" value={sprBrand} onChange={e => setSprBrand(e.target.value)} /></div>
                          <div className="form-group"><label>Model No</label><input type="text" className="form-control" value={sprModelNo} onChange={e => setSprModelNo(e.target.value)} /></div>
                          <div className="form-group"><label>Part No</label><input type="text" className="form-control" value={sprPartNo} onChange={e => setSprPartNo(e.target.value)} /></div>
                          <div className="form-group"><label>Size</label><input type="text" className="form-control" value={sprSize} onChange={e => setSprSize(e.target.value)} /></div>
                          <div className="form-group"><label>Material</label><input type="text" className="form-control" value={sprMaterial} onChange={e => setSprMaterial(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 3: Stock & Storage Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Stock & Storage Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Minimum Stock *</label><input type="number" className="form-control" value={sprMinStock} onChange={e => setSprMinStock(e.target.value)} required /></div>
                          <div className="form-group"><label>Maximum Stock *</label><input type="number" className="form-control" value={sprMaxStock} onChange={e => setSprMaxStock(e.target.value)} required /></div>
                          <div className="form-group"><label>Reorder Level *</label><input type="number" className="form-control" value={sprReorder} onChange={e => setSprReorder(e.target.value)} required /></div>
                          <div className="form-group"><label>Current Stock</label><input type="number" className="form-control" value={sprCurrentStock} onChange={e => setSprCurrentStock(e.target.value)} /></div>
                          <div className="form-group">
                            <label>UOM</label>
                            <select className="form-control" value={sprUom} onChange={e => setSprUom(e.target.value)}>
                              <option value="Nos">Nos</option>
                              <option value="Kgs">Kgs</option>
                              <option value="Mtrs">Mtrs</option>
                              <option value="Ltrs">Ltrs</option>
                              <option value="Sets">Sets</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Warehouse Location</label><input type="text" className="form-control" value={sprWarehouseLocation} onChange={e => setSprWarehouseLocation(e.target.value)} /></div>
                          <div className="form-group"><label>Rack No</label><input type="text" className="form-control" value={sprWarehouseRack} onChange={e => setSprWarehouseRack(e.target.value)} /></div>
                          <div className="form-group"><label>Bin No</label><input type="text" className="form-control" value={sprWarehouseBin} onChange={e => setSprWarehouseBin(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 4: Commercial & Vendor Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Commercial & Vendor Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Purchase Rate (₹) *</label><input type="number" className="form-control" value={sprPurchaseRate} onChange={e => { setSprPurchaseRate(e.target.value); setSprStandardRate(e.target.value); }} required /></div>
                          <div className="form-group"><label>Estimated Value (₹)</label><input type="number" className="form-control" value={sprEstimatedValue} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} /></div>
                          <div className="form-group">
                            <label>Preferred Vendor</label>
                            <select className="form-control" value={sprPreferredVendor} onChange={e => { setSprPreferredVendor(e.target.value); setSprSupplier(e.target.value); }}>
                              {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="form-group"><label>Vendor Code</label><input type="text" className="form-control" value={sprVendorCode} onChange={e => setSprVendorCode(e.target.value)} /></div>
                          <div className="form-group"><label>Lead Time (Days)</label><input type="number" className="form-control" value={sprLeadTime} onChange={e => setSprLeadTime(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 5: Maintenance & Approval Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Maintenance & Approval Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Critical Spare Status</label>
                            <select className="form-control" value={sprCriticalSpareStatus} onChange={e => setSprCriticalSpareStatus(e.target.value)}>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Maintenance Frequency</label><input type="text" className="form-control" placeholder="e.g. Monthly" value={sprMaintenanceFrequency} onChange={e => setSprMaintenanceFrequency(e.target.value)} /></div>
                          <div className="form-group"><label>Replacement Cycle</label><input type="text" className="form-control" placeholder="e.g. 6 Months" value={sprReplacementCycle} onChange={e => setSprReplacementCycle(e.target.value)} /></div>
                          <div className="form-group">
                            <label>Created By</label>
                            <select className="form-control" value={sprCreatedBy} onChange={e => setSprCreatedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Verified By</label>
                            <select className="form-control" value={sprVerifiedBy} onChange={e => setSprVerifiedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <select className="form-control" value={sprApprovedBy} onChange={e => setSprApprovedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={sprStatus} onChange={e => setSprStatus(e.target.value)}>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Obsolete">Obsolete</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Remarks & Attachments */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Attachments</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Spare Image Document Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={sprImageUpload} onChange={e => setSprImageUpload(e.target.value)} /></div>
                          <div className="form-group"><label>Specification Sheet Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={sprSpecSheetUpload} onChange={e => setSprSpecSheetUpload(e.target.value)} /></div>
                          <div className="form-group"><label>Vendor Quotation Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={sprVendorQuotationUpload} onChange={e => setSprVendorQuotationUpload(e.target.value)} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Technical Notes</label><textarea className="form-control" rows="2" value={sprTechnicalNotes} onChange={e => setSprTechnicalNotes(e.target.value)} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Maintenance Notes</label><textarea className="form-control" rows="2" value={sprMaintenanceNotes} onChange={e => setSprMaintenanceNotes(e.target.value)} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Internal Notes</label><textarea className="form-control" rows="2" value={sprInternalNotes} onChange={e => setSprInternalNotes(e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'OpeningStock' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Opening Entry Information */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Opening Entry Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Opening Entry No</label><input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} /></div>
                          <div className="form-group"><label>Opening Date *</label><input type="date" className="form-control" value={osDate} onChange={e => setOsDate(e.target.value)} required /></div>
                          <div className="form-group">
                            <label>Entry Type</label>
                            <select className="form-control" value={osEntryType} onChange={e => setOsEntryType(e.target.value)}>
                              <option value="Spare Opening">Spare Opening</option>
                              <option value="Tool Opening">Tool Opening</option>
                              <option value="Consumable Opening">Consumable Opening</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Spare Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Code *</label>
                            <select className="form-control" value={osSpareCode} onChange={e => setOsSpareCode(e.target.value)}>
                              {spares.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                            </select>
                          </div>
                          <div className="form-group"><label>Spare Name</label><input type="text" className="form-control" value={osSpareName} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} /></div>
                          <div className="form-group"><label>Spare Category</label><input type="text" className="form-control" value={osSpareCategory} disabled style={{ background: 'var(--bg-secondary)' }} /></div>
                          <div className="form-group"><label>Machine Name</label><input type="text" className="form-control" value={osMachineName} disabled style={{ background: 'var(--bg-secondary)' }} /></div>
                        </div>
                      </div>

                      {/* Card 3: Stock & Storage Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Stock & Storage Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Opening Quantity *</label><input type="number" className="form-control" value={osOpeningQuantity} onChange={e => setOsOpeningQuantity(e.target.value)} required /></div>
                          <div className="form-group"><label>Current Quantity</label><input type="number" className="form-control" value={osCurrentQuantity} onChange={e => setOsCurrentQuantity(e.target.value)} /></div>
                          <div className="form-group"><label>UOM</label><input type="text" className="form-control" value={osUom} disabled style={{ background: 'var(--bg-secondary)' }} /></div>
                          <div className="form-group"><label>Batch No</label><input type="text" className="form-control" value={osBatchNo} onChange={e => setOsBatchNo(e.target.value)} /></div>
                          <div className="form-group"><label>Serial No</label><input type="text" className="form-control" value={osSerialNo} onChange={e => setOsSerialNo(e.target.value)} /></div>
                          <div className="form-group"><label>Warehouse Location</label><input type="text" className="form-control" value={osWarehouseLocation} onChange={e => setOsWarehouseLocation(e.target.value)} /></div>
                          <div className="form-group"><label>Rack No</label><input type="text" className="form-control" value={osRackNo} onChange={e => setOsRackNo(e.target.value)} /></div>
                          <div className="form-group"><label>Bin No</label><input type="text" className="form-control" value={osBinNo} onChange={e => setOsBinNo(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 4: Commercial & Vendor Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Commercial & Vendor Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Unit Rate (₹) *</label><input type="number" className="form-control" value={osUnitRate} onChange={e => setOsUnitRate(e.target.value)} required /></div>
                          <div className="form-group"><label>Total Stock Value (₹)</label><input type="number" className="form-control" value={osValTotal} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} /></div>
                          <div className="form-group"><label>Vendor Name</label><input type="text" className="form-control" value={osVendorName} onChange={e => setOsVendorName(e.target.value)} /></div>
                          <div className="form-group"><label>Purchase Reference No</label><input type="text" className="form-control" value={osPurchaseReferenceNo} onChange={e => setOsPurchaseReferenceNo(e.target.value)} /></div>
                        </div>
                      </div>

                      {/* Card 5: Quality, Inventory & Approvals */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Quality, Inventory & Approvals</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Condition</label>
                            <select className="form-control" value={osSpareCondition} onChange={e => setOsSpareCondition(e.target.value)}>
                              <option value="New">New</option>
                              <option value="Good">Good</option>
                              <option value="Refurbished">Refurbished</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Inspection Status</label>
                            <select className="form-control" value={osInspectionStatus} onChange={e => setOsInspectionStatus(e.target.value)}>
                              <option value="Passed">Passed</option>
                              <option value="Pending">Pending</option>
                              <option value="Failed">Failed</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Minimum Stock Level</label><input type="number" className="form-control" value={osMinimumStockLevel} disabled style={{ background: 'var(--bg-secondary)' }} /></div>
                          <div className="form-group"><label>Reorder Level</label><input type="number" className="form-control" value={osReorderLevel} disabled style={{ background: 'var(--bg-secondary)' }} /></div>
                          <div className="form-group"><label>Critical Spare Status</label><input type="text" className="form-control" value={osCriticalSpareStatus} disabled style={{ background: 'var(--bg-secondary)' }} /></div>
                          <div className="form-group">
                            <label>Entered By</label>
                            <select className="form-control" value={osEnteredBy} onChange={e => setOsEnteredBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Verified By</label>
                            <select className="form-control" value={osVerifiedBy} onChange={e => setOsVerifiedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <select className="form-control" value={osApprovedBy} onChange={e => setOsApprovedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={osStatus} onChange={e => setOsStatus(e.target.value)}>
                              <option value="Draft">Draft</option>
                              <option value="Active">Active</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Remarks & Attachments */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Attachments</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group"><label>Opening Stock Sheet Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={osSheetUpload} onChange={e => setOsSheetUpload(e.target.value)} /></div>
                          <div className="form-group"><label>Spare Image Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={osImageUpload} onChange={e => setOsImageUpload(e.target.value)} /></div>
                          <div className="form-group"><label>Invoice Document Link</label><input type="text" className="form-control" placeholder="URL or Doc Ref" value={osInvoiceUpload} onChange={e => setOsInvoiceUpload(e.target.value)} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Stock Notes</label><textarea className="form-control" rows="2" value={osStockNotes} onChange={e => { setOsStockNotes(e.target.value); setOsNarration(e.target.value); }} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Inventory Notes</label><textarea className="form-control" rows="2" value={osInventoryNotes} onChange={e => setOsInventoryNotes(e.target.value)} /></div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Internal Notes</label><textarea className="form-control" rows="2" value={osInternalNotes} onChange={e => setOsInternalNotes(e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'RequestIndent' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Request Information */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Request Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Indent Date *</label>
                            <input type="date" className="form-control" value={indDate} onChange={e => setIndDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Request Type *</label>
                            <select className="form-control" value={indRequestType} onChange={e => setIndRequestType(e.target.value)}>
                              <option value="Spare Request">Spare Request</option>
                              <option value="Emergency Request">Emergency Request</option>
                              <option value="Breakdown Request">Breakdown Request</option>
                              <option value="Consumable Request">Consumable Request</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Priority Level *</label>
                            <select className="form-control" value={indPriorityLevel} onChange={e => setIndPriorityLevel(e.target.value)}>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Required Date *</label>
                            <input type="date" className="form-control" value={indRequiredDate} onChange={e => setIndRequiredDate(e.target.value)} required />
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Requester & Machine Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Requester & Machine Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Requested By *</label>
                            <select className="form-control" value={indRequestedBy} onChange={e => setIndRequestedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Employee ID *</label>
                            <input type="text" className="form-control" placeholder="e.g. EMP045" value={indEmployeeId} onChange={e => setIndEmployeeId(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Department Name</label>
                            <input type="text" className="form-control" value={indDeptName} onChange={e => setIndDeptName(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Section Name</label>
                            <select className="form-control" value={indSectionName} onChange={e => setIndSectionName(e.target.value)}>
                              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Machine Name *</label>
                            <input type="text" className="form-control" placeholder="e.g. Toyoda Loom" value={indMachineName} onChange={e => setIndMachineName(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Machine Code *</label>
                            <input type="text" className="form-control" placeholder="e.g. MAC-L09" value={indMachineCode} onChange={e => setIndMachineCode(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Machine Section</label>
                            <select className="form-control" value={indMachineSection} onChange={e => setIndMachineSection(e.target.value)}>
                              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Breakdown Status *</label>
                            <select className="form-control" value={indBreakdownStatus} onChange={e => setIndBreakdownStatus(e.target.value)}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Spare Details & Stock Levels */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare Details & Stock Verification</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Code *</label>
                            <select className="form-control" value={indSpareCode} onChange={e => setIndSpareCode(e.target.value)}>
                              <option value="">-- Select Spare --</option>
                              {spares.map(sp => <option key={sp.id} value={sp.id}>{sp.id} - {sp.name}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Spare Name (Auto Fill)</label>
                            <input type="text" className="form-control" value={indSpareName} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>Spare Category (Auto Fill)</label>
                            <input type="text" className="form-control" value={indSpareCategory} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Part No (Auto Fill)</label>
                            <input type="text" className="form-control" value={indPartNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Brand (Auto Fill)</label>
                            <input type="text" className="form-control" value={indBrand} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Model No (Auto Fill)</label>
                            <input type="text" className="form-control" value={indModelNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>UOM (Auto Fill)</label>
                            <input type="text" className="form-control" value={indUom} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Current Stock (Auto Fill)</label>
                            <input type="text" className="form-control" value={indCurrentStock} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Min Stock Level (Auto Fill)</label>
                            <input type="text" className="form-control" value={indMinStock} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Reorder Level (Auto Fill)</label>
                            <input type="text" className="form-control" value={indReorderLevel} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Quantity & Vendor/Maintenance details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Quantity & Maintenance Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Requested Qty *</label>
                            <input type="number" className="form-control" value={indReqQty} onChange={e => setIndReqQty(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Available Qty</label>
                            <input type="number" className="form-control" value={indAvailableQty} onChange={e => setIndAvailableQty(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Approved Qty</label>
                            <input type="number" className="form-control" value={indApprovedQty} onChange={e => setIndApprovedQty(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Preferred Vendor</label>
                            <input type="text" className="form-control" value={indPreferredVendor} onChange={e => setIndPreferredVendor(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Last Purchase Rate (₹)</label>
                            <input type="number" className="form-control" value={indLastPurchaseRate} onChange={e => setIndLastPurchaseRate(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Maintenance Type</label>
                            <select className="form-control" value={indMaintenanceType} onChange={e => setIndMaintenanceType(e.target.value)}>
                              <option value="Preventive">Preventive</option>
                              <option value="Breakdown">Breakdown</option>
                              <option value="Scheduled">Scheduled</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Work Order No Reference</label>
                            <input type="text" className="form-control" placeholder="e.g. WO-00003" value={indWorkOrderNo} onChange={e => setIndWorkOrderNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Requirement Reason *</label>
                            <input type="text" className="form-control" placeholder="Reason details" value={indReason} onChange={e => setIndReason(e.target.value)} required />
                          </div>
                        </div>
                      </div>

                      {/* Card 5: Approval & Status Tracking */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Approval & Status Tracking</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={indStatus} onChange={e => setIndStatus(e.target.value)}>
                              <option value="Draft">Draft</option>
                              <option value="Pending Approval">Pending Approval</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Issued">Issued</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Verified By</label>
                            <select className="form-control" value={indVerifiedBy} onChange={e => setIndVerifiedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <select className="form-control" value={indApprovedBy} onChange={e => setIndApprovedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Remarks & Uploads */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Uploads</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Machine Breakdown Image Link</label>
                            <input type="text" className="form-control" placeholder="URL or Doc Ref" value={indBreakdownImageUpload} onChange={e => setIndBreakdownImageUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Spare Image Link</label>
                            <input type="text" className="form-control" placeholder="URL or Doc Ref" value={indSpareImageUpload} onChange={e => setIndSpareImageUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Technical Requirement Link</label>
                            <input type="text" className="form-control" placeholder="URL or Doc Ref" value={indTechReqUpload} onChange={e => setIndTechReqUpload(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Maintenance Notes</label>
                            <textarea className="form-control" rows="2" value={indMaintenanceNotes} onChange={e => setIndMaintenanceNotes(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Store Notes</label>
                            <textarea className="form-control" rows="2" value={indStoreNotes} onChange={e => setIndStoreNotes(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Internal Notes</label>
                            <textarea className="form-control" rows="2" value={indInternalNotes} onChange={e => setIndInternalNotes(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'IndentApproval' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Approval Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Approval Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Approval Date *</label>
                            <input type="date" className="form-control" value={iapApprovalDate} onChange={e => setIapApprovalDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Approval Type *</label>
                            <select className="form-control" value={iapApprovalType} onChange={e => setIapApprovalType(e.target.value)}>
                              <option value="Stock Issue Approval">Stock Issue Approval</option>
                              <option value="Purchase Approval">Purchase Approval</option>
                              <option value="Emergency Approval">Emergency Approval</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Approval Status *</label>
                            <select className="form-control" value={iapApprovalStatus} onChange={e => setIapApprovalStatus(e.target.value)}>
                              <option value="Approved">Approved</option>
                              <option value="Partially Approved">Partially Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Hold">Hold</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Approval Level</label>
                            <select className="form-control" value={iapApprovalLevel} onChange={e => setIapApprovalLevel(e.target.value)}>
                              <option value="Level 1">Level 1</option>
                              <option value="Level 2">Level 2</option>
                              <option value="Level 3">Level 3</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Request Reference Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Request Reference Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Indent No Link *</label>
                            <select className="form-control" value={iapIndentNo} onChange={e => setIapIndentNo(e.target.value)}>
                              <option value="">-- Select Indent Reference --</option>
                              {indents.map(ind => <option key={ind.id} value={ind.id}>{ind.id} ({ind.indSpareName})</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Indent Date (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapIndentDate} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Department (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapDeptName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Section (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapSectionName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Requested By (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapRequestedBy} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Employee ID (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapEmployeeId} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Machine Name (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapMachineName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Spare Details & Stock Verification */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare Details & Stock Verification</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Code (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapSpareCode} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>Spare Name (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapSpareName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Spare Category (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapSpareCategory} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Part No (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapPartNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Brand (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapBrand} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>UOM (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapUom} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Current Stock (Auto Fill)</label>
                            <input type="text" className="form-control" value={iapCurrentStock} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Minimum Stock Status</label>
                            <input type="text" className="form-control" value={iapMinStockStatus} disabled style={{ background: 'var(--bg-secondary)', color: iapMinStockStatus === 'Below Minimum' ? '#dc2626' : '#16a34a', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>Reorder Status</label>
                            <input type="text" className="form-control" value={iapReorderStatus} disabled style={{ background: 'var(--bg-secondary)', color: iapReorderStatus === 'Reorder Level Reached' ? '#d97706' : '#16a34a', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>Critical Spare Status</label>
                            <input type="text" className="form-control" value={iapCriticalSpareStatus} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Quantity Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Quantity Verification</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Requested Quantity (Auto Fill)</label>
                            <input type="number" className="form-control" value={iapReqQty} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>Available Quantity (Auto Fill)</label>
                            <input type="number" className="form-control" value={iapAvailableQty} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Approved Quantity *</label>
                            <input type="number" className="form-control" value={iapApprovedQty} onChange={e => setIapApprovedQty(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Rejected Quantity</label>
                            <input type="number" className="form-control" value={iapRejectedQty} onChange={e => setIapRejectedQty(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 5: Purchase & Maintenance Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Purchase & Maintenance Procurement Planning</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Purchase Required? *</label>
                            <select className="form-control" value={iapPurchaseRequired} onChange={e => setIapPurchaseRequired(e.target.value)}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Preferred Vendor</label>
                            <input type="text" className="form-control" value={iapPreferredVendor} onChange={e => setIapPreferredVendor(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Expected Purchase Date</label>
                            <input type="date" className="form-control" value={iapExpectedPurchaseDate} onChange={e => setIapExpectedPurchaseDate(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Maintenance Type</label>
                            <input type="text" className="form-control" value={iapMaintenanceType} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Breakdown Priority</label>
                            <input type="text" className="form-control" value={iapBreakdownPriority} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Work Order Reference</label>
                            <input type="text" className="form-control" value={iapWorkOrderRef} onChange={e => setIapWorkOrderRef(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Approval Authority & Issue Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Approval Authority & Store Dispatch Status</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Verified By</label>
                            <select className="form-control" value={iapVerifiedBy} onChange={e => setIapVerifiedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <select className="form-control" value={iapApprovedBy} onChange={e => setIapApprovedBy(e.target.value)}>
                              {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Store Issue Status</label>
                            <select className="form-control" value={iapStoreIssueStatus} onChange={e => setIapStoreIssueStatus(e.target.value)}>
                              <option value="Pending">Pending</option>
                              <option value="Issued">Issued</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Expected Issue Date</label>
                            <input type="date" className="form-control" value={iapExpectedIssueDate} onChange={e => setIapExpectedIssueDate(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Tracking Status</label>
                            <select className="form-control" value={iapStatus} onChange={e => setIapStatus(e.target.value)}>
                              <option value="Pending">Pending</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 7: Remarks & Documentation Uploads */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Documentation Uploads</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Indent Copy Upload Link</label>
                            <input type="text" className="form-control" placeholder="URL or Doc Ref" value={iapIndentCopyUpload} onChange={e => setIapIndentCopyUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Technical Approval Link</label>
                            <input type="text" className="form-control" placeholder="URL or Doc Ref" value={iapTechApprovalUpload} onChange={e => setIapTechApprovalUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Vendor Quotation Link</label>
                            <input type="text" className="form-control" placeholder="URL or Doc Ref" value={iapVendorQuotationUpload} onChange={e => setIapVendorQuotationUpload(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Approval Notes</label>
                            <textarea className="form-control" rows="2" value={iapApprovalNotes} onChange={e => setIapApprovalNotes(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Store Remarks</label>
                            <textarea className="form-control" rows="2" value={iapStoreRemarks} onChange={e => setIapStoreRemarks(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Internal Notes</label>
                            <textarea className="form-control" rows="2" value={iapInternalNotes} onChange={e => setIapInternalNotes(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'PurchaseOrder' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Purchase Order Information */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Purchase Order Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>PO Date *</label>
                            <input type="date" className="form-control" value={poDate} onChange={e => setPoDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>PO Type</label>
                            <select className="form-control" value={poType} onChange={e => setPoType(e.target.value)}>
                              <option value="Spare Purchase">Spare Purchase</option>
                              <option value="Emergency Purchase">Emergency Purchase</option>
                              <option value="Tool Purchase">Tool Purchase</option>
                              <option value="Consumable Purchase">Consumable Purchase</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Indent No Link *</label>
                            <select className="form-control" value={poIndentNo} onChange={e => setPoIndentNo(e.target.value)}>
                              <option value="">-- Select Indent --</option>
                              {indents.map(i => <option key={i.id} value={i.id}>{i.id}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Vendor Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Vendor Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Vendor Name *</label>
                            <input type="text" className="form-control" value={poVendorName} onChange={e => setPoVendorName(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Vendor Code</label>
                            <input type="text" className="form-control" value={poVendorCode} onChange={e => setPoVendorCode(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>GST No</label>
                            <input type="text" className="form-control" value={poGstNo} onChange={e => setPoGstNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Contact Person</label>
                            <input type="text" className="form-control" value={poContactPerson} onChange={e => setPoContactPerson(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Mobile No</label>
                            <input type="text" className="form-control" value={poMobileNo} onChange={e => setPoMobileNo(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Department Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Department Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Department Name</label>
                            <input type="text" className="form-control" value={poDeptName} onChange={e => setPoDeptName(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Section Name</label>
                            <input type="text" className="form-control" value={poSectionName} onChange={e => setPoSectionName(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Requested By</label>
                            <input type="text" className="form-control" value={poRequestedBy} onChange={e => setPoRequestedBy(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Spare Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Code *</label>
                            <select className="form-control" value={poSpareCode} onChange={e => setPoSpareCode(e.target.value)}>
                              <option value="">-- Select Spare --</option>
                              {spares.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Spare Name (Auto Fill)</label>
                            <input type="text" className="form-control" value={poSpareName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Spare Category (Auto Fill)</label>
                            <input type="text" className="form-control" value={poSpareCategory} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Part No (Auto Fill)</label>
                            <input type="text" className="form-control" value={poPartNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Brand (Auto Fill)</label>
                            <input type="text" className="form-control" value={poBrand} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Model No (Auto Fill)</label>
                            <input type="text" className="form-control" value={poModelNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 5: Machine Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Machine Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Machine Name</label>
                            <input type="text" className="form-control" value={poMachineName} onChange={e => setPoMachineName(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Machine Code</label>
                            <input type="text" className="form-control" value={poMachineCode} onChange={e => setPoMachineCode(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Machine Section</label>
                            <input type="text" className="form-control" value={poMachineSection} onChange={e => setPoMachineSection(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Quantity & Delivery Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Quantity & Delivery Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Ordered Quantity *</label>
                            <input type="number" className="form-control" value={poOrderedQty} onChange={e => setPoOrderedQty(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Approved Quantity</label>
                            <input type="number" className="form-control" value={poApprovedQty} onChange={e => setPoApprovedQty(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Pending Quantity</label>
                            <input type="number" className="form-control" value={poPendingQty} onChange={e => setPoPendingQty(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>UOM</label>
                            <input type="text" className="form-control" value={poUom} onChange={e => setPoUom(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Delivery Date *</label>
                            <input type="date" className="form-control" value={poDeliveryDate} onChange={e => setPoDeliveryDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Delivery Location</label>
                            <input type="text" className="form-control" value={poDeliveryLocation} onChange={e => setPoDeliveryLocation(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Transport Details</label>
                            <input type="text" className="form-control" value={poTransportDetails} onChange={e => setPoTransportDetails(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 7: Commercial Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Commercial Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Unit Rate *</label>
                            <input type="number" className="form-control" value={poUnitRate} onChange={e => setPoUnitRate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Discount Amount</label>
                            <input type="number" className="form-control" value={poDiscount} onChange={e => setPoDiscount(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Taxable Amount (Auto)</label>
                            <input type="number" className="form-control" value={poTaxableAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>GST %</label>
                            <select className="form-control" value={poGstPercent} onChange={e => setPoGstPercent(e.target.value)}>
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>CGST (Auto)</label>
                            <input type="number" className="form-control" value={poCgst} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>SGST (Auto)</label>
                            <input type="number" className="form-control" value={poSgst} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>IGST (Auto)</label>
                            <input type="number" className="form-control" value={poIgst} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Freight Charges</label>
                            <input type="number" className="form-control" value={poFreightCharges} onChange={e => setPoFreightCharges(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Net Amount (Auto)</label>
                            <input type="number" className="form-control" value={poNetAmount} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700, color: '#7c3aed' }} />
                          </div>
                          <div className="form-group">
                            <label>Quotation No</label>
                            <input type="text" className="form-control" value={poQuotationNo} onChange={e => setPoQuotationNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Purchase Terms</label>
                            <input type="text" className="form-control" value={poPurchaseTerms} onChange={e => setPoPurchaseTerms(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 4' }}>
                            <label>Warranty Details</label>
                            <input type="text" className="form-control" value={poWarrantyDetails} onChange={e => setPoWarrantyDetails(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 8: Approval & Attachments */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Approval, Status & Attachments</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Prepared By</label>
                            <input type="text" className="form-control" value={poPreparedBy} onChange={e => setPoPreparedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Verified By</label>
                            <input type="text" className="form-control" value={poVerifiedBy} onChange={e => setPoVerifiedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <input type="text" className="form-control" value={poApprovedBy} onChange={e => setPoApprovedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={poStatus} onChange={e => setPoStatus(e.target.value)}>
                              <option value="Draft">Draft</option>
                              <option value="Active">Active</option>
                              <option value="Hold">Hold</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Vendor Quotation Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/quotation.pdf" value={poVendorQuotationUpload} onChange={e => setPoVendorQuotationUpload(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Technical Spec Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/specs.pdf" value={poTechSpecUpload} onChange={e => setPoTechSpecUpload(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Purchase Request Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/request.pdf" value={poPurchaseRequestUpload} onChange={e => setPoPurchaseRequestUpload(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 9: Remarks */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Purchase Notes</label>
                            <textarea className="form-control" rows="2" value={poPurchaseNotes} onChange={e => setPoPurchaseNotes(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Vendor Notes</label>
                            <textarea className="form-control" rows="2" value={poVendorNotes} onChange={e => setPoVendorNotes(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Internal Notes</label>
                            <textarea className="form-control" rows="2" value={poInternalNotes} onChange={e => setPoInternalNotes(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'POApproval' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Approval & PO Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Approval & PO Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Approval Date *</label>
                            <input type="date" className="form-control" value={poaApprovalDate} onChange={e => setPoaApprovalDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Approval Type</label>
                            <select className="form-control" value={poaApprovalType} onChange={e => setPoaApprovalType(e.target.value)}>
                              <option value="Standard Approval">Standard Approval</option>
                              <option value="Emergency Approval">Emergency Approval</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>PO No Link *</label>
                            <select className="form-control" value={poaPoNo} onChange={e => setPoaPoNo(e.target.value)}>
                              <option value="">-- Select PO --</option>
                              {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.id}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>PO Date (Auto)</label>
                            <input type="text" className="form-control" value={poaPoDate} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Indent No (Auto)</label>
                            <input type="text" className="form-control" value={poaIndentNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Department Name (Auto)</label>
                            <input type="text" className="form-control" value={poaDeptName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Vendor Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Vendor Details (Auto Filled)</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Vendor Name</label>
                            <input type="text" className="form-control" value={poaVendorName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Vendor Code</label>
                            <input type="text" className="form-control" value={poaVendorCode} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>GST No</label>
                            <input type="text" className="form-control" value={poaGstNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Spare & Quantity Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare & Quantity Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Code (Auto)</label>
                            <input type="text" className="form-control" value={poaSpareCode} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Spare Name (Auto)</label>
                            <input type="text" className="form-control" value={poaSpareName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Category (Auto)</label>
                            <input type="text" className="form-control" value={poaSpareCategory} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Part No (Auto)</label>
                            <input type="text" className="form-control" value={poaPartNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Brand (Auto)</label>
                            <input type="text" className="form-control" value={poaBrand} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Ordered Qty (Auto)</label>
                            <input type="number" className="form-control" value={poaOrderedQty} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Approved Qty *</label>
                            <input type="number" className="form-control" value={poaApprovedQty} onChange={e => setPoaApprovedQty(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Pending Qty</label>
                            <input type="number" className="form-control" value={poaPendingQty} onChange={e => setPoaPendingQty(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>UOM (Auto)</label>
                            <input type="text" className="form-control" value={poaUom} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Commercial & Stock Verification */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Commercial & Stock Verification</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Unit Rate (Auto)</label>
                            <input type="number" className="form-control" value={poaUnitRate} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Total PO Value (Auto)</label>
                            <input type="number" className="form-control" value={poaTotalAmount} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>Tax Verification</label>
                            <select className="form-control" value={poaTaxVerification} onChange={e => setPoaTaxVerification(e.target.value)}>
                              <option value="Verified">Verified</option>
                              <option value="Pending Correction">Pending Correction</option>
                              <option value="GST Discrepancy">GST Discrepancy</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Budget Status</label>
                            <select className="form-control" value={poaBudgetStatus} onChange={e => setPoaBudgetStatus(e.target.value)}>
                              <option value="Within Budget">Within Budget</option>
                              <option value="Exceeded - MD Approval Reqd">Exceeded - MD Approval Reqd</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Current Stock</label>
                            <input type="number" className="form-control" placeholder="e.g. 5" value={poaCurrentStock} onChange={e => setPoaCurrentStock(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Minimum Stock Level</label>
                            <input type="number" className="form-control" placeholder="e.g. 2" value={poaMinStockLevel} onChange={e => setPoaMinStockLevel(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Reorder Status</label>
                            <select className="form-control" value={poaReorderStatus} onChange={e => setPoaReorderStatus(e.target.value)}>
                              <option value="Normal">Normal</option>
                              <option value="Reorder">Reorder</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Critical Spare Status</label>
                            <select className="form-control" value={poaCriticalSpareStatus} onChange={e => setPoaCriticalSpareStatus(e.target.value)}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 5: Delivery & Decision Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Delivery & Decision Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Expected Delivery Date *</label>
                            <input type="date" className="form-control" value={poaExpectedDeliveryDate} onChange={e => setPoaExpectedDeliveryDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Delivery & Payment Terms</label>
                            <input type="text" className="form-control" value={poaDeliveryTerms} onChange={e => setPoaDeliveryTerms(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Approval Decision *</label>
                            <select className="form-control" value={poaApprovalStatus} onChange={e => setPoaApprovalStatus(e.target.value)} required>
                              <option value="Approved">Approved</option>
                              <option value="Partially Approved">Partially Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Hold">Hold</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={poaStatus} onChange={e => setPoaStatus(e.target.value)}>
                              <option value="Pending">Pending</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Verified By</label>
                            <input type="text" className="form-control" value={poaVerifiedBy} onChange={e => setPoaVerifiedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <input type="text" className="form-control" value={poaApprovedBy} onChange={e => setPoaApprovedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Approval Level</label>
                            <select className="form-control" value={poaApprovalLevel} onChange={e => setPoaApprovalLevel(e.target.value)}>
                              <option value="Level 1">Level 1</option>
                              <option value="Level 2">Level 2</option>
                              <option value="MD Level">MD Level</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Remarks & Uploads */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Uploads</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>PO Copy Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/po.pdf" value={poaCopyUpload} onChange={e => setPoaCopyUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Quotation Link (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/quotation.pdf" value={poaQuotationUpload} onChange={e => setPoaQuotationUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Tech Approval Link (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/tech_approval.pdf" value={poaTechApprovalUpload} onChange={e => setPoaTechApprovalUpload(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Approval Notes</label>
                            <textarea className="form-control" rows="2" value={poaApprovalNotes} onChange={e => setPoaApprovalNotes(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Accounts Remarks</label>
                            <textarea className="form-control" rows="2" value={poaAccountsRemarks} onChange={e => setPoaAccountsRemarks(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Internal Notes</label>
                            <textarea className="form-control" rows="2" value={poaInternalNotes} onChange={e => setPoaInternalNotes(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'PurchaseEntry' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Purchase Entry Information */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Purchase Entry Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Entry Date *</label>
                            <input type="date" className="form-control" value={peEntryDate} onChange={e => setPeEntryDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Entry Type</label>
                            <select className="form-control" value={peEntryType} onChange={e => setPeEntryType(e.target.value)}>
                              <option value="Spare Purchase">Spare Purchase</option>
                              <option value="Tool Purchase">Tool Purchase</option>
                              <option value="Consumable Purchase">Consumable Purchase</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Reference Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Reference Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>PO No Link *</label>
                            <select className="form-control" value={pePoNo} onChange={e => setPePoNo(e.target.value)}>
                              <option value="">-- Select PO --</option>
                              {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.id}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Invoice No *</label>
                            <input type="text" className="form-control" value={peInvoiceNo} onChange={e => setPeInvoiceNo(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Challan No</label>
                            <input type="text" className="form-control" value={peChallanNo} onChange={e => setPeChallanNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Vendor Name (Auto)</label>
                            <input type="text" className="form-control" value={peVendorName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Spare & Machine Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare & Machine Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Code (Auto)</label>
                            <input type="text" className="form-control" value={peSpareCode} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Spare Name (Auto)</label>
                            <input type="text" className="form-control" value={peSpareName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Spare Category (Auto)</label>
                            <input type="text" className="form-control" value={peSpareCategory} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Part No (Auto)</label>
                            <input type="text" className="form-control" value={pePartNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Brand (Auto)</label>
                            <input type="text" className="form-control" value={peBrand} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Machine Name</label>
                            <input type="text" className="form-control" value={peMachineName} onChange={e => setPeMachineName(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Machine Section</label>
                            <input type="text" className="form-control" value={peMachineSection} onChange={e => setPeMachineSection(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Quantity Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Quantity Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Ordered Qty (Auto)</label>
                            <input type="number" className="form-control" value={peOrderedQty} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Received Qty *</label>
                            <input type="number" className="form-control" value={peReceivedQty} onChange={e => setPeReceivedQty(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Rejected Qty</label>
                            <input type="number" className="form-control" value={peRejectedQty} onChange={e => setPeRejectedQty(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Accepted Qty (Auto)</label>
                            <input type="number" className="form-control" value={peAcceptedQty} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>UOM (Auto)</label>
                            <input type="text" className="form-control" value={peUom} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 5: Commercial & Stock Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Commercial & Stock Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Purchase Rate (Auto)</label>
                            <input type="number" className="form-control" value={pePurchaseRate} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Taxable Amount (Auto)</label>
                            <input type="number" className="form-control" value={peTaxableAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>GST % (Auto)</label>
                            <input type="number" className="form-control" value={peGstPercent} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Total Amount (Auto)</label>
                            <input type="number" className="form-control" value={peTotalAmount} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                          </div>
                          <div className="form-group">
                            <label>Warehouse Location *</label>
                            <input type="text" className="form-control" value={peWarehouseLocation} onChange={e => setPeWarehouseLocation(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Rack No</label>
                            <input type="text" className="form-control" value={peRackNo} onChange={e => setPeRackNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Bin No</label>
                            <input type="text" className="form-control" value={peBinNo} onChange={e => setPeBinNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Batch No</label>
                            <input type="text" className="form-control" value={peBatchNo} onChange={e => setPeBatchNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Serial No</label>
                            <input type="text" className="form-control" value={peSerialNo} onChange={e => setPeSerialNo(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Quality & Approval Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Quality & Approval Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Inspection Status</label>
                            <select className="form-control" value={peInspectionStatus} onChange={e => setPeInspectionStatus(e.target.value)}>
                              <option value="Pending">Pending</option>
                              <option value="Passed">Passed</option>
                              <option value="Failed">Failed</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>QC Status</label>
                            <select className="form-control" value={peQcStatus} onChange={e => setPeQcStatus(e.target.value)}>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Hold">Hold</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Spare Condition</label>
                            <input type="text" className="form-control" value={peSpareCondition} onChange={e => setPeSpareCondition(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Vendor Invoice Date *</label>
                            <input type="date" className="form-control" value={peVendorInvoiceDate} onChange={e => setPeVendorInvoiceDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Warranty Status</label>
                            <input type="text" className="form-control" value={peWarrantyStatus} onChange={e => setPeWarrantyStatus(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Delivery Status</label>
                            <select className="form-control" value={peDeliveryStatus} onChange={e => setPeDeliveryStatus(e.target.value)}>
                              <option value="Completed">Completed</option>
                              <option value="Short Delivery">Short Delivery</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Received By</label>
                            <input type="text" className="form-control" value={peReceivedBy} onChange={e => setPeReceivedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>QC Verified By</label>
                            <input type="text" className="form-control" value={peQcVerifiedBy} onChange={e => setPeQcVerifiedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Store Approved By</label>
                            <input type="text" className="form-control" value={peStoreApprovedBy} onChange={e => setPeStoreApprovedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={peStatus} onChange={e => setPeStatus(e.target.value)}>
                              <option value="Pending QC">Pending QC</option>
                              <option value="Approved">Approved</option>
                              <option value="Stock Updated">Stock Updated</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 7: Remarks & Documentation */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Documentation</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Invoice Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/invoice.pdf" value={peInvoiceUpload} onChange={e => setPeInvoiceUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>QC Report Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/qc.pdf" value={peQcReportUpload} onChange={e => setPeQcReportUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Spare Image Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/spare.jpg" value={peSpareImageUpload} onChange={e => setPeSpareImageUpload(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'WorkOrder' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Card 1: Work Order Information */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Work Order Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Work Order Date *</label>
                            <input type="date" className="form-control" value={woWorkOrderDate} onChange={e => setWoWorkOrderDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Work Order Type</label>
                            <select className="form-control" value={woWorkOrderType} onChange={e => setWoWorkOrderType(e.target.value)}>
                              <option value="Preventive Maintenance">Preventive Maintenance</option>
                              <option value="Breakdown Maintenance">Breakdown Maintenance</option>
                              <option value="Electrical Work">Electrical Work</option>
                              <option value="Mechanical Work">Mechanical Work</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Machine Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Machine Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Machine Name *</label>
                            <input type="text" className="form-control" value={woMachineName} onChange={e => setWoMachineName(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Machine Code *</label>
                            <input type="text" className="form-control" value={woMachineCode} onChange={e => setWoMachineCode(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Machine Section</label>
                            <input type="text" className="form-control" value={woMachineSection} onChange={e => setWoMachineSection(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Machine Location</label>
                            <input type="text" className="form-control" value={woMachineLocation} onChange={e => setWoMachineLocation(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Complaint & Maintenance Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Complaint & Maintenance Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Complaint No</label>
                            <input type="text" className="form-control" value={woComplaintNo} onChange={e => setWoComplaintNo(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Priority Level</label>
                            <select className="form-control" value={woPriorityLevel} onChange={e => setWoPriorityLevel(e.target.value)}>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Maintenance Category</label>
                            <input type="text" className="form-control" value={woMaintenanceCategory} onChange={e => setWoMaintenanceCategory(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Planned Start Date *</label>
                            <input type="date" className="form-control" value={woPlannedStartDate} onChange={e => setWoPlannedStartDate(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Planned End Date *</label>
                            <input type="date" className="form-control" value={woPlannedEndDate} onChange={e => setWoPlannedEndDate(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 4' }}>
                            <label>Complaint Description</label>
                            <input type="text" className="form-control" value={woComplaintDescription} onChange={e => setWoComplaintDescription(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 4' }}>
                            <label>Breakdown Reason</label>
                            <input type="text" className="form-control" value={woBreakdownReason} onChange={e => setWoBreakdownReason(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 4' }}>
                            <label>Detailed Work Description</label>
                            <textarea className="form-control" rows="2" value={woWorkDescription} onChange={e => setWoWorkDescription(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Spare Requirement Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Spare Requirement Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Spare Code *</label>
                            <select className="form-control" value={woSpareCode} onChange={e => setWoSpareCode(e.target.value)}>
                              <option value="">-- Select Spare --</option>
                              {spares.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Spare Name (Auto)</label>
                            <input type="text" className="form-control" value={woSpareName} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                          <div className="form-group">
                            <label>Required Qty *</label>
                            <input type="number" className="form-control" value={woRequiredQty} onChange={e => setWoRequiredQty(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>UOM (Auto)</label>
                            <input type="text" className="form-control" value={woUom} disabled style={{ background: 'var(--bg-secondary)' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 5: Technician & Cost Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Technician & Cost Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Assigned Technician *</label>
                            <input type="text" className="form-control" value={woAssignedTechnician} onChange={e => setWoAssignedTechnician(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Maintenance Team</label>
                            <input type="text" className="form-control" value={woMaintenanceTeam} onChange={e => setWoMaintenanceTeam(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Supervisor Name</label>
                            <input type="text" className="form-control" value={woSupervisorName} onChange={e => setWoSupervisorName(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Spare Cost</label>
                            <input type="number" className="form-control" value={woSpareCost} onChange={e => setWoSpareCost(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Service Cost</label>
                            <input type="number" className="form-control" value={woServiceCost} onChange={e => setWoServiceCost(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Estimated Cost (Auto)</label>
                            <input type="number" className="form-control" value={woEstimatedCost} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                          </div>
                        </div>
                      </div>

                      {/* Card 6: Completion & Approval Details */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Completion & Approval Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Completion Status</label>
                            <select className="form-control" value={woCompletionStatus} onChange={e => setWoCompletionStatus(e.target.value)}>
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Hold">Hold</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Actual Completion Date</label>
                            <input type="date" className="form-control" value={woActualCompletionDate} onChange={e => setWoActualCompletionDate(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Downtime Hours</label>
                            <input type="number" className="form-control" value={woDowntimeHours} onChange={e => setWoDowntimeHours(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Requested By</label>
                            <input type="text" className="form-control" value={woRequestedBy} onChange={e => setWoRequestedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Verified By</label>
                            <input type="text" className="form-control" value={woVerifiedBy} onChange={e => setWoVerifiedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Approved By</label>
                            <input type="text" className="form-control" value={woApprovedBy} onChange={e => setWoApprovedBy(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Status Tracking</label>
                            <select className="form-control" value={woStatus} onChange={e => setWoStatus(e.target.value)}>
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Hold">Hold</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Card 7: Remarks & Documentation */}
                      <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}>
                        <h4 style={{ color: '#7c3aed', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Remarks & Documentation</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          <div className="form-group">
                            <label>Machine Image Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/machine.jpg" value={woMachineImageUpload} onChange={e => setWoMachineImageUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Breakdown Report Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/breakdown.pdf" value={woBreakdownReportUpload} onChange={e => setWoBreakdownReportUpload(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Service Report Upload (URL)</label>
                            <input type="text" className="form-control" placeholder="https://example.com/service.pdf" value={woServiceReportUpload} onChange={e => setWoServiceReportUpload(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Maintenance Notes</label>
                            <textarea className="form-control" rows="2" value={woMaintenanceNotes} onChange={e => setWoMaintenanceNotes(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Technician Notes</label>
                            <textarea className="form-control" rows="2" value={woTechnicianNotes} onChange={e => setWoTechnicianNotes(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 3' }}>
                            <label>Internal Notes</label>
                            <textarea className="form-control" rows="2" value={woInternalNotes} onChange={e => setWoInternalNotes(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Consumption' && (
                    <>
                      <div className="form-group">
                        <label>Work Order Ref Link *</label>
                        <select className="form-control" value={conWoRef} onChange={e => setConWoRef(e.target.value)}>
                          {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Section (Auto Fill)</label>
                        <input type="text" className="form-control" value={conSection} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Machine No. (Auto Fill)</label>
                        <input type="text" className="form-control" value={conMachineNo} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </>
                  )}

                  {activeTab === 'JobWorkIssue' && (
                    <>
                      <div className="form-group">
                        <label>Issue Type *</label>
                        <select className="form-control" value={jwType} onChange={e => setJwType(e.target.value)}>
                          <option value="Job Work">Job Work</option>
                          <option value="Hand Loan">Hand Loan</option>
                          <option value="Repair & Return">Repair & Return</option>
                          <option value="Trial Basis">Trial Basis</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Party Master Name *</label>
                        <select className="form-control" value={jwPartyName} onChange={e => setJwPartyName(e.target.value)}>
                          {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Gate Pass Link *</label>
                        <input type="text" className="form-control" placeholder="GP-xxxx link" value={jwGatePass} onChange={e => setJwGatePass(e.target.value)} required />
                      </div>
                    </>
                  )}

                  {activeTab === 'JobWorkRecv' && (
                    <>
                      <div className="form-group">
                        <label>Issue Ref Link *</label>
                        <select className="form-control" value={jwrIssueRef} onChange={e => setJwrIssueRef(e.target.value)}>
                          {issues.map(i => <option key={i.id} value={i.id}>{i.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Party Name (Auto Fill)</label>
                        <input type="text" className="form-control" value={jwrPartyName} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Gate Inward Link *</label>
                        <input type="text" className="form-control" placeholder="GIN-xxxx link" value={jwrGateInward} onChange={e => setJwrGateInward(e.target.value)} required />
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}

            {activeFormTab === 'Transaction Setup Details' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Detailed Settings & Remarks</h4>
                
                {activeTab === 'RequestIndent' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Priority *</label>
                      <select className="form-control" value={indPriority} onChange={e => setIndPriority(e.target.value)}>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Required Date *</label>
                      <input type="date" className="form-control" value={indRequiredDate} onChange={e => setIndRequiredDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Requested By *</label>
                      <select className="form-control" value={indRequestedBy} onChange={e => setIndRequestedBy(e.target.value)}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'PurchaseOrder' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Supplier Contact Person *</label>
                        <input type="text" className="form-control" value={poContact} onChange={e => setPoContact(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Mobile Number *</label>
                        <input type="number" className="form-control" value={poMobile} onChange={e => setPoMobile(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>GSTIN (Auto Fill)</label>
                        <input type="text" className="form-control" value={poGstin} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms *</label>
                        <select className="form-control" value={poPaymentTerms} onChange={e => setPoPaymentTerms(e.target.value)}>
                          <option value="15 Days">15 Days</option>
                          <option value="30 Days">30 Days</option>
                          <option value="60 Days">60 Days</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Supplier Delivery Physical Address *</label>
                      <input type="text" className="form-control" value={poAddress} onChange={e => setPoAddress(e.target.value)} required />
                    </div>
                  </>
                )}

                {activeTab === 'PurchaseEntry' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Supplier Invoice No *</label>
                      <input type="text" className="form-control" value={peInvoiceNo} onChange={e => setPeInvoiceNo(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Supplier Invoice Date *</label>
                      <input type="date" className="form-control" value={peInvoiceDate} onChange={e => setPeInvoiceDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Store Placement Location *</label>
                      <input type="text" className="form-control" value={peStoreLocation} onChange={e => setPeStoreLocation(e.target.value)} required />
                    </div>
                  </div>
                )}

                {activeTab === 'WorkOrder' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Machine Type *</label>
                      <select className="form-control" value={woMachineType} onChange={e => setWoMachineType(e.target.value)}>
                        <option value="Airjet Loom">Airjet Loom</option>
                        <option value="Dyeing Vessel">Dyeing Vessel</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority *</label>
                      <select className="form-control" value={woPriority} onChange={e => setWoPriority(e.target.value)}>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assigned Mechanic *</label>
                      <select className="form-control" value={woAssignedTo} onChange={e => setWoAssignedTo(e.target.value)}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Expected Completion *</label>
                      <input type="date" className="form-control" value={woExpectedDate} onChange={e => setWoExpectedDate(e.target.value)} required />
                    </div>
                  </div>
                )}

                {activeTab === 'JobWorkIssue' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Supplier Contact *</label>
                      <input type="text" className="form-control" value={jwContact} onChange={e => setJwContact(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Mobile No *</label>
                      <input type="number" className="form-control" value={jwMobile} onChange={e => setJwMobile(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Expected Return Date *</label>
                      <input type="date" className="form-control" value={jwExpectedReturn} onChange={e => setJwExpectedReturn(e.target.value)} required />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Problem Description / Narration / Purpose *</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Enter narration notes..."
                    value={
                      activeTab === 'OpeningStock' ? osNarration :
                      activeTab === 'RequestIndent' ? indReason :
                      activeTab === 'IndentApproval' ? iapRemarks :
                      activeTab === 'PurchaseOrder' ? poNarration :
                      activeTab === 'POApproval' ? poaRemarks :
                      activeTab === 'PurchaseEntry' ? peRemarks :
                      activeTab === 'WorkOrder' ? woProblem :
                      activeTab === 'Consumption' ? conPurpose :
                      activeTab === 'JobWorkIssue' ? jwPurpose : jwrRemarks
                    }
                    onChange={e => {
                      const v = e.target.value;
                      if (activeTab === 'OpeningStock') setOsNarration(v);
                      if (activeTab === 'RequestIndent') setIndReason(v);
                      if (activeTab === 'IndentApproval') setIapRemarks(v);
                      if (activeTab === 'PurchaseOrder') setPoNarration(v);
                      if (activeTab === 'POApproval') setPoaRemarks(v);
                      if (activeTab === 'PurchaseEntry') setPeRemarks(v);
                      if (activeTab === 'WorkOrder') setWoProblem(v);
                      if (activeTab === 'Consumption') setConPurpose(v);
                      if (activeTab === 'JobWorkIssue') setJwPurpose(v);
                      if (activeTab === 'JobWorkRecv') setJwrRemarks(v);
                    }}
                    required
                  />
                </div>

              </div>
            )}

            {activeFormTab === 'Grid Details Matrix' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Dynamically renders sub-tables for grid items */}
                
                {/* 1. OPENING STOCK GRID */}
                {activeTab === 'OpeningStock' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Opening Stock Details Grid</h4>
                      <button type="button" className="btn btn-secondary" onClick={handleAddOsGridRow} style={{ padding: '4px 10px', fontSize: '11px' }}><PlusCircle size={12} /> Add Row</button>
                    </div>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Part Name *</th>
                          <th style={{ width: '120px' }}>UOM</th>
                          <th style={{ width: '130px' }}>Opening Qty *</th>
                          <th style={{ width: '150px' }}>Rate per Unit *</th>
                          <th style={{ width: '150px' }}>Total Value</th>
                          <th style={{ width: '60px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {osGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.spareCode} onChange={e => handleOsGridChange(idx, 'spareCode', e.target.value)}>
                                {SPARES.map(sp => <option key={sp.code} value={sp.code}>{sp.name}</option>)}
                              </select>
                            </td>
                            <td>{item.unit}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.qty} onChange={e => handleOsGridChange(idx, 'qty', Number(e.target.value))} required />
                            </td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.rate} onChange={e => handleOsGridChange(idx, 'rate', Number(e.target.value))} required />
                            </td>
                            <td style={{ fontWeight: 700 }}>₹ {item.value.toLocaleString()}</td>
                            <td>
                              <button type="button" onClick={() => handleRemoveOsGridRow(idx)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }} disabled={osGridItems.length === 1}><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 2. REQUEST INDENT GRID */}
                {activeTab === 'RequestIndent' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Request Indent Parts Grid</h4>
                      <button type="button" className="btn btn-secondary" onClick={handleAddIndGridRow} style={{ padding: '4px 10px', fontSize: '11px' }}><PlusCircle size={12} /> Add Row</button>
                    </div>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Part Name *</th>
                          <th style={{ width: '110px' }}>Current Stock</th>
                          <th style={{ width: '120px' }}>Required Qty *</th>
                          <th style={{ width: '110px' }}>UOM</th>
                          <th>Purpose *</th>
                          <th style={{ width: '60px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.spareCode} onChange={e => handleIndGridChange(idx, 'spareCode', e.target.value)}>
                                {SPARES.map(sp => <option key={sp.code} value={sp.code}>{sp.name}</option>)}
                              </select>
                            </td>
                            <td style={{ fontWeight: 600 }}>{item.currentStock}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.requiredQty} onChange={e => handleIndGridChange(idx, 'requiredQty', Number(e.target.value))} required />
                            </td>
                            <td>{item.unit}</td>
                            <td>
                              <input type="text" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.purpose} onChange={e => handleIndGridChange(idx, 'purpose', e.target.value)} required />
                            </td>
                            <td>
                              <button type="button" onClick={() => handleRemoveIndGridRow(idx)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }} disabled={indGridItems.length === 1}><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 3. INDENT APPROVAL GRID */}
                {activeTab === 'IndentApproval' && (
                  <>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Approved Indent Quantities</h4>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Part Name</th>
                          <th style={{ width: '120px' }}>Requested Qty</th>
                          <th style={{ width: '120px' }}>Current Stock</th>
                          <th style={{ width: '140px' }}>Approved Qty *</th>
                          <th>Decision *</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iapGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 650 }}>{item.name}</td>
                            <td>{item.reqQty}</td>
                            <td>{item.currentStock}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.approvedQty} onChange={e => handleIapGridChange(idx, 'approvedQty', Number(e.target.value))} required />
                            </td>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.action} onChange={e => handleIapGridChange(idx, 'action', e.target.value)}>
                                <option value="Approve">Approve</option>
                                <option value="Partial Approve">Partial Approve</option>
                                <option value="Reject">Reject</option>
                                <option value="Hold">Hold</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 4. PURCHASE ORDER GRID */}
                {activeTab === 'PurchaseOrder' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Purchase Order Item matrix</h4>
                      <button type="button" className="btn btn-secondary" onClick={handleAddPoGridRow} style={{ padding: '4px 10px', fontSize: '11px' }}><PlusCircle size={12} /> Add Row</button>
                    </div>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Part Name *</th>
                          <th style={{ width: '110px' }}>Qty *</th>
                          <th style={{ width: '100px' }}>UOM</th>
                          <th style={{ width: '120px' }}>Rate *</th>
                          <th style={{ width: '100px' }}>GST %</th>
                          <th style={{ width: '120px' }}>GST Amount</th>
                          <th style={{ width: '130px' }}>Total Amount</th>
                          <th style={{ width: '60px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.spareCode} onChange={e => handlePoGridChange(idx, 'spareCode', e.target.value)}>
                                {SPARES.map(sp => <option key={sp.code} value={sp.code}>{sp.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.qty} onChange={e => handlePoGridChange(idx, 'qty', Number(e.target.value))} required />
                            </td>
                            <td>{item.unit}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.rate} onChange={e => handlePoGridChange(idx, 'rate', Number(e.target.value))} required />
                            </td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.gstPercent} onChange={e => handlePoGridChange(idx, 'gstPercent', Number(e.target.value))} required />
                            </td>
                            <td>₹ {item.gstAmount.toLocaleString()}</td>
                            <td style={{ fontWeight: 700 }}>₹ {item.totalAmount.toLocaleString()}</td>
                            <td>
                              <button type="button" onClick={() => handleRemovePoGridRow(idx)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }} disabled={poGridItems.length === 1}><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 5. PO APPROVAL GRID */}
                {activeTab === 'POApproval' && (
                  <>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Approved Spare PO Rates</h4>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Name</th>
                          <th style={{ width: '120px' }}>PO Quantity</th>
                          <th style={{ width: '130px' }}>Standard Rate</th>
                          <th style={{ width: '150px' }}>Approved Rate *</th>
                          <th style={{ width: '150px' }}>Approved Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poaGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 650 }}>{item.name}</td>
                            <td>{item.qty}</td>
                            <td>₹ {item.rate.toLocaleString()}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.approvedRate} onChange={e => handlePoaGridChange(idx, 'approvedRate', Number(e.target.value))} required />
                            </td>
                            <td style={{ fontWeight: 800, color: '#16a34a' }}>₹ {item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 6. PURCHASE ENTRY RECEIVED GRID */}
                {activeTab === 'PurchaseEntry' && (
                  <>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Goods Receipts Spare Matching</h4>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Part Name</th>
                          <th style={{ width: '100px' }}>PO Qty</th>
                          <th style={{ width: '120px' }}>Received Qty *</th>
                          <th style={{ width: '110px' }}>Pending Qty</th>
                          <th style={{ width: '120px' }}>PO Rate</th>
                          <th style={{ width: '130px' }}>Net Total</th>
                          <th>Condition Check *</th>
                        </tr>
                      </thead>
                      <tbody>
                        {peGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 650 }}>{item.name}</td>
                            <td>{item.poQty}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.receivedQty} onChange={e => handlePeGridChange(idx, 'receivedQty', Number(e.target.value))} required />
                            </td>
                            <td style={{ fontWeight: 700, color: '#dc2626' }}>{item.pendingQty}</td>
                            <td>₹ {item.rate.toLocaleString()}</td>
                            <td style={{ fontWeight: 700 }}>₹ {item.amount.toLocaleString()}</td>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.condition} onChange={e => handlePeGridChange(idx, 'condition', e.target.value)}>
                                <option value="Good">Good Condition</option>
                                <option value="Minor Scratch">Minor Scratch</option>
                                <option value="Damaged">Damaged / Rejected</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 7. WORK ORDER GRID */}
                {activeTab === 'WorkOrder' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Planned Spares for Work Order</h4>
                      <button type="button" className="btn btn-secondary" onClick={handleAddWoGridRow} style={{ padding: '4px 10px', fontSize: '11px' }}><PlusCircle size={12} /> Add Row</button>
                    </div>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Name *</th>
                          <th style={{ width: '150px' }}>Planned Quantity *</th>
                          <th style={{ width: '60px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {woGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.name} onChange={e => handleWoGridChange(idx, 'name', e.target.value)}>
                                {SPARES.map(sp => <option key={sp.code} value={sp.name}>{sp.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.qty} onChange={e => handleWoGridChange(idx, 'qty', Number(e.target.value))} required />
                            </td>
                            <td>
                              <button type="button" onClick={() => handleRemoveWoGridRow(idx)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }} disabled={woGridItems.length === 1}><Trash2 size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 8. CONSUMPTION GRID */}
                {activeTab === 'Consumption' && (
                  <>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Spares Consumed details</h4>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Part Name *</th>
                          <th style={{ width: '110px' }}>Available</th>
                          <th style={{ width: '130px' }}>Consumed Qty *</th>
                          <th style={{ width: '110px' }}>UOM</th>
                          <th style={{ width: '120px' }}>Standard Rate</th>
                          <th style={{ width: '140px' }}>Consum Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.spareCode} onChange={e => handleConGridChange(idx, 'spareCode', e.target.value)}>
                                {SPARES.map(sp => <option key={sp.code} value={sp.code}>{sp.name}</option>)}
                              </select>
                            </td>
                            <td style={{ fontWeight: 600 }}>{item.availableStock}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.consumedQty} onChange={e => handleConGridChange(idx, 'consumedQty', Number(e.target.value))} required />
                            </td>
                            <td>{item.unit}</td>
                            <td>₹ {item.rate.toLocaleString()}</td>
                            <td style={{ fontWeight: 800, color: '#dc2626' }}>₹ {item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 9. JOB WORK ISSUE GRID */}
                {activeTab === 'JobWorkIssue' && (
                  <>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Spares Dispatched Offsite</h4>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Part Name *</th>
                          <th style={{ width: '130px' }}>Issued Qty *</th>
                          <th style={{ width: '110px' }}>UOM</th>
                          <th style={{ width: '130px' }}>Rate Value *</th>
                          <th style={{ width: '150px' }}>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jwGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.spareCode} onChange={e => handleJwGridChange(idx, 'spareCode', e.target.value)}>
                                {SPARES.map(sp => <option key={sp.code} value={sp.code}>{sp.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.qty} onChange={e => handleJwGridChange(idx, 'qty', Number(e.target.value))} required />
                            </td>
                            <td>{item.unit}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.rate} onChange={e => handleJwGridChange(idx, 'rate', Number(e.target.value))} required />
                            </td>
                            <td style={{ fontWeight: 800 }}>₹ {item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* 10. JOB WORK RECEIVED GRID */}
                {activeTab === 'JobWorkRecv' && (
                  <>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Job Work Material Returns Matching</h4>
                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Spare Name</th>
                          <th style={{ width: '110px' }}>Issued Qty</th>
                          <th style={{ width: '120px' }}>Prev Received</th>
                          <th style={{ width: '130px' }}>Received Qty *</th>
                          <th style={{ width: '110px' }}>Pending Qty</th>
                          <th>Return Status *</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jwrGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 650 }}>{item.name}</td>
                            <td>{item.issuedQty}</td>
                            <td>{item.prevReceived}</td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.receivedQty} onChange={e => handleJwrGridChange(idx, 'receivedQty', Number(e.target.value))} required />
                            </td>
                            <td style={{ fontWeight: 700, color: '#dc2626' }}>{item.pendingQty}</td>
                            <td>
                              <select className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.condition} onChange={e => handleJwrGridChange(idx, 'condition', e.target.value)}>
                                <option value="Perfect">Perfect Core repair</option>
                                <option value="Functional">Functional (Mild wear)</option>
                                <option value="Damaged">Damaged / Scrap</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
