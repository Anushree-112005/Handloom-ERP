import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Palette, Users, FileText, Layers, CheckSquare, Download, ChevronDown } from 'lucide-react';
import { designEntryAPI, partyAPI, employeeAPI, buyerOrderAPI, subMasterAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function DesignEntry() {
  const [entries, setEntries] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [colorMasters, setColorMasters] = useState([]);
  const [yarnCountMasters, setYarnCountMasters] = useState([]);
  const [yarnRows, setYarnRows] = useState([]);
  const [fabricDesignRows, setFabricDesignRows] = useState([]);
  const [newYarnRow, setNewYarnRow] = useState({
    type: 'Warp',
    yarn_count: '',
    act_count: '',
    ends: '',
    crimp_pct: ''
  });
  const [newFabricDesignRow, setNewFabricDesignRow] = useState({
    type: 'Warp',
    yarn_count: '',
    color: '',
    threads: '',
    times: '1',
    line: '',
    pick: '',
    drawing_order: '',
    dents: '',
    line_val: '',
    ends_for_dents: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showPatternModal, setShowPatternModal] = useState(false);

  const addYarnRow = () => {
    if (!newYarnRow.yarn_count) {
      alert("Please select a yarn count.");
      return;
    }
    setYarnRows([...yarnRows, { ...newYarnRow, id: Date.now() }]);
    setNewYarnRow({
      type: 'Warp',
      yarn_count: '',
      act_count: '',
      ends: '',
      crimp_pct: ''
    });
  };

  const deleteYarnRow = (idx) => {
    setYarnRows(yarnRows.filter((_, i) => i !== idx));
  };

  const addFabricDesignRow = () => {
    if (!newFabricDesignRow.yarn_count) {
      alert("Please select a yarn count.");
      return;
    }
    setFabricDesignRows([...fabricDesignRows, { ...newFabricDesignRow, id: Date.now() }]);
    setNewFabricDesignRow({
      type: 'Warp',
      yarn_count: '',
      color: '',
      threads: '',
      times: '1',
      line: '',
      pick: '',
      drawing_order: '',
      dents: '',
      line_val: '',
      ends_for_dents: ''
    });
  };

  const deleteFabricDesignRow = (idx) => {
    setFabricDesignRows(fabricDesignRows.filter((_, i) => i !== idx));
  };
  
  // Filters
  const [fabricFilter, setFabricFilter] = useState('All Fabrics');
  const [weavingFilter, setWeavingFilter] = useState('All Weaves');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    ds_date: new Date().toISOString().split('T')[0],
    design_no: '', color: '', created_by: '', gry_const: '', count_rxpxw: '',
    buyer_name: '', ibpo_no: '', order_mtr: 0, ex_mtr: 0, total_mtr: 0,
    crimp_pct: 0, skg_pct: 0, warp_mtr: 0, weft_pro_mtr: 0, gray_width: 0,
    finish_width: 0, reed_ol: 0, pick_ot: 0, reed: 0, fabric: 'Cotton',
    total_ends: 0, warp_width: 0, qlm: 0, toie_pct: 0, selvage_waste: 0,
    weaving: 'Plain', design_type: 'Normal', packing_less: 0, weight_grm: 0, dyeing_loss_pct: 0
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [entriesRes, partiesRes, empRes, ordRes, colorRes, countRes] = await Promise.all([
        designEntryAPI.list(),
        partyAPI.list(),
        employeeAPI.list(),
        buyerOrderAPI.list(),
        subMasterAPI.list('color_master').catch(() => ({ data: [] })),
        subMasterAPI.list('yarn_count_master').catch(() => ({ data: [] }))
      ]);
      setEntries(entriesRes.data);
      setBuyers(partiesRes.data.filter(p => p.party_type === 'Sales Party'));
      setEmployees(empRes.data);
      setOrders(ordRes.data);
      setColorMasters(colorRes.data || []);
      setYarnCountMasters(countRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUploadImageOnly = async () => {
    if (!selectedFile) {
      alert("Please choose a file first");
      return;
    }
    if (!editingId) {
      alert("Please save the design entry first before uploading an image directly, or the image will be uploaded automatically when you click Save Design.");
      return;
    }
    try {
      const res = await designEntryAPI.uploadImage(editingId, selectedFile);
      alert("Image uploaded successfully!");
      setImagePreviewUrl(res.data.image_path);
      loadData();
    } catch (err) {
      alert("Failed to upload image.");
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        yarn_details: JSON.stringify(yarnRows),
        fabric_design_details: JSON.stringify(fabricDesignRows)
      };
      let savedEntry = null;
      if (editingId) {
        const res = await designEntryAPI.update(editingId, payload);
        savedEntry = res.data;
      } else {
        const res = await designEntryAPI.create(payload);
        savedEntry = res.data;
      }

      if (selectedFile && savedEntry && savedEntry.id) {
        await designEntryAPI.uploadImage(savedEntry.id, selectedFile);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      setSelectedFile(null);
      setImagePreviewUrl(null);
      setYarnRows([]);
      setFabricDesignRows([]);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving design entry');
      console.error(err);
    }
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await designEntryAPI.get(entry.id);
      if (data.ds_date) data.ds_date = data.ds_date.substring(0, 10);
      
      let yDetails = [];
      let fdDetails = [];
      try {
        if (data.yarn_details) yDetails = JSON.parse(data.yarn_details);
      } catch (e) {}
      try {
        if (data.fabric_design_details) fdDetails = JSON.parse(data.fabric_design_details);
      } catch (e) {}
      
      setYarnRows(yDetails);
      setFabricDesignRows(fdDetails);
      setImagePreviewUrl(data.image_path || null);
      setSelectedFile(null);

      setForm({ ...initialForm, ...data });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('basic');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading details.");
    }
  };

  const handleDelete = async (id, ds_ref, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${ds_ref}?`)) {
      try {
        await designEntryAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await designEntryAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;

    if (name === 'ibpo_no') {
      if (!value) {
        setForm(prev => ({
          ...prev,
          ibpo_no: '',
          buyer_name: '',
          design_no: '',
          color: '',
          gry_const: '',
          fabric: 'Cotton',
          weaving: 'Plain',
          pick_ot: 0,
          finish_width: 0,
          order_mtr: 0,
          ex_mtr: 0,
          total_mtr: 0,
          reed: 0
        }));
        return;
      }
      const selectedOrder = orders.find(o => o.ibpo_number === value);
      if (selectedOrder) {
        const firstItem = selectedOrder.items?.[0] || {};
        const ordMtr = firstItem.order_mtrs || 0;
        const exMtr = 0;
        setForm(prev => ({
          ...prev,
          ibpo_no: value,
          buyer_name: selectedOrder.party_name || selectedOrder.buyer_name || prev.buyer_name,
          design_no: firstItem.design_no || prev.design_no,
          color: firstItem.color || prev.color,
          gry_const: firstItem.gry_construction || prev.gry_const,
          fabric: firstItem.fabric_type || prev.fabric,
          weaving: firstItem.weaving_type || prev.weaving,
          pick_ot: firstItem.pick_on_table || prev.pick_ot,
          finish_width: firstItem.finish_width || prev.finish_width,
          order_mtr: ordMtr,
          ex_mtr: exMtr,
          total_mtr: ordMtr + exMtr,
          reed: firstItem.finish_reed || prev.reed,
        }));
        return;
      }
    }

    if (name === 'order_mtr') {
      setForm(prev => ({
        ...prev,
        order_mtr: value,
        total_mtr: value + prev.ex_mtr
      }));
      return;
    }
    if (name === 'ex_mtr') {
      setForm(prev => ({
        ...prev,
        ex_mtr: value,
        total_mtr: prev.order_mtr + value
      }));
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setActiveTab(nextTab);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 100);
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = searchTerm === '' ||
      e.ds_ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.design_no?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFabric = fabricFilter === 'All Fabrics' || (e.fabric || 'Cotton') === fabricFilter;
    const matchesWeaving = weavingFilter === 'All Weaves' || (e.weaving || 'Plain') === weavingFilter;
    const matchesType = typeFilter === 'All Types' || (e.design_type || 'Normal') === typeFilter;
    
    let matchesDate = true;
    if (e.ds_date) {
      const entryDate = new Date(e.ds_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesFabric && matchesWeaving && matchesType && matchesDate;
  });

  const totalDesigns = entries.length;
  const cottonDesigns = entries.filter(e => e.fabric === 'Cotton').length;
  const polyesterDesigns = entries.filter(e => e.fabric === 'Polyester').length;
  const specialDesigns = entries.filter(e => e.design_type === 'Special').length;

  const handleCardClick = (type) => {
    setFabricFilter('All Fabrics');
    setWeavingFilter('All Weaves');
    setTypeFilter('All Types');
    if (type === 'Cotton') setFabricFilter('Cotton');
    if (type === 'Polyester') setFabricFilter('Polyester');
    if (type === 'Special') setTypeFilter('Special');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Design Entry Report", 14, 15);
    const headers = [["DS Ref No", "Date", "Design No", "Buyer", "Fabric", "Weaving"]];
    const rows = filteredEntries.map(e => [
      e.ds_ref_no || '-',
      e.ds_date || '-',
      e.design_no || '-',
      e.buyer_name || '-',
      e.fabric || '-',
      e.weaving || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Design_Entries_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredEntries.map(e => ({
      "DS Ref No": e.ds_ref_no,
      "DS Date": e.ds_date,
      "Design No": e.design_no,
      "Buyer": e.buyer_name,
      "Fabric": e.fabric,
      "Weaving": e.weaving,
      "Design Type": e.design_type,
      "Created By": e.created_by
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Design Entries");
    XLSX.writeFile(wb, `Design_Entries_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={24} color="var(--primary)" /> Design Entry
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage design specifications and weaving details.</p>
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
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setIsReadOnly(false); setActiveTab('basic'); setShowForm(true); setYarnRows([]); setFabricDesignRows([]); setSelectedFile(null); setImagePreviewUrl(null); }}>
                <Plus size={16} /> New Design
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', border: fabricFilter === 'All Fabrics' && typeFilter === 'All Types' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Palette size={24} /></div>
              <div className="stat-details"><h3>Total Designs</h3><div className="value">{totalDesigns}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Cotton')} style={{ cursor: 'pointer', border: fabricFilter === 'Cotton' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Cotton Fabric</h3><div className="value">{cottonDesigns}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Polyester')} style={{ cursor: 'pointer', border: fabricFilter === 'Polyester' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Layers size={24} /></div>
              <div className="stat-details"><h3>Polyester Fabric</h3><div className="value">{polyesterDesigns}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Special')} style={{ cursor: 'pointer', border: typeFilter === 'Special' ? '2px solid #8b5cf6' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><CheckSquare size={24} /></div>
              <div className="stat-details"><h3>Special Designs</h3><div className="value">{specialDesigns}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search by DS Ref or Design No..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span></div>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={fabricFilter} onChange={e => setFabricFilter(e.target.value)}>
                <option>All Fabrics</option><option>Cotton</option><option>Polyester</option><option>Blended</option><option>Silk</option>
              </select>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={weavingFilter} onChange={e => setWeavingFilter(e.target.value)}>
                <option>All Weaves</option><option>Plain</option><option>Twill</option><option>Satin</option><option>Jacquard</option>
              </select>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Normal</option><option>Special</option><option>Sample</option>
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
                      <th>DS Ref No</th><th>DS Date</th><th>Design No</th><th>Buyer</th><th>Fabric</th><th>Weaving</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredEntries.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No designs found.</td></tr>
                    ) : filteredEntries.map(e => (
                      <tr key={e.id} onClick={() => handleRowClick(e)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === e.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{e.ds_ref_no}</td>
                        <td>{e.ds_date}</td>
                        <td style={{ fontWeight: 500 }}>{e.design_no}</td>
                        <td>{e.buyer_name || '-'}</td>
                        <td><span className="badge badge-draft">{e.fabric || 'N/A'}</span></td>
                        <td><span className="badge badge-active">{e.weaving || 'N/A'}</span></td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(e, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(e, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(e.id, e.ds_ref_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedViewEntry && (
              <div style={{ flex: '0 0 350px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                      <Palette size={18} /> {selectedViewEntry.ds_ref_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Design No" value={selectedViewEntry.design_no} />
                    <DetailRow label="DS Date" value={selectedViewEntry.ds_date} />
                    <DetailRow label="Buyer" value={selectedViewEntry.buyer_name} />
                    <DetailRow label="IBPO No" value={selectedViewEntry.ibpo_no} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specifications</h4>
                    <DetailRow label="Gry Const" value={selectedViewEntry.gry_const} />
                    <DetailRow label="Fabric" value={selectedViewEntry.fabric} />
                    <DetailRow label="Weaving" value={selectedViewEntry.weaving} />
                    <DetailRow label="Design Type" value={selectedViewEntry.design_type} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Measurements</h4>
                    <DetailRow label="Total Mtr" value={selectedViewEntry.total_mtr} />
                    <DetailRow label="Finish Width" value={selectedViewEntry.finish_width} />
                    <DetailRow label="Weight (g)" value={selectedViewEntry.weight_grm} />
                    {selectedViewEntry.image_path && (
                      <div style={{ marginTop: 12 }}>
                        <h4 style={{ margin: '8px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Design Image</h4>
                        <img 
                          src={`http://localhost:8000${selectedViewEntry.image_path}`} 
                          alt="Design Preview" 
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)', marginTop: 4, cursor: 'pointer' }}
                          onClick={() => window.open(`http://localhost:8000${selectedViewEntry.image_path}`, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Design Details' : editingId ? 'Edit Design Entry' : 'New Design Entry'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button type="submit" form="designForm" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Design' : 'Save Design'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'basic', label: 'Basic & Buyer Info' }, 
              { id: 'fabric', label: 'Fabric & Weaving' },
              { id: 'metrics', label: 'Metrics & Lengths' },
              { id: 'allowances', label: 'Allowances & Percentages' }
             ].map(tab => (
              <button 
                key={tab.id} onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                type="button"
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              <form id="designForm" onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, alignItems: 'start' }}>
                  {/* Left Column: Form Fields per active tab */}
                  <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
                    {activeTab === 'basic' && (
                      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Section 1: Basic & Buyer Info */}
                        <div>
                          <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Basic & Buyer Info</h4>
                          <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            <div className="form-group"><label>DS Date *</label><input type="date" className="form-control" name="ds_date" value={form.ds_date} onChange={handleChange} required /></div>
                            <div className="form-group"><label>Design No *</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} required /></div>
                            <div className="form-group"><label>Color</label><input className="form-control" name="color" value={form.color} onChange={handleChange} /></div>
                            <div className="form-group"><label>Created By</label>
                              <select className="form-control" name="created_by" value={form.created_by} onChange={handleChange}>
                                <option value="">Select Employee...</option>
                                {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                              </select>
                            </div>
                            <div className="form-group"><label>Buyer Name</label>
                              <select className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange}>
                                <option value="">Select Buyer...</option>
                                {buyers.map(b => <option key={b.id} value={b.company_name}>{b.company_name}</option>)}
                                {form.buyer_name && !buyers.some(b => b.company_name === form.buyer_name) && (
                                  <option value={form.buyer_name}>{form.buyer_name}</option>
                                )}
                              </select>
                            </div>
                            <div className="form-group"><label>IBPO No</label>
                              <select className="form-control" name="ibpo_no" value={form.ibpo_no} onChange={handleChange}>
                                <option value="">Select Order...</option>
                                {orders.map(o => <option key={o.id} value={o.ibpo_number}>{o.ibpo_number} ({o.party_name})</option>)}
                              </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Gry Const</label><input className="form-control" name="gry_const" value={form.gry_const} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'fabric', 'fabric')} /></div>
                          </div>
                        </div>

                        {/* Section 2: Fabric & Weaving */}
                        <div>
                          <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabric & Weaving</h4>
                          <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            <div className="form-group"><label>Fabric</label>
                              <select className="form-control" name="fabric" value={form.fabric} onChange={handleChange}>
                                <option>Cotton</option><option>Polyester</option><option>Blended</option><option>Silk</option>
                              </select>
                            </div>
                            <div className="form-group"><label>Weaving</label>
                              <select className="form-control" name="weaving" value={form.weaving} onChange={handleChange}>
                                <option>Plain</option><option>Twill</option><option>Satin</option><option>Jacquard</option>
                              </select>
                            </div>
                            <div className="form-group"><label>Design Type</label>
                              <select className="form-control" name="design_type" value={form.design_type} onChange={handleChange}>
                                <option>Normal</option><option>Special</option><option>Sample</option>
                              </select>
                            </div>
                            <div className="form-group"><label>Count RxPXW</label><input className="form-control" name="count_rxpxw" value={form.count_rxpxw} onChange={handleChange} /></div>
                            <div className="form-group"><label>Reed</label><input type="number" className="form-control" name="reed" value={form.reed} onChange={handleChange} /></div>
                            <div className="form-group"><label>Pick OT</label><input type="number" className="form-control" name="pick_ot" value={form.pick_ot} onChange={handleChange} /></div>
                            <div className="form-group"><label>Reed OL</label><input type="number" className="form-control" name="reed_ol" value={form.reed_ol} onChange={handleChange} /></div>
                            <div className="form-group"><label>Total Ends</label><input type="number" className="form-control" name="total_ends" value={form.total_ends} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'metrics', 'order_mtr')} /></div>
                          </div>
                        </div>

                        {/* Section 3: Metrics & Lengths */}
                        <div>
                          <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Metrics & Lengths</h4>
                          <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            <div className="form-group"><label>Order Mtr</label><input type="number" className="form-control" name="order_mtr" value={form.order_mtr} onChange={handleChange} /></div>
                            <div className="form-group"><label>Ex Mtr</label><input type="number" className="form-control" name="ex_mtr" value={form.ex_mtr} onChange={handleChange} /></div>
                            <div className="form-group"><label>Total Mtr</label><input type="number" className="form-control" name="total_mtr" value={form.total_mtr} onChange={handleChange} /></div>
                            <div className="form-group"><label>Warp Mtr</label><input type="number" className="form-control" name="warp_mtr" value={form.warp_mtr} onChange={handleChange} /></div>
                            <div className="form-group"><label>Weft (Pro) Mtr</label><input type="number" className="form-control" name="weft_pro_mtr" value={form.weft_pro_mtr} onChange={handleChange} /></div>
                            <div className="form-group"><label>Gray Width</label><input type="number" className="form-control" name="gray_width" value={form.gray_width} onChange={handleChange} /></div>
                            <div className="form-group"><label>Finish Width</label><input type="number" className="form-control" name="finish_width" value={form.finish_width} onChange={handleChange} /></div>
                            <div className="form-group"><label>Warp Width</label><input type="number" className="form-control" name="warp_width" value={form.warp_width} onChange={handleChange} /></div>
                            <div className="form-group"><label>Weight Grm</label><input type="number" className="form-control" name="weight_grm" value={form.weight_grm} onChange={handleChange} /></div>
                            <div className="form-group"><label>QLM</label><input type="number" className="form-control" name="qlm" value={form.qlm} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'allowances', 'crimp_pct')} /></div>
                          </div>
                        </div>

                        {/* Section 4: Allowances & Percentages */}
                        <div>
                          <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Allowances & Percentages</h4>
                          <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                            <div className="form-group"><label>Crimp %</label><input type="number" className="form-control" name="crimp_pct" value={form.crimp_pct} onChange={handleChange} /></div>
                            <div className="form-group"><label>SKG %</label><input type="number" className="form-control" name="skg_pct" value={form.skg_pct} onChange={handleChange} /></div>
                            <div className="form-group"><label>Toie %</label><input type="number" className="form-control" name="toie_pct" value={form.toie_pct} onChange={handleChange} /></div>
                            <div className="form-group"><label>Dyeing Loss %</label><input type="number" className="form-control" name="dyeing_loss_pct" value={form.dyeing_loss_pct} onChange={handleChange} /></div>
                            <div className="form-group"><label>Selvage Waste</label><input type="number" className="form-control" name="selvage_waste" value={form.selvage_waste} onChange={handleChange} /></div>
                            <div className="form-group"><label>Packing Less</label><input type="number" className="form-control" name="packing_less" value={form.packing_less} onChange={handleChange} /></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'fabric' && (
                      <div className="animate-fade">
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabric & Weaving</h4>
                        <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                          <div className="form-group"><label>Fabric</label>
                            <select className="form-control" name="fabric" value={form.fabric} onChange={handleChange}>
                              <option>Cotton</option><option>Polyester</option><option>Blended</option><option>Silk</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Weaving</label>
                            <select className="form-control" name="weaving" value={form.weaving} onChange={handleChange}>
                              <option>Plain</option><option>Twill</option><option>Satin</option><option>Jacquard</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Design Type</label>
                            <select className="form-control" name="design_type" value={form.design_type} onChange={handleChange}>
                              <option>Normal</option><option>Special</option><option>Sample</option>
                            </select>
                          </div>
                          <div className="form-group"><label>Count RxPXW</label><input className="form-control" name="count_rxpxw" value={form.count_rxpxw} onChange={handleChange} /></div>
                          <div className="form-group"><label>Reed</label><input type="number" className="form-control" name="reed" value={form.reed} onChange={handleChange} /></div>
                          <div className="form-group"><label>Pick OT</label><input type="number" className="form-control" name="pick_ot" value={form.pick_ot} onChange={handleChange} /></div>
                          <div className="form-group"><label>Reed OL</label><input type="number" className="form-control" name="reed_ol" value={form.reed_ol} onChange={handleChange} /></div>
                          <div className="form-group"><label>Total Ends</label><input type="number" className="form-control" name="total_ends" value={form.total_ends} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'metrics', 'order_mtr')} /></div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'metrics' && (
                      <div className="animate-fade">
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Metrics & Lengths</h4>
                        <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                          <div className="form-group"><label>Order Mtr</label><input type="number" className="form-control" name="order_mtr" value={form.order_mtr} onChange={handleChange} /></div>
                          <div className="form-group"><label>Ex Mtr</label><input type="number" className="form-control" name="ex_mtr" value={form.ex_mtr} onChange={handleChange} /></div>
                          <div className="form-group"><label>Total Mtr</label><input type="number" className="form-control" name="total_mtr" value={form.total_mtr} onChange={handleChange} /></div>
                          <div className="form-group"><label>Warp Mtr</label><input type="number" className="form-control" name="warp_mtr" value={form.warp_mtr} onChange={handleChange} /></div>
                          <div className="form-group"><label>Weft (Pro) Mtr</label><input type="number" className="form-control" name="weft_pro_mtr" value={form.weft_pro_mtr} onChange={handleChange} /></div>
                          <div className="form-group"><label>Gray Width</label><input type="number" className="form-control" name="gray_width" value={form.gray_width} onChange={handleChange} /></div>
                          <div className="form-group"><label>Finish Width</label><input type="number" className="form-control" name="finish_width" value={form.finish_width} onChange={handleChange} /></div>
                          <div className="form-group"><label>Warp Width</label><input type="number" className="form-control" name="warp_width" value={form.warp_width} onChange={handleChange} /></div>
                          <div className="form-group"><label>Weight Grm</label><input type="number" className="form-control" name="weight_grm" value={form.weight_grm} onChange={handleChange} /></div>
                          <div className="form-group"><label>QLM</label><input type="number" className="form-control" name="qlm" value={form.qlm} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'allowances', 'crimp_pct')} /></div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'allowances' && (
                      <div className="animate-fade">
                        <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Allowances & Percentages</h4>
                        <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                          <div className="form-group"><label>Crimp %</label><input type="number" className="form-control" name="crimp_pct" value={form.crimp_pct} onChange={handleChange} /></div>
                          <div className="form-group"><label>SKG %</label><input type="number" className="form-control" name="skg_pct" value={form.skg_pct} onChange={handleChange} /></div>
                          <div className="form-group"><label>Toie %</label><input type="number" className="form-control" name="toie_pct" value={form.toie_pct} onChange={handleChange} /></div>
                          <div className="form-group"><label>Dyeing Loss %</label><input type="number" className="form-control" name="dyeing_loss_pct" value={form.dyeing_loss_pct} onChange={handleChange} /></div>
                          <div className="form-group"><label>Selvage Waste</label><input type="number" className="form-control" name="selvage_waste" value={form.selvage_waste} onChange={handleChange} /></div>
                          <div className="form-group"><label>Packing Less</label><input type="number" className="form-control" name="packing_less" value={form.packing_less} onChange={handleChange} /></div>
                        </div>
                      </div>
                    )}

                    {/* Yarn Count Specifications Table */}
                    <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                      <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn Count Specifications</h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ fontSize: 12, width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Yarn Count</th>
                              <th>Act Count</th>
                              <th>End's</th>
                              <th>Crimp %</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {yarnRows.map((row, idx) => (
                              <tr key={row.id || idx}>
                                <td style={{ fontWeight: 600 }}>{row.type}</td>
                                <td>{row.yarn_count}</td>
                                <td>{row.act_count}</td>
                                <td>{row.ends}</td>
                                <td>{row.crimp_pct}%</td>
                                <td>
                                  {!isReadOnly && (
                                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => deleteYarnRow(idx)}>
                                      <Trash2 size={14} color="#ef4444" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {!isReadOnly && (
                              <tr>
                                <td>
                                  <select 
                                    className="form-control" 
                                    style={{ padding: '4px 6px', margin: 0, minWidth: 70 }}
                                    value={newYarnRow.type}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, type: e.target.value })}
                                  >
                                    <option>Warp</option>
                                    <option>Weft</option>
                                  </select>
                                </td>
                                <td>
                                  <select 
                                    className="form-control" 
                                    style={{ padding: '4px 6px', margin: 0, minWidth: 100 }}
                                    value={newYarnRow.yarn_count}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, yarn_count: e.target.value })}
                                  >
                                    <option value="">Select...</option>
                                    {yarnCountMasters.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                                  </select>
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '4px 6px', margin: 0 }}
                                    placeholder="Act"
                                    value={newYarnRow.act_count}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, act_count: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '4px 6px', margin: 0 }}
                                    placeholder="Ends"
                                    value={newYarnRow.ends}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, ends: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    style={{ padding: '4px 6px', margin: 0 }}
                                    placeholder="Crimp"
                                    value={newYarnRow.crimp_pct}
                                    onChange={e => setNewYarnRow({ ...newYarnRow, crimp_pct: e.target.value })}
                                  />
                                </td>
                                <td>
                                  <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    style={{ padding: '6px 10px', background: '#10b981', borderColor: '#10b981' }}
                                    onClick={addYarnRow}
                                  >
                                    Add
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fabric Design Blue Header bar */}
                <div style={{ 
                  background: '#1e3a8a', 
                  color: '#fff', 
                  padding: '12px 20px', 
                  borderRadius: '6px 6px 0 0', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: 32 
                }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Fabric Design</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      id="fabric-design-file" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFile(file);
                          setImagePreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      disabled={isReadOnly}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 12px', background: '#fff', color: '#1e3a8a', fontWeight: 600 }}
                      onClick={() => document.getElementById('fabric-design-file').click()}
                      disabled={isReadOnly}
                    >
                      Choose File
                    </button>
                    {!isReadOnly && (
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '4px 12px', background: '#10b981', color: '#fff', fontWeight: 600 }}
                        onClick={handleUploadImageOnly}
                      >
                        Upload
                      </button>
                    )}
                    <span style={{ fontSize: 13, color: '#e5e7eb', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile ? selectedFile.name : (imagePreviewUrl ? "Design image loaded" : "No file chosen")}
                    </span>
                    {imagePreviewUrl && (
                      <button 
                        type="button" 
                        className="btn" 
                        style={{ padding: '4px 12px', background: '#f59e0b', color: '#fff', fontWeight: 600 }}
                        onClick={() => {
                          window.open(imagePreviewUrl.startsWith('blob:') ? imagePreviewUrl : `http://localhost:8000${imagePreviewUrl}`, '_blank');
                        }}
                      >
                        View Image
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ padding: '4px 12px', background: '#f59e0b', color: '#fff', fontWeight: 600 }}
                      onClick={() => setShowPatternModal(true)}
                    >
                      View Design
                    </button>
                  </div>
                </div>

                {/* Fabric Design Specifications Table */}
                <div className="card" style={{ padding: 0, borderRadius: '0 0 6px 6px', borderTop: 'none', overflowX: 'auto', marginBottom: 24 }}>
                  <table className="data-table" style={{ fontSize: 12, width: '100%' }}>
                    <thead>
                      <tr>
                        <th>S. No</th>
                        <th>Type</th>
                        <th>Yarn Count</th>
                        <th>Color</th>
                        <th>Threads</th>
                        <th>Times</th>
                        <th>Line</th>
                        <th>Pick</th>
                        <th>Drawing Order</th>
                        <th>DENTS</th>
                        <th>Line</th>
                        <th>ENDS FOR DENTS</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fabricDesignRows.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{row.type}</td>
                          <td>{row.yarn_count}</td>
                          <td>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 6 
                            }}>
                              <span style={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                background: colorMasters.find(c => c.name === row.color)?.code || '#ccc',
                                border: '1px solid #999'
                              }} />
                              {row.color}
                            </span>
                          </td>
                          <td>{row.threads}</td>
                          <td>{row.times}</td>
                          <td>{row.line || '-'}</td>
                          <td>{row.pick || '-'}</td>
                          <td>{row.drawing_order || '-'}</td>
                          <td>{row.dents || '-'}</td>
                          <td>{row.line_val || '-'}</td>
                          <td>{row.ends_for_dents || '-'}</td>
                          <td>
                            {!isReadOnly && (
                              <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => deleteFabricDesignRow(idx)}>
                                <Trash2 size={14} color="#ef4444" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!isReadOnly && (
                        <tr>
                          <td>New</td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0, minWidth: 70 }}
                              value={newFabricDesignRow.type}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, type: e.target.value })}
                            >
                              <option>Warp</option>
                              <option>Weft</option>
                            </select>
                          </td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0, minWidth: 100 }}
                              value={newFabricDesignRow.yarn_count}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, yarn_count: e.target.value })}
                            >
                              <option value="">Select...</option>
                              {yarnCountMasters.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                            </select>
                          </td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0, minWidth: 100 }}
                              value={newFabricDesignRow.color}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, color: e.target.value })}
                            >
                              <option value="">Select...</option>
                              {colorMasters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Threads"
                              value={newFabricDesignRow.threads}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, threads: e.target.value })}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Times"
                              value={newFabricDesignRow.times}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, times: e.target.value })}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Line"
                              value={newFabricDesignRow.line}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, line: e.target.value })}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Pick"
                              value={newFabricDesignRow.pick}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, pick: e.target.value })}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Drawing"
                              value={newFabricDesignRow.drawing_order}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, drawing_order: e.target.value })}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Dents"
                              value={newFabricDesignRow.dents}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, dents: e.target.value })}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Line"
                              value={newFabricDesignRow.line_val}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, line_val: e.target.value })}
                            />
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ padding: '4px 6px', margin: 0 }}
                              placeholder="Ends/Dent"
                              value={newFabricDesignRow.ends_for_dents}
                              onChange={e => setNewFabricDesignRow({ ...newFabricDesignRow, ends_for_dents: e.target.value })}
                            />
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="btn btn-primary" 
                              style={{ padding: '6px 10px', background: '#10b981', borderColor: '#10b981' }}
                              onClick={addFabricDesignRow}
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </form>
            </fieldset>
          </div>
        </div>
      )}

      {showPatternModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 600, padding: 24, background: '#fff', position: 'relative' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary)', fontWeight: 700 }}>Fabric Design Preview</h3>
            <button 
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}
              onClick={() => setShowPatternModal(false)}
            >
              <X size={20} />
            </button>
            <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
              <div>
                <h5 style={{ fontWeight: 600, marginBottom: 8 }}>Warp Stripes Repeat Layout</h5>
                <div style={{ display: 'flex', height: 40, border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
                  {fabricDesignRows.filter(r => r.type === 'Warp').map((row, idx) => {
                    const colorCode = colorMasters.find(c => c.name === row.color)?.code || '#ccc';
                    const weight = parseFloat(row.threads) || 1;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          background: colorCode, 
                          flexGrow: weight,
                          height: '100%',
                          borderRight: '1px solid rgba(0,0,0,0.1)'
                        }} 
                        title={`Warp: ${row.threads} thds of ${row.color}`}
                      />
                    );
                  })}
                  {fabricDesignRows.filter(r => r.type === 'Warp').length === 0 && (
                    <div style={{ padding: 8, color: '#999', fontSize: 13 }}>No Warp stripes configured.</div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 style={{ fontWeight: 600, marginBottom: 8 }}>Weft Stripes Repeat Layout</h5>
                <div style={{ display: 'flex', flexDirection: 'column', width: 40, height: 150, border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
                  {fabricDesignRows.filter(r => r.type === 'Weft').map((row, idx) => {
                    const colorCode = colorMasters.find(c => c.name === row.color)?.code || '#ccc';
                    const weight = parseFloat(row.threads) || 1;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          background: colorCode, 
                          flexGrow: weight,
                          width: '100%',
                          borderBottom: '1px solid rgba(0,0,0,0.1)'
                        }} 
                        title={`Weft: ${row.threads} thds of ${row.color}`}
                      />
                    );
                  })}
                  {fabricDesignRows.filter(r => r.type === 'Weft').length === 0 && (
                    <div style={{ padding: 8, color: '#999', fontSize: 13 }}>No Weft stripes configured.</div>
                  )}
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 600, marginBottom: 8 }}>Grid Fabric Intersect (Simulated Weave)</h5>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `repeat(${Math.max(1, fabricDesignRows.filter(r => r.type === 'Warp').length)}, 1fr)`,
                  gridTemplateRows: `repeat(${Math.max(1, fabricDesignRows.filter(r => r.type === 'Weft').length)}, 1fr)`,
                  height: 150, 
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}>
                  {fabricDesignRows.filter(r => r.type === 'Weft').map((weftRow) => {
                    const weftColor = colorMasters.find(c => c.name === weftRow.color)?.code || '#ccc';
                    return fabricDesignRows.filter(r => r.type === 'Warp').map((warpRow, wIdx) => {
                      const warpColor = colorMasters.find(c => c.name === warpRow.color)?.code || '#ccc';
                      const isWarpFacing = (wIdx % 2 === 0);
                      return (
                        <div 
                          key={wIdx} 
                          style={{ 
                            background: isWarpFacing ? warpColor : weftColor,
                            width: '100%',
                            height: '100%',
                            border: '0.5px solid rgba(0,0,0,0.05)'
                          }} 
                        />
                      );
                    });
                  })}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowPatternModal(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
