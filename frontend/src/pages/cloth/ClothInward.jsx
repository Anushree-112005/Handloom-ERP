import { useState, useEffect } from 'react';
import { Factory, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, Barcode, HelpCircle, Check, Percent, Settings, Scale } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
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
  const [viewModalInward, setViewModalInward] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

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

  const [weavingDeliveries, setWeavingDeliveries] = useState([]);

  const initialForm = {
    ref_no: '',
    inward_type: 'Grey Inward',
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
    loom_no: '',
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
    our_delivery_ref: '',
    total_weight: 0,
    weaving_waste_kgs: 0,
    weaving_waste_pct: 0,
    warp_issued_kgs: 0,
    weft_issued_kgs: 0,
    weft_return_kgs: 0,
    beam_return_kgs: 0,
    items: []
  };

  const [formData, setFormData] = useState(initialForm);

  const generateNextGFRNo = (existingInwards) => {
    const gfrNums = existingInwards
      .map(e => e.ref_no)
      .filter(ref => ref && ref.startsWith('GFR-'))
      .map(ref => {
        const num = parseInt(ref.replace('GFR-', ''));
        return isNaN(num) ? 0 : num;
      });
    const maxNum = gfrNums.length > 0 ? Math.max(...gfrNums) : 0;
    return `GFR-${(maxNum + 1).toString().padStart(5, '0')}`;
  };

  useEffect(() => {
    fetchInwards();
    fetchOptions();
    // Fetch weaving delivery records from localStorage
    const saved = localStorage.getItem('dt_weaving_delivery_records');
    if (saved) {
      try {
        setWeavingDeliveries(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Update calculations when values or grid items change
  useEffect(() => {
    const totalPcs = formData.items ? formData.items.length : 0;
    const totalMtr = formData.items ? formData.items.reduce((acc, curr) => acc + (Number(curr.meters) || 0), 0) : 0;
    const totalWt = formData.items ? formData.items.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0) : 0;
    
    const warpIssued = Number(formData.warp_issued_kgs) || 0;
    const weftIssued = Number(formData.weft_issued_kgs) || 0;
    const totalIssued = warpIssued + weftIssued;
    
    const weftReturn = Number(formData.weft_return_kgs) || 0;
    const beamReturn = Number(formData.beam_return_kgs) || 0;

    let wasteKgs = Number(formData.weaving_waste_kgs) || 0;
    // Default waste calculation: Issued - Fabric Received - Weft Return - Beam Return
    if (!formData.weaving_waste_kgs && totalIssued > 0) {
      wasteKgs = Math.max(0, totalIssued - totalWt - weftReturn - beamReturn);
    }
    const wastePct = totalIssued > 0 ? (wasteKgs / totalIssued) * 100 : 0;

    const orderMtrPlus10 = (Number(formData.vendor_order_mtr) || 0) * 1.1;
    const firstBalanceMtr = (Number(formData.vendor_order_mtr) || 0) - (Number(formData.received_mtr) || 0);

    setFormData(prev => {
      if (
        prev.total_pieces === totalPcs &&
        prev.total_meters === Number(totalMtr.toFixed(2)) &&
        prev.total_weight === Number(totalWt.toFixed(2)) &&
        prev.weaving_waste_pct === Number(wastePct.toFixed(2)) &&
        prev.weaving_waste_kgs === Number(wasteKgs.toFixed(2)) &&
        prev.order_mtr_plus_10 === Number(orderMtrPlus10.toFixed(2)) &&
        prev.received_mtr === Number(totalMtr.toFixed(2)) &&
        prev.balance_mtr === Number(firstBalanceMtr.toFixed(2)) &&
        prev.inward_mtr === Number(totalMtr.toFixed(2))
      ) {
        return prev;
      }
      return {
        ...prev,
        total_pieces: totalPcs,
        total_meters: Number(totalMtr.toFixed(2)),
        total_weight: Number(totalWt.toFixed(2)),
        weaving_waste_pct: Number(wastePct.toFixed(2)),
        weaving_waste_kgs: Number(wasteKgs.toFixed(2)),
        order_mtr_plus_10: Number(orderMtrPlus10.toFixed(2)),
        received_mtr: Number(totalMtr.toFixed(2)),
        balance_mtr: Number(firstBalanceMtr.toFixed(2)),
        inward_mtr: Number(totalMtr.toFixed(2))
      };
    });
  }, [
    formData.items, 
    formData.vendor_order_mtr, 
    formData.order_mtr,
    formData.warp_issued_kgs,
    formData.weft_issued_kgs,
    formData.weft_return_kgs,
    formData.beam_return_kgs,
    formData.weaving_waste_kgs
  ]);

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
      const nextRef = generateNextGFRNo(inwards);
      setFormData({
        ...initialForm,
        ref_no: nextRef,
        inward_type: 'Grey Inward',
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

  const handleWeavingDeliveryChange = (e) => {
    const val = e.target.value;
    const selected = weavingDeliveries.find(wd => wd.id === val);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        our_delivery_ref: val,
        party_name: selected.party_name || prev.party_name,
        design_no: selected.design_no || prev.design_no,
        loom_no: selected.loomNo || prev.loom_no,
        beam_no: selected.items?.[0]?.beamNo || prev.beam_no,
        szt_no: selected.items?.[0]?.setNo || prev.szt_no,
        warp_issued_kgs: selected.total_beam_weight || 0,
        weft_issued_kgs: selected.total_weft_weight || 0,
        weft_return_kgs: 0,
        beam_return_kgs: 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        our_delivery_ref: val
      }));
    }
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setActiveTab(nextTab);
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

  // Grid row modifications
  const handleAddItemRow = () => {
    let nextNum = formData.items.length + 1;
    if (formData.items.length > 0) {
      const lastPc = formData.items[formData.items.length - 1].piece_no;
      const match = lastPc.match(/PC-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const nextPcNo = `PC-${nextNum.toString().padStart(3, '0')}`;
    
    let nextVpc = '';
    if (formData.items.length > 0) {
      const lastVpc = formData.items[formData.items.length - 1].vpc_no;
      const matchVpc = lastVpc.match(/M-(\d+)/);
      if (matchVpc) {
        const nextVpcNum = parseInt(matchVpc[1]) + 1;
        nextVpc = `M-${nextVpcNum.toString().padStart(4, '0')}`;
      } else {
        nextVpc = lastVpc || '';
      }
    } else {
      nextVpc = 'M-0301';
    }

    const newItem = {
      piece_no: nextPcNo,
      vpc_no: nextVpc,
      weight: 0,
      meters: 0,
      width: '56.7"',
      vloom: formData.loom_no || ''
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Factory size={24} color="#10b981" /> Cloth Vendor / Purchase Inward Entry
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Log fabric receipts from weaving mills and vendors with complete loom and sizing specs.</p>
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
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.ref_no}</td>
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
                                onClick={() => setViewModalInward(e)}
                                title="Preview"
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
          </div>

          <A4DocumentPreview
            isOpen={!!viewModalInward}
            onClose={() => setViewModalInward(null)}
            title="CLOTH INWARD RECEIPT"
            documentNumber={viewModalInward?.ref_no}
            status="RECEIVED"
            onDownloadPdf={() => alert('PDF Download for Cloth Inward triggered')}
            sections={viewModalInward ? [
              {
                title: "INWARD INFO",
                icon: "Briefcase",
                type: "grid",
                data: [
                  { label: "Inward ID", value: viewModalInward.ref_no },
                  { label: "Date", value: viewModalInward.inw_date?.split('T')[0] || '-' },
                  { label: "Vendor", value: viewModalInward.party_name },
                  { label: "DC Number", value: viewModalInward.dc_no || '-' },
                  { label: "Inward Type", value: viewModalInward.inward_type || '-' },
                  { label: "Process", value: viewModalInward.process_type || '-' },
                  { label: "Our Delivery Ref", value: viewModalInward.our_delivery_ref || '-' }
                ]
              },
              {
                title: "FABRIC SPECIFICATIONS",
                icon: "Layers",
                type: "grid",
                data: [
                  { label: "Design No", value: viewModalInward.design_no || '-' },
                  { label: "Fabric Const", value: viewModalInward.const_fabric_type || '-' },
                  { label: "Width", value: viewModalInward.width || '-' },
                  { label: "Total Pieces", value: `${viewModalInward.total_pieces} Rolls` },
                  { label: "Total Weight", value: `${Number(viewModalInward.total_weight || 0).toFixed(2)} Kgs` },
                  { label: "Total Meters", value: `${Number(viewModalInward.total_meters || 0).toFixed(2)} Mtr` }
                ]
              },
              {
                title: "MATERIAL RECONCILIATION",
                icon: "Activity",
                type: "grid",
                data: [
                  { label: "Warp Issued (Kg)", value: `${Number(viewModalInward.warp_issued_kgs || 0).toFixed(2)} Kgs` },
                  { label: "Weft Issued (Kg)", value: `${Number(viewModalInward.weft_issued_kgs || 0).toFixed(2)} Kgs` },
                  { label: "Total Raw Material", value: `${(Number(viewModalInward.warp_issued_kgs || 0) + Number(viewModalInward.weft_issued_kgs || 0)).toFixed(2)} Kgs` },
                  { label: "Weft Return (Kg)", value: `${Number(viewModalInward.weft_return_kgs || 0).toFixed(2)} Kgs` },
                  { label: "Beam Return (Kg)", value: `${Number(viewModalInward.beam_return_kgs || 0).toFixed(2)} Kgs` },
                  { label: "Weaving Waste (Kg)", value: `${Number(viewModalInward.weaving_waste_kgs || 0).toFixed(2)} Kgs` },
                  { label: "Weaving Waste (%)", value: `${Number(viewModalInward.weaving_waste_pct || 0).toFixed(2)}%` }
                ]
              },
              {
                title: "PIECE DETAILS",
                icon: "Columns",
                type: "table",
                headers: ["Piece No", "VPC No", "Weight (Kg)", "Meters", "Width", "VLoom"],
                rows: (viewModalInward.items || []).map((b) => [
                  b.piece_no || '-',
                  b.vpc_no || '-',
                  b.weight || 0,
                  b.meters || 0,
                  b.width || '-',
                  b.vloom || '-'
                ])
              }
            ] : []}
          />
        </>
      ) : (
        /* FORM ENTRY VIEW */
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', overflowX: 'auto' }}>
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
              <FileText size={18} /> Inward Details
            </button>
          </div>

          <form id="inwardForm" onSubmit={handleSubmit} style={{ padding: 32 }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              <div className="animate-fade">
                  {/* Section 1: General Spec & Headers */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>General Spec & Headers</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px', marginBottom: 32 }}>
                    <div className="form-group">
                      <label>Inward Type *</label>
                      <select className="form-control" name="inward_type" value={formData.inward_type} onChange={handleHeaderChange} required>
                        <option>Grey Inward</option>
                        <option>Vendor Inward</option>
                        <option>Purchase Inward</option>
                        <option>Process Inward</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Ref No</label>
                      <input className="form-control" name="ref_no" value={formData.ref_no} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                    </div>

                    <div className="form-group">
                      <label>Inward Date *</label>
                      <input type="date" className="form-control" name="inw_date" value={formData.inw_date} onChange={handleHeaderChange} required />
                    </div>

                    <div className="form-group">
                      <label>Party (Weaver) *</label>
                      <select className="form-control" name="party_name" value={formData.party_name} onChange={handleHeaderChange} required>
                        <option value="">-- Select Weaver --</option>
                        {options.all_parties.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Weaver DC No *</label>
                      <input className="form-control" name="dc_no" value={formData.dc_no} onChange={handleHeaderChange} required />
                    </div>

                    <div className="form-group">
                      <label>Our Delivery Ref (Weaving Delivery)</label>
                      <select 
                        className="form-control" 
                        name="our_delivery_ref" 
                        value={formData.our_delivery_ref} 
                        onChange={handleWeavingDeliveryChange}
                      >
                        <option value="">-- Select Weaving Delivery --</option>
                        {weavingDeliveries.map(wd => (
                          <option key={wd.id} value={wd.id}>{wd.id} ({wd.party_name})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Design No</label>
                      <input className="form-control" name="design_no" value={formData.design_no} onChange={handleHeaderChange} placeholder="e.g. DEPL-00003" />
                    </div>

                    <div className="form-group">
                      <label>Loom No</label>
                      <input className="form-control" name="loom_no" value={formData.loom_no} onChange={handleHeaderChange} placeholder="e.g. Loom-08" />
                    </div>

                    <div className="form-group">
                      <label>Beam No</label>
                      <input className="form-control" name="beam_no" value={formData.beam_no} onChange={handleHeaderChange} placeholder="e.g. BM-00301" />
                    </div>
                  </div>

                  {/* Section 3: Piece-wise Inward Grid */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Piece-wise Inward Grid</h4>
                  <div style={{ marginBottom: 16 }}>
                    <h5 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 14, fontWeight: 600 }}>
                      Piece-wise Inward Details
                    </h5>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 24 }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>S.No</th>
                          <th>Piece No *</th>
                          <th>VPC No</th>
                          <th>Weight (kg) *</th>
                          <th>Meters *</th>
                          <th>Width</th>
                          <th>VLoom</th>
                          {!isReadOnly && <th style={{ width: 120, textAlign: 'center' }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.length === 0 ? (
                          <tr>
                            <td colSpan={isReadOnly ? 7 : 8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No cloth pieces added yet. Click <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13, marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={handleAddItemRow}><Plus size={14} /> Add</button> to insert piece specifications.
                            </td>
                          </tr>
                        ) : (
                          formData.items.map((item, index) => (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.piece_no}
                                  onChange={e => handleGridCellChange(index, 'piece_no', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.vpc_no}
                                  onChange={e => handleGridCellChange(index, 'vpc_no', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.weight}
                                  onChange={e => handleGridCellChange(index, 'weight', Number(e.target.value))}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.meters}
                                  onChange={e => handleGridCellChange(index, 'meters', Number(e.target.value))}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.width}
                                  onChange={e => handleGridCellChange(index, 'width', e.target.value)}
                                  placeholder='e.g. 56.7"'
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  style={{ width: '100%', margin: 0, padding: '6px' }}
                                  value={item.vloom}
                                  onChange={e => handleGridCellChange(index, 'vloom', e.target.value)}
                                />
                              </td>
                              {!isReadOnly && (
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      style={{ padding: '4px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                                      onClick={handleAddItemRow}
                                    >
                                      <Plus size={14} /> Add
                                    </button>
                                    <button
                                      type="button"
                                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
                                      onClick={() => handleRemoveItemRow(index)}
                                    >
                                      <Trash2 size={16} color="#ef4444" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* SUMMARY SECTION */}
                  <div style={{ marginTop: 24, padding: '16px 24px', background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Pieces Received</span>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{formData.total_pieces} Rolls</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Weight</span>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{Number(formData.total_weight || 0).toFixed(2)} Kgs</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Meters</span>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{Number(formData.total_meters || 0).toFixed(2)} Mtr</div>
                    </div>
                  </div>

                  {/* Section 4: Material Reconciliation */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Material Reconciliation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px', marginBottom: 32 }}>
                    <div className="form-group">
                      <label>Warp Issued (Kgs)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        name="warp_issued_kgs" 
                        value={formData.warp_issued_kgs} 
                        onChange={handleHeaderChange} 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Weft Issued (Kgs)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        name="weft_issued_kgs" 
                        value={formData.weft_issued_kgs} 
                        onChange={handleHeaderChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Total Raw Material Issued (Kgs)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        readOnly 
                        value={(Number(formData.warp_issued_kgs || 0) + Number(formData.weft_issued_kgs || 0)).toFixed(2)} 
                        style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Fabric Received (Kgs)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        readOnly 
                        value={Number(formData.total_weight || 0).toFixed(2)} 
                        style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Weft Return (Kgs)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        name="weft_return_kgs" 
                        value={formData.weft_return_kgs} 
                        onChange={handleHeaderChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Beam Return (Kgs)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        name="beam_return_kgs" 
                        value={formData.beam_return_kgs} 
                        onChange={handleHeaderChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Weaving Waste (Kgs)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        name="weaving_waste_kgs" 
                        value={formData.weaving_waste_kgs} 
                        onChange={handleHeaderChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Weaving Waste (%)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        readOnly 
                        value={`${Number(formData.weaving_waste_pct || 0).toFixed(2)}%`} 
                        style={{ background: 'var(--bg-secondary)', fontWeight: 600, color: '#ef4444' }}
                      />
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

