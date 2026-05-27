import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Search, Download, ShieldCheck, MapPin, Calculator, RefreshCw, Send, X } from 'lucide-react';
import { ewayBillAPI, partyAPI, salesInvoiceAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function EwayBill() {
  const [bills, setBills] = useState([]);
  const [parties, setParties] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);

  // Form States
  const [supplyType, setSupplyType] = useState('Outward');
  const [subType, setSubType] = useState('B2B');
  const [docType, setDocType] = useState('Tax Invoice');
  const [invoiceType, setInvoiceType] = useState('Regular');
  const [orgName, setOrgName] = useState('DEPL');
  const [dcNoDate, setDcNoDate] = useState('');
  const [tokenExDate, setTokenExDate] = useState('');
  const [tokenNo, setTokenNo] = useState('');
  const [result, setResult] = useState('');
  const [errorText, setErrorText] = useState('');

  // Billing From (Pre-filled with Dinesh Exports)
  const [billFromName, setBillFromName] = useState('Dinesh Exports Private Limited');
  const [billFromAddress, setBillFromAddress] = useState('1/6-A, Aiyndhupanai, Kadachanallur post, Komarapalayam TK, Tiruchengode, Namakkal-638008-');
  const [billFromGstin, setBillFromGstin] = useState('33AAICD0905A1ZG');
  const [billFromPin, setBillFromPin] = useState('638008');
  const [billFromState, setBillFromState] = useState('TamilNadu');
  const [billFromStateCode, setBillFromStateCode] = useState('33');

  // Dispatch From (Pre-filled with Dinesh Exports)
  const [dispatchFromName, setDispatchFromName] = useState('Dinesh Exports Private Limited');
  const [dispatchFromAddress, setDispatchFromAddress] = useState('1/6-A, Aiyndhupanai, Kadachanallur post, Komarapalayam TK, Tiruchengode, Namakkal-638008-');
  const [dispatchFromPin, setDispatchFromPin] = useState('638008');
  const [dispatchFromPlace, setDispatchFromPlace] = useState('Aiyndhupanai');
  const [dispatchFromState, setDispatchFromState] = useState('TamilNadu');
  const [dispatchFromStateCode, setDispatchFromStateCode] = useState('33');

  // Billing To
  const [billToPartyId, setBillToPartyId] = useState('');
  const [billToName, setBillToName] = useState('');
  const [billToAddress, setBillToAddress] = useState('');
  const [billToGstin, setBillToGstin] = useState('');
  const [billToPin, setBillToPin] = useState('');
  const [billToState, setBillToState] = useState('TamilNadu');
  const [billToStateCode, setBillToStateCode] = useState('33');

  // Dispatch To
  const [dispatchToPartyId, setDispatchToPartyId] = useState('');
  const [dispatchToName, setDispatchToName] = useState('');
  const [dispatchToAddress, setDispatchToAddress] = useState('');
  const [dispatchToPin, setDispatchToPin] = useState('');
  const [dispatchToPlace, setDispatchToPlace] = useState('');
  const [dispatchToState, setDispatchToState] = useState('TamilNadu');
  const [dispatchToStateCode, setDispatchToStateCode] = useState('33');

  // Distance & Totals
  const [distance, setDistance] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState([
    { product_name: 'Cotton Finished Fabric', hsn_code: '5208', unit: 'Mtr', qty: 1000, taxable_value: 120000, tax_rate: 5 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resBills, resParties, resInvoices] = await Promise.all([
        ewayBillAPI.list(),
        partyAPI.list ? partyAPI.list() : { data: [] },
        salesInvoiceAPI.list ? salesInvoiceAPI.list() : { data: [] }
      ]);
      setBills(resBills.data || []);
      setParties(resParties.data || []);
      setInvoices(resInvoices.data || []);
    } catch (err) {
      console.error("Error loading E-Way Bill master data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (invNo) => {
    setDcNoDate(invNo);
    const invoice = invoices.find(inv => inv.invoice_no === invNo);
    if (invoice) {
      // Find matching party in party master
      const matchingParty = parties.find(p => p.party_name === invoice.party_name);
      if (matchingParty) {
        handleBillToChange(matchingParty.id);
        handleDispatchToChange(matchingParty.id);
      } else {
        setBillToName(invoice.party_name || '');
        setDispatchToName(invoice.party_name || '');
      }
      
      // Load items from invoice
      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items.map(item => ({
          product_name: item.fabric_type || item.product_name || 'Finished Fabric',
          hsn_code: item.hsn_code || '5208',
          unit: item.unit || 'Mtr',
          qty: Number(item.qty || item.meters || 0),
          taxable_value: Number(item.amount || item.taxable_value || 0),
          tax_rate: Number(item.tax_rate || 5)
        })));
      }
    }
  };

  const handleBillToChange = (partyId) => {
    setBillToPartyId(partyId);
    const party = parties.find(p => p.id === Number(partyId));
    if (party) {
      setBillToName(party.party_name);
      setBillToAddress(party.billing_address || party.address || '');
      setBillToGstin(party.gstin || '');
      setBillToPin(party.pin_code || '638001');
      setBillToState(party.state || 'TamilNadu');
      setBillToStateCode(party.state_code || '33');
    }
  };

  const handleDispatchToChange = (partyId) => {
    setDispatchToPartyId(partyId);
    const party = parties.find(p => p.id === Number(partyId));
    if (party) {
      setDispatchToName(party.party_name);
      setDispatchToAddress(party.delivery_address || party.address || '');
      setDispatchToPin(party.pin_code || '638001');
      setDispatchToPlace(party.city || party.district || 'Erode');
      setDispatchToState(party.state || 'TamilNadu');
      setDispatchToStateCode(party.state_code || '33');
    }
  };

  const handleGetToken = () => {
    // Generate a beautiful mock E-Way Token and Token Expiry Date
    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 3); // 3 days validity
    
    const formattedExpiry = expiry.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + " 12:00 PM";
    
    setTokenExDate(formattedExpiry);
    
    // Generate base64 mock jwt string
    const mockToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify({
      iss: "GSTIN_EWAY_SYSTEM",
      org: "DEPL",
      created: today.toISOString(),
      expires: expiry.toISOString()
    })) + ".iJjPF9FX0FQSV9FS";
    
    setTokenNo(mockToken);
    setResult("Token Generated Successfully!");
    setErrorText("None");
  };

  const handleCalculateDistance = () => {
    if (!dispatchToPin) {
      alert("Please enter a destination PIN Code first.");
      return;
    }
    // Dynamic mock distance calculation between pin codes
    const diff = Math.abs(Number(billFromPin) - Number(dispatchToPin)) || 120;
    const calcDist = Math.max(10, Math.min(1500, Math.round(diff * 0.15)));
    setDistance(calcDist);
    alert(`Calculated distance between PIN ${billFromPin} and ${dispatchToPin}: ${calcDist} KM`);
  };

  const handleAddItem = () => {
    setItems([...items, { product_name: '', hsn_code: '', unit: 'Mtr', qty: 0, taxable_value: 0, tax_rate: 5 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Automated Tax Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let sgstVal = 0;
    let cgstVal = 0;
    let igstVal = 0;

    items.forEach(item => {
      const taxable = Number(item.taxable_value || 0);
      const rate = Number(item.tax_rate || 5) / 100;
      subtotal += taxable;

      // Determine Inter-state vs Intra-state based on state codes
      const fromCode = billFromStateCode.trim();
      const toCode = billToStateCode.trim();

      if (fromCode === toCode) {
        // CGST + SGST (Split the rate)
        cgstVal += (taxable * rate) / 2;
        sgstVal += (taxable * rate) / 2;
      } else {
        // IGST (Full rate)
        igstVal += taxable * rate;
      }
    });

    const grandTotal = subtotal + sgstVal + cgstVal + igstVal;
    return {
      subtotal,
      sgst: sgstVal,
      cgst: cgstVal,
      igst: igstVal,
      grandTotal
    };
  };

  const totals = calculateTotals();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!billToName) {
      alert("Please select or enter the billing party destination.");
      return;
    }

    const payload = {
      supply_type: supplyType,
      sub_type: subType,
      document_type: docType,
      invoice_type: invoiceType,
      org_name: orgName,
      dc_no_date: dcNoDate,
      token_ex_date: tokenExDate,
      token_no: tokenNo,
      result: result,
      error: errorText,

      bill_from_name: billFromName,
      bill_from_address: billFromAddress,
      bill_from_gstin: billFromGstin,
      bill_from_pin: billFromPin,
      bill_from_state: billFromState,
      bill_from_state_code: billFromStateCode,

      dispatch_from_name: dispatchFromName,
      dispatch_from_address: dispatchFromAddress,
      dispatch_from_pin: dispatchFromPin,
      dispatch_from_place: dispatchFromPlace,
      dispatch_from_state: dispatchFromState,
      dispatch_from_state_code: dispatchFromStateCode,

      bill_to_name: billToName,
      bill_to_address: billToAddress,
      bill_to_gstin: billToGstin,
      bill_to_pin: billToPin,
      bill_to_state: billToState,
      bill_to_state_code: billToStateCode,

      dispatch_to_name: dispatchToName,
      dispatch_to_address: dispatchToAddress,
      dispatch_to_pin: dispatchToPin,
      dispatch_to_place: dispatchToPlace,
      dispatch_to_state: dispatchToState,
      dispatch_to_state_code: dispatchToStateCode,

      distance: distance,
      total_value: totals.grandTotal,
      sgst: totals.sgst,
      cgst: totals.cgst,
      igst: totals.igst,
      remarks: remarks,
      status: "Active",
      items: items
    };

    try {
      if (selectedBill && !isNew) {
        await ewayBillAPI.update(selectedBill.id, payload);
      } else {
        await ewayBillAPI.create(payload);
      }
      alert("E-Way Bill Entry saved successfully!");
      setIsNew(false);
      setSelectedBill(null);
      fetchData();
    } catch (err) {
      console.error("Error saving E-Way Bill:", err);
      alert("Failed to save E-Way Bill Entry. Verify API schema.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this E-Way Bill record?")) return;
    try {
      await ewayBillAPI.delete(id);
      setSelectedBill(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting E-Way Bill:", err);
    }
  };

  const exportExcel = () => {
    const data = bills.map(b => ({
      "E-Way Bill No": b.eway_bill_no,
      "Date": b.created_at ? new Date(b.created_at).toLocaleDateString() : '-',
      "Supply Type": b.supply_type,
      "Sub Type": b.sub_type,
      "Org": b.org_name,
      "Bill From": b.bill_from_name,
      "Bill To": b.bill_to_name,
      "GSTIN To": b.bill_to_gstin,
      "Distance (KM)": b.distance,
      "Value (INR)": b.total_value,
      "Status": b.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "E-Way Bills");
    XLSX.writeFile(wb, "E_Way_Bills_Report.xlsx");
  };

  return (
    <div className="animate-fade">
      {!(selectedBill || isNew) ? (
        <>
          {/* HEADER ACTION BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={24} color="#22c55e" /> E-Way Bill Entry & Management
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Generate, authenticate, and track government GST E-way bills dynamically.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={exportExcel}>
                <Download size={16} /> Export Master Excel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setSelectedBill(null);
                  setIsNew(true);
                  // Reset some fields
                  setBillToPartyId('');
                  setBillToName('');
                  setBillToAddress('');
                  setBillToGstin('');
                  setBillToPin('');
                  setDispatchToPartyId('');
                  setDispatchToName('');
                  setDispatchToAddress('');
                  setDispatchToPin('');
                  setDispatchToPlace('');
                  setDistance(0);
                  setTokenNo('');
                  setTokenExDate('');
                  setResult('');
                  setItems([{ product_name: 'Cotton Finished Fabric', hsn_code: '5208', unit: 'Mtr', qty: 1000, taxable_value: 120000, tax_rate: 5 }]);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Plus size={16} /> Generate New E-Way Bill
              </button>
            </div>
          </div>

          {/* LIST TABLE SECTION */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>E-Way Bills Registry</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>E-Way Bill No</th>
                    <th>Date</th>
                    <th>Supply Subtype</th>
                    <th>Bill To Party</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading E-Way Bills...</td></tr>
                  ) : bills.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No E-Way bills generated yet.</td></tr>
                  ) : (
                    bills.map(b => (
                      <tr 
                        key={b.id} 
                        onClick={() => { setSelectedBill(b); setIsNew(false); }}
                        style={{ cursor: 'pointer', background: selectedBill?.id === b.id ? 'rgba(34,197,94,0.05)' : 'transparent' }}
                      >
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{b.eway_bill_no || '-'}</td>
                        <td>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}</td>
                        <td><span className="badge badge-active">{b.sub_type}</span></td>
                        <td style={{ fontWeight: 600 }}>{b.bill_to_name || '-'}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(b.total_value).toLocaleString()}</td>
                        <td>
                          <span className="badge badge-active" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                            style={{ padding: 4, color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* DETAILED FORM / CREATION PANEL - FULL WIDTH */
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {isNew ? "New E-Way Bill Generation Form" : `Details for E-Way Bill: ${selectedBill?.eway_bill_no || '-'}`}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setIsNew(false); setSelectedBill(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <X size={16} /> Close
              </button>
              {isNew && (
                <button 
                  type="submit" 
                  form="ewayForm" 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a' }}
                >
                  <Send size={16} /> Save & Generate E-Way Bill
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: 24, background: 'var(--bg-primary)' }}>
            <form id="ewayForm" onSubmit={handleSave}>
              {/* TOP BAR: SUPPLY TYPE, DOCUMENT TYPE, TOKEN EX DATE, ETC. */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>Supply Type</label>
                  <select className="form-control" value={supplyType} onChange={e => setSupplyType(e.target.value)} disabled={!isNew}>
                    <option value="Outward">Outward</option>
                    <option value="Inward">Inward</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub Type</label>
                  <select className="form-control" value={subType} onChange={e => setSubType(e.target.value)} disabled={!isNew}>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                    <option value="Job Work">Job Work</option>
                    <option value="Export">Export</option>
                    <option value="Line Sales">Line Sales</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Document Type</label>
                  <select className="form-control" value={docType} onChange={e => setDocType(e.target.value)} disabled={!isNew}>
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Bill of Supply">Bill of Supply</option>
                    <option value="Delivery Challan">Delivery Challan</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Token EX Date</label>
                  <input className="form-control" type="text" value={tokenExDate} onChange={e => setTokenExDate(e.target.value)} disabled />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>Invoice Type</label>
                  <select className="form-control" value={invoiceType} onChange={e => setInvoiceType(e.target.value)} disabled={!isNew}>
                    <option value="Regular">Regular</option>
                    <option value="Bill of Entry">Bill of Entry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Org Name</label>
                  <input className="form-control" type="text" value={orgName} onChange={e => setOrgName(e.target.value)} disabled={!isNew} />
                </div>

                <div className="form-group">
                  <label>DC No. / Date</label>
                  <select className="form-control" value={dcNoDate} onChange={e => handleSelectInvoice(e.target.value)} disabled={!isNew}>
                    <option value="">- Select Active Invoice -</option>
                    {invoices.map((inv, idx) => (
                      <option key={idx} value={inv.invoice_no}>
                        {inv.invoice_no} ({inv.party_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: 16 }}>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ width: '100%', background: '#b91c1c', color: '#ffffff', fontWeight: 600 }}
                    onClick={handleGetToken}
                    disabled={!isNew}
                  >
                    Get Token No
                  </button>
                </div>
              </div>

              {/* JWT TOKEN AREA & STATUS BOXES */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Token No</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  style={{ fontFamily: 'monospace', fontSize: 12, padding: 10, background: '#f8fafc' }} 
                  value={tokenNo} 
                  readOnly
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label>Result</label>
                  <input className="form-control" type="text" value={result} readOnly style={{ color: '#16a34a', fontWeight: 600 }} />
                </div>
                <div className="form-group">
                  <label>Error</label>
                  <input className="form-control" type="text" value={errorText} readOnly style={{ color: '#dc2626' }} />
                </div>
              </div>

              {/* BILLING AND DISPATCH DETAILS (4-QUADRANT GRID SYSTEM) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                
                {/* BILLING FROM */}
                <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Billing From</h4>
                  
                  <div className="form-group">
                    <label>Bill From</label>
                    <input className="form-control" type="text" value={billFromName} onChange={e => setBillFromName(e.target.value)} disabled />
                  </div>
                  
                  <div className="form-group">
                    <label>Address</label>
                    <textarea className="form-control" rows="2" value={billFromAddress} onChange={e => setBillFromAddress(e.target.value)} disabled />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>GSTNO</label>
                      <input className="form-control" type="text" value={billFromGstin} onChange={e => setBillFromGstin(e.target.value)} disabled />
                    </div>
                    <div className="form-group">
                      <label>PIN Code</label>
                      <input className="form-control" type="text" value={billFromPin} onChange={e => setBillFromPin(e.target.value)} disabled />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Bill State</label>
                      <input className="form-control" type="text" value={billFromState} onChange={e => setBillFromState(e.target.value)} disabled />
                    </div>
                    <div className="form-group">
                      <label>Code</label>
                      <input className="form-control" type="text" value={billFromStateCode} onChange={e => setBillFromStateCode(e.target.value)} disabled />
                    </div>
                  </div>
                </div>

                {/* DISPATCH FROM */}
                <div className="card" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Dispatch From</h4>
                  
                  <div className="form-group">
                    <label>Goods From</label>
                    <input className="form-control" type="text" value={dispatchFromName} onChange={e => setDispatchFromName(e.target.value)} disabled />
                  </div>
                  
                  <div className="form-group">
                    <label>Good From Address</label>
                    <textarea className="form-control" rows="2" value={dispatchFromAddress} onChange={e => setDispatchFromAddress(e.target.value)} disabled />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>From Place</label>
                      <input className="form-control" type="text" value={dispatchFromPlace} onChange={e => setDispatchFromPlace(e.target.value)} disabled />
                    </div>
                    <div className="form-group">
                      <label>Good from Pin</label>
                      <input className="form-control" type="text" value={dispatchFromPin} onChange={e => setDispatchFromPin(e.target.value)} disabled />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>State</label>
                      <input className="form-control" type="text" value={dispatchFromState} onChange={e => setDispatchFromState(e.target.value)} disabled />
                    </div>
                    <div className="form-group">
                      <label>Code</label>
                      <input className="form-control" type="text" value={dispatchFromStateCode} onChange={e => setDispatchFromStateCode(e.target.value)} disabled />
                    </div>
                  </div>
                </div>

                {/* BILLING TO */}
                <div className="card" style={{ border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Billing To</h4>
                  
                  <div className="form-group">
                    <label>Bill To Party</label>
                    <select 
                      className="form-control" 
                      value={billToPartyId} 
                      onChange={e => handleBillToChange(e.target.value)}
                      disabled={!isNew}
                    >
                      <option value="">- Select Billing Party -</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.id}>{p.party_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Bill Address</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      value={billToAddress} 
                      onChange={e => setBillToAddress(e.target.value)}
                      disabled={!isNew}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>GSTNO</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={billToGstin} 
                        onChange={e => setBillToGstin(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                    <div className="form-group">
                      <label>PIN Code</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={billToPin} 
                        onChange={e => setBillToPin(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>Bill State</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={billToState} 
                        onChange={e => setBillToState(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                    <div className="form-group">
                      <label>Code</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={billToStateCode} 
                        onChange={e => setBillToStateCode(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                  </div>
                </div>

                {/* DISPATCH TO */}
                <div className="card" style={{ border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Dispatch To</h4>
                  
                  <div className="form-group">
                    <label>Goods To Party</label>
                    <select 
                      className="form-control" 
                      value={dispatchToPartyId} 
                      onChange={e => handleDispatchToChange(e.target.value)}
                      disabled={!isNew}
                    >
                      <option value="">- Select Delivery Party -</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.id}>{p.party_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Good To Address</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      value={dispatchToAddress} 
                      onChange={e => setDispatchToAddress(e.target.value)}
                      disabled={!isNew}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label>To Place</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={dispatchToPlace} 
                        onChange={e => setDispatchToPlace(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                    <div className="form-group">
                      <label>Good to Pin</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={dispatchToPin} 
                        onChange={e => setDispatchToPin(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr', gap: 12 }}>
                    <div className="form-group">
                      <label>State</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={dispatchToState} 
                        onChange={e => setDispatchToState(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Distance</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input 
                          className="form-control" 
                          type="number" 
                          value={distance} 
                          onChange={e => setDistance(Number(e.target.value))}
                          disabled={!isNew}
                        />
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: 4, display: 'flex', alignItems: 'center' }}
                          onClick={handleCalculateDistance}
                          disabled={!isNew}
                        >
                          <MapPin size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Code</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        value={dispatchToStateCode} 
                        onChange={e => setDispatchToStateCode(e.target.value)}
                        disabled={!isNew}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* NESTED ITEM DETAILS GRID */}
              <div className="card" style={{ padding: 20, marginBottom: 24, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700 }}>Item Detail Grid</h4>
                  {isNew && (
                    <button type="button" className="btn btn-secondary" onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Add Product Row
                    </button>
                  )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ margin: 0, minWidth: 800 }}>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th style={{ width: 120 }}>HSN Code</th>
                        <th style={{ width: 100 }}>Unit</th>
                        <th style={{ width: 100 }}>Qty</th>
                        <th style={{ width: 130 }}>Taxable Val</th>
                        <th style={{ width: 100 }}>Tax Rate %</th>
                        {isNew && <th style={{ width: 60 }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <input 
                              className="form-control" 
                              style={{ margin: 0 }}
                              value={item.product_name} 
                              onChange={e => handleItemChange(idx, 'product_name', e.target.value)}
                              disabled={!isNew}
                            />
                          </td>
                          <td>
                            <input 
                              className="form-control" 
                              style={{ margin: 0 }}
                              value={item.hsn_code} 
                              onChange={e => handleItemChange(idx, 'hsn_code', e.target.value)}
                              disabled={!isNew}
                            />
                          </td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ margin: 0 }}
                              value={item.unit} 
                              onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                              disabled={!isNew}
                            >
                              <option value="Mtr">Mtr</option>
                              <option value="Kg">Kg</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Rolls">Rolls</option>
                            </select>
                          </td>
                          <td>
                            <input 
                              className="form-control" 
                              type="number"
                              style={{ margin: 0 }}
                              value={item.qty} 
                              onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))}
                              disabled={!isNew}
                            />
                          </td>
                          <td>
                            <input 
                              className="form-control" 
                              type="number"
                              style={{ margin: 0 }}
                              value={item.taxable_value} 
                              onChange={e => handleItemChange(idx, 'taxable_value', Number(e.target.value))}
                              disabled={!isNew}
                            />
                          </td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ margin: 0 }}
                              value={item.tax_rate} 
                              onChange={e => handleItemChange(idx, 'tax_rate', Number(e.target.value))}
                              disabled={!isNew}
                            >
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>
                          {isNew && (
                            <td>
                              <button type="button" className="btn btn-secondary" onClick={() => handleRemoveItem(idx)} style={{ padding: 4, color: '#ef4444' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOTTOM SUMMARY & TOTALS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24, alignItems: 'flex-start' }}>
                <div className="form-group">
                  <label>Remarks / Notes</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value)}
                    disabled={!isNew}
                  />
                </div>

                <div className="card" style={{ background: '#f8fafc', padding: 20 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Tax Summary Table</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Taxable Value:</span>
                    <span style={{ fontWeight: 600 }}>₹{totals.subtotal.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>CGST Amount:</span>
                    <span style={{ fontWeight: 600 }}>₹{totals.cgst.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>SGST Amount:</span>
                    <span style={{ fontWeight: 600 }}>₹{totals.sgst.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>IGST Amount:</span>
                    <span style={{ fontWeight: 600 }}>₹{totals.igst.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#16a34a' }}>
                    <span>Grand Total Value:</span>
                    <span>₹{totals.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              {isNew && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsNew(false); setSelectedBill(null); }}>
                    Cancel Creation
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a' }}>
                    <Send size={16} /> Save & Generate E-Way Bill
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
