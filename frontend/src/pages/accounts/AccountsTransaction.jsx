import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRightLeft, Search, Plus, Trash2, Edit, Check, X, Download, 
  Settings, FolderKanban, ShoppingBag, Factory, AlertTriangle, 
  PlusCircle, FileText, CheckSquare, Receipt, Globe, Printer, BookOpen, MapPin, 
  HelpCircle, Sparkles, Database 
} from 'lucide-react';
import { partyAPI } from '../../services/api';

export default function AccountsTransaction({ defaultSection = 'Creditors', defaultPage = null }) {
  // Main Category Tab: 'Creditors' | 'Sales' | 'LC'
  const [activeSection, setActiveSection] = useState(defaultSection);

  // Currently open page: null means dashboard/list, else the specific page key
  const [activePage, setActivePage] = useState(defaultPage);

  const [partiesList, setPartiesList] = useState([]);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await partyAPI.list();
        if (res.data && res.data.length > 0) {
          setPartiesList(res.data.map(p => p.company_name));
        }
      } catch (err) {
        console.error("Failed to fetch parties in AccountsTransaction", err);
      }
    };
    fetchParties();
  }, []);

  useEffect(() => {
    setActiveSection(defaultSection);
    setActivePage(defaultPage);
  }, [defaultSection, defaultPage]);

  // Search Filter state for dashboard
  const [searchTerm, setSearchTerm] = useState('');

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('General Info');

  // Static references
  const PARTIES = useMemo(() => {
    return partiesList.length > 0 ? partiesList : ['Vardhman Spinning', 'Raymond Ltd', 'Reliance Retail', 'Chemical Traders', 'Standard Gears Ltd', 'Zenith Electricals'];
  }, [partiesList]);
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Murugan Swamy (Maintenance In-charge)'];

  // =========================================================================
  // STATE STORE FOR ALL 15 TRANSACTIONS
  // =========================================================================
  
  // 1. CREDITORS BILLS RECEIVED
  const [billsReceived, setBillsReceived] = useState([]);

  // 2. GENERAL / OTHER BILLS
  const [generalBills, setGeneralBills] = useState([]);

  // 3. CREDITORS BILLS APPROVAL
  const [billsApproved, setBillsApproved] = useState([]);

  // 4. CREDITORS DEBIT NOTE
  const [creditorsDebitNotes, setCreditorsDebitNotes] = useState([]);

  // 5. EXPORT INVOICE
  const [exportInvoices, setExportInvoices] = useState([]);

  // 6. SALES AMENDMENT
  const [salesAmendments, setSalesAmendments] = useState([]);

  // 7. GREY SALES AMENDMENT
  const [greyAmendments, setGreyAmendments] = useState([]);

  // 8. DIRECT SALES INVOICE
  const [directInvoices, setDirectInvoices] = useState([]);

  // 9. DIRECT SALES EINVOICE
  const [eInvoices, setEInvoices] = useState([]);

  // 10. TALLY SALES EXPORT
  const [tallyExports, setTallyExports] = useState([]);

  // 11. CANCEL SALES INVOICE
  const [cancelledInvoices, setCancelledInvoices] = useState([]);

  // 12. BULK INVOICE PRINT
  const [bulkPrints, setBulkPrints] = useState([]);

  // 13. LC DETAIL
  const [lcDetails, setLcDetails] = useState([]);

  // 14. LC HUNDI ENTRY
  const [lcHundis, setLcHundis] = useState([]);

  // 15. LC COMPLETION
  const [lcCompletions, setLcCompletions] = useState([]);

  // =========================================================================
  // DYNAMIC FORM FIELDS (GENERAL STATE BINDINGS)
  // =========================================================================
  const [fields, setFields] = useState({
    // Form fields mapped dynamically on activePage selection
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields({
      ...fields,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // =========================================================================
  // DEFINITIONS OF 15 PAGES ARCHITECTURE
  // =========================================================================
  const PAGES_METADATA = {
    // Creditor Management
    cbr: { key: 'cbr', label: "Creditors Bills Received Entry", section: 'Creditors', desc: "Record bills received from creditors/suppliers before approval", icon: FileText },
    gen: { key: 'gen', label: "General / Other Bills Entry", section: 'Creditors', desc: "Record miscellaneous/non-purchase bills like utilities, rent, etc.", icon: Receipt },
    cba: { key: 'cba', label: "Creditors Bills Approval Entry", section: 'Creditors', desc: "Verify and approve creditor bills before payment processing", icon: CheckSquare },
    cdn: { key: 'cdn', label: "Creditors Debit Note Entry", section: 'Creditors', desc: "Issue debit notes to creditors for returns, rate diff, quality issues", icon: ArrowRightLeft },
    
    // Sales & Invoice
    exp: { key: 'exp', label: "Export Invoice", section: 'Sales', desc: "Generate invoices for international/export sales", icon: Globe },
    sam: { key: 'sam', label: "Sales Amendment", section: 'Sales', desc: "Modify/amend existing domestic sales invoices", icon: Edit },
    gsm: { key: 'gsm', label: "Gry Sales Amendment", section: 'Sales', desc: "Amend grey fabric specific sales invoices", icon: FileText },
    dsi: { key: 'dsi', label: "Direct Sales Invoice", section: 'Sales', desc: "Create sales invoices directly without order reference", icon: Receipt },
    ein: { key: 'ein', label: "Direct Sales Einvoice", section: 'Sales', desc: "Generate GST-compliant e-invoice for direct sales", icon: Sparkles },
    tly: { key: 'tly', label: "Tally Sales Export", section: 'Sales', desc: "Export sales data to Tally accounting software", icon: Database },
    cnl: { key: 'cnl', label: "Cancel Sales Invoice", section: 'Sales', desc: "Cancel issued sales invoices with proper reason", icon: Trash2 },
    prt: { key: 'prt', label: "Bulk Invoice Print", section: 'Sales', desc: "Print multiple invoices at once", icon: Printer },

    // LC Management
    lcd: { key: 'lcd', label: "LC Detail", section: 'LC', desc: "Record Letter of Credit details from buyers", icon: BookOpen },
    hnd: { key: 'hnd', label: "LC Hundi Entry", section: 'LC', desc: "Record Hundi/Bill of Exchange against LC", icon: ShoppingBag },
    lcc: { key: 'lcc', label: "LC Completion", section: 'LC', desc: "Mark LC as complete after all shipments and payments received", icon: CheckSquare }
  };

  // =========================================================================
  // ACTIONS HANDLERS
  // =========================================================================
  const handleOpenPage = (pageKey) => {
    setActivePage(pageKey);
    setIsFormOpen(false);
  };

  const handleCreateNew = () => {
    let nextId = '';
    const dateToday = new Date().toISOString().substring(0, 10);
    
    // Populate form states based on activePage
    if (activePage === 'cbr') {
      nextId = `CBR-${String(billsReceived.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, creditorName: 'Vardhman Spinning', creditorType: 'Yarn Supplier', supplierBillNo: '', supplierBillDate: dateToday, billType: 'Yarn Purchase Bill', againstPoNo: '', againstGrnNo: '', totalAmount: '', dueDate: '', narration: '', status: 'Received', items: [{ desc: '', hsn: '', qty: '', unit: 'Kg', rate: '', amount: 0 }] });
    }
    if (activePage === 'gen') {
      nextId = `GEN-${String(generalBills.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, category: 'Electricity Bill', partyName: 'State Electricity Board', billNo: '', billDate: dateToday, expenseHead: 'Power & Fuel', department: 'Production', billAmount: '', gstApplicable: true, gstPercent: 18, gstAmount: 0, tdsApplicable: false, tdsPercent: 0, tdsAmount: 0, netPayable: 0, dueDate: '', costCenter: 'Weaving Floor A', narration: '', status: 'Approved' });
    }
    if (activePage === 'cba') {
      nextId = `CBA-${String(billsApproved.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, billReceiptRef: 'CBR-00001', creditorName: 'Vardhman Spinning', supplierBillNo: 'SUP-4491', billAmount: 185000, gstAmount: 9250, tdsAmount: 1850, netPayable: 192400, poVerified: true, grnVerified: true, rateMatched: true, qtyMatched: true, approvedAmount: 192400, diffAmount: 0, diffReason: '', approvalStatus: 'Approved', approvedBy: 'Mani Bharathi (Store Head)', remarks: '' });
    }
    if (activePage === 'cdn') {
      nextId = `CDN-${String(creditorsDebitNotes.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, creditorName: 'Vardhman Spinning', againstBillNo: 'CBR-00001', againstPoNo: 'PO-00090', debitNoteType: 'Material Return', totalDebitAmount: '', reason: '', adjustmentType: 'Bill Adjustment', narration: '', authorizedBy: 'Dinesh Balasamy (MD)', status: 'Approved', items: [{ name: '', returnQty: '', unit: 'Kg', rate: '', amount: 0 }] });
    }
    if (activePage === 'exp') {
      nextId = `EXP-${String(exportInvoices.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, buyerName: 'Reliance Retail', buyerAddress: 'Mumbai HQ', country: 'United Kingdom', portLoading: '', portDischarge: '', shippingBillNo: '', shippingBillDate: dateToday, lcNo: '', currency: 'USD', exchangeRate: 83, foreignTotal: '', inrTotal: 0, freight: '', insurance: '', paymentTerms: '60 Days LC', incoterms: 'FOB', bankDetails: '', status: 'Shipped', items: [{ designNo: '', desc: '', qty: '', rateForeign: '', rateInr: 0, amountForeign: 0, amountInr: 0 }] });
    }
    if (activePage === 'sam') {
      nextId = `SAM-${String(salesAmendments.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, originalInvoiceNo: '', originalInvoiceDate: dateToday, buyerName: 'Raymond Ltd', amendmentType: 'Rate Change', reason: '', authorizedBy: 'Dinesh Balasamy (MD)', status: 'Approved', items: [{ name: '', qty: '', originalRate: '', amendedRate: '', diffAmount: 0, gstImpact: 0 }] });
    }
    if (activePage === 'gsm') {
      nextId = `GSM-${String(greyAmendments.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, originalInvoiceNo: '', buyerName: 'Raymond Ltd', fabricType: 'Grey Cotton Drill', originalQty: '', amendedQty: '', originalRate: '', amendedRate: '', originalAmount: '', amendedAmount: 0, weightDiff: '', qualityRemarks: '', reason: '', authorizedBy: 'Mani Bharathi (Store Head)', status: 'Approved' });
    }
    if (activePage === 'dsi') {
      nextId = `DSI-${String(directInvoices.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, buyerName: 'Raymond Ltd', buyerAddress: 'Bangalore Complex', gstin: '29AAAER4402Q1ZX', placeOfSupply: 'Karnataka', invoiceType: 'Tax Invoice', totalTaxable: 0, totalGst: 0, grandTotal: 0, paymentTerms: 'Direct Pay', bankDetails: '', status: 'Completed', items: [{ itemNo: '', hsn: '', qty: '', rate: '', amount: 0, gstPercent: 18, gstAmount: 0, total: 0 }] });
    }
    if (activePage === 'ein') {
      nextId = `EIN-${String(eInvoices.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, irnNo: 'Automatic IRN...', ackNo: '', ackDate: dateToday, invoiceRef: 'DSI-00001', buyerGstin: '29AAAER4402Q1ZX', supplyType: 'B2B', status: 'Active' });
    }
    if (activePage === 'tly') {
      nextId = `TLY-${String(tallyExports.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, dateRangeFrom: dateToday, dateRangeTo: dateToday, exportType: 'Sales Vouchers', format: 'XML Format', includeGst: true, includeTds: true, filePath: 'C:/TallyData/Sales_Export.xml', lastExportDate: dateToday, status: 'Exported' });
    }
    if (activePage === 'cnl') {
      nextId = `CNL-${String(cancelledInvoices.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, invoiceNo: '', invoiceDate: dateToday, buyerName: 'Reliance Retail', invoiceAmount: '', gstAmount: '', irnNo: '', reason: 'Data Entry Error', detailedReason: '', authorizedBy: 'Dinesh Balasamy (MD)', cancellationDate: dateToday, status: 'Cancelled' });
    }
    if (activePage === 'prt') {
      nextId = `PRT-${String(bulkPrints.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, dateRangeFrom: dateToday, dateRangeTo: dateToday, printFormat: 'Standard GST Format', copies: 1, status: 'Success' });
    }
    if (activePage === 'lcd') {
      nextId = `LCD-${String(lcDetails.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, lcNoBank: '', lcDate: dateToday, buyerName: 'Reliance Retail', buyerCountry: 'United Kingdom', issuingBank: '', advisingBank: '', lcType: 'Sight LC', lcCurrency: 'USD', lcAmountForeign: '', exchangeRate: 83, lcAmountInr: 0, expiryDate: '', shipmentDate: '', loadingPort: '', dischargePort: '', tolerancePercent: 5, status: 'Active' });
    }
    if (activePage === 'hnd') {
      nextId = `HND-${String(lcHundis.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, lcRefNo: 'LCD-00001', buyerName: 'Reliance Retail', exportInvoiceNo: 'EXP-00001', hundiType: 'Sight Hundi', hundiAmountForeign: '', exchangeRate: 83, hundiAmountInr: 0, usanceDays: 0, dueDate: dateToday, presentingBank: '', negotiatingBank: '', documentLadingNo: '', documentLadingDate: dateToday, discountCharges: '', bankCharges: '', netRealization: 0, status: 'Realized' });
    }
    if (activePage === 'lcc') {
      nextId = `LCC-${String(lcCompletions.length + 1).padStart(5, '0')}`;
      setFields({ id: nextId, date: dateToday, lcRefNo: 'LCD-00001', buyerName: 'Reliance Retail', lcAmount: 12450000, totalShippedValue: 12450000, totalReceivedAmount: 12450000, balanceAmount: 0, forexGainLoss: 0, bankChargesTotal: 0, remarks: '', closedBy: 'Dinesh Balasamy (MD)', status: 'Completed' });
    }

    setCurrentFormId(nextId);
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setCurrentFormId(row.id || row.entryNo || row.approvalNo || row.exportInvoiceNo || row.amendmentNo || row.lcNo || row.hundiNo || row.completionNo);
    setFields({ ...row });
    setActiveFormTab('General Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    if (activePage === 'cbr') {
      const isExisting = billsReceived.some(b => b.id === currentFormId);
      if (isExisting) setBillsReceived(billsReceived.map(b => b.id === currentFormId ? fields : b));
      else setBillsReceived([fields, ...billsReceived]);
    }
    if (activePage === 'gen') {
      const isExisting = generalBills.some(b => b.id === currentFormId);
      if (isExisting) setGeneralBills(generalBills.map(b => b.id === currentFormId ? fields : b));
      else setGeneralBills([fields, ...generalBills]);
    }
    if (activePage === 'cba') {
      const isExisting = billsApproved.some(b => b.id === currentFormId);
      if (isExisting) setBillsApproved(billsApproved.map(b => b.id === currentFormId ? fields : b));
      else setBillsApproved([fields, ...billsApproved]);
    }
    if (activePage === 'cdn') {
      const isExisting = creditorsDebitNotes.some(b => b.id === currentFormId);
      if (isExisting) setCreditorsDebitNotes(creditorsDebitNotes.map(b => b.id === currentFormId ? fields : b));
      else setCreditorsDebitNotes([fields, ...creditorsDebitNotes]);
    }
    if (activePage === 'exp') {
      const isExisting = exportInvoices.some(b => b.id === currentFormId);
      if (isExisting) setExportInvoices(exportInvoices.map(b => b.id === currentFormId ? fields : b));
      else setExportInvoices([fields, ...exportInvoices]);
    }
    if (activePage === 'sam') {
      const isExisting = salesAmendments.some(b => b.id === currentFormId);
      if (isExisting) setSalesAmendments(salesAmendments.map(b => b.id === currentFormId ? fields : b));
      else setSalesAmendments([fields, ...salesAmendments]);
    }
    if (activePage === 'gsm') {
      const isExisting = greyAmendments.some(b => b.id === currentFormId);
      if (isExisting) setGreyAmendments(greyAmendments.map(b => b.id === currentFormId ? fields : b));
      else setGreyAmendments([fields, ...greyAmendments]);
    }
    if (activePage === 'dsi') {
      const isExisting = directInvoices.some(b => b.id === currentFormId);
      if (isExisting) setDirectInvoices(directInvoices.map(b => b.id === currentFormId ? fields : b));
      else setDirectInvoices([fields, ...directInvoices]);
    }
    if (activePage === 'ein') {
      const isExisting = eInvoices.some(b => b.id === currentFormId);
      if (isExisting) setEInvoices(eInvoices.map(b => b.id === currentFormId ? fields : b));
      else setEInvoices([fields, ...eInvoices]);
    }
    if (activePage === 'tly') {
      const isExisting = tallyExports.some(b => b.id === currentFormId);
      if (isExisting) setTallyExports(tallyExports.map(b => b.id === currentFormId ? fields : b));
      else setTallyExports([fields, ...tallyExports]);
    }
    if (activePage === 'cnl') {
      const isExisting = cancelledInvoices.some(b => b.id === currentFormId);
      if (isExisting) setCancelledInvoices(cancelledInvoices.map(b => b.id === currentFormId ? fields : b));
      else setCancelledInvoices([fields, ...cancelledInvoices]);
    }
    if (activePage === 'prt') {
      const isExisting = bulkPrints.some(b => b.id === currentFormId);
      if (isExisting) setBulkPrints(bulkPrints.map(b => b.id === currentFormId ? fields : b));
      else setBulkPrints([fields, ...bulkPrints]);
    }
    if (activePage === 'lcd') {
      const isExisting = lcDetails.some(b => b.id === currentFormId);
      if (isExisting) setLcDetails(lcDetails.map(b => b.id === currentFormId ? fields : b));
      else setLcDetails([fields, ...lcDetails]);
    }
    if (activePage === 'hnd') {
      const isExisting = lcHundis.some(b => b.id === currentFormId);
      if (isExisting) setLcHundis(lcHundis.map(b => b.id === currentFormId ? fields : b));
      else setLcHundis([fields, ...lcHundis]);
    }
    if (activePage === 'lcc') {
      const isExisting = lcCompletions.some(b => b.id === currentFormId);
      if (isExisting) setLcCompletions(lcCompletions.map(b => b.id === currentFormId ? fields : b));
      else setLcCompletions([fields, ...lcCompletions]);
    }

    setIsFormOpen(false);
    alert("Transaction ledger updated successfully!");
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this operational ledger record?")) {
      if (activePage === 'cbr') setBillsReceived(billsReceived.filter(b => b.id !== id));
      if (activePage === 'gen') setGeneralBills(generalBills.filter(b => b.id !== id));
      if (activePage === 'cba') setBillsApproved(billsApproved.filter(b => b.id !== id));
      if (activePage === 'cdn') setCreditorsDebitNotes(creditorsDebitNotes.filter(b => b.id !== id));
      if (activePage === 'exp') setExportInvoices(exportInvoices.filter(b => b.id !== id));
      if (activePage === 'sam') setSalesAmendments(salesAmendments.filter(b => b.id !== id));
      if (activePage === 'gsm') setGreyAmendments(greyAmendments.filter(b => b.id !== id));
      if (activePage === 'dsi') setDirectInvoices(directInvoices.filter(b => b.id !== id));
      if (activePage === 'ein') setEInvoices(eInvoices.filter(b => b.id !== id));
      if (activePage === 'tly') setTallyExports(tallyExports.filter(b => b.id !== id));
      if (activePage === 'cnl') setCancelledInvoices(cancelledInvoices.filter(b => b.id !== id));
      if (activePage === 'prt') setBulkPrints(bulkPrints.filter(b => b.id !== id));
      if (activePage === 'lcd') setLcDetails(lcDetails.filter(b => b.id !== id));
      if (activePage === 'hnd') setLcHundis(lcHundis.filter(b => b.id !== id));
      if (activePage === 'lcc') setLcCompletions(lcCompletions.filter(b => b.id !== id));
    }
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <ArrowRightLeft size={24} style={{ color: '#7c3aed' }} /> Accounts Transaction Desk
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            {activePage ? `Sub-Module: ${PAGES_METADATA[activePage].label}` : "Centralized commercial billing, exports control, letter of credit ledgers, and buyer billing adjustments."}
          </p>
        </div>
        <div>
          {activePage ? (
            <button className="btn btn-secondary" onClick={() => setActivePage(null)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <X size={15} /> Back to Desk
            </button>
          ) : (
            <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed', borderRadius: '4px', fontWeight: 800 }}>
              Live Financial Auditing
            </span>
          )}
        </div>
      </div>

      {/* TOP DESK LEVEL 1 SECTION SELECTION TABS */}
      {!activePage && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
            {[
              { key: 'Creditors', label: 'Creditor Management', desc: 'Verify incoming creditor invoices, utility logs, and vendor debit note parameters.', icon: FolderKanban },
              { key: 'Sales', label: 'Sales & Invoice Management', desc: 'Process international trade billing, local direct sales invoices, and Tally exports.', icon: Globe },
              { key: 'LC', label: 'LC Management Center', desc: 'Oversee Letter of Credits bank records, buyer Hundis, and export shipment clearances.', icon: BookOpen }
            ].map(sec => {
              const isSelected = activeSection === sec.key;
              const IconComponent = sec.icon;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
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
                    boxShadow: isSelected ? '0 10px 25px -5px rgba(124, 58, 237, 0.12)' : 'none',
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
                    <h4 style={{ fontWeight: '850', fontSize: '15px', color: isSelected ? '#7c3aed' : 'var(--text-primary)', margin: 0 }}>
                      {sec.label}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: '500', lineHeight: '1.4' }}>
                      {sec.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE SECTION'S OPERATIONAL PAGES CARDS GRID */}
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
            📂 Select {activeSection} Operational Page
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
            {Object.values(PAGES_METADATA)
              .filter(p => p.section === activeSection)
              .map(p => {
                const IconComp = p.icon;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleOpenPage(p.key)}
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
                      e.currentTarget.style.borderColor = '#7c3aed';
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
                      background: 'rgba(124, 58, 237, 0.05)',
                      color: '#7c3aed'
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

      {/* ACTIVE PAGE WORKSPACE */}
      {activePage && (
        <>
          {!isFormOpen ? (
            /* ========================================================================= */
            /* ========================= LIST VIEW PER SUB-PAGE ======================== */
            /* ========================================================================= */
            <>
              <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                    {PAGES_METADATA[activePage].label} Register Logs
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interactive logs & operational vouchers audit sheets</span>
                </div>
                <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                  <Plus size={16} /> New Transaction Entry
                </button>
              </div>

              {/* DATA TABLE FOR CBR */}
              {activePage === 'cbr' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>BILL RECEIPT NO</th>
                        <th>DATE</th>
                        <th>CREDITOR NAME</th>
                        <th>SUPPLIER BILL NO</th>
                        <th>BILL TYPE</th>
                        <th>PO REF</th>
                        <th style={{ textAlign: 'right' }}>TOTAL AMOUNT</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billsReceived.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.creditorName}</td>
                          <td>{row.supplierBillNo}</td>
                          <td>{row.billType}</td>
                          <td>{row.againstPoNo}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹ {row.totalAmount.toLocaleString()}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
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

              {/* DATA TABLE FOR GEN */}
              {activePage === 'gen' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>ENTRY NO</th>
                        <th>DATE</th>
                        <th>CATEGORY</th>
                        <th>PARTY / VENDOR</th>
                        <th>BILL NO</th>
                        <th>DEPARTMENT</th>
                        <th style={{ textAlign: 'right' }}>NET PAYABLE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generalBills.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.category}</td>
                          <td>{row.partyName}</td>
                          <td>{row.billNo}</td>
                          <td>{row.department}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹ {row.netPayable.toLocaleString()}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
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

              {/* DATA TABLE FOR CBA */}
              {activePage === 'cba' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>APPROVAL NO</th>
                        <th>DATE</th>
                        <th>BILL RECEIPT REF</th>
                        <th>CREDITOR NAME</th>
                        <th style={{ textAlign: 'right' }}>BILL AMOUNT</th>
                        <th style={{ textAlign: 'right' }}>NET PAYABLE</th>
                        <th>STATUS</th>
                        <th>APPROVED BY</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billsApproved.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td>{row.billReceiptRef}</td>
                          <td style={{ fontWeight: 650 }}>{row.creditorName}</td>
                          <td style={{ textAlign: 'right' }}>₹ {row.billAmount.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹ {row.netPayable.toLocaleString()}</td>
                          <td><span className="badge badge-active">{row.approvalStatus}</span></td>
                          <td>{row.approvedBy}</td>
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

              {/* DATA TABLE FOR CDN */}
              {activePage === 'cdn' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>DEBIT NOTE NO</th>
                        <th>DATE</th>
                        <th>CREDITOR NAME</th>
                        <th>AGAINST BILL</th>
                        <th>DEBIT NOTE TYPE</th>
                        <th style={{ textAlign: 'right' }}>TOTAL DEBIT</th>
                        <th>AUTHORIZED BY</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditorsDebitNotes.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.creditorName}</td>
                          <td>{row.againstBillNo}</td>
                          <td>{row.debitNoteType}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹ {row.totalDebitAmount.toLocaleString()}</td>
                          <td>{row.authorizedBy}</td>
                          <td><span className="badge badge-active">{row.status}</span></td>
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

              {/* DATA TABLE FOR EXP */}
              {activePage === 'exp' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                  <table className="data-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>EXPORT INVOICE NO</th>
                        <th>DATE</th>
                        <th>BUYER NAME</th>
                        <th>COUNTRY</th>
                        <th>SHIPPING BILL NO</th>
                        <th>CURRENCY</th>
                        <th style={{ textAlign: 'right' }}>FOREIGN TOTAL</th>
                        <th style={{ textAlign: 'right' }}>INR TOTAL</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportInvoices.map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.id}</td>
                          <td>{row.date}</td>
                          <td style={{ fontWeight: 650 }}>{row.buyerName}</td>
                          <td>{row.country}</td>
                          <td>{row.shippingBillNo}</td>
                          <td>{row.currency}</td>
                          <td style={{ textAlign: 'right' }}>$ {row.foreignTotal.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹ {row.inrTotal.toLocaleString()}</td>
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

              {/* FALLBACK/GENERAL LOG SHEET FOR OTHER PAGES */}
              {['sam', 'gsm', 'dsi', 'ein', 'tly', 'cnl', 'prt', 'lcd', 'hnd', 'lcc'].includes(activePage) && (
                <div className="card" style={{ padding: '32px', textAlign: 'center', background: 'white' }}>
                  <Sparkles size={32} style={{ color: '#7c3aed', marginBottom: '12px' }} />
                  <h4 style={{ fontWeight: 800, margin: 0 }}>Voucher Records Logs Compiled</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Click "New Transaction Entry" to audit, record, and log a fresh commercial voucher ledger for this sub-page.
                  </p>
                  <button className="btn btn-primary" onClick={handleCreateNew} style={{ background: '#7c3aed', borderColor: '#7c3aed', marginTop: '16px' }}>
                    Add Record Voucher
                  </button>
                </div>
              )}

            </>
          ) : (
            /* ========================================================================= */
            /* ========================= FORM WORKSPACE PER SUB-PAGE =================== */
            /* ========================================================================= */
            <div className="card animate-fade" style={{ padding: '32px', minHeight: '520px', background: 'white' }}>
              
              {/* Form Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                    {PAGES_METADATA[activePage].label} Voucher Setup — {currentFormId}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure dual-entry transaction verification system</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <X size={15} /> Close
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                    <Check size={15} /> Save Ledger Voucher
                  </button>
                </div>
              </div>

              {/* Form Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px' }}>
                {['General Info', 'Detailed Configurations'].map(tab => {
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

              {/* RENDER ACTIVE PAGE FORM CODES */}
              <div style={{ minHeight: '300px' }}>
                
                {/* 1. CREDITORS BILLS RECEIVED ENTRY */}
                {activePage === 'cbr' && activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Bill Receipt No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Creditor Name *</label>
                        <select className="form-control" name="creditorName" value={fields.creditorName || ''} onChange={handleInputChange}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Creditor Type *</label>
                        <input type="text" className="form-control" name="creditorType" value={fields.creditorType || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Bill Type *</label>
                        <select className="form-control" name="billType" value={fields.billType || ''} onChange={handleInputChange}>
                          <option value="Yarn Purchase Bill">Yarn Purchase Bill</option>
                          <option value="Fabric Purchase Bill">Fabric Purchase Bill</option>
                          <option value="Job Work Bill">Job Work Bill</option>
                          <option value="Service Bill">Service Bill</option>
                          <option value="Spares Bill">Spares Bill</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Supplier Bill No *</label>
                        <input type="text" className="form-control" name="supplierBillNo" value={fields.supplierBillNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Supplier Bill Date *</label>
                        <input type="date" className="form-control" name="supplierBillDate" value={fields.supplierBillDate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Bill Amount *</label>
                        <input type="number" className="form-control" name="totalAmount" value={fields.totalAmount || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Payment Due Date *</label>
                        <input type="date" className="form-control" name="dueDate" value={fields.dueDate || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. GENERAL / OTHER BILLS ENTRY */}
                {activePage === 'gen' && activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Entry No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Bill Category *</label>
                        <select className="form-control" name="category" value={fields.category || ''} onChange={handleInputChange}>
                          <option value="Electricity Bill">Electricity Bill</option>
                          <option value="Water Bill">Water Bill</option>
                          <option value="Rent">Rent</option>
                          <option value="Transport / Freight">Transport / Freight</option>
                          <option value="Labour Charges">Labour Charges</option>
                          <option value="Professional Charges">Professional Charges</option>
                          <option value="Telephone / Internet">Telephone / Internet</option>
                          <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Party / Vendor *</label>
                        <select className="form-control" name="partyName" value={fields.partyName || ''} onChange={handleInputChange}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Bill No *</label>
                        <input type="text" className="form-control" name="billNo" value={fields.billNo || ''} onChange={handleInputChange} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Expense Head *</label>
                        <input type="text" className="form-control" name="expenseHead" value={fields.expenseHead || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Department *</label>
                        <input type="text" className="form-control" name="department" value={fields.department || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Net Payable Amount *</label>
                        <input type="number" className="form-control" name="netPayable" value={fields.netPayable || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Payment Due Date *</label>
                        <input type="date" className="form-control" name="dueDate" value={fields.dueDate || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CREDITORS BILLS APPROVAL ENTRY */}
                {activePage === 'cba' && activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Bill Receipt Ref No Link *</label>
                        <input type="text" className="form-control" name="billReceiptRef" value={fields.billReceiptRef || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Creditor Name (Auto)</label>
                        <input type="text" className="form-control" name="creditorName" value={fields.creditorName || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Supplier Bill No (Auto)</label>
                        <input type="text" className="form-control" name="supplierBillNo" value={fields.supplierBillNo || ''} onChange={handleInputChange} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Approved Amount *</label>
                        <input type="number" className="form-control" name="approvedAmount" value={fields.approvedAmount || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Approval Status *</label>
                        <select className="form-control" name="approvalStatus" value={fields.approvalStatus || ''} onChange={handleInputChange}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Partially Approved">Partially Approved</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Approved By *</label>
                        <select className="form-control" name="approvedBy" value={fields.approvedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>PO Verified?</label>
                        <select className="form-control" name="poVerified" value={fields.poVerified ? "Yes" : "No"} onChange={(e) => setFields({ ...fields, poVerified: e.target.value === 'Yes' })}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CREDITORS DEBIT NOTE ENTRY */}
                {activePage === 'cdn' && activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Debit Note No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Creditor Name *</label>
                        <select className="form-control" name="creditorName" value={fields.creditorName || ''} onChange={handleInputChange}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Against Bill Link *</label>
                        <input type="text" className="form-control" name="againstBillNo" value={fields.againstBillNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Debit Note Type *</label>
                        <select className="form-control" name="debitNoteType" value={fields.debitNoteType || ''} onChange={handleInputChange}>
                          <option value="Material Return">Material Return</option>
                          <option value="Rate Difference">Rate Difference</option>
                          <option value="Quality Rejection">Quality Rejection</option>
                          <option value="Short Supply">Short Supply</option>
                          <option value="Damage Claim">Damage Claim</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Total Debit Amount *</label>
                        <input type="number" className="form-control" name="totalDebitAmount" value={fields.totalDebitAmount || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Adjustment Type *</label>
                        <input type="text" className="form-control" name="adjustmentType" value={fields.adjustmentType || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Authorized By *</label>
                        <select className="form-control" name="authorizedBy" value={fields.authorizedBy || ''} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. EXPORT INVOICE */}
                {activePage === 'exp' && activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Export Invoice No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <select className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Country *</label>
                        <input type="text" className="form-control" name="country" value={fields.country || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>LC No / Contract Link</label>
                        <input type="text" className="form-control" name="lcNo" value={fields.lcNo || ''} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Port of Loading *</label>
                        <input type="text" className="form-control" name="portLoading" value={fields.portLoading || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Port of Discharge *</label>
                        <input type="text" className="form-control" name="portDischarge" value={fields.portDischarge || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Shipping Bill No *</label>
                        <input type="text" className="form-control" name="shippingBillNo" value={fields.shippingBillNo || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Currency *</label>
                        <select className="form-control" name="currency" value={fields.currency || ''} onChange={handleInputChange}>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Exchange Rate *</label>
                        <input type="number" className="form-control" name="exchangeRate" value={fields.exchangeRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total Foreign Amount *</label>
                        <input type="number" className="form-control" name="foreignTotal" value={fields.foreignTotal || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Total INR Value (Auto)</label>
                        <input type="number" className="form-control" value={(Number(fields.foreignTotal) || 0) * (Number(fields.exchangeRate) || 83)} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 800 }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. LC DETAIL */}
                {activePage === 'lcd' && activeFormTab === 'General Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Internal LC No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Bank LC No *</label>
                        <input type="text" className="form-control" name="lcNoBank" value={fields.lcNoBank || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <select className="form-control" name="buyerName" value={fields.buyerName || ''} onChange={handleInputChange}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>LC Currency *</label>
                        <input type="text" className="form-control" name="lcCurrency" value={fields.lcCurrency || ''} onChange={handleInputChange} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>LC Amount (Foreign) *</label>
                        <input type="number" className="form-control" name="lcAmountForeign" value={fields.lcAmountForeign || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Exchange Rate *</label>
                        <input type="number" className="form-control" name="exchangeRate" value={fields.exchangeRate || ''} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>LC Amount INR (Auto)</label>
                        <input type="number" className="form-control" value={(Number(fields.lcAmountForeign) || 0) * (Number(fields.exchangeRate) || 83)} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 800 }} />
                      </div>
                      <div className="form-group">
                        <label>LC Expiry Date *</label>
                        <input type="date" className="form-control" name="expiryDate" value={fields.expiryDate || ''} onChange={handleInputChange} required />
                      </div>
                    </div>
                  </div>
                )}

                {/* FALLBACK FORM FIELDS FOR OTHER SUB PAGES */}
                {!['cbr', 'gen', 'cba', 'cdn', 'exp', 'lcd'].includes(activePage) && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Voucher Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Voucher Ref No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Record Name *</label>
                        <input type="text" className="form-control" value={PAGES_METADATA[activePage].label} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Authorized By *</label>
                        <select className="form-control" name="authorizedBy" value={fields.authorizedBy || 'Dinesh Balasamy (MD)'} onChange={handleInputChange}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Adjustment Narration / Remarks *</label>
                      <textarea className="form-control" rows="3" name="narration" placeholder="Enter comments..." value={fields.narration || ''} onChange={handleInputChange} required />
                    </div>
                  </div>
                )}

                {/* DETAILED CONFIGURATIONS TAB */}
                {activeFormTab === 'Detailed Configurations' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Extended Commercial Settings</h4>
                    <div className="form-group">
                      <label>Detailed Remarks / Audit Notes *</label>
                      <textarea className="form-control" rows="4" name="narration" placeholder="Enter ledger notes..." value={fields.narration || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Operational Status Toggle *</label>
                      <select className="form-control" name="status" value={fields.status || 'Active'} onChange={handleInputChange}>
                        <option value="Active">Active / Approved</option>
                        <option value="Draft">Draft</option>
                        <option value="Pending">Pending Audit</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
