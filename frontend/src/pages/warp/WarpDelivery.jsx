import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Truck, Package, Factory, Download, ChevronDown, FileText, CheckCircle } from 'lucide-react';
import { warpDeliveryAPI, partyAPI, warpingSizingPOAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import A4DocumentPreview from '../../components/A4DocumentPreview';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function WarpDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [parties, setParties] = useState([]);
  const [warpingSizingPOs, setWarpingSizingPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Terms state
  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    po_no_base: '',
    dc_no: '', ref_no: '', dc_date: new Date().toISOString().split('T')[0], delivery_type: 'Direct',
    sizing_name: '', party_name: '', entry_type: '', bpo_no: '', design_no: '', order_no: '',
    address: '', set_id: '', warp_ends: 0, yarn_count: '', vendor_po_no: '', po_date: new Date().toISOString().split('T')[0],
    order_mtrs: 0, with_crimp: '', delivered_mtrs: 0, transport: '', vehicle_no: '',
    
    party_po_no: '', delivery_time: '', driver_name: '', mobile_no: '', lr_no: '',
    
    total_beams: 0, total_meters: 0, total_exptd_mtrs: 0, balance_meters: 0,
    remarks: '', status: 'Delivered',
    
    terms_conditions: [],
    gross_amt: 0,
    tax_type: '',
    cgst_pct: 0,
    cgst_amount: 0,
    sgst_pct: 0,
    sgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    net_amount: 0,

    items: [{
      beam_no: '', beam_type: '', yarn_count: '', warp_ends: 0, reed_width: 0,
      warp_mtrs: 0, weight_kgs: 0, loom_no: '', remarks: '', beam_status: ''
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [delvRes, partRes, poRes] = await Promise.all([
        warpDeliveryAPI.list(), partyAPI.list(), warpingSizingPOAPI.list()
      ]);
      setDeliveries(delvRes.data);
      setParties(partRes.data);
      setWarpingSizingPOs(poRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const addTerm = () => {
    if (newTerm.trim()) {
      setForm({ ...form, terms_conditions: [...(form.terms_conditions || []), newTerm.trim()] });
      setNewTerm('');
    }
  };

  const removeTerm = (index) => {
    setForm({ ...form, terms_conditions: (form.terms_conditions || []).filter((_, i) => i !== index) });
  };

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      delete payload.po_no_base;
      delete payload.dyed_yarn_receipt_no;
      
      const dateFields = ['dc_date', 'po_date'];
      dateFields.forEach(field => {
        if (!payload[field] || payload[field] === '') {
          payload[field] = null;
        }
      });
      
      if (editingId) {
        await warpDeliveryAPI.update(editingId, payload);
      } else {
        await warpDeliveryAPI.create(payload);
      }
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving delivery');
    }
  };
 
  const handleOpenNewForm = () => {
    setEditingId(null);
    setIsReadOnly(false);
    let maxNum = 0;
    deliveries.forEach(d => {
      if (d.dc_no && d.dc_no.toUpperCase().startsWith("WD-")) {
        const parts = d.dc_no.split("-");
        if (parts.length > 1) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    const nextDcNo = `WD-${String(maxNum + 1).padStart(5, '0')}`;
    setForm({
      ...initialForm,
      dc_no: nextDcNo,
      dc_date: new Date().toISOString().split('T')[0],
      po_date: new Date().toISOString().split('T')[0]
    });
    setActiveTab('general');
    setShowForm(true);
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await warpDeliveryAPI.get(entry.id);
      if (data.dc_date) data.dc_date = data.dc_date.substring(0, 10);
      if (data.po_date) data.po_date = data.po_date.substring(0, 10);

      setForm({ ...initialForm, ...data, po_no_base: data.vendor_po_no || '' });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('general');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading details.");
    }
  };

  const handleDelete = async (id, inv, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${inv}?`)) {
      try {
        await warpDeliveryAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await warpDeliveryAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchFromWarpingSizingPO = (poNo) => {
    if (!poNo) {
      setForm(prev => ({ ...prev, po_no_base: poNo }));
      return;
    }
    const po = warpingSizingPOs.find(p => p.po_no === poNo);
    if (po) {
      setForm(prev => {
        const newForm = { ...prev, po_no_base: poNo, ref_no: poNo };
        newForm.party_name = po.supplier_job_worker || prev.party_name;
        newForm.sizing_name = po.supplier_job_worker || prev.sizing_name;
        newForm.order_no = po.order_no || prev.order_no;
        newForm.bpo_no = po.buyer_order_no || po.order_no || prev.bpo_no;
        newForm.design_no = po.design_no || prev.design_no;
        newForm.vendor_po_no = po.po_no || prev.vendor_po_no;
        newForm.po_date = po.po_date || prev.po_date;
        newForm.warp_ends = parseInt(po.warp_ends) || prev.warp_ends;
        newForm.yarn_count = po.selected_count || prev.yarn_count;
        newForm.order_mtrs = parseFloat(po.warp_meters) || prev.order_mtrs;
        newForm.remarks = po.remarks || prev.remarks;
        
        // Fetch financial info
        newForm.terms_conditions = po.terms_conditions || [];
        newForm.gross_amt = parseFloat(po.gross_amt) || 0;
        newForm.tax_type = po.tax_type || '';
        newForm.cgst_pct = parseFloat(po.cgst_pct) || 0;
        newForm.cgst_amount = parseFloat(po.cgst_amount) || 0;
        newForm.sgst_pct = parseFloat(po.sgst_pct) || 0;
        newForm.sgst_amount = parseFloat(po.sgst_amount) || 0;
        newForm.igst_pct = parseFloat(po.igst_pct) || 0;
        newForm.igst_amount = parseFloat(po.igst_amount) || 0;
        newForm.net_amount = parseFloat(po.net_amount) || 0;
        
        // Calculate items
        const newItems = [];
        let beamCounter = 1;
        let totalBeams = 0;
        
        if (po.items && po.items.length > 0) {
          po.items.forEach(poItem => {
            const noOfBeams = parseInt(poItem.no_of_beam) || 1;
            totalBeams += noOfBeams;
            for (let i = 0; i < noOfBeams; i++) {
              newItems.push({
                beam_no: `${po.po_no}-B${beamCounter++}`,
                beam_type: po.beam_type || 'Warping',
                yarn_count: poItem.yarn_count || po.selected_count || '',
                warp_ends: parseInt(po.warp_ends) || 0,
                reed_width: parseFloat(po.warp_width) || 0,
                warp_mtrs: po.warp_meters ? (parseFloat(po.warp_meters) / noOfBeams) : 0,
                weight_kgs: po.total_beam_kgs ? (parseFloat(po.total_beam_kgs) / noOfBeams) : 0,
                loom_no: '',
                beam_status: 'Delivered',
                remarks: ''
              });
            }
          });
        }
        
        if (newItems.length === 0) {
          totalBeams = 1;
          newItems.push({
            beam_no: `${po.po_no}-B1`,
            beam_type: po.beam_type || 'Warping',
            yarn_count: po.selected_count || '',
            warp_ends: parseInt(po.warp_ends) || 0,
            reed_width: parseFloat(po.warp_width) || 0,
            warp_mtrs: parseFloat(po.warp_meters) || 0,
            weight_kgs: parseFloat(po.total_beam_kgs) || 0,
            loom_no: '',
            beam_status: 'Delivered',
            remarks: ''
          });
        }
        
        newForm.total_beams = totalBeams;
        newForm.items = newItems;
        
        // Sum total warp meters
        newForm.total_meters = newItems.reduce((acc, curr) => acc + (curr.warp_mtrs || 0), 0);
        newForm.delivered_mtrs = newForm.total_meters;
        newForm.balance_meters = Math.max(0, newForm.order_mtrs - newForm.delivered_mtrs);
        
        return newForm;
      });
    } else {
      setForm(prev => ({ ...prev, po_no_base: poNo }));
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    
    if (name === 'po_no_base') {
      handleFetchFromWarpingSizingPO(value);
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
      setForm(prev => recalculate({ ...prev, ...taxUpdates }));
      return;
    }

    if (['gross_amt', 'cgst_pct', 'sgst_pct', 'igst_pct'].includes(name)) {
      setForm(prev => recalculate({ ...prev, [name]: value }));
      return;
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['warp_mtrs', 'warp_ends', 'reed_width', 'weight_kgs'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;
    setForm({ ...form, items: newItems });
  };

  const filteredDeliveries = deliveries.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.dc_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.party_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All Types' || r.delivery_type === typeFilter;

    let matchesDate = true;
    if (r.dc_date) {
      const entryDate = new Date(r.dc_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesType && matchesDate;
  });

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Warp Deliveries", 14, 15);
    const headers = [["DC No", "DC Date", "Vendor Name", "Delivery Type", "Total Mtrs", "Status"]];
    const rows = filteredDeliveries.map(r => [
      r.dc_no || '-',
      r.dc_date || '-',
      r.party_name || '-',
      r.delivery_type || '-',
      parseFloat(r.total_meters || 0).toFixed(2),
      r.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Warp_Deliveries_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDeliveries.map(r => ({
      "DC No": r.dc_no,
      "DC Date": r.dc_date,
      "Vendor Name": r.party_name,
      "Delivery Type": r.delivery_type,
      "Sizing Name": r.sizing_name,
      "Order No": r.order_no,
      "Total Mtrs": r.total_meters,
      "Total Beams": r.total_beams,
      "Status": r.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warp Deliveries");
    XLSX.writeFile(wb, `Warp_Deliveries_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={24} color="var(--primary)" /> Warp Delivery Entry
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage and dispatch warp beams to weavers.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={16} /> Export <ChevronDown size={14} />
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
                      style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Download size={16} color="#10b981" /> Excel Sheet
                    </button>
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={handleOpenNewForm}>
                <Plus size={18} /> New Delivery
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setTypeFilter('All Types')} style={{ cursor: 'pointer', border: typeFilter === 'All Types' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon purple"><Truck size={24} /></div>
              <div className="stat-details"><h3>Total Deliveries</h3><div className="value">{deliveries.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Direct')} style={{ cursor: 'pointer', border: typeFilter === 'Direct' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon emerald"><Truck size={24} /></div>
              <div className="stat-details"><h3>Direct Delivery</h3><div className="value">{deliveries.filter(r => r.delivery_type === 'Direct').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Against Order')} style={{ cursor: 'pointer', border: typeFilter === 'Against Order' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon amber"><Truck size={24} /></div>
              <div className="stat-details"><h3>Against Order</h3><div className="value">{deliveries.filter(r => r.delivery_type === 'Against Order').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search DC No or Vendor..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Direct</option><option>Against Order</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DC No</th><th>Date</th><th>Vendor Name</th><th>Type</th><th>Total Mtrs</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredDeliveries.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No deliveries found.</td></tr>
                    ) : filteredDeliveries.map(r => (
                      <tr key={r.id} onClick={() => handleRowClick(r)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === r.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.dc_no}</td>
                        <td>{r.dc_date}</td>
                        <td style={{ fontWeight: 500 }}>{r.party_name || '-'}</td>
                        <td><span className={`badge ${r.delivery_type === 'Direct' ? 'badge-completed' : 'badge-active'}`}>{r.delivery_type}</span></td>
                        <td>{parseFloat(r.total_meters || 0).toFixed(2)}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setSelectedViewEntry(r)}
                              title="Full View"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(r, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(r.id, r.dc_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
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
            isOpen={!!selectedViewEntry}
            onClose={() => setSelectedViewEntry(null)}
            title="WARP DELIVERY"
            documentNumber={selectedViewEntry?.dc_no}
            status={selectedViewEntry?.status || 'Delivered'}
            onDownloadPdf={() => alert('PDF Export functionality to be implemented')}
            sections={selectedViewEntry ? [
              {
                title: "GENERAL INFO",
                icon: "FileText",
                type: "grid",
                data: [
                  { label: "DC No", value: selectedViewEntry.dc_no },
                  { label: "DC Date", value: selectedViewEntry.dc_date },
                  { label: "Vendor", value: selectedViewEntry.party_name || '-' },
                  { label: "Delivery Type", value: selectedViewEntry.delivery_type }
                ]
              },
              {
                title: "DELIVERY DETAILS",
                icon: "Truck",
                type: "grid",
                data: [
                  { label: "Total Mtrs", value: selectedViewEntry.total_meters },
                  { label: "Order No", value: selectedViewEntry.order_no || '-' },
                  { label: "Vehicle No", value: selectedViewEntry.vehicle_no || '-' }
                ]
              },
              {
                title: "BEAMS INFO",
                icon: "Package",
                type: "table",
                headers: ["Beam No", "Type", "Yarn", "Ends", "Reed", "Mtrs", "Wt (Kg)", "Loom", "Status"],
                rows: (selectedViewEntry.items || []).map(b => [
                  b.beam_no || '-',
                  b.beam_type || '-',
                  b.yarn_count || '-',
                  b.warp_ends || 0,
                  b.reed_width || 0,
                  b.warp_mtrs || 0,
                  b.weight_kgs || 0,
                  b.loom_no || '-',
                  b.beam_status || '-'
                ])
              }
            ] : []}
          />
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Delivery Details' : editingId ? 'Edit Delivery' : 'New Warp Delivery'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}</button>
              )}
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
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FileText size={18} /> Delivery Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>

                <div className="animate-fade">
                  {/* Section 1: Top Section Fields */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Top Section Fields</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>PO NO (Auto-fill Base)</label>
                      <select className="form-control" name="po_no_base" value={form.po_no_base || ''} onChange={handleChange}>
                        <option value="" disabled hidden>Select PO...</option>
                        {warpingSizingPOs.filter(p => p.po_no).map(p => <option key={p.id} value={p.po_no}>{p.po_no} ({p.supplier_job_worker || p.party_name || 'No Vendor'})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Dely Type</label>
                      <select className="form-control" name="delivery_type" value={form.delivery_type} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>DC Date</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} /></div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Sizing Name</label><input className="form-control" name="sizing_name" value={form.sizing_name} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="">Select Party...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>

                    <div className="form-group"><label>Entry Type</label><input className="form-control" name="entry_type" value={form.entry_type} onChange={handleChange} /></div>
                    <div className="form-group"><label>BPO No</label><input className="form-control" name="bpo_no" value={form.bpo_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Order No</label><input className="form-control" name="order_no" value={form.order_no} onChange={handleChange} /></div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Address</label><input className="form-control" name="address" value={form.address} onChange={handleChange} /></div>
                    <div className="form-group"><label>SET ID (No.)</label><input className="form-control" name="set_id" value={form.set_id} onChange={handleChange} /></div>
                    <div className="form-group"><label>Warp Ends</label><input type="number" className="form-control" name="warp_ends" value={form.warp_ends} onChange={handleChange} /></div>

                    <div className="form-group"><label>Yarn Count</label><input className="form-control" name="yarn_count" value={form.yarn_count} onChange={handleChange} /></div>
                    <div className="form-group"><label>Vendor PO No</label><input className="form-control" name="vendor_po_no" value={form.vendor_po_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>PO Date</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Party PO No</label><input className="form-control" name="party_po_no" value={form.party_po_no} onChange={handleChange} /></div>

                    <div className="form-group"><label>Order Mtrs</label><input type="number" className="form-control" name="order_mtrs" value={form.order_mtrs} onChange={handleChange} /></div>
                    <div className="form-group"><label>With Crimp</label><input className="form-control" name="with_crimp" value={form.with_crimp} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivered Mtrs</label><input type="number" className="form-control" name="delivered_mtrs" value={form.delivered_mtrs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Balance Mtrs</label><input type="number" className="form-control" name="balance_meters" value={form.balance_meters} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Total Beams</label><input type="number" className="form-control" name="total_beams" value={form.total_beams} onChange={handleChange} /></div>
                    <div className="form-group"><label>Transport</label><input className="form-control" name="transport" value={form.transport} onChange={handleChange} /></div>
                    <div className="form-group"><label>Vehicle No</label><input className="form-control" name="vehicle_no" value={form.vehicle_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Driver Name</label><input className="form-control" name="driver_name" value={form.driver_name} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Mobile No</label><input className="form-control" name="mobile_no" value={form.mobile_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>LR No / Challan No</label><input className="form-control" name="lr_no" value={form.lr_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Time</label><input type="time" className="form-control" name="delivery_time" value={form.delivery_time} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total Warp Mtrs</label><input type="number" className="form-control" name="total_meters" value={form.total_meters} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Total Exptd Mtrs</label><input type="number" className="form-control" name="total_exptd_mtrs" value={form.total_exptd_mtrs} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                  </div>

                  {/* Section 2: Table Section (Beams) */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Table Section (Beams)</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Beam</button>
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Beam No</th><th>Beam Type</th><th>Yarn Count</th><th>Warp Ends</th><th>Reed Width</th>
                          <th>Warp Mtrs</th><th>Weight (Kgs)</th><th>Loom No</th><th>Beam Status</th><th>Remarks</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.beam_no} onChange={e => updateItem(idx, 'beam_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.beam_type} onChange={e => updateItem(idx, 'beam_type', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.warp_ends} onChange={e => updateItem(idx, 'warp_ends', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.reed_width} onChange={e => updateItem(idx, 'reed_width', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.warp_mtrs} onChange={e => updateItem(idx, 'warp_mtrs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.weight_kgs} onChange={e => updateItem(idx, 'weight_kgs', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.loom_no} onChange={e => updateItem(idx, 'loom_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.beam_status} onChange={e => updateItem(idx, 'beam_status', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 140, padding: '6px' }} value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 3: Terms & Conditions & Order Summary */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Terms & Summary</h4>
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
                                    {!isReadOnly && (
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--primary)' }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }}><Edit2 size={14} /></button>
                                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#ef4444' }} onClick={() => removeTerm(idx)}><Trash2 size={14} /></button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                          {!isReadOnly && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <input type="text" className="form-control" placeholder="Add new term or condition..." style={{ margin: 0 }} value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTerm())} />
                              <button type="button" className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={addTerm}>
                                <Plus size={16} /> Add
                              </button>
                            </div>
                          )}
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
                              disabled={isReadOnly}
                              style={{
                                width: '120px',
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
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Tax Type</span>
                            <select 
                              name="tax_type" 
                              value={form.tax_type || ''} 
                              onChange={handleChange}
                              disabled={isReadOnly}
                              style={{
                                width: '120px',
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

                          {(form.tax_type === 'GST') && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                                  <input type="number" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} disabled={isReadOnly} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                                  <input type="number" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} disabled={isReadOnly} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </>
                          )}

                          {form.tax_type === 'IGST' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                                  <input type="number" name="igst_pct" value={form.igst_pct} onChange={handleChange} disabled={isReadOnly} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>Net Amount</span>
                            <span style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 800 }}>₹{(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
