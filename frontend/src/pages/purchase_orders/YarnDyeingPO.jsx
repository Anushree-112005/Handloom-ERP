import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, Palette, FileText, Layers, IndianRupee, Download, Table, ArrowLeft } from 'lucide-react';
import { yarnDyeingPOAPI, partyAPI, dropdownAPI, buyerOrderAPI, designEntryAPI, yarnInwardAPI } from '../../services/api';
import CustomPODocumentPreview from '../../components/CustomPODocumentPreview';
import SubMasterDropdown from '../../components/SubMasterDropdown';

export default function YarnDyeingPO() {
  const title = 'Yarn Dyeing PO';
  const description = 'Manage yarn dyeing purchase orders';
  const Icon = Palette;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  
  const initialForm = {
    ref_no_1: '',
    ref_no_2: '',
    po_no: '',
    po_date: new Date().toISOString().split('T')[0],
    order_type: 'Against SP No.',
    delivery_date: '',
    supplier_dyeing_unit: '',
    azo_free: 'Yes',
    apeo_npeo: 'Yes',
    fastness_dry: '4',
    fastness_wet: '4',
    color_fastness: '4',
    shade_change: '4',
    deschargability: '',
    pcp_free: '',
    staining_on_cotton: '4',
    design_no: '',
    buyer_name: '',
    lot_no: '',

    tax_type: '',
    certificate_type: '',
    gross_amt: 0,
    transport_charge: 0,
    packing_charge: 0,
    cgst_pct: 0,
    cgst_amount: 0,
    sgst_pct: 0,
    sgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    total_order_kgs: 0,
    payment_terms: '',
    remarks: '',
    net_amount: 0,
    terms_conditions: [
      "Material not meeting our specification and standards will be returned",
      "Demanded Qty to be supplied in whole and excess/short supply will not be accepted.",
      "Send Invoice along with Material.",
      "Defective and damage pieces will not be accepted.",
      "Start bulk production only after getting the sample Approval.",
      "Subject to Namakkal Jurisdiction."
    ],

    items: [{
      sp_no: '', lot_no: '', stock_qty: 0, dsn_count: '', yarn_count: '', color: '', uom: '', warp_qty: 0, weft_qty: 0, tot_qty: 0, tole_pct: 0, wrp_order: 0, wft_order: 0, rate: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);
  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('info');
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);
  const [yarnInwards, setYarnInwards] = useState([]);

  const allInwardColors = React.useMemo(() => {
    const colors = new Set();
    
    // Colors from Yarn Inwards
    yarnInwards.forEach(yi => {
      if (yi.items && Array.isArray(yi.items)) {
        yi.items.forEach(item => {
          if (item.colour) {
            colors.add(item.colour);
          }
        });
      }
    });

    // Colors from Design Entries
    designEntries.forEach(de => {
      if (de.fabric_design_details) {
        try {
          const details = JSON.parse(de.fabric_design_details);
          if (Array.isArray(details)) {
            details.forEach(item => {
              if (item.color) {
                colors.add(item.color);
              }
            });
          }
        } catch (e) {}
      }
      if (de.warp_summary) {
        try {
          const ws = JSON.parse(de.warp_summary);
          if (Array.isArray(ws)) {
            ws.forEach(item => {
              if (item.color) {
                colors.add(item.color);
              }
            });
          }
        } catch (e) {}
      }
      if (de.weft_summary) {
        try {
          const ws = JSON.parse(de.weft_summary);
          if (Array.isArray(ws)) {
            ws.forEach(item => {
              if (item.color) {
                colors.add(item.color);
              }
            });
          }
        } catch (e) {}
      }
    });

    return Array.from(colors);
  }, [yarnInwards, designEntries]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes, dsRes, inwardRes] = await Promise.all([
        yarnDyeingPOAPI.list(),
        partyAPI.list(),
        dropdownAPI.getAll(),
        buyerOrderAPI.list(),
        designEntryAPI.list(),
        yarnInwardAPI.list()
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setBuyerOrders(buyerOrdRes.data || []);
      setDesignEntries(dsRes.data || []);
      setYarnInwards(inwardRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshOptions = async () => {
    try {
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFieldChange = (name, val) => {
    setForm(prev => recalculate({ ...prev, [name]: val }));
  };

  const recalculate = (updatedForm) => {
    let totalKgs = 0;
    const updatedItems = (updatedForm.items || []).map(item => {
      const qty = parseFloat(item.tot_qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      totalKgs += qty;
      return { ...item, amount: parseFloat((qty * rate).toFixed(2)) };
    });

    const itemsAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const grossAmt = itemsAmount;
    const freight = parseFloat(updatedForm.transport_charge) || 0;
    const insurance = parseFloat(updatedForm.packing_charge) || 0;
    
    const taxableValue = grossAmt + freight + insurance;
    const taxType = updatedForm.tax_type || '';

    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxType.includes('GST') && !taxType.includes('IGST')) {
      cgstAmount = parseFloat(((cgstPct / 100) * taxableValue).toFixed(2));
      sgstAmount = parseFloat(((sgstPct / 100) * taxableValue).toFixed(2));
    } else if (taxType.includes('IGST')) {
      igstAmount = parseFloat(((igstPct / 100) * taxableValue).toFixed(2));
    }


    let netAmountRaw = taxableValue + cgstAmount + sgstAmount + igstAmount;
    const netAmountRounded = Math.round(netAmountRaw);

    return {
      ...updatedForm,
      items: updatedItems,
      gross_amt: grossAmt,
      taxable_value: taxableValue,
      total_order_kgs: totalKgs,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      net_amount: netAmountRounded
    };
  };

  const getDesignRequirementItems = (de) => {
    if (!de) return [];

    let warpSummary = [];
    try {
      warpSummary = de.warp_summary ? JSON.parse(de.warp_summary) : [];
    } catch (e) {}

    let weftSummary = [];
    try {
      weftSummary = de.weft_summary ? JSON.parse(de.weft_summary) : [];
    } catch (e) {}

    // Query stock & lot_no from yarn inwards
    const allInwardItems = (yarnInwards || []).flatMap(yi => yi.items || []);
    const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const findMatchingInward = (count, color) => {
      const match = allInwardItems.find(item => 
        cleanStr(item.yarn_count) === cleanStr(count) && 
        cleanStr(item.colour) === cleanStr(color)
      );
      return match ? { lot_no: match.lot_no || '', stock_qty: match.kgs || 0 } : { lot_no: '', stock_qty: 0 };
    };

    if (warpSummary.length > 0 || weftSummary.length > 0) {
      const aggregated = {};

      warpSummary.forEach(row => {
        const yc = row.count || '';
        const col = row.color || '';
        const key = `${yc.toLowerCase().trim()}_${col.toLowerCase().trim()}`;
        const stockMatch = findMatchingInward(yc, col);
        const reqKg = parseFloat(row.req_kg) || 0;

        if (!aggregated[key]) {
          aggregated[key] = {
            sp_no: de.ds_ref_no || '',
            lot_no: stockMatch.lot_no,
            stock_qty: stockMatch.stock_qty,
            dsn_count: yc,
            yarn_count: yc,
            color: col,
            uom: 'Kgs',
            warp_qty: reqKg,
            weft_qty: 0,
            tot_qty: reqKg,
            tole_pct: de.toie_pct || 0,
            wrp_order: reqKg,
            wft_order: 0,
            rate: 0,
            amount: 0
          };
        } else {
          aggregated[key].warp_qty += reqKg;
          aggregated[key].tot_qty += reqKg;
          aggregated[key].wrp_order += reqKg;
        }
      });

      weftSummary.forEach(row => {
        const yc = row.count || '';
        const col = row.color || '';
        const key = `${yc.toLowerCase().trim()}_${col.toLowerCase().trim()}`;
        const stockMatch = findMatchingInward(yc, col);
        const reqKg = parseFloat(row.req_kg) || 0;

        if (!aggregated[key]) {
          aggregated[key] = {
            sp_no: de.ds_ref_no || '',
            lot_no: stockMatch.lot_no,
            stock_qty: stockMatch.stock_qty,
            dsn_count: yc,
            yarn_count: yc,
            color: col,
            uom: 'Kgs',
            warp_qty: 0,
            weft_qty: reqKg,
            tot_qty: reqKg,
            tole_pct: de.toie_pct || 0,
            wrp_order: 0,
            wft_order: reqKg,
            rate: 0,
            amount: 0
          };
        } else {
          aggregated[key].weft_qty += reqKg;
          aggregated[key].tot_qty += reqKg;
          aggregated[key].wft_order += reqKg;
        }
      });

      return Object.values(aggregated);
    }

    let fabricDesignRows = [];
    try {
      fabricDesignRows = de.fabric_design_details ? JSON.parse(de.fabric_design_details) : [];
    } catch (e) {
      console.error("Error parsing fabric_design_details", e);
    }
    
    const warpRows = fabricDesignRows.filter(r => r.type && !r.type.toLowerCase().includes('weft'));
    const weftRows = fabricDesignRows.filter(r => r.type && r.type.toLowerCase().includes('weft'));

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

    const warpRepeatSize = calculateRepeatSize(warpRows);
    const weftRepeatSize = calculateRepeatSize(weftRows);

    const totalEnds = parseFloat(de.total_ends) || 0;
    const selvage = parseFloat(de.selvage_waste) || 0;
    const reed = parseFloat(de.reed) || 0;
    const reedOl = Math.max(0, reed - 8);
    const pickOl = Math.max(0, (parseFloat(de.pick_ot) || 0) - 4);
    const noD = warpRepeatSize > 0 ? Math.floor(totalEnds / warpRepeatSize) : 0;
    const repeatEnds = warpRepeatSize * noD;
    const balance = totalEnds - repeatEnds - selvage;

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

    const totalMtr = parseFloat(de.total_mtr) || 0;
    const crimpPct = parseFloat(de.crimp_pct) || 0;
    const skgPct = parseFloat(de.skg_pct) || 0;
    const dyeingPct = parseFloat(de.dyeing_loss_pct) || 0;
    const warpLength = Math.round(parseFloat(de.warp_mtr) || (totalMtr * (1 + crimpPct/100) * (1 + skgPct/100)));
    const weftProMtrVal = Math.round(parseFloat(de.weft_pro_mtr) || (totalMtr * (1 + skgPct/100)));

    const parseEqCount = (lbl) => {
      const YARN_COUNTS = {
        "10S CTN": 10.0, "20S CTN": 20.0, "30S CTN": 30.0, "40S CTN": 40.0,
        "60S CTN": 60.0, "80S CTN": 80.0, "2/20S CTN": 10.0, "2/40S CTN": 20.0,
        "2/60S CTN": 30.0, "2/80S CTN": 40.0
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
    const pick = parseFloat(de.pick_ot) || 0;
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
      return { ...row, total_ends: groupEnds, req_kg };
    });

    const aggregatedCalculated = {};

    warpSummaryCalculated.forEach(row => {
      const yc = row.count || '';
      const col = row.color || '';
      const key = `${yc.toLowerCase().trim()}_${col.toLowerCase().trim()}`;
      const stockMatch = findMatchingInward(yc, col);
      const reqKg = parseFloat(row.req_kg) || 0;

      if (!aggregatedCalculated[key]) {
        aggregatedCalculated[key] = {
          sp_no: de.ds_ref_no || '',
          lot_no: stockMatch.lot_no,
          stock_qty: stockMatch.stock_qty,
          dsn_count: yc,
          yarn_count: yc,
          color: col,
          uom: 'Kgs',
          warp_qty: reqKg,
          weft_qty: 0,
          tot_qty: reqKg,
          tole_pct: de.toie_pct || 0,
          wrp_order: reqKg,
          wft_order: 0,
          rate: 0,
          amount: 0
        };
      } else {
        aggregatedCalculated[key].warp_qty += reqKg;
        aggregatedCalculated[key].tot_qty += reqKg;
        aggregatedCalculated[key].wrp_order += reqKg;
      }
    });

    weftSummaryCalculated.forEach(row => {
      const yc = row.count || '';
      const col = row.color || '';
      const key = `${yc.toLowerCase().trim()}_${col.toLowerCase().trim()}`;
      const stockMatch = findMatchingInward(yc, col);
      const reqKg = parseFloat(row.req_kg) || 0;

      if (!aggregatedCalculated[key]) {
        aggregatedCalculated[key] = {
          sp_no: de.ds_ref_no || '',
          lot_no: stockMatch.lot_no,
          stock_qty: stockMatch.stock_qty,
          dsn_count: yc,
          yarn_count: yc,
          color: col,
          uom: 'Kgs',
          warp_qty: 0,
          weft_qty: reqKg,
          tot_qty: reqKg,
          tole_pct: de.toie_pct || 0,
          wrp_order: 0,
          wft_order: reqKg,
          rate: 0,
          amount: 0
        };
      } else {
        aggregatedCalculated[key].weft_qty += reqKg;
        aggregatedCalculated[key].tot_qty += reqKg;
        aggregatedCalculated[key].wft_order += reqKg;
      }
    });

    return Object.values(aggregatedCalculated);
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;

    if (name === 'tax_type') {
      let taxUpdates = { tax_type: value };
      if (value === 'GST 5% - INTRA STATE' || value === 'GST') {
        taxUpdates = { ...taxUpdates, sgst_pct: 2.5, cgst_pct: 2.5, igst_pct: 0 };
      } else if (value === 'IGST 5% - INTER STATE' || value === 'IGST') {
        taxUpdates = { ...taxUpdates, sgst_pct: 0, cgst_pct: 0, igst_pct: 5.0 };
      } else if (value === 'Exempt' || value === '') {
        taxUpdates = { ...taxUpdates, sgst_pct: 0, cgst_pct: 0, igst_pct: 0 };
      }
      setForm(recalculate({ ...form, ...taxUpdates }));
      return;
    }

    if (name === 'supplier_dyeing_unit') {
      const selectedParty = parties.find(p => p.company_name === value);
      let taxUpdates = {};
      if (selectedParty) {
        const stateLower = (selectedParty.state || '').toLowerCase().trim();
        const gstCode = (selectedParty.gst_no || '').trim().substring(0, 2);
        const isTN = stateLower.includes('tamil') || gstCode === '33';
        if (!isTN && (stateLower !== '' || gstCode !== '')) {
          taxUpdates = { tax_type: 'IGST 5% - INTER STATE', sgst_pct: 0, cgst_pct: 0, igst_pct: 5.0 };
        } else {
          taxUpdates = { tax_type: 'GST 5% - INTRA STATE', sgst_pct: 2.5, cgst_pct: 2.5, igst_pct: 0 };
        }
      }
      setForm(recalculate({ ...form, supplier_dyeing_unit: value, ...taxUpdates }));
      return;
    }

    if (name === 'ref_no_1') {
      const selectedBo = buyerOrders.find(bo => bo.ibpo_number === value);
      const de = designEntries.find(d => d.ibpo_no === value);
      if (de) {
        let newItems = getDesignRequirementItems(de);
        if (newItems.length === 0) {
          newItems = [{
            ...initialForm.items[0],
            sp_no: de.ds_ref_no || '',
            uom: 'Kgs'
          }];
        }
        setForm(recalculate({
          ...form,
          ref_no_1: value,
          design_no: de.ds_ref_no || de.design_no || '',
          buyer_name: de.buyer_name || (selectedBo ? (selectedBo.party_name || selectedBo.buyer_name || '') : ''),
          items: newItems
        }));
        return;
      } else {
        setForm(recalculate({
          ...form,
          ref_no_1: value,
          buyer_name: selectedBo ? (selectedBo.party_name || selectedBo.buyer_name || '') : ''
        }));
        return;
      }
    }

    if (name === 'design_no') {
      const de = designEntries.find(d => d.ds_ref_no === value || d.design_no === value);
      if (de) {
        let newItems = getDesignRequirementItems(de);
        if (newItems.length === 0) {
          newItems = [{
            ...initialForm.items[0],
            sp_no: de.ds_ref_no || '',
            uom: 'Kgs'
          }];
        }
        setForm(recalculate({
          ...form,
          design_no: value,
          buyer_name: de.buyer_name || '',
          items: newItems
        }));
        return;
      }
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['warp_qty', 'weft_qty', 'tot_qty', 'tole_pct', 'wrp_order', 'wft_order', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    if (field === 'warp_qty' || field === 'weft_qty') {
      const wQty = field === 'warp_qty' ? val : (parseFloat(newItems[index].warp_qty) || 0);
      const wfQty = field === 'weft_qty' ? val : (parseFloat(newItems[index].weft_qty) || 0);
      newItems[index].tot_qty = wQty + wfQty;
    }
    setForm(recalculate({ ...form, items: newItems }));
  };

  const addItem = () => setForm(recalculate({ ...form, items: [...form.items, initialForm.items[0]] }));
  const removeItem = (index) => setForm(recalculate({ ...form, items: form.items.filter((_, i) => i !== index) }));

  const addTerm = () => {
    if (!newTerm.trim()) return;
    setForm({ ...form, terms_conditions: [...(form.terms_conditions || []), newTerm.trim()] });
    setNewTerm('');
  };

  const removeTerm = (idx) => {
    const newTerms = [...(form.terms_conditions || [])];
    newTerms.splice(idx, 1);
    setForm({ ...form, terms_conditions: newTerms });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.delivery_date) payload.delivery_date = null;

      if (form.id) {
        await yarnDyeingPOAPI.update(form.id, payload);
      } else {
        await yarnDyeingPOAPI.create(payload);
      }
      setShowForm(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message));
    }
  };

  const handleOpenNewForm = () => {
    let maxNum = 0;
    orders.forEach(o => {
      if (o.po_no && o.po_no.toUpperCase().startsWith("YDP-")) {
        const parts = o.po_no.split("-");
        if (parts.length > 1) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    const nextPoNo = `YDP-${String(maxNum + 1).padStart(5, '0')}`;
    setForm({
      ...initialForm,
      po_no: nextPoNo,
      po_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleEdit = (order) => {
    setForm(order);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await yarnDyeingPOAPI.delete(id);
        loadData();
      } catch (err) {
        alert("Error deleting order");
      }
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`Dinesh Textile - ${title}`, 14, 15);
    const headers = [["PO No", "Date", "Supplier", "Amount", "Status"]];
    const rows = filteredOrders.map(o => [
      o.po_no || o.po_number || '-',
      o.po_date || '-',
      o.supplier_name || o.supplier_job_worker || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit || '-',
      `Rs. ${o.net_amount?.toFixed(2) || '0.00'}`,
      o.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(o => ({
      "PO No": o.po_no || o.po_number,
      "Date": o.po_date,
      "Supplier": o.supplier_name || o.supplier_job_worker || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit,
      "Amount": o.net_amount,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchTerm === '' ||
      o.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier_dyeing_unit?.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  return (
    <div className="animate-fade">
      {!showForm && !selectedViewOrder ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={24} color="var(--primary)" /> {title}
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>{description}</p>
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
                        <Table size={16} color="#10b981" /> Excel Export
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={handleOpenNewForm}>
                <Plus size={18} /> New Order
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setStatusFilter('All Status')} style={{ cursor: 'pointer', border: statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Package size={24} /></div>
              <div className="stat-details"><h3>Total POs</h3><div className="value">{orders.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active POs</h3><div className="value">{orders.filter(o => o.status === 'Active').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setStatusFilter('Closed')} style={{ cursor: 'pointer', border: statusFilter === 'Closed' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Closed POs</h3><div className="value">{orders.filter(o => o.status === 'Closed').length}</div></div>
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

          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO NO</th>
                  <th>DATE</th>
                  <th>SUPPLIER / DYEING UNIT</th>
                  <th>TOTAL AMOUNT</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No orders found</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{order.po_no}</td>
                      <td>{order.po_date}</td>
                      <td style={{ fontWeight: 500 }}>{order.supplier_dyeing_unit}</td>
                      <td style={{ fontWeight: 600 }}>₹{order.net_amount?.toFixed(2) || '0.00'}</td>
                      <td>
                        <span className={`badge ${order.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>
                          {order.status === 'Active' ? 'Open' : order.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setSelectedViewOrder(order)}
                            title="Full View"
                          >
                            <Eye size={14} color="var(--primary)" />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(order)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleDelete(order.id)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedViewOrder ? (
          <CustomPODocumentPreview
            isOpen={!!selectedViewOrder}
            onClose={() => setSelectedViewOrder(null)}
            title="YARN DYEING PO"
            poNumber={selectedViewOrder?.po_no}
            poDate={selectedViewOrder?.po_date}
            deliveryAt="1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008."
            supplierName={selectedViewOrder?.supplier_dyeing_unit}
            agentName=""
            designNo={selectedViewOrder?.design_no || '-'}
            commission="0.00"
            designWiseDetails={[selectedViewOrder?.lot_no && `Lot No: ${selectedViewOrder.lot_no}`, selectedViewOrder?.certificate_type && `Certificate: ${selectedViewOrder.certificate_type}`].filter(Boolean).join(' | ')}
            colorWiseDetails={selectedViewOrder?.remarks && `Remarks: ${selectedViewOrder.remarks}`}
            terms={selectedViewOrder?.terms_conditions || []}
            taxes={{
              cgst_pct: selectedViewOrder?.cgst_pct || 0, cgst_amt: selectedViewOrder?.cgst_amount || 0,
              sgst_pct: selectedViewOrder?.sgst_pct || 0, sgst_amt: selectedViewOrder?.sgst_amount || 0,
              igst_pct: selectedViewOrder?.igst_pct || 0, igst_amt: selectedViewOrder?.igst_amount || 0
            }}
            freightChg={parseFloat(selectedViewOrder?.transport_charge || 0) + parseFloat(selectedViewOrder?.loading_charge || 0) + parseFloat(selectedViewOrder?.unloading_charge || 0)}
            insuranceChg={parseFloat(selectedViewOrder?.packing_charge || 0) + parseFloat(selectedViewOrder?.other_charges || 0)}
            netAmount={selectedViewOrder?.net_amount || 0}
            logistics={{
              freight_type: "-",
              transport: "-",
              delivery_date: selectedViewOrder?.delivery_date || "-",
              payment_terms: selectedViewOrder?.payment_terms || "-"
            }}
            tableHeaders={[
              { label: 'SP No.', align: 'left', width: '12%' },
              { label: 'Lot No.', align: 'left', width: '12%' },
              { label: 'Dsn Count', align: 'left', width: '12%' },
              { label: 'Yarn Count', align: 'left', width: '12%' },
              { label: 'Color', align: 'left', width: '12%' },
              { label: 'Unit', align: 'center', width: '5%' },
              { label: 'Tot Qty', align: 'right', width: '10%' },
              { label: 'Rate', align: 'right', width: '10%' },
              { label: 'Amount', align: 'right', width: '15%' }
            ]}
            tableRows={(selectedViewOrder?.items || []).map(i => ({
              rowData: [
                i.sp_no || '-',
                i.lot_no || '-',
                i.dsn_count || '-',
                i.yarn_count || '-',
                i.color || '-',
                i.uom || '-',
                parseFloat(i.tot_qty || 0).toFixed(2),
                parseFloat(i.rate || 0).toFixed(2),
                parseFloat(i.amount || 0).toFixed(2)
              ],
              rowNote: null
            }))}
          />
      ) : (
        <div className="card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => { setShowForm(false); setForm(initialForm); }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {form.id ? 'Edit' : 'Create'} {title}
            </h2>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            <button
              type="button"
              style={{
                padding: '16px 24px',
                background: '#fff',
                border: 'none',
                borderBottom: '3px solid var(--primary)',
                fontWeight: 600,
                color: 'var(--primary)',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={18} /> Order Details
            </button>
          </div>

           <form id="yd-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
            <div id="section-info" className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24, gap: '12px 24px' }}>
              <div className="form-group"><label>Order Date</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Order No. (Buyer Order) *</label>
                <select className="form-control" name="ref_no_1" value={form.ref_no_1 || ''} onChange={handleChange} required>
                  <option value="">Select Order No...</option>
                  {buyerOrders.map(bo => (
                    <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Design No. *</label>
                <select className="form-control" name="design_no" value={form.design_no} onChange={handleChange} required>
                  <option value="">Select Design No...</option>
                  {designEntries.map(de => (
                    <option key={de.id} value={de.ds_ref_no}>{de.ds_ref_no} ({de.design_no})</option>
                  ))}
                </select>
              </div>

              <div className="form-group"><label>Order Type</label>
                <select className="form-control" name="order_type" value={form.order_type} onChange={handleChange}>
                  <option value="Against SP No.">Against SP No.</option>
                  <option value="Direct">Direct</option>
                </select>
              </div>
              <div className="form-group"><label>Completion Date</label><input type="date" className="form-control" name="delivery_date" value={form.delivery_date} onChange={handleChange} /></div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Processor Name</label>
                <select className="form-control" name="supplier_dyeing_unit" value={form.supplier_dyeing_unit} onChange={handleChange}>
                  <option value="">Select...</option>
                  {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                </select>
              </div>

              <div id="section-ref" className="form-group"><label>AZO Free</label>
                <select className="form-control" name="azo_free" value={form.azo_free} onChange={handleChange}><option>Yes</option><option>No</option></select>
              </div>
              <div className="form-group"><label>APEo,NPEo</label>
                <select className="form-control" name="apeo_npeo" value={form.apeo_npeo} onChange={handleChange}><option>Yes</option><option>No</option></select>
              </div>
              <div className="form-group"><label>Fastness Dry</label><input type="text" className="form-control" name="fastness_dry" value={form.fastness_dry} onChange={handleChange} /></div>
              <div className="form-group"><label>Fastnes Wet</label><input type="text" className="form-control" name="fastness_wet" value={form.fastness_wet} onChange={handleChange} /></div>

              <div className="form-group"><label>Color Fastness</label><input type="text" className="form-control" name="color_fastness" value={form.color_fastness} onChange={handleChange} /></div>
              <div className="form-group"><label>Shade Change</label><input type="text" className="form-control" name="shade_change" value={form.shade_change} onChange={handleChange} /></div>
              <div className="form-group"><label>Deschargability</label><input type="text" className="form-control" name="deschargability" value={form.deschargability} onChange={handleChange} /></div>
              <div className="form-group"><label>PCP Free</label><input type="text" className="form-control" name="pcp_free" value={form.pcp_free} onChange={handleChange} /></div>

              <div className="form-group"><label>Staining on Cotton</label><input type="text" className="form-control" name="staining_on_cotton" value={form.staining_on_cotton} onChange={handleChange} /></div>
              <div className="form-group"><label>Merchandiser</label><input type="text" className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange} /></div>
              <div className="form-group"><label>Lot No.</label><input type="text" className="form-control" name="lot_no" value={form.lot_no || ''} onChange={handleChange} /></div>
              <div className="form-group"><label>Payment Terms</label><input type="text" className="form-control" name="payment_terms" value={form.payment_terms || ''} onChange={handleChange} /></div>
              <div className="form-group">
                <label>Tax Type</label>
                <select className="form-control" name="tax_type" value={form.tax_type || ''} onChange={handleChange}>
                  <option value="">-- Select Tax Type --</option>
                  <option value="GST 5% - INTRA STATE">GST 5% - INTRA STATE</option>
                  <option value="IGST 5% - INTER STATE">IGST 5% - INTER STATE</option>
                  <option value="Exempt">Exempt</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <SubMasterDropdown
                  label="Certificate Type"
                  name="certificate_type"
                  value={form.certificate_type}
                  entity="certified_type"
                  category="certified_type"
                  options={options}
                  onChange={handleFieldChange}
                  onOptionsRefresh={handleRefreshOptions}
                  placeholder="-- Select Certificate --"
                  allowCustom={false}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><input type="text" className="form-control" name="remarks" value={form.remarks || ''} onChange={handleChange} /></div>
            </div>

            {/* Yarn Details Table */}
            <div id="section-items" className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 24, width: '100%', border: '1px solid var(--border)' }}>
              <table className="data-table" style={{ minWidth: '1600px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', color: '#1e293b' }}>
                    <th>S.No</th>
                    <th>SP No.</th>
                    <th>Lot No.</th>
                    <th>Stock Qty</th>
                    <th>Dsn Count</th>
                    <th>Yarn Count</th>
                    <th>Color</th>
                    <th>Unit</th>
                    <th>Warp Qty</th>
                    <th>Weft Qty</th>
                    <th>Tot Qty</th>
                    <th>Tole %</th>
                    <th>Wrp Order</th>
                    <th>Wft Order</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th style={{ width: 60 }}><button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ padding: '4px 8px' }}>Add</button></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td><input type="text" className="form-control" style={{ width: 150, padding: 6, margin: 0 }} value={item.sp_no} onChange={e => updateItem(idx, 'sp_no', e.target.value)} /></td>
                      <td><input type="text" className="form-control" style={{ width: 140, padding: 6, margin: 0 }} value={item.lot_no || ''} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.stock_qty || 0} onChange={e => updateItem(idx, 'stock_qty', e.target.value)} /></td>
                      <td><input type="text" className="form-control" style={{ width: 110, padding: 6, margin: 0 }} value={item.dsn_count} onChange={e => updateItem(idx, 'dsn_count', e.target.value)} /></td>
                      <td>
                        <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)}>
                          <option value="">-</option>
                          {item.yarn_count && !options.masters?.yarn_count_master?.includes(item.yarn_count) && !options.masters?.count_master?.includes(item.yarn_count) && (
                            <option value={item.yarn_count}>{item.yarn_count}</option>
                          )}
                          {options.masters?.yarn_count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          {options.masters?.count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)}>
                          <option value="">-</option>
                          {item.color && !options.masters?.color_master?.includes(item.color) && !allInwardColors.includes(item.color) && (
                            <option value={item.color}>{item.color}</option>
                          )}
                          {allInwardColors.map(c => !options.masters?.color_master?.includes(c) && (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td><input type="text" className="form-control" style={{ width: 70, padding: 6, margin: 0 }} value={item.uom} onChange={e => updateItem(idx, 'uom', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.warp_qty} onChange={e => updateItem(idx, 'warp_qty', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.weft_qty} onChange={e => updateItem(idx, 'weft_qty', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.tot_qty} onChange={e => updateItem(idx, 'tot_qty', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 70, padding: 6, margin: 0 }} value={item.tole_pct} onChange={e => updateItem(idx, 'tole_pct', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.wrp_order} onChange={e => updateItem(idx, 'wrp_order', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.wft_order} onChange={e => updateItem(idx, 'wft_order', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                      <td><input type="number" className="form-control" style={{ width: 100, padding: 6, margin: 0, background: '#f1f5f9', fontWeight: 'bold' }} value={item.amount || 0} disabled /></td>
                      <td><button type="button" className="icon-btn" onClick={() => removeItem(idx)} style={{ color: 'red' }}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section: Tax & Logistics */}
            <div id="section-tax" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Terms and Conditions */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TERMS & CONDITIONS</span>
                    </div>
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(form.terms_conditions || []).map((term, idx) => (
                          <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {editingTermIdx === idx ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13, border: '1px solid var(--primary)' }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}} />
                                <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={14} /></button>
                                <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingTermIdx(null)}><X size={14} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span>{term}</span>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a32fa', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm({ ...form, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) })} title="Delete"><Trash2 size={13} /></button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input type="text" className="form-control" placeholder="Add new term or condition..." style={{ margin: 0 }} value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTerm())} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px 16px', background: '#5a32fa', borderColor: '#5a32fa' }} onClick={addTerm}>
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ORDER SUMMARY */}
                <div style={{ flex: '0 0 350px', position: 'sticky', top: 24 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ORDER SUMMARY</span>
                    </div>
                    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Amount</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>INR {(form.gross_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Charges</span>
                        <input type="number" className="form-control" name="transport_charge" value={form.transport_charge} onChange={handleChange} style={{ width: 80, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance</span>
                        <input type="number" className="form-control" name="packing_charge" value={form.packing_charge} onChange={handleChange} style={{ width: 80, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                          <input type="number" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                          <input type="number" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                          <input type="number" name="igst_pct" value={form.igst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Order Kgs</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.total_order_kgs || 0).toFixed(2)}</span>
                      </div>

                      <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>GRAND TOTAL</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#5a32fa', letterSpacing: '-0.3px' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setForm(initialForm); }}>
                <X size={16} /> Close
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
