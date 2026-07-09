import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, FileText, Layers, IndianRupee, Download, Table } from 'lucide-react';
import { weavingPOAPI, partyAPI, dropdownAPI, buyerOrderAPI, designEntryAPI } from '../../services/api';
import CustomPODocumentPreview from '../../components/CustomPODocumentPreview';

export default function WeavingPO() {
  const title = 'Weaving PO';
  const description = 'Manage weaving purchase orders';
  const Icon = Layers;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeSection, setActiveSection] = useState('info');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);

  const initialForm = {
    po_no: '',
    po_date: new Date().toISOString().split('T')[0],
    supplier_weaver: '',
    supplier_code: '',
    delivery_date: '',
    payment_terms: '',
    buyer_name: '',
    status: 'Active',
    remarks: '',

    indent_no: '',
    sales_order_no: '',
    production_order_no: '',
    buyer_order_no: '',
    design_no: '',
    department: '',

    // New top-level specification and vendor order fields
    order_type: '',
    design_color: '',
    fabric: '',
    weaving_type: '',
    loom_type: '',
    fabric_type: '',
    reed: '',
    pick: '',
    warp_width: '',
    warp_ends: '',
    warp_meters: '',
    weft_meters: '',
    fabric_width: '',
    finished_width: '',
    wages_mtr_kgs: '',
    selected_count: '',
    merchandiser: '',
    certificate_type: '',

    cooly_mtr: 0,
    cooly_pick: 0,
    salvage_waste_pct: 0,
    no_repeat: '',
    crimp_pct: 0,
    shrinkage: '',
    v_order_mtrs: 0,
    min_mtrs: 0,
    delivery_at: '',
    warp_isu_mtrs: 0,
    warp_issued: false,
    delivery_command: '',

    tax_type: 'GST',
    taxable_value: 0,
    weaving_charge: 0,
    packing_charge: 0,
    loading_charge: 0,
    unloading_charge: 0,
    transport_charge: 0,
    other_charges: 0,
    cgst_pct: 2.5,
    cgst_amount: 0,
    sgst_pct: 2.5,
    sgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    round_off: 0,
    net_amount: 0,

    delivery_location: '',
    dispatch_mode: '',
    transport_name: '',
    vehicle_no: '',
    delivery_instructions: '',
    terms_conditions: [
      "Material not meeting our specification and standards will be returned",
      "Demanded Qty to be supplied in whole and excess/short supply will not be accepted.",
      "Send Invoice along with Material.",
      "Defective and damage pieces will not be accepted.",
      "Subject to Namakkal Jurisdiction."
    ],

    items: [{
      fabric_code: '', fabric_name: '', design_no: '', fabric_type: '', color: '', gsm: '', width: '', uom: 'MTRS', qty_mtrs: 0, rate_per_mtr: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);
  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);


  const generateNextPONo = (existingOrders) => {
    let maxNum = 0;
    const prefix = 'WP-';
    (existingOrders || []).forEach(o => {
      const poStr = o.po_no || '';
      if (poStr.toUpperCase().startsWith(prefix)) {
        const numPart = poStr.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(4, '0');
    return `${prefix}${padded}`;
  };

  const handleNewOrder = () => {
    const nextPONo = generateNextPONo(orders);
    setForm({
      ...initialForm,
      po_no: nextPONo
    });
    setShowForm(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes, dsRes] = await Promise.all([
        weavingPOAPI.list(),
        partyAPI.list(),
        dropdownAPI.getAll(),
        buyerOrderAPI.list(),
        designEntryAPI.list()
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setBuyerOrders(buyerOrdRes.data || []);
      setDesignEntries(dsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const recalculate = (updatedForm) => {
    const vOrderMtrs = parseFloat(updatedForm.v_order_mtrs) || 0;
    const coolyMtr = parseFloat(updatedForm.cooly_mtr) || 0;
    const computedWeavingCharge = parseFloat((vOrderMtrs * coolyMtr).toFixed(2));

    const updatedItems = (updatedForm.items || []).map((item, idx) => {
      let qty = parseFloat(item.qty_mtrs) || 0;
      let rate = parseFloat(item.rate_per_mtr) || 0;
      if (idx === 0) {
        if (vOrderMtrs > 0) qty = vOrderMtrs;
        if (coolyMtr > 0) rate = coolyMtr;
      }
      return { 
        ...item, 
        qty_mtrs: qty, 
        rate_per_mtr: rate, 
        amount: parseFloat((qty * rate).toFixed(2)) 
      };
    });

    const itemsAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const weavingCharge = computedWeavingCharge || parseFloat(updatedForm.weaving_charge) || 0;
    const packingCharge = parseFloat(updatedForm.packing_charge) || 0;
    const loadingCharge = parseFloat(updatedForm.loading_charge) || 0;
    const unloadingCharge = parseFloat(updatedForm.unloading_charge) || 0;
    const transportCharge = parseFloat(updatedForm.transport_charge) || 0;
    const otherCharges = parseFloat(updatedForm.other_charges) || 0;

    const taxableValue = itemsAmount + packingCharge + loadingCharge + unloadingCharge + transportCharge + otherCharges;
    const taxType = updatedForm.tax_type || 'GST';
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxType === 'GST') {
      cgstAmount = parseFloat(((cgstPct / 100) * taxableValue).toFixed(2));
      sgstAmount = parseFloat(((sgstPct / 100) * taxableValue).toFixed(2));
    } else if (taxType === 'IGST') {
      igstAmount = parseFloat(((igstPct / 100) * taxableValue).toFixed(2));
    }

    let netAmountRaw = taxableValue + cgstAmount + sgstAmount + igstAmount;
    const netAmountRounded = Math.round(netAmountRaw);
    const roundOff = parseFloat((netAmountRounded - netAmountRaw).toFixed(2));

    return {
      ...updatedForm,
      items: updatedItems,
      weaving_charge: weavingCharge,
      taxable_value: taxableValue,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      round_off: roundOff,
      net_amount: netAmountRounded
    };
  };

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm(recalculate({ ...form, [name]: checked }));
      return;
    }
    if (type === 'number') value = parseFloat(value) || 0;

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

    if (name === 'buyer_order_no') {
      const bo = buyerOrders.find(b => b.ibpo_number === value);
      const de = designEntries.find(d => d.ibpo_no === value || d.design_no === bo?.design_no);
      
      let yarnCountVal = '';
      if (de && de.yarn_details) {
        try {
          const parsedYarn = typeof de.yarn_details === 'string'
            ? JSON.parse(de.yarn_details)
            : de.yarn_details;
          if (Array.isArray(parsedYarn) && parsedYarn.length > 0) {
            yarnCountVal = parsedYarn[0].yarn_count || '';
          }
        } catch (err) {}
      }

      const updatedItems = [...form.items];
      if (updatedItems[0]) {
        updatedItems[0].design_no = de?.ds_ref_no || '';
        updatedItems[0].fabric_name = de?.fabric || '';
        updatedItems[0].gsm = de?.gsm || '';
        updatedItems[0].width = de?.gray_width || de?.fabric_width_grey || '';
      }

      setForm(recalculate({
        ...form,
        buyer_order_no: value,
        buyer_name: bo?.party_name || bo?.buyer_name || de?.buyer_name || form.buyer_name,
        design_no: de?.ds_ref_no || '',
        fabric: de?.fabric || form.fabric,
        weaving_type: de?.weaving_type || form.weaving_type,
        loom_type: de?.loom_type || form.loom_type,
        fabric_type: de?.fabric_type || form.fabric_type,
        reed: de?.reed || form.reed,
        pick: de?.pick_ot || de?.pick || form.pick,
        warp_width: de?.warp_width || form.warp_width,
        warp_ends: de?.total_ends || form.warp_ends,
        warp_meters: de?.warp_mtr || form.warp_meters,
        weft_meters: de?.weft_pro_mtr || form.weft_meters,
        fabric_width: de?.gray_width || de?.fabric_width_grey || form.fabric_width,
        finished_width: de?.finish_width || form.finished_width,
        selected_count: yarnCountVal || de?.count_rxpxw || form.selected_count,
        merchandiser: de?.buyer_name || form.merchandiser,
        items: updatedItems
      }));
      return;
    }

    if (name === 'design_no') {
      const de = designEntries.find(d => d.ds_ref_no === value || d.design_no === value);
      
      let yarnCountVal = '';
      if (de && de.yarn_details) {
        try {
          const parsedYarn = typeof de.yarn_details === 'string'
            ? JSON.parse(de.yarn_details)
            : de.yarn_details;
          if (Array.isArray(parsedYarn) && parsedYarn.length > 0) {
            yarnCountVal = parsedYarn[0].yarn_count || '';
          }
        } catch (err) {}
      }

      const updatedItems = [...form.items];
      if (updatedItems[0]) {
        updatedItems[0].design_no = value;
        updatedItems[0].fabric_name = de?.fabric || '';
        updatedItems[0].gsm = de?.gsm || '';
        updatedItems[0].width = de?.gray_width || de?.fabric_width_grey || '';
      }

      setForm(recalculate({
        ...form,
        design_no: value,
        buyer_name: de?.buyer_name || form.buyer_name,
        fabric: de?.fabric || form.fabric,
        weaving_type: de?.weaving_type || form.weaving_type,
        loom_type: de?.loom_type || form.loom_type,
        fabric_type: de?.fabric_type || form.fabric_type,
        reed: de?.reed || form.reed,
        pick: de?.pick_ot || de?.pick || form.pick,
        warp_width: de?.warp_width || form.warp_width,
        warp_ends: de?.total_ends || form.warp_ends,
        warp_meters: de?.warp_mtr || form.warp_meters,
        weft_meters: de?.weft_pro_mtr || form.weft_meters,
        fabric_width: de?.gray_width || de?.fabric_width_grey || form.fabric_width,
        finished_width: de?.finish_width || form.finished_width,
        selected_count: yarnCountVal || de?.count_rxpxw || form.selected_count,
        merchandiser: de?.buyer_name || form.merchandiser,
        items: updatedItems
      }));
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['qty_mtrs', 'rate_per_mtr', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
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

      // Convert string-based fields to actual string types
      const stringFields = [
        'po_no', 'supplier_weaver', 'supplier_code', 'buyer_name', 'remarks',
        'indent_no', 'sales_order_no', 'production_order_no', 'buyer_order_no',
        'department', 'order_type', 'design_color', 'fabric', 'weaving_type',
        'loom_type', 'fabric_type', 'reed', 'pick', 'warp_width', 'warp_ends',
        'warp_meters', 'weft_meters', 'fabric_width', 'finished_width',
        'wages_mtr_kgs', 'selected_count', 'merchandiser', 'certificate_type',
        'no_repeat', 'shrinkage', 'delivery_at'
      ];
      stringFields.forEach(field => {
        if (payload[field] !== undefined && payload[field] !== null) {
          payload[field] = String(payload[field]);
        }
      });

      if (payload.items) {
        const itemStringFields = ['fabric_code', 'fabric_name', 'design_no', 'fabric_type', 'color', 'gsm', 'width', 'uom'];
        payload.items = payload.items.map(item => {
          const newItem = { ...item };
          itemStringFields.forEach(field => {
            if (newItem[field] !== undefined && newItem[field] !== null) {
              newItem[field] = String(newItem[field]);
            }
          });
          return newItem;
        });
      }

      if (form.id) {
        await weavingPOAPI.update(form.id, payload);
      } else {
        await weavingPOAPI.create(payload);
      }
      setShowForm(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message));
    }
  };

  const handleEdit = (order) => {
    setForm(order);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await weavingPOAPI.delete(id);
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
      o.supplier_name || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit || '-',
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
      "Supplier": o.supplier_name || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit,
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
      o.supplier_weaver?.toLowerCase().includes(searchTerm.toLowerCase());

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
              <button className="btn btn-primary" onClick={handleNewOrder}>
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
              <input type="text" className="form-control" placeholder="Search PO or Weaver..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                  <th>SUPPLIER / WEAVER</th>
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
                      <td style={{ fontWeight: 500 }}>{order.supplier_weaver}</td>
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
          title="WEAVING PURCHASE ORDER"
          poNumber={selectedViewOrder?.po_no}
          poDate={selectedViewOrder?.po_date}
          deliveryAt={selectedViewOrder?.delivery_at || '1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008.'}
          supplierName={selectedViewOrder?.supplier_weaver}
          agentName=""
          designNo={selectedViewOrder?.design_no || selectedViewOrder?.against_ref || '-'}
          commission="0.00"
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
            transport: selectedViewOrder?.transport_name || selectedViewOrder?.dispatch_through || "-",
            delivery_date: selectedViewOrder?.delivery_date || "-",
            payment_terms: selectedViewOrder?.payment_terms || "-"
          }}
          designWiseDetails={`Fabric: ${selectedViewOrder?.fabric || '-'} | Weaving: ${selectedViewOrder?.weaving_type || '-'} | Loom: ${selectedViewOrder?.loom_type || '-'} | Fabric Type: ${selectedViewOrder?.fabric_type || '-'} | Reed: ${selectedViewOrder?.reed || '-'} | Pick: ${selectedViewOrder?.pick || '-'} | Warp Width: ${selectedViewOrder?.warp_width || '-'} | Warp Ends: ${selectedViewOrder?.warp_ends || '-'}`}
          colorWiseDetails={`Warp Mtrs: ${selectedViewOrder?.warp_meters || '-'} | Weft Mtrs: ${selectedViewOrder?.weft_meters || '-'} | Fab Width: ${selectedViewOrder?.fabric_width || '-'} | Fin Width: ${selectedViewOrder?.finished_width || '-'} | Count: ${selectedViewOrder?.selected_count || '-'} | Merchandiser: ${selectedViewOrder?.merchandiser || '-'} | Cert: ${selectedViewOrder?.certificate_type || '-'} | V-Order Mtrs: ${selectedViewOrder?.v_order_mtrs || '0'} | Min Mtrs: ${selectedViewOrder?.min_mtrs || '0'} | Cooly/Mtr: ${selectedViewOrder?.cooly_mtr || '0'} | Cooly/Pick: ${selectedViewOrder?.cooly_pick || '0'} | Salvage Waste: ${selectedViewOrder?.salvage_waste_pct || '0'}% | Crimp %: ${selectedViewOrder?.crimp_pct || '0'} | Shrinkage: ${selectedViewOrder?.shrinkage || '-'} | Repeat: ${selectedViewOrder?.no_repeat || '-'} | Warp Issued Mtrs: ${selectedViewOrder?.warp_isu_mtrs || '0'} | Warp Issued: ${selectedViewOrder?.warp_issued ? 'YES' : 'NO'}`}
          tableHeaders={[
            { label: 'Fabric Name', align: 'left', width: '30%' },
            { label: 'Color', align: 'left', width: '15%' },
            { label: 'GSM / Width', align: 'center', width: '15%' },
            { label: 'Qty Mtrs', align: 'right', width: '15%' },
            { label: 'Rate/Mtr', align: 'right', width: '10%' },
            { label: 'Amount', align: 'right', width: '15%' }
          ]}
          tableRows={(selectedViewOrder?.items || []).map(i => ({
            rowData: [
              i.fabric_name || '-',
              i.color || '-',
              `${i.gsm || '-'} / ${i.width || '-'}`,
              parseFloat(i.qty_mtrs || 0).toFixed(2),
              parseFloat(i.rate_per_mtr || 0).toFixed(2),
              parseFloat(i.amount || 0).toFixed(2)
            ],
            rowNote: i.fabric_code ? `Fabric Code: ${i.fabric_code} | Design No: ${i.design_no || '-'}` : null
          }))}
        />
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Edit2 size={20} color="var(--primary)" /> {form.id ? 'Edit' : 'Create'} {title}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              <button type="submit" form="weaving-po-form" className="btn btn-primary"><Save size={16} /> Save Order</button>
            </div>
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

          <form id="weaving-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
            {/* Section: Order Info */}
            <div id="section-info" className="animate-fade">
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>PO Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                <div className="form-group"><label>Order Type</label>
                  <select className="form-control" name="order_type" value={form.order_type || ''} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Against Buyer Order">Against Buyer Order</option>
                    <option value="Bulk Order">Bulk Order</option>
                    <option value="Repeat Order">Repeat Order</option>
                    <option value="Sample Order">Sample Order</option>
                  </select>
                </div>
                <div className="form-group"><label>Buyer Order No *</label>
                  <select className="form-control" name="buyer_order_no" value={form.buyer_order_no || ''} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {buyerOrders.map(bo => (
                      <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Supplier / Weaver</label>
                  <select className="form-control" name="supplier_weaver" value={form.supplier_weaver} onChange={handleChange}>
                    <option value="">Select Supplier...</option>
                    {parties.filter(p => p.party_type?.toLowerCase() === 'job worker' || p.party_type?.toLowerCase() === 'job work').map(p => (
                      <option key={p.id} value={p.company_name}>{p.company_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Supplier Code</label><input type="text" className="form-control" name="supplier_code" value={form.supplier_code} onChange={handleChange} /></div>
                <div className="form-group"><label>Delivery Date</label><input type="date" className="form-control" name="delivery_date" value={form.delivery_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Payment Terms</label><input type="text" className="form-control" name="payment_terms" value={form.payment_terms} onChange={handleChange} /></div>
                <div className="form-group"><label>Buyer Name</label><input type="text" className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    <option value="Active">Active</option><option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Remarks</label><input type="text" className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
              </div>
            </div>

            {/* Section: Reference Info */}
            <div id="section-ref" className="animate-fade" style={{ marginTop: 32 }}>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div className="form-group"><label>Indent No</label><input type="text" className="form-control" name="indent_no" value={form.indent_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Sales Order No</label><input type="text" className="form-control" name="sales_order_no" value={form.sales_order_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Production Order No</label><input type="text" className="form-control" name="production_order_no" value={form.production_order_no} onChange={handleChange} /></div>
                <div className="form-group"><label>Design No *</label>
                  <select className="form-control" name="design_no" value={form.design_no || ''} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {designEntries.map(de => (
                      <option key={de.id} value={de.ds_ref_no}>{de.ds_ref_no} ({de.design_no})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Department</label>
                  <select className="form-control" name="department" value={form.department} onChange={handleChange}>
                    <option value="">Select...</option>
                    {options.masters?.department?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Design & Loom Specifications */}
            <div id="section-design-specs" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Design & Loom Specifications</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group"><label>Fabric</label><input type="text" className="form-control" name="fabric" value={form.fabric || ''} onChange={handleChange} readOnly style={{ background: '#f5f5f5' }} /></div>
                <div className="form-group"><label>Weaving Type</label><input type="text" className="form-control" name="weaving_type" value={form.weaving_type || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Loom Type</label>
                  <select className="form-control" name="loom_type" value={form.loom_type || ''} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Airjet">Airjet</option>
                    <option value="Rapier">Rapier</option>
                    <option value="Shuttle">Shuttle</option>
                  </select>
                </div>
                <div className="form-group"><label>Fabric Type</label>
                  <select className="form-control" name="fabric_type" value={form.fabric_type || ''} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Grey">Grey</option>
                    <option value="Dyed">Dyed</option>
                    <option value="Yarn-Dyed">Yarn-Dyed</option>
                  </select>
                </div>
                <div className="form-group"><label>Warp Reed</label><input type="text" className="form-control" name="reed" value={form.reed || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Pick</label><input type="text" className="form-control" name="pick" value={form.pick || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Width (in)</label><input type="text" className="form-control" name="warp_width" value={form.warp_width || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Ends</label><input type="text" className="form-control" name="warp_ends" value={form.warp_ends || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Meters</label><input type="text" className="form-control" name="warp_meters" value={form.warp_meters || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Weft Meters</label><input type="text" className="form-control" name="weft_meters" value={form.weft_meters || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Fabric Width (in)</label><input type="text" className="form-control" name="fabric_width" value={form.fabric_width || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Finished Width (in)</label><input type="text" className="form-control" name="finished_width" value={form.finished_width || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Selected Count</label><input type="text" className="form-control" name="selected_count" value={form.selected_count || ''} onChange={handleChange} readOnly style={{ background: '#f5f5f5' }} /></div>
                <div className="form-group"><label>Merchandiser</label><input type="text" className="form-control" name="merchandiser" value={form.merchandiser || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Design Color</label><input type="text" className="form-control" name="design_color" value={form.design_color || ''} onChange={handleChange} /></div>
                <div className="form-group">
                  <label>Certificate Type</label>
                  <select className="form-control" name="certificate_type" value={form.certificate_type || ''} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="100% BCI Cotton">100% BCI Cotton</option>
                    <option value="100% Organic Cotton">100% Organic Cotton</option>
                    <option value="GOTS Certified">GOTS Certified</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Vendor Weaving Details */}
            <div id="section-vendor-details" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Vendor Weaving Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group"><label>V-Order Mtrs (Qty) *</label><input type="number" className="form-control" name="v_order_mtrs" value={form.v_order_mtrs || 0} onChange={handleChange} required /></div>
                <div className="form-group"><label>Min Mtrs</label><input type="number" className="form-control" name="min_mtrs" value={form.min_mtrs || 0} onChange={handleChange} /></div>
                <div className="form-group"><label>Cooly/Mtr (Rate) *</label><input type="number" step="0.01" className="form-control" name="cooly_mtr" value={form.cooly_mtr || 0} onChange={handleChange} required /></div>
                <div className="form-group"><label>Cooly/Pick</label><input type="number" step="0.01" className="form-control" name="cooly_pick" value={form.cooly_pick || 0} onChange={handleChange} /></div>
                <div className="form-group"><label>Salvage Waste %</label><input type="number" step="0.01" className="form-control" name="salvage_waste_pct" value={form.salvage_waste_pct || 0} onChange={handleChange} /></div>
                <div className="form-group"><label>Crimp %</label><input type="number" step="0.01" className="form-control" name="crimp_pct" value={form.crimp_pct || 0} onChange={handleChange} /></div>
                <div className="form-group"><label>Shrinkage %</label><input type="text" className="form-control" name="shrinkage" value={form.shrinkage || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>No of Repeat</label><input type="text" className="form-control" name="no_repeat" value={form.no_repeat || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Delivery At</label><input type="text" className="form-control" name="delivery_at" value={form.delivery_at || ''} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Issued Meters</label><input type="number" className="form-control" name="warp_isu_mtrs" value={form.warp_isu_mtrs || 0} onChange={handleChange} /></div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <input type="checkbox" id="warp_issued" name="warp_issued" checked={!!form.warp_issued} onChange={handleChange} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <label htmlFor="warp_issued" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>Warp Beam Issued</label>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Delivery Instructions / Command</label><textarea className="form-control" name="delivery_command" value={form.delivery_command || ''} onChange={handleChange} rows={2} /></div>
              </div>
            </div>



            {/* Section: Fabric Details */}
            <div id="section-items" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabric Details</h4>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Row</button>
              </div>
              <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                <table className="data-table" style={{ minWidth: '1300px' }}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Fabric Code</th>
                      <th>Fabric Name</th>
                      <th>Design No</th>
                      <th>Fabric Type</th>
                      <th>Color</th>
                      <th>GSM</th>
                      <th>Width</th>
                      <th>Qty (Mtrs)</th>
                      <th>Rate/Mtr</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.fabric_code} onChange={e => updateItem(idx, 'fabric_code', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ minWidth: 140, padding: 6, margin: 0 }} value={item.fabric_name} onChange={e => updateItem(idx, 'fabric_name', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.design_no} onChange={e => updateItem(idx, 'design_no', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 100, padding: 6, margin: 0 }} value={item.fabric_type} onChange={e => updateItem(idx, 'fabric_type', e.target.value)} /></td>
                        <td>
                          <select className="form-control" style={{ width: 120, padding: 6, margin: 0 }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)}>
                            <option value="">Select...</option>
                            {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td><input type="text" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.gsm} onChange={e => updateItem(idx, 'gsm', e.target.value)} /></td>
                        <td><input type="text" className="form-control" style={{ width: 80, padding: 6, margin: 0 }} value={item.width} onChange={e => updateItem(idx, 'width', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 90, padding: 6, margin: 0 }} value={item.qty_mtrs} onChange={e => updateItem(idx, 'qty_mtrs', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 90, padding: 6, margin: 0 }} value={item.rate_per_mtr} onChange={e => updateItem(idx, 'rate_per_mtr', e.target.value)} /></td>
                        <td><input type="number" className="form-control" style={{ width: 100, padding: 6, margin: 0, background: '#f1f5f9', fontWeight: 'bold' }} value={item.amount} disabled /></td>
                        <td><button type="button" className="icon-btn" onClick={() => removeItem(idx)} style={{ color: 'red' }}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(form.terms_conditions || []).map((term, idx) => (
                          <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {editingTermIdx === idx ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13, border: '1px solid var(--primary)' }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); } }} />
                                <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={14} /></button>
                                <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingTermIdx(null)}><X size={14} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span>{term}</span>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm({ ...form, terms_conditions: form.terms_conditions.filter((_, i) => i !== idx) })} title="Delete"><Trash2 size={13} /></button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input type="text" className="form-control" placeholder="Add new term or condition..." style={{ margin: 0 }} value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTerm())} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={addTerm}>
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ORDER SUMMARY */}
                <div style={{ width: 350, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ORDER SUMMARY</span>
                    </div>
                    <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Taxable Value</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>INR {(form.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Weaving Charge</span>
                        <input
                          type="number"
                          name="weaving_charge"
                          value={form.weaving_charge}
                          onChange={handleChange}
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Packing Charge</span>
                        <input
                          type="number"
                          name="packing_charge"
                          value={form.packing_charge}
                          onChange={handleChange}
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading Charge</span>
                        <input
                          type="number"
                          name="loading_charge"
                          value={form.loading_charge}
                          onChange={handleChange}
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Unloading Charge</span>
                        <input
                          type="number"
                          name="unloading_charge"
                          value={form.unloading_charge}
                          onChange={handleChange}
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Transport Charge</span>
                        <input
                          type="number"
                          name="transport_charge"
                          value={form.transport_charge}
                          onChange={handleChange}
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Other Charges</span>
                        <input
                          type="number"
                          name="other_charges"
                          value={form.other_charges}
                          onChange={handleChange}
                          style={{
                            width: '100px',
                            textAlign: 'right',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            background: 'transparent'
                          }}
                        />
                      </div>

                      {(form.tax_type === 'GST' || !form.tax_type) && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST ({form.cgst_pct || 0}%)</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST ({form.sgst_pct || 0}%)</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}

                      {form.tax_type === 'IGST' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST ({form.igst_pct || 0}%)</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Round Off</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.round_off?.toFixed(2)}</span>
                      </div>

                      <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Net Amount</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>  </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
