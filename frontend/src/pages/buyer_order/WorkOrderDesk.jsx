import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Scissors, ShoppingCart,
  Percent, DollarSign, Activity, Palette, Box
} from 'lucide-react';

export default function WorkOrderDesk({ defaultSection = 'Transactions' }) {
  const navigate = useNavigate();

  // Switch tabs between the 4 main sub-sections: 'Transactions' | 'Approvals' | 'Completions' | 'DCApprovals'
  const [activeSection, setActiveSection] = useState(defaultSection);

  // Synchronize state when routing changes prop
  useEffect(() => {
    setActiveSection(defaultSection);
    setActivePage(null);
  }, [defaultSection]);

  // Currently open sub-page key (e.g. 'design_create')
  const [activePage, setActivePage] = useState(null);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

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
    design_create: { key: 'design_create', label: "Design Create", section: 'Transactions', desc: "Create new design orders linked to buyer requirements", icon: FileText },
    short_amd: { key: 'short_amd', label: "Short AMD", section: 'Transactions', desc: "Record short/partial amendments to existing orders", icon: Edit },
    hsn_amd: { key: 'hsn_amd', label: "HSN Code AMD", section: 'Transactions', desc: "Update or correct HSN codes on existing orders/invoices", icon: Edit },
    vendor_order: { key: 'vendor_order', label: "Vendor Order", section: 'Transactions', desc: "Create work orders for external weaving/processing vendors", icon: Factory },
    dyeing_order: { key: 'dyeing_order', label: "Dyeing Order", section: 'Transactions', desc: "Create orders for yarn/fabric dyeing to dyeing vendors", icon: Palette },
    doubling_twisting: { key: 'doubling_twisting', label: "Doubling/Twisting Order", section: 'Transactions', desc: "Create orders for yarn doubling and twisting process", icon: Layers },
    warp_sizing_order: { key: 'warp_sizing_order', label: "Warping/Sizing Order (Yn Dyed)", section: 'Transactions', desc: "Create warping/sizing orders specifically for yarn-dyed fabric", icon: Layers },
    internal_fabric_req: { key: 'internal_fabric_req', label: "Internal Fabric Request", section: 'Transactions', desc: "Request fabric from internal stock for production/sampling", icon: ShoppingBag },
    cloth_po: { key: 'cloth_po', label: "Cloth Purchase Order", section: 'Transactions', desc: "Create purchase orders for buying cloth/fabric from market", icon: ShoppingCart },
    cloth_dyeing_order: { key: 'cloth_dyeing_order', label: "Cloth Dyeing/Processing Order", section: 'Transactions', desc: "Send cloth for dyeing, printing, or processing to vendors", icon: Palette },
    dev_bulk_order: { key: 'dev_bulk_order', label: "Development/Bulk Order", section: 'Transactions', desc: "Create development samples or bulk production orders", icon: Box },
    dev_bulk_followup: { key: 'dev_bulk_followup', label: "Development/Bulk Followup", section: 'Transactions', desc: "Track progress and followup on development and bulk orders", icon: Activity },

    // 2. WORK ORDER APPROVAL
    buyer_order_app: { key: 'buyer_order_app', label: "Buyer Order Approval", section: 'Approvals', desc: "Formally approve buyer orders before production starts", icon: CheckSquare },
    pi_app: { key: 'pi_app', label: "PI Approval", section: 'Approvals', desc: "Approve Proforma Invoice before sending to buyer", icon: CheckSquare },
    vendor_work_app: { key: 'vendor_work_app', label: "Vendor Work Order Approval", section: 'Approvals', desc: "Approve work orders issued to vendors before release", icon: CheckSquare },
    internal_fabric_app: { key: 'internal_fabric_app', label: "Internal Fabric Request Approval", section: 'Approvals', desc: "Approve internal fabric requests from departments", icon: CheckSquare },
    yarn_req_app: { key: 'yarn_req_app', label: "Yarn Requirement Approval", section: 'Approvals', desc: "Approve yarn requirement requests before purchase/issue", icon: CheckSquare },
    yarn_work_app: { key: 'yarn_work_app', label: "Yarn Work Orders Approval", section: 'Approvals', desc: "Approve work orders for yarn processing (dyeing/twisting)", icon: CheckSquare },

    // 3. WORK ORDER COMPLETION
    vendor_order_comp: { key: 'vendor_order_comp', label: "Vendor Order Completion", section: 'Completions', desc: "Mark vendor weaving orders as complete after fabric received", icon: CheckSquare },
    dyeing_order_comp: { key: 'dyeing_order_comp', label: "Dyeing Order Completion", section: 'Completions', desc: "Mark dyeing orders complete after dyed material received", icon: CheckSquare },
    warp_sizing_comp: { key: 'warp_sizing_comp', label: "Warping/Sizing Order Completion", section: 'Completions', desc: "Mark warping/sizing orders complete", icon: CheckSquare },
    cloth_po_comp: { key: 'cloth_po_comp', label: "Cloth Purchase Order Completion", section: 'Completions', desc: "Mark cloth purchase orders complete after full receipt", icon: CheckSquare },
    cloth_dyeing_comp: { key: 'cloth_dyeing_comp', label: "Cloth Dyeing/Processing Order Completion", section: 'Completions', desc: "Mark cloth dyeing/processing orders complete", icon: CheckSquare },

    // 4. DC APPROVAL
    gra_approval: { key: 'gra_approval', label: "GRA Approval", section: 'DCApprovals', desc: "Approve Goods Release Advice before fabric dispatch", icon: CheckSquare },
    surplus_dc_app: { key: 'surplus_dc_app', label: "Surplus DC Approval", section: 'DCApprovals', desc: "Approve delivery challans for surplus stock dispatch", icon: CheckSquare }
  };

  // =========================================================================
  // ACTIONS HANDLERS
  // =========================================================================
  const handleOpenPage = (p) => {
    setActivePage(p.key);
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

  const handleSave = (e) => {
    e.preventDefault();

    if (activePage === 'design_create') {
      const exists = designOrders.some(d => d.id === currentFormId);
      if (exists) setDesignOrders(designOrders.map(d => d.id === currentFormId ? fields : d));
      else setDesignOrders([fields, ...designOrders]);
    }
    else if (activePage === 'short_amd') {
      const exists = shortAmendments.some(d => d.id === currentFormId);
      if (exists) setShortAmendments(shortAmendments.map(d => d.id === currentFormId ? fields : d));
      else setShortAmendments([fields, ...shortAmendments]);
    }
    else if (activePage === 'vendor_order') {
      const exists = vendorOrders.some(d => d.id === currentFormId);
      if (exists) setVendorOrders(vendorOrders.map(d => d.id === currentFormId ? fields : d));
      else setVendorOrders([fields, ...vendorOrders]);
    }
    else if (activePage === 'dyeing_order') {
      const exists = dyeingOrders.some(d => d.id === currentFormId);
      if (exists) setDyeingOrders(dyeingOrders.map(d => d.id === currentFormId ? fields : d));
      else setDyeingOrders([fields, ...dyeingOrders]);
    }
    else if (activePage === 'dev_bulk_order') {
      const exists = bulkOrders.some(d => d.id === currentFormId);
      if (exists) setBulkOrders(bulkOrders.map(d => d.id === currentFormId ? fields : d));
      else setBulkOrders([fields, ...bulkOrders]);
    }
    else if (activePage === 'dev_bulk_followup') {
      const exists = orderFollowups.some(d => d.id === currentFormId);
      if (exists) setOrderFollowups(orderFollowups.map(d => d.id === currentFormId ? fields : d));
      else setOrderFollowups([fields, ...orderFollowups]);
    }

    setIsFormOpen(false);
    alert("Work order transaction record saved successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to remove this work order ledger entry?")) {
      if (activePage === 'design_create') setDesignOrders(designOrders.filter(d => d.id !== id));
      if (activePage === 'short_amd') setShortAmendments(shortAmendments.filter(d => d.id !== id));
      if (activePage === 'vendor_order') setVendorOrders(vendorOrders.filter(d => d.id !== id));
      if (activePage === 'dyeing_order') setDyeingOrders(dyeingOrders.filter(d => d.id !== id));
      if (activePage === 'dev_bulk_order') setBulkOrders(bulkOrders.filter(d => d.id !== id));
      if (activePage === 'dev_bulk_followup') setOrderFollowups(orderFollowups.filter(d => d.id !== id));
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <ShoppingCart size={24} style={{ color: '#ec4899' }} /> Work Order Transaction & Approval Desk
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            {activePage ? `Operational Sub-Page: ${PAGES_METADATA[activePage].label}` : "Massive order scheduling matrix, design parameters, doubling and twisting audits, and delivery challan signoffs."}
          </p>
        </div>
        <div>
          {activePage ? (
            <button className="btn btn-secondary" onClick={() => setActivePage(null)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <X size={15} /> Exit Workspace
            </button>
          ) : (
            <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(236, 72, 153, 0.08)', color: '#ec4899', borderRadius: '4px', fontWeight: 800 }}>
              Order Lifecycle Portal
            </span>
          )}
        </div>
      </div>

      {/* TOP DESK 4 DIVISION SWITCH TABS */}
      {!activePage && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '28px' }}>
            {[
              { key: 'Transactions', label: 'Work Order Transactions' },
              { key: 'Approvals', label: 'Work Order Approvals' },
              { key: 'Completions', label: 'Work Order Completions' },
              { key: 'DCApprovals', label: 'DC Approvals' }
            ].map(sec => {
              const isSelected = activeSection === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  style={{
                    padding: '12px 6px',
                    fontSize: '12px',
                    fontWeight: '850',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(236, 72, 153, 0.08)' : 'white',
                    color: isSelected ? '#ec4899' : 'var(--text-secondary)',
                    border: isSelected ? '2px solid #ec4899' : '1px solid var(--border)',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* ACTIVE DIVISION'S SUB-MODULE CARDS GRID */}
          <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
            📂 Select {activeSection} Module
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
            {Object.values(PAGES_METADATA)
              .filter(p => p.section === activeSection)
              .map(p => {
                const IconComp = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleOpenPage(p)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      padding: '20px',
                      borderRadius: '12px',
                      background: 'white',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      boxShadow: 'none',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ec4899';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(236, 72, 153, 0.05)',
                      color: '#ec4899'
                    }}>
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: '850', fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                        {p.label}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '500', lineHeight: '1.3' }}>
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </>
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
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Complete audit-log and quality checks directory</span>
                </div>
                <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#ec4899', borderColor: '#ec4899' }}>
                  <Plus size={16} /> Log New Work Order Entry
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
                        <tr key={row.id}>
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
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.id)}><Trash2 size={12} /></button>
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
                        <tr key={row.id}>
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

              {/* FALLBACK INFO PANEL */}
              {!['design_create', 'short_amd'].includes(activePage) && (
                <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'white' }}>
                  <Sparkles size={36} style={{ color: '#ec4899', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 800, margin: 0 }}>Order Ledger Database Active</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Record sheets and dynamic checklists are loaded in standard secure sandboxed modules. Click "Log New Work Order Entry" to populate details.
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
