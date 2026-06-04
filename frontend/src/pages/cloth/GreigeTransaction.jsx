import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, Factory, CheckSquare, ShoppingBag, Truck, FileText, Globe, Sparkles
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

  const [vendorInwards, setVendorInwards] = useState([]);
  const [greigeCheckings, setGreigeCheckings] = useState([]);
  const [clothMendings, setClothMendings] = useState([]);
  const [greigeDeliveries, setGreigeDeliveries] = useState([]);
  const [greigePackings, setGreigePackings] = useState([]);
  const [greigeGras, setGreigeGras] = useState([]);
  const [greigeInvoices, setGreigeInvoices] = useState([]);

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
      setGreigeDeliveries(allTxns.filter(t => ['cloth_delivery', 'bale_delivery'].includes(t.module_type)).map(mapTxn));
      setGreigePackings(allTxns.filter(t => ['cloth_packing', 'bale_amd', 'lot_amd'].includes(t.module_type)).map(mapTxn));
      setGreigeGras(allTxns.filter(t => t.module_type === 'goods_release').map(mapTxn));
      setGreigeInvoices(allTxns.filter(t => t.module_type === 'gry_invoice').map(mapTxn));
    } catch (err) {
      console.error("Failed to load greige transactions", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    // Greige Operations
    vendor_inward: { key: 'vendor_inward', label: "Vendor Inward", section: 'InwardChecking', category: 'Greige Operations', desc: "Record grey/greige fabric received from weaving vendors", icon: Factory, color: '#2563eb' },
    ot_checking: { key: 'ot_checking', label: "ON Table Checking", section: 'InwardChecking', category: 'Greige Operations', desc: "Quality inspection of greige/grey fabric on checking table", icon: CheckSquare, color: '#2563eb' },
    cloth_mending: { key: 'cloth_mending', label: "Cloth Mending Entry", section: 'InwardChecking', category: 'Greige Operations', desc: "Record repair/mending work done on defective greige fabric", icon: Layers, color: '#2563eb' },
    cloth_packing: { key: 'cloth_packing', label: "Cloth Packing (Greige)", section: 'PackingBale', category: 'Greige Operations', desc: "Pack greige fabric into bales for dispatch", icon: ShoppingBag, color: '#0d9488' },
    cloth_delivery: { key: 'cloth_delivery', label: "Cloth Delivery (Greige)", section: 'Delivery', category: 'Greige Operations', desc: "Record piece-wise delivery of greige/grey cloth to buyers", icon: Truck, color: '#0d9488' },
    bale_delivery: { key: 'bale_delivery', label: "Bale Delivery (Greige)", section: 'Delivery', category: 'Greige Operations', desc: "Record greige cloth delivery in bale format", icon: ShoppingBag, color: '#0d9488' },

    // Greige Administration
    bale_amd: { key: 'bale_amd', label: "Greige Bale AMD", section: 'PackingBale', category: 'Greige Administration', desc: "Amend greige bale details after packing if corrections needed", icon: Edit, color: '#475569' },
    lot_amd: { key: 'lot_amd', label: "Greige LOT AMD", section: 'PackingBale', category: 'Greige Administration', desc: "Amend greige lot details for corrections in lot-level data", icon: Edit, color: '#475569' },
    goods_release: { key: 'goods_release', label: "Greige Goods Release Advice", section: 'DispatchInvoice', category: 'Greige Administration', desc: "Authorize release of greige stock for dispatch", icon: FileText, color: '#10b981' },
    gry_invoice: { key: 'gry_invoice', label: "Gry Sales Invoice", section: 'DispatchInvoice', category: 'Greige Administration', desc: "Generate sales invoice specifically for grey/greige fabric sales", icon: FileText, color: '#10b981' },
    eway_bill: { key: 'eway_bill', label: "Cloth Delivery Eway Bill (Greige)", section: 'Delivery', category: 'Greige Administration', desc: "Generate E-Way Bill for greige cloth delivery (Link)", icon: Globe, isLink: true, route: '/eway-bill', color: '#8b5cf6' },
    einvoice_eway: { key: 'einvoice_eway', label: "Einvoice / Eway Bill (Greige)", section: 'DispatchInvoice', category: 'Greige Administration', desc: "Generate GST E-Invoice and E-Way Bill for greige sales", icon: Sparkles, color: '#8b5cf6' }
  };

  const getSubModuleCount = (key) => {
    switch(key) {
      case 'vendor_inward': return vendorInwards.length;
      case 'ot_checking': return greigeCheckings.length;
      case 'cloth_mending': return clothMendings.length;
      case 'cloth_delivery': return greigeDeliveries.length;
      case 'bale_delivery': return greigeDeliveries.length;
      case 'cloth_packing': return greigePackings.length;
      case 'goods_release': return greigeGras.length;
      case 'gry_invoice': return greigeInvoices.length;
      default: return 0;
    }
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
    const dateToday = new Date().toISOString().substring(0, 10);
    let initFields = { date: dateToday, status: 'Active' };

    if (activePage === 'vendor_inward') {
      initFields = { ...initFields, vendorInwardNo: '', vendorName: 'Standard Weaving Co.', vendorType: 'Power Loom Vendor', gateInwardRef: '', dcNo: '', dcDate: dateToday, designNo: 'DES-4091', fabricType: 'Grey Satin', totalPieces: '', totalMeters: '', totalWeight: '', totalValue: '', status: 'Completed' };
    } else if (activePage === 'ot_checking') {
      initFields = { ...initFields, otCheckingNo: '', vendorInwardRef: 'GRY-IN-001', vendorName: 'Standard Weaving Co.', designNo: 'DES-4091', lotNo: '', totalPieces: '', warpDefects: 0, weftDefects: 0, pointsPer100m: 0, grade: 'A — Exportable', mendingRequired: false, checkedBy: 'Murugan Swamy', status: 'Approved' };
    } else if (activePage === 'cloth_mending') {
      initFields = { ...initFields, voucherRefNo: '', otCheckingRef: 'GRY-CHK-001', designNo: 'DES-4091', lotNo: '', vendorName: 'Standard Weaving Co.', pieceNo: 1, mendingType: 'Weaving Repair', menderName: 'Senthil Kumar (General Manager)', totalPiecesMended: '', mendingCharges: '', supervisedBy: 'Mani Bharathi (Store Head)' };
    } else if (activePage === 'cloth_delivery') {
      initFields = { ...initFields, voucherRefNo: '', deliveryType: 'Sale Delivery', partyName: 'Raymond Ltd', graRef: '', designNo: 'DES-4091', lotNo: '', totalPieces: '', totalMeters: '', totalWeight: '', totalAmount: '', dcNo: '', vehicleNo: '', driverName: '', status: 'Dispatched' };
    } else if (activePage === 'cloth_packing') {
      initFields = { ...initFields, voucherRefNo: '', designNo: 'DES-4091', lotNo: '', packingType: 'Standard Bale', buyerName: 'Raymond Ltd', totalBales: '', totalPieces: '', totalMeters: '', totalNetWeight: '', packedBy: 'Murugan Swamy', status: 'Approved' };
    } else if (activePage === 'goods_release') {
      initFields = { ...initFields, voucherRefNo: '', buyerName: 'Raymond Ltd', designNo: 'DES-4091', lotNo: '', releaseType: 'Sale', totalMeters: '', totalWeight: '', totalAmount: '', deliveryAddress: '', expectedDispatch: dateToday, status: 'Approved' };
    } else if (activePage === 'gry_invoice') {
      initFields = { ...initFields, voucherRefNo: '', invoiceType: 'Tax Invoice', buyerName: 'Raymond Ltd', graRef: '', subtotal: '', totalGst: '', grandTotal: '', paymentTerms: '30 Days', status: 'Approved' };
    } else {
      initFields = { ...initFields, voucherRefNo: '', remarks: '' };
    }

    setFields(initFields);
    setSelectedRecord(null);
    setCurrentFormId('NEW RECORD');
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedRecord(row);
    setCurrentFormId(row.id);
    setFields({
      ...row,
      vendorInwardNo: row.vendorInwardNo || row.id,
      otCheckingNo: row.otCheckingNo || row.id,
      voucherRefNo: row.voucherRefNo || row.id
    });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const manualTxnNo = fields.vendorInwardNo || fields.otCheckingNo || fields.voucherRefNo;

    const payload = {
      module_type: activePage,
      date: fields.date || new Date().toISOString().substring(0, 10),
      buyer_name: fields.buyerName || fields.partyName || fields.vendorName || "Internal",
      status: fields.status || 'Active',
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
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(row.db_id)}><Trash2 size={12} /></button>
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
                      <label>Vendor Inward No *</label>
                      <input type="text" className="form-control" name="vendorInwardNo" value={fields.vendorInwardNo || ''} onChange={handleInputChange} required />
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
                      <label>OT Checking No *</label>
                      <input type="text" className="form-control" name="otCheckingNo" value={fields.otCheckingNo || ''} onChange={handleInputChange} required />
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
                      <label>Voucher Ref No *</label>
                      <input type="text" className="form-control" name="voucherRefNo" value={fields.voucherRefNo || ''} onChange={handleInputChange} required />
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
