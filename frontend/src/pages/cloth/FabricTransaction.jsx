import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scissors, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Layers 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function FabricTransaction({ defaultSection = 'Fabric Checking' }) {
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

  // Search Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  // Static lists for selections
  const BUYERS = ['Raymond Ltd', 'Vardhman Spinning', 'Reliance Retail', 'Standard Gears Ltd'];
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];
  const DESIGNS = ['DES-4091 Premium Satin', 'DES-5011 Weave Twill', 'DES-2012 Plain Voile', 'DES-8812 Indigo Chambray'];

  // =========================================================================
  // STATE STORE FOR NEW WORKSPACES
  // =========================================================================

  // 1. DESIGN UPLOAD
  const [designs, setDesigns] = useState([
    { id: 'DES-4091', date: '2026-06-01', name: 'Premium Cotton Satin', category: 'Satin', buyerName: 'Raymond Ltd', season: 'Summer 2026', fabricType: 'Woven Fabric', composition: '100% Cotton', width: 58, weight: 140, weaveType: 'Satin Weave', color: 'Midnight Blue', status: 'Active' }
  ]);

  // 2. CLOTH CHECKING
  const [clothCheckings, setClothCheckings] = useState([
    { id: 'CHK-2026-001', date: '2026-06-01', supplierName: 'Standard Processing Unit', gateInwardRef: 'GIN-9901', designNo: 'DES-4091', lotNo: 'LOT-SAT-10', totalPieces: 15, totalMeters: 1500, acceptedMeters: 1485, rejectedMeters: 15, rejectionPercent: 1, checkedBy: 'Murugan Swamy', status: 'Approved' }
  ]);

  // 4. CLOTH LOT COMPLETION
  const [lotCompletions, setLotCompletions] = useState([
    { id: 'LTC-2026-001', date: '2026-06-01', lotNo: 'LOT-SAT-10', designNo: 'DES-4091', supplier: 'Standard Processing Unit', totalPieces: 15, totalMeters: 1500, acceptedMeters: 1485, rejectedMeters: 15, gradeA: 1400, gradeB: 70, gradeC: 15, status: 'Completed', completedBy: 'Mani Bharathi (Store Head)' }
  ]);

  // 6. CLOTH PURCHASE BILLS
  const [purchaseBills, setPurchaseBills] = useState([
    { id: 'CPB-2026-001', date: '2026-06-01', supplierName: 'Standard Processing Unit', supplierBillNo: 'BILL-44120', supplierBillDate: '2026-05-30', clothInwardRef: 'CIN-88021', designNo: 'DES-4091', lotNo: 'LOT-SAT-10', taxableAmount: 222750, gstAmount: 11137.5, totalBillAmount: 233887.5, paymentTerms: '30 Days', status: 'Pending Approval' }
  ]);

  // 7. CLOTH DELIVERY PC-WISE
  const [pcWiseDeliveries, setPcWiseDeliveries] = useState([
    { id: 'DEL-PC-001', date: '2026-06-01', buyerName: 'Raymond Ltd', orderRef: 'ORD-99012', designNo: 'DES-4091', lotNo: 'LOT-SAT-10', totalPieces: 10, totalMeters: 1000, totalAmount: 150000, vehicleNo: 'TN-37-BY-8891', driverName: 'Selvam', status: 'Dispatched' }
  ]);

  // 8. MILL TO MILL DELIVERY
  const [m2mDeliveries, setM2mDeliveries] = useState([
    { id: 'M2M-2026-001', date: '2026-06-01', fromMill: 'Weaving Unit A', toMill: 'Dyeing House B', transferType: 'Processing', designNo: 'DES-4091', lotNo: 'LOT-SAT-10', totalMeters: 2500, totalPieces: 25, vehicleNo: 'TN-30-C-9901', status: 'In-Transit' }
  ]);

  // 10. CLOTH BALE DELIVERY
  const [baleDeliveries, setBaleDeliveries] = useState([
    { id: 'BDL-2026-001', date: '2026-06-01', buyerName: 'Raymond Ltd', orderRef: 'ORD-99012', designNo: 'DES-4091', lotNo: 'LOT-SAT-10', totalBales: 5, totalMeters: 2500, totalWeight: 620, totalAmount: 375000, vehicleNo: 'TN-33-AF-4412' }
  ]);

  // 11. LOT APPROVAL ENTRY
  const [lotApprovals, setLotApprovals] = useState([
    { id: 'LAP-2026-001', date: '2026-06-01', lotNo: 'LOT-SAT-10', designNo: 'DES-4091', buyerName: 'Raymond Ltd', totalMeters: 1500, approvedMeters: 1485, rejectedMeters: 15, approvalStatus: 'Approved', approvedBy: 'Dinesh Balasamy (MD)' }
  ]);

  // 13. CLOTH BALE PACKING
  const [balePackings, setBalePackings] = useState([
    { id: 'PKG-2026-001', date: '2026-06-01', lotApprovalRef: 'LAP-2026-001', designNo: 'DES-4091', buyerName: 'Raymond Ltd', totalBales: 5, totalMeters: 2500, totalWeight: 620, packedBy: 'Murugan Swamy' }
  ]);

  // 15. NEW GOODS RELEASE ADVICE
  const [goodsReleaseAdvices, setGoodsReleaseAdvices] = useState([
    { id: 'GRA-2026-001', date: '2026-06-01', buyerName: 'Raymond Ltd', buyerOrderRef: 'ORD-99012', lotApprovalRef: 'LAP-2026-001', designNo: 'DES-4091', totalMeters: 2500, totalAmount: 375000, deliveryAddress: 'Salem Warehouse', expectedDispatch: '2026-06-05', status: 'Approved' }
  ]);

  // 18. VENDOR BILLS ENTRY
  const [vendorBills, setVendorBills] = useState([
    { id: 'VND-2026-001', date: '2026-06-01', vendorName: 'Standard Processing Unit', vendorType: 'Dyeing Vendor', supplierBillNo: 'VND-B-998', supplierBillDate: '2026-05-28', netPayable: 45000, dueDate: '2026-06-30', status: 'Approved' }
  ]);

  // 21. SURPLUS STOCK OPENING
  const [surplusOpening, setSurplusOpening] = useState([
    { id: 'SSO-2026-001', date: '2026-06-01', financialYear: '2026-2027', totalMeters: 500, totalValue: 45000, status: 'Confirmed' }
  ]);

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
    // Fabric Checking
    design_upload: { key: 'design_upload', label: "Design Upload", category: 'Fabric Checking', desc: "Upload and manage fabric design files digitally", icon: FileText, color: '#3b82f6' },
    cloth_checking: { key: 'cloth_checking', label: "Cloth Checking Entry", category: 'Fabric Checking', desc: "Record quality checking of cloth before inward", icon: CheckSquare, color: '#3b82f6' },
    ot_checking: { key: 'ot_checking', label: "ON Table Checking Entry", category: 'Fabric Checking', desc: "Detailed on-table fabric quality inspection (Link)", icon: Layers, isLink: true, route: '/cloth/checking', color: '#3b82f6' },
    lot_completion: { key: 'lot_completion', label: "Cloth LOT Completion", category: 'Fabric Checking', desc: "Mark fabric lot as complete after all checking done", icon: CheckSquare, color: '#3b82f6' },

    // Fabric Inward
    cloth_inward: { key: 'cloth_inward', label: "Cloth Inward", category: 'Fabric Inward', desc: "Record stock receiving and rack allocation (Link)", icon: Factory, isLink: true, route: '/cloth/inward', color: '#10b981' },
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
    goods_release: { key: 'goods_release', label: "New Goods Release Advice", category: 'Gate & Dispatch', desc: "Authorize release of goods from warehouse for dispatch (Link)", icon: FileText, isLink: true, route: '/goods-release', color: '#0d9488' },
    gate_pass: { key: 'gate_pass', label: "Cloth Gate Pass Entry", category: 'Gate & Dispatch', desc: "Create gate pass specifically for cloth dispatch", icon: Layers, color: '#0d9488' },
    sales_invoice: { key: 'sales_invoice', label: "Sales Invoice", category: 'Gate & Dispatch', desc: "Link to central sales invoicing module (Link)", icon: FileText, isLink: true, route: '/sales-invoice', color: '#0d9488' },
    einvoice_eway: { key: 'einvoice_eway', label: "Einvoice / Eway Bill", category: 'Gate & Dispatch', desc: "Generate combined E-Invoice and E-Way Bill for fabric", icon: Sparkles, color: '#0d9488' },

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

  // =========================================================================
  // ACTIONS HANDLERS
  // =========================================================================
  const handleOpenPage = (p) => {
    if (p.isLink) {
      navigate(p.route);
    } else {
      setActivePage(p.key);
      setIsFormOpen(false);
    }
  };

  const handleCreateNew = () => {
    let nextId = '';
    const dateToday = new Date().toISOString().substring(0, 10);

    if (activePage === 'design_upload') {
      nextId = `DES-2026-${designs.length + 1}`;
      setFields({ id: nextId, date: dateToday, name: '', category: 'Dobby', buyerName: 'Raymond Ltd', season: 'Summer 2026', fabricType: 'Woven Fabric', composition: '100% Cotton', width: 58, weight: 140, weaveType: 'Satin Weave', color: 'Midnight Blue', status: 'Active' });
    }
    else if (activePage === 'cloth_checking') {
      nextId = `CHK-2026-00${clothCheckings.length + 1}`;
      setFields({ id: nextId, date: dateToday, supplierName: 'Standard Processing Unit', gateInwardRef: '', designNo: 'DES-4091', lotNo: '', totalPieces: '', totalMeters: '', acceptedMeters: '', rejectedMeters: '', rejectionPercent: 0, checkedBy: 'Murugan Swamy', status: 'Approved' });
    }
    else if (activePage === 'lot_completion') {
      nextId = `LTC-2026-00${lotCompletions.length + 1}`;
      setFields({ id: nextId, date: dateToday, lotNo: '', designNo: 'DES-4091', supplier: 'Standard Processing Unit', totalPieces: '', totalMeters: '', acceptedMeters: '', rejectedMeters: '', gradeA: '', gradeB: '', gradeC: '', status: 'Completed', completedBy: 'Mani Bharathi (Store Head)' });
    }
    else if (activePage === 'cloth_purchase_bill') {
      nextId = `CPB-2026-00${purchaseBills.length + 1}`;
      setFields({ id: nextId, date: dateToday, supplierName: 'Standard Processing Unit', supplierBillNo: '', supplierBillDate: dateToday, clothInwardRef: '', designNo: 'DES-4091', lotNo: '', taxableAmount: '', gstAmount: '', totalBillAmount: 0, paymentTerms: '30 Days', status: 'Pending Approval' });
    }
    else if (activePage === 'del_pcwise') {
      nextId = `DEL-PC-0${pcWiseDeliveries.length + 1}`;
      setFields({ id: nextId, date: dateToday, buyerName: 'Raymond Ltd', orderRef: '', designNo: 'DES-4091', lotNo: '', totalPieces: '', totalMeters: '', totalAmount: '', vehicleNo: '', driverName: '', status: 'Dispatched' });
    }
    else if (activePage === 'm2m_delivery') {
      nextId = `M2M-2026-00${m2mDeliveries.length + 1}`;
      setFields({ id: nextId, date: dateToday, fromMill: 'Weaving Unit A', toMill: 'Dyeing House B', transferType: 'Processing', designNo: 'DES-4091', lotNo: '', totalMeters: '', totalPieces: '', vehicleNo: '', status: 'In-Transit' });
    }
    else if (activePage === 'bale_delivery') {
      nextId = `BDL-2026-00${baleDeliveries.length + 1}`;
      setFields({ id: nextId, date: dateToday, buyerName: 'Raymond Ltd', orderRef: '', designNo: 'DES-4091', lotNo: '', totalBales: '', totalMeters: '', totalWeight: '', totalAmount: '', vehicleNo: '', status: 'Dispatched' });
    }
    else if (activePage === 'lot_approval') {
      nextId = `LAP-2026-00${lotApprovals.length + 1}`;
      setFields({ id: nextId, date: dateToday, lotNo: '', designNo: 'DES-4091', buyerName: 'Raymond Ltd', totalMeters: '', approvedMeters: '', rejectedMeters: 0, approvalStatus: 'Approved', approvedBy: 'Dinesh Balasamy (MD)' });
    }
    else if (activePage === 'bale_packing') {
      nextId = `PKG-2026-00${balePackings.length + 1}`;
      setFields({ id: nextId, date: dateToday, lotApprovalRef: '', designNo: 'DES-4091', buyerName: 'Raymond Ltd', totalBales: '', totalMeters: '', totalWeight: '', packedBy: 'Murugan Swamy' });
    }
    else if (activePage === 'vendor_bills') {
      nextId = `VND-2026-00${vendorBills.length + 1}`;
      setFields({ id: nextId, date: dateToday, vendorName: 'Standard Processing Unit', vendorType: 'Dyeing Vendor', supplierBillNo: '', supplierBillDate: dateToday, netPayable: '', dueDate: '', status: 'Approved' });
    }
    else if (activePage === 'surplus_opening') {
      nextId = `SSO-2026-00${surplusOpening.length + 1}`;
      setFields({ id: nextId, date: dateToday, financialYear: '2026-2027', totalMeters: '', totalValue: '', status: 'Confirmed' });
    }
    else {
      // General Fallback
      nextId = `TXN-FAB-00${designs.length + 1}`;
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

  const handleSave = (e) => {
    e.preventDefault();

    if (activePage === 'design_upload') {
      const exists = designs.some(d => d.id === currentFormId);
      if (exists) setDesigns(designs.map(d => d.id === currentFormId ? fields : d));
      else setDesigns([fields, ...designs]);
    }
    else if (activePage === 'cloth_checking') {
      const exists = clothCheckings.some(d => d.id === currentFormId);
      if (exists) setClothCheckings(clothCheckings.map(d => d.id === currentFormId ? fields : d));
      else setClothCheckings([fields, ...clothCheckings]);
    }
    else if (activePage === 'lot_completion') {
      const exists = lotCompletions.some(d => d.id === currentFormId);
      if (exists) setLotCompletions(lotCompletions.map(d => d.id === currentFormId ? fields : d));
      else setLotCompletions([fields, ...lotCompletions]);
    }
    else if (activePage === 'cloth_purchase_bill') {
      const exists = purchaseBills.some(d => d.id === currentFormId);
      if (exists) setPurchaseBills(purchaseBills.map(d => d.id === currentFormId ? fields : d));
      else setPurchaseBills([fields, ...purchaseBills]);
    }
    else if (activePage === 'del_pcwise') {
      const exists = pcWiseDeliveries.some(d => d.id === currentFormId);
      if (exists) setPcWiseDeliveries(pcWiseDeliveries.map(d => d.id === currentFormId ? fields : d));
      else setPcWiseDeliveries([fields, ...pcWiseDeliveries]);
    }
    else if (activePage === 'm2m_delivery') {
      const exists = m2mDeliveries.some(d => d.id === currentFormId);
      if (exists) setM2mDeliveries(m2mDeliveries.map(d => d.id === currentFormId ? fields : d));
      else setM2mDeliveries([fields, ...m2mDeliveries]);
    }
    else if (activePage === 'bale_delivery') {
      const exists = baleDeliveries.some(d => d.id === currentFormId);
      if (exists) setBaleDeliveries(baleDeliveries.map(d => d.id === currentFormId ? fields : d));
      else setBaleDeliveries([fields, ...baleDeliveries]);
    }
    else if (activePage === 'lot_approval') {
      const exists = lotApprovals.some(d => d.id === currentFormId);
      if (exists) setLotApprovals(lotApprovals.map(d => d.id === currentFormId ? fields : d));
      else setLotApprovals([fields, ...lotApprovals]);
    }
    else if (activePage === 'bale_packing') {
      const exists = balePackings.some(d => d.id === currentFormId);
      if (exists) setBalePackings(balePackings.map(d => d.id === currentFormId ? fields : d));
      else setBalePackings([fields, ...balePackings]);
    }
    else if (activePage === 'vendor_bills') {
      const exists = vendorBills.some(d => d.id === currentFormId);
      if (exists) setVendorBills(vendorBills.map(d => d.id === currentFormId ? fields : d));
      else setVendorBills([fields, ...vendorBills]);
    }
    else if (activePage === 'surplus_opening') {
      const exists = surplusOpening.some(d => d.id === currentFormId);
      if (exists) setSurplusOpening(surplusOpening.map(d => d.id === currentFormId ? fields : d));
      else setSurplusOpening([fields, ...surplusOpening]);
    }

    setIsFormOpen(false);
    alert("Fabric production record processed and saved!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to remove this fabric transaction entry?")) {
      if (activePage === 'design_upload') setDesigns(designs.filter(d => d.id !== id));
      if (activePage === 'cloth_checking') setClothCheckings(clothCheckings.filter(d => d.id !== id));
      if (activePage === 'lot_completion') setLotCompletions(lotCompletions.filter(d => d.id !== id));
      if (activePage === 'cloth_purchase_bill') setPurchaseBills(purchaseBills.filter(d => d.id !== id));
      if (activePage === 'del_pcwise') setPcWiseDeliveries(pcWiseDeliveries.filter(d => d.id !== id));
      if (activePage === 'm2m_delivery') setM2mDeliveries(m2mDeliveries.filter(d => d.id !== id));
      if (activePage === 'bale_delivery') setBaleDeliveries(baleDeliveries.filter(d => d.id !== id));
      if (activePage === 'lot_approval') setLotApprovals(lotApprovals.filter(d => d.id !== id));
      if (activePage === 'bale_packing') setBalePackings(balePackings.filter(d => d.id !== id));
      if (activePage === 'vendor_bills') setVendorBills(vendorBills.filter(d => d.id !== id));
      if (activePage === 'surplus_opening') setSurplusOpening(surplusOpening.filter(d => d.id !== id));
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

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      {!isFormOpen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scissors size={24} color="#7c3aed" /> {activeSection}
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
                         <span style={{ fontWeight: 800, color: cardColor }}>-</span> Records
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
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.name}</td>
                          <td>{row.category}</td>
                          <td>{row.buyerName}</td>
                          <td>{row.fabricType}</td>
                          <td>{row.composition}</td>
                          <td>{row.width}"</td>
                          <td>{row.weight}</td>
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

              {/* CLOTH CHECKING TABLE */}
              {activePage === 'cloth_checking' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>CHECKING NO</th>
                        <th>DATE</th>
                        <th>SUPPLIER NAME</th>
                        <th>GATE REF</th>
                        <th>LOT NO</th>
                        <th style={{ textAlign: 'right' }}>TOTAL PIECES</th>
                        <th style={{ textAlign: 'right' }}>TOTAL METERS</th>
                        <th>CHECKED BY</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clothCheckings.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.supplierName}</td>
                          <td>{row.gateInwardRef}</td>
                          <td>{row.lotNo}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalPieces}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.totalMeters} Mtr</td>
                          <td>{row.checkedBy}</td>
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

              {/* CLOTH LOT COMPLETION TABLE */}
              {activePage === 'lot_completion' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>COMPLETION NO</th>
                        <th>DATE</th>
                        <th>LOT NO</th>
                        <th>SUPPLIER</th>
                        <th style={{ textAlign: 'right' }}>TOTAL METERS</th>
                        <th style={{ textAlign: 'right' }}>ACCEPTED METERS</th>
                        <th style={{ textAlign: 'right' }}>GRADE A</th>
                        <th style={{ textAlign: 'right' }}>GRADE B</th>
                        <th style={{ textAlign: 'right' }}>GRADE C</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotCompletions.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.lotNo}</td>
                          <td>{row.supplier}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalMeters} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.acceptedMeters} Mtr</td>
                          <td style={{ textAlign: 'right' }}>{row.gradeA}</td>
                          <td style={{ textAlign: 'right' }}>{row.gradeB}</td>
                          <td style={{ textAlign: 'right' }}>{row.gradeC}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FALLBACK INFO PANEL FOR REMAINING MODULES */}
              {!['design_upload', 'cloth_checking', 'lot_completion'].includes(activePage) && (
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

              {/* DESIGN UPLOAD FORM */}
              {activePage === 'design_upload' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Design No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Design Name *</label>
                      <input type="text" className="form-control" name="name" value={fields.name || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Design Category *</label>
                      <select className="form-control" name="category" value={fields.category || ''} onChange={handleInputChange}>
                        <option value="Dobby">Dobby</option>
                        <option value="Jacquard">Jacquard</option>
                        <option value="Plain">Plain</option>
                        <option value="Twill">Twill</option>
                        <option value="Satin">Satin</option>
                        <option value="Printed">Printed</option>
                        <option value="Embroidered">Embroidered</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fabric Type *</label>
                      <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Composition *</label>
                      <input type="text" className="form-control" name="composition" value={fields.composition || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Width (Inch) *</label>
                      <input type="number" className="form-control" name="width" value={fields.width || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Weight (GSM) *</label>
                      <input type="number" className="form-control" name="weight" value={fields.weight || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Weave Type *</label>
                      <input type="text" className="form-control" name="weaveType" value={fields.weaveType || ''} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              )}

              {/* CLOTH CHECKING FORM */}
              {activePage === 'cloth_checking' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Checking No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Supplier Name *</label>
                      <select className="form-control" name="supplierName" value={fields.supplierName || ''} onChange={handleInputChange}>
                        {BUYERS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gate Inward Ref No *</label>
                      <input type="text" className="form-control" name="gateInwardRef" value={fields.gateInwardRef || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Lot No *</label>
                      <input type="text" className="form-control" name="lotNo" value={fields.lotNo || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Total Pieces *</label>
                      <input type="number" className="form-control" name="totalPieces" value={fields.totalPieces || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Total Meters *</label>
                      <input type="number" className="form-control" name="totalMeters" value={fields.totalMeters || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Accepted Meters *</label>
                      <input type="number" className="form-control" name="acceptedMeters" value={fields.acceptedMeters || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Checked By *</label>
                      <select className="form-control" name="checkedBy" value={fields.checkedBy || ''} onChange={handleInputChange}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* FALLBACK SIMPLE CONFIGS FORM FOR REMAINING MODULES */}
              {!['design_upload', 'cloth_checking'].includes(activePage) && (
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

    </div>
  );
}
