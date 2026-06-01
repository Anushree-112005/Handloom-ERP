import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, Barcode, HelpCircle, Check, AlertTriangle } from 'lucide-react';
import { onTableCheckingAPI, dropdownAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 6 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function OnTableChecking() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('All Tables');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdowns/options
  const [options, setOptions] = useState({
    all_parties: [],
    masters: {}
  });

  // Barcode simulation state
  const [barcodeInput, setBarcodeInput] = useState('');

  const initialForm = {
    ref_no: '',
    checking_date: new Date().toISOString().split('T')[0],
    table_no: 'Table 1',
    design_no: '',
    order_no: '',
    party_name: '',
    lot_no: '',
    total_meters: 0,
    total_pieces: 0,
    pass_meters: 0,
    reject_meters: 0,
    remarks: '',
    status: 'Checked',
    items: []
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchEntries();
    fetchOptions();
  }, []);

  // Update calculations when items change
  useEffect(() => {
    if (formData.items) {
      const totalPieces = formData.items.length;
      let totalMeters = 0;
      let passMeters = 0;
      let rejectMeters = 0;

      formData.items.forEach(item => {
        const m = Number(item.meters) || 0;
        totalMeters += m;
        if (item.pc_type === 'Pass') {
          passMeters += m;
        } else if (item.pc_type === 'Fail' || item.pc_type === 'Reject') {
          rejectMeters += m;
        }
      });

      setFormData(prev => ({
        ...prev,
        total_pieces: totalPieces,
        total_meters: Number(totalMeters.toFixed(2)),
        pass_meters: Number(passMeters.toFixed(2)),
        reject_meters: Number(rejectMeters.toFixed(2))
      }));
    }
  }, [formData.items]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data } = await onTableCheckingAPI.list();
      setEntries(data);
    } catch (err) {
      console.error("Error fetching quality records:", err);
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

  const handleOpenForm = (entry = null, readOnly = false) => {
    if (entry) {
      // API dates mapping
      const formattedEntry = {
        ...entry,
        checking_date: entry.checking_date ? entry.checking_date.split('T')[0] : '',
        items: entry.items || []
      };
      setFormData(formattedEntry);
      setEditingId(entry.id);
    } else {
      // Auto-generate reference number
      const autoRef = `QC-${Date.now().toString().slice(-6)}`;
      setFormData({
        ...initialForm,
        ref_no: autoRef,
        party_name: options.all_parties?.[0]?.name || ''
      });
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, refNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete QC entry ${refNo}?`)) {
      try {
        await onTableCheckingAPI.delete(id);
        if (selectedEntry?.id === id) setSelectedEntry(null);
        fetchEntries();
      } catch (err) {
        alert("Error deleting record.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formData.items || formData.items.length === 0) {
      alert("Please add at least one inspected piece/roll to the grid.");
      return;
    }
    try {
      if (editingId) {
        await onTableCheckingAPI.update(editingId, formData);
      } else {
        await onTableCheckingAPI.create(formData);
      }
      setView('list');
      fetchEntries();
    } catch (err) {
      alert("Error saving quality checking record.");
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setActiveTab(nextTab);
      document.getElementById(`${nextTab}-section`)?.scrollIntoView({ behavior: 'smooth' });
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

  // --- Grid Management ---
  const handleAddItemRow = () => {
    const newSNo = formData.items.length + 1;
    const newItem = {
      piece_no: `PC-${newSNo.toString().padStart(3, '0')}`,
      vpc_no: '',
      inv_pin: '',
      checking_pin: '',
      pc_type: 'Pass',
      defect_type: '',
      grade: 'A',
      meters: 0,
      pc_1: '',
      pc_2: '',
      pc_3: '',
      pc_4: '',
      pc_5: '',
      pc_6: '',
      pc_7: '',
      swex: '',
      remarks: ''
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItemRow = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleGridCellChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Simulating Barcode Scan
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // Check if barcode already exists
    const exists = formData.items.some(item => item.piece_no.toLowerCase() === barcodeInput.trim().toLowerCase());
    if (exists) {
      alert("This piece number/barcode has already been scanned in this session.");
      setBarcodeInput('');
      return;
    }

    const newItem = {
      piece_no: barcodeInput.trim(),
      vpc_no: `V-${barcodeInput.trim()}`,
      inv_pin: 'PIN-100',
      checking_pin: 'CP-200',
      pc_type: 'Pass',
      defect_type: '',
      grade: 'A',
      meters: 100, // default placeholder meter
      pc_1: 'Normal Check',
      pc_2: '',
      pc_3: '',
      pc_4: '',
      pc_5: '',
      pc_6: '',
      pc_7: '',
      swex: '',
      remarks: 'Scanned via Barcode'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setBarcodeInput('');
  };

  // Filtering
  const filteredEntries = entries.filter(e => {
    const matchesSearch = searchTerm === '' ||
      e.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.design_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.party_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTable = tableFilter === 'All Tables' || e.table_no === tableFilter;
    const matchesStatus = statusFilter === 'All Status' || e.status === statusFilter;

    let matchesDate = true;
    if (e.checking_date) {
      const entDate = new Date(e.checking_date);
      if (fromDate) matchesDate = matchesDate && entDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entDate <= tDate;
      }
    }
    return matchesSearch && matchesTable && matchesStatus && matchesDate;
  });

  // Excel & PDF Reports
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("On-Table Checking QC Report", 14, 15);
    const tableColumn = ["Ref No", "Checking Date", "Table No", "Design No", "Party Name", "Total Pcs", "Meters"];
    const tableRows = [];

    filteredEntries.forEach(e => {
      const rowData = [
        e.ref_no || '-',
        e.checking_date ? e.checking_date.split('T')[0] : '-',
        e.table_no || '-',
        e.design_no || '-',
        e.party_name || '-',
        e.total_pieces || 0,
        e.total_meters || 0
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`On_Table_Checking_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const wsData = filteredEntries.map(e => ({
      "Reference No": e.ref_no,
      "Inspection Date": e.checking_date ? e.checking_date.split('T')[0] : '',
      "Table No": e.table_no,
      "Design No": e.design_no,
      "Buyer Name": e.party_name,
      "Lot No": e.lot_no,
      "Total Pieces": e.total_pieces,
      "Total Meters": e.total_meters,
      "Pass Meters": e.pass_meters,
      "Reject Meters": e.reject_meters,
      "QC Remarks": e.remarks,
      "Status": e.status
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QC Records");
    XLSX.writeFile(wb, `On_Table_Checking_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Metrics summary
  const totalCheckedMeters = entries.reduce((acc, e) => acc + (Number(e.total_meters) || 0), 0).toFixed(1);
  const totalInspectedPieces = entries.reduce((acc, e) => acc + (Number(e.total_pieces) || 0), 0);
  const totalPassMeters = entries.reduce((acc, e) => acc + (Number(e.pass_meters) || 0), 0);
  const passPercent = totalCheckedMeters > 0 ? ((totalPassMeters / totalCheckedMeters) * 100).toFixed(1) : "0.0";

  return (
    <div className="animate-fade">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckSquare size={24} color="#eab308" /> ON Table Quality Checking
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Fabric quality inspection with defect tracking, barcode scanning, and grading.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {view === 'list' && (
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
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Download size={16} color="#10b981" /> Excel Sheet
                  </button>
                </div>
              )}
            </div>
          )}

          {view === 'list' ? (
            <button className="btn btn-primary" onClick={() => handleOpenForm()}>
              <Plus size={18} /> New QC Entry
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}>
                Cancel
              </button>
              {!isReadOnly && (
                <button type="submit" form="checkingForm" className="btn btn-primary">
                  <Save size={18} /> Save Record
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <>
          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308' }}>
                <CheckSquare size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Checked</h3>
                <div className="value">{totalCheckedMeters} Mtr</div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <Barcode size={24} />
              </div>
              <div className="stat-details">
                <h3>Inspected Pieces</h3>
                <div className="value">{totalInspectedPieces} Pcs</div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Check size={24} />
              </div>
              <div className="stat-details">
                <h3>QC Pass Rate</h3>
                <div className="value">{passPercent}%</div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div className="stat-details">
                <h3>Defect Rate</h3>
                <div className="value">{(100 - parseFloat(passPercent)).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* FILTERING BAR */}
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search Ref, Design, Buyer..."
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Filter size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Filters:</span>
              </div>

              <select className="form-control" style={{ width: 140, margin: 0 }} value={tableFilter} onChange={e => setTableFilter(e.target.value)}>
                <option>All Tables</option>
                <option>Table 1</option>
                <option>Table 2</option>
                <option>Table 3</option>
                <option>Table 4</option>
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

          {/* LIST & DETAIL SPLIT VIEW */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ref No</th>
                      <th>Checking Date</th>
                      <th>Table No</th>
                      <th>Design / Lot</th>
                      <th>Buyer Party</th>
                      <th>QC Summary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                    ) : filteredEntries.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No QC inspection records found.</td></tr>
                    ) : (
                      filteredEntries.map(e => (
                        <tr
                          key={e.id}
                          onClick={() => setSelectedEntry(e)}
                          style={{
                            cursor: 'pointer',
                            background: selectedEntry?.id === e.id ? 'var(--bg-secondary)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                        >
                          <td style={{ fontWeight: 600, color: '#eab308' }}>{e.ref_no}</td>
                          <td>{e.checking_date ? e.checking_date.split('T')[0] : '-'}</td>
                          <td>
                            <span className="badge badge-active">{e.table_no}</span>
                          </td>
                          <td>
                            <strong>{e.design_no || 'N/A'}</strong><br />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lot: {e.lot_no || '-'}</span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{e.party_name || '-'}</td>
                          <td>
                            <span style={{ fontSize: 13 }}>{e.total_pieces} Pcs / {e.total_meters} Mtr</span><br />
                            <span style={{ fontSize: 11, color: '#10b981' }}>Pass: {e.pass_meters}M</span> | <span style={{ fontSize: 11, color: '#ef4444' }}>Reject: {e.reject_meters}M</span>
                          </td>
                          <td onClick={eOpt => eOpt.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => handleOpenForm(e, true)}
                                title="View Details"
                              >
                                <Eye size={16} color="var(--primary)" />
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => handleOpenForm(e, false)}
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={(eOpt) => handleDelete(e.id, e.ref_no, eOpt)}
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

            {/* SPLIT VIEW DETAILS PANEL */}
            {selectedEntry && (
              <div style={{ flex: '0 0 360px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#eab308', fontWeight: 700 }}>
                      <CheckSquare size={18} /> QC Record: {selectedEntry.ref_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Inspection Ref" value={selectedEntry.ref_no} />
                    <DetailRow label="Date Checked" value={selectedEntry.checking_date?.split('T')[0]} />
                    <DetailRow label="Table No" value={selectedEntry.table_no} />
                    <DetailRow label="Design No" value={selectedEntry.design_no} />
                    <DetailRow label="Order No" value={selectedEntry.order_no} />
                    <DetailRow label="Lot Number" value={selectedEntry.lot_no} />
                    <DetailRow label="Buyer Name" value={selectedEntry.party_name} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Metrics Summary</h4>
                    <DetailRow label="Total Pieces" value={`${selectedEntry.total_pieces} Pcs`} />
                    <DetailRow label="Total Volume" value={`${selectedEntry.total_meters} Mtr`} />
                    <DetailRow label="QC Pass meters" value={<span style={{ color: '#10b981', fontWeight: 600 }}>{selectedEntry.pass_meters} Mtr</span>} />
                    <DetailRow label="QC Fail/Reject meters" value={<span style={{ color: '#ef4444', fontWeight: 600 }}>{selectedEntry.reject_meters} Mtr</span>} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inspected Rolls ({selectedEntry.items?.length || 0})</h4>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 6, maxHeight: 150, overflowY: 'auto', background: 'var(--bg-primary)', padding: '4px 8px' }}>
                      {(selectedEntry.items || []).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: idx < selectedEntry.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span>{item.piece_no} ({item.meters}M)</span>
                          <span style={{ fontWeight: 600, color: item.pc_type === 'Pass' ? '#10b981' : '#ef4444' }}>
                            {item.grade} [{item.pc_type}]
                          </span>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remarks</h4>
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: 8, background: 'var(--bg-primary)', borderRadius: 6, borderLeft: '3px solid #eab308' }}>
                      {selectedEntry.remarks || 'No remarks recorded.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* CREATE / EDIT FORM VIEW */
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
            {[{ id: 'general', label: 'General Info & Barcode' }, { id: 'items', label: 'Inspection Grid' }].map(tab => (
              <button 
                type="button"
                key={tab.id} onClick={() => {
                  setActiveTab(tab.id);
                  document.getElementById(`${tab.id}-section`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="checkingForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                
                <div id="general-section" className="animate-fade" style={{ marginBottom: 32 }}>
                  {/* SECTION 1: HEADER GENERAL INFO */}
                  <h4 style={{ color: '#eab308', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                    General Inspection Info
                  </h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group">
                      <label>Ref No *</label>
                      <input className="form-control" name="ref_no" value={formData.ref_no} onChange={handleHeaderChange} required disabled />
                    </div>
                    <div className="form-group">
                      <label>Checking Date *</label>
                      <input type="date" className="form-control" name="checking_date" value={formData.checking_date} onChange={handleHeaderChange} required />
                    </div>
                    <div className="form-group">
                      <label>Inspection Table *</label>
                      <select className="form-control" name="table_no" value={formData.table_no} onChange={handleHeaderChange} required>
                        <option>Table 1</option>
                        <option>Table 2</option>
                        <option>Table 3</option>
                        <option>Table 4</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Buyer / Party *</label>
                      <select className="form-control" name="party_name" value={formData.party_name} onChange={handleHeaderChange} required>
                        <option value="">-- Select Buyer --</option>
                        {options.all_parties.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Design Number</label>
                      <input className="form-control" name="design_no" value={formData.design_no} onChange={handleHeaderChange} />
                    </div>
                    <div className="form-group">
                      <label>Buyer Order No</label>
                      <input className="form-control" name="order_no" value={formData.order_no} onChange={handleHeaderChange} />
                    </div>
                    <div className="form-group">
                      <label>Lot Number</label>
                      <input className="form-control" name="lot_no" value={formData.lot_no} onChange={handleHeaderChange} />
                    </div>
                    <div className="form-group">
                      <label>QC Status</label>
                      <select className="form-control" name="status" value={formData.status} onChange={handleHeaderChange}>
                        <option>Checked</option>
                        <option>Pending Approval</option>
                        <option>Approved</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>QC General Remarks / Instructions</label>
                    <textarea className="form-control" name="remarks" value={formData.remarks} onChange={handleHeaderChange} rows={2} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'piece_no')} />
                  </div>

                  {/* BARCODE SCAN SIMULATION */}
                  {!isReadOnly && (
                    <div style={{ margin: '24px 0', padding: 16, border: '2px dashed var(--primary)', borderRadius: 8, background: 'rgba(37,99,235,0.02)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>
                        <Barcode size={18} /> Barcode Scanner Simulation
                      </h4>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ flex: 1, margin: 0 }}
                          value={barcodeInput}
                          onChange={e => setBarcodeInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleBarcodeSubmit(e);
                            }
                          }}
                        />
                        <button type="button" className="btn btn-secondary" onClick={handleBarcodeSubmit}>
                          Scan Code
                        </button>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'inline-block' }}>
                        Type a piece barcode number and hit Enter to simulate quick-scan insertion into the inspection grid.
                      </span>
                    </div>
                  )}
                </div>

                <div id="items-section" className="animate-fade" style={{ marginBottom: 32 }}>
                  {/* SECTION 2: GRID ITEMS TABLE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0' }}>
                    <h4 style={{ color: '#eab308', margin: 0, fontSize: 16, fontWeight: 700 }}>
                      Inspected Pieces / Rolls Grid
                    </h4>
                    {!isReadOnly && (
                      <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={handleAddItemRow}>
                        <Plus size={14} /> Add Raw Row
                      </button>
                    )}
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 24 }}>
                    <table className="data-table" style={{ margin: 0, minWidth: 1400 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>S.No</th>
                          <th style={{ width: 140 }}>PC No *</th>
                          <th style={{ width: 140 }}>VPC No</th>
                          <th style={{ width: 120 }}>Inv Pin</th>
                          <th style={{ width: 120 }}>Checking Pin</th>
                          <th style={{ width: 120 }}>Meters *</th>
                          <th style={{ width: 140 }}>Inspection QC *</th>
                          <th style={{ width: 150 }}>Defect Type</th>
                          <th style={{ width: 110 }}>Grade *</th>
                          <th style={{ width: 140 }}>SWEX (Special)</th>
                          <th style={{ width: 180 }}>QC Checks (PC 1 to PC 4)</th>
                          <th style={{ width: 180 }}>QC Checks (PC 5 to PC 7)</th>
                          <th style={{ width: 150 }}>Item Remarks</th>
                          {!isReadOnly && <th style={{ width: 60 }}>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.length === 0 ? (
                          <tr>
                            <td colSpan={isReadOnly ? 13 : 14} style={{ textAlign: 'center', padding: '30px var(--text-muted)', color: 'var(--text-muted)' }}>
                              No pieces checked yet. Use the barcode scanner simulation box above or click "Add Raw Row" to start adding inspection pieces.
                            </td>
                          </tr>
                        ) : (
                          formData.items.map((item, index) => (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.piece_no}
                                  onChange={e => handleGridCellChange(index, 'piece_no', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.vpc_no}
                                  onChange={e => handleGridCellChange(index, 'vpc_no', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.inv_pin}
                                  onChange={e => handleGridCellChange(index, 'inv_pin', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.checking_pin}
                                  onChange={e => handleGridCellChange(index, 'checking_pin', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.meters}
                                  onChange={e => handleGridCellChange(index, 'meters', Number(e.target.value))}
                                  required
                                />
                              </td>
                              <td>
                                <select
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 4px' }}
                                  value={item.pc_type}
                                  onChange={e => {
                                    const val = e.target.value;
                                    const isFail = val === 'Fail' || val === 'Reject';
                                    handleGridCellChange(index, 'pc_type', val);
                                    if (isFail) {
                                      handleGridCellChange(index, 'grade', 'Fail');
                                    } else if (item.grade === 'Fail') {
                                      handleGridCellChange(index, 'grade', 'A');
                                    }
                                  }}
                                >
                                  <option value="Pass">Pass</option>
                                  <option value="Fail">Fail</option>
                                  <option value="Reject">Reject</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.defect_type}
                                  onChange={e => handleGridCellChange(index, 'defect_type', e.target.value)}
                                  disabled={item.pc_type === 'Pass'}
                                />
                              </td>
                              <td>
                                <select
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 4px' }}
                                  value={item.grade}
                                  onChange={e => handleGridCellChange(index, 'grade', e.target.value)}
                                >
                                  <option value="A">Grade A</option>
                                  <option value="B">Grade B</option>
                                  <option value="C">Grade C</option>
                                  <option value="Fail">Fail</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.swex}
                                  onChange={e => handleGridCellChange(index, 'swex', e.target.value)}
                                />
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <input
                                    className="form-control"
                                    style={{ width: '100%', margin: 0, padding: '2px 4px', fontSize: 11 }}
                                    value={item.pc_1}
                                    onChange={e => handleGridCellChange(index, 'pc_1', e.target.value)}
                                  />
                                  <input
                                    className="form-control"
                                    style={{ width: '100%', margin: 0, padding: '2px 4px', fontSize: 11 }}
                                    value={item.pc_2}
                                    onChange={e => handleGridCellChange(index, 'pc_2', e.target.value)}
                                  />
                                  <input
                                    className="form-control"
                                    style={{ width: '100%', margin: 0, padding: '2px 4px', fontSize: 11 }}
                                    value={item.pc_3}
                                    onChange={e => handleGridCellChange(index, 'pc_3', e.target.value)}
                                  />
                                  <input
                                    className="form-control"
                                    style={{ width: '100%', margin: 0, padding: '2px 4px', fontSize: 11 }}
                                    value={item.pc_4}
                                    onChange={e => handleGridCellChange(index, 'pc_4', e.target.value)}
                                  />
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <input
                                    className="form-control"
                                    style={{ width: '100%', margin: 0, padding: '2px 4px', fontSize: 11 }}
                                    value={item.pc_5}
                                    onChange={e => handleGridCellChange(index, 'pc_5', e.target.value)}
                                  />
                                  <input
                                    className="form-control"
                                    style={{ width: '100%', margin: 0, padding: '2px 4px', fontSize: 11 }}
                                    value={item.pc_6}
                                    onChange={e => handleGridCellChange(index, 'pc_6', e.target.value)}
                                  />
                                  <input
                                    className="form-control"
                                    style={{ width: '100%', margin: 0, padding: '2px 4px', fontSize: 11 }}
                                    value={item.pc_7}
                                    onChange={e => handleGridCellChange(index, 'pc_7', e.target.value)}
                                  />
                                </div>
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.remarks}
                                  onChange={e => handleGridCellChange(index, 'remarks', e.target.value)}
                                />
                              </td>
                              {!isReadOnly && (
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                                    onClick={() => handleRemoveItemRow(index)}
                                  >
                                    <Trash2 size={16} color="#ef4444" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* CALCULATION SUMMARY CARDS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Inspected Pieces</span>
                      <span style={{ fontSize: 18, fontWeight: 700 }}>{formData.total_pieces} Pcs</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Inspected Meters</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{formData.total_meters} Mtr</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>QC Approved Volume</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{formData.pass_meters} Mtr</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>QC Rejected Volume</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{formData.reject_meters} Mtr</span>
                    </div>
                  </div>
                </div>

              </fieldset>
            </form>
          </div>
        </div>      )}
    </div>
  );
}
