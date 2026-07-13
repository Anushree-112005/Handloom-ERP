import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, FileText, Layers, IndianRupee, Factory, Download, Table, ArrowLeft } from 'lucide-react';
import { warpingSizingPOAPI, partyAPI, dropdownAPI, buyerOrderAPI, designEntryAPI } from '../../services/api';
import CustomPODocumentPreview from '../../components/CustomPODocumentPreview';

export default function WarpingSizingPO() {
  const title = 'Warping / Sizing PO';
  const description = 'Manage warping and sizing purchase orders';
  const Icon = Factory;

  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeSection, setActiveSection] = useState('info');
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);

  const initialForm = {
    org_name: '', ref_no_1: '', ref_no_2: '', order_no: '', order_date: new Date().toISOString().split('T')[0],
    completion_date: '', order_type: '', party_name: '',
    design_no: '', beam_type: '', fabric: '',
    reed: '', pick: '', warp_width: '', warp_ends: '',
    warp_meters: '', weft_meters: '', fabric_width: '', finished_width: '',
    wages_input: '', wages_type: '', selected_count: '',
    merchandiser: '', payment_terms: '', certificate_type: '', loom_type: '',
    items: [{ weaver_name: '', no_of_beam: '' }],
    yarn_items: [],
    tax_type: '', gross_amt: 0, cgst_pct: 0, cgst_amount: 0, sgst_pct: 0, sgst_amount: 0, igst_pct: 0, igst_amount: 0,
    remarks: '', total_beam_kgs: '', net_amount: 0,
    terms_conditions: [
      "Material not meeting our specification and standards will be returned",
      "Demanded Qty to be supplied in whole and excess/short supply will not be accepted.",
      "Send Invoice along with Material.",
      "Defective and damage pieces will not be accepted.",
      "Start bulk production only after getting the sample Approval.",
      "Subject to Namakkal Jurisdiction."
    ]
  };

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, partRes, dropRes, buyerOrdRes, dsRes] = await Promise.all([
        warpingSizingPOAPI.list(),
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
    const grossAmt = parseFloat(updatedForm.gross_amt) || 0;
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;
    const cgstAmount = parseFloat(((cgstPct / 100) * grossAmt).toFixed(2));
    const sgstAmount = parseFloat(((sgstPct / 100) * grossAmt).toFixed(2));
    const igstAmount = parseFloat(((igstPct / 100) * grossAmt).toFixed(2));
    const netAmount = grossAmt + cgstAmount + sgstAmount + igstAmount;
    return { ...updatedForm, cgst_amount: cgstAmount, sgst_amount: sgstAmount, igst_amount: igstAmount, net_amount: netAmount };
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
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

    if (name === 'order_no') {
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
        } catch (e) {
          console.error("Error parsing yarn_details", e);
        }
      }

      setForm(recalculate({
        ...form,
        order_no: value,
        party_name: form.party_name,
        design_no: de?.ds_ref_no || form.design_no,
        fabric: de?.fabric || form.fabric,
        reed: de?.reed || form.reed,
        pick: de?.pick_ot || de?.pick || form.pick,
        warp_width: de?.warp_width || form.warp_width,
        warp_ends: de?.total_ends || form.warp_ends,
        warp_meters: de?.warp_mtr || form.warp_meters,
        weft_meters: de?.weft_pro_mtr || form.weft_meters,
        fabric_width: de?.gray_width || de?.fabric_width_grey || form.fabric_width,
        finished_width: de?.finish_width || form.finished_width,
        selected_count: yarnCountVal || de?.count_rxpxw || form.selected_count,
        merchandiser: de?.buyer_name || form.merchandiser
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
        } catch (e) {
          console.error("Error parsing yarn_details", e);
        }
      }
      setForm(recalculate({
        ...form,
        design_no: value,
        fabric: de?.fabric || form.fabric,
        reed: de?.reed || form.reed,
        pick: de?.pick_ot || de?.pick || form.pick,
        warp_width: de?.warp_width || form.warp_width,
        warp_ends: de?.total_ends || form.warp_ends,
        warp_meters: de?.warp_mtr || form.warp_meters,
        weft_meters: de?.weft_pro_mtr || form.weft_meters,
        fabric_width: de?.gray_width || de?.fabric_width_grey || form.fabric_width,
        finished_width: de?.finish_width || form.finished_width,
        selected_count: yarnCountVal || de?.count_rxpxw || form.selected_count,
        merchandiser: de?.buyer_name || form.merchandiser
      }));
      return;
    }

    if (name === 'beam_type') {
      const selectedType = value;
      const de = designEntries.find(d => d.ds_ref_no === form.design_no || d.design_no === form.design_no);
      
      let newYarnItems = [];
      if (de && selectedType) {
        let warpSummary = [];
        let weftSummary = [];
        try {
          warpSummary = de.warp_summary ? JSON.parse(de.warp_summary) : [];
        } catch (e) {}
        try {
          weftSummary = de.weft_summary ? JSON.parse(de.weft_summary) : [];
        } catch (e) {}

        const matchedWarp = warpSummary.filter(item => item.beam_type?.toLowerCase() === selectedType.toLowerCase());
        const matchedWeft = weftSummary.filter(item => item.beam_type?.toLowerCase() === selectedType.toLowerCase());
        const combined = [...matchedWarp, ...matchedWeft];

        newYarnItems = combined.map(item => {
          const isWarp = item.beam_type?.toLowerCase().startsWith('warp');
          const warpMtrsVal = isWarp ? (form.warp_meters || de.warp_mtr || 0) : (form.weft_meters || de.weft_pro_mtr || 0);
          return {
            yarn_count: item.count || item.yarn_count || '',
            shade: item.color || item.shade || '',
            uom: 'Cone',
            yarn_code: String(item.total_ends || item.ends || 0),
            qty_kg: item.req_kg || 0,
            lot_no: String(warpMtrsVal),
            yarn_type: item.beam_type || selectedType
          };
        });
      }

      setForm(recalculate({
        ...form,
        beam_type: selectedType,
        yarn_items: newYarnItems
      }));
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['no_of_beam'].includes(field)) val = parseFloat(value) || 0;
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

  const handleInsertBeamType = () => {
    if (!form.beam_type) {
      alert("Please select a Beam Type first");
      return;
    }
    
    const de = designEntries.find(d => d.ds_ref_no === form.design_no || d.design_no === form.design_no);
    if (!de) {
      alert("Please select a Design No first");
      return;
    }

    let warpSummary = [];
    let weftSummary = [];
    try {
      warpSummary = de.warp_summary ? JSON.parse(de.warp_summary) : [];
    } catch (e) {}
    try {
      weftSummary = de.weft_summary ? JSON.parse(de.weft_summary) : [];
    } catch (e) {}

    const matchedWarp = warpSummary.filter(item => item.beam_type?.toLowerCase() === form.beam_type.toLowerCase());
    const matchedWeft = weftSummary.filter(item => item.beam_type?.toLowerCase() === form.beam_type.toLowerCase());
    const combined = [...matchedWarp, ...matchedWeft];

    if (combined.length === 0) {
      alert(`No items found for Beam Type "${form.beam_type}" in Design Entry`);
      return;
    }

    const newYarnItems = combined.map(item => {
      const isWarp = item.beam_type?.toLowerCase().startsWith('warp');
      const warpMtrsVal = isWarp ? (form.warp_meters || de.warp_mtr || 0) : (form.weft_meters || de.weft_pro_mtr || 0);
      return {
        yarn_count: item.count || item.yarn_count || '',
        shade: item.color || item.shade || '',
        uom: 'Cone',
        yarn_code: String(item.total_ends || item.ends || 0),
        qty_kg: item.req_kg || 0,
        lot_no: String(warpMtrsVal),
        yarn_type: item.beam_type || form.beam_type
      };
    });

    setForm(prev => ({
      ...prev,
      yarn_items: [...(prev.yarn_items || []), ...newYarnItems]
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.delivery_date) payload.delivery_date = null;
      payload.supplier_job_worker = form.party_name;

      payload.items = [
        ...(form.yarn_items || []).map(yi => ({
          yarn_count: yi.yarn_count,
          shade: yi.shade,
          uom: yi.uom || 'Cone',
          yarn_code: yi.yarn_code,
          qty_kg: yi.qty_kg || 0,
          lot_no: yi.lot_no,
          yarn_type: yi.yarn_type,
          weaver_name: '',
          no_of_beam: 0
        })),
        ...(form.items || []).filter(wi => wi.weaver_name).map(wi => ({
          yarn_count: '',
          shade: '',
          uom: '',
          yarn_code: '',
          qty_kg: 0,
          lot_no: '',
          yarn_type: '',
          weaver_name: wi.weaver_name,
          no_of_beam: wi.no_of_beam
        }))
      ];

      if (form.id) {
        await warpingSizingPOAPI.update(form.id, payload);
      } else {
        await warpingSizingPOAPI.create(payload);
      }
      setShowForm(false);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert("Error saving order: " + (err.response?.data?.detail ? JSON.stringify(err.response.data.detail) : err.message));
    }
  };

  const handleEdit = (order) => {
    const wItems = (order.items || []).filter(i => i.weaver_name && !i.yarn_count);
    const yItems = (order.items || []).filter(i => i.yarn_count);
    setForm({
      ...order,
      items: wItems.length > 0 ? wItems : [{ weaver_name: '', no_of_beam: '' }],
      yarn_items: yItems.map(yi => ({
        yarn_count: yi.yarn_count || '',
        shade: yi.shade || '',
        uom: yi.uom || 'Cone',
        yarn_code: yi.yarn_code || '0',
        qty_kg: yi.qty_kg || 0,
        lot_no: yi.lot_no || '0',
        yarn_type: yi.yarn_type || 'Warp Beam1'
      }))
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await warpingSizingPOAPI.delete(id);
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
      o.party_name || o.supplier_name || o.supplier_job_worker || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit || '-',
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
      "Supplier": o.party_name || o.supplier_name || o.supplier_job_worker || o.supplier_worker || o.supplier_dyeing_unit || o.supplier_weaver || o.supplier_processing_unit || '-',
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
      (o.party_name || o.supplier_job_worker || '')?.toLowerCase().includes(searchTerm.toLowerCase());

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

  const selectedDesignForBeamTypes = designEntries.find(
    d => d.ds_ref_no === form.design_no || d.design_no === form.design_no
  );
  let beamTypeOptions = [];
  if (selectedDesignForBeamTypes) {
    try {
      const warpSum = typeof selectedDesignForBeamTypes.warp_summary === 'string'
        ? JSON.parse(selectedDesignForBeamTypes.warp_summary)
        : selectedDesignForBeamTypes.warp_summary || [];
      const weftSum = typeof selectedDesignForBeamTypes.weft_summary === 'string'
        ? JSON.parse(selectedDesignForBeamTypes.weft_summary)
        : selectedDesignForBeamTypes.weft_summary || [];
      
      const types = new Set();
      if (Array.isArray(warpSum)) {
        warpSum.forEach(item => {
          if (item.beam_type) types.add(item.beam_type);
        });
      }
      if (Array.isArray(weftSum)) {
        weftSum.forEach(item => {
          if (item.beam_type) types.add(item.beam_type);
        });
      }
      beamTypeOptions = Array.from(types);
    } catch (e) {
      console.error("Error parsing design summaries for beam types", e);
    }
  }
  const displayBeamTypes = beamTypeOptions.length > 0 ? beamTypeOptions : ['Warp Beam1', 'Warp Beam2', 'Weft'];

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
              <button className="btn btn-primary" onClick={() => { setForm(initialForm); setShowForm(true); }}>
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
                  <th>SUPPLIER / JOB WORKER</th>
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
                      <td style={{ fontWeight: 500 }}>{order.party_name || order.supplier_job_worker || '-'}</td>
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
          title="WARPING / SIZING PO"
          poNumber={selectedViewOrder?.po_no}
          poDate={selectedViewOrder?.po_date}
          deliveryAt="1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008."
          supplierName={selectedViewOrder?.party_name || selectedViewOrder?.supplier_job_worker || '-'}
          agentName=""
          designNo={selectedViewOrder?.sales_order_no || '-'}
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
            transport: "-",
            delivery_date: selectedViewOrder?.delivery_date || "-",
            payment_terms: selectedViewOrder?.payment_terms || "-"
          }}
          tableHeaders={[
            { label: 'Yarn Name', align: 'left', width: '25%' },
            { label: 'Count / Type', align: 'center', width: '15%' },
            { label: 'Lot / Shade', align: 'left', width: '15%' },
            { label: 'Qty (Kg)', align: 'right', width: '15%' },
            { label: 'Rate/Kg', align: 'right', width: '10%' },
            { label: 'Amount', align: 'right', width: '20%' }
          ]}
          tableRows={(selectedViewOrder?.items || []).map(i => ({
            rowData: [
              i.yarn_name || '-',
              `${i.yarn_count || '-'} / ${i.yarn_type || '-'}`,
              `${i.lot_no || '-'} / ${i.shade || '-'}`,
              parseFloat(i.qty_kg || 0).toFixed(2),
              parseFloat(i.rate_per_kg || 0).toFixed(2),
              parseFloat(i.amount || 0).toFixed(2)
            ],
            rowNote: i.yarn_code ? `Yarn Code: ${i.yarn_code}` : null
          }))}
        />
      ) : (
        <div className="card">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => setShowForm(false)} 
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

          <form id="warping-sizing-po-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>
            {/* Section: Order Info */}
            <div id="section-info" className="animate-fade">
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Order No *</label>
                  <select className="form-control" name="order_no" value={form.order_no} onChange={handleChange} required>
                    <option value="">Select Order...</option>
                    {buyerOrders.map(bo => (
                      <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Order Date</label><input type="date" className="form-control" name="order_date" value={form.order_date} onChange={handleChange} required /></div>

                <div className="form-group"><label>Completion Date</label><input type="date" className="form-control" name="completion_date" value={form.completion_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Order Type</label>
                  <select className="form-control" name="order_type" value={form.order_type} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Against SP No.">Against SP No.</option>
                    <option value="Direct">Direct</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                  <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                    <option value="">Select...</option>
                    {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                  </select>
                </div>

                <div className="form-group"><label>Design No *</label>
                  <select className="form-control" name="design_no" value={form.design_no} onChange={handleChange} required>
                    <option value="">Select Design...</option>
                    {designEntries.map(de => (
                      <option key={de.id} value={de.ds_ref_no}>{de.ds_ref_no} ({de.design_no})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Beam Type</label>
                  <select className="form-control" name="beam_type" value={form.beam_type} onChange={handleChange}>
                    <option value="">Select...</option>
                    {displayBeamTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Fabric</label><input type="text" className="form-control" name="fabric" value={form.fabric} onChange={handleChange} /></div>

                <div className="form-group"><label>Reed</label><input type="text" className="form-control" name="reed" value={form.reed} onChange={handleChange} /></div>
                <div className="form-group"><label>Pick</label><input type="text" className="form-control" name="pick" value={form.pick} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Width</label><input type="text" className="form-control" name="warp_width" value={form.warp_width} onChange={handleChange} /></div>
                <div className="form-group"><label>Warp Ends</label><input type="text" className="form-control" name="warp_ends" value={form.warp_ends} onChange={handleChange} /></div>

                <div className="form-group"><label>Warp Meters</label><input type="text" className="form-control" name="warp_meters" value={form.warp_meters} onChange={handleChange} /></div>
                <div className="form-group"><label>Weft Meters</label><input type="text" className="form-control" name="weft_meters" value={form.weft_meters} onChange={handleChange} /></div>
                <div className="form-group"><label>Fabric Width</label><input type="text" className="form-control" name="fabric_width" value={form.fabric_width} onChange={handleChange} /></div>
                <div className="form-group"><label>Finished Width</label><input type="text" className="form-control" name="finished_width" value={form.finished_width} onChange={handleChange} /></div>

                <div className="form-group"><label>Wages / Mtr / Kgs</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" className="form-control" name="wages_input" value={form.wages_input} onChange={handleChange} style={{ width: '50%' }} />
                    <select className="form-control" name="wages_type" value={form.wages_type} onChange={handleChange} style={{ width: '50%' }}>
                      <option value="">Select...</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Selected Count</label><input type="text" className="form-control" name="selected_count" value={form.selected_count} onChange={handleChange} /></div>

                <div className="form-group"><label>Merchandiser</label><input type="text" className="form-control" name="merchandiser" value={form.merchandiser} onChange={handleChange} /></div>
                <div className="form-group"><label>Payment Terms</label><input type="text" className="form-control" name="payment_terms" value={form.payment_terms} onChange={handleChange} /></div>
                <div className="form-group"><label>Certificate Type</label>
                  <select className="form-control" name="certificate_type" value={form.certificate_type} onChange={handleChange}>
                    <option value="">Select...</option>
                  </select>
                </div>
                <div className="form-group"><label>Loom Type</label>
                  <select className="form-control" name="loom_type" value={form.loom_type} onChange={handleChange}>
                    <option value="">Select...</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tables for Sizing / Warping Yarn Details and Weaver Details stacked vertically (one-by-one) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 32 }}>
              {/* Sizing/Warping Yarn Details */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Sizing / Warping Yarn Details</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      yarn_items: [...(prev.yarn_items || []), { yarn_count: '', shade: '', uom: 'Cone', yarn_code: '0', qty_kg: 0, lot_no: '0', yarn_type: 'Warp Beam1' }]
                    }));
                  }}><Plus size={14} /> Add Row</button>
                </div>
                <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                  <table className="data-table" style={{ minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Yarn Count</th>
                        <th>Color</th>
                        <th>Unit</th>
                        <th>Tot Ends</th>
                        <th>Tot Kgs</th>
                        <th>Warp Mtrs</th>
                        <th>Warp Type</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.yarn_items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: 12 }} 
                              value={item.yarn_count} 
                              onChange={e => {
                                const updated = [...form.yarn_items];
                                updated[idx].yarn_count = e.target.value;
                                setForm({ ...form, yarn_items: updated });
                              }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: 12 }} 
                              value={item.shade} 
                              onChange={e => {
                                const updated = [...form.yarn_items];
                                updated[idx].shade = e.target.value;
                                setForm({ ...form, yarn_items: updated });
                              }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: 12, width: 60 }} 
                              value={item.uom} 
                              onChange={e => {
                                const updated = [...form.yarn_items];
                                updated[idx].uom = e.target.value;
                                setForm({ ...form, yarn_items: updated });
                              }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: 12, width: 70 }} 
                              value={item.yarn_code} 
                              onChange={e => {
                                const updated = [...form.yarn_items];
                                updated[idx].yarn_code = e.target.value;
                                setForm({ ...form, yarn_items: updated });
                              }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: 12, width: 80 }} 
                              value={item.qty_kg} 
                              onChange={e => {
                                const updated = [...form.yarn_items];
                                updated[idx].qty_kg = parseFloat(e.target.value) || 0;
                                setForm({ ...form, yarn_items: updated });
                              }} 
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: 12, width: 80 }} 
                              value={item.lot_no} 
                              onChange={e => {
                                const updated = [...form.yarn_items];
                                updated[idx].lot_no = e.target.value;
                                setForm({ ...form, yarn_items: updated });
                              }} 
                            />
                          </td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ margin: 0, padding: '4px 8px', fontSize: 12 }} 
                              value={item.yarn_type} 
                              onChange={e => {
                                const updated = [...form.yarn_items];
                                updated[idx].yarn_type = e.target.value;
                                setForm({ ...form, yarn_items: updated });
                              }}
                            >
                              <option value="Warp Beam1">Warp Beam1</option>
                              <option value="Warp Beam2">Warp Beam2</option>
                              <option value="Weft">Weft</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="icon-btn" 
                              style={{ color: 'red' }} 
                              onClick={() => {
                                const updated = form.yarn_items.filter((_, i) => i !== idx);
                                setForm({ ...form, yarn_items: updated });
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Weaver Details */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Weaver Details</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Weaver</button>
                </div>
                <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                  <table className="data-table" style={{ minWidth: '400px' }}>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Weaver Name</th>
                        <th>No.of Beam</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <select className="form-control" style={{ margin: 0 }} value={item.weaver_name} onChange={e => updateItem(idx, 'weaver_name', e.target.value)}>
                              <option value="">Select...</option>
                              {parties.filter(p => p.party_type?.toLowerCase() === 'job worker').map(p => (
                                <option key={p.id} value={p.company_name}>{p.company_name}</option>
                              ))}
                            </select>
                          </td>
                          <td><input type="number" className="form-control" style={{ width: 120, margin: 0 }} value={item.no_of_beam} onChange={e => updateItem(idx, 'no_of_beam', e.target.value)} /></td>
                          <td><button type="button" className="icon-btn" onClick={() => removeItem(idx)} style={{ color: 'red' }}><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section: Tax & Logistics */}
            <div id="section-tax" className="animate-fade" style={{ marginTop: 32 }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                                <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13, border: '1px solid var(--primary)' }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}} />
                                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'green' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={16} /></button>
                                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }} onClick={() => setEditingTermIdx(null)}><X size={16} /></button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <span>{term}</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--primary)' }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }}><Edit2 size={14} /></button>
                                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#ef4444' }} onClick={() => removeTerm(idx)}><Trash2 size={14} /></button>
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Gross Amount</span>
                        <input 
                          type="number" 
                          name="gross_amt" 
                          value={form.gross_amt} 
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Beam / Kgs</span>
                        <input 
                          type="text" 
                          name="total_beam_kgs" 
                          value={form.total_beam_kgs} 
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Remarks</span>
                        <input 
                          type="text" 
                          name="remarks" 
                          value={form.remarks} 
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

                      <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Tax Type</span>
                        <select 
                          name="tax_type" 
                          value={form.tax_type} 
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
                        >
                          <option value="">Select...</option>
                          <option value="GST">GST</option>
                          <option value="IGST">IGST</option>
                          <option value="Exempt">Exempt</option>
                        </select>
                      </div>

                      {(form.tax_type === 'GST' || !form.tax_type) && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                              <input type="number" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                              <input type="number" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}

                      {form.tax_type === 'IGST' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                            <input type="number" name="igst_pct" value={form.igst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Net Amount</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
