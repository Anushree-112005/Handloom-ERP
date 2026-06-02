import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scissors, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Truck, Globe, Printer, BookOpen, 
  MapPin, HelpCircle, Sparkles, Database, Shield, Layers 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function GreigeTransaction() {
  const navigate = useNavigate();

  // Top Section Tabs: 'InwardChecking' | 'Delivery' | 'PackingBale' | 'DispatchInvoice'
  const [activeSection, setActiveSection] = useState('InwardChecking');

  // Currently open sub-page
  const [activePage, setActivePage] = useState(null);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  // Static lists for selections
  const VENDORS = ['Standard Weaving Co.', 'Senthil Loom Mills', 'Own Loom Unit A', 'Standard Gears Ltd'];
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];
  const DESIGNS = ['DES-4091 Premium Satin', 'DES-5011 Weave Twill', 'DES-2012 Plain Voile', 'DES-8812 Indigo Chambray'];

  // =========================================================================
  // STATE STORE FOR NEW WORKSPACES
  // =========================================================================

  // 1. VENDOR INWARD
  const [vendorInwards, setVendorInwards] = useState([]);

  // 2. ON TABLE CHECKING (GREIGE)
  const [greigeCheckings, setGreigeCheckings] = useState([]);

  // 3. CLOTH MENDING ENTRY
  const [clothMendings, setClothMendings] = useState([]);

  // 4. CLOTH DELIVERY (GREIGE)
  const [greigeDeliveries, setGreigeDeliveries] = useState([]);

  // 7. CLOTH PACKING (GREIGE)
  const [greigePackings, setGreigePackings] = useState([]);

  // 10. GREIGE GOODS RELEASE ADVICE (GRA)
  const [greigeGras, setGreigeGras] = useState([]);

  // 11. GRY SALES INVOICE
  const [greigeInvoices, setGreigeInvoices] = useState([]);

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
    // Inward Checking
    vendor_inward: { key: 'vendor_inward', label: "Vendor Inward", section: 'InwardChecking', desc: "Record grey/greige fabric received from weaving vendors", icon: Factory },
    ot_checking: { key: 'ot_checking', label: "ON Table Checking", section: 'InwardChecking', desc: "Quality inspection of greige/grey fabric on checking table", icon: CheckSquare },
    cloth_mending: { key: 'cloth_mending', label: "Cloth Mending Entry", section: 'InwardChecking', desc: "Record repair/mending work done on defective greige fabric", icon: Layers },

    // Delivery
    cloth_delivery: { key: 'cloth_delivery', label: "Cloth Delivery (Greige)", section: 'Delivery', desc: "Record piece-wise delivery of greige/grey cloth to buyers", icon: Truck },
    bale_delivery: { key: 'bale_delivery', label: "Bale Delivery (Greige)", section: 'Delivery', desc: "Record greige cloth delivery in bale format", icon: ShoppingBag },
    eway_bill: { key: 'eway_bill', label: "Cloth Delivery Eway Bill (Greige)", section: 'Delivery', desc: "Generate E-Way Bill for greige cloth delivery (Link)", icon: Globe, isLink: true, route: '/eway-bill' },

    // Packing & Bale
    cloth_packing: { key: 'cloth_packing', label: "Cloth Packing (Greige)", section: 'PackingBale', desc: "Pack greige fabric into bales for dispatch", icon: ShoppingBag },
    bale_amd: { key: 'bale_amd', label: "Greige Bale AMD", section: 'PackingBale', desc: "Amend greige bale details after packing if corrections needed", icon: Edit },
    lot_amd: { key: 'lot_amd', label: "Greige LOT AMD", section: 'PackingBale', desc: "Amend greige lot details for corrections in lot-level data", icon: Edit },

    // Dispatch & Invoice
    goods_release: { key: 'goods_release', label: "Greige Goods Release Advice", section: 'DispatchInvoice', desc: "Authorize release of greige stock for dispatch", icon: FileText },
    gry_invoice: { key: 'gry_invoice', label: "Gry Sales Invoice", section: 'DispatchInvoice', desc: "Generate sales invoice specifically for grey/greige fabric sales", icon: FileText },
    einvoice_eway: { key: 'einvoice_eway', label: "Einvoice / Eway Bill (Greige)", section: 'DispatchInvoice', desc: "Generate GST E-Invoice and E-Way Bill for greige sales", icon: Sparkles }
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

    if (activePage === 'vendor_inward') {
      nextId = `GRY-IN-${vendorInwards.length + 1}`;
      setFields({ id: nextId, date: dateToday, vendorName: 'Standard Weaving Co.', vendorType: 'Power Loom Vendor', gateInwardRef: '', dcNo: '', dcDate: dateToday, designNo: 'DES-4091', fabricType: 'Grey Satin', totalPieces: '', totalMeters: '', totalWeight: '', totalValue: '', status: 'Completed' });
    }
    else if (activePage === 'ot_checking') {
      nextId = `GRY-CHK-00${greigeCheckings.length + 1}`;
      setFields({ id: nextId, date: dateToday, vendorInwardRef: 'GRY-IN-001', vendorName: 'Standard Weaving Co.', designNo: 'DES-4091', lotNo: '', totalPieces: '', warpDefects: 0, weftDefects: 0, pointsPer100m: 0, grade: 'A — Exportable', mendingRequired: false, checkedBy: 'Murugan Swamy', status: 'Approved' });
    }
    else if (activePage === 'cloth_mending') {
      nextId = `GRY-MND-00${clothMendings.length + 1}`;
      setFields({ id: nextId, date: dateToday, otCheckingRef: 'GRY-CHK-001', designNo: 'DES-4091', lotNo: '', vendorName: 'Standard Weaving Co.', pieceNo: 1, mendingType: 'Weaving Repair', menderName: 'Senthil Kumar (General Manager)', totalPiecesMended: '', mendingCharges: '', supervisedBy: 'Mani Bharathi (Store Head)' });
    }
    else if (activePage === 'cloth_delivery') {
      nextId = `GRY-DEL-00${greigeDeliveries.length + 1}`;
      setFields({ id: nextId, date: dateToday, deliveryType: 'Sale Delivery', partyName: 'Raymond Ltd', graRef: '', designNo: 'DES-4091', lotNo: '', totalPieces: '', totalMeters: '', totalWeight: '', totalAmount: '', dcNo: '', vehicleNo: '', driverName: '', status: 'Dispatched' });
    }
    else if (activePage === 'cloth_packing') {
      nextId = `GRY-PKG-00${greigePackings.length + 1}`;
      setFields({ id: nextId, date: dateToday, designNo: 'DES-4091', lotNo: '', packingType: 'Standard Bale', buyerName: 'Raymond Ltd', totalBales: '', totalPieces: '', totalMeters: '', totalNetWeight: '', packedBy: 'Murugan Swamy', status: 'Approved' });
    }
    else if (activePage === 'goods_release') {
      nextId = `GRY-GRA-00${greigeGras.length + 1}`;
      setFields({ id: nextId, date: dateToday, buyerName: 'Raymond Ltd', designNo: 'DES-4091', lotNo: '', releaseType: 'Sale', totalMeters: '', totalWeight: '', totalAmount: '', deliveryAddress: '', expectedDispatch: dateToday, status: 'Approved' });
    }
    else if (activePage === 'gry_invoice') {
      nextId = `GRY-INV-00${greigeInvoices.length + 1}`;
      setFields({ id: nextId, date: dateToday, invoiceType: 'Tax Invoice', buyerName: 'Raymond Ltd', graRef: '', subtotal: '', totalGst: '', grandTotal: '', paymentTerms: '30 Days', status: 'Approved' });
    }
    else {
      // General Fallback
      nextId = `TXN-GRY-00${designs.length + 1}`;
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

    if (activePage === 'vendor_inward') {
      const exists = vendorInwards.some(d => d.id === currentFormId);
      if (exists) setVendorInwards(vendorInwards.map(d => d.id === currentFormId ? fields : d));
      else setVendorInwards([fields, ...vendorInwards]);
    }
    else if (activePage === 'ot_checking') {
      const exists = greigeCheckings.some(d => d.id === currentFormId);
      if (exists) setGreigeCheckings(greigeCheckings.map(d => d.id === currentFormId ? fields : d));
      else setGreigeCheckings([fields, ...greigeCheckings]);
    }
    else if (activePage === 'cloth_mending') {
      const exists = clothMendings.some(d => d.id === currentFormId);
      if (exists) setClothMendings(clothMendings.map(d => d.id === currentFormId ? fields : d));
      else setClothMendings([fields, ...clothMendings]);
    }
    else if (activePage === 'cloth_delivery') {
      const exists = greigeDeliveries.some(d => d.id === currentFormId);
      if (exists) setGreigeDeliveries(greigeDeliveries.map(d => d.id === currentFormId ? fields : d));
      else setGreigeDeliveries([fields, ...greigeDeliveries]);
    }
    else if (activePage === 'cloth_packing') {
      const exists = greigePackings.some(d => d.id === currentFormId);
      if (exists) setGreigePackings(greigePackings.map(d => d.id === currentFormId ? fields : d));
      else setGreigePackings([fields, ...greigePackings]);
    }
    else if (activePage === 'goods_release') {
      const exists = greigeGras.some(d => d.id === currentFormId);
      if (exists) setGreigeGras(greigeGras.map(d => d.id === currentFormId ? fields : d));
      else setGreigeGras([fields, ...greigeGras]);
    }
    else if (activePage === 'gry_invoice') {
      const exists = greigeInvoices.some(d => d.id === currentFormId);
      if (exists) setGreigeInvoices(greigeInvoices.map(d => d.id === currentFormId ? fields : d));
      else setGreigeInvoices([fields, ...greigeInvoices]);
    }

    setIsFormOpen(false);
    alert("Greige production record processed and saved!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to remove this greige transaction entry?")) {
      if (activePage === 'vendor_inward') setVendorInwards(vendorInwards.filter(d => d.id !== id));
      if (activePage === 'ot_checking') setGreigeCheckings(greigeCheckings.filter(d => d.id !== id));
      if (activePage === 'cloth_mending') setClothMendings(clothMendings.filter(d => d.id !== id));
      if (activePage === 'cloth_delivery') setGreigeDeliveries(greigeDeliveries.filter(d => d.id !== id));
      if (activePage === 'cloth_packing') setGreigePackings(greigePackings.filter(d => d.id !== id));
      if (activePage === 'goods_release') setGreigeGras(greigeGras.filter(d => d.id !== id));
      if (activePage === 'gry_invoice') setGreigeInvoices(greigeInvoices.filter(d => d.id !== id));
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>

      {/* HEADER TITLE BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Layers size={24} style={{ color: '#2563eb' }} /> Greige Transaction Desk
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            {activePage ? `Operational Sub-Page: ${PAGES_METADATA[activePage].label}` : "Manage raw/grey fabric prior to finishing, processing, and domestic sales."}
          </p>
        </div>
        <div>
          {activePage ? (
            <button className="btn btn-secondary" onClick={() => setActivePage(null)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <X size={15} /> Exit Workspace
            </button>
          ) : (
            <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', borderRadius: '4px', fontWeight: 800 }}>
              Greige Raw Fabric Ledger
            </span>
          )}
        </div>
      </div>

      {/* TOP DESK 4 DIVISION SWITCH TABS */}
      {!activePage && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '28px' }}>
            {[
              { key: 'InwardChecking', label: 'Inward & Checking' },
              { key: 'Delivery', label: 'Delivery Workflows' },
              { key: 'PackingBale', label: 'Packing & Bale' },
              { key: 'DispatchInvoice', label: 'Dispatch & Invoice' }
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
                    background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'white',
                    color: isSelected ? '#2563eb' : 'var(--text-secondary)',
                    border: isSelected ? '2px solid #2563eb' : '1px solid var(--border)',
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
                      e.currentTarget.style.borderColor = '#2563eb';
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
                      background: 'rgba(37, 99, 235, 0.05)',
                      color: '#2563eb'
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
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure raw fabric ledgers and dispatch logs</span>
                </div>
                <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#2563eb', borderColor: '#2563eb' }}>
                  <Plus size={16} /> Add Greige Entry
                </button>
              </div>

              {/* VENDOR INWARD TABLE */}
              {activePage === 'vendor_inward' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>INWARD NO</th>
                        <th>DATE</th>
                        <th>VENDOR NAME</th>
                        <th>VENDOR TYPE</th>
                        <th>DC NO</th>
                        <th>FABRIC TYPE</th>
                        <th style={{ textAlign: 'right' }}>TOTAL PIECES</th>
                        <th style={{ textAlign: 'right' }}>TOTAL METERS</th>
                        <th style={{ textAlign: 'right' }}>TOTAL VALUE</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorInwards.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                          <td>{row.vendorType}</td>
                          <td>{row.dcNo}</td>
                          <td>{row.fabricType}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalPieces}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>{row.totalMeters} Mtr</td>
                          <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>₹{row.totalValue.toLocaleString()}</td>
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

              {/* ON TABLE CHECKING TABLE */}
              {activePage === 'ot_checking' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>OT CHECKING NO</th>
                        <th>DATE</th>
                        <th>INWARD REF</th>
                        <th>VENDOR NAME</th>
                        <th>DESIGN NO</th>
                        <th style={{ textAlign: 'right' }}>TOTAL PIECES</th>
                        <th>GRADE</th>
                        <th>CHECKED BY</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {greigeCheckings.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td>{row.vendorInwardRef}</td>
                          <td style={{ fontWeight: 650 }}>{row.vendorName}</td>
                          <td>{row.designNo}</td>
                          <td style={{ textAlign: 'right' }}>{row.totalPieces}</td>
                          <td><span className="badge badge-active">{row.grade}</span></td>
                          <td>{row.checkedBy}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* FALLBACK INFO PANEL FOR REMAINING MODULES */}
              {!['vendor_inward', 'ot_checking'].includes(activePage) && (
                <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'white' }}>
                  <Sparkles size={36} style={{ color: '#2563eb', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 800, margin: 0 }}>Greige Ledger Active</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Database forms and checking grids are active. Click "Add Greige Entry" to create a new raw fabric voucher.
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
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure raw material traceability and quality tracking</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <X size={15} /> Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#2563eb', borderColor: '#2563eb' }}>
                    <Check size={15} /> Save Record
                  </button>
                </div>
              </div>

              {/* VENDOR INWARD FORM */}
              {activePage === 'vendor_inward' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Vendor Inward No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Vendor Name *</label>
                      <select className="form-control" name="vendorName" value={fields.vendorName || ''} onChange={handleInputChange}>
                        {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Vendor Type *</label>
                      <select className="form-control" name="vendorType" value={fields.vendorType || ''} onChange={handleInputChange}>
                        <option value="Power Loom Vendor">Power Loom Vendor</option>
                        <option value="Hand Loom Vendor">Hand Loom Vendor</option>
                        <option value="Own Loom">Own Loom</option>
                        <option value="Job Worker">Job Worker</option>
                        <option value="Outside Purchase">Outside Purchase</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Gate Inward Ref No *</label>
                      <input type="text" className="form-control" name="gateInwardRef" value={fields.gateInwardRef || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>DC No. / Challan No *</label>
                      <input type="text" className="form-control" name="dcNo" value={fields.dcNo || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>DC Date *</label>
                      <input type="date" className="form-control" name="dcDate" value={fields.dcDate || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Fabric Type *</label>
                      <input type="text" className="form-control" name="fabricType" value={fields.fabricType || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Expected Rate *</label>
                      <input type="number" className="form-control" name="expectedRate" value={fields.expectedRate || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Total Pieces *</label>
                      <input type="number" className="form-control" name="totalPieces" value={fields.totalPieces || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Total Meters *</label>
                      <input type="number" className="form-control" name="totalMeters" value={fields.totalMeters || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Total Weight (KG) *</label>
                      <input type="number" className="form-control" name="totalWeight" value={fields.totalWeight || ''} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              )}

              {/* OT CHECKING FORM */}
              {activePage === 'ot_checking' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>OT Checking No</label>
                      <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                    </div>
                    <div className="form-group">
                      <label>Vendor Inward Ref *</label>
                      <input type="text" className="form-control" name="vendorInwardRef" value={fields.vendorInwardRef || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Warp Defects *</label>
                      <input type="number" className="form-control" name="warpDefects" value={fields.warpDefects || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Weft Defects *</label>
                      <input type="number" className="form-control" name="weftDefects" value={fields.weftDefects || ''} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Grade Options *</label>
                      <select className="form-control" name="grade" value={fields.grade || 'A — Exportable'} onChange={handleInputChange}>
                        <option value="A — Exportable">A — Exportable</option>
                        <option value="B — Domestic First">B — Domestic First</option>
                        <option value="C — Second Quality">C — Second Quality</option>
                        <option value="D — Reject/Waste">D — Reject/Waste</option>
                      </select>
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
              {!['vendor_inward', 'ot_checking'].includes(activePage) && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ color: '#2563eb', fontSize: '14px', fontWeight: 800, margin: 0 }}>Voucher Details & Audit Configs</h4>
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
