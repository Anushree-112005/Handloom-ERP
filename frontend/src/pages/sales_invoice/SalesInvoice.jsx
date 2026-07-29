import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, ShoppingCart, CheckCircle, Download, FileText, Briefcase, FileSpreadsheet } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { salesInvoiceAPI, dropdownAPI, partyAPI, subMasterAPI, goodsReleaseAPI, buyerOrderAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function SalesInvoice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [view, setView] = useState('list'); // 'list' | 'form'
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Single view mode using viewModalInvoice
  const [activeTab, setActiveTab] = useState('general');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [viewModalInvoice, setViewModalInvoice] = useState(null);

  // Dynamic Options
  const [options, setOptions] = useState({
    agents: [],
    transporters: [],
    all_parties: [],
    employees: [],
    masters: {}
  });

  const [isCustomPaymentMode, setIsCustomPaymentMode] = useState(false);
  const [customPaymentMode, setCustomPaymentMode] = useState('');
  
  const [isCustomTransportMode, setIsCustomTransportMode] = useState(false);
  const [customTransportMode, setCustomTransportMode] = useState('');
  
  const [isCustomFreightMode, setIsCustomFreightMode] = useState(false);
  const [customFreightMode, setCustomFreightMode] = useState('');
  
  const [isCustomLrTerms, setIsCustomLrTerms] = useState(false);
  const [customLrTerms, setCustomLrTerms] = useState('');

  const [isCustomTransport, setIsCustomTransport] = useState(false);
  const [customTransport, setCustomTransport] = useState('');

  const [isCustomInvoiceType, setIsCustomInvoiceType] = useState(false);
  const [customInvoiceType, setCustomInvoiceType] = useState('');
  
  const [selectedPartyData, setSelectedPartyData] = useState(null);
  const [selectedDeliveryPartyData, setSelectedDeliveryPartyData] = useState(null);

  // Main Form State
  const initialForm = {
    invoice_type_id: '',
    type: '',
    invoice_no: '',
    invoice_date: new Date().toISOString().split('T')[0],
    gra_no: '',
    date: new Date().toISOString().split('T')[0],
    dis_no: '',
    dis_date: new Date().toISOString().split('T')[0],
    pay_name: '',
    delivery: '',
    invoice_address: '',
    delivery_address: '',
    billing_address_alias: '',
    shipping_address_alias: '',
    state: '',
    state_code: '',
    dly_state_code: '',
    po_no: '',
    po_date: new Date().toISOString().split('T')[0],
    agent_name: '',
    due_days: '',
    due_date: new Date().toISOString().split('T')[0],
    payment: '',
    pmt_ref_no: '',
    transport: '',
    transport_id: '',
    truck_no: '',
    vehicle_type: 'Regular',
    transport_mode: '',
    freight_mode: '',
    lr_no: '',
    lr_date: new Date().toISOString().split('T')[0],
    lr_team: '',
    gst_no: '',
    
    other_char_1: '',
    other_char_value_1: '',
    other_char_2: '',
    other_char_value_2: '',
    other_char_3: '',
    other_char_value_3: '',
    other_char_4: '',
    other_char_value_4: '',
    
    total_qty: 0,
    gross_amount: 0,
    gross_weight: '',
    discount_pct: 0,
    discount_amount: 0,
    taxable_amount: 0,
    sgst: 0,
    cgst: 0,
    igst: 0,
    other_charges: 0,
    round_off: 0,
    net_amount: 0,
    status: 'Draft'
  };

  const [formData, setFormData] = useState(initialForm);
  
  // Table Items State
  const [items, setItems] = useState([
    { design_no: '', hsn_code: '', description: '', total_bale: '', uom: 'MTR', qty: '', rate: '', amount: 0 }
  ]);

  const [graList, setGraList] = useState([]);

  useEffect(() => {
    fetchInvoices();
    fetchOptions();
    fetchGraList();
  }, []);

  useEffect(() => {
    if (queryId && invoices.length > 0) {
      const matched = invoices.find(inv => String(inv.id) === String(queryId));
      if (matched) {
        handleOpenForm(matched, true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [queryId, invoices]);

  const fetchGraList = async () => {
    try {
      const { data } = await goodsReleaseAPI.list();
      setGraList(data);
    } catch (err) {
      console.error("Error fetching GRA list:", err);
    }
    
    try {
      const { data: boData } = await buyerOrderAPI.list();
      setBuyerOrders(boData || []);
    } catch (err) {
      console.error("Error fetching Buyer Orders:", err);
    }
  };

  // Auto-fill form fields from selected GRA
  const handleGraSelect = async (graNo) => {
    setFormData(prev => ({ ...prev, gra_no: graNo }));
    if (!graNo) return;

    try {
      // Find the GRA from the already-loaded list
      const gra = graList.find(g => (g.gra_no || String(g.id)) === graNo);
      if (!gra) return;

      // Fetch full GRA detail with items
      const { data: graDetail } = await goodsReleaseAPI.get(gra.id);

      // Parse extra fields stored in remarks JSON
      let extra = {};
      try { extra = graDetail.remarks ? JSON.parse(graDetail.remarks) : {}; } catch (_) {}

      // Auto-fill header fields from GRA
      setFormData(prev => ({
        ...prev,
        gra_no: graNo,
        pay_name: graDetail.party_name || prev.pay_name,
        delivery: graDetail.party_name || prev.delivery,
        delivery_address: graDetail.delivery_address || prev.delivery_address,
        transport: graDetail.transport_name || prev.transport,
        transport_mode: graDetail.transport_mode || prev.transport_mode,
        truck_no: graDetail.vehicle_no || prev.truck_no,
        lr_no: graDetail.lr_no || prev.lr_no,
        lr_date: graDetail.lr_date || prev.lr_date,
        freight_mode: extra.freight_mode || prev.freight_mode,
        lr_team: extra.lr_team || prev.lr_team,
        gross_weight: graDetail.gross_weight || prev.gross_weight,
        total_qty: Number(graDetail.total_meters) || prev.total_qty,
      }));

      // Populate line items from GRA items
      const graItems = graDetail.items || [];
      if (graItems.length > 0) {
        setItems(graItems.map(it => ({
          design_no: it.design_no || '',
          hsn_code: '',
          description: it.color ? `${it.design_no || ''} - ${it.color}` : (it.design_no || ''),
          total_bale: it.bale_no || '',
          uom: 'MTR',
          qty: Number(it.meters) || '',
          rate: Number(it.rate) || '',
          amount: Number(it.amount) || 0
        })));
      }
    } catch (err) {
      console.error('Error fetching GRA details:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data } = await salesInvoiceAPI.list();
      setInvoices(data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const { data } = await dropdownAPI.getAll();
      setOptions(data);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  const handleSaveCustomOption = async (entity, nameVal, stateSetter, isCustomSetter, formField) => {
    if (!nameVal?.trim()) return;
    try {
      await subMasterAPI.create(entity, { entity, name: nameVal.trim(), is_active: true });
      const { data } = await dropdownAPI.getAll();
      setOptions(data);
      if (formField) {
        setFormData(prev => ({ ...prev, [formField]: nameVal.trim() }));
      }
      if (stateSetter) stateSetter('');
      if (isCustomSetter) isCustomSetter(false);
    } catch (err) {
      console.error(err);
      alert('Error saving custom option');
    }
  };

  const handlePartyChange = async (partyName) => {
    if (!partyName) {
      setFormData(prev => ({
        ...prev,
        pay_name: '',
        invoice_address: '',
        state_code: '',
        state: ''
      }));
      return;
    }

    try {
      const { data: partyList } = await partyAPI.list();
      const party = partyList.find(p => p.company_name === partyName || p.business_name === partyName || p.name === partyName);
      if (party) {
        const finalGst = party.gst_no || prev.gst_no || '';
        const stateName = party.state || party.sales_region || '';
        const stateCode = party.state_code || (finalGst ? finalGst.substring(0, 2) : '');

        setFormData(prev => ({
          ...prev,
          pay_name: partyName,
          invoice_address: party.address || '',
          state_code: stateCode,
          state: stateName,
          gst_no: finalGst,
          agent_name: party.agent_name || prev.agent_name,
          payment: party.payment_terms || prev.payment,
          due_days: party.credit_days || prev.due_days,
          transport: party.transport_name || prev.transport
        }));
        setSelectedPartyData(party);
      } else {
        setFormData(prev => ({ ...prev, pay_name: partyName }));
        setSelectedPartyData(null);
      }
    } catch (err) {
      console.error("Error setting party fields:", err);
      setFormData(prev => ({ ...prev, pay_name: partyName }));
      setSelectedPartyData(null);
    }
  };

  const handleDeliveryChange = async (deliveryPartyName) => {
    if (!deliveryPartyName) {
      setFormData(prev => ({
        ...prev,
        delivery: '',
        delivery_address: '',
        dly_state_code: ''
      }));
      return;
    }

    try {
      const { data: partyList } = await partyAPI.list();
      const party = partyList.find(p => p.company_name === deliveryPartyName || p.business_name === deliveryPartyName || p.name === deliveryPartyName);
      if (party) {
        const finalGst = party.gst_no || prev.gst_no || '';
        const stateName = party.state || party.sales_region || '';
        const stateCode = party.state_code || (finalGst ? finalGst.substring(0, 2) : '');

        setFormData(prev => ({
          ...prev,
          delivery: deliveryPartyName,
          delivery_address: party.delivery_address || party.address || '',
          dly_state_code: stateCode,
          gst_no: finalGst,
          agent_name: party.agent_name || prev.agent_name,
          transport: party.transport_name || prev.transport,
          payment: party.payment_terms || prev.payment
        }));
        setSelectedDeliveryPartyData(party);
      } else {
        setFormData(prev => ({ ...prev, delivery: deliveryPartyName }));
        setSelectedDeliveryPartyData(null);
      }
    } catch (err) {
      console.error("Error setting delivery fields:", err);
      setFormData(prev => ({ ...prev, delivery: deliveryPartyName }));
      setSelectedDeliveryPartyData(null);
    }
  };

  // Recompute summary totals
  useEffect(() => {
    const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    const grossAmt = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    const discPct = Number(formData.discount_pct) || 0;
    const discAmt = Number(((grossAmt * discPct) / 100).toFixed(2));
    const taxableAmt = Number((grossAmt - discAmt).toFixed(2));

    const isSameState = formData.state_code && formData.dly_state_code && formData.state_code.trim() === formData.dly_state_code.trim();
    
    let computedCgst = 0;
    let computedSgst = 0;
    let computedIgst = 0;
    
    if (taxableAmt > 0) {
      if (isSameState) {
        computedCgst = Number((taxableAmt * 0.025).toFixed(2));
        computedSgst = Number((taxableAmt * 0.025).toFixed(2));
      } else {
        computedIgst = Number((taxableAmt * 0.05).toFixed(2));
      }
    }

    const otherChar1 = Number(formData.other_char_value_1) || 0;
    const otherChar2 = Number(formData.other_char_value_2) || 0;
    const otherChar3 = Number(formData.other_char_value_3) || 0;
    const otherChar4 = Number(formData.other_char_value_4) || 0;
    const totalOtherCharges = otherChar1 + otherChar2 + otherChar3 + otherChar4;

    const subTotal = taxableAmt + computedCgst + computedSgst + computedIgst + totalOtherCharges;
    const roundedNet = Math.round(subTotal);
    const roundOffValue = Number((roundedNet - subTotal).toFixed(2));

    setFormData(prev => ({
      ...prev,
      total_qty: totalQty,
      gross_amount: grossAmt,
      discount_amount: discAmt,
      taxable_amount: taxableAmt,
      cgst: computedCgst,
      sgst: computedSgst,
      igst: computedIgst,
      other_charges: totalOtherCharges,
      round_off: roundOffValue,
      net_amount: roundedNet
    }));
  }, [items, formData.discount_pct, formData.state_code, formData.dly_state_code, formData.other_char_value_1, formData.other_char_value_2, formData.other_char_value_3, formData.other_char_value_4]);

  const handleOpenForm = (inv = null, readOnly = false) => {
    if (inv) {
      setEditingId(inv.id);
      
      let remarksParsed = {};
      try {
        if (inv.remarks) {
          remarksParsed = JSON.parse(inv.remarks);
        }
      } catch (e) {
        console.error("Error parsing extra fields from remarks:", e);
      }

      setFormData({
        invoice_type_id: remarksParsed.invoice_type_id || '',
        type: remarksParsed.type || '',
        invoice_no: inv.invoice_no || '',
        invoice_date: inv.invoice_date || '',
        gra_no: remarksParsed.gra_no || '',
        date: remarksParsed.date || '',
        dis_no: remarksParsed.dis_no || '',
        dis_date: remarksParsed.dis_date || '',
        pay_name: inv.party_name || '',
        delivery: remarksParsed.delivery || '',
        invoice_address: inv.billing_address || '',
        delivery_address: inv.delivery_address || '',
        state: inv.state || '',
        state_code: inv.state_code || '',
        gst_no: inv.gst_no || '',
        dly_state_code: remarksParsed.dly_state_code || '',
        po_no: remarksParsed.po_no || '',
        po_date: remarksParsed.po_date || '',
        agent_name: remarksParsed.agent_name || '',
        due_days: remarksParsed.due_days || '',
        due_date: remarksParsed.due_date || '',
        payment: remarksParsed.payment || '',
        pmt_ref_no: remarksParsed.pmt_ref_no || '',
        transport: remarksParsed.transport || '',
        truck_no: remarksParsed.truck_no || '',
        transport_mode: remarksParsed.transport_mode || '',
        freight_mode: remarksParsed.freight_mode || '',
        lr_no: remarksParsed.lr_no || '',
        lr_date: remarksParsed.lr_date || '',
        lr_team: remarksParsed.lr_team || '',
        
        other_char_1: remarksParsed.other_char_1 || '',
        other_char_value_1: remarksParsed.other_char_value_1 || '',
        other_char_2: remarksParsed.other_char_2 || '',
        other_char_value_2: remarksParsed.other_char_value_2 || '',
        other_char_3: remarksParsed.other_char_3 || '',
        other_char_value_3: remarksParsed.other_char_value_3 || '',
        other_char_4: remarksParsed.other_char_4 || '',
        other_char_value_4: remarksParsed.other_char_value_4 || '',
        
        total_qty: Number(inv.total_qty) || 0,
        gross_amount: Number(inv.gross_amount) || 0,
        gross_weight: inv.gross_weight || '',
        discount_pct: Number(inv.discount_pct) || 0,
        discount_amount: Number(inv.discount_amount) || 0,
        taxable_amount: Number(inv.taxable_amount) || 0,
        sgst: Number(inv.sgst) || 0,
        cgst: Number(inv.cgst) || 0,
        igst: Number(inv.igst) || 0,
        other_charges: Number(inv.other_charges) || 0,
        round_off: Number(inv.round_off) || 0,
        net_amount: Number(inv.net_amount) || 0,
        status: inv.status || 'Draft'
      });

      if (inv.items && inv.items.length > 0) {
        setItems(inv.items.map(item => ({
          design_no: item.design_no || '',
          hsn_code: item.hsn_code || '',
          description: item.description || '',
          total_bale: item.total_bale || '',
          uom: item.uom || 'MTR',
          qty: item.qty || '',
          rate: item.rate || '',
          amount: Number(item.amount) || 0
        })));
      } else {
        setItems([{ design_no: '', hsn_code: '', description: '', total_bale: '', uom: 'MTR', qty: '', rate: '', amount: 0 }]);
      }
    } else {
      setFormData(initialForm);
      setEditingId(null);
      setItems([{ design_no: '', hsn_code: '', description: '', total_bale: '', uom: 'MTR', qty: '', rate: '', amount: 0 }]);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, invNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete invoice ${invNo}?`)) {
      try {
        await salesInvoiceAPI.delete(id);
        if (viewModalInvoice?.id === id) setViewModalInvoice(null);
        fetchInvoices();
      } catch (err) {
        console.error(err);
        alert("Error deleting invoice.");
      }
    }
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setActiveTab(nextTab);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"], textarea[name="${nextFieldName}"]`);
        if (nextInput) {
          nextInput.focus();
        } else {
          // Fallback to first focusable element
          const fallback = document.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
          if (fallback) fallback.focus();
        }
      }, 100);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'due_days' || name === 'invoice_date') {
        const invDateStr = name === 'invoice_date' ? value : prev.invoice_date;
        const days = name === 'due_days' ? Number(value) : Number(prev.due_days);
        if (invDateStr && days) {
          const d = new Date(invDateStr);
          d.setDate(d.getDate() + days);
          updated.due_date = d.toISOString().split('T')[0];
        }
      }
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      if (field === 'qty' || field === 'rate') {
        const qty = Number(copy[index].qty) || 0;
        const rate = Number(copy[index].rate) || 0;
        copy[index].amount = Number((qty * rate).toFixed(2));
      }
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { design_no: '', hsn_code: '', description: '', total_bale: '', uom: 'MTR', qty: '', rate: '', amount: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleGenerateEwayBill = async () => {
    if (!editingId) return;
    try {
      const response = await salesInvoiceAPI.generateEwayBillJson(editingId);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `eway_bill_${formData.invoice_no}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      alert("E-Way Bill JSON generated successfully. You can now upload this to the NIC portal.");
    } catch (err) {
      console.error(err);
      alert("Error generating E-Way Bill JSON: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formData.invoice_no) {
      alert("Please enter Invoice No");
      return;
    }

    const extra = {
      invoice_type_id: formData.invoice_type_id,
      type: formData.type,
      gra_no: formData.gra_no,
      date: formData.date,
      dis_no: formData.dis_no,
      dis_date: formData.dis_date,
      delivery: formData.delivery,
      dly_state_code: formData.dly_state_code,
      po_no: formData.po_no,
      po_date: formData.po_date,
      agent_name: formData.agent_name,
      due_days: formData.due_days,
      due_date: formData.due_date,
      payment: formData.payment,
      pmt_ref_no: formData.pmt_ref_no,
      transport: formData.transport,
      transport_id: formData.transport_id,
      truck_no: formData.truck_no,
      vehicle_type: formData.vehicle_type,
      transport_mode: formData.transport_mode,
      freight_mode: formData.freight_mode,
      lr_no: formData.lr_no,
      lr_date: formData.lr_date,
      lr_team: formData.lr_team,
      
      other_char_1: formData.other_char_1,
      other_char_value_1: formData.other_char_value_1,
      other_char_2: formData.other_char_2,
      other_char_value_2: formData.other_char_value_2,
      other_char_3: formData.other_char_3,
      other_char_value_3: formData.other_char_value_3,
      other_char_4: formData.other_char_4,
      other_char_value_4: formData.other_char_value_4
    };

    const payload = {
      invoice_no: formData.invoice_no,
      invoice_date: formData.invoice_date || new Date().toISOString().split('T')[0],
      party_name: formData.pay_name || null,
      billing_address: formData.invoice_address || null,
      delivery_address: formData.delivery_address || null,
      billing_address_alias: formData.billing_address_alias || null,
      shipping_address_alias: formData.shipping_address_alias || null,
      state: formData.state || null,
      state_code: formData.state_code ? formData.state_code.substring(0, 10) : null,
      gst_no: formData.gst_no || null,
      hsn_code: items[0]?.hsn_code || null,
      total_qty: Number(formData.total_qty) || 0,
      gross_weight: Number(formData.gross_weight) || 0,
      gross_amount: Number(formData.gross_amount) || 0,
      discount_pct: Number(formData.discount_pct) || 0,
      discount_amount: Number(formData.discount_amount) || 0,
      taxable_amount: Number(formData.taxable_amount) || 0,
      sgst: Number(formData.sgst) || 0,
      cgst: Number(formData.cgst) || 0,
      igst: Number(formData.igst) || 0,
      other_charges: Number(formData.other_charges) || 0,
      round_off: Number(formData.round_off) || 0,
      net_amount: Number(formData.net_amount) || 0,
      remarks: JSON.stringify(extra),
      status: formData.status || 'Draft',
      
      items: items.map(item => ({
        design_no: item.design_no || null,
        description: item.description || null,
        total_bale: item.total_bale ? Number(item.total_bale) : null,
        uom: item.uom || 'MTR',
        qty: Number(item.qty) || 0,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0
      }))
    };

    try {
      if (editingId) {
        await salesInvoiceAPI.update(editingId, payload);
      } else {
        await salesInvoiceAPI.create(payload);
      }
      setView('list');
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving invoice");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales Invoices Report", 14, 15);
    const tableColumn = ["Invoice No", "Date", "Party Name", "Gross Amount", "Net Amount", "Status"];
    const tableRows = [];

    filteredInvoices.forEach(inv => {
      const rowData = [
        inv.invoice_no || '-',
        inv.invoice_date || '-',
        inv.party_name || '-',
        `INR ${Number(inv.gross_amount).toFixed(2)}`,
        `INR ${Number(inv.net_amount).toFixed(2)}`,
        inv.status || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Sales_Invoices_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredInvoices.map(inv => ({
      "Invoice No": inv.invoice_no,
      "Invoice Date": inv.invoice_date,
      "Party Name": inv.party_name,
      "Gross Amount": inv.gross_amount,
      "Discount Amt": inv.discount_amount,
      "CGST": inv.cgst,
      "SGST": inv.sgst,
      "IGST": inv.igst,
      "Net Amount": inv.net_amount,
      "Status": inv.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Invoices");
    XLSX.writeFile(workbook, `Sales_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportTallyXml = async () => {
    const selectedIds = filteredInvoices.map(inv => inv.id).join(',');
    if (!selectedIds) {
      alert("No invoices available to export.");
      return;
    }
    try {
      const response = await salesInvoiceAPI.exportTallyXml(selectedIds);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/xml' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tally_Sales_Invoices_${new Date().toISOString().split('T')[0]}.xml`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export Tally XML");
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = searchTerm === '' ||
      inv.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.party_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || inv.status === statusFilter;
    
    let matchesDate = true;
    if (inv.invoice_date) {
      const invDate = new Date(inv.invoice_date);
      if (fromDate) matchesDate = matchesDate && invDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && invDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalInvoices = invoices.length;
  const draftInvoices = invoices.filter(i => i.status === 'Draft').length;
  const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
  const totalBillingSum = invoices.reduce((sum, i) => sum + (Number(i.net_amount) || 0), 0);

  const handleCardClick = (statusVal) => {
    if (statusVal === 'Total') {
      setStatusFilter('All Status');
    } else {
      setStatusFilter(statusVal);
    }
  };

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button
              type="button"
              onClick={() => setView('list')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-primary)', padding: 0 }}
              title="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Invoice Details' : editingId ? 'Edit Sales Invoice' : 'Add New Sales Invoice'}</h2>
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="salesInvoiceForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                
                  <div className="animate-fade">
                    {/* Group 1: Basic Invoice Information */}
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Basic Invoice Information</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Invoice Type (ID) *</label>
                        {isCustomInvoiceType ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input autoFocus className="form-control" value={customInvoiceType} onChange={e => setCustomInvoiceType(e.target.value)} placeholder="New Invoice Type" />
                            <button type="button" className="btn btn-success" onClick={() => handleSaveCustomOption('invoice_type_master', customInvoiceType, setCustomInvoiceType, setIsCustomInvoiceType, 'invoice_type_id')} style={{ padding: '8px', minWidth: '40px', background: '#10b981', color: '#fff' }}><Plus size={16} /></button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCustomInvoiceType(false)} style={{ padding: '8px', minWidth: '40px' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <select className="form-control" name="invoice_type_id" value={formData.invoice_type_id} onChange={e => {
                            if (e.target.value === 'ADD_CUSTOM') setIsCustomInvoiceType(true);
                            else handleInputChange(e);
                          }} required>
                            <option value="">-- Select Type --</option>
                            {(options.masters?.invoice_type_master || []).map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="GST Domestic">GST Domestic</option>
                            <option value="Export Invoice">Export Invoice</option>
                            <option value="SEZ Billing">SEZ Billing</option>
                            <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom Type</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Type</label>
                        <input className="form-control" name="type" value={formData.type} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Invoice No *</label>
                        <input className="form-control" name="invoice_no" value={formData.invoice_no} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Invoice Date *</label>
                        <input type="date" className="form-control" name="invoice_date" value={formData.invoice_date} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>GRA No</label>
                        <select className="form-control" name="gra_no" value={formData.gra_no} onChange={e => handleGraSelect(e.target.value)}>
                          <option value="">-- Select GRA --</option>
                          {graList.map(gra => (
                            <option key={gra.id} value={gra.gra_no || gra.id}>{gra.gra_no || `GRA-${gra.id}`}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date</label>
                        <input type="date" className="form-control" name="date" value={formData.date} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>DIS No</label>
                        <input className="form-control" name="dis_no" value={formData.dis_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>DIS Date</label>
                        <input type="date" className="form-control" name="dis_date" value={formData.dis_date} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" name="status" value={formData.status} onChange={handleInputChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'party', 'pay_name')}>
                          <option value="Draft">Draft</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Group 2: Party & Address Information */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Party & Billing Information</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Pay Name (Billing Party) *</label>
                        <select 
                          className="form-control" 
                          name="pay_name" 
                          value={formData.pay_name} 
                          onChange={e => handlePartyChange(e.target.value)}
                          required
                        >
                          <option value="">-- Select Billing Party --</option>
                          {options.all_parties.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery (Shipping Party)</label>
                        <select 
                          className="form-control" 
                          name="delivery" 
                          value={formData.delivery} 
                          onChange={e => handleDeliveryChange(e.target.value)}
                        >
                          <option value="">-- Same as Billing Party --</option>
                          {options.all_parties.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>GST No</label>
                        <input className="form-control" name="gst_no" value={formData.gst_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Billing Address Alias (Tally)</label>
                        <select className="form-control" name="billing_address_alias" value={formData.billing_address_alias} onChange={handleInputChange}>
                          <option value="">-- Default/Primary --</option>
                          {selectedPartyData?.addresses?.map(a => a.alias ? <option key={a.alias} value={a.alias}>{a.alias}</option> : null)}
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Invoice Address (Full)</label>
                        <input className="form-control" name="invoice_address" value={formData.invoice_address} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>State / Code</label>
                        <input className="form-control" name="state_code" value={formData.state_code} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Shipping Address Alias (Tally)</label>
                        <select className="form-control" name="shipping_address_alias" value={formData.shipping_address_alias} onChange={handleInputChange}>
                          <option value="">-- Default/Primary --</option>
                          {(selectedDeliveryPartyData || selectedPartyData)?.addresses?.map(a => a.alias ? <option key={a.alias} value={a.alias}>{a.alias}</option> : null)}
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Delivery Address (Full)</label>
                        <input className="form-control" name="delivery_address" value={formData.delivery_address} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Dly-State / Code</label>
                        <input className="form-control" name="dly_state_code" value={formData.dly_state_code} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>PO / IBPO No</label>
                        <select className="form-control" name="po_no" value={formData.po_no} onChange={(e) => handleIbpoSelect(e.target.value)}>
                          <option value="">-- Select IBPO --</option>
                          {buyerOrders.map(bo => (
                            <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>PO Date</label>
                        <input type="date" className="form-control" name="po_date" value={formData.po_date} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Agent Name</label>
                        <select className="form-control" name="agent_name" value={formData.agent_name} onChange={handleInputChange}>
                          <option value="">-- Select Agent --</option>
                          {options.agents.map(a => (
                            <option key={a.id} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Due Days</label>
                        <input type="number" className="form-control" name="due_days" value={formData.due_days} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Due Date</label>
                        <input type="date" className="form-control" name="due_date" value={formData.due_date} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Payment Mode</label>
                        {isCustomPaymentMode ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input autoFocus className="form-control" value={customPaymentMode} onChange={e => setCustomPaymentMode(e.target.value)} placeholder="New Payment Mode" />
                            <button type="button" className="btn btn-success" onClick={() => handleSaveCustomOption('payment_mode_master', customPaymentMode, setCustomPaymentMode, setIsCustomPaymentMode, 'payment')} style={{ padding: '8px', minWidth: '40px', background: '#10b981', color: '#fff' }}><Plus size={16} /></button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCustomPaymentMode(false)} style={{ padding: '8px', minWidth: '40px' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <select className="form-control" name="payment" value={formData.payment} onChange={e => {
                            if (e.target.value === 'ADD_CUSTOM') setIsCustomPaymentMode(true);
                            else handleInputChange(e);
                          }}>
                            <option value="">---select----</option>
                            {(options.masters?.payment_mode_master || []).map(p => <option key={p} value={p}>{p}</option>)}
                            <option value="Credit">Credit</option>
                            <option value="Advance">Advance</option>
                            <option value="COD">COD</option>
                            <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom Mode</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>PMT Ref No</label>
                        <input className="form-control" name="pmt_ref_no" value={formData.pmt_ref_no} onChange={handleInputChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'logistics', 'transport')} />
                      </div>
                    </div>

                    {/* Group 3: Transport & Freight Information */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Transport & Freight Logistics</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Transport Name</label>
                        {isCustomTransport ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input autoFocus className="form-control" value={customTransport} onChange={e => setCustomTransport(e.target.value)} placeholder="New Transport Name" />
                            <button type="button" className="btn btn-success" onClick={() => handleSaveCustomOption('transport_name_master', customTransport, setCustomTransport, setIsCustomTransport, 'transport')} style={{ padding: '8px', minWidth: '40px', background: '#10b981', color: '#fff' }}><Plus size={16} /></button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCustomTransport(false)} style={{ padding: '8px', minWidth: '40px' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <select className="form-control" name="transport" value={formData.transport} onChange={e => {
                            if (e.target.value === 'ADD_CUSTOM') setIsCustomTransport(true);
                            else handleInputChange(e);
                          }}>
                            <option value="">---select----</option>
                            {options.transporters.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            {(options.masters?.transport_name_master || []).map(t => <option key={`custom-${t}`} value={t}>{t}</option>)}
                            <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom Transport</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Transport ID (GSTIN)</label>
                        <input className="form-control" name="transport_id" value={formData.transport_id} onChange={handleInputChange} placeholder="For E-way bill" />
                      </div>
                      <div className="form-group">
                        <label>Truck No</label>
                        <input className="form-control" name="truck_no" value={formData.truck_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Vehicle Type</label>
                        <select className="form-control" name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange}>
                          <option value="Regular">Regular</option>
                          <option value="ODC">ODC</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Transport Mode</label>
                        {isCustomTransportMode ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input autoFocus className="form-control" value={customTransportMode} onChange={e => setCustomTransportMode(e.target.value)} placeholder="New Transport Mode" />
                            <button type="button" className="btn btn-success" onClick={() => handleSaveCustomOption('transport_mode_master', customTransportMode, setCustomTransportMode, setIsCustomTransportMode, 'transport_mode')} style={{ padding: '8px', minWidth: '40px', background: '#10b981', color: '#fff' }}><Plus size={16} /></button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCustomTransportMode(false)} style={{ padding: '8px', minWidth: '40px' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <select className="form-control" name="transport_mode" value={formData.transport_mode} onChange={e => {
                            if (e.target.value === 'ADD_CUSTOM') setIsCustomTransportMode(true);
                            else handleInputChange(e);
                          }}>
                            <option value="">---select----</option>
                            {(options.masters?.transport_mode_master || []).map(t => <option key={t} value={t}>{t}</option>)}
                            <option value="Road">Road</option><option value="Rail">Rail</option><option value="Air">Air</option><option value="Ship">Ship</option>
                            <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom Mode</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Freight Mode</label>
                        {isCustomFreightMode ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input autoFocus className="form-control" value={customFreightMode} onChange={e => setCustomFreightMode(e.target.value)} placeholder="New Freight Mode" />
                            <button type="button" className="btn btn-success" onClick={() => handleSaveCustomOption('freight_mode_master', customFreightMode, setCustomFreightMode, setIsCustomFreightMode, 'freight_mode')} style={{ padding: '8px', minWidth: '40px', background: '#10b981', color: '#fff' }}><Plus size={16} /></button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCustomFreightMode(false)} style={{ padding: '8px', minWidth: '40px' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <select className="form-control" name="freight_mode" value={formData.freight_mode} onChange={e => {
                            if (e.target.value === 'ADD_CUSTOM') setIsCustomFreightMode(true);
                            else handleInputChange(e);
                          }}>
                            <option value="">---select----</option>
                            {(options.masters?.freight_mode_master || []).map(f => <option key={f} value={f}>{f}</option>)}
                            <option value="To Pay">To Pay</option><option value="Paid">Paid</option>
                            <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom Mode</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>LR No</label>
                        <input className="form-control" name="lr_no" value={formData.lr_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>LR Date</label>
                        <input type="date" className="form-control" name="lr_date" value={formData.lr_date} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>LR Terms</label>
                        {isCustomLrTerms ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input autoFocus className="form-control" value={customLrTerms} onChange={e => setCustomLrTerms(e.target.value)} placeholder="New LR Terms" onKeyDown={(e) => { if (e.key === 'Tab') { e.preventDefault(); handleSaveCustomOption('lr_terms', customLrTerms, setCustomLrTerms, setIsCustomLrTerms, 'lr_team'); } }} />
                            <button type="button" className="btn btn-success" onClick={() => handleSaveCustomOption('lr_terms', customLrTerms, setCustomLrTerms, setIsCustomLrTerms, 'lr_team')} style={{ padding: '8px', minWidth: '40px', background: '#10b981', color: '#fff' }}><Plus size={16} /></button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCustomLrTerms(false)} style={{ padding: '8px', minWidth: '40px' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <select className="form-control" name="lr_team" value={formData.lr_team} onChange={e => {
                            if (e.target.value === 'ADD_CUSTOM') setIsCustomLrTerms(true);
                            else handleInputChange(e);
                          }} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'design_no')}>
                            <option value="">---select----</option>
                            {(options.masters?.lr_terms || []).map(l => <option key={l} value={l}>{l}</option>)}
                            <option value="Primary Logistics">Primary Logistics</option>
                            <option value="Secondary Delivery">Secondary Delivery</option>
                            <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom Terms</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Group 4: Invoice Line Items */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Invoice Line Items</h4>
                    <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                      <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ width: 60, textAlign: 'center' }}>S.No</th>
                            <th>Design No *</th>
                            <th style={{ width: 140 }}>HSN Code</th>
                            <th>Description</th>
                            <th style={{ width: 100 }}>Total Bale</th>
                            <th style={{ width: 100 }}>UOM</th>
                            <th style={{ width: 100 }}>Qty *</th>
                            <th style={{ width: 100 }}>Rate *</th>
                            <th style={{ width: 130, textAlign: 'right' }}>Amount</th>
                            {!isReadOnly && <th style={{ width: 80, textAlign: 'center' }}>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  value={item.design_no} 
                                  onChange={e => handleItemChange(index, 'design_no', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <select 
                                  className="form-control" 
                                  value={item.hsn_code} 
                                  onChange={e => {
                                    if (e.target.value === 'ADD_CUSTOM') {
                                      const newVal = prompt("Enter new HSN Code:");
                                      if (newVal) {
                                        handleSaveCustomOption('hsn_code_master', newVal).then(() => {
                                          handleItemChange(index, 'hsn_code', newVal);
                                        });
                                      }
                                    } else {
                                      handleItemChange(index, 'hsn_code', e.target.value);
                                    }
                                  }}
                                >
                                  <option value="">---select----</option>
                                  {(options.masters?.hsn_code_master || []).map(h => <option key={h} value={h}>{h}</option>)}
                                  <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom HSN</option>
                                </select>
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  className="form-control" 
                                  value={item.description} 
                                  onChange={e => handleItemChange(index, 'description', e.target.value)}
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  value={item.total_bale} 
                                  onChange={e => handleItemChange(index, 'total_bale', e.target.value)}
                                />
                              </td>
                              <td>
                                <select 
                                  className="form-control" 
                                  value={item.uom} 
                                  onChange={e => {
                                    if (e.target.value === 'ADD_CUSTOM') {
                                      const newVal = prompt("Enter new UOM:");
                                      if (newVal) {
                                        handleSaveCustomOption('unit_master', newVal).then(() => {
                                          handleItemChange(index, 'uom', newVal);
                                        });
                                      }
                                    } else {
                                      handleItemChange(index, 'uom', e.target.value);
                                    }
                                  }}
                                >
                                  <option value="">---select----</option>
                                  <option value="MTR">MTR</option>
                                  <option value="YDS">YDS</option>
                                  <option value="KG">KG</option>
                                  {(options.masters?.unit_master || []).map(u => <option key={u} value={u}>{u}</option>)}
                                  <option value="ADD_CUSTOM" style={{ color: '#4f46e5', fontWeight: 'bold' }}>+ Add Custom UOM</option>
                                </select>
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  value={item.qty} 
                                  onChange={e => handleItemChange(index, 'qty', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  value={item.rate} 
                                  onChange={e => handleItemChange(index, 'rate', e.target.value)}
                                  required
                                />
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              {!isReadOnly && (
                                <td style={{ textAlign: 'center' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => removeItemRow(index)} 
                                    className="btn btn-secondary" 
                                    style={{ padding: '6px 10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                    disabled={items.length === 1}
                                  >
                                    Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {!isReadOnly && (
                      <button 
                        type="button" 
                        onClick={addItemRow} 
                        className="btn btn-secondary"
                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}
                      >
                        + Add Line Item
                      </button>
                    )}

                    {/* Group 5: Other Charges & Totals Summary */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Charges & Grand Summary</h4>
                    <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      
                      {/* Left side: Other Charges inputs */}
                      <div>
                        <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Other Charges & Additions</h5>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 8 }}>
                          <select className="form-control" name="other_char_1" value={formData.other_char_1} onChange={handleInputChange}>
                            <option value="">Select Charge...</option>
                            <option value="Freight">Freight</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Packaging">Packaging</option>
                          </select>
                          <input type="number" className="form-control" name="other_char_value_1" value={formData.other_char_value_1} onChange={handleInputChange} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 8 }}>
                          <select className="form-control" name="other_char_2" value={formData.other_char_2} onChange={handleInputChange}>
                            <option value="">Select Charge...</option>
                            <option value="Freight">Freight</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Packaging">Packaging</option>
                          </select>
                          <input type="number" className="form-control" name="other_char_value_2" value={formData.other_char_value_2} onChange={handleInputChange} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 8 }}>
                          <select className="form-control" name="other_char_3" value={formData.other_char_3} onChange={handleInputChange}>
                            <option value="">Select Charge...</option>
                            <option value="Freight">Freight</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Packaging">Packaging</option>
                          </select>
                          <input type="number" className="form-control" name="other_char_value_3" value={formData.other_char_value_3} onChange={handleInputChange} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 8 }}>
                          <select className="form-control" name="other_char_4" value={formData.other_char_4} onChange={handleInputChange}>
                            <option value="">Select Charge...</option>
                            <option value="Freight">Freight</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Packaging">Packaging</option>
                          </select>
                          <input type="number" className="form-control" name="other_char_value_4" value={formData.other_char_value_4} onChange={handleInputChange} />
                        </div>
                      </div>

                      {/* Right side: Summary fields & calculations */}
                      <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Summary Calculations</h5>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Quantity:</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{formData.total_qty}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Gross Weight (Wg):</span>
                          <input 
                            type="number" 
                            name="gross_weight" 
                            value={formData.gross_weight} 
                            onChange={handleInputChange} 
                            className="form-control"
                            style={{ width: 120, textAlign: 'right', margin: 0, height: 32 }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Gross Amount:</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>₹{formData.gross_amount.toFixed(2)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Discount (%):</span>
                          <input 
                            type="number" 
                            name="discount_pct" 
                            value={formData.discount_pct} 
                            onChange={handleInputChange} 
                            className="form-control"
                            style={{ width: 80, textAlign: 'right', margin: 0, height: 32 }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Discount Amount:</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>₹{formData.discount_amount.toFixed(2)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Taxable Amount:</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>₹{formData.taxable_amount.toFixed(2)}</span>
                        </div>

                        {formData.cgst > 0 && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>CGST (2.5%):</span>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>₹{formData.cgst.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>SGST (2.5%):</span>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>₹{formData.sgst.toFixed(2)}</span>
                            </div>
                          </>
                        )}

                        {formData.igst > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>IGST (5%):</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>₹{formData.igst.toFixed(2)}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Round Off:</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>₹{formData.round_off.toFixed(2)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Net Amount:</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>₹{formData.net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Bottom Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X size={16} /> Close
                  </button>
                  {editingId && (
                    <button type="button" className="btn" onClick={handleGenerateEwayBill} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f59e0b', color: 'white' }}>
                      <FileSpreadsheet size={16} /> Generate E-Way Bill JSON
                    </button>
                  )}
                  {!isReadOnly && (
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Save size={16} /> {editingId ? 'Update Invoice' : 'Save Invoice'}
                    </button>
                  )}
                </div>

              </fieldset>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST / SPLIT VIEW ---
  return (
    <div className="animate-fade">
      
      {/* Upper header action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={24} color="var(--primary)" /> Sales Invoice
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Generate invoices with GST calculations and export details.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Export
            </button>

            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden' }}>
                <button
                  onClick={() => { exportPDF(); setShowExportMenu(false); }}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <FileText size={16} color="#ef4444" /> PDF Report
                </button>
                <button
                  onClick={() => { exportExcel(); setShowExportMenu(false); }}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <FileSpreadsheet size={16} color="#10b981" /> Excel Sheet
                </button>
                <button
                  onClick={() => { exportTallyXml(); setShowExportMenu(false); }}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <FileText size={16} color="#8b5cf6" /> Tally XML
                </button>
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add New Invoice
          </button>
        </div>
      </div>

      {/* Stat Cards matching Party Master */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div
          className="card stat-card"
          onClick={() => handleCardClick('Total')}
          style={{ cursor: 'pointer', border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Receipt size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Invoices</h3>
            <div className="value">{totalInvoices}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Draft')}
          style={{ cursor: 'pointer', border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <FileText size={24} />
          </div>
          <div className="stat-details">
            <h3>Draft Invoices</h3>
            <div className="value">{draftInvoices}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Paid')}
          style={{ cursor: 'pointer', border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Paid Invoices</h3>
            <div className="value">{paidInvoices}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ border: 'none', boxShadow: 'none' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Value</h3>
            <div className="value" style={{ fontSize: 16, fontWeight: 700 }}>₹{totalBillingSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      {/* Filter Row matching Party Master */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: 'none', boxShadow: 'none' }}>
        
        {/* Left Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Invoice No or Party Name..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Split Table & Details View layout matching Party Master */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT SIDE: INVOICES TABLE */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th style={{ textAlign: 'right' }}>Gross Amt</th>
                  <th style={{ textAlign: 'right' }}>Net Amt</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading invoices...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No invoices found matching criteria.</td></tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => setViewModalInvoice(inv)}
                      style={{
                        cursor: 'pointer',
                        background: viewModalInvoice?.id === inv.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{inv.invoice_no}</td>
                      <td>{inv.invoice_date}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{inv.party_name || '-'}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(inv.gross_amount).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₹{Number(inv.net_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 700, 
                          background: inv.status === 'Paid' ? '#d1fae5' : inv.status === 'Draft' ? '#fffbeb' : '#fee2e2', 
                          color: inv.status === 'Paid' ? '#065f46' : inv.status === 'Draft' ? '#b45309' : '#991b1b' 
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => { e.stopPropagation(); setViewModalInvoice(inv); }}
                            title="Preview Invoice"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(inv, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(inv.id, inv.invoice_no, e)}
                            title="Delete"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SPLIT VIEW REMOVED - using A4DocumentPreview instead */}
      </div>

      <A4DocumentPreview
        isOpen={!!viewModalInvoice}
        onClose={() => setViewModalInvoice(null)}
        title="SALES INVOICE"
        documentNumber={viewModalInvoice?.invoice_no}
        status={viewModalInvoice?.status}
        onDownloadPdf={() => alert('PDF Download for Sales Invoice triggered')}
        sections={viewModalInvoice ? [
          {
            title: "BILLING & LOGISTICS",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "Party Name", value: viewModalInvoice.party_name },
              { label: "Invoice Date", value: viewModalInvoice.invoice_date },
              { label: "State Code", value: viewModalInvoice.state_code || '-' },
              { label: "Total Quantity", value: viewModalInvoice.total_qty || '0' },
              { label: "Gross Weight", value: `${viewModalInvoice.gross_weight || '0'} Kg` }
            ]
          },
          {
            title: "FINANCIAL SUMMARY",
            icon: "IndianRupee",
            type: "grid",
            data: [
              { label: "Gross Amount", value: `₹ ${Number(viewModalInvoice.gross_amount).toFixed(2)}` },
              { label: "Discount", value: `₹ ${Number(viewModalInvoice.discount_amount).toFixed(2)}` },
              { label: "Taxable Amount", value: `₹ ${Number(viewModalInvoice.taxable_amount).toFixed(2)}` },
              { label: "CGST", value: `₹ ${Number(viewModalInvoice.cgst).toFixed(2)}` },
              { label: "SGST", value: `₹ ${Number(viewModalInvoice.sgst).toFixed(2)}` },
              { label: "Net Amount", value: `₹ ${Number(viewModalInvoice.net_amount).toFixed(2)}` }
            ]
          },
          {
            title: "INVOICE ITEMS",
            icon: "Box",
            type: "table",
            headers: ["S.No", "Design No", "Qty", "Rate", "Amount"],
            rows: (viewModalInvoice.items || []).map((item, idx) => [
              idx + 1,
              item.design_no,
              item.qty,
              `₹ ${item.rate}`,
              `₹ ${Number(item.amount).toFixed(2)}`
            ])
          }
        ] : []}
      />

    </div>
  );
}
