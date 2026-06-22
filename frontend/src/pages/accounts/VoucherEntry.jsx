import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Search, Plus, Trash2, Printer, Check, 
  Clock, CreditCard, ChevronRight, X, Edit, Download, RefreshCw, PlusCircle
} from 'lucide-react';
import { partyAPI } from '../../services/api';

export default function VoucherEntry() {
  // Active category tab: 'BillPassing' | 'PaymentAdvise' | 'DebitNoteRecv' | 'DebitNoteAppr' | 'ReceiptEntry'
  const [activeTab, setActiveTab] = useState('BillPassing');

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentFormId, setCurrentFormId] = useState('');
  const [activeFormTab, setActiveFormTab] = useState('Reference Info');

  const [partiesList, setPartiesList] = useState([]);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await partyAPI.list();
        if (res.data && res.data.length > 0) {
          setPartiesList(res.data.map(p => p.company_name));
        }
      } catch (err) {
        console.error("Failed to fetch parties in VoucherEntry", err);
      }
    };
    fetchParties();
  }, []);

  // ----------------------------------------------------
  // DATA MASTER DIRECTORIES & CONFIGS
  // ----------------------------------------------------
  const PARTIES = useMemo(() => {
    return partiesList.length > 0 ? partiesList : ['Raymond Ltd', 'Reliance Retail', 'Vardhman Spinning', 'Chemical Traders', 'Sai Logistics', 'Sri Krishna Weaving'];
  }, [partiesList]);
  
  const EMPLOYEES = ['Senthil Kumar (General Manager)', 'Mani Bharathi (Store Head)', 'Dinesh Balasamy (MD)', 'Anjali Devi (Accounts Head)'];

  // ----------------------------------------------------
  // 1. BILL PASSING DATABASES & FORM STATES
  // ----------------------------------------------------
  const [bills, setBills] = useState([]);

  // Form Fields for Bill Passing
  const [bpCreditorName, setBpCreditorName] = useState('Vardhman Spinning');
  const [bpCreditorType, setBpCreditorType] = useState('Yarn Supplier');
  const [bpBillNo, setBpBillNo] = useState('');
  const [bpBillDate, setBpBillDate] = useState('');
  const [bpBillAmount, setBpBillAmount] = useState('');
  const [bpGstType, setBpGstType] = useState('CGST/SGST');
  const [bpGstPercent, setBpGstPercent] = useState(12);
  const [bpTdsPercent, setBpTdsPercent] = useState(1);
  const [bpPoNo, setBpPoNo] = useState('');
  const [bpGrnNo, setBpGrnNo] = useState('');
  const [bpPaymentTerms, setBpPaymentTerms] = useState('30 Days');
  const [bpNarration, setBpNarration] = useState('');
  const [bpApprovedBy, setBpApprovedBy] = useState('Anjali Devi (Accounts Head)');
  const [bpStatus, setBpStatus] = useState('Pending');

  // Auto Calculations for Bill Passing
  const bpGstAmount = useMemo(() => (Number(bpBillAmount) || 0) * (Number(bpGstPercent) || 0) / 100, [bpBillAmount, bpGstPercent]);
  const bpTdsAmount = useMemo(() => (Number(bpBillAmount) || 0) * (Number(bpTdsPercent) || 0) / 100, [bpBillAmount, bpTdsPercent]);
  const bpNetPayable = useMemo(() => (Number(bpBillAmount) || 0) + bpGstAmount - bpTdsAmount, [bpBillAmount, bpGstAmount, bpTdsAmount]);
  const bpDueDate = useMemo(() => {
    if (!bpBillDate) return '';
    const days = bpPaymentTerms === '30 Days' ? 30 : bpPaymentTerms === '60 Days' ? 60 : 15;
    const date = new Date(bpBillDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().substring(0, 10);
  }, [bpBillDate, bpPaymentTerms]);

  // ----------------------------------------------------
  // 2. PAYMENT ADVISE DATABASES & FORM STATES
  // ----------------------------------------------------
  const [advises, setAdvises] = useState([]);

  // Form fields for Payment Advise
  const [paCreditorName, setPaCreditorName] = useState('Vardhman Spinning');
  const [paBillPassingRef, setPaBillPassingRef] = useState('BP-00001');
  const [paBillAmount, setPaBillAmount] = useState(166500);
  const [paPrevOutstanding, setPaPrevOutstanding] = useState(45000);
  const [paPaymentAmount, setPaPaymentAmount] = useState('');
  const [paPaymentMode, setPaPaymentMode] = useState('NEFT');
  const [paBankName, setPaBankName] = useState('HDFC Bank');
  const [paChequeNo, setPaChequeNo] = useState('');
  const [paChequeDate, setPaChequeDate] = useState('');
  const [paNeftRef, setPaNeftRef] = useState('');
  const [paTdsDeducted, setPaTdsDeducted] = useState(0);
  const [paDiscountGiven, setPaDiscountGiven] = useState(0);
  const [paNarration, setPaNarration] = useState('');
  const [paAuthorizedBy, setPaAuthorizedBy] = useState('Dinesh Balasamy (MD)');
  const [paStatus, setPaStatus] = useState('Draft');

  // Calculations for Payment Advise
  const paTotalPayable = useMemo(() => (Number(paBillAmount) || 0) + (Number(paPrevOutstanding) || 0), [paBillAmount, paPrevOutstanding]);
  const paNetPayment = useMemo(() => (Number(paPaymentAmount) || 0) - (Number(paTdsDeducted) || 0) - (Number(paDiscountGiven) || 0), [paPaymentAmount, paTdsDeducted, paDiscountGiven]);

  // ----------------------------------------------------
  // 3. DEBIT NOTE RECEIVED DATABASES & FORM STATES
  // ----------------------------------------------------
  const [debitNotes, setDebitNotes] = useState([]);

  // Form fields for Debit Note Received
  const [dnBuyerName, setDnBuyerName] = useState('Raymond Ltd');
  const [dnBuyerDebitNo, setDnBuyerDebitNo] = useState('');
  const [dnBuyerDebitDate, setDnBuyerDebitDate] = useState('');
  const [dnAgainstInvoice, setDnAgainstInvoice] = useState('INV-08802');
  const [dnInvoiceDate, setDnInvoiceDate] = useState('2026-05-15');
  const [dnInvoiceAmount, setDnInvoiceAmount] = useState(480000);
  const [dnDebitAmount, setDnDebitAmount] = useState('');
  const [dnReason, setDnReason] = useState('Quality Issue');
  const [dnGstApplicable, setDnGstApplicable] = useState('Yes');
  const [dnGstPercent, setDnGstPercent] = useState(5);
  const [dnNarration, setDnNarration] = useState('');
  const [dnStatus, setDnStatus] = useState('Received');

  // Multi-row dynamic Fabric details grid for Debit Note
  const [dnGridItems, setDnGridItems] = useState([
    { designNo: '', qty: 0, rate: 0, amount: 0 }
  ]);

  // Auto Calculations
  const dnGstAmount = useMemo(() => dnGstApplicable === 'Yes' ? (Number(dnDebitAmount) || 0) * (Number(dnGstPercent) || 0) / 100 : 0, [dnGstApplicable, dnDebitAmount, dnGstPercent]);
  const dnNetDebitAmount = useMemo(() => (Number(dnDebitAmount) || 0) + dnGstAmount, [dnDebitAmount, dnGstAmount]);

  const handleAddDnGridRow = () => {
    setDnGridItems([...dnGridItems, { designNo: '', qty: 0, rate: 0, amount: 0 }]);
  };
  const handleRemoveDnGridRow = (idx) => {
    if (dnGridItems.length === 1) return;
    setDnGridItems(dnGridItems.filter((_, i) => i !== idx));
  };
  const handleDnGridChange = (idx, field, value) => {
    setDnGridItems(dnGridItems.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          updated.amount = (Number(updated.qty) || 0) * (Number(updated.rate) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  // ----------------------------------------------------
  // 4. DEBIT NOTE APPROVAL DATABASES & FORM STATES
  // ----------------------------------------------------
  const [approvals, setApprovals] = useState([]);

  // Form Fields for Approval
  const [apDebitRef, setApDebitRef] = useState('DNR-00001');
  const [apBuyerName, setApBuyerName] = useState('Raymond Ltd');
  const [apDebitNo, setApDebitNo] = useState('DN-RAY-889');
  const [apDebitAmount, setApDebitAmount] = useState(26250);
  const [apReason, setApReason] = useState('Quality Issue');
  const [apRemarks, setApRemarks] = useState('');
  const [apApprovedAmount, setApApprovedAmount] = useState('');
  const [apStatus, setApStatus] = useState('Fully Approved');
  const [apApprovedBy, setApApprovedBy] = useState('Anjali Devi (Accounts Head)');
  const [apAction, setApAction] = useState('Issue Credit Note');
  const [apCreditNoteIssue, setApCreditNoteIssue] = useState('Yes');
  const [apCreditNoteAmount, setApCreditNoteAmount] = useState('');
  const [apNarration, setApNarration] = useState('');

  // Calculations for Approval
  const apRejectedAmount = useMemo(() => (Number(apDebitAmount) || 0) - (Number(apApprovedAmount) || 0), [apDebitAmount, apApprovedAmount]);

  // ----------------------------------------------------
  // 5. RECEIPT ENTRY DATABASES & FORM STATES
  // ----------------------------------------------------
  const [receipts, setReceipts] = useState([]);

  // Form Fields for Receipt Entry
  const [rcReceiptType, setRcReceiptType] = useState('Against Invoice');
  const [rcReceivedFrom, setRcReceivedFrom] = useState('Raymond Ltd');
  const [rcAgainstInvoice, setRcAgainstInvoice] = useState('INV-08802');
  const [rcInvoiceAmount, setRcInvoiceAmount] = useState(480000);
  const [rcPrevOutstanding, setRcPrevOutstanding] = useState(120000);
  const [rcReceiptAmount, setRcReceiptAmount] = useState('');
  const [rcPaymentMode, setRcPaymentMode] = useState('RTGS');
  const [rcBankName, setRcBankName] = useState('ICICI Bank');
  const [rcChequeNo, setRcChequeNo] = useState('');
  const [rcChequeDate, setRcChequeDate] = useState('');
  const [rcTdsDeducted, setRcTdsDeducted] = useState(0);
  const [rcDiscountAllowed, setRcDiscountAllowed] = useState(0);
  const [rcNarration, setRcNarration] = useState('');
  const [rcReceivedBy, setRcReceivedBy] = useState('Anjali Devi (Accounts Head)');
  const [rcStatus, setRcStatus] = useState('Draft');

  // Calculations for Receipt Entry
  const rcTotalReceivable = useMemo(() => (Number(rcInvoiceAmount) || 0) + (Number(rcPrevOutstanding) || 0), [rcInvoiceAmount, rcPrevOutstanding]);
  const rcNetReceipt = useMemo(() => (Number(rcReceiptAmount) || 0) - (Number(rcTdsDeducted) || 0) - (Number(rcDiscountAllowed) || 0), [rcReceiptAmount, rcTdsDeducted, rcDiscountAllowed]);
  const rcBalanceOutstanding = useMemo(() => rcTotalReceivable - rcNetReceipt, [rcTotalReceivable, rcNetReceipt]);

  // ----------------------------------------------------
  // SEARCH & GENERAL STATE
  // ----------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');

  // ----------------------------------------------------
  // GENERAL ACTION HANDLERS
  // ----------------------------------------------------
  const handleCreateNew = () => {
    let nextId = '';
    if (activeTab === 'BillPassing') nextId = `BP-${String(bills.length + 1).padStart(5, '0')}`;
    if (activeTab === 'PaymentAdvise') nextId = `PA-${String(advises.length + 1).padStart(5, '0')}`;
    if (activeTab === 'DebitNoteRecv') nextId = `DNR-${String(debitNotes.length + 1).padStart(5, '0')}`;
    if (activeTab === 'DebitNoteAppr') nextId = `APP-${String(approvals.length + 1).padStart(5, '0')}`;
    if (activeTab === 'ReceiptEntry') nextId = `REC-${String(receipts.length + 1).padStart(5, '0')}`;

    setCurrentFormId(nextId);
    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const dateToday = new Date().toISOString().substring(0, 10);

    if (activeTab === 'BillPassing') {
      const isExisting = bills.some(b => b.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        creditorName: bpCreditorName,
        creditorType: bpCreditorType,
        billNo: bpBillNo,
        billDate: bpBillDate,
        billAmount: Number(bpBillAmount),
        gstNo: '33AAACV9801R1Z8',
        gstType: bpGstType,
        gstPercent: Number(bpGstPercent),
        gstAmount: bpGstAmount,
        tdsPercent: Number(bpTdsPercent),
        tdsAmount: bpTdsAmount,
        netPayable: bpNetPayable,
        poNo: bpPoNo,
        grnNo: bpGrnNo,
        paymentTerms: bpPaymentTerms,
        dueDate: bpDueDate,
        narration: bpNarration,
        approvedBy: bpApprovedBy,
        status: bpStatus
      };
      if (isExisting) {
        setBills(bills.map(b => b.id === currentFormId ? newVoucher : b));
      } else {
        setBills([newVoucher, ...bills]);
      }
    }

    if (activeTab === 'PaymentAdvise') {
      const isExisting = advises.some(a => a.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        creditorName: paCreditorName,
        billPassingRef: paBillPassingRef,
        billAmount: Number(paBillAmount),
        prevOutstanding: Number(paPrevOutstanding),
        totalPayable: paTotalPayable,
        paymentAmount: Number(paPaymentAmount),
        paymentMode: paPaymentMode,
        bankName: paBankName,
        chequeNo: paChequeNo,
        chequeDate: paChequeDate,
        neftRef: paNeftRef,
        paymentDate: dateToday,
        tdsDeducted: Number(paTdsDeducted),
        discountGiven: Number(paDiscountGiven),
        netPayment: paNetPayment,
        narration: paNarration,
        authorizedBy: paAuthorizedBy,
        status: paStatus
      };
      if (isExisting) {
        setAdvises(advises.map(a => a.id === currentFormId ? newVoucher : a));
      } else {
        setAdvises([newVoucher, ...advises]);
      }
    }

    if (activeTab === 'DebitNoteRecv') {
      const isExisting = debitNotes.some(d => d.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        buyerName: dnBuyerName,
        buyerDebitNo: dnBuyerDebitNo,
        buyerDebitDate: dnBuyerDebitDate,
        againstInvoice: dnAgainstInvoice,
        invoiceDate: dnInvoiceDate,
        invoiceAmount: Number(dnInvoiceAmount),
        debitAmount: Number(dnDebitAmount),
        reason: dnReason,
        gstApplicable: dnGstApplicable,
        gstPercent: Number(dnGstPercent),
        gstAmount: dnGstAmount,
        netDebitAmount: dnNetDebitAmount,
        items: dnGridItems,
        narration: dnNarration,
        status: dnStatus
      };
      if (isExisting) {
        setDebitNotes(debitNotes.map(d => d.id === currentFormId ? newVoucher : d));
      } else {
        setDebitNotes([newVoucher, ...debitNotes]);
      }
    }

    if (activeTab === 'DebitNoteAppr') {
      const isExisting = approvals.some(ap => ap.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        debitRef: apDebitRef,
        buyerName: apBuyerName,
        debitNo: apDebitNo,
        debitAmount: Number(apDebitAmount),
        reason: apReason,
        remarks: apRemarks,
        approvedAmount: Number(apApprovedAmount),
        rejectedAmount: apRejectedAmount,
        approvalStatus: apStatus,
        approvedBy: apApprovedBy,
        approvalDate: dateToday,
        action: apAction,
        creditNoteIssue: apCreditNoteIssue,
        creditNoteAmount: Number(apCreditNoteAmount),
        narration: apNarration
      };
      if (isExisting) {
        setApprovals(approvals.map(ap => ap.id === currentFormId ? newVoucher : ap));
      } else {
        setApprovals([newVoucher, ...approvals]);
      }
    }

    if (activeTab === 'ReceiptEntry') {
      const isExisting = receipts.some(r => r.id === currentFormId);
      const newVoucher = {
        id: currentFormId,
        date: dateToday,
        receiptType: rcReceiptType,
        receivedFrom: rcReceivedFrom,
        againstInvoice: rcAgainstInvoice,
        invoiceAmount: Number(rcInvoiceAmount),
        prevOutstanding: Number(rcPrevOutstanding),
        totalReceivable: rcTotalReceivable,
        receiptAmount: Number(rcReceiptAmount),
        paymentMode: rcPaymentMode,
        bankName: rcBankName,
        chequeNo: rcChequeNo,
        chequeDate: rcChequeDate,
        transactionDate: dateToday,
        tdsDeducted: Number(rcTdsDeducted),
        discountAllowed: Number(rcDiscountAllowed),
        netReceipt: rcNetReceipt,
        balanceOutstanding: rcBalanceOutstanding,
        narration: rcNarration,
        receivedBy: rcReceivedBy,
        status: rcStatus
      };
      if (isExisting) {
        setReceipts(receipts.map(r => r.id === currentFormId ? newVoucher : r));
      } else {
        setReceipts([newVoucher, ...receipts]);
      }
    }

    setIsFormOpen(false);
    alert("Voucher saved and posted successfully to ledger!");
  };

  const handleEdit = (voucher) => {
    setCurrentFormId(voucher.id);
    if (activeTab === 'BillPassing') {
      setBpCreditorName(voucher.creditorName);
      setBpCreditorType(voucher.creditorType);
      setBpBillNo(voucher.billNo);
      setBpBillDate(voucher.billDate);
      setBpBillAmount(voucher.billAmount);
      setBpGstType(voucher.gstType);
      setBpGstPercent(voucher.gstPercent);
      setBpTdsPercent(voucher.tdsPercent);
      setBpPoNo(voucher.poNo);
      setBpGrnNo(voucher.grnNo);
      setBpPaymentTerms(voucher.paymentTerms);
      setBpNarration(voucher.narration);
      setBpApprovedBy(voucher.approvedBy);
      setBpStatus(voucher.status);
    }

    if (activeTab === 'PaymentAdvise') {
      setPaCreditorName(voucher.creditorName);
      setPaBillPassingRef(voucher.billPassingRef);
      setPaBillAmount(voucher.billAmount);
      setPaPrevOutstanding(voucher.prevOutstanding);
      setPaPaymentAmount(voucher.paymentAmount);
      setPaPaymentMode(voucher.paymentMode);
      setPaBankName(voucher.bankName);
      setPaChequeNo(voucher.chequeNo);
      setPaChequeDate(voucher.chequeDate);
      setPaNeftRef(voucher.neftRef);
      setPaTdsDeducted(voucher.tdsDeducted);
      setPaDiscountGiven(voucher.discountGiven);
      setPaNarration(voucher.narration);
      setPaAuthorizedBy(voucher.authorizedBy);
      setPaStatus(voucher.status);
    }

    if (activeTab === 'DebitNoteRecv') {
      setDnBuyerName(voucher.buyerName);
      setDnBuyerDebitNo(voucher.buyerDebitNo);
      setDnBuyerDebitDate(voucher.buyerDebitDate);
      setDnAgainstInvoice(voucher.againstInvoice);
      setDnInvoiceDate(voucher.invoiceDate);
      setDnInvoiceAmount(voucher.invoiceAmount);
      setDnDebitAmount(voucher.debitAmount);
      setDnReason(voucher.reason);
      setDnGstApplicable(voucher.gstApplicable);
      setDnGstPercent(voucher.gstPercent);
      setDnGridItems(voucher.items);
      setDnNarration(voucher.narration);
      setDnStatus(voucher.status);
    }

    if (activeTab === 'DebitNoteAppr') {
      setApDebitRef(voucher.debitRef);
      setApBuyerName(voucher.buyerName);
      setApDebitNo(voucher.debitNo);
      setApDebitAmount(voucher.debitAmount);
      setApReason(voucher.reason);
      setApRemarks(voucher.remarks);
      setApApprovedAmount(voucher.approvedAmount);
      setApStatus(voucher.approvalStatus);
      setApApprovedBy(voucher.approvedBy);
      setApAction(voucher.action);
      setApCreditNoteIssue(voucher.creditNoteIssue);
      setApCreditNoteAmount(voucher.creditNoteAmount);
      setApNarration(voucher.narration);
    }

    if (activeTab === 'ReceiptEntry') {
      setRcReceiptType(voucher.receiptType);
      setRcReceivedFrom(voucher.receivedFrom);
      setRcAgainstInvoice(voucher.againstInvoice);
      setRcInvoiceAmount(voucher.invoiceAmount);
      setRcPrevOutstanding(voucher.prevOutstanding);
      setRcReceiptAmount(voucher.receiptAmount);
      setRcPaymentMode(voucher.paymentMode);
      setRcBankName(voucher.bankName);
      setRcChequeNo(voucher.chequeNo);
      setRcChequeDate(voucher.chequeDate);
      setRcTdsDeducted(voucher.tdsDeducted);
      setRcDiscountAllowed(voucher.discountAllowed);
      setRcNarration(voucher.narration);
      setRcReceivedBy(voucher.receivedBy);
      setRcStatus(voucher.status);
    }

    setActiveFormTab('Reference Info');
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this Accounts voucher?")) {
      if (activeTab === 'BillPassing') setBills(bills.filter(b => b.id !== id));
      if (activeTab === 'PaymentAdvise') setAdvises(advises.filter(a => a.id !== id));
      if (activeTab === 'DebitNoteRecv') setDebitNotes(debitNotes.filter(d => d.id !== id));
      if (activeTab === 'DebitNoteAppr') setApprovals(approvals.filter(ap => ap.id !== id));
      if (activeTab === 'ReceiptEntry') setReceipts(receipts.filter(r => r.id !== id));
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
                <CreditCard size={24} style={{ color: '#7c3aed' }} /> Accounts Voucher & Entry Center
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
                Post and verify invoices, creditor payouts, buyer debit notes, adjustments, and collection receipts.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={() => alert('Exporting ledger files...')}>
                <Download size={15} /> Export Ledger
              </button>
              <button className="btn btn-primary" onClick={handleCreateNew} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Plus size={16} /> Add New Voucher
              </button>
            </div>
          </div>

          {/* VOUCHER DOMAIN TABS */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '24px' }}>
            {[
              { key: 'BillPassing', label: "Creditor's Bill Passing" },
              { key: 'PaymentAdvise', label: "Creditor's Payment Advise" },
              { key: 'DebitNoteRecv', label: "Buyer Debit Note Received" },
              { key: 'DebitNoteAppr', label: "Debit Note Approval" },
              { key: 'ReceiptEntry', label: "Receipt Entry" }
            ].map(tab => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: 'none',
                    background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                    color: isSelected ? '#7c3aed' : 'var(--text-secondary)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* KPI CARDS (DYNAMICS ACCORDING TO SELECTED TAB) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Vouchers Logged</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0 0 0' }}>
                {activeTab === 'BillPassing' && bills.length}
                {activeTab === 'PaymentAdvise' && advises.length}
                {activeTab === 'DebitNoteRecv' && debitNotes.length}
                {activeTab === 'DebitNoteAppr' && approvals.length}
                {activeTab === 'ReceiptEntry' && receipts.length}
              </h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Value Cleared</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: '8px 0 0 0' }}>
                ₹ {activeTab === 'BillPassing' && bills.reduce((a,c) => a + c.netPayable, 0).toLocaleString()}
                {activeTab === 'PaymentAdvise' && advises.reduce((a,c) => a + c.netPayment, 0).toLocaleString()}
                {activeTab === 'DebitNoteRecv' && debitNotes.reduce((a,c) => a + c.netDebitAmount, 0).toLocaleString()}
                {activeTab === 'DebitNoteAppr' && approvals.reduce((a,c) => a + c.approvedAmount, 0).toLocaleString()}
                {activeTab === 'ReceiptEntry' && receipts.reduce((a,c) => a + c.netReceipt, 0).toLocaleString()}
              </h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Action Required / Pending</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b', margin: '8px 0 0 0' }}>
                {activeTab === 'BillPassing' && bills.filter(b => b.status === 'Pending').length}
                {activeTab === 'PaymentAdvise' && advises.filter(a => a.status === 'Draft').length}
                {activeTab === 'DebitNoteRecv' && debitNotes.filter(d => d.status === 'Received').length}
                {activeTab === 'DebitNoteAppr' && approvals.filter(ap => ap.approvalStatus === 'Pending').length}
                {activeTab === 'ReceiptEntry' && receipts.filter(r => r.status === 'Draft').length}
              </h3>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', background: 'white' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Financial Risk Outstandings</span>
              <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444', margin: '8px 0 0 0' }}>
                ₹ {activeTab === 'ReceiptEntry' ? receipts.reduce((a,c) => a + c.balanceOutstanding, 0).toLocaleString() : 'N/A'}
              </h3>
            </div>

          </div>

          {/* CENTRAL DATATABLES */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
            <div style={{ overflowX: 'auto' }}>
              {activeTab === 'BillPassing' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>VOUCHER NO</th>
                      <th>DATE</th>
                      <th>CREDITOR NAME</th>
                      <th>TYPE</th>
                      <th>BILL DETAILS</th>
                      <th style={{ textAlign: 'right' }}>BILL AMOUNT</th>
                      <th style={{ textAlign: 'right' }}>GST AMOUNT</th>
                      <th style={{ textAlign: 'right' }}>NET PAYABLE</th>
                      <th>DUE DATE</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.creditorName}</td>
                        <td>{row.creditorType}</td>
                        <td>{row.billNo} (Dt: {row.billDate})</td>
                        <td style={{ textAlign: 'right' }}>₹ {row.billAmount.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#2563eb' }}>₹ {row.gstAmount.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>₹ {row.netPayable.toLocaleString()}</td>
                        <td style={{ color: '#dc2626' }}>{row.dueDate}</td>
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

              {activeTab === 'PaymentAdvise' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>ADVISE NO</th>
                      <th>DATE</th>
                      <th>CREDITOR NAME</th>
                      <th>BILL REF</th>
                      <th style={{ textAlign: 'right' }}>TOTAL PAYABLE</th>
                      <th style={{ textAlign: 'right' }}>ADVISED AMOUNT</th>
                      <th>MODE</th>
                      <th>UTR/CHEQUE</th>
                      <th style={{ textAlign: 'right' }}>NET PAYMENT</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advises.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.creditorName}</td>
                        <td>{row.billPassingRef}</td>
                        <td style={{ textAlign: 'right' }}>₹ {row.totalPayable.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>₹ {row.paymentAmount.toLocaleString()}</td>
                        <td>{row.paymentMode}</td>
                        <td>{row.chequeNo || row.neftRef}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>₹ {row.netPayment.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${row.status === 'Advised' ? 'badge-active' : 'badge-pending'}`}>{row.status}</span>
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

              {activeTab === 'DebitNoteRecv' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>VOUCHER NO</th>
                      <th>DATE</th>
                      <th>BUYER NAME</th>
                      <th>DEBIT NOTE NO</th>
                      <th>AGAINST INVOICE</th>
                      <th style={{ textAlign: 'right' }}>DEBIT AMOUNT</th>
                      <th style={{ textAlign: 'right' }}>GST AMOUNT</th>
                      <th style={{ textAlign: 'right' }}>NET DEBIT</th>
                      <th>REASON</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debitNotes.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.buyerName}</td>
                        <td>{row.buyerDebitNo}</td>
                        <td>{row.againstInvoice}</td>
                        <td style={{ textAlign: 'right' }}>₹ {row.debitAmount.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>₹ {row.gstAmount.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>₹ {row.netDebitAmount.toLocaleString()}</td>
                        <td>{row.reason}</td>
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

              {activeTab === 'DebitNoteAppr' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>APPROVAL NO</th>
                      <th>DATE</th>
                      <th>DEBIT REF</th>
                      <th>BUYER NAME</th>
                      <th style={{ textAlign: 'right' }}>TOTAL DN CLAIM</th>
                      <th style={{ textAlign: 'right' }}>APPROVED VALUE</th>
                      <th style={{ textAlign: 'right' }}>REJECTED VALUE</th>
                      <th>ACTION PRESCRIBED</th>
                      <th>CREDIT NOTE</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td>{row.debitRef}</td>
                        <td style={{ fontWeight: 600 }}>{row.buyerName}</td>
                        <td style={{ textAlign: 'right' }}>₹ {row.debitAmount.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>₹ {row.approvedAmount.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#dc2626' }}>₹ {row.rejectedAmount.toLocaleString()}</td>
                        <td>{row.action}</td>
                        <td>{row.creditNoteIssue === 'Yes' ? `₹ ${row.creditNoteAmount}` : 'No'}</td>
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

              {activeTab === 'ReceiptEntry' && (
                <table className="data-table" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>RECEIPT NO</th>
                      <th>DATE</th>
                      <th>RECEIVED FROM</th>
                      <th>TYPE</th>
                      <th>INVOICE NO</th>
                      <th style={{ textAlign: 'right' }}>RECEIVABLE</th>
                      <th style={{ textAlign: 'right' }}>RECEIPT AMOUNT</th>
                      <th>MODE</th>
                      <th style={{ textAlign: 'right' }}>NET RECEIPT</th>
                      <th style={{ textAlign: 'right' }}>BALANCE O/S</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map(row => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 700 }}>{row.id}</td>
                        <td>{row.date}</td>
                        <td style={{ fontWeight: 600 }}>{row.receivedFrom}</td>
                        <td>{row.receiptType}</td>
                        <td>{row.againstInvoice}</td>
                        <td style={{ textAlign: 'right' }}>₹ {row.totalReceivable.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>₹ {row.receiptAmount.toLocaleString()}</td>
                        <td>{row.paymentMode}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>₹ {row.netReceipt.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>₹ {row.balanceOutstanding.toLocaleString()}</td>
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
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* =========================== 2. FORM ENTRY MODE ========================== */
        /* ========================================================================= */
        <div className="card animate-fade" style={{ padding: '32px', minHeight: '600px', background: 'white' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '18px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 850, color: 'var(--text-primary)', margin: 0 }}>
                {activeTab === 'BillPassing' && `Creditor's Bill Passing Voucher — ${currentFormId}`}
                {activeTab === 'PaymentAdvise' && `Creditor's Payment Advise Voucher — ${currentFormId}`}
                {activeTab === 'DebitNoteRecv' && `Buyer Debit Note Received Voucher — ${currentFormId}`}
                {activeTab === 'DebitNoteAppr' && `Buyer Debit Note Approval — ${currentFormId}`}
                {activeTab === 'ReceiptEntry' && `Receipt Voucher Entry — ${currentFormId}`}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Financial Voucher Ledger Entry Module</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <X size={15} /> Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#7c3aed', borderColor: '#7c3aed' }}>
                <Check size={15} /> Save Slip
              </button>
            </div>
          </div>

          {/* Form Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '28px' }}>
            {activeTab === 'DebitNoteRecv' ? (
              ['Reference Info', 'Buyer Debit Details', 'Fabric Grid Details'].map(tab => {
                const isSelected = activeFormTab === tab;
                return (
                  <button key={tab} type="button" onClick={() => setActiveFormTab(tab)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 800, border: 'none', background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent', color: isSelected ? '#7c3aed' : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>
                    {tab}
                  </button>
                );
              })
            ) : (
              ['Reference Info', 'Transaction & Quantities', 'Authorization & Remarks'].map(tab => {
                const isSelected = activeFormTab === tab;
                return (
                  <button key={tab} type="button" onClick={() => setActiveFormTab(tab)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 800, border: 'none', background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'transparent', color: isSelected ? '#7c3aed' : 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}>
                    {tab}
                  </button>
                );
              })
            )}
          </div>

          {/* Form Rendering */}
          <div style={{ minHeight: '400px' }}>

            {/* ======================= BILL PASSING FORM ======================= */}
            {activeTab === 'BillPassing' && (
              <>
                {activeFormTab === 'Reference Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Bill Passing Reference & Party Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Bill Passing No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Creditor Name *</label>
                        <select className="form-control" value={bpCreditorName} onChange={e => setBpCreditorName(e.target.value)}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Creditor Type *</label>
                        <select className="form-control" value={bpCreditorType} onChange={e => setBpCreditorType(e.target.value)}>
                          <option value="Yarn Supplier">Yarn Supplier</option>
                          <option value="Fabric Supplier">Fabric Supplier</option>
                          <option value="Job Worker">Job Worker</option>
                          <option value="Service Provider">Service Provider</option>
                          <option value="Machinery Supplier">Machinery Supplier</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>GST No (Auto Fill) ⚠️</label>
                        <input type="text" className="form-control" value="33AAACV9801R1Z8" disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Transaction & Quantities' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Invoice Metrics & Tax Calculations</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Bill No *</label>
                        <input type="text" className="form-control" value={bpBillNo} onChange={e => setBpBillNo(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Bill Date *</label>
                        <input type="date" className="form-control" value={bpBillDate} onChange={e => setBpBillDate(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Bill Amount *</label>
                        <input type="number" className="form-control" value={bpBillAmount} onChange={e => setBpBillAmount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>GSTIN Type *</label>
                        <select className="form-control" value={bpGstType} onChange={e => setBpGstType(e.target.value)}>
                          <option value="CGST/SGST">CGST/SGST (Intra-state)</option>
                          <option value="IGST">IGST (Inter-state)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>GST % *</label>
                        <input type="number" className="form-control" value={bpGstPercent} onChange={e => setBpGstPercent(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>GST Amount (Auto Calc)</label>
                        <input type="number" className="form-control" value={bpGstAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>TDS % *</label>
                        <input type="number" className="form-control" value={bpTdsPercent} onChange={e => setBpTdsPercent(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>TDS Amount (Auto Calc)</label>
                        <input type="number" className="form-control" value={bpTdsAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Against PO No</label>
                        <input type="text" className="form-control" placeholder="PO reference" value={bpPoNo} onChange={e => setBpPoNo(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Against GRN No</label>
                        <input type="text" className="form-control" placeholder="GRN reference" value={bpGrnNo} onChange={e => setBpGrnNo(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: '#16a34a', fontWeight: 800 }}>Net Payable (Auto Calc)</label>
                        <input type="number" className="form-control" value={bpNetPayable} disabled style={{ background: 'rgba(22, 163, 74, 0.05)', fontWeight: 800, color: '#16a34a' }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Authorization & Remarks' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Payment Terms & Approvals</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Payment Terms *</label>
                        <select className="form-control" value={bpPaymentTerms} onChange={e => setBpPaymentTerms(e.target.value)}>
                          <option value="15 Days">15 Days</option>
                          <option value="30 Days">30 Days</option>
                          <option value="60 Days">60 Days</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Due Date (Auto Calc)</label>
                        <input type="date" className="form-control" value={bpDueDate} disabled style={{ background: 'var(--bg-secondary)', color: '#dc2626', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Approved By *</label>
                        <select className="form-control" value={bpApprovedBy} onChange={e => setBpApprovedBy(e.target.value)}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Narration / Notes *</label>
                      <textarea className="form-control" rows="3" value={bpNarration} onChange={e => setBpNarration(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label>Bill Status</label>
                      <select className="form-control" value={bpStatus} onChange={e => setBpStatus(e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ======================= PAYMENT ADVISE FORM ======================= */}
            {activeTab === 'PaymentAdvise' && (
              <>
                {activeFormTab === 'Reference Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Payment Advise Basic Reference</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Advise No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Creditor Name *</label>
                        <select className="form-control" value={paCreditorName} onChange={e => setPaCreditorName(e.target.value)}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Bill Passing Ref No. *</label>
                        <select className="form-control" value={paBillPassingRef} onChange={e => setPaBillPassingRef(e.target.value)}>
                          {bills.map(b => <option key={b.id} value={b.id}>{b.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Bill Amount (Auto Fill)</label>
                        <input type="number" className="form-control" value={paBillAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Previous Outstanding *</label>
                        <input type="number" className="form-control" value={paPrevOutstanding} onChange={e => setPaPrevOutstanding(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Total Payable (Auto Calc)</label>
                        <input type="number" className="form-control" value={paTotalPayable} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Advised Payment Amount *</label>
                        <input type="number" className="form-control" value={paPaymentAmount} onChange={e => setPaPaymentAmount(e.target.value)} required />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Transaction & Quantities' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Payment Mode & Settlement Metrics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Payment Mode *</label>
                        <select className="form-control" value={paPaymentMode} onChange={e => setPaPaymentMode(e.target.value)}>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="NEFT">NEFT</option>
                          <option value="RTGS">RTGS</option>
                          <option value="IMPS">IMPS</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Bank Name *</label>
                        <select className="form-control" value={paBankName} onChange={e => setPaBankName(e.target.value)}>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="SBI Bank">State Bank of India</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Cheque / UTR No *</label>
                        <input type="text" className="form-control" value={paChequeNo} onChange={e => setPaChequeNo(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Cheque Date ⚠️</label>
                        <input type="date" className="form-control" value={paChequeDate} onChange={e => setPaChequeDate(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>NEFT / RTGS Ref No ⚠️</label>
                        <input type="text" className="form-control" value={paNeftRef} onChange={e => setPaNeftRef(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>TDS Deducted ⚠️</label>
                        <input type="number" className="form-control" value={paTdsDeducted} onChange={e => setPaTdsDeducted(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Discount Given ⚠️</label>
                        <input type="number" className="form-control" value={paDiscountGiven} onChange={e => setPaDiscountGiven(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: '#16a34a', fontWeight: 800 }}>Net Dispatched Payment (Auto Calc)</label>
                        <input type="number" className="form-control" value={paNetPayment} disabled style={{ background: 'rgba(22, 163, 74, 0.05)', fontWeight: 800, color: '#16a34a' }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Authorization & Remarks' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Verification Approvals & Status</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>Authorized By *</label>
                        <select className="form-control" value={paAuthorizedBy} onChange={e => setPaAuthorizedBy(e.target.value)}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Advise Status</label>
                        <select className="form-control" value={paStatus} onChange={e => setPaStatus(e.target.value)}>
                          <option value="Draft">Draft</option>
                          <option value="Advised">Advised</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Narration *</label>
                      <textarea className="form-control" rows="3" value={paNarration} onChange={e => setPaNarration(e.target.value)} required />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ======================= DEBIT NOTE RECEIVED FORM ======================= */}
            {activeTab === 'DebitNoteRecv' && (
              <>
                {activeFormTab === 'Reference Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Buyer Debit Note Reference Info</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Debit Note Recv No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Name *</label>
                        <select className="form-control" value={dnBuyerName} onChange={e => setDnBuyerName(e.target.value)}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Buyer Debit Note No *</label>
                        <input type="text" className="form-control" value={dnBuyerDebitNo} onChange={e => setDnBuyerDebitNo(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Buyer Debit Note Date *</label>
                        <input type="date" className="form-control" value={dnBuyerDebitDate} onChange={e => setDnBuyerDebitDate(e.target.value)} required />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Buyer Debit Details' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Taxation & Linkages</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Against Sales Invoice No *</label>
                        <input type="text" className="form-control" value={dnAgainstInvoice} onChange={e => setDnAgainstInvoice(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Invoice Date (Auto Fill)</label>
                        <input type="date" className="form-control" value={dnInvoiceDate} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Invoice Amount (Auto Fill)</label>
                        <input type="number" className="form-control" value={dnInvoiceAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Debit Note Claim Amount *</label>
                        <input type="number" className="form-control" value={dnDebitAmount} onChange={e => setDnDebitAmount(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Reason for Debit Note *</label>
                        <select className="form-control" value={dnReason} onChange={e => setDnReason(e.target.value)}>
                          <option value="Quality Issue">Quality Issue</option>
                          <option value="Short Quantity">Short Quantity</option>
                          <option value="Rate Difference">Rate Difference</option>
                          <option value="Wrong Item">Wrong Item</option>
                          <option value="Damage in Transit">Damage in Transit</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>GST Applicable *</label>
                        <select className="form-control" value={dnGstApplicable} onChange={e => setDnGstApplicable(e.target.value)}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>GST % ⚠️</label>
                        <input type="number" className="form-control" value={dnGstPercent} onChange={e => setDnGstPercent(e.target.value)} disabled={dnGstApplicable === 'No'} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: '#dc2626', fontWeight: 800 }}>Net Debit Amount (Auto Calc)</label>
                        <input type="number" className="form-control" value={dnNetDebitAmount} disabled style={{ background: 'rgba(220, 38, 38, 0.05)', fontWeight: 800, color: '#dc2626' }} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Narration *</label>
                      <textarea className="form-control" rows="3" value={dnNarration} onChange={e => setDnNarration(e.target.value)} required />
                    </div>
                  </div>
                )}

                {activeFormTab === 'Fabric Grid Details' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Fabric Return / Checking Details Table Grid</h4>
                      <button type="button" className="btn btn-secondary" onClick={handleAddDnGridRow} style={{ padding: '4px 10px', fontSize: '12px' }}><PlusCircle size={13} /> Add Fabric Row</button>
                    </div>

                    <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>Design No. *</th>
                          <th style={{ width: '130px' }}>Quantity *</th>
                          <th style={{ width: '130px' }}>Rate *</th>
                          <th style={{ width: '150px' }}>Amount (Auto Calc)</th>
                          <th style={{ width: '60px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dnGridItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <input type="text" className="form-control" style={{ margin: 0, padding: '4px 8px' }} placeholder="Design No" value={item.designNo} onChange={e => handleDnGridChange(idx, 'designNo', e.target.value)} required />
                            </td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.qty} onChange={e => handleDnGridChange(idx, 'qty', Number(e.target.value))} required />
                            </td>
                            <td>
                              <input type="number" className="form-control" style={{ margin: 0, padding: '4px 8px' }} value={item.rate} onChange={e => handleDnGridChange(idx, 'rate', Number(e.target.value))} required />
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              ₹ {item.amount.toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button type="button" onClick={() => handleRemoveDnGridRow(idx)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none' }} disabled={dnGridItems.length === 1}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ======================= DEBIT NOTE APPROVAL FORM ======================= */}
            {activeTab === 'DebitNoteAppr' && (
              <>
                {activeFormTab === 'Reference Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Voucher Reference Linkage</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Approval No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Debit Note Ref Link *</label>
                        <select className="form-control" value={apDebitRef} onChange={e => setApDebitRef(e.target.value)}>
                          {debitNotes.map(d => <option key={d.id} value={d.id}>{d.id}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Buyer Name (Auto Fill)</label>
                        <input type="text" className="form-control" value={apBuyerName} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Debit Note Claim (Auto Fill)</label>
                        <input type="number" className="form-control" value={apDebitAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Transaction & Quantities' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Approved/Rejected Valuation</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Reason (Auto Fill)</label>
                        <input type="text" className="form-control" value={apReason} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Approved Amount *</label>
                        <input type="number" className="form-control" value={apApprovedAmount} onChange={e => setApApprovedAmount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Rejected Amount (Auto Calc)</label>
                        <input type="number" className="form-control" value={apRejectedAmount} disabled style={{ background: 'var(--bg-secondary)', color: '#dc2626', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Approval Status *</label>
                        <select className="form-control" value={apStatus} onChange={e => setApStatus(e.target.value)}>
                          <option value="Pending">Pending</option>
                          <option value="Partially Approved">Partially Approved</option>
                          <option value="Fully Approved">Fully Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Action Option *</label>
                        <select className="form-control" value={apAction} onChange={e => setApAction(e.target.value)}>
                          <option value="Adjust in Next Invoice">Adjust in Next Invoice</option>
                          <option value="Issue Credit Note">Issue Credit Note</option>
                          <option value="Direct Payment">Direct Payment</option>
                          <option value="Reject Claim">Reject Claim</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Credit Note to Issue *</label>
                        <select className="form-control" value={apCreditNoteIssue} onChange={e => setApCreditNoteIssue(e.target.value)}>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Credit Note Amount ⚠️</label>
                        <input type="number" className="form-control" value={apCreditNoteAmount} onChange={e => setApCreditNoteAmount(e.target.value)} disabled={apCreditNoteIssue === 'No'} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Authorization & Remarks' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Final verification checklist</h4>
                    <div className="form-group">
                      <label>Verification Audit Remarks *</label>
                      <textarea className="form-control" rows="3" value={apRemarks} onChange={e => setApRemarks(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Approved By *</label>
                      <select className="form-control" value={apApprovedBy} onChange={e => setApApprovedBy(e.target.value)}>
                        {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ======================= RECEIPT ENTRY FORM ======================= */}
            {activeTab === 'ReceiptEntry' && (
              <>
                {activeFormTab === 'Reference Info' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Receipt Reference & Linkages</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Receipt No</label>
                        <input type="text" className="form-control" value={currentFormId} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                      <div className="form-group">
                        <label>Receipt Type *</label>
                        <select className="form-control" value={rcReceiptType} onChange={e => setRcReceiptType(e.target.value)}>
                          <option value="Advance Receipt">Advance Receipt</option>
                          <option value="Against Invoice">Against Invoice</option>
                          <option value="Part Payment">Part Payment</option>
                          <option value="Full Settlement">Full Settlement</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Received From *</label>
                        <select className="form-control" value={rcReceivedFrom} onChange={e => setRcReceivedFrom(e.target.value)}>
                          {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Against Sales Invoice No *</label>
                        <input type="text" className="form-control" value={rcAgainstInvoice} onChange={e => setRcAgainstInvoice(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Invoice Amount (Auto Fill)</label>
                        <input type="number" className="form-control" value={rcInvoiceAmount} disabled style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label>Previous Outstanding *</label>
                        <input type="number" className="form-control" value={rcPrevOutstanding} onChange={e => setRcPrevOutstanding(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Total Receivable (Auto Calc)</label>
                        <input type="number" className="form-control" value={rcTotalReceivable} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 700 }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeFormTab === 'Transaction & Quantities' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Collection Values & Mode</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Collected Receipt Amount *</label>
                        <input type="number" className="form-control" value={rcReceiptAmount} onChange={e => setRcReceiptAmount(e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label>Payment Mode *</label>
                        <select className="form-control" value={rcPaymentMode} onChange={e => setRcPaymentMode(e.target.value)}>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="NEFT">NEFT</option>
                          <option value="RTGS">RTGS</option>
                          <option value="IMPS">IMPS</option>
                          <option value="UPI">UPI</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Bank Name *</label>
                        <select className="form-control" value={rcBankName} onChange={e => setRcBankName(e.target.value)}>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="SBI Bank">State Bank of India</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Cheque / UTR No *</label>
                        <input type="text" className="form-control" value={rcChequeNo} onChange={e => setRcChequeNo(e.target.value)} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <div className="form-group">
                        <label>Cheque Date ⚠️</label>
                        <input type="date" className="form-control" value={rcChequeDate} onChange={e => setRcChequeDate(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>TDS Deducted by Buyer ⚠️</label>
                        <input type="number" className="form-control" value={rcTdsDeducted} onChange={e => setRcTdsDeducted(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Discount Allowed ⚠️</label>
                        <input type="number" className="form-control" value={rcDiscountAllowed} onChange={e => setRcDiscountAllowed(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: '#16a34a', fontWeight: 800 }}>Net Receipt (Auto Calc)</label>
                        <input type="number" className="form-control" value={rcNetReceipt} disabled style={{ background: 'rgba(22, 163, 74, 0.05)', fontWeight: 800, color: '#16a34a' }} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ color: '#dc2626', fontWeight: 800 }}>Balance Outstanding (Auto Calc)</label>
                      <input type="number" className="form-control" value={rcBalanceOutstanding} disabled style={{ background: 'rgba(220, 38, 38, 0.05)', fontWeight: 800, color: '#dc2626' }} />
                    </div>
                  </div>
                )}

                {activeFormTab === 'Authorization & Remarks' && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 800, margin: 0 }}>Approvals & Confirmed status</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label>Received By *</label>
                        <select className="form-control" value={rcReceivedBy} onChange={e => setRcReceivedBy(e.target.value)}>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Receipt Status</label>
                        <select className="form-control" value={rcStatus} onChange={e => setRcStatus(e.target.value)}>
                          <option value="Draft">Draft</option>
                          <option value="Confirmed">Confirmed</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Remarks / Narration *</label>
                      <textarea className="form-control" rows="3" value={rcNarration} onChange={e => setRcNarration(e.target.value)} required />
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
