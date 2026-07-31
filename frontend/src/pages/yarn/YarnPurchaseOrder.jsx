import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, Truck, FileText, IndianRupee, Layers, Download, ChevronDown, Printer, ArrowLeft } from 'lucide-react';
import { yarnPurchaseOrderAPI, partyAPI, dropdownAPI, subMasterAPI, buyerOrderAPI, designEntryAPI, companySettingAPI } from '../../services/api';
import defaultLogo from '../../assets/logo.svg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import SubMasterDropdown from '../../components/SubMasterDropdown';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

const calculateRepeatSize = (rows) => {
  let total = 0;
  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    const val = r.times;
    const type = r.type;
    
    if (!val || val === '1' || val === '') {
      total += parseInt(r.threads) || 0;
      i++;
      continue;
    }
    
    let count = 1;
    let groupThreads = parseInt(r.threads) || 0;
    while (
      i + count < rows.length && 
      rows[i + count].type === type &&
      rows[i + count].times === val
    ) {
      groupThreads += parseInt(rows[i + count].threads) || 0;
      count++;
    }
    
    const timesMultiplier = parseInt(val) || 1;
    total += groupThreads * timesMultiplier;
    i += count;
  }
  return total;
};

const parseEqCount = (lbl) => {
  const YARN_COUNTS = {
    "10S CTN": 10.0,
    "20S CTN": 20.0,
    "30S CTN": 30.0,
    "40S CTN": 40.0,
    "60S CTN": 60.0,
    "80S CTN": 80.0,
    "2/20S CTN": 10.0,
    "2/40S CTN": 20.0,
    "2/60S CTN": 30.0,
    "2/80S CTN": 40.0,
  };
  if (YARN_COUNTS[lbl] !== undefined) return YARN_COUNTS[lbl];
  if (!lbl) return 20.0;
  let cleaned = lbl.toUpperCase().replace(/\s+/g, '');
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    const ply = parseFloat(parts[0]) || 1.0;
    const countPart = parts[1].match(/\d+/);
    const count = countPart ? parseFloat(countPart[0]) : 40.0;
    return count / ply;
  } else {
    const match = cleaned.match(/\d+/);
    return match ? parseFloat(match[0]) : 20.0;
  }
};

const calculateDesignYarnRequirements = (design) => {
  if (!design) return [];

  let warpSummary = [];
  try {
    warpSummary = design.warp_summary ? JSON.parse(design.warp_summary) : [];
  } catch (e) {}

  let weftSummary = [];
  try {
    weftSummary = design.weft_summary ? JSON.parse(design.weft_summary) : [];
  } catch (e) {}

  const finalAgg = {};
  const add = (count, color, req_kg) => {
    const key = `${count}_${color}`;
    if (finalAgg[key]) {
      finalAgg[key].order_qty += req_kg;
    } else {
      finalAgg[key] = {
        design_no: design.ds_ref_no || design.design_no || '',
        yarn_count: count,
        colour: color,
        order_qty: req_kg,
        uom: 'KGS',
        delivery_date: design.ds_date ? design.ds_date.substring(0, 10) : '',
        rate: 0,
        amount: 0,
        packing_type: '',
        labeling: ''
      };
    }
  };

  if (warpSummary.length > 0 || weftSummary.length > 0) {
    warpSummary.forEach(r => add(r.count, r.color, r.req_kg));
    weftSummary.forEach(r => add(r.count, r.color, r.req_kg));
    return Object.values(finalAgg);
  }

  let yarnRows = [];
  try {
    yarnRows = design.yarn_details ? JSON.parse(design.yarn_details) : [];
  } catch (e) {
    console.error("Error parsing yarn_details", e);
  }

  let fabricDesignRows = [];
  try {
    fabricDesignRows = design.fabric_design_details ? JSON.parse(design.fabric_design_details) : [];
  } catch (e) {
    console.error("Error parsing fabric_design_details", e);
  }

  const warpRows = fabricDesignRows.filter(r => r.type && !r.type.toLowerCase().includes('weft'));
  const weftRows = fabricDesignRows.filter(r => r.type && r.type.toLowerCase().includes('weft'));

  const warpRepeatSize = calculateRepeatSize(warpRows);
  const weftRepeatSize = calculateRepeatSize(weftRows);

  const totalEnds = parseFloat(design.total_ends) || 0;
  const selvage = parseFloat(design.selvage_waste) || 0;
  const reed = parseFloat(design.reed) || 0;
  const reedOl = Math.max(0, reed - 8);
  const pickOl = Math.max(0, (parseFloat(design.pick_ot) || 0) - 4);
  const noD = warpRepeatSize > 0 ? Math.floor(totalEnds / warpRepeatSize) : 0;
  const repeatEnds = warpRepeatSize * noD;
  const balance = totalEnds - repeatEnds - selvage;

  // Extra ends distribution
  const extraEnds = warpRows.map(() => 0);
  let remaining = balance;
  let idx = 0;
  while (remaining > 0 && warpRows.length > 0) {
    const item = warpRows[idx % warpRows.length];
    const take = Math.min(remaining, parseInt(item.threads) || 1);
    extraEnds[idx % warpRows.length] += take;
    remaining -= take;
    idx++;
  }

  const totalMtr = parseFloat(design.total_mtr) || 0;
  const crimpPct = parseFloat(design.crimp_pct) || 0;
  const skgPct = parseFloat(design.skg_pct) || 0;
  const dyeingPct = parseFloat(design.dyeing_loss_pct) || 0;
  const warpLength = Math.round(parseFloat(design.warp_mtr) || (totalMtr * (1 + crimpPct/100) * (1 + skgPct/100)));
  const weftProMtrVal = Math.round(parseFloat(design.weft_pro_mtr) || (totalMtr * (1 + skgPct/100)));

  // Aggregate Warp
  const warpColorAgg = {};
  warpRows.forEach((item, index) => {
    const cname = item.color || 'White';
    const yc = item.yarn_count || '40S CTN';
    const key = `${yc}_${cname}`;
    const itemEnds = parseInt(item.threads) || 0;
    const itemExtra = extraEnds[index] || 0;
    const itemTotalEnds = (itemEnds * noD) + itemExtra;

    if (warpColorAgg[key]) {
      warpColorAgg[key].ends += itemEnds;
      warpColorAgg[key].extra += itemExtra;
      warpColorAgg[key].total_ends += itemTotalEnds;
    } else {
      warpColorAgg[key] = {
        beam_type: item.type || 'Warp',
        count: yc,
        color: cname,
        ends: itemEnds,
        noD: noD,
        extra: itemExtra,
        total_ends: itemTotalEnds
      };
    }
  });

  const warpSummaryCalculated = Object.values(warpColorAgg).map(row => {
    const eqCount = parseEqCount(row.count);
    const req_kg_raw = eqCount > 0 ? (row.total_ends * 1.094 * warpLength) / (1848 * eqCount) : 0;
    const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);
    const req_kg = Math.ceil(req_kg_raw / lossFactor);
    return { ...row, req_kg };
  });

  // Weft Design
  const weftColorAgg = {};
  weftRows.forEach(item => {
    const cname = item.color || 'White';
    const yc = item.yarn_count || '40S CTN';
    const key = `${yc}_${cname}`;
    const itemEnds = parseInt(item.threads) || 0;

    if (weftColorAgg[key]) {
      weftColorAgg[key].ends += itemEnds;
    } else {
      weftColorAgg[key] = {
        beam_type: 'Weft',
        count: yc,
        color: cname,
        ends: itemEnds,
        noD: 1,
        extra: 0,
        total_ends: 0
      };
    }
  });

  const totalWeftThreads = weftRows.reduce((sum, r) => sum + (parseInt(r.threads) || 0), 0);
  const reedSpaceVal = reedOl > 0 ? (totalEnds / reedOl) : 0;
  const totalWeftEndsCalculated = Math.round(pickOl * (reedSpaceVal + selvage));

  const weftSummaryCalculated = Object.values(weftColorAgg).map(row => {
    const ratio = totalWeftThreads > 0 ? row.ends / totalWeftThreads : 0;
    const groupEnds = Math.round(totalWeftEndsCalculated * ratio);
    const eqCount = parseEqCount(row.count);
    
    const req_kg_raw = eqCount > 0 ? (groupEnds * weftProMtrVal) / (1690 * eqCount) : 0;
    const lossFactor = dyeingPct >= 100 ? 1.0 : (1 - dyeingPct / 100);
    const req_kg = req_kg_raw > 0 ? Math.max(1, Math.round(req_kg_raw / lossFactor)) : 0;

    return {
      ...row,
      total_ends: groupEnds,
      req_kg
    };
  });

  warpSummaryCalculated.forEach(r => add(r.count, r.color, r.req_kg));
  weftSummaryCalculated.forEach(r => add(r.count, r.color, r.req_kg));

  const itemsList = Object.values(finalAgg);
  if (itemsList.length === 0) {
    yarnRows.forEach(yr => {
      const key = `${yr.yarn_count}_${yr.color || ''}`;
      if (!finalAgg[key]) {
        finalAgg[key] = {
          design_no: design.design_no || '',
          yarn_count: yr.yarn_count || '',
          colour: yr.color || '',
          order_qty: 0,
          uom: 'KGS',
          delivery_date: design.ds_date ? design.ds_date.substring(0, 10) : '',
          rate: 0,
          amount: 0,
          packing_type: '',
          labeling: ''
        };
      }
    });
  }

  return Object.values(finalAgg);
};

export default function YarnPurchaseOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [companyProfile, setCompanyProfile] = useState({
    company_name: 'Dinesh Exports Private Limited',
    description: '1/6-A, AIYNDHUPANAL KADACHANALLUR POST, OPP. TO SPK SCHOOL, KOMARAPALAYAM TALUK, Namakkal, Tamil Nadu, 638183',
    logo: ''
  });

  const formatDateString = (dateStr, separator = '-') => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}${separator}${month}${separator}${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const toIndianRupeesWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const g = (n) => {
      if (n < 20) return a[n];
      let d = n % 10;
      return b[Math.floor(n / 10)] + (d ? ' ' + a[d] : '');
    };

    const getWords = (n) => {
      let str = '';
      if (n >= 10000000) {
        str += getWords(Math.floor(n / 10000000)) + 'Crores ';
        n %= 10000000;
      }
      if (n >= 100000) {
        str += getWords(Math.floor(n / 100000)) + 'Lakhs ';
        n %= 100000;
      }
      if (n >= 1000) {
        str += getWords(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
      }
      if (n >= 100) {
        str += getWords(Math.floor(n / 100)) + 'Hundred ';
        n %= 100;
      }
      if (n > 0) {
        if (str !== '') str += 'and ';
        str += g(n);
      }
      return str;
    };

    let cleanNum = Math.floor(num);
    if (cleanNum === 0) return 'Zero only';
    let words = getWords(cleanNum);
    
    let paise = Math.round((num - cleanNum) * 100);
    let paiseStr = '';
    if (paise > 0) {
      paiseStr = ' and ' + g(paise) + 'Paise';
    }

    return (words + paiseStr + ' only').replace(/\s+/g, ' ').replace('and only', 'only').trim();
  };

  const [isCustomOrg, setIsCustomOrg] = useState(false);
  const [customOrgVal, setCustomOrgVal] = useState('');
  const [isCustomAgainstRef, setIsCustomAgainstRef] = useState(false);
  const [customAgainstRefVal, setCustomAgainstRefVal] = useState('');
  const [isCustomPackingType, setIsCustomPackingType] = useState(false);
  const [customPackingTypeVal, setCustomPackingTypeVal] = useState('');
  const [isCustomTransport, setIsCustomTransport] = useState(false);
  const [customTransportVal, setCustomTransportVal] = useState('');
  const [isCustomColour, setIsCustomColour] = useState(false);
  const [customColourVal, setCustomColourVal] = useState('');
  const [isCustomFreightType, setIsCustomFreightType] = useState(false);
  const [customFreightTypeVal, setCustomFreightTypeVal] = useState('');
  const [customMillNameIdx, setCustomMillNameIdx] = useState(null);
  const [customMillNameVal, setCustomMillNameVal] = useState('');
  const [customFabricNameIdx, setCustomFabricNameIdx] = useState(null);
  const [customFabricNameVal, setCustomFabricNameVal] = useState('');
  const [customYarnCountIdx, setCustomYarnCountIdx] = useState(null);
  const [customYarnCountVal, setCustomYarnCountVal] = useState('');
  const [customTableColourIdx, setCustomTableColourIdx] = useState(null);
  const [customTableColourVal, setCustomTableColourVal] = useState('');
  const [customTablePackingTypeIdx, setCustomTablePackingTypeIdx] = useState(null);
  const [customTablePackingTypeVal, setCustomTablePackingTypeVal] = useState('');

  // Custom Inline Fields for Supplier
  const [isCustomMainSupplier, setIsCustomMainSupplier] = useState(false);
  const [customMainSupplierVal, setCustomMainSupplierVal] = useState('');
  const [customCountSupplierIdx, setCustomCountSupplierIdx] = useState(null);
  const [customCountSupplierVal, setCustomCountSupplierVal] = useState('');

  const handleSaveCustomMainSupplier = async () => {
    if (!customMainSupplierVal.trim()) return;
    try {
      const { data } = await partyAPI.create({ company_name: customMainSupplierVal.trim(), party_type: 'Purchase Party' });
      setParties(prev => [...prev, data]);
      setForm(prev => ({ ...prev, supplier_name: data.company_name }));
      setIsCustomMainSupplier(false);
      setCustomMainSupplierVal('');
    } catch (err) {
      console.error("Failed to add custom Supplier", err);
      alert("Failed to add new Supplier. Please try again.");
    }
  };

  const handleSaveCustomCountSupplier = async (idx) => {
    if (!customCountSupplierVal.trim()) return;
    try {
      const { data } = await partyAPI.create({ company_name: customCountSupplierVal.trim(), party_type: 'Purchase Party' });
      setParties(prev => [...prev, data]);
      updateCountDetail(idx, 'supplier_name', data.company_name);
      setCustomCountSupplierIdx(null);
      setCustomCountSupplierVal('');
    } catch (err) {
      console.error("Failed to add custom Supplier", err);
      alert("Failed to add new Supplier. Please try again.");
    }
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');
  const [newTermVal, setNewTermVal] = useState('');

  const defaultTerms = [
    'Material not meeting our specification and standards will be returned',
    'Demanded Qty to be supplied in whole and excess/short supply will not be accepted.',
    'Send Invoice along with Material.',
    'Defective and damage pieces will not be accepted.',
    'Start bulk production only after getting the sample Approval.',
    'Subject to Namakkal Jurisdiction.'
  ];

  const initialForm = {
    po_date: new Date().toISOString().split('T')[0],
    org_name: '', internal_po_no: '', used_for: '', against_ref: 'Direct', ibpo_no: '', design_no: '', agent_name: '',
    supplier_name: '', delivery_at: '',
    
    freight_type: '', freight_chg: 0, insurance_chg: 0, total_order_kgs: 0,
    transport: '', tax_type: 'GST', taxable_amount: 0, dispatch_date: '',
    packing_type: '', sgst_pct: 2.50, cgst_pct: 2.50, igst_pct: 5.0, labeling: '',
    colour: '', net_amount: 0, due_days: 0, remarks: '', status: 'Active',
    terms_conditions: [...defaultTerms],
    
    count_details: [],
    indent_details: [{
      yarn_count: '', colour: '', order_qty: 0, uom: 'KGS', delivery_date: '', rate: 0, amount: 0, packing_type: '', labeling: '', design_no: ''
    }]
  };

  const [form, setForm] = useState(initialForm);

  const recalculate = (updatedForm) => {
    const updatedIndentDetails = (updatedForm.indent_details || []).map(item => {
      const orderQty = parseFloat(item.order_qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = orderQty * rate;
      return {
        ...item,
        amount: parseFloat(amount.toFixed(2))
      };
    });

    const taxableAmount = updatedIndentDetails.reduce((sum, item) => sum + (item.amount || 0), 0);

    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;
    const taxType = updatedForm.tax_type || 'GST';
    const freightChg = parseFloat(updatedForm.freight_chg) || 0;
    const insuranceChg = parseFloat(updatedForm.insurance_chg) || 0;

    let taxAmount = 0;
    if (taxType === 'GST') {
      taxAmount = ((cgstPct + sgstPct) / 100) * taxableAmount;
    } else if (taxType === 'IGST') {
      taxAmount = (igstPct / 100) * taxableAmount;
    }

    const netAmount = taxableAmount + freightChg + insuranceChg + taxAmount;

    return {
      ...updatedForm,
      indent_details: updatedIndentDetails,
      taxable_amount: parseFloat(taxableAmount.toFixed(2)),
      net_amount: parseFloat(netAmount.toFixed(2))
    };
  };

  const getAvailableDesignEntries = () => {
    const selectedIbpo = form.ibpo_no || (form.against_ref !== 'PO' && form.against_ref !== 'Direct' ? form.against_ref : '');
    if (selectedIbpo) {
      const filtered = designEntries.filter(de => de.ibpo_no === selectedIbpo);
      if (filtered.length > 0) return filtered;
    }
    return designEntries;
  };

  const loadData = async () => {
    try {
      const [ordRes, partRes, dropRes, buyerOrdRes, designRes, compRes] = await Promise.all([
        yarnPurchaseOrderAPI.list(), 
        partyAPI.list(), 
        dropdownAPI.getAll(),
        buyerOrderAPI.list(),
        designEntryAPI.list(),
        companySettingAPI.get().catch(() => null)
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setBuyerOrders(buyerOrdRes.data || []);
      setDesignEntries(designRes.data || []);
      if (compRes && compRes.data) {
        setCompanyProfile({
          company_name: compRes.data.company_name || 'Dinesh Exports Private Limited',
          description: compRes.data.description || '1/6-A, AIYNDHUPANAL KADACHANALLUR POST, OPP. TO SPK SCHOOL, KOMARAPALAYAM TALUK, Namakkal, Tamil Nadu, 638183',
          logo: compRes.data.logo || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (queryId && orders.length > 0) {
      const matched = orders.find(o => String(o.id) === String(queryId));
      if (matched) {
        handleOpenForm(matched, true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [queryId, orders]);

  const refreshDropdownOptions = async () => {
    try {
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
    } catch (err) {
      console.error('Error refreshing options:', err);
    }
  };

  const handleDropdownChange = (name, value) => {
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCustomOrg = async () => {
    if (!customOrgVal.trim()) return;
    try {
      await subMasterAPI.create('organization_name_master', { entity: 'organization_name_master', name: customOrgVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, org_name: customOrgVal.trim() });
      setIsCustomOrg(false);
      setCustomOrgVal('');
    } catch (err) {
      alert('Error saving custom organization name');
    }
  };

  const handleSaveCustomAgainstRef = async () => {
    if (!customAgainstRefVal.trim()) return;
    try {
      await subMasterAPI.create('against_reference_master', { entity: 'against_reference_master', name: customAgainstRefVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, against_ref: customAgainstRefVal.trim() });
      setIsCustomAgainstRef(false);
      setCustomAgainstRefVal('');
    } catch (err) {
      alert('Error saving custom against reference');
    }
  };

  const handleSaveCustomPackingType = async () => {
    if (!customPackingTypeVal.trim()) return;
    try {
      await subMasterAPI.create('packing_type_master', { entity: 'packing_type_master', name: customPackingTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, packing_type: customPackingTypeVal.trim() });
      setIsCustomPackingType(false);
      setCustomPackingTypeVal('');
    } catch (err) {
      alert('Error saving custom packing type');
    }
  };

  const handleSaveCustomTransport = async () => {
    if (!customTransportVal.trim()) return;
    try {
      await subMasterAPI.create('transport_name_master', { entity: 'transport_name_master', name: customTransportVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, transport: customTransportVal.trim() });
      setIsCustomTransport(false);
      setCustomTransportVal('');
    } catch (err) {
      alert('Error saving custom transport');
    }
  };

  const handleSaveCustomColour = async () => {
    if (!customColourVal.trim()) return;
    try {
      await subMasterAPI.create('color_master', { entity: 'color_master', name: customColourVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, colour: customColourVal.trim() });
      setIsCustomColour(false);
      setCustomColourVal('');
    } catch (err) {
      alert('Error saving custom colour');
    }
  };

  const handleSaveCustomFreightType = async () => {
    if (!customFreightTypeVal.trim()) return;
    try {
      await subMasterAPI.create('freight_type_master', { entity: 'freight_type_master', name: customFreightTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, freight_type: customFreightTypeVal.trim() });
      setIsCustomFreightType(false);
      setCustomFreightTypeVal('');
    } catch (err) {
      alert('Error saving custom freight type');
    }
  };

  const handleSaveCustomMillName = async () => {
    if (!customMillNameVal.trim() || customMillNameIdx === null) return;
    try {
      await subMasterAPI.create('mill_name_master', { entity: 'mill_name_master', name: customMillNameVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateCountDetail(customMillNameIdx, 'mill_name', customMillNameVal.trim());
      setCustomMillNameIdx(null);
      setCustomMillNameVal('');
    } catch (err) {
      alert('Error saving custom mill name');
    }
  };

  const handleSaveCustomFabricName = async () => {
    if (!customFabricNameVal.trim() || customFabricNameIdx === null) return;
    try {
      await subMasterAPI.create('fabric_type_master', { entity: 'fabric_type_master', name: customFabricNameVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateIndentDetail(customFabricNameIdx, 'fabric_name', customFabricNameVal.trim());
      setCustomFabricNameIdx(null);
      setCustomFabricNameVal('');
    } catch (err) {
      alert('Error saving custom fabric name');
    }
  };

  const handleSaveCustomYarnCount = async () => {
    if (!customYarnCountVal.trim() || customYarnCountIdx === null) return;
    try {
      await subMasterAPI.create('yarn_count_master', { entity: 'yarn_count_master', name: customYarnCountVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateIndentDetail(customYarnCountIdx, 'yarn_count', customYarnCountVal.trim());
      setCustomYarnCountIdx(null);
      setCustomYarnCountVal('');
    } catch (err) {
      alert('Error saving custom yarn count');
    }
  };

  const handleSaveCustomTableColour = async () => {
    if (!customTableColourVal.trim() || customTableColourIdx === null) return;
    try {
      await subMasterAPI.create('color_master', { entity: 'color_master', name: customTableColourVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateIndentDetail(customTableColourIdx, 'colour', customTableColourVal.trim());
      setCustomTableColourIdx(null);
      setCustomTableColourVal('');
    } catch (err) {
      alert('Error saving custom color');
    }
  };

  const handleSaveCustomTablePackingType = async () => {
    if (!customTablePackingTypeVal.trim() || customTablePackingTypeIdx === null) return;
    try {
      await subMasterAPI.create('packing_type_master', { entity: 'packing_type_master', name: customTablePackingTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateIndentDetail(customTablePackingTypeIdx, 'packing_type', customTablePackingTypeVal.trim());
      setCustomTablePackingTypeIdx(null);
      setCustomTablePackingTypeVal('');
    } catch (err) {
      alert('Error saving custom packing type');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.dispatch_date) payload.dispatch_date = null;
      if (payload.indent_details) {
        payload.indent_details = payload.indent_details.map(item => ({
          ...item,
          delivery_date: item.delivery_date ? item.delivery_date : null
        }));
      }

      if (editingId) {
        await yarnPurchaseOrderAPI.update(editingId, payload);
      } else {
        await yarnPurchaseOrderAPI.create(payload);
      }
      
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
      setIsCustomMainSupplier(false);
      setCustomMainSupplierVal('');
      setCustomCountSupplierIdx(null);
      setCustomCountSupplierVal('');
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message));
      console.error(err);
    }
  };

  const handleOpenForm = async (order, readOnly = false) => {
    try {
      const { data } = await yarnPurchaseOrderAPI.get(order.id);
      if (data.po_date) data.po_date = data.po_date.substring(0, 10);
      if (data.dispatch_date) data.dispatch_date = data.dispatch_date.substring(0, 10);
      
      setForm({
        ...initialForm,
        ...data,
        terms_conditions: (data.terms_conditions && data.terms_conditions.length > 0)
          ? data.terms_conditions
          : [...defaultTerms]
      });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setShowForm(true);
      setSelectedViewOrder(null);
      setIsCustomMainSupplier(false);
      setCustomMainSupplierVal('');
      setCustomCountSupplierIdx(null);
      setCustomCountSupplierVal('');
    } catch (err) {
      alert("Error loading order details.");
    }
  };

  const toggleSelectAll = (filteredData = []) => {
    if (selectedIds.length === filteredData.length && filteredData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(o => o.id));
    }
  };

  const toggleSelectRow = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id, po, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${po}?`)) {
      try {
        await yarnPurchaseOrderAPI.delete(id);
        if (selectedViewOrder?.id === id) setSelectedViewOrder(null);
        setSelectedIds(prev => prev.filter(item => item !== id));
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected yarn purchase order(s)?`)) {
      try {
        await Promise.all(selectedIds.map(id => yarnPurchaseOrderAPI.delete(id)));
        if (selectedViewOrder && selectedIds.includes(selectedViewOrder.id)) {
          setSelectedViewOrder(null);
        }
        setSelectedIds([]);
        loadData();
      } catch (err) {
        alert('Error deleting selected yarn purchase orders');
        console.error(err);
        loadData();
      }
    }
  };

  const handleRowClick = async (order) => {
    await handleOpenForm(order, true);
  };



  const handleChange = (e) => {

    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    
    if (name === 'design_no') {
      if (value) {
        const selectedDesign = designEntries.find(de => de.ds_ref_no === value || de.design_no === value);
        if (selectedDesign) {
          const reqs = calculateDesignYarnRequirements(selectedDesign);
          let newIndentDetails = reqs.length > 0 ? reqs : [{
            yarn_count: '', colour: '', order_qty: 0, uom: 'KGS', delivery_date: '', rate: 0, amount: 0, packing_type: '', labeling: '', design_no: ''
          }];
          let agentName = form.agent_name || '';
          let supplierName = form.supplier_name || '';
          let deliveryAt = form.delivery_at || '';
          let ibpoNo = form.ibpo_no || selectedDesign.ibpo_no || '';
          if (selectedDesign.ibpo_no) {
            const selectedOrder = buyerOrders.find(bo => bo.ibpo_number === selectedDesign.ibpo_no);
            if (selectedOrder) {
              agentName = selectedOrder.agent_name || agentName;
              supplierName = selectedOrder.party_name || supplierName;
              deliveryAt = selectedOrder.delivery_at || deliveryAt;
            }
          }
          const selectedParty = parties.find(p => p.company_name === supplierName);
          let taxUpdates = {};
          if (selectedParty) {
            const stateLower = (selectedParty.state || '').toLowerCase().trim();
            const gstCode = (selectedParty.gst_no || '').trim().substring(0, 2);
            const isTN = stateLower.includes('tamil') || gstCode === '33';
            if (!isTN && (stateLower !== '' || gstCode !== '')) {
              taxUpdates = { tax_type: 'IGST', sgst_pct: 0, cgst_pct: 0, igst_pct: 5.0 };
            } else {
              taxUpdates = { tax_type: 'GST', sgst_pct: 2.5, cgst_pct: 2.5, igst_pct: 0 };
            }
          }
          setForm(recalculate({
            ...form,
            against_ref: 'PO',
            ibpo_no: ibpoNo,
            design_no: selectedDesign.ds_ref_no || selectedDesign.design_no || value,
            agent_name: agentName,
            supplier_name: supplierName,
            delivery_at: deliveryAt,
            indent_details: newIndentDetails,
            ...taxUpdates
          }));
          return;
        } else {
          setForm(prev => ({ ...prev, design_no: value }));
          return;
        }
      } else {
        setForm(prev => ({ ...prev, design_no: '' }));
        return;
      }
    }

    if (name === 'against_ref') {
      if (value === 'Direct') {
        setForm(prev => ({
          ...prev,
          against_ref: 'Direct',
          ibpo_no: '',
          design_no: ''
        }));
        return;
      }
      if (value === 'PO') {
        setForm(prev => ({
          ...prev,
          against_ref: 'PO'
        }));
        return;
      }
      setForm(prev => ({ ...prev, against_ref: value }));
      return;
    }

    if (name === 'ibpo_no') {
      const selectedIbpo = value;
      if (!selectedIbpo) {
        setForm(prev => ({ ...prev, ibpo_no: '' }));
        return;
      }
      const selectedOrder = buyerOrders.find(bo => bo.ibpo_number === selectedIbpo);
      const matchingDesigns = designEntries.filter(de => de.ibpo_no === selectedIbpo);
      
      let newIndentDetails = [];
      if (matchingDesigns.length > 0) {
        matchingDesigns.forEach(de => {
          const reqs = calculateDesignYarnRequirements(de);
          newIndentDetails.push(...reqs);
        });
      }
      
      if (newIndentDetails.length === 0 && selectedOrder) {
        newIndentDetails = (selectedOrder.items || []).map(item => ({
          yarn_count: item.yarn_count || '',
          colour: item.color || '',
          order_qty: parseFloat(item.order_mtrs) || 0,
          delivery_date: item.po_date ? item.po_date.substring(0, 10) : '',
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0,
          packing_type: item.packing_type || '',
          labeling: '',
          design_no: item.design_no || ''
        }));
      }

      if (newIndentDetails.length === 0) {
        newIndentDetails = form.indent_details;
      }

      const supplierName = selectedOrder?.party_name || form.supplier_name || '';
      const selectedParty = parties.find(p => p.company_name === supplierName);
      let taxUpdates = {};
      if (selectedParty) {
        const stateLower = (selectedParty.state || '').toLowerCase().trim();
        const gstCode = (selectedParty.gst_no || '').trim().substring(0, 2);
        const isTN = stateLower.includes('tamil') || gstCode === '33';
        if (!isTN && (stateLower !== '' || gstCode !== '')) {
          taxUpdates = { tax_type: 'IGST', sgst_pct: 0, cgst_pct: 0, igst_pct: 5.0 };
        } else {
          taxUpdates = { tax_type: 'GST', sgst_pct: 2.5, cgst_pct: 2.5, igst_pct: 0 };
        }
      }

      setForm(recalculate({
        ...form,
        against_ref: 'PO',
        ibpo_no: selectedIbpo,
        design_no: matchingDesigns.length === 1 ? (matchingDesigns[0].ds_ref_no || matchingDesigns[0].design_no) : form.design_no,
        agent_name: selectedOrder?.agent_name || form.agent_name || '',
        supplier_name: supplierName,
        delivery_at: selectedOrder?.delivery_at || form.delivery_at || '',
        indent_details: newIndentDetails,
        ...taxUpdates
      }));
      return;
    }

    if (name === 'supplier_name') {
      if (value === 'custom_add_new') {
        setIsCustomMainSupplier(true);
        setCustomMainSupplierVal('');
        return;
      }
      const selectedParty = parties.find(p => p.company_name === value);
      let taxUpdates = {};
      if (selectedParty) {
        const stateLower = (selectedParty.state || '').toLowerCase().trim();
        const gstCode = (selectedParty.gst_no || '').trim().substring(0, 2);
        const isTN = stateLower.includes('tamil') || gstCode === '33';
        if (!isTN && (stateLower !== '' || gstCode !== '')) {
          taxUpdates = { tax_type: 'IGST', sgst_pct: 0, cgst_pct: 0, igst_pct: 5.0 };
        } else {
          taxUpdates = { tax_type: 'GST', sgst_pct: 2.5, cgst_pct: 2.5, igst_pct: 0 };
        }
      }
      setForm(recalculate({ ...form, supplier_name: value, ...taxUpdates }));
      return;
    }

    if (name === 'org_name' && value === 'custom') {
      setIsCustomOrg(true);
      setCustomOrgVal('');
      return;
    }
    if (name === 'against_ref' && value === 'custom') {
      setIsCustomAgainstRef(true);
      setCustomAgainstRefVal('');
      return;
    }
    if (name === 'freight_type' && value === 'custom') {
      setIsCustomFreightType(true);
      setCustomFreightTypeVal('');
      return;
    }
    if (name === 'transport' && value === 'custom') {
      setIsCustomTransport(true);
      setCustomTransportVal('');
      return;
    }
    if (name === 'packing_type' && value === 'custom') {
      setIsCustomPackingType(true);
      setCustomPackingTypeVal('');
      return;
    }
    if (name === 'colour' && value === 'custom') {
      setIsCustomColour(true);
      setCustomColourVal('');
      return;
    }

    if (name === 'tax_type') {
      let taxUpdates = { tax_type: value };
      if (value === 'GST') {
        taxUpdates = { ...taxUpdates, sgst_pct: 2.5, cgst_pct: 2.5, igst_pct: 0 };
      } else if (value === 'IGST') {
        taxUpdates = { ...taxUpdates, sgst_pct: 0, cgst_pct: 0, igst_pct: 5.0 };
      } else if (value === 'Exempt') {
        taxUpdates = { ...taxUpdates, sgst_pct: 0, cgst_pct: 0, igst_pct: 0 };
      }
      setForm(recalculate({ ...form, ...taxUpdates }));
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  // Dynamic Item Handlers
  const addCountDetail = () => setForm({ ...form, count_details: [...form.count_details, initialForm.count_details[0]] });
  const removeCountDetail = (index) => setForm({ ...form, count_details: form.count_details.filter((_, i) => i !== index) });
  const updateCountDetail = (index, field, value) => {
    const newItems = [...form.count_details];
    let val = value;
    if (['yarn_csp', 'min_cone_wgt', 'order_kgs', 'tolerance_pct'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    setForm({ ...form, count_details: newItems });
  };

  const addIndentDetail = () => {
    const newRow = {
      yarn_count: '', colour: '', order_qty: 0, uom: 'KGS', delivery_date: '', rate: 0, amount: 0, packing_type: '', labeling: '', design_no: ''
    };
    setForm(recalculate({ ...form, indent_details: [...form.indent_details, newRow] }));
  };
  const removeIndentDetail = (index) => {
    const nextForm = { ...form, indent_details: form.indent_details.filter((_, i) => i !== index) };
    setForm(recalculate(nextForm));
  };
  const updateIndentDetail = (index, field, value) => {
    const newItems = [...form.indent_details];
    let val = value;
    if (['order_qty', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    
    if (field === 'order_qty' || field === 'rate') {
      newItems[index].amount = parseFloat(((newItems[index].order_qty || 0) * (newItems[index].rate || 0)).toFixed(2));
    }
    
    const nextForm = { ...form, indent_details: newItems };
    setForm(recalculate(nextForm));
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchTerm === '' ||
      o.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All Status' || o.status === statusFilter;
    
    let matchesDate = true;
    if (o.po_date) {
      const entryDate = new Date(o.po_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPOs = orders.length;
  const activePOs = orders.filter(o => o.status === 'Active').length;
  const closedPOs = orders.filter(o => o.status === 'Closed').length;

  const handleCardClick = (type) => {
    if (type === 'Total') setStatusFilter('All Status');
    if (type === 'Active') setStatusFilter('Active');
    if (type === 'Closed') setStatusFilter('Closed');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Yarn Purchase Orders", 14, 15);
    const headers = [["PO No", "Date", "Supplier", "Amount", "Status"]];
    const rows = filteredOrders.map(o => [
      o.po_number || '-',
      o.po_date || '-',
      o.supplier_name || '-',
      `Rs. ${o.net_amount?.toFixed(2) || '0.00'}`,
      o.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Yarn_POs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(o => ({
      "PO No": o.po_number,
      "Date": o.po_date,
      "Internal PO No": o.internal_po_no,
      "Supplier": o.supplier_name,
      "Agent Name": o.agent_name,
      "Amount": o.net_amount,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yarn POs");
    XLSX.writeFile(wb, `Yarn_POs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isPurchaseParty = (p) => {
    if (!p) return false;
    const type = (p.party_type || '').toLowerCase();
    const group = (p.party_group || '').toLowerCase();

    // Exclude service providers (job workers, processors, logistics, agents, etc.)
    const excludeTerms = [
      'job', 'worker', 'processor', 'dyeing', 'weaving', 'weaver', 'warping', 
      'sizing', 'printing', 'finishing', 'doubling', 'twisting', 'converter', 
      'coverter', 'loom', 'logistics', 'agent', 'courier', 'postage', 'testing', 
      'lab', 'washing', 'service'
    ];

    if (excludeTerms.some(term => type.includes(term) || group.includes(term))) {
      return false;
    }

    return (
      type.includes('purchase') ||
      type.includes('supplier') ||
      type.includes('vendor') ||
      group.includes('supplier') ||
      group.includes('vendor')
    );
  };

  const isJobWorkParty = (p) => {
    if (!p) return false;
    const type = (p.party_type || '').toLowerCase();
    const group = (p.party_group || '').toLowerCase();

    const jobTerms = [
      'job', 'worker', 'processor', 'dyeing', 'weaving', 'weaver', 'warping', 
      'sizing', 'printing', 'finishing', 'doubling', 'twisting', 'converter', 
      'coverter', 'loom', 'service'
    ];

    return jobTerms.some(term => type.includes(term) || group.includes(term));
  };

  const getDeliveryOptions = () => {
    const list = [
      {
        company_name: companyProfile.company_name || 'Dinesh Exports Private Limited',
        address: companyProfile.address || '1/6-A, AIYNDHUPANAL KADACHANALLUR POST, OPP. TO SPK SCHOOL, KOMARAPALAYAM TALUK, Namakkal, Tamil Nadu, 638183',
        phone: companyProfile.phone || '',
        gst_no: '33AAACD0905A1ZG'
      }
    ];

    parties.filter(isJobWorkParty).forEach(p => {
      list.push({
        company_name: p.company_name,
        address: p.address || '',
        phone: p.phone || p.mobile || '',
        gst_no: p.gst_no || ''
      });
    });

    return list;
  };

  const getFormattedAddress = (opt) => {
    if (!opt) return '';
    return `${opt.company_name}\n${opt.address}${opt.phone ? `\nPhone: ${opt.phone}` : ''}${opt.gst_no ? `\nGST: ${opt.gst_no}` : ''}`;
  };



  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={24} color="var(--primary)" /> Yarn Purchase Orders
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage yarn procurement and indents.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Export
                </button>
                {showExportMenu && (
                  <>
                    <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                      <button onClick={() => { setShowExportMenu(false); exportPDF(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FileText size={16} color="#ef4444" /> PDF Report
                      </button>
                      <button onClick={() => { setShowExportMenu(false); exportExcel(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Download size={16} color="#10b981" /> Excel Sheet
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => { 
                setEditingId(null); 
                setForm(initialForm); 
                setIsReadOnly(false); 
                setShowForm(true); 
                setIsCustomMainSupplier(false);
                setCustomMainSupplierVal('');
                setCustomCountSupplierIdx(null);
                setCustomCountSupplierVal('');
              }}>
                <Plus size={18} /> New Order
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Package size={24} /></div>
              <div className="stat-details"><h3>Total POs</h3><div className="value">{totalPOs}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Active')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active POs</h3><div className="value">{activePOs}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Closed')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Closed POs</h3><div className="value">{closedPOs}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search PO or Supplier..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option><option>Active</option><option>Closed</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="card animate-fade" style={{ padding: '12px 20px', marginBottom: 16, background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#991b1b', fontWeight: 700, fontSize: 14 }}>
                  {selectedIds.length} yarn purchase order{selectedIds.length > 1 ? 's' : ''} selected
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </button>
              </div>
              <button
                className="btn"
                style={{ background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                onClick={handleBulkDelete}
              >
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                          onChange={() => toggleSelectAll(filteredOrders)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                      </th>
                      <th>PO No</th><th>Date</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No POs found.</td></tr>
                    ) : filteredOrders.map(o => (
                      <tr key={o.id} onClick={() => handleRowClick(o)} style={{ cursor: 'pointer', background: selectedIds.includes(o.id) ? 'rgba(239, 68, 68, 0.05)' : selectedViewOrder?.id === o.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }} onClick={evt => evt.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(o.id)}
                            onChange={(evt) => toggleSelectRow(o.id, evt)}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{o.po_number}</td>
                        <td>{o.po_date}</td>
                        <td style={{ fontWeight: 500 }}>{o.supplier_name || '-'}</td>
                        <td style={{ fontWeight: 600 }}>₹{o.net_amount?.toFixed(2) || '0.00'}</td>
                        <td><span className={`badge ${o.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{o.status}</span></td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleOpenForm(o, true)}
                              title="Full View"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(o.id, o.po_number, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <A4DocumentPreview
            isOpen={!!selectedViewOrder}
            onClose={() => setSelectedViewOrder(null)}
            title="YARN PURCHASE ORDER"
            documentNumber={selectedViewOrder?.po_number}
            status={selectedViewOrder?.status || 'Active'}
            sections={selectedViewOrder ? [
              {
                title: "GENERAL INFO",
                icon: "FileText",
                type: "grid",
                data: [
                  { label: "Date", value: selectedViewOrder.po_date },
                  { label: "Internal PO No", value: selectedViewOrder.internal_po_no || '-' },
                  { label: "Supplier", value: selectedViewOrder.supplier_name || '-' }
                ]
              },
              {
                title: "FINANCIALS",
                icon: "IndianRupee",
                type: "grid",
                data: [
                  { label: "Taxable Amt", value: `₹${(selectedViewOrder.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                  ...(selectedViewOrder.tax_type === 'GST' ? [
                    { label: "CGST", value: `${selectedViewOrder.cgst_pct || 0}%` },
                    { label: "SGST", value: `${selectedViewOrder.sgst_pct || 0}%` }
                  ] : selectedViewOrder.tax_type === 'IGST' ? [
                    { label: "IGST", value: `${selectedViewOrder.igst_pct || 5.0}%` }
                  ] : []),
                  { label: "Net Amount", value: `₹${(selectedViewOrder.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
                ]
              },
              {
                title: "INDENT DETAILS",
                icon: "Layers",
                type: "table",
                headers: ["Design No", "Yarn Count", "Color", "Order Qty", "Rate", "Amount"],
                rows: (selectedViewOrder.indent_details || []).map(i => [
                  i.design_no || '-',
                  i.yarn_count || '-',
                  i.colour || '-',
                  i.order_qty || 0,
                  `₹${i.rate || 0}`,
                  `₹${i.amount || 0}`
                ])
              }
            ] : []}
          />
        </>
      ) : isReadOnly ? (() => {
        const taxableAmount = form.taxable_amount || 0;
        const cgstPct = parseFloat(form.cgst_pct) || 0;
        const sgstPct = parseFloat(form.sgst_pct) || 0;
        const igstPct = parseFloat(form.igst_pct) || 5.0;
        const cgstAmt = (cgstPct / 100) * taxableAmount;
        const sgstAmt = (sgstPct / 100) * taxableAmount;
        const igstAmt = (igstPct / 100) * taxableAmount;
        return (
          <div style={{ background: '#f8fafc', padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-yarn-po, #printable-yarn-po * {
                  visibility: visible !important;
                }
                #printable-yarn-po {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            
            {/* Header Actions */}
            <div className="no-print" style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#fff', padding: '16px 24px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Yarn Purchase Order Document Preview</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Printer size={16} /> Print / Export PDF
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setShowForm(false);
                  setIsReadOnly(false);
                }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <X size={16} /> Close
                </button>
              </div>
            </div>
            
            {/* Printable A4 Form Sheet */}
            <div id="printable-yarn-po" style={{
              backgroundColor: '#fff',
              width: '100%',
              maxWidth: '1000px',
              padding: '40px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'center', position: 'relative', marginBottom: '20px' }}>
                <h3 style={{ textDecoration: 'underline', fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Yarn Purchase Order Form</h3>
                <span style={{ position: 'absolute', right: '0', bottom: '0', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Original / Duplicate / Extra</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '13px', color: '#000' }}>
                <tbody>
                  {/* Row 1: Exporter details & PO info */}
                  <tr>
                    <td style={{ width: '55%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <img src={companyProfile.logo || defaultLogo} alt="Logo" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>{companyProfile.company_name}</div>
                          <div style={{ fontSize: '11px', lineLine: '1.4', color: '#1e293b', whiteSpace: 'pre-line' }}>{companyProfile.description}</div>
                          <div style={{ fontSize: '11px', marginTop: '4px', color: '#1e293b' }}><strong>E-Mail:</strong> palanivel@dineshexports.net</div>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>GST : 33AAACD0905A1ZG</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ width: '45%', border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                      <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '12px', borderBottom: '1px solid #000', fontSize: '14px' }}>
                              <strong>P.O.No. :</strong> <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{form.po_number || 'DEPL- 185/26-27'}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '12px', fontSize: '14px' }}>
                              <strong>P.O. Date :</strong> <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{form.po_date ? formatDateString(form.po_date, '-') : '-'}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  
                  {/* Row 2: Delivery At & Agent/Mill */}
                  <tr>
                    <td style={{ width: '55%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ textAlign: 'center', textDecoration: 'underline', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Delivery At</div>
                      {form.delivery_at && form.delivery_at.includes('\n') ? (
                        <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#1e293b', whiteSpace: 'pre-line' }}>
                          {form.delivery_at}
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>DINESH EXPORTS PRIVATE LIMITED</div>
                          <div style={{ fontSize: '11px', lineHeight: '1.4', margin: '4px 0', color: '#1e293b' }}>
                            {form.delivery_at || '1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008.'}
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>GST : 33AAACD0905A1ZG</div>
                        </>
                      )}
                    </td>
                    <td style={{ width: '45%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ textAlign: 'center', textDecoration: 'underline', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Agent / Mill Name and Address</div>
                      <div style={{ fontSize: '12px', lineLine: '1.5', color: '#1e293b', whiteSpace: 'pre-line' }}>
                        {form.agent_name && (<div><strong>Agent:</strong> {form.agent_name}</div>)}
                        {form.supplier_name ? (
                          <div style={{ marginTop: form.agent_name ? '6px' : '0' }}>
                            <strong>Supplier:</strong> {form.supplier_name}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#64748b', marginTop: '10px' }}>-</div>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Row 3: Design & Commission */}
                  <tr>
                    <td colSpan="2" style={{ border: '1px solid #000', padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                        <span>Design No. : <span style={{ fontWeight: 'normal', marginLeft: '6px' }}>{form.design_no || form.against_ref || '-'}</span></span>
                        <span>Commission % : <span style={{ fontWeight: 'normal', marginLeft: '6px' }}>0.00</span></span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Row 4: Items Table */}
                  <tr>
                    <td colSpan="2" style={{ border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #000' }}>
                            <th style={{ borderRight: '1px solid #000', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', width: '40%' }}>Description TFX</th>
                            <th style={{ borderRight: '1px solid #000', padding: '8px 10px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', width: '12%' }}>CSP</th>
                            <th style={{ borderRight: '1px solid #000', padding: '8px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', width: '14%' }}>Quantity</th>
                            <th style={{ borderRight: '1px solid #000', padding: '8px 10px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', width: '10%' }}>Unit</th>
                            <th style={{ borderRight: '1px solid #000', padding: '8px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', width: '12%' }}>Rate Rs</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', width: '12%' }}>Amount Rs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.indent_details?.map((item, idx) => {
                            const countDetail = form.count_details?.[idx] || {};
                            const csp = countDetail.yarn_csp || '';
                            const labelingText = item.labeling || form.labeling || '';
                            return (
                              <React.Fragment key={idx}>
                                <tr style={{ borderBottom: '1px solid #000' }}>
                                  <td style={{ borderRight: '1px solid #000', padding: '10px', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                      <span>
                                        {item.yarn_count || 'YARN'}
                                        {item.design_no && <span style={{ color: '#4b5563', fontWeight: 'normal', marginLeft: 8 }}>({item.design_no})</span>}
                                      </span>
                                      <span style={{ marginRight: '20px' }}>{item.colour || '-'}</span>
                                    </div>
                                  </td>
                                  <td style={{ borderRight: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                                    {csp || '-'}
                                  </td>
                                  <td style={{ borderRight: '1px solid #000', padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>
                                    {parseFloat(item.order_qty || 0).toFixed(3)}
                                  </td>
                                  <td style={{ borderRight: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                                    {item.uom || 'KGS'}
                                  </td>
                                  <td style={{ borderRight: '1px solid #000', padding: '10px', textAlign: 'right', fontSize: '12px' }}>
                                    {parseFloat(item.rate || 0).toFixed(2)}
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>
                                    {parseFloat(item.amount || 0).toFixed(2)}
                                  </td>
                                </tr>
                                {labelingText && (
                                  <tr style={{ borderBottom: '1px solid #000' }}>
                                    <td colSpan="6" style={{ padding: '8px 12px', fontSize: '11px', color: '#1e293b', backgroundColor: '#f8fafc', fontStyle: 'italic' }}>
                                      {labelingText}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  
                  {/* Row 5: Terms & Conditions and Taxes */}
                  <tr>
                    <td style={{ width: '55%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '8px', fontSize: '12px' }}>Terms and Conditions:</div>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', lineLine: '1.6', color: '#1e293b' }}>
                        {form.terms_conditions?.map((term, tIdx) => (
                          <li key={tIdx} style={{ marginBottom: '4px' }}>{term}</li>
                        )) || defaultTerms.map((term, tIdx) => (
                          <li key={tIdx} style={{ marginBottom: '4px' }}>{term}</li>
                        ))}
                      </ol>
                    </td>
                    <td style={{ width: '45%', border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '12px' }}>
                        <tbody>
                          {form.tax_type === 'GST' && (
                            <>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right', width: '60%' }}>CGST: {parseFloat(form.cgst_pct || 0).toFixed(2)} %</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', width: '40%' }}>{cgstAmt > 0 ? cgstAmt.toFixed(2) : '0.00'}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>SGST: {parseFloat(form.sgst_pct || 0).toFixed(2)} %</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{sgstAmt > 0 ? sgstAmt.toFixed(2) : '0.00'}</td>
                              </tr>
                            </>
                          )}
                          {form.tax_type === 'IGST' && (
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right', width: '60%' }}>IGST: {parseFloat(form.igst_pct || 5.0).toFixed(2)} %</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', width: '40%' }}>{igstAmt > 0 ? igstAmt.toFixed(2) : '0.00'}</td>
                            </tr>
                          )}
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>Freight Chg:</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{form.freight_chg ? parseFloat(form.freight_chg).toFixed(2) : '0.00'}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#f8fafc', borderTop: '1.5px solid #000' }}>
                            <td style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right', fontSize: '13px' }}>Net Amount :</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{parseFloat(form.net_amount || 0).toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  
                  {/* Row 6: Rupees in words */}
                  <tr>
                    <td colSpan="2" style={{ border: '1px solid #000', padding: '12px', fontSize: '13px' }}>
                      <strong>Rupees :</strong> <span style={{ fontStyle: 'italic', marginLeft: '8px', fontWeight: 'bold' }}>{toIndianRupeesWords(form.net_amount || 0)}</span>
                    </td>
                  </tr>
                  
                  {/* Row 7: Logistics Terms */}
                  <tr>
                    <td colSpan="2" style={{ border: '1px solid #000', padding: 0 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '12px' }}>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #000' }}>
                            <td style={{ width: '20%', padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Freight</td>
                            <td style={{ width: '30%', padding: '8px 10px', borderRight: '1px solid #000' }}>{form.freight_type || '-'}</td>
                            <td style={{ width: '20%', padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Payment</td>
                            <td style={{ width: '30%', padding: '8px 10px' }}>{form.due_days ? `${form.due_days} DAYS` : '-'}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #000' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Packing</td>
                            <td style={{ padding: '8px 10px', borderRight: '1px solid #000' }}>{form.packing_type || '-'}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Transportation</td>
                            <td style={{ padding: '8px 10px' }}>{form.transport || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Date of Despatch</td>
                            <td style={{ padding: '8px 10px', borderRight: '1px solid #000' }}>{form.dispatch_date ? formatDateString(form.dispatch_date, '/') : '-'}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Labelling</td>
                            <td style={{ padding: '8px 10px' }}>{form.labeling || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  
                  {/* Row 8: Signatures */}
                  <tr>
                    <td colSpan="2" style={{ border: '1px solid #000', padding: 0 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '11px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '33%', borderRight: '1px solid #000', padding: '12px', height: '110px', position: 'relative', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>We Agree our Term & Conditions</div>
                              <div style={{ fontWeight: 'bold' }}>AND Accept the above Order.</div>
                              <div style={{ fontWeight: 'bold', position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center' }}>Signature with Seal</div>
                            </td>
                            <td style={{ width: '33%', borderRight: '1px solid #000', padding: '12px', textAlign: 'center', verticalAlign: 'bottom', height: '110px' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '0px' }}>Prepared By</div>
                            </td>
                            <td style={{ width: '34%', padding: '12px', verticalAlign: 'top', height: '110px', position: 'relative' }}>
                              <div style={{ fontWeight: 'bold', textAlign: 'center' }}>For Dinesh Exports Private Limited</div>
                              <div style={{ fontWeight: 'bold', position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center' }}>Authorised Signatory</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })() : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => {
                setShowForm(false);
                setIsCustomMainSupplier(false);
                setCustomMainSupplierVal('');
                setCustomCountSupplierIdx(null);
                setCustomCountSupplierVal('');
              }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View PO Details' : editingId ? 'Edit PO' : 'New Purchase Order'}</h2>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            <button 
              type="button"
              style={{
                padding: '16px 24px', background: '#fff',
                border: 'none', borderBottom: '3px solid var(--primary)',
                fontWeight: 600, color: 'var(--primary)',
                cursor: 'default', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
              }}
            >
              <FileText size={16}/> Order Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
              
              <div className="animate-fade">
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Info</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group"><label>Order Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Internal PO No</label><input className="form-control" name="internal_po_no" value={form.internal_po_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Used For</label><input className="form-control" name="used_for" value={form.used_for} onChange={handleChange} /></div>
                    <div className="form-group">
                      <label>Against Reference</label>
                      <select 
                        className="form-control" 
                        name="against_ref" 
                        value={form.against_ref === 'PO' || (form.against_ref && form.against_ref !== 'Direct' && form.against_ref !== 'No Reference') ? 'PO' : 'Direct'} 
                        onChange={handleChange}
                      >
                        <option value="Direct">Direct</option>
                        <option value="PO">PO</option>
                      </select>
                    </div>

                    {(form.against_ref === 'PO' || (form.against_ref && form.against_ref !== 'Direct' && form.against_ref !== 'No Reference')) && (
                      <div className="form-group">
                        <label>IBPO No</label>
                        <select 
                          className="form-control" 
                          name="ibpo_no" 
                          value={form.ibpo_no || (form.against_ref !== 'PO' && form.against_ref !== 'Direct' ? form.against_ref : '')} 
                          onChange={handleChange}
                        >
                          <option value="">Select IBPO...</option>
                          {buyerOrders.map(bo => (
                            <option key={bo.id} value={bo.ibpo_number}>
                              {bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Design Entry No</label>
                      {form.against_ref === 'Direct' ? (
                        <select className="form-control" disabled value="">
                          <option value="">N/A (Direct PO)</option>
                        </select>
                      ) : (
                        <select 
                          className="form-control" 
                          name="design_no" 
                          value={form.design_no || ''} 
                          onChange={handleChange}
                        >
                          <option value="">Select Design Entry...</option>
                          {form.design_no && !designEntries.some(de => (de.ds_ref_no === form.design_no || de.design_no === form.design_no)) && (
                            <option value={form.design_no}>{form.design_no}</option>
                          )}
                          {getAvailableDesignEntries().map(de => {
                            const val = de.ds_ref_no || de.design_no || `DE-${de.id}`;
                            const display = de.ds_ref_no && de.design_no && de.ds_ref_no !== de.design_no
                              ? `${de.ds_ref_no} (${de.design_no})`
                              : (de.ds_ref_no || de.design_no || `DE-${de.id}`);
                            return (
                              <option key={de.id} value={val}>
                                {display} {de.ibpo_no ? `(IBPO: ${de.ibpo_no})` : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Agent Name</label><input className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Supplier Name</label>
                      {isCustomMainSupplier ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type new supplier..."
                            value={customMainSupplierVal}
                            onChange={(e) => setCustomMainSupplierVal(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                await handleSaveCustomMainSupplier();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomMainSupplier} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomMainSupplier(false); setForm(prev => ({ ...prev, supplier_name: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="supplier_name" value={form.supplier_name} onChange={handleChange}>
                          <option value="">Select Supplier...</option>
                          {parties.filter(isPurchaseParty).map(p => (
                            <option key={p.id} value={p.company_name}>
                              {p.company_name} ({p.customer_code})
                            </option>
                          ))}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Delivery At</label>
                      <select 
                        className="form-control" 
                        name="delivery_at" 
                        value={form.delivery_at} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({ ...prev, delivery_at: val }));
                        }}
                      >
                        <option value="">Select Delivery Location...</option>
                        {form.delivery_at && !getDeliveryOptions().some(opt => getFormattedAddress(opt) === form.delivery_at) && (
                          <option value={form.delivery_at}>{form.delivery_at.replace(/\n/g, ', ')}</option>
                        )}
                        {getDeliveryOptions().map((opt, idx) => {
                          const formatted = getFormattedAddress(opt);
                          const displayLabel = `${opt.company_name} - ${opt.address}${opt.phone ? `, Phone: ${opt.phone}` : ''}${opt.gst_no ? `, GST: ${opt.gst_no}` : ''}`;
                          return (
                            <option key={idx} value={formatted}>
                              {displayLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="form-group"><label>Status</label>
                      <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                        <option>Active</option><option>Closed</option>
                      </select>
                    </div>
                    <SubMasterDropdown
                      label="Packing Type"
                      name="packing_type"
                      value={form.packing_type || ''}
                      entity="packing_type_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group"><label>Labeling</label>
                      <input className="form-control" name="labeling" value={form.labeling} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Remarks</label>
                      <textarea className="form-control" name="remarks" value={form.remarks} onChange={handleChange} rows={2} placeholder="Enter remarks..." style={{ width: '100%', resize: 'vertical' }} />
                    </div>
                  </div>

                  {/* Section 3: Indent / Design */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Indent / Design</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addIndentDetail}><Plus size={16} /> Add Indent Row</button>
                  </div>
                  <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                    <table className="data-table" style={{ minWidth: '1100px' }}>
                      <thead>
                        <tr>
                          <th>SNo</th><th>Design No</th><th>Count</th><th>Color</th><th>Qty</th><th>Unit</th><th>Date</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.indent_details.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <input 
                                type="text" 
                                className="form-control" 
                                style={{ width: 120 }} 
                                placeholder="Design No" 
                                value={item.design_no || ''} 
                                onChange={e => updateIndentDetail(idx, 'design_no', e.target.value)} 
                              />
                            </td>
                            <td>
                              {customYarnCountIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 80 }} autoFocus value={customYarnCountVal} onChange={e => setCustomYarnCountVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={handleSaveCustomYarnCount}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setCustomYarnCountIdx(null); setCustomYarnCountVal(''); }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 120 }} value={item.yarn_count || ''} onChange={e => {
                                  if (e.target.value === 'custom') setCustomYarnCountIdx(idx);
                                  else updateIndentDetail(idx, 'yarn_count', e.target.value);
                                }}>
                                  <option value="">Select Count...</option>
                                  {item.yarn_count && !options.masters?.yarn_count_master?.includes(item.yarn_count) && (
                                    <option value={item.yarn_count}>{item.yarn_count}</option>
                                  )}
                                  {options.masters?.yarn_count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                </select>
                              )}
                            </td>
                            <td>
                              {customTableColourIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 100 }} autoFocus value={customTableColourVal} onChange={e => setCustomTableColourVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={handleSaveCustomTableColour}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setCustomTableColourIdx(null); setCustomTableColourVal(''); }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 130 }} value={item.colour || ''} onChange={e => {
                                  if (e.target.value === 'custom') {
                                    setCustomTableColourIdx(idx);
                                    setCustomTableColourVal('');
                                  } else {
                                    updateIndentDetail(idx, 'colour', e.target.value);
                                  }
                                }}>
                                  <option value="">Select Color...</option>
                                  {item.colour && !options.masters?.color_master?.includes(item.colour) && (
                                    <option value={item.colour}>{item.colour}</option>
                                  )}
                                  {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                </select>
                              )}
                            </td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} value={item.order_qty} onChange={e => updateIndentDetail(idx, 'order_qty', e.target.value)} /></td>
                            <td>
                              <select className="form-control" style={{ width: 80 }} value={item.uom || 'KGS'} onChange={e => updateIndentDetail(idx, 'uom', e.target.value)}>
                                <option value="KGS">KGS</option>
                                <option value="BAGS">BAGS</option>
                                <option value="PCS">PCS</option>
                                <option value="MTRS">MTRS</option>
                              </select>
                            </td>
                            <td><input type="date" className="form-control" style={{ width: 130 }} value={item.delivery_date || ''} onChange={e => updateIndentDetail(idx, 'delivery_date', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} placeholder="Rate" value={item.rate || 0} onChange={e => updateIndentDetail(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 120, fontWeight: 'bold', background: '#f1f5f9' }} value={item.amount || 0} readOnly /></td>
                            <td><button type="button" onClick={() => removeIndentDetail(idx)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 4: Tax & Logistics */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


                      {/* ── Terms & Conditions ── */}
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Terms & Conditions</span>
                        </div>
                        <div style={{ padding: '16px 18px' }}>
                          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(form.terms_conditions || []).map((term, idx) => (
                              <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {editingTermIdx === idx ? (
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13 }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}} />
                                    <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={14} /></button>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingTermIdx(null)}><X size={14} /></button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <span>{term}</span>
                                    {!isReadOnly && (
                                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm({ ...form, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) })} title="Delete"><Trash2 size={13} /></button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                          {!isReadOnly && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                              <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13 }} placeholder="Add new term or condition..." value={newTermVal} onChange={e => setNewTermVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTermVal.trim()) { setForm({ ...form, terms_conditions: [...(form.terms_conditions || []), newTermVal.trim()] }); setNewTermVal(''); }}} />
                              <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { if (newTermVal.trim()) { setForm({ ...form, terms_conditions: [...(form.terms_conditions || []), newTermVal.trim()] }); setNewTermVal(''); }}}><Plus size={14} /> Add</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE — Order Summary */}
                    <div style={{ flex: '0 0 300px', position: 'sticky', top: 24 }}>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Order Summary</span>
                        </div>
                        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Amount</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>INR {(form.taxable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Charges</span>
                            <input 
                              type="number" 
                              name="freight_chg" 
                              value={form.freight_chg} 
                              onChange={handleChange} 
                              disabled={isReadOnly}
                              style={{
                                width: '100px',
                                textAlign: 'right',
                                border: isReadOnly ? 'none' : '1px solid var(--border)',
                                borderRadius: '4px',
                                padding: isReadOnly ? '4px 0' : '4px 8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                background: 'transparent',
                                pointerEvents: isReadOnly ? 'none' : 'auto'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST ({form.sgst_pct || 0}%)</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {form.tax_type === 'GST' 
                                ? ((form.taxable_amount || 0) * (form.sgst_pct || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                                : '0.00'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST ({form.cgst_pct || 0}%)</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {form.tax_type === 'GST' 
                                ? ((form.taxable_amount || 0) * (form.cgst_pct || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                                : '0.00'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST ({form.igst_pct || 5.0}%)</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {form.tax_type === 'IGST' 
                                ? ((form.taxable_amount || 0) * (form.igst_pct || 5.0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                                : '0.00'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Order Kgs</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.total_order_kgs || 0}</span>
                          </div>

                          <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Grand Total</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setShowForm(false);
                setIsCustomMainSupplier(false);
                setCustomMainSupplierVal('');
                setCustomCountSupplierIdx(null);
                setCustomCountSupplierVal('');
              }}>
                <X size={16} /> Close
              </button>
              {!isReadOnly && (
                <button type="button" className="btn btn-primary" onClick={handleCreate}>
                  <Save size={16} /> {editingId ? 'Update PO' : 'Save PO'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
