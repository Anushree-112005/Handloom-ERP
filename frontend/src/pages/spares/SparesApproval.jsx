import { useState, useMemo } from 'react';
import {
  CheckSquare, Search, Plus, Trash2, Edit, Check, X, Download,
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, PlusCircle, Wrench
} from 'lucide-react';

export default function SparesApproval() {
  // Approval Category Tab: 'IndentApproval' | 'POApproval'
  const [activeTab, setActiveTab] = useState('IndentApproval');

  // Search Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('Reference Info');

  // Static reference lists
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];

  // ----------------------------------------------------
  // 1. REQUEST INDENT APPROVAL DATA & FORM STATES
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
  // 2. PURCHASE ORDER APPROVAL DATA & FORM STATES
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
  // GENERAL ACTION HANDLERS
  // ----------------------------------------------------
  const handleCreateNew = () => {
    let nextId = '';
    if (activeTab === 'IndentApproval') nextId = `IAP-2026-00${indentApprovals.length + 1}`;
    if (activeTab === 'POApproval') nextId = `POA-2026-00${poApprovals.length + 1}`;

    setCurrentFormId(nextId);
    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const dateToday = new Date().toISOString().substring(0, 10);

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

    setIsFormOpen(false);
    alert("Approval sanction logged successfully!");
  };

  const handleEdit = (row) => {
    setCurrentFormId(row.id);
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

    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this approval transaction record?")) {
      if (activeTab === 'IndentApproval') setIndentApprovals(indentApprovals.filter(iap => iap.id !== id));
      if (activeTab === 'POApproval') setPoApprovals(poApprovals.filter(poa => poa.id !== id));
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
                <CheckSquare size={24} style={{ color: '#7c3aed' }} /> Maintenance & Spares Approvals Hub
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
                Verify and sanction internal spares indent requests and supplier purchase orders prior to execution.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => alert('Exporting approvals data...')}>
                <Download size={15} /> Export Ledger
              </button>
              <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Plus size={16} /> Add Approval Record
              </button>
            </div>
          </div>

          {/* DYNAMIC CARD-BASED TAB SELECTORS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {[
              {
                key: 'IndentApproval',
                label: 'Request Indent Approval',
                desc: 'Audit and authorize internal machine spare part requests raised by weaving / spinning floors.',
                icon: FolderKanban
              },
              {
                key: 'POApproval',
                label: 'Purchase PO Approval',
                desc: 'Authorize outbound spare part purchase orders and approved rates for preferred vendors.',
                icon: ShoppingBag
              }
            ].map(tab => {
              const isSelected = activeTab === tab.key;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchTerm('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 24px',
                    borderRadius: '12px',
                    background: 'white',
                    border: isSelected ? '2px solid #7c3aed' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    boxShadow: isSelected ? '0 10px 25px -5px rgba(124, 58, 237, 0.12), 0 8px 10px -6px rgba(124, 58, 237, 0.12)' : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    outline: 'none'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? 'rgba(124, 58, 237, 0.1)' : 'rgba(100, 116, 139, 0.06)',
                    color: isSelected ? '#7c3aed' : '#64748b',
                    flexShrink: 0
                  }}>
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 style={{
                      fontWeight: '850',
                      fontSize: '15px',
                      color: isSelected ? '#7c3aed' : 'var(--text-primary)',
                      margin: 0
                    }}>
                      {tab.label}
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: '4px 0 0 0',
                      fontWeight: '500',
                      lineHeight: '1.4'
                    }}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC DATA TABLE */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
            <div style={{ overflowX: 'auto' }}>

              {activeTab === 'IndentApproval' ? (
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
              ) : (
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
                {activeTab === 'IndentApproval' ? `Request Indent Clearance Approval — ${currentFormId}` : `Purchase Order Sanctioning — ${currentFormId}`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Security and maintenance clearance workflow matrices</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <X size={15} /> Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Check size={15} /> Save Approval
              </button>
            </div>
          </div>

          {/* Multi-section tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px' }}>
            {['Reference Info', 'Approval Setup Details', 'Grid Details Matrix'].map(tab => {
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
                    <label>Approval Voucher ID</label>
                    <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                  </div>

                  {activeTab === 'IndentApproval' ? (
                    <>
                      <div className="form-group">
                        <label>Indent Ref No Link *</label>
                        <input type="text" className="form-control" placeholder="e.g. IND-2026-001" value={iapIndentRef} onChange={e => setIapIndentRef(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Section (Auto Fill)</label>
                        <input type="text" className="form-control" value={iapSection} onChange={e => setIapSection(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Requested By (Auto Fill)</label>
                        <input type="text" className="form-control" value={iapRequestedBy} onChange={e => setIapRequestedBy(e.target.value)} required />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>PO Ref Link *</label>
                        <input type="text" className="form-control" placeholder="e.g. SPO-2026-001" value={poaPoRef} onChange={e => setPoaPoRef(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Supplier Name (Auto Fill)</label>
                        <input type="text" className="form-control" value={poaSupplierName} onChange={e => setPoaSupplierName(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Total PO Value (Auto Fill)</label>
                        <input type="number" className="form-control" value={poaTotalValue} onChange={e => setPoaTotalValue(Number(e.target.value))} required />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeFormTab === 'Approval Setup Details' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Detailed Settings & Remarks</h4>

                {activeTab === 'IndentApproval' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Approval Status *</label>
                      <select className="form-control" value={iapStatus} onChange={e => setIapStatus(e.target.value)}>
                        <option value="Approve">Approve</option>
                        <option value="Partial Approve">Partial Approve</option>
                        <option value="Reject">Reject</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Approved By *</label>
                      <select className="form-control" value={iapApprovedBy} onChange={e => setIapApprovedBy(e.target.value)}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Forward to Purchase? *</label>
                      <select className="form-control" value={iapForward} onChange={e => setIapForward(e.target.value)}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority level</label>
                      <input type="text" className="form-control" value={iapPriority} disabled style={{ background: 'var(--bg-secondary)' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label>Approval Status *</label>
                      <select className="form-control" value={poaStatus} onChange={e => setPoaStatus(e.target.value)}>
                        <option value="Approved">Approved</option>
                        <option value="Hold">Hold</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Approved By *</label>
                      <select className="form-control" value={poaApprovedBy} onChange={e => setPoaApprovedBy(e.target.value)}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Send to Supplier? *</label>
                      <select className="form-control" value={poaSend} onChange={e => setPoaSend(e.target.value)}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Approval Remarks / Justifications *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter approval comments..."
                    value={activeTab === 'IndentApproval' ? iapRemarks : poaRemarks}
                    onChange={e => {
                      if (activeTab === 'IndentApproval') setIapRemarks(e.target.value);
                      else setPoaRemarks(e.target.value);
                    }}
                    required
                  />
                </div>
              </div>
            )}

            {activeFormTab === 'Grid Details Matrix' && (
              <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {activeTab === 'IndentApproval' ? (
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
                ) : (
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

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
