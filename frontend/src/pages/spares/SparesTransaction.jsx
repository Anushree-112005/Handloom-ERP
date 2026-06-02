import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, PlusCircle, Layers, FileText, FileDigit, CheckSquare
} from 'lucide-react';

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

  const filteredSections = useMemo(() => {
    return sections.filter(sec => sec.name.toLowerCase().includes(searchTerm.toLowerCase()) || sec.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sections, searchTerm]);

  const filteredSpares = useMemo(() => {
    return spares.filter(spr => spr.name.toLowerCase().includes(searchTerm.toLowerCase()) || spr.id.toLowerCase().includes(searchTerm.toLowerCase()) || spr.partNo.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [spares, searchTerm]);

  // ----------------------------------------------------
  // 1. OPENING STOCK DATA & FORM STATES
  // ----------------------------------------------------
  const [openingStocks, setOpeningStocks] = useState([]);

  // Form Fields for Opening Stock
  const [osFY, setOsFY] = useState('2026-2027');
  const [osSection, setOsSection] = useState('Weaving Division A');
  const [osNarration, setOsNarration] = useState('');
  const [osStatus, setOsStatus] = useState('Draft');
  const [osGridItems, setOsGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', unit: 'Nos', qty: 10, rate: 4500, value: 45000 }]);

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
  // 2. SPARES REQUEST INDENT DATA & FORM STATES
  // ----------------------------------------------------
  const [indents, setIndents] = useState([]);

  // Form fields for Indent
  const [indSection, setIndSection] = useState('Weaving Division A');
  const [indMachineNo, setIndMachineNo] = useState('');
  const [indMachineType, setIndMachineType] = useState('Airjet Loom');
  const [indPriority, setIndPriority] = useState('Normal');
  const [indRequiredDate, setIndRequiredDate] = useState('');
  const [indRequestedBy, setIndRequestedBy] = useState('Murugan Swamy (Maintenance In-charge)');
  const [indReason, setIndReason] = useState('');
  const [indNarration, setIndNarration] = useState('');
  const [indGridItems, setIndGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', currentStock: 12, requiredQty: 1, unit: 'Nos', purpose: 'Loom nozzle repair' }]);

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
        if (field === 'spareCode') {
          const match = SPARES.find(s => s.code === value);
          if (match) {
            updated.spareName = match.name;
            updated.currentStock = match.stock;
            updated.unit = match.unit;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 3. REQUEST INDENT APPROVAL DATA & FORM STATES
  // ----------------------------------------------------
  const [indentApprovals, setIndentApprovals] = useState([]);

  // Form fields for Indent Approval
  const [iapIndentRef, setIapIndentRef] = useState('IND-2026-001');
  const [iapSection, setIapSection] = useState('Weaving Division A');
  const [iapRequestedBy, setIapRequestedBy] = useState('Murugan Swamy');
  const [iapPriority, setIapPriority] = useState('High');
  const [iapApprovedBy, setIapApprovedBy] = useState('Mani Bharathi (Store Head)');
  const [iapRemarks, setIapRemarks] = useState('');
  const [iapForward, setIapForward] = useState('Yes');
  const [iapStatus, setIapStatus] = useState('Approve');
  const [iapGridItems, setIapGridItems] = useState([{ name: 'Airjet Loom Solenoid Valve', reqQty: 2, currentStock: 12, approvedQty: 2, remarks: 'Cleared', action: 'Approve' }]);

  const handleIapGridChange = (idx, field, value) => {
    setIapGridItems(iapGridItems.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 4. PURCHASE ORDER ENTRY DATA & FORM STATES
  // ----------------------------------------------------
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // Form Fields for PO
  const [poIndentRef, setPoIndentRef] = useState('IAP-2026-001');
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
  // 5. PURCHASE ORDER APPROVAL DATA & FORM STATES
  // ----------------------------------------------------
  const [poApprovals, setPoApprovals] = useState([]);

  // Form Fields for PO Approval
  const [poaPoRef, setPoaPoRef] = useState('SPO-2026-001');
  const [poaSupplierName, setPoaSupplierName] = useState('Standard Gears Ltd');
  const [poaTotalValue, setPoaTotalValue] = useState(10620);
  const [poaApprovedBy, setPoaApprovedBy] = useState('Dinesh Balasamy (MD)');
  const [poaRemarks, setPoaRemarks] = useState('');
  const [poaSend, setPoaSend] = useState('Yes');
  const [poaStatus, setPoaStatus] = useState('Approved');
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
  // 6. PURCHASE ENTRY DATA & FORM STATES
  // ----------------------------------------------------
  const [purchaseEntries, setPurchaseEntries] = useState([]);

  // Form Fields
  const [pePoRef, setPePoRef] = useState('SPO-2026-001');
  const [peSupplierName, setPeSupplierName] = useState('Standard Gears Ltd');
  const [peInvoiceNo, setPeInvoiceNo] = useState('');
  const [peInvoiceDate, setPeInvoiceDate] = useState('');
  const [peGateInward, setPeGateInward] = useState('GIN-2026-001');
  const [peStoreLocation, setPeStoreLocation] = useState('Rack A-2');
  const [peReceivedBy, setPeReceivedBy] = useState('Mani Bharathi (Store Head)');
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
  const peTotalAmount = useMemo(() => peGridItems.reduce((acc, curr) => acc + curr.amount, 0), [peGridItems]);
  const peGstAmount = useMemo(() => peTotalAmount * 0.18, [peTotalAmount]);
  const peNetAmount = useMemo(() => peTotalAmount + peGstAmount, [peTotalAmount, peGstAmount]);

  // ----------------------------------------------------
  // 7. WORK ORDER DATA & FORM STATES
  // ----------------------------------------------------
  const [workOrders, setWorkOrders] = useState([]);

  // Form Fields
  const [woType, setWoType] = useState('Breakdown Maintenance');
  const [woSection, setWoSection] = useState('Weaving Division A');
  const [woMachineNo, setWoMachineNo] = useState('');
  const [woMachineType, setWoMachineType] = useState('Airjet Loom');
  const [woProblem, setWoProblem] = useState('');
  const [woPriority, setWoPriority] = useState('Normal');
  const [woAssignedTo, setWoAssignedTo] = useState('Murugan Swamy');
  const [woExpectedDate, setWoExpectedDate] = useState('');
  const [woEstimatedCost, setWoEstimatedCost] = useState('');
  const [woStatus, setWoStatus] = useState('Assigned');
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
  // 8. CONSUMPTION DATA & FORM STATES
  // ----------------------------------------------------
  const [consumptions, setConsumptions] = useState([]);

  // Form Fields
  const [conWoRef, setConWoRef] = useState('WO-2026-001');
  const [conSection, setConSection] = useState('Weaving Division A');
  const [conMachineNo, setConMachineNo] = useState('L-A12');
  const [conIndentRef, setConIndentRef] = useState('IAP-2026-001');
  const [conIssuedBy, setConIssuedBy] = useState('Mani Bharathi (Store Head)');
  const [conReceivedBy, setConReceivedBy] = useState('Murugan Swamy');
  const [conPurpose, setConPurpose] = useState('');
  const [conRemarks, setConRemarks] = useState('');
  const [conGridItems, setConGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', availableStock: 12, consumedQty: 1, unit: 'Nos', rate: 4500, amount: 4500 }]);

  const handleConGridChange = (idx, field, value) => {
    setConGridItems(conGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'spareCode') {
          const match = SPARES.find(s => s.code === value);
          if (match) {
            updated.spareName = match.name;
            updated.availableStock = match.stock;
            updated.unit = match.unit;
            updated.rate = match.rate;
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
  const conTotalValue = useMemo(() => conGridItems.reduce((acc, curr) => acc + curr.amount, 0), [conGridItems]);

  // ----------------------------------------------------
  // 9. JOBWORK / HANDLOAN ISSUE DATA & FORM STATES
  // ----------------------------------------------------
  const [issues, setIssues] = useState([]);

  // Form Fields
  const [jwType, setJwType] = useState('Job Work');
  const [jwPartyName, setJwPartyName] = useState('Standard Gears Ltd');
  const [jwContact, setJwContact] = useState('Subramaniam');
  const [jwMobile, setJwMobile] = useState('9443210987');
  const [jwGatePass, setJwGatePass] = useState('GP-2026-001');
  const [jwExpectedReturn, setJwExpectedReturn] = useState('');
  const [jwPurpose, setJwPurpose] = useState('');
  const [jwAuthorizedBy, setJwAuthorizedBy] = useState('Dinesh Balasamy (MD)');
  const [jwRemarks, setJwRemarks] = useState('');
  const [jwStatus, setJwStatus] = useState('Issued');
  const [jwGridItems, setJwGridItems] = useState([{ spareCode: 'SPR-001', spareName: 'Airjet Loom Solenoid Valve', qty: 2, unit: 'Nos', rate: 4500, amount: 9000 }]);

  const handleJwGridChange = (idx, field, value) => {
    setJwGridItems(jwGridItems.map((item, i) => {
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
          updated.amount = (Number(updated.qty) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 10. JOBWORK / HANDLOAN RECEIVED DATA & FORM STATES
  // ----------------------------------------------------
  const [receipts, setReceipts] = useState([]);

  // Form Fields
  const [jwrIssueRef, setJwrIssueRef] = useState('JWI-2026-001');
  const [jwrPartyName, setJwrPartyName] = useState('Standard Gears Ltd');
  const [jwrIssueDate, setJwrIssueDate] = useState('2026-06-01');
  const [jwrGateInward, setJwrGateInward] = useState('GIN-2026-001');
  const [jwrCharges, setJwrCharges] = useState(1200);
  const [jwrQc, setJwrQc] = useState('Yes');
  const [jwrReceivedBy, setJwrReceivedBy] = useState('Murugan Swamy');
  const [jwrRemarks, setJwrRemarks] = useState('');
  const [jwrStatus, setJwrStatus] = useState('Full');
  const [jwrGridItems, setJwrGridItems] = useState([{ name: 'Airjet Loom Solenoid Valve', issuedQty: 2, prevReceived: 0, receivedQty: 2, pendingQty: 0, condition: 'Good', remarks: 'Repaired successfully' }]);

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
    }
    if (activeTab === 'Spares') {
      nextId = `SPR-00${spares.length + 1}`;
      setSprName(''); setSprCategory('Mechanical Parts'); setSprSection('Weaving Division A'); setSprMachineType('Airjet Loom'); setSprBrand(''); setSprModelNo(''); setSprPartNo(''); setSprUom('Nos'); setSprReorder(''); setSprMinStock(''); setSprMaxStock(''); setSprStandardRate(''); setSprHsn(''); setSprGst(18); setSprSupplier('Standard Gears Ltd'); setSprLeadTime(''); setSprStatus('Active');
    }
    if (activeTab === 'OpeningStock') nextId = `OS-2026-00${openingStocks.length + 1}`;
    if (activeTab === 'RequestIndent') nextId = `IND-2026-00${indents.length + 1}`;
    if (activeTab === 'IndentApproval') nextId = `IAP-2026-00${indentApprovals.length + 1}`;
    if (activeTab === 'PurchaseOrder') nextId = `SPO-2026-00${purchaseOrders.length + 1}`;
    if (activeTab === 'POApproval') nextId = `POA-2026-00${poApprovals.length + 1}`;
    if (activeTab === 'PurchaseEntry') nextId = `PE-2026-00${purchaseEntries.length + 1}`;
    if (activeTab === 'WorkOrder') nextId = `WO-2026-00${workOrders.length + 1}`;
    if (activeTab === 'Consumption') nextId = `CON-2026-00${consumptions.length + 1}`;
    if (activeTab === 'JobWorkIssue') nextId = `JWI-2026-00${issues.length + 1}`;
    if (activeTab === 'JobWorkRecv') nextId = `JWR-2026-00${receipts.length + 1}`;

    setCurrentFormId(nextId);
    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const dateToday = new Date().toISOString().substring(0, 10);

    if (activeTab === 'Sections') {
      if (!secName) { alert("Please enter the section name!"); return; }
      const isExisting = sections.some(s => s.id === currentFormId);
      const newSec = { id: currentFormId, name: secName, type: secType, dept: secDept, incharge: secIncharge, machines: Number(secMachines) || 0, desc: secDesc, status: secStatus };
      if (isExisting) setSections(sections.map(s => s.id === currentFormId ? newSec : s));
      else setSections([...sections, newSec]);
    }
    if (activeTab === 'Spares') {
      if (!sprName || !sprReorder || !sprStandardRate) { alert("Please fill in spare name, reorder level, and rates!"); return; }
      const isExisting = spares.some(s => s.id === currentFormId);
      const newSpr = { id: currentFormId, name: sprName, category: sprCategory, section: sprSection, machineType: sprMachineType, brand: sprBrand, modelNo: sprModelNo, partNo: sprPartNo, uom: sprUom, reorder: Number(sprReorder), minStock: Number(sprMinStock), maxStock: Number(sprMaxStock), standardRate: Number(sprStandardRate), hsnCode: sprHsn, gstPercent: Number(sprGst) || 18, preferredSupplier: sprSupplier, leadTime: Number(sprLeadTime) || 0, status: sprStatus };
      if (isExisting) setSpares(spares.map(s => s.id === currentFormId ? newSpr : s));
      else setSpares([...spares, newSpr]);
    }

    if (activeTab === 'OpeningStock') {
      const isExisting = openingStocks.some(o => o.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        financialYear: osFY,
        section: osSection,
        totalValue: osTotalStockValue,
        narration: osNarration,
        enteredBy: 'Mani Bharathi (Store Head)',
        status: osStatus,
        items: osGridItems
      };
      if (isExisting) {
        setOpeningStocks(openingStocks.map(o => o.id === currentFormId ? newVoucher : o));
      } else {
        setOpeningStocks([newVoucher, ...openingStocks]);
      }
    }

    if (activeTab === 'RequestIndent') {
      const isExisting = indents.some(i => i.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        section: indSection,
        machineNo: indMachineNo,
        machineType: indMachineType,
        priority: indPriority,
        requiredDate: indRequiredDate,
        requestedBy: indRequestedBy,
        reason: indReason,
        narration: indNarration,
        status: 'Pending Approval',
        items: indGridItems
      };
      if (isExisting) {
        setIndents(indents.map(i => i.id === currentFormId ? newVoucher : i));
      } else {
        setIndents([newVoucher, ...indents]);
      }
    }

    if (activeTab === 'IndentApproval') {
      const isExisting = indentApprovals.some(iap => iap.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        indentRef: iapIndentRef,
        section: iapSection,
        requestedBy: iapRequestedBy,
        priority: iapPriority,
        approvalStatus: iapStatus,
        approvedBy: iapApprovedBy,
        remarks: iapRemarks,
        forwardToPurchase: iapForward,
        items: iapGridItems
      };
      if (isExisting) {
        setIndentApprovals(indentApprovals.map(iap => iap.id === currentFormId ? newVoucher : iap));
      } else {
        setIndentApprovals([newVoucher, ...indentApprovals]);
      }
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
      setSecName(row.name); setSecType(row.type); setSecDept(row.dept); setSecIncharge(row.incharge); setSecMachines(row.machines); setSecDesc(row.desc); setSecStatus(row.status);
    }
    if (activeTab === 'Spares') {
      setSprName(row.name); setSprCategory(row.category); setSprSection(row.section); setSprMachineType(row.machineType); setSprBrand(row.brand); setSprModelNo(row.modelNo); setSprPartNo(row.partNo); setSprUom(row.uom); setSprReorder(row.reorder); setSprMinStock(row.minStock); setSprMaxStock(row.maxStock); setSprStandardRate(row.standardRate); setSprHsn(row.hsnCode); setSprGst(row.gstPercent); setSprSupplier(row.preferredSupplier); setSprLeadTime(row.leadTime); setSprStatus(row.status);
    }
    if (activeTab === 'OpeningStock') {
      setOsFY(row.financialYear);
      setOsSection(row.section);
      setOsNarration(row.narration);
      setOsStatus(row.status);
      setOsGridItems(row.items);
    }
    if (activeTab === 'RequestIndent') {
      setIndSection(row.section);
      setIndMachineNo(row.machineNo);
      setIndMachineType(row.machineType);
      setIndPriority(row.priority);
      setIndRequiredDate(row.requiredDate);
      setIndRequestedBy(row.requestedBy);
      setIndReason(row.reason);
      setIndNarration(row.narration);
      setIndGridItems(row.items);
    }
    if (activeTab === 'IndentApproval') {
      setIapIndentRef(row.indentRef);
      setIapSection(row.section);
      setIapRequestedBy(row.requestedBy);
      setIapPriority(row.priority);
      setIapApprovedBy(row.approvedBy);
      setIapRemarks(row.remarks);
      setIapForward(row.forwardToPurchase);
      setIapStatus(row.approvalStatus);
      setIapGridItems(row.items);
    }
    if (activeTab === 'PurchaseOrder') {
      setPoIndentRef(row.indentRef);
      setPoSupplierName(row.supplierName);
      setPoAddress(row.address);
      setPoContact(row.contactPerson);
      setPoMobile(row.mobileNo);
      setPoGstin(row.gstin);
      setPoExpectedDate(row.expectedDate);
      setPoPaymentTerms(row.paymentTerms);
      setPoNarration(row.narration);
      setPoGridItems(row.items);
    }
    if (activeTab === 'POApproval') {
      setPoaPoRef(row.poRef);
      setPoaSupplierName(row.supplierName);
      setPoaTotalValue(row.totalPOValue);
      setPoaApprovedBy(row.approvedBy);
      setPoaRemarks(row.remarks);
      setPoaSend(row.sendToSupplier);
      setPoaStatus(row.approvalStatus);
      setPoaGridItems(row.items);
    }
    if (activeTab === 'PurchaseEntry') {
      setPePoRef(row.poRef);
      setPeSupplierName(row.supplierName);
      setPeInvoiceNo(row.invoiceNo);
      setPeInvoiceDate(row.invoiceDate);
      setPeGateInward(row.gateInwardRef);
      setPeStoreLocation(row.storeLocation);
      setPeReceivedBy(row.receivedBy);
      setPeRemarks(row.remarks);
      setPeGridItems(row.items);
    }
    if (activeTab === 'WorkOrder') {
      setWoType(row.type);
      setWoSection(row.section);
      setWoMachineNo(row.machineNo);
      setWoMachineType(row.machineType);
      setWoProblem(row.problem);
      setWoPriority(row.priority);
      setWoAssignedTo(row.assignedTo);
      setWoExpectedDate(row.expectedDate);
      setWoEstimatedCost(row.estimatedCost);
      setWoStatus(row.status);
      setWoGridItems(row.items);
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

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this spares transaction record?")) {
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
            {(activeTab === 'Sections' || activeTab === 'Spares' ? ['Reference Info'] : ['Reference Info', 'Transaction Setup Details', 'Grid Details Matrix']).map(tab => {
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
                    <>
                      <div className="form-group"><label>Section Name *</label><input type="text" className="form-control" value={secName} onChange={e => setSecName(e.target.value)} required /></div>
                      <div className="form-group"><label>Type</label><input type="text" className="form-control" value={secType} onChange={e => setSecType(e.target.value)} /></div>
                      <div className="form-group"><label>Department</label><input type="text" className="form-control" value={secDept} onChange={e => setSecDept(e.target.value)} /></div>
                      <div className="form-group"><label>In-Charge</label><select className="form-control" value={secIncharge} onChange={e => setSecIncharge(e.target.value)}>{EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}</select></div>
                      <div className="form-group"><label>Machine Count</label><input type="number" className="form-control" value={secMachines} onChange={e => setSecMachines(e.target.value)} /></div>
                      <div className="form-group"><label>Description</label><input type="text" className="form-control" value={secDesc} onChange={e => setSecDesc(e.target.value)} /></div>
                      <div className="form-group"><label>Status</label><select className="form-control" value={secStatus} onChange={e => setSecStatus(e.target.value)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    </>
                  )}

                  {activeTab === 'Spares' && (
                    <>
                      <div className="form-group"><label>Spare Name *</label><input type="text" className="form-control" value={sprName} onChange={e => setSprName(e.target.value)} required /></div>
                      <div className="form-group"><label>Category</label><input type="text" className="form-control" value={sprCategory} onChange={e => setSprCategory(e.target.value)} /></div>
                      <div className="form-group"><label>Section</label><select className="form-control" value={sprSection} onChange={e => setSprSection(e.target.value)}>{SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      <div className="form-group"><label>Machine Type</label><input type="text" className="form-control" value={sprMachineType} onChange={e => setSprMachineType(e.target.value)} /></div>
                      <div className="form-group"><label>Brand</label><input type="text" className="form-control" value={sprBrand} onChange={e => setSprBrand(e.target.value)} /></div>
                      <div className="form-group"><label>Model No</label><input type="text" className="form-control" value={sprModelNo} onChange={e => setSprModelNo(e.target.value)} /></div>
                      <div className="form-group"><label>Part No</label><input type="text" className="form-control" value={sprPartNo} onChange={e => setSprPartNo(e.target.value)} /></div>
                      <div className="form-group"><label>UOM</label><select className="form-control" value={sprUom} onChange={e => setSprUom(e.target.value)}><option value="Nos">Nos</option><option value="Kgs">Kgs</option><option value="Mtrs">Mtrs</option><option value="Ltrs">Ltrs</option></select></div>
                      <div className="form-group"><label>Reorder Level *</label><input type="number" className="form-control" value={sprReorder} onChange={e => setSprReorder(e.target.value)} required /></div>
                      <div className="form-group"><label>Min Stock Level</label><input type="number" className="form-control" value={sprMinStock} onChange={e => setSprMinStock(e.target.value)} /></div>
                      <div className="form-group"><label>Max Stock Level</label><input type="number" className="form-control" value={sprMaxStock} onChange={e => setSprMaxStock(e.target.value)} /></div>
                      <div className="form-group"><label>Standard Rate (₹) *</label><input type="number" className="form-control" value={sprStandardRate} onChange={e => setSprStandardRate(e.target.value)} required /></div>
                      <div className="form-group"><label>HSN Code</label><input type="text" className="form-control" value={sprHsn} onChange={e => setSprHsn(e.target.value)} /></div>
                      <div className="form-group"><label>GST %</label><input type="number" className="form-control" value={sprGst} onChange={e => setSprGst(e.target.value)} /></div>
                      <div className="form-group"><label>Preferred Supplier</label><select className="form-control" value={sprSupplier} onChange={e => setSprSupplier(e.target.value)}>{SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      <div className="form-group"><label>Lead Time (Days)</label><input type="number" className="form-control" value={sprLeadTime} onChange={e => setSprLeadTime(e.target.value)} /></div>
                      <div className="form-group"><label>Status</label><select className="form-control" value={sprStatus} onChange={e => setSprStatus(e.target.value)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                    </>
                  )}

                  {activeTab === 'OpeningStock' && (
                    <>
                      <div className="form-group">
                        <label>Financial Year *</label>
                        <select className="form-control" value={osFY} onChange={e => setOsFY(e.target.value)}>
                          <option value="2026-2027">2026-2027</option>
                          <option value="2025-2026">2025-2026</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Factory Section *</label>
                        <select className="form-control" value={osSection} onChange={e => setOsSection(e.target.value)}>
                          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Opening Entry Status</label>
                        <select className="form-control" value={osStatus} onChange={e => setOsStatus(e.target.value)}>
                          <option value="Draft">Draft</option>
                          <option value="Confirmed">Confirmed</option>
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'RequestIndent' && (
                    <>
                      <div className="form-group">
                        <label>Section *</label>
                        <select className="form-control" value={indSection} onChange={e => setIndSection(e.target.value)}>
                          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Machine Code No *</label>
                        <input type="text" className="form-control" placeholder="e.g. L-A12" value={indMachineNo} onChange={e => setIndMachineNo(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Machine Type *</label>
                        <select className="form-control" value={indMachineType} onChange={e => setIndMachineType(e.target.value)}>
                          <option value="Airjet Loom">Airjet Loom</option>
                          <option value="Dyeing Vessel">Dyeing Vessel</option>
                          <option value="Warping Beam Reel">Warping Beam Reel</option>
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'IndentApproval' && (
                    <>
                      <div className="form-group">
                        <label>Indent Ref No Link *</label>
                        <select className="form-control" value={iapIndentRef} onChange={e => setIapIndentRef(e.target.value)}>
                          {indents.map(ind => <option key={ind.id} value={ind.id}>{ind.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Section (Auto Fill)</label>
                        <input type="text" className="form-control" value={iapSection} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Requested By (Auto Fill)</label>
                        <input type="text" className="form-control" value={iapRequestedBy} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </>
                  )}

                  {activeTab === 'PurchaseOrder' && (
                    <>
                      <div className="form-group">
                        <label>Indent Approval Link *</label>
                        <select className="form-control" value={poIndentRef} onChange={e => setPoIndentRef(e.target.value)}>
                          {indentApprovals.map(iap => <option key={iap.id} value={iap.id}>{iap.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Supplier Name *</label>
                        <select className="form-control" value={poSupplierName} onChange={e => setPoSupplierName(e.target.value)}>
                          {SUPPLIERS.map(sup => <option key={sup} value={sup}>{sup}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Expected Delivery Date *</label>
                        <input type="date" className="form-control" value={poExpectedDate} onChange={e => setPoExpectedDate(e.target.value)} required />
                      </div>
                    </>
                  )}

                  {activeTab === 'POApproval' && (
                    <>
                      <div className="form-group">
                        <label>PO Ref Link *</label>
                        <select className="form-control" value={poaPoRef} onChange={e => setPoaPoRef(e.target.value)}>
                          {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Supplier Name (Auto Fill)</label>
                        <input type="text" className="form-control" value={poaSupplierName} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Total PO Value (Auto Fill)</label>
                        <input type="number" className="form-control" value={poaTotalValue} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </>
                  )}

                  {activeTab === 'PurchaseEntry' && (
                    <>
                      <div className="form-group">
                        <label>Approved PO Ref Link *</label>
                        <select className="form-control" value={pePoRef} onChange={e => setPoaPoRef(e.target.value)}>
                          {poApprovals.map(poa => <option key={poa.id} value={poa.id}>{poa.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Supplier Name (Auto Fill)</label>
                        <input type="text" className="form-control" value={peSupplierName} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Gate Inward Ref Link *</label>
                        <input type="text" className="form-control" placeholder="GIN-xxxx link" value={peGateInward} onChange={e => setPeGateInward(e.target.value)} required />
                      </div>
                    </>
                  )}

                  {activeTab === 'WorkOrder' && (
                    <>
                      <div className="form-group">
                        <label>Work Order Type *</label>
                        <select className="form-control" value={woType} onChange={e => setWoType(e.target.value)}>
                          <option value="Breakdown Maintenance">Breakdown Maintenance</option>
                          <option value="Preventive Maintenance">Preventive Maintenance</option>
                          <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                          <option value="Modification Work">Modification Work</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Factory Section *</label>
                        <select className="form-control" value={woSection} onChange={e => setWoSection(e.target.value)}>
                          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Machine Code No *</label>
                        <input type="text" className="form-control" placeholder="e.g. L-A12" value={woMachineNo} onChange={e => setWoMachineNo(e.target.value)} required />
                      </div>
                    </>
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
