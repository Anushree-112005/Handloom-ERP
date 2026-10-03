import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Palette, Box, Download, CheckCircle, Printer, FileText, Package, ArrowLeft, Activity, Users } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { dyedYarnReceiptAPI, partyAPI, dyedYarnDeliveryAPI, dropdownAPI, subMasterAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function DyedYarnReceived() {
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [dyedYarnDeliveries, setDyedYarnDeliveries] = useState([]);
  const [options, setOptions] = useState({});
  const [colorMasters, setColorMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [saveAndPrint, setSaveAndPrint] = useState(false);
  const [viewModalReceipt, setViewModalReceipt] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Search / Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown Master Popups
  const [isCustomRecvdType, setIsCustomRecvdType] = useState(false);
  const [customRecvdTypeVal, setCustomRecvdTypeVal] = useState('');
  const [isCustomConeType, setIsCustomConeType] = useState(false);
  const [customConeTypeVal, setCustomConeTypeVal] = useState('');
  const [isCustomDelCount, setIsCustomDelCount] = useState(false);
  const [customDelCountVal, setCustomDelCountVal] = useState('');
  const [isCustomRcvdCount, setIsCustomRcvdCount] = useState(false);
  const [customRcvdCountVal, setCustomRcvdCountVal] = useState('');
  const [isCustomLotNo, setIsCustomLotNo] = useState(false);
  const [customLotNoVal, setCustomLotNoVal] = useState('');
  const [isCustomColour, setIsCustomColour] = useState(false);
  const [customColourVal, setCustomColourVal] = useState('');

  const initialForm = {
    inv_no: '',
    inv_date: new Date().toISOString().split('T')[0],
    received_type: 'Direct',
    receive_mode: 'Against Order',
    party_name: '',
    design_no: '',
    design_count: '',
    order_no: '',
    our_dc_no: '',
    party_dc_no: '',
    dc_date: new Date().toISOString().split('T')[0],
    remarks: '', // Narration
    other_remarks: '', // Bottom remarks
    total_bags: 0,
    total_received_qty: 0, // Total Kgs
    items: []
  };

  const [form, setForm] = useState(initialForm);

  // New Item Row State (Directly under table headers)
  const initialNewItem = {
    cone_type: 'Full Cone',
    yarn_count: '', // Delivery Count
    received_count: '',
    our_lot_no: '',
    color: '',
    taken_kgs: 0,
    dyed_lot_no: '',
    bags: 0,
    cones: 0,
    rcvd_kgs: 0,
    short_kgs: 0,
    short_pct: 0,
    remarks: ''
  };

  const [newItem, setNewItem] = useState(initialNewItem);

  const loadData = async () => {
    try {
      const [recRes, partRes, ydDelRes, dropRes, colorRes] = await Promise.all([
        dyedYarnReceiptAPI.list(),
        partyAPI.list(),
        dyedYarnDeliveryAPI.list(),
        dropdownAPI.getAll(),
        subMasterAPI.list('color_master')
      ]);
      setReceipts(recRes.data);
      setParties(partRes.data);
      setDyedYarnDeliveries(ydDelRes.data);
      setOptions(dropRes.data);
      setColorMasters(colorRes.data);
    } catch (err) {
      console.error("Error loading Dyed Yarn data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Update short kgs & pct dynamically when taken or rcvd changes
  const handleNewItemQtyChange = (field, value) => {
    const updated = { ...newItem, [field]: value };
    const taken = parseFloat(field === 'taken_kgs' ? value : updated.taken_kgs) || 0;
    const rcvd = parseFloat(field === 'rcvd_kgs' ? value : updated.rcvd_kgs) || 0;
    
    let short = 0;
    if (rcvd < taken) {
      short = taken - rcvd;
    }
    const shortPct = taken > 0 ? parseFloat(((short / taken) * 100).toFixed(2)) : 0;

    setNewItem({
      ...updated,
      short_kgs: parseFloat(short.toFixed(2)),
      short_pct: shortPct
    });
  };

  const handleAddItem = () => {
    if (!newItem.cone_type) {
      alert("Please select Cone Type");
      return;
    }
    setForm(prev => {
      const updatedItems = [...prev.items, { ...newItem }];
      const totalBags = updatedItems.reduce((sum, item) => sum + (parseInt(item.bags) || 0), 0);
      const totalKgs = updatedItems.reduce((sum, item) => sum + (parseFloat(item.rcvd_kgs) || 0), 0);
      return {
        ...prev,
        items: updatedItems,
        total_bags: totalBags,
        total_received_qty: parseFloat(totalKgs.toFixed(2))
      };
    });
    setNewItem(initialNewItem);
  };

  const handleRemoveItem = (index) => {
    setForm(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const totalBags = updatedItems.reduce((sum, item) => sum + (parseInt(item.bags) || 0), 0);
      const totalKgs = updatedItems.reduce((sum, item) => sum + (parseFloat(item.rcvd_kgs) || 0), 0);
      return {
        ...prev,
        items: updatedItems,
        total_bags: totalBags,
        total_received_qty: parseFloat(totalKgs.toFixed(2))
      };
    });
  };

  const handleSaveCustomRecvdType = async () => {
    if (!customRecvdTypeVal.trim()) return;
    try {
      await subMasterAPI.create('received_type_master', { entity: 'received_type_master', name: customRecvdTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, received_type: customRecvdTypeVal.trim() });
      setIsCustomRecvdType(false);
      setCustomRecvdTypeVal('');
    } catch (err) {
      alert('Error saving custom received type');
    }
  };

  const handleSaveCustomConeType = async () => {
    if (!customConeTypeVal.trim()) return;
    try {
      await subMasterAPI.create('cone_type_master', { entity: 'cone_type_master', name: customConeTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setNewItem({ ...newItem, cone_type: customConeTypeVal.trim() });
      setIsCustomConeType(false);
      setCustomConeTypeVal('');
    } catch (err) {
      alert('Error saving custom cone type');
    }
  };

  const handleSaveCustomDelCount = async () => {
    if (!customDelCountVal.trim()) return;
    try {
      await subMasterAPI.create('yarn_count_master', { entity: 'yarn_count_master', name: customDelCountVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setNewItem({ ...newItem, yarn_count: customDelCountVal.trim() });
      setIsCustomDelCount(false);
      setCustomDelCountVal('');
    } catch (err) {
      alert('Error saving custom delivery count');
    }
  };

  const handleSaveCustomRcvdCount = async () => {
    if (!customRcvdCountVal.trim()) return;
    try {
      await subMasterAPI.create('yarn_count_master', { entity: 'yarn_count_master', name: customRcvdCountVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setNewItem({ ...newItem, received_count: customRcvdCountVal.trim() });
      setIsCustomRcvdCount(false);
      setCustomRcvdCountVal('');
    } catch (err) {
      alert('Error saving custom received count');
    }
  };

  const handleSaveCustomLotNo = async () => {
    if (!customLotNoVal.trim()) return;
    try {
      await subMasterAPI.create('lot_no_master', { entity: 'lot_no_master', name: customLotNoVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setNewItem({ ...newItem, our_lot_no: customLotNoVal.trim() });
      setIsCustomLotNo(false);
      setCustomLotNoVal('');
    } catch (err) {
      alert('Error saving custom lot number');
    }
  };

  const handleSaveCustomColour = async () => {
    if (!customColourVal.trim()) return;
    try {
      await subMasterAPI.create('color_master', { entity: 'color_master', name: customColourVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setNewItem({ ...newItem, color: customColourVal.trim() });
      setIsCustomColour(false);
      setCustomColourVal('');
    } catch (err) {
      alert('Error saving custom colour');
    }
  };

  const handleFetchFromDyedYarnDelivery = (dc_no) => {
    if (!dc_no) {
      setForm(prev => ({
        ...prev,
        our_dc_no: '',
        party_name: '',
        design_no: '',
        design_count: '',
        order_no: '',
        items: []
      }));
      return;
    }
    const del = dyedYarnDeliveries.find(d => d.dc_no === dc_no);
    if (del) {
      setForm(prev => {
        const newForm = {
          ...prev,
          our_dc_no: dc_no,
          party_name: del.party_name || '',
          design_no: del.design_no || '',
          design_count: del.design_count || '',
          order_no: del.order_no || '',
          dc_date: del.dc_date || prev.dc_date
        };

        if (del.items && del.items.length > 0) {
          newForm.items = del.items.map(item => {
            const taken = parseFloat(item.total_kgs) || 0;
            return {
              cone_type: item.cone_type || 'Full Cone',
              yarn_count: item.count || item.yarn_count || '',
              received_count: item.count || item.yarn_count || '',
              our_lot_no: item.our_lot_no || '',
              color: item.color || '',
              taken_kgs: taken,
              dyed_lot_no: item.our_lot_no || '',
              bags: parseInt(item.bags) || 0,
              cones: parseInt(item.cones) || 0,
              rcvd_kgs: taken,
              short_kgs: 0,
              short_pct: 0,
              remarks: ''
            };
          });
          
          const totalBags = newForm.items.reduce((sum, it) => sum + (parseInt(it.bags) || 0), 0);
          const totalKgs = newForm.items.reduce((sum, it) => sum + (parseFloat(it.rcvd_kgs) || 0), 0);
          newForm.total_bags = totalBags;
          newForm.total_received_qty = parseFloat(totalKgs.toFixed(2));
        }

        return newForm;
      });
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    
    if (name === 'received_type' && value === 'custom') {
      setIsCustomRecvdType(true);
      setCustomRecvdTypeVal('');
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = async (entry = null, readOnly = false) => {
    try {
      if (entry) {
        const { data } = await dyedYarnReceiptAPI.get(entry.id);
        const sanitizedData = {};
        for (const key in data) {
          sanitizedData[key] = data[key] === null || data[key] === undefined ? '' : data[key];
        }
        const dateFields = ['inv_date', 'dc_date', 'receipt_date'];
        dateFields.forEach(field => {
          if (sanitizedData[field]) {
            sanitizedData[field] = sanitizedData[field].substring(0, 10);
          }
        });
        
        if (Array.isArray(sanitizedData.items)) {
          sanitizedData.items = sanitizedData.items.map(item => {
            const cleanItem = {};
            for (const key in item) {
              cleanItem[key] = item[key] === null || item[key] === undefined ? '' : item[key];
            }
            return cleanItem;
          });
        }
        
        setForm({ ...initialForm, ...sanitizedData });
        setEditingId(sanitizedData.id);
      } else {
        let maxNum = 0;
        receipts.forEach(r => {
          if (r.inv_no && r.inv_no.toUpperCase().startsWith("DYR-")) {
            const parts = r.inv_no.split("-");
            if (parts.length > 1) {
              const num = parseInt(parts[1]);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        });
        const nextInvNo = `DYR-${String(maxNum + 1).padStart(5, '0')}`;
        setForm({
          ...initialForm,
          inv_no: nextInvNo
        });
        setEditingId(null);
      }
      setIsReadOnly(readOnly);
      setShowForm(true);
    } catch (err) {
      alert("Error loading receipt details.");
    }
  };

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (form.items.length === 0) {
      alert("Please add at least one item row.");
      return;
    }
    try {
      const payload = { ...form };
      
      const dateFields = ['inv_date', 'dc_date', 'receipt_date'];
      dateFields.forEach(field => {
        if (!payload[field] || payload[field] === '') {
          payload[field] = null;
        }
      });

      let response;
      if (editingId) {
        response = await dyedYarnReceiptAPI.update(editingId, payload);
      } else {
        response = await dyedYarnReceiptAPI.create(payload);
      }

      if (saveAndPrint) {
        // Trigger print PDF immediately
        const createdReceipt = response.data || payload;
        setViewModalReceipt(createdReceipt);
      }

      alert(editingId ? "Dyed Yarn Receipt updated successfully!" : "Dyed Yarn Receipt saved successfully!");
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving dyed yarn receipt');
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
    if (window.confirm(`Are you sure you want to delete ${inv || 'this receipt'}?`)) {
      try {
        await dyedYarnReceiptAPI.delete(id);
        setSelectedIds(prev => prev.filter(item => item !== id));
        loadData();
        setShowForm(false);
        setEditingId(null);
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected dyed yarn receipt(s)?`)) {
      try {
        await Promise.all(selectedIds.map(id => dyedYarnReceiptAPI.delete(id)));
        setSelectedIds([]);
        loadData();
      } catch (err) {
        alert('Error deleting selected receipts');
        console.error(err);
        loadData();
      }
    }
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.inv_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.party_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || r.received_type === typeFilter;
    let matchesDate = true;
    if (r.inv_date) {
      const entryDate = new Date(r.inv_date);
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
    doc.text("Handloom ERP - Dyed Yarn Receipts", 14, 15);
    const headers = [["Inw No", "Inw Date", "Party", "Type", "Bags", "Total Kgs"]];
    const rows = filteredReceipts.map(r => [
      r.inv_no || '-',
      r.inv_date || '-',
      r.party_name || '-',
      r.received_type || '-',
      r.total_bags || 0,
      r.total_received_qty || 0
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Dyed_Yarn_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredReceipts.map(r => ({
      "Inw No": r.inv_no,
      "Inw Date": r.inv_date,
      "Party Name": r.party_name,
      "Received Type": r.received_type,
      "Receive Mode": r.receive_mode,
      "Total Bags": r.total_bags,
      "Total Kgs": r.total_received_qty
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dyed Yarn Receipts");
    XLSX.writeFile(wb, `Dyed_Yarn_Receipts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalReceipts = receipts.length;
  const totalBags = receipts.reduce((sum, r) => sum + (parseFloat(r.total_bags) || 0), 0);
  const totalKgs = receipts.reduce((sum, r) => sum + (parseFloat(r.total_received_qty) || 0), 0);
  const uniqueParties = new Set(receipts.map(r => r.party_name).filter(Boolean)).size;

  return (
    <div className="animate-fade" style={{ width: '100%' }}>
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Palette size={32} color="var(--primary)" /> Dyed Yarn Received
              </h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>Manage legacy dyed yarn inward receipts and shortages.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} /> PDF
              </button>
              <button className="btn btn-secondary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Download size={16} /> Excel
              </button>
              <button className="btn btn-primary" onClick={() => handleOpenForm(null, false)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} /> New Receipt
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                <Palette size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Receipts</h3>
                <div className="value">{totalReceipts}</div>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Package size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Bags</h3>
                <div className="value">{totalBags}</div>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Activity size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Weight (Kgs)</h3>
                <div className="value">{totalKgs.toFixed(2)}</div>
              </div>
            </div>

            <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                <Users size={24} />
              </div>
              <div className="stat-details">
                <h3>Active Parties</h3>
                <div className="value">{uniqueParties}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: 'none', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search Inward No or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                  {selectedIds.length} dyed yarn receipt{selectedIds.length > 1 ? 's' : ''} selected
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

          <div className="card" style={{ padding: 0, width: '100%', overflowX: 'auto', border: 'none' }}>
            <table className="data-table" style={{ width: '100%' }}>
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
                  <th>Inw No</th><th>Inw Date</th><th>Received Type</th><th>Receive Mode</th><th>Party Name</th><th>Total Bags</th><th>Total Kgs</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                ) : filteredReceipts.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No receipts found.</td></tr>
                ) : filteredReceipts.map(r => (
                  <tr key={r.id} onClick={() => handleOpenForm(r, true)} style={{ cursor: 'pointer', background: selectedIds.includes(r.id) ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }} onClick={evt => evt.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={(evt) => toggleSelectRow(r.id, evt)}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.inv_no}</td>
                    <td>{r.inv_date}</td>
                    <td>{r.received_type}</td>
                    <td>{r.receive_mode}</td>
                    <td style={{ fontWeight: 500 }}>{r.party_name}</td>
                    <td>{r.total_bags}</td>
                    <td style={{ fontWeight: 600 }}>{r.total_received_qty} Kg</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(r, true)}><Eye size={16} color="var(--primary)" /></button>
                        <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(r, false)}><Edit2 size={16} /></button>
                        <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(evt) => handleDelete(r.id, r.inv_no, evt)}><Trash2 size={16} color="#ef4444" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0, width: '100%', borderRadius: 12, overflow: 'hidden', border: 'none' }}>
          
          {/* Header Actions Row */}
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {isReadOnly ? 'View Receipt Details' : editingId ? 'Edit Receipt' : 'New Dyed Yarn Receipt'}
            </h2>
          </div>

          {/* Single tab header indicator */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <div
              style={{
                padding: '16px 24px', background: '#fff',
                borderBottom: '3px solid var(--primary)',
                fontWeight: 600, color: 'var(--primary)',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
              }}
            >
              <Package size={16} /> Yarn Receipt Table
            </div>
          </div>

          {/* Form Content Panel */}
          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
              
              {/* Part 1: Receipt Information */}
              <div className="animate-fade">
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Receipt Information</h4>
                
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Inw Date *</label>
                    <input type="date" className="form-control" name="inv_date" value={form.inv_date} onChange={handleChange} required />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Received Type</label>
                    {isCustomRecvdType ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" className="form-control" placeholder="New Type" value={customRecvdTypeVal} onChange={e => setCustomRecvdTypeVal(e.target.value)} />
                        <button type="button" className="btn btn-primary" onClick={handleSaveCustomRecvdType} style={{ padding: '0 10px' }}><CheckCircle size={16} /></button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsCustomRecvdType(false)} style={{ padding: '0 10px' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <select className="form-control" name="received_type" value={form.received_type || ''} onChange={handleChange}>
                        <option value="Direct">Direct</option>
                        <option value="Against Order">Against Order</option>
                        {options.masters?.received_type_master?.filter(o => o !== 'Direct' && o !== 'Against Order').map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Receive Mode</label>
                    <select className="form-control" name="receive_mode" value={form.receive_mode} onChange={handleChange}>
                      <option value="Direct">Direct</option>
                      <option value="Against Order">Against Order</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Dying Delivery No *</label>
                    <select 
                      className="form-control" 
                      name="our_dc_no" 
                      value={form.our_dc_no || ''} 
                      onChange={(e) => handleFetchFromDyedYarnDelivery(e.target.value)} 
                      required
                    >
                      <option value="">Select Dying Delivery No...</option>
                      {(dyedYarnDeliveries || []).filter(del => del.dc_no).map(del => (
                        <option key={del.id} value={del.dc_no}>{del.dc_no} - {del.party_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Design No</label>
                    <select className="form-control" name="design_no" value={form.design_no || ''} onChange={handleChange}>
                      <option value="">Select Design No...</option>
                      {form.design_no && !options.masters?.design_no_master?.includes(form.design_no) && (
                        <option value={form.design_no}>{form.design_no}</option>
                      )}
                      {options.masters?.design_no_master?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Design Count</label>
                    <select className="form-control" name="design_count" value={form.design_count} onChange={handleChange}>
                      <option value="">-</option>
                      {options.masters?.yarn_count_master?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Order No</label>
                    <select className="form-control" name="order_no" value={form.order_no || ''} onChange={handleChange}>
                      <option value="">Select Order...</option>
                      {form.order_no && !options.masters?.order_no_master?.includes(form.order_no) && (
                        <option value={form.order_no}>{form.order_no}</option>
                      )}
                      {options.masters?.order_no_master?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Party Name</label>
                    <input className="form-control" name="party_name" value={form.party_name || ''} readOnly style={{ background: '#f1f5f9' }} />
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Party DC No</label>
                    <input className="form-control" name="party_dc_no" value={form.party_dc_no} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>DC Date</label>
                    <input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Narration / Detailed Remarks</label>
                    <textarea 
                      className="form-control" 
                      name="remarks" 
                      value={form.remarks} 
                      onChange={handleChange} 
                      placeholder="Enter details here..." 
                      style={{ height: 100, resize: 'none', padding: 12, borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Yarn Receipt Table */}
              <div className="animate-fade">
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn Items</h4>
                
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflowX: 'auto', marginBottom: 20 }}>
                  <table className="data-table" style={{ width: '100%', margin: 0, minWidth: 1200 }}>
                    <thead style={{ background: '#1e3a8a', color: '#fff' }}>
                      <tr>
                        <th style={{ width: 50, textAlign: 'center' }}>S.No</th>
                        <th>Cone Type</th>
                        <th>Delivery Count</th>
                        <th>Received Count</th>
                        <th>Our LotNo.</th>
                        <th>Color</th>
                        <th style={{ width: 100 }}>Taken Kgs</th>
                        <th>Dyed Lotno</th>
                        <th style={{ width: 80 }}>Bags</th>
                        <th style={{ width: 80 }}>Cones</th>
                        <th style={{ width: 100 }}>Rcvd Kgs</th>
                        <th style={{ width: 100 }}>Short Kgs</th>
                        <th style={{ width: 90 }}>Short %</th>
                        <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* LIST OF ADDED ITEMS */}
                      {form.items.length === 0 && isReadOnly ? (
                        <tr>
                          <td colSpan={14} style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 14 }}>
                            No yarn items added yet.
                          </td>
                        </tr>
                      ) : (
                        form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                            <td>{item.cone_type}</td>
                            <td>{item.yarn_count || '-'}</td>
                            <td>{item.received_count || '-'}</td>
                            <td>{item.our_lot_no || '-'}</td>
                            <td>{item.color || '-'}</td>
                            <td>{item.taken_kgs}</td>
                            <td>{item.dyed_lot_no || '-'}</td>
                            <td>{item.bags}</td>
                            <td>{item.cones}</td>
                            <td style={{ fontWeight: 600 }}>{item.rcvd_kgs} Kg</td>
                            <td style={{ color: item.short_kgs > 0 ? '#ef4444' : 'inherit' }}>{item.short_kgs}</td>
                            <td>{item.short_pct}%</td>
                            <td style={{ textAlign: 'center' }}>
                              {!isReadOnly ? (
                                <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} title="Remove Row">
                                  <X size={18} />
                                </button>
                              ) : '-'}
                            </td>
                          </tr>
                        ))
                      )}

                      {/* INPUT ROW FOR ADDING ITEM AT THE LAST ROW */}
                      {!isReadOnly && (
                        <tr style={{ background: '#f8fafc' }}>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>-</td>
                          <td>
                            {isCustomConeType ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ minWidth: 80 }} value={customConeTypeVal} onChange={e => setCustomConeTypeVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomConeType} style={{ padding: '0 6px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setIsCustomConeType(false)} style={{ padding: '0 6px' }}><X size={14} /></button>
                              </div>
                            ) : (
                              <select className="form-control" style={{ margin: 0 }} value={newItem.cone_type} onChange={e => {
                                if (e.target.value === 'custom') setIsCustomConeType(true);
                                else setNewItem({ ...newItem, cone_type: e.target.value });
                              }}>
                                <option value="Full Cone">Full Cone</option>
                                <option value="Half Cone">Half Cone</option>
                                {options.masters?.cone_type_master?.filter(o => o !== 'Full Cone' && o !== 'Half Cone').map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add...</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {isCustomDelCount ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ minWidth: 80 }} value={customDelCountVal} onChange={e => setCustomDelCountVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomDelCount} style={{ padding: '0 6px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setIsCustomDelCount(false)} style={{ padding: '0 6px' }}><X size={14} /></button>
                              </div>
                            ) : (
                              <select className="form-control" style={{ margin: 0 }} value={newItem.yarn_count} onChange={e => {
                                if (e.target.value === 'custom') setIsCustomDelCount(true);
                                else setNewItem({ ...newItem, yarn_count: e.target.value });
                              }}>
                                <option value="">-</option>
                                {options.masters?.yarn_count_master?.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add...</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {isCustomRcvdCount ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ minWidth: 80 }} value={customRcvdCountVal} onChange={e => setCustomRcvdCountVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomRcvdCount} style={{ padding: '0 6px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setIsCustomRcvdCount(false)} style={{ padding: '0 6px' }}><X size={14} /></button>
                              </div>
                            ) : (
                              <select className="form-control" style={{ margin: 0 }} value={newItem.received_count} onChange={e => {
                                if (e.target.value === 'custom') setIsCustomRcvdCount(true);
                                else setNewItem({ ...newItem, received_count: e.target.value });
                              }}>
                                <option value="">-</option>
                                {options.masters?.yarn_count_master?.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add...</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {isCustomLotNo ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ minWidth: 80 }} value={customLotNoVal} onChange={e => setCustomLotNoVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomLotNo} style={{ padding: '0 6px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setIsCustomLotNo(false)} style={{ padding: '0 6px' }}><X size={14} /></button>
                              </div>
                            ) : (
                              <select className="form-control" style={{ margin: 0 }} value={newItem.our_lot_no} onChange={e => {
                                if (e.target.value === 'custom') setIsCustomLotNo(true);
                                else setNewItem({ ...newItem, our_lot_no: e.target.value });
                              }}>
                                <option value="">-</option>
                                {options.masters?.lot_no_master?.map(l => <option key={l} value={l}>{l}</option>)}
                                <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add...</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {isCustomColour ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ minWidth: 80 }} value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomColour} style={{ padding: '0 6px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setIsCustomColour(false)} style={{ padding: '0 6px' }}><X size={14} /></button>
                              </div>
                            ) : (
                              <select className="form-control" style={{ margin: 0 }} value={newItem.color} onChange={e => {
                                if (e.target.value === 'custom') setIsCustomColour(true);
                                else setNewItem({ ...newItem, color: e.target.value });
                              }}>
                                <option value="">-</option>
                                {options.masters?.color_master?.map(col => <option key={col} value={col}>{col}</option>)}
                                <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add...</option>
                              </select>
                            )}
                          </td>
                          <td><input type="number" className="form-control" style={{ margin: 0 }} value={newItem.taken_kgs || ''} onChange={e => handleNewItemQtyChange('taken_kgs', e.target.value)} /></td>
                          <td><input className="form-control" style={{ margin: 0 }} value={newItem.dyed_lot_no} onChange={e => setNewItem({ ...newItem, dyed_lot_no: e.target.value })} /></td>
                          <td><input type="number" className="form-control" style={{ margin: 0 }} value={newItem.bags || ''} onChange={e => setNewItem({ ...newItem, bags: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="number" className="form-control" style={{ margin: 0 }} value={newItem.cones || ''} onChange={e => setNewItem({ ...newItem, cones: parseInt(e.target.value) || 0 })} /></td>
                          <td><input type="number" className="form-control" style={{ margin: 0 }} value={newItem.rcvd_kgs || ''} onChange={e => handleNewItemQtyChange('rcvd_kgs', e.target.value)} /></td>
                          <td><input className="form-control" style={{ margin: 0, background: '#f1f5f9' }} value={newItem.short_kgs} readOnly /></td>
                          <td><input className="form-control" style={{ margin: 0, background: '#f1f5f9' }} value={`${newItem.short_pct}%`} readOnly /></td>
                          <td style={{ textAlign: 'center' }}>
                            <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ padding: '6px 12px', fontSize: 13, background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Add
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Row Remarks & Totals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.5fr', gap: 20, alignItems: 'center', marginTop: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Remarks</label>
                    <input className="form-control" name="other_remarks" value={form.other_remarks} onChange={handleChange} style={{ margin: 0 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Total Bags</label>
                    <input className="form-control" value={form.total_bags} readOnly style={{ margin: 0, background: '#f1f5f9', fontWeight: 700 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Total Kgs</label>
                    <input className="form-control" value={`${form.total_received_qty} Kg`} readOnly style={{ margin: 0, background: '#f1f5f9', fontWeight: 700 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end', height: '40px' }}>
                    <input type="checkbox" id="save-print-chk" checked={saveAndPrint} onChange={e => setSaveAndPrint(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <label htmlFor="save-print-chk" style={{ fontWeight: 700, margin: 0, cursor: 'pointer', userSelect: 'none', fontSize: 12, textTransform: 'uppercase' }}>Save & Print</label>
                  </div>
                </div>
              </div>

            </fieldset>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Close
              </button>
              
              <button type="button" className="btn" onClick={() => setViewModalReceipt(form)} style={{ background: '#10b981', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Printer size={16} /> Print
              </button>

              {editingId && (
                <button type="button" className="btn" onClick={(e) => handleDelete(editingId, form.inv_no, e)} style={{ background: '#f97316', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {!isReadOnly ? (
                <button type="button" className="btn btn-primary" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> {editingId ? 'Update Receipt' : 'Save Receipt'}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setIsReadOnly(false)} style={{ background: '#06b6d4', borderColor: '#06b6d4', display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                  <Edit2 size={16} /> Edit
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Document View Preview Drawer */}
      <A4DocumentPreview
        isOpen={!!viewModalReceipt}
        onClose={() => setViewModalReceipt(null)}
        title="DYED YARN RECEIPT"
        documentNumber={viewModalReceipt?.inv_no}
        status="Received"
        sections={viewModalReceipt ? [
          {
            title: "RECEIPT INFO",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "Inward No", value: viewModalReceipt.inv_no || '-' },
              { label: "Inward Date", value: viewModalReceipt.inv_date || '-' },
              { label: "Received Type", value: viewModalReceipt.received_type || '-' },
              { label: "Receive Mode", value: viewModalReceipt.receive_mode || '-' },
              { label: "Dying Delivery No", value: viewModalReceipt.our_dc_no || '-' },
              { label: "Party Name", value: viewModalReceipt.party_name || '-' },
              { label: "Design No", value: viewModalReceipt.design_no || '-' },
              { label: "Order No", value: viewModalReceipt.order_no || '-' },
              { label: "Narration", value: viewModalReceipt.remarks || '-' }
            ]
          },
          {
            title: "YARN ITEMS",
            icon: "Box",
            type: "table",
            headers: ["S.No", "Cone Type", "Deliv Count", "Recvd Count", "Lot No", "Color", "Taken Kgs", "Recvd Kgs", "Short Kgs"],
            rows: (viewModalReceipt.items || []).map((item, idx) => [
              idx + 1,
              item.cone_type || '-',
              item.yarn_count || '-',
              item.received_count || '-',
              item.our_lot_no || '-',
              item.color || '-',
              item.taken_kgs || 0,
              item.rcvd_kgs || 0,
              item.short_kgs || 0
            ])
          }
        ] : []}
      />
    </div>
  );
}
