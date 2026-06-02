import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Scissors, ShoppingCart,
  Percent, DollarSign, Activity, Palette, Box
} from 'lucide-react';
import { workOrderTransactionAPI } from '../../services/api';

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
  const BUYERS = ['Raymond Ltd', 'Vardhman Spinning', 'Reliance Retail', 'Standard Gears Ltd'];
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];
  const SEASONS = ['Summer 2026', 'Autumn/Winter 2026', 'Spring 2027', 'Mid-Season Core'];

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
      setFields({ id: nextId, date: dateToday, buyerName: 'Raymond Ltd', buyerOrderRef: '', season: 'Summer 2026', designNo: '', designName: '', category: 'Satin', fabricType: 'Satin Cotton', composition: '100% Cotton', width: 58, weight: 140, weaveType: 'Satin Weave', color: 'Midnight Navy', targetRate: '', targetDelivery: dateToday, status: 'Active' });
    }
    else if (activePage === 'short_amd') {
      nextId = `SHT-AMD-00${shortAmendments.length + 1}`;
      setFields({ id: nextId, date: dateToday, originalOrderType: 'Buyer Order', originalOrderRef: '', buyerName: 'Raymond Ltd', designNo: 'DES-4091', amendmentCategory: 'Quantity Short', originalQuantity: '', originalRate: '', amendedQuantity: '', amendedRate: '', shortQuantity: 0, shortValue: 0, reason: '', status: 'Approved' });
    }
    else if (activePage === 'vendor_order') {
      nextId = `VND-ORD-00${vendorOrders.length + 1}`;
      setFields({ id: nextId, date: dateToday, vendorName: 'Standard Weaving Co.', vendorType: 'Power Loom Weaver', buyerOrderRef: '', designNo: 'DES-4091', orderType: 'Weaving Jobwork', fabricType: 'Grey Satin', orderedQty: '', rate: '', amount: 0, yarnSuppliedBy: 'Self', totalValue: 0, status: 'Approved' });
    }
    else if (activePage === 'dyeing_order') {
      nextId = `DYE-ORD-00${dyeingOrders.length + 1}`;
      setFields({ id: nextId, date: dateToday, dyeingType: 'Yarn Dyeing', vendorName: 'Standard Dyehouse A', buyerOrderRef: '', designNo: 'DES-4091', totalQty: '', totalValue: '', status: 'Approved' });
    }
    else if (activePage === 'dev_bulk_order') {
      nextId = `DBO-2026-00${bulkOrders.length + 1}`;
      setFields({ id: nextId, date: dateToday, orderType: 'Development + Bulk', buyerName: 'Raymond Ltd', season: 'Summer 2026', totalDevQty: '', totalBulkQty: '', totalDevValue: '', totalBulkValue: '', status: 'Active' });
    }
    else if (activePage === 'dev_bulk_followup') {
      nextId = `DBF-2026-00${orderFollowups.length + 1}`;
      setFields({ id: nextId, date: dateToday, orderRefNo: 'DBO-2026-001', buyerName: 'Raymond Ltd', designNo: 'DES-4091', overallComplete: '', nextAction: '', nextFollowup: dateToday, status: 'In-Progress' });
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
        date: fields.date || new Date().toISOString().split('T')[0],
        buyer_name: fields.buyerName || fields.partyName || null,
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
                        <th>DATE</th>
                        <th>BUYER NAME</th>
                        <th>SEASON</th>
                        <th>DESIGN NO</th>
                        <th>DESIGN NAME</th>
                        <th>Composition</th>
                        <th style={{ textAlign: 'right' }}>WIDTH (INCH)</th>
                        <th style={{ textAlign: 'right' }}>RATE</th>
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
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                          <td>{row.season}</td>
                          <td>{row.designNo}</td>
                          <td>{row.designName}</td>
                          <td>{row.composition}</td>
                          <td style={{ textAlign: 'right' }}>{row.width}"</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{row.targetRate}</td>
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

              {/* SHORT AMD TABLE */}
              {activePage === 'short_amd' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>SHORT AMD NO</th>
                        <th>DATE</th>
                        <th>ORDER REF</th>
                        <th>BUYER NAME</th>
                        <th style={{ textAlign: 'right' }}>ORIGINAL QTY</th>
                        <th style={{ textAlign: 'right' }}>AMENDED QTY</th>
                        <th style={{ textAlign: 'right' }}>SHORT QTY</th>
                        <th style={{ textAlign: 'right' }}>SHORT VALUE</th>
                        <th>REASON</th>
                        <th>STATUS</th>
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
                          <td>{row.date}</td>
                          <td>{row.originalOrderRef}</td>
                          <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                          <td style={{ textAlign: 'right' }}>{row.originalQuantity} Mtr</td>
                          <td style={{ textAlign: 'right' }}>{row.amendedQuantity} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.shortQuantity} Mtr</td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>₹{row.shortValue.toLocaleString()}</td>
                          <td>{row.reason}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* WARPING / SIZING ORDER TABLE */}
              {activePage === 'warp_sizing_order' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>WARPING NO</th>
                        <th>DATE</th>
                        <th>VENDOR / PARTY</th>
                        <th>DESIGN NO</th>
                        <th>ORDER TYPE</th>
                        <th style={{ textAlign: 'right' }}>TOTAL ENDS</th>
                        <th style={{ textAlign: 'right' }}>WARP LENGTH</th>
                        <th style={{ textAlign: 'right' }}>BEAMS</th>
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
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.vendorName || row.buyerName || row.partyName}</td>
                          <td>{row.designNo || '-'}</td>
                          <td>{row.orderType || '-'}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalEnds || 0}</td>
                          <td style={{ textAlign: 'right' }}>{row.warpLength || 0} Mtr</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.noOfBeams || 0}</td>
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

              {/* FALLBACK INFO PANEL */}
              {!['design_create', 'short_amd', 'warp_sizing_order'].includes(activePage) && (
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
                        {BUYERS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Season *</label>
                      <select className="form-control" name="season" value={fields.season || ''} onChange={handleInputChange}>
                        {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Design Name *</label>
                      <input type="text" className="form-control" name="designName" value={fields.designName || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Fabric Type *</label>
                      <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} required />
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
              {activePage === 'short_amd' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Short AMD No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Original Order Ref *</label>
                      <input type="text" className="form-control" name="originalOrderRef" value={fields.originalOrderRef || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Original Quantity (Mtr) *</label>
                      <input type="number" className="form-control" name="originalQuantity" value={fields.originalQuantity || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Amended Quantity (Mtr) *</label>
                      <input type="number" className="form-control" name="amendedQuantity" value={fields.amendedQuantity || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Original Rate (₹) *</label>
                      <input type="number" className="form-control" name="originalRate" value={fields.originalRate || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Amended Rate (₹) *</label>
                      <input type="number" className="form-control" name="amendedRate" value={fields.amendedRate || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Short Quantity (Auto)</label>
                      <input type="number" className="form-control" value={(fields.originalQuantity || 0) - (fields.amendedQuantity || 0)} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Reason *</label>
                      <input type="text" className="form-control" name="reason" value={fields.reason || ''} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              )}

              {/* FALLBACK SIMPLE CONFIGS FORM FOR REMAINING MODULES */}
              {!['design_create', 'short_amd'].includes(activePage) && (
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
