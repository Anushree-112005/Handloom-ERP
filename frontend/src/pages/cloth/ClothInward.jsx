import { useState, useEffect } from 'react';
import { Factory, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, Barcode, HelpCircle, Check, Percent, Settings, Scale } from 'lucide-react';
import { clothInwardAPI, dropdownAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value, highlight = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 6 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ 
      fontWeight: 600, 
      color: highlight ? '#ffffff' : 'var(--text-primary)', 
      backgroundColor: highlight ? '#10b981' : 'transparent',
      padding: highlight ? '2px 6px' : '0',
      borderRadius: highlight ? '4px' : '0',
      textAlign: 'right', 
      maxWidth: '60%' 
    }}>{value || '-'}</span>
  </div>
);

export default function ClothInward() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [inwards, setInwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedInward, setSelectedInward] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [inwardTypeFilter, setInwardTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdowns/options
  const [options, setOptions] = useState({
    all_parties: [],
    masters: {}
  });

  const initialForm = {
    ref_no: '',
    inward_type: 'Vendor Inward',
    inw_date: new Date().toISOString().split('T')[0],
    vendor_order: '',
    party_name: '',
    dc_no: '',
    dc_date: new Date().toISOString().split('T')[0],
    vendor_order_mtr: 0,
    order_mtr_plus_10: 0,
    received_mtr: 0,
    balance_mtr: 0,
    ibpo: '',
    design_no: '',
    const_fabric_type: '',
    reed: '',
    pick: '',
    width: '',
    order_mtr: 0,
    warp_mtr: 0,
    inward_mtr: 0,
    shed_no: 'Shed A',
    loom_no: 'Loom 1',
    attn_no: '1',
    beam_no: '',
    szt_no: '',
    total_pieces: 0,
    total_meters: 0,
    inspection_type: 'Standard Check',
    inv_pin: '100',
    remarks: '',
    process_type: 'Dyeing',
    process_remarks: '',
    items: []
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchInwards();
    fetchOptions();
  }, []);

  // Update calculations when values or grid items change
  useEffect(() => {
    const totalPcs = formData.items ? formData.items.length : 0;
    const totalMtr = formData.items ? formData.items.reduce((acc, curr) => acc + (Number(curr.meters) || 0), 0) : 0;
    const orderMtrPlus10 = (Number(formData.vendor_order_mtr) || 0) * 1.1;
    const firstBalanceMtr = (Number(formData.vendor_order_mtr) || 0) - (Number(formData.received_mtr) || 0);
    const secondBalanceMtr = (Number(formData.order_mtr) || 0) - totalMtr;

    setFormData(prev => ({
      ...prev,
      total_pieces: totalPcs,
      total_meters: Number(totalMtr.toFixed(2)),
      order_mtr_plus_10: Number(orderMtrPlus10.toFixed(2)),
      received_mtr: Number(totalMtr.toFixed(2)), // Automatically tie received mtr to total grid mtrs
      balance_mtr: Number(firstBalanceMtr.toFixed(2)),
      inward_mtr: Number(totalMtr.toFixed(2))
    }));
  }, [formData.items, formData.vendor_order_mtr, formData.order_mtr]);

  const fetchInwards = async () => {
    try {
      setLoading(true);
      const { data } = await clothInwardAPI.list();
      setInwards(data);
    } catch (err) {
      console.error("Error fetching cloth inward records:", err);
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

  const handleOpenForm = (inward = null, readOnly = false) => {
    if (inward) {
      const formatted = {
        ...inward,
        inw_date: inward.inw_date ? inward.inw_date.split('T')[0] : '',
        dc_date: inward.dc_date ? inward.dc_date.split('T')[0] : '',
        items: inward.items || []
      };
      setFormData(formatted);
      setEditingId(inward.id);
    } else {
      const randomID = Math.floor(10000 + Math.random() * 90000).toString();
      setFormData({
        ...initialForm,
        ref_no: randomID,
        party_name: options.all_parties?.[0]?.name || ''
      });
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, refNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Cloth Inward entry ${refNo}?`)) {
      try {
        await clothInwardAPI.delete(id);
        if (selectedInward?.id === id) setSelectedInward(null);
        fetchInwards();
      } catch (err) {
        alert("Error deleting record.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formData.items || formData.items.length === 0) {
      alert("Please add at least one piece to the grid.");
      return;
    }
    try {
      if (editingId) {
        await clothInwardAPI.update(editingId, formData);
      } else {
        await clothInwardAPI.create(formData);
      }
      setView('list');
      fetchInwards();
    } catch (err) {
      alert("Error saving cloth inward entry.");
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Grid row modifications
  const handleAddItemRow = () => {
    const nextPcNo = `PC-${(formData.items.length + 1).toString().padStart(3, '0')}`;
    const newItem = {
      piece_no: nextPcNo,
      weight: 0,
      vloom: '',
      vpc_no: '',
      meters: 0
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

  // Filter logic
  const filteredInwards = inwards.filter(e => {
    const matchesSearch = searchTerm === '' ||
      e.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.design_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.dc_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = inwardTypeFilter === 'All Types' || e.inward_type === inwardTypeFilter;

    let matchesDate = true;
    if (e.inw_date) {
      const entryDate = new Date(e.inw_date);
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
    const doc = new jsPDF();
    doc.text("Cloth Vendor Inward Report", 14, 15);
    const tableColumn = ["Inw ID", "Date Received", "Vendor Name", "DC No", "DC Date", "Total Pcs", "Total Mtr"];
    const tableRows = [];

    filteredInwards.forEach(e => {
      const rowData = [
        e.ref_no || '-',
        e.inw_date ? e.inw_date.split('T')[0] : '-',
        e.party_name || '-',
        e.dc_no || '-',
        e.dc_date ? e.dc_date.split('T')[0] : '-',
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
    doc.save(`Cloth_Inward_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const wsData = filteredInwards.map(e => ({
      "Inward ID": e.ref_no,
      "Inward Type": e.inward_type,
      "Inward Date": e.inw_date ? e.inw_date.split('T')[0] : '',
      "Vendor Name": e.party_name,
      "Vendor DC No": e.dc_no,
      "DC Date": e.dc_date ? e.dc_date.split('T')[0] : '',
      "Order Mtr": e.order_mtr,
      "Total Pieces": e.total_pieces,
      "Total Meters": e.total_meters,
      "Beam No": e.beam_no,
      "Szt No": e.szt_no,
      "Loom No": e.loom_no,
      "Inspection Type": e.inspection_type,
      "Remarks": e.remarks
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inwards");
    XLSX.writeFile(wb, `Cloth_Inward_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Stat computations
  const totalMetersInward = entries => entries.reduce((acc, curr) => acc + (Number(curr.total_meters) || 0), 0).toFixed(1);
  const totalPiecesInward = entries => entries.reduce((acc, curr) => acc + (Number(curr.total_pieces) || 0), 0);

  return (
    <div className="animate-fade">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Factory size={24} color="#10b981" /> Cloth Vendor / Purchase Inward Entry
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Log fabric receipts from weaving mills and vendors with complete loom and sizing specs.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
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
              <Plus size={18} /> + New Entry
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}>
                Cancel
              </button>
              {!isReadOnly && (
                <button type="submit" form="inwardForm" className="btn btn-primary">
                  <Save size={18} /> Save Inward
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
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Factory size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Inwards</h3>
                <div className="value">{filteredInwards.length} Entries</div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <Percent size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Received</h3>
                <div className="value">{totalMetersInward(filteredInwards)} Mtr</div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                <Settings size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Pieces</h3>
                <div className="value">{totalPiecesInward(filteredInwards)} Pcs</div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                <Scale size={24} />
              </div>
              <div className="stat-details">
                <h3>Loom Efficiency</h3>
                <div className="value">94.8%</div>
              </div>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search Inw ID, Vendor, Design..."
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

              <select className="form-control" style={{ width: 150, margin: 0 }} value={inwardTypeFilter} onChange={e => setInwardTypeFilter(e.target.value)}>
                <option>All Types</option>
                <option>Vendor Inward</option>
                <option>Purchase Inward</option>
                <option>Grey Inward</option>
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

          {/* TABLE & SPLIT DETAIL PANELS */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Inw ID</th>
                      <th>Inw Date</th>
                      <th>Vendor Name</th>
                      <th>DC Number</th>
                      <th>Loom & Design</th>
                      <th>Received Metrics</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                    ) : filteredInwards.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No cloth inward records found matching criteria.</td></tr>
                    ) : (
                      filteredInwards.map(e => (
                        <tr
                          key={e.id}
                          onClick={() => setSelectedInward(e)}
                          style={{
                            cursor: 'pointer',
                            background: selectedInward?.id === e.id ? 'var(--bg-secondary)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                        >
                          <td style={{ fontWeight: 600, color: '#10b981' }}>{e.ref_no}</td>
                          <td>{e.inw_date ? e.inw_date.split('T')[0] : '-'}</td>
                          <td style={{ fontWeight: 500 }}>{e.party_name}</td>
                          <td>
                            <strong>{e.dc_no || 'N/A'}</strong><br />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date: {e.dc_date ? e.dc_date.split('T')[0] : '-'}</span>
                          </td>
                          <td>
                            <strong>Loom: {e.loom_no || 'N/A'}</strong><br />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Design: {e.design_no || '-'}</span>
                          </td>
                          <td>
                            <span>{e.total_pieces} Pcs / {e.total_meters} Mtr</span><br />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shed: {e.shed_no}</span>
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

            {/* SPLIT PANEL DETAILS */}
            {selectedInward && (
              <div style={{ flex: '0 0 360px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700 }}>
                      <Factory size={18} /> Inward Details: {selectedInward.ref_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedInward, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedInward(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Inward ID" value={selectedInward.ref_no} />
                    <DetailRow label="Inward Type" value={selectedInward.inward_type} />
                    <DetailRow label="Inward Date" value={selectedInward.inw_date?.split('T')[0]} />
                    <DetailRow label="Vendor Name" value={selectedInward.party_name} />
                    <DetailRow label="DC Number" value={selectedInward.dc_no} />
                    <DetailRow label="DC Date" value={selectedInward.dc_date?.split('T')[0]} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loom & Quality Spec</h4>
                    <DetailRow label="Design No" value={selectedInward.design_no} />
                    <DetailRow label="Const/Fabric" value={selectedInward.const_fabric_type} />
                    <DetailRow label="Reed / Pick" value={`${selectedInward.reed || '-'} / ${selectedInward.pick || '-'}`} />
                    <DetailRow label="Width" value={selectedInward.width} />
                    <DetailRow label="Loom No" value={selectedInward.loom_no} />
                    <DetailRow label="Shed No" value={selectedInward.shed_no} />
                    <DetailRow label="Beam No" value={selectedInward.beam_no} />
                    <DetailRow label="Sizing No (Szt)" value={selectedInward.szt_no} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grid Metrics</h4>
                    <DetailRow label="Total Pieces" value={`${selectedInward.total_pieces} Pcs`} />
                    <DetailRow label="Total Volume" value={`${selectedInward.total_meters} Mtr`} />
                    <DetailRow label="Order Volume" value={`${selectedInward.order_mtr} Mtr`} />
                    <DetailRow label="Remaining Balance" value={`${(Number(selectedInward.order_mtr) - Number(selectedInward.total_meters)).toFixed(2)} Mtr`} highlight={true} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Process & Remarks</h4>
                    <DetailRow label="Process Type" value={selectedInward.process_type} />
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: 8, background: 'var(--bg-primary)', borderRadius: 6, borderLeft: '3px solid #10b981', fontSize: 12 }}>
                      {selectedInward.remarks || 'No remarks recorded.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* FORM ENTRY VIEW (RECREATES LAPTOP SCREEN) */
        <div className="card" style={{ padding: 32 }}>
          <form id="inwardForm" onSubmit={handleSubmit}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                
                {/* LEFT COLUMN: DETAILED SPEC FORM */}
                <div>
                  <h4 style={{ color: '#10b981', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 15, fontWeight: 700 }}>
                    1. Cloth General Specification & Headers
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                    <div className="form-group">
                      <label>Inward Type *</label>
                      <select className="form-control" name="inward_type" value={formData.inward_type} onChange={handleHeaderChange} required>
                        <option>Vendor Inward</option>
                        <option>Purchase Inward</option>
                        <option>Grey Inward</option>
                        <option>Process Inward</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Inw ID (Ref) *</label>
                      <input className="form-control" name="ref_no" value={formData.ref_no} onChange={handleHeaderChange} required disabled />
                    </div>

                    <div className="form-group">
                      <label>Inw Date *</label>
                      <input type="date" className="form-control" name="inw_date" value={formData.inw_date} onChange={handleHeaderChange} required />
                    </div>

                    <div className="form-group">
                      <label>Vendor Order</label>
                      <select className="form-control" name="vendor_order" value={formData.vendor_order} onChange={handleHeaderChange}>
                        <option value="">-- Select Order --</option>
                        <option value="VO-001">VO-001 (Dinesh Mill)</option>
                        <option value="VO-002">VO-002 (Bala Weavers)</option>
                        <option value="VO-003">VO-003 (Saroja Textiles)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Vendor Name *</label>
                      <select className="form-control" name="party_name" value={formData.party_name} onChange={handleHeaderChange} required>
                        <option value="">-- Select Vendor --</option>
                        {options.all_parties.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Vendor DC No *</label>
                      <input className="form-control" name="dc_no" value={formData.dc_no} onChange={handleHeaderChange} required placeholder="DC number reference" />
                    </div>

                    <div className="form-group">
                      <label>DC Date *</label>
                      <input type="date" className="form-control" name="dc_date" value={formData.dc_date} onChange={handleHeaderChange} required />
                    </div>

                    <div className="form-group">
                      <label>Vendor Order Mtr</label>
                      <input type="number" className="form-control" name="vendor_order_mtr" value={formData.vendor_order_mtr} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Order Mtr + 10% (Calculated)</label>
                      <input type="number" className="form-control" name="order_mtr_plus_10" value={formData.order_mtr_plus_10} readOnly style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                    </div>

                    <div className="form-group">
                      <label>Received Mtr (Calculated)</label>
                      <input type="number" className="form-control" name="received_mtr" value={formData.received_mtr} readOnly style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                    </div>

                    <div className="form-group">
                      <label>Balance Mtr (Calculated)</label>
                      <input type="number" className="form-control" name="balance_mtr" value={formData.balance_mtr} readOnly style={{ background: 'var(--bg-secondary)' }} />
                    </div>

                    <div className="form-group">
                      <label>IBPO No</label>
                      <select className="form-control" name="ibpo" value={formData.ibpo} onChange={handleHeaderChange}>
                        <option value="">-- Select IBPO --</option>
                        <option>IBPO-100</option>
                        <option>IBPO-200</option>
                        <option>IBPO-300</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Design No</label>
                      <select className="form-control" name="design_no" value={formData.design_no} onChange={handleHeaderChange}>
                        <option value="">-- Select Design --</option>
                        <option>D-2051</option>
                        <option>D-4902</option>
                        <option>D-9005</option>
                        <option>D-8891</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Const / Fabric Type</label>
                      <input className="form-control" name="const_fabric_type" value={formData.const_fabric_type} onChange={handleHeaderChange} placeholder="e.g. 40s Cotton Sateen Warp/Weft" />
                    </div>

                    <div className="form-group">
                      <label>Reed</label>
                      <input className="form-control" name="reed" value={formData.reed} onChange={handleHeaderChange} placeholder="e.g. 84" />
                    </div>

                    <div className="form-group">
                      <label>Pick</label>
                      <input className="form-control" name="pick" value={formData.pick} onChange={handleHeaderChange} placeholder="e.g. 72" />
                    </div>

                    <div className="form-group">
                      <label>Width</label>
                      <input className="form-control" name="width" value={formData.width} onChange={handleHeaderChange} placeholder="e.g. 58 inches" />
                    </div>

                    <div className="form-group">
                      <label>Order Mtr</label>
                      <input type="number" className="form-control" name="order_mtr" value={formData.order_mtr} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Warp Mtr</label>
                      <input type="number" className="form-control" name="warp_mtr" value={formData.warp_mtr} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Inward Mtr (Calculated)</label>
                      <input type="number" className="form-control" name="inward_mtr" value={formData.inward_mtr} readOnly style={{ background: 'var(--bg-secondary)' }} />
                    </div>

                    <div className="form-group">
                      <label>Shed No</label>
                      <select className="form-control" name="shed_no" value={formData.shed_no} onChange={handleHeaderChange}>
                        <option>Shed A</option>
                        <option>Shed B</option>
                        <option>Shed C</option>
                        <option>Shed D</option>
                      </select>
                    </div>

                    {/* GREEN HIGHLIGHT BALANCE MTR FROM PHOTO */}
                    <div className="form-group">
                      <label>Balance Mtr (Order - Inward)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        readOnly 
                        value={(Number(formData.order_mtr) - Number(formData.total_meters)).toFixed(2)}
                        style={{ 
                          backgroundColor: '#10b981', 
                          color: '#ffffff', 
                          fontWeight: 700, 
                          border: 'none',
                          textAlign: 'center'
                        }} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Loom No</label>
                      <select className="form-control" name="loom_no" value={formData.loom_no} onChange={handleHeaderChange}>
                        <option>Loom 1</option>
                        <option>Loom 2</option>
                        <option>Loom 3</option>
                        <option>Loom 4</option>
                        <option>Loom 5</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Attn No</label>
                      <input className="form-control" name="attn_no" value={formData.attn_no} onChange={handleHeaderChange} />
                    </div>

                    <div className="form-group">
                      <label>Beam No</label>
                      <select className="form-control" name="beam_no" value={formData.beam_no} onChange={handleHeaderChange}>
                        <option value="">-- Select Beam --</option>
                        <option>BM-800</option>
                        <option>BM-801</option>
                        <option>BM-802</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Sizing (Szt) No</label>
                      <input className="form-control" name="szt_no" value={formData.szt_no} onChange={handleHeaderChange} placeholder="e.g. S-90" />
                    </div>

                    <div className="form-group">
                      <label>Inspection Type</label>
                      <select className="form-control" name="inspection_type" value={formData.inspection_type} onChange={handleHeaderChange}>
                        <option>Standard Check</option>
                        <option>Full Table Checking</option>
                        <option>AQL 2.5 Audit</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Inv Pin</label>
                      <input className="form-control" name="inv_pin" value={formData.inv_pin} onChange={handleHeaderChange} />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Remarks</label>
                    <textarea className="form-control" name="remarks" value={formData.remarks} onChange={handleHeaderChange} rows={2} placeholder="Inward details, defect checks, packing note..." />
                  </div>

                  {/* PROCESS SUBSECTION FROM PHOTO */}
                  <h4 style={{ color: '#10b981', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 15, fontWeight: 700 }}>
                    2. Next Processing Steps
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    <div className="form-group">
                      <label>Process Type</label>
                      <select className="form-control" name="process_type" value={formData.process_type} onChange={handleHeaderChange}>
                        <option>Dyeing</option>
                        <option>Bleaching</option>
                        <option>Sanforizing</option>
                        <option>Finishing</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Process Remarks</label>
                      <input className="form-control" name="process_remarks" value={formData.process_remarks} onChange={handleHeaderChange} placeholder="Dye recipe or mill parameters" />
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: CLOTH INWARD PIECE GRID */}
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ color: '#10b981', margin: 0, fontSize: 15, fontWeight: 700 }}>
                      3. Piece-wise Inward Weight & Length Grid
                    </h4>
                    {!isReadOnly && (
                      <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={handleAddItemRow}>
                        + Add Piece
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>S.No</th>
                          <th>Pcno *</th>
                          <th>Weight (kg)</th>
                          <th>VLoom</th>
                          <th>VPc No</th>
                          <th>Mtr *</th>
                          {!isReadOnly && <th style={{ width: 50 }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.length === 0 ? (
                          <tr>
                            <td colSpan={isReadOnly ? 6 : 7} style={{ textAlign: 'center', padding: '40px var(--text-muted)', color: 'var(--text-muted)' }}>
                              No cloth pieces added yet. Click "+ Add Piece" to insert piece specifications.
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
                                  placeholder="Piece #"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.weight}
                                  onChange={e => handleGridCellChange(index, 'weight', Number(e.target.value))}
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.vloom}
                                  onChange={e => handleGridCellChange(index, 'vloom', e.target.value)}
                                  placeholder="Vendor Loom"
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '4px 8px' }}
                                  value={item.vpc_no}
                                  onChange={e => handleGridCellChange(index, 'vpc_no', e.target.value)}
                                  placeholder="Vendor piece #"
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

                  {/* SUMMARY SECTION */}
                  <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Pieces (Pc)</span>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{formData.total_pieces} Pcs</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Meters (Mtr)</span>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{formData.total_meters} Mtr</div>
                    </div>
                  </div>

                </div>

              </div>

            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
}
