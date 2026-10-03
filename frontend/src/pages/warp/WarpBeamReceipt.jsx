import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Columns, ArrowDownToLine, Layers, Download, ChevronDown, FileText, ArrowLeft } from 'lucide-react';
import { warpBeamReceiptAPI, partyAPI, warpDeliveryAPI } from '../../services/api';
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

export default function WarpBeamReceipt() {
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [warpDeliveries, setWarpDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    warp_delivery_no: '',
    ref_no: '', rcvd_date: new Date().toISOString().split('T')[0],
    rcvd_type: 'Direct', beam_type: '', party_name: '',
    design_no: '', order_no: '', color: '', warp_count: '', warp_ends: 0,
    warp_meters: 0, set_no: '', siz_dc_no: '', siz_dc_date: new Date().toISOString().split('T')[0],
    status: 'Received',
    beams: [{
      beam_no: '', warp_mtrs: 0, beam_type: '', delivery_to_weaver: '',
      order_no: '', dc_no: '', dc_date: new Date().toISOString().split('T')[0],
      loom_no: '', loading_date: new Date().toISOString().split('T')[0], total_meters: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [res, partRes, delvRes] = await Promise.all([
        warpBeamReceiptAPI.list(), partyAPI.list(), warpDeliveryAPI.list()
      ]);
      setReceipts(res.data);
      setParties(partRes.data);
      setWarpDeliveries(delvRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleFetchFromWarpDelivery = async (dcNo) => {
    if (!dcNo) {
      setForm(prev => ({ ...prev, warp_delivery_no: '' }));
      return;
    }
    const selectedDelv = warpDeliveries.find(d => d.dc_no === dcNo);
    if (!selectedDelv) return;

    try {
      const { data } = await warpDeliveryAPI.get(selectedDelv.id);
      setForm(prev => {
        const newForm = { ...prev };
        newForm.warp_delivery_no = dcNo;
        newForm.siz_dc_no = dcNo;
        newForm.ref_no = `WR-${dcNo}`;
        newForm.siz_dc_date = data.dc_date ? data.dc_date.substring(0, 10) : prev.siz_dc_date;
        newForm.party_name = data.party_name || prev.party_name;
        newForm.design_no = data.design_no || prev.design_no;
        newForm.order_no = data.order_no || prev.order_no;
        newForm.warp_count = data.yarn_count || prev.warp_count;
        newForm.warp_ends = parseInt(data.warp_ends) || prev.warp_ends;
        newForm.warp_meters = parseFloat(data.total_meters) || prev.warp_meters;
        newForm.set_no = data.set_id || prev.set_no;
        newForm.beam_type = data.items?.[0]?.beam_type || prev.beam_type;

        // Auto-fill beams grid from delivery items
        if (data.items && data.items.length > 0) {
          newForm.beams = data.items.map(item => ({
            beam_no: item.beam_no || '',
            warp_mtrs: parseFloat(item.warp_mtrs) || 0,
            beam_type: item.beam_type || 'Warping',
            delivery_to_weaver: item.loom_no || '',
            order_no: data.order_no || '',
            dc_no: dcNo,
            dc_date: data.dc_date ? data.dc_date.substring(0, 10) : new Date().toISOString().split('T')[0],
            loom_no: item.loom_no || '',
            loading_date: new Date().toISOString().split('T')[0],
            total_meters: parseFloat(item.warp_mtrs) || 0
          }));
        }

        return newForm;
      });
    } catch (err) {
      console.error(err);
      alert("Error fetching warp delivery details.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      delete payload.warp_delivery_no;
      
      const dateFields = ['rcvd_date', 'siz_dc_date'];
      dateFields.forEach(field => {
        if (!payload[field] || payload[field] === '') {
          payload[field] = null;
        }
      });
      
      if (editingId) {
        await warpBeamReceiptAPI.update(editingId, payload);
      } else {
        await warpBeamReceiptAPI.create(payload);
      }
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving receipt');
    }
  };

  const handleOpenNewForm = () => {
    setEditingId(null);
    setIsReadOnly(false);
    let maxNum = 0;
    receipts.forEach(r => {
      if (r.ref_no && r.ref_no.toUpperCase().startsWith("WBR-")) {
        const parts = r.ref_no.split("-");
        if (parts.length > 1) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    const nextRefNo = `WBR-${String(maxNum + 1).padStart(5, '0')}`;
    setForm({
      ...initialForm,
      ref_no: nextRefNo,
      rcvd_date: new Date().toISOString().split('T')[0],
      siz_dc_date: new Date().toISOString().split('T')[0]
    });
    setActiveTab('general');
    setShowForm(true);
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await warpBeamReceiptAPI.get(entry.id);
      if (data.rcvd_date) data.rcvd_date = data.rcvd_date.substring(0, 10);
      if (data.siz_dc_date) data.siz_dc_date = data.siz_dc_date.substring(0, 10);

      data.beams = data.beams.map(b => ({
        ...b,
        dc_date: b.dc_date ? b.dc_date.substring(0, 10) : '',
        loading_date: b.loading_date ? b.loading_date.substring(0, 10) : ''
      }));

      setForm({ ...initialForm, ...data, warp_delivery_no: data.siz_dc_no || '' });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('general');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading details.");
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

  const handleDelete = async (id, inv, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${inv}?`)) {
      try {
        await warpBeamReceiptAPI.delete(id);
        setSelectedIds(prev => prev.filter(item => item !== id));
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected receipt(s)?`)) {
      try {
        await Promise.all(selectedIds.map(id => warpBeamReceiptAPI.delete(id)));
        setSelectedIds([]);
        if (selectedViewEntry && selectedIds.includes(selectedViewEntry.id)) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting selected receipts');
        console.error(err);
        loadData();
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await warpBeamReceiptAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    
    if (name === 'warp_delivery_no') {
      handleFetchFromWarpDelivery(value);
      return;
    }
    
    setForm({ ...form, [name]: value });
  };

  const addItem = () => setForm({ ...form, beams: [...form.beams, initialForm.beams[0]] });
  const removeItem = (index) => setForm({ ...form, beams: form.beams.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const newItems = [...form.beams];
    let val = value;
    if (['warp_mtrs', 'total_meters'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;
    setForm({ ...form, beams: newItems });
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.party_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All Types' || r.rcvd_type === typeFilter;

    let matchesDate = true;
    if (r.rcvd_date) {
      const entryDate = new Date(r.rcvd_date);
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
    doc.text("Handloom ERP - Warp Beam Receipts", 14, 15);
    const headers = [["Ref No", "Rcvd Date", "Party Name", "Type", "Status"]];
    const rows = filteredReceipts.map(r => [
      r.ref_no || '-',
      r.rcvd_date || '-',
      r.party_name || '-',
      r.rcvd_type || '-',
      r.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Warp_Beam_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredReceipts.map(r => ({
      "Ref No": r.ref_no,
      "Rcvd Date": r.rcvd_date,
      "Rcvd Type": r.rcvd_type,
      "Beam Type": r.beam_type,
      "Party Name": r.party_name,
      "Design No": r.design_no,
      "Order No": r.order_no,
      "Warp Meters": r.warp_meters,
      "Status": r.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warp Beam Receipts");
    XLSX.writeFile(wb, `Warp_Beam_Receipts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Columns size={24} color="var(--primary)" /> Warp Beam Receipt
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage sizing deliveries and warp beam receipts.</p>
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
                <Plus size={18} /> New Receipt
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setTypeFilter('All Types')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon purple"><ArrowDownToLine size={24} /></div>
              <div className="stat-details"><h3>Total Receipts</h3><div className="value">{receipts.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Direct')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon emerald"><ArrowDownToLine size={24} /></div>
              <div className="stat-details"><h3>Direct</h3><div className="value">{receipts.filter(r => r.rcvd_type === 'Direct').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Against Order')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon amber"><ArrowDownToLine size={24} /></div>
              <div className="stat-details"><h3>Against Order</h3><div className="value">{receipts.filter(r => r.rcvd_type === 'Against Order').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search Ref No or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Direct</option><option>Against Order</option>
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
                  {selectedIds.length} warp beam receipt{selectedIds.length > 1 ? 's' : ''} selected
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
                          checked={filteredReceipts.length > 0 && selectedIds.length === filteredReceipts.length}
                          onChange={() => toggleSelectAll(filteredReceipts)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                      </th>
                      <th>Ref No</th><th>Date</th><th>Party</th><th>Type</th><th>Total Mtrs</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredReceipts.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No receipts found.</td></tr>
                    ) : filteredReceipts.map(r => (
                      <tr key={r.id} onClick={() => handleRowClick(r)} style={{ cursor: 'pointer', background: selectedIds.includes(r.id) ? 'rgba(239, 68, 68, 0.05)' : selectedViewEntry?.id === r.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }} onClick={evt => evt.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={(evt) => toggleSelectRow(r.id, evt)}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.ref_no}</td>
                        <td>{r.rcvd_date}</td>
                        <td style={{ fontWeight: 500 }}>{r.party_name || '-'}</td>
                        <td><span className={`badge ${r.rcvd_type === 'Direct' ? 'badge-completed' : 'badge-active'}`}>{r.rcvd_type}</span></td>
                        <td>{parseFloat(r.warp_meters || 0).toFixed(2)}</td>
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
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(r.id, r.ref_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
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
            title="WARP BEAM RECEIPT"
            documentNumber={selectedViewEntry?.ref_no}
            status={selectedViewEntry?.status || 'Active'}
            sections={selectedViewEntry ? [
              {
                title: "GENERAL INFO",
                icon: "FileText",
                type: "grid",
                data: [
                  { label: "Ref No", value: selectedViewEntry.ref_no },
                  { label: "Received Date", value: selectedViewEntry.rcvd_date },
                  { label: "Party Name", value: selectedViewEntry.party_name || '-' },
                  { label: "Type", value: selectedViewEntry.rcvd_type }
                ]
              },
              {
                title: "WARP DETAILS",
                icon: "Layers",
                type: "grid",
                data: [
                  { label: "Total Warp Meters", value: selectedViewEntry.warp_meters },
                  { label: "Design No", value: selectedViewEntry.design_no || '-' },
                  { label: "Order No", value: selectedViewEntry.order_no || '-' }
                ]
              },
              {
                title: "BEAMS INFO",
                icon: "Columns",
                type: "table",
                headers: ["Beam No", "Warp Mtrs", "Type", "Loom"],
                rows: (selectedViewEntry.beams || []).map(b => [
                  b.beam_no || '-',
                  b.warp_mtrs || 0,
                  b.beam_type || '-',
                  b.loom_no || '-'
                ])
              }
            ] : []}
          />
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Warp Beam Details' : editingId ? 'Edit Warp Beam' : 'New Warp Beam Receipt'}</h2>
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
              <FileText size={18} /> Receipt Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>

                <div className="animate-fade">
                  {/* Section 1: Top Section Fields */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Top Section Fields</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>WARP DELIVERY NO (Auto-fill Base)</label>
                      <select className="form-control" name="warp_delivery_no" value={form.warp_delivery_no || ''} onChange={handleChange}>
                        <option value="" disabled hidden>Select Warp Delivery...</option>
                        {warpDeliveries.filter(d => d.dc_no).map(d => (
                          <option key={d.id} value={d.dc_no}>{d.dc_no} ({d.party_name || 'No Party'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Rcvd Date</label><input type="date" className="form-control" name="rcvd_date" value={form.rcvd_date} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Rcvd Type</label>
                      <select className="form-control" name="rcvd_type" value={form.rcvd_type} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Beam Type</label><input className="form-control" name="beam_type" value={form.beam_type} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="">Select Party...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>

                    <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Order No</label><input className="form-control" name="order_no" value={form.order_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Color</label><input className="form-control" name="color" value={form.color} onChange={handleChange} /></div>
                    <div className="form-group"><label>Warp Count</label><input className="form-control" name="warp_count" value={form.warp_count} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Warp Ends</label><input type="number" className="form-control" name="warp_ends" value={form.warp_ends} onChange={handleChange} /></div>
                    <div className="form-group"><label>Warp Meters</label><input type="number" className="form-control" name="warp_meters" value={form.warp_meters} onChange={handleChange} /></div>
                    <div className="form-group"><label>Set No</label><input className="form-control" name="set_no" value={form.set_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Siz DC No</label><input className="form-control" name="siz_dc_no" value={form.siz_dc_no} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Siz DC Date</label><input type="date" className="form-control" name="siz_dc_date" value={form.siz_dc_date} onChange={handleChange} /></div>
                  </div>

                  {/* Section 2: Warp Beam Details */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Warp Beam Details</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Row</button>
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Beam No</th><th>Warp Mtrs</th><th>Type</th><th>Delivery To Weaver</th>
                          <th>Order No</th><th>DC No</th><th>DC Date</th><th>Loom No</th><th>Loading Date</th><th>Total Meters</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.beams.map((item, idx) => (
                          <tr key={idx}>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.beam_no} onChange={e => updateItem(idx, 'beam_no', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.warp_mtrs} onChange={e => updateItem(idx, 'warp_mtrs', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.beam_type} onChange={e => updateItem(idx, 'beam_type', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 140, padding: '6px' }} value={item.delivery_to_weaver} onChange={e => updateItem(idx, 'delivery_to_weaver', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.order_no} onChange={e => updateItem(idx, 'order_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.dc_no} onChange={e => updateItem(idx, 'dc_no', e.target.value)} /></td>
                            <td><input type="date" className="form-control" style={{ width: 120, padding: '6px' }} value={item.dc_date} onChange={e => updateItem(idx, 'dc_date', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.loom_no} onChange={e => updateItem(idx, 'loom_no', e.target.value)} /></td>
                            <td><input type="date" className="form-control" style={{ width: 120, padding: '6px' }} value={item.loading_date} onChange={e => updateItem(idx, 'loading_date', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.total_meters} onChange={e => updateItem(idx, 'total_meters', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            </fieldset>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Close
              </button>
              {!isReadOnly && (
                <button type="button" className="btn btn-primary" onClick={handleCreate}>
                  <Save size={16} /> {editingId ? 'Update Receipt' : 'Save Receipt'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
