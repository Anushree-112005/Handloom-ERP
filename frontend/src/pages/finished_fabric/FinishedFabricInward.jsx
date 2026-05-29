import { useState, useEffect } from 'react';
import { Box, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, FileSpreadsheet, ClipboardList, CheckCircle, RefreshCw } from 'lucide-react';
import { finishedFabricAPI, dropdownAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value, highlight = false }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    borderBottom: '1px dashed var(--border)', 
    paddingBottom: 4,
    background: highlight ? '#22c55e1a' : 'transparent',
    padding: highlight ? '4px 8px' : '0 0 4px 0',
    borderRadius: highlight ? 4 : 0
  }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: highlight ? '#22c55e' : 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function FinishedFabricInward() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [inwards, setInwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedViewInward, setSelectedViewInward] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown options
  const [options, setOptions] = useState({
    agents: [],
    transporters: [],
    all_parties: [],
    employees: [],
    masters: {}
  });

  // Initial Form State matching first image
  const initialForm = {
    // Upper section
    received_type: 'Purchase', // Inward Type
    ref_no: '', // Inw ID / Ref No
    inv_date: new Date().toISOString().split('T')[0], // Inw Date
    party_name: '', // Vendor Name
    dc_no: '', // Vendor DC No
    dc_date: new Date().toISOString().split('T')[0], // DC Date
    design_no: '', // Design No
    order_no: '', // IBPO
    vendor_order: '',
    gry_dc_no: '',
    vendor_order_mtr: '',
    gry_delivery_mtr: '',
    received_mtr: '',
    balance_mtr: '',

    // Left column details
    fabric_type: '', // Const / Fabric Type
    reed: '',
    pick: '',
    width: '',
    order_mtr: '',
    warp_mtr: '',
    inward_mtr: '',
    shed_no: '',
    detail_balance_mtr: '', // Balance Mtr (highlighted)
    lot_no: '',
    atti_no: '',
    total_pieces: 0, // Total Pc
    total_meters: 0, // Total Mtr
    inspection_type: '',
    inw_pin: '100',
    remarks: '', // Remarks
    status: 'Received'
  };

  const [formData, setFormData] = useState(initialForm);
  
  // Right side Grid Table (Items)
  // S.No, Pcno, Weight, VLoom, VPc No, Mtr
  const [items, setItems] = useState([
    { piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }
  ]);

  useEffect(() => {
    fetchInwards();
    fetchOptions();
  }, []);

  const fetchInwards = async () => {
    try {
      setLoading(true);
      const { data } = await finishedFabricAPI.list();
      setInwards(data);
    } catch (err) {
      console.error("Error fetching inwards:", err);
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

  // Automatically update totals & balance
  useEffect(() => {
    const totalPcs = items.length;
    const totalMtr = items.reduce((sum, item) => sum + (Number(item.meters) || 0), 0);
    
    // Balance Mtr = Grey Delivery Mtr - Received Mtr (or Vendor Order Mtr - Total Mtr)
    const gryDel = Number(formData.gry_delivery_mtr) || 0;
    const recMtr = totalMtr || Number(formData.received_mtr) || 0;
    const computedBal = (gryDel - recMtr).toFixed(2);

    // Left Column details balance
    const ordMtr = Number(formData.order_mtr) || 0;
    const computedDetBal = (ordMtr - recMtr).toFixed(2);

    setFormData(prev => ({
      ...prev,
      total_pieces: totalPcs,
      total_meters: totalMtr,
      received_mtr: recMtr.toFixed(2),
      balance_mtr: computedBal,
      inward_mtr: recMtr.toFixed(2),
      detail_balance_mtr: computedDetBal
    }));
  }, [items, formData.gry_delivery_mtr, formData.received_mtr, formData.order_mtr]);

  const handleOpenForm = (inward = null, readOnly = false) => {
    if (inward) {
      setEditingId(inward.id);
      
      let remarksParsed = {};
      try {
        if (inward.remarks) {
          remarksParsed = JSON.parse(inward.remarks);
        }
      } catch (e) {
        console.error("Error parsing extra fields:", e);
      }

      setFormData({
        received_type: inward.received_type || 'Purchase',
        ref_no: inward.ref_no || '',
        inv_date: inward.inv_date || '',
        party_name: inward.party_name || '',
        dc_no: inward.dc_no || '',
        dc_date: inward.dc_date || '',
        design_no: inward.design_no || '',
        order_no: inward.order_no || '',
        vendor_order: remarksParsed.vendor_order || '',
        gry_dc_no: remarksParsed.gry_dc_no || '',
        vendor_order_mtr: remarksParsed.vendor_order_mtr || '',
        gry_delivery_mtr: remarksParsed.gry_delivery_mtr || '',
        received_mtr: remarksParsed.received_mtr || '',
        balance_mtr: remarksParsed.balance_mtr || '',
        
        fabric_type: remarksParsed.fabric_type || '',
        reed: remarksParsed.reed || '',
        pick: remarksParsed.pick || '',
        width: remarksParsed.width || '',
        order_mtr: remarksParsed.order_mtr || '',
        warp_mtr: remarksParsed.warp_mtr || '',
        inward_mtr: remarksParsed.inward_mtr || '',
        shed_no: remarksParsed.shed_no || '',
        detail_balance_mtr: remarksParsed.detail_balance_mtr || '',
        lot_no: remarksParsed.lot_no || '',
        atti_no: remarksParsed.atti_no || '',
        total_pieces: inward.total_pieces || 0,
        total_meters: Number(inward.total_meters) || 0,
        inspection_type: remarksParsed.inspection_type || '',
        inw_pin: remarksParsed.inw_pin || '100',
        remarks: remarksParsed.remarks_text || '',
        status: inward.status || 'Received'
      });

      if (inward.items && inward.items.length > 0) {
        setItems(inward.items.map(item => ({
          piece_no: item.piece_no || '',
          weight: item.weight || '',
          v_loom: item.v_loom || '',
          v_pc_no: item.v_pc_no || '',
          meters: item.meters || ''
        })));
      } else {
        setItems([{ piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }]);
      }
    } else {
      setFormData(initialForm);
      setEditingId(null);
      setItems([{ piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }]);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, refNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Inward Entry ${refNo}?`)) {
      try {
        await finishedFabricAPI.delete(id);
        if (selectedViewInward?.id === id) setSelectedViewInward(null);
        fetchInwards();
      } catch (err) {
        console.error(err);
        alert("Error deleting Inward Entry.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formData.ref_no) {
      alert("Please enter Fabric Inw ID / Ref No");
      return;
    }

    const extra = {
      vendor_order: formData.vendor_order,
      gry_dc_no: formData.gry_dc_no,
      vendor_order_mtr: formData.vendor_order_mtr,
      gry_delivery_mtr: formData.gry_delivery_mtr,
      received_mtr: formData.received_mtr,
      balance_mtr: formData.balance_mtr,
      fabric_type: formData.fabric_type,
      reed: formData.reed,
      pick: formData.pick,
      width: formData.width,
      order_mtr: formData.order_mtr,
      warp_mtr: formData.warp_mtr,
      inward_mtr: formData.inward_mtr,
      shed_no: formData.shed_no,
      detail_balance_mtr: formData.detail_balance_mtr,
      lot_no: formData.lot_no,
      atti_no: formData.atti_no,
      inspection_type: formData.inspection_type,
      inw_pin: formData.inw_pin,
      remarks_text: formData.remarks
    };

    const payload = {
      ref_no: formData.ref_no,
      inv_no: formData.dc_no,
      inv_date: formData.inv_date,
      received_type: formData.received_type,
      party_name: formData.party_name || null,
      design_no: formData.design_no || null,
      order_no: formData.order_no || null,
      dc_no: formData.dc_no || null,
      dc_date: formData.dc_date,
      process_type: formData.inspection_type || null,
      total_meters: Number(formData.total_meters) || 0,
      total_pieces: Number(formData.total_pieces) || 0,
      remarks: JSON.stringify(extra),
      status: formData.status || 'Received',
      
      items: items.map((item) => ({
        design_no: formData.design_no || null,
        color: null,
        lot_no: formData.lot_no || null,
        meters: Number(item.meters) || 0,
        pieces: 1,
        width: Number(formData.width) || 0,
        weight: Number(item.weight) || 0,
        grade: 'A',
        v_loom: item.v_loom || null,
        v_pc_no: item.v_pc_no || null,
        piece_no: item.piece_no || null
      }))
    };

    try {
      if (editingId) {
        await finishedFabricAPI.update(editingId, payload);
      } else {
        await finishedFabricAPI.create(payload);
      }
      setView('list');
      fetchInwards();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving Fabric Inward Entry");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Finished Fabric Inwards Report", 14, 15);
    const tableColumn = ["Inw ID", "Date", "Party Name", "Design No", "Total Mtr", "Status"];
    const tableRows = [];

    filteredInwards.forEach(inw => {
      const rowData = [
        inw.ref_no || '-',
        inw.inv_date || '-',
        inw.party_name || '-',
        inw.design_no || '-',
        Number(inw.total_meters).toFixed(2),
        inw.status || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Fabric_Inwards_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredInwards.map(inw => ({
      "Inw ID": inw.ref_no,
      "Date": inw.inv_date,
      "Party Name": inw.party_name,
      "Design No": inw.design_no,
      "DC No": inw.dc_no,
      "DC Date": inw.dc_date,
      "Total Pieces": inw.total_pieces,
      "Total Meters": inw.total_meters,
      "Status": inw.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fabric Inwards");
    XLSX.writeFile(workbook, `Fabric_Inwards_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredInwards = inwards.filter(inw => {
    const matchesSearch = searchTerm === '' ||
      inw.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inw.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inw.design_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || inw.status === statusFilter;
    
    let matchesDate = true;
    if (inw.inv_date) {
      const sDate = new Date(inw.inv_date);
      if (fromDate) matchesDate = matchesDate && sDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && sDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalInwardsCount = inwards.length;
  const receivedCount = inwards.filter(i => i.status === 'Received').length;
  const inspectedCount = inwards.filter(i => i.status === 'Inspected').length;
  const totalMetersSum = inwards.reduce((sum, i) => sum + (Number(i.total_meters) || 0), 0);

  const handleCardClick = (statusVal) => {
    if (statusVal === 'Total') {
      setStatusFilter('All Status');
    } else {
      setStatusFilter(statusVal);
    }
  };

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Fabric Inward Entry' : editingId ? 'Edit Fabric Inward Entry' : 'Add Finished Fabric Inward Entry'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button type="submit" form="fabricInwardForm" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Inward' : 'Save Inward'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: '1. Inward Reference Info' }, { id: 'specs', label: '2. Fabric Specs & Metrics' }, { id: 'items', label: '3. Despatch Grid Details' }].map(tab => (
              <button 
                type="button"
                key={tab.id} onClick={() => setActiveTab(tab.id)}
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
            <form id="fabricInwardForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                
                {activeTab === 'general' && (
                  <div className="animate-fade">
{/* Section 1: Inward Reference details */}
              <h4 style={{ color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>1. Upper Inward Reference Info</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label>Inward Type</label>
                  <select className="form-control" name="received_type" value={formData.received_type} onChange={handleInputChange}>
                    <option value="Purchase">Purchase</option>
                    <option value="Job Inward">Job Inward</option>
                    <option value="Sales Return">Sales Return</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Inw ID (Ref No) *</label>
                  <input className="form-control" name="ref_no" value={formData.ref_no} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Inw Date *</label>
                  <input type="date" className="form-control" name="inv_date" value={formData.inv_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Vendor Name</label>
                  <select className="form-control" name="party_name" value={formData.party_name} onChange={handleInputChange}>
                    <option value="">-- Select Vendor --</option>
                    {options.all_parties.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vendor DC No</label>
                  <input className="form-control" name="dc_no" value={formData.dc_no} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>DC Date</label>
                  <input type="date" className="form-control" name="dc_date" value={formData.dc_date} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Design No</label>
                  <input className="form-control" name="design_no" value={formData.design_no} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>IBPO (Order No)</label>
                  <input className="form-control" name="order_no" value={formData.order_no} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Vendor Order</label>
                  <input className="form-control" name="vendor_order" value={formData.vendor_order} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Gry DC No</label>
                  <input className="form-control" name="gry_dc_no" value={formData.gry_dc_no} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Vendor Order Mtr</label>
                  <input className="form-control" type="number" name="vendor_order_mtr" value={formData.vendor_order_mtr} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Gry Delivery Mtr</label>
                  <input className="form-control" type="number" name="gry_delivery_mtr" value={formData.gry_delivery_mtr} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Received Mtr</label>
                  <input className="form-control" type="number" name="received_mtr" value={formData.received_mtr} readOnly style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label>Balance Mtr</label>
                  <input className="form-control" type="number" name="balance_mtr" value={formData.balance_mtr} readOnly style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Received">Received</option>
                    <option value="Inspected">Inspected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="animate-fade">
{/* Left Side: Technical detail form columns */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Fabric Specs & Metrics</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Const / Fabric Type</label>
                      <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="fabric_type" value={formData.fabric_type} onChange={handleInputChange} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Reed</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="reed" value={formData.reed} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Pick</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="pick" value={formData.pick} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Width</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="width" value={formData.width} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Order Mtr</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="order_mtr" value={formData.order_mtr} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Warp Mtr</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="warp_mtr" value={formData.warp_mtr} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Inward Mtr</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto', background: '#f1f5f9' }} name="inward_mtr" value={formData.inward_mtr} readOnly />
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Shed No</label>
                      <select className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="shed_no" value={formData.shed_no} onChange={handleInputChange}>
                        <option value="">-- Select Shed --</option>
                        <option value="Shed 1">Shed 1</option>
                        <option value="Shed 2">Shed 2</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Balance Mtr</label>
                      <input className="form-control" style={{ padding: '6px 10px', height: 'auto', background: '#22c55e20', color: '#15803d', fontWeight: 'bold' }} name="detail_balance_mtr" value={formData.detail_balance_mtr} readOnly />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Lot No</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="lot_no" value={formData.lot_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Atti No</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="atti_no" value={formData.atti_no} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Total Pc</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto', background: '#f1f5f9' }} value={formData.total_pieces} readOnly />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Total Mtr</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto', background: '#f1f5f9' }} value={formData.total_meters} readOnly />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Inspection Type</label>
                        <select className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="inspection_type" value={formData.inspection_type} onChange={handleInputChange}>
                          <option value="">-- Select --</option>
                          <option value="Self Inspection">Self Inspection</option>
                          <option value="Third Party">Third Party</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: 11 }}>Inw Pin</label>
                        <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="inw_pin" value={formData.inw_pin} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11 }}>Remarks</label>
                      <input className="form-control" style={{ padding: '6px 10px', height: 'auto' }} name="remarks" value={formData.remarks} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </div>
            )}

                {activeTab === 'items' && (
                  <div className="animate-fade">
{/* Right Side: Pieces detail grid table */}
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Despatch Grid Details</h5>
                  <div style={{ overflowX: 'auto', maxHeight: '550px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: 50, textAlign: 'center' }}>S.No</th>
                          <th>Pcno *</th>
                          <th>Weight</th>
                          <th>VLoom</th>
                          <th>VPc No</th>
                          <th>Mtr</th>
                          {!isReadOnly && <th style={{ width: 50, textAlign: 'center' }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                            <td>
                              <input 
                                className="form-control" 
                                value={item.piece_no} 
                                onChange={e => handleItemChange(index, 'piece_no', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input 
                                className="form-control" 
                                type="number"
                                value={item.weight} 
                                onChange={e => handleItemChange(index, 'weight', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                className="form-control" 
                                value={item.v_loom} 
                                onChange={e => handleItemChange(index, 'v_loom', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                className="form-control" 
                                value={item.v_pc_no} 
                                onChange={e => handleItemChange(index, 'v_pc_no', e.target.value)}
                              />
                            </td>
                            <td>
                              <input 
                                className="form-control" 
                                type="number"
                                value={item.meters} 
                                onChange={e => handleItemChange(index, 'meters', e.target.value)}
                              />
                            </td>
                            {!isReadOnly && (
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  type="button" 
                                  onClick={() => removeItemRow(index)} 
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!isReadOnly && (
                    <button 
                      type="button" 
                      onClick={addItemRow} 
                      className="btn btn-secondary"
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}
                    >
                      + Add Row
                    </button>
                  )}
                </div>
                  </div>
                )}

              </fieldset>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST / SPLIT VIEW ---
  return (
    <div className="animate-fade">
      
      {/* Upper header action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={24} color="var(--primary)" /> Finished Fabric Inward
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Log inward finished fabric pieces with loom info, widths, and inspection logs.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          {/* Export Menu */}
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
                  <FileSpreadsheet size={16} color="#10b981" /> Excel Sheet
                </button>
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add New Inward
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div
          className="card stat-card"
          onClick={() => handleCardClick('Total')}
          style={{ cursor: 'pointer', border: statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <ClipboardList size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Inwards</h3>
            <div className="value">{totalInwardsCount}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Received')}
          style={{ cursor: 'pointer', border: statusFilter === 'Received' ? '2px solid #3b82f6' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <RefreshCw size={24} />
          </div>
          <div className="stat-details">
            <h3>Received</h3>
            <div className="value">{receivedCount}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Inspected')}
          style={{ cursor: 'pointer', border: statusFilter === 'Inspected' ? '2px solid #10b981' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Inspected</h3>
            <div className="value">{inspectedCount}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ border: '1px solid transparent' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Inward Mtrs</h3>
            <div className="value" style={{ fontSize: 16, fontWeight: 700 }}>{totalMetersSum.toFixed(2)} Mtr</div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Inw ID, Design or Vendor..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="Received">Received</option>
            <option value="Inspected">Inspected</option>
            <option value="Cancelled">Cancelled</option>
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

      {/* Split Table & Details View layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT SIDE: INWARDS LIST TABLE */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inw ID</th>
                  <th>Date</th>
                  <th>Vendor Name</th>
                  <th>Design No</th>
                  <th>DC No</th>
                  <th>Total Meters</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>Loading Inward Entries...</td></tr>
                ) : filteredInwards.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No records found.</td></tr>
                ) : (
                  filteredInwards.map(inw => (
                    <tr
                      key={inw.id}
                      onClick={() => setSelectedViewInward(inw)}
                      style={{
                        cursor: 'pointer',
                        background: selectedViewInward?.id === inw.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{inw.ref_no}</td>
                      <td>{inw.inv_date}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{inw.party_name || '-'}</td>
                      <td>{inw.design_no || '-'}</td>
                      <td>{inw.dc_no || '-'}</td>
                      <td>{Number(inw.total_meters).toFixed(2)} Mtr</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 700, 
                          background: inw.status === 'Received' ? '#e0f2fe' : inw.status === 'Inspected' ? '#d1fae5' : '#fee2e2', 
                          color: inw.status === 'Received' ? '#0369a1' : inw.status === 'Inspected' ? '#065f46' : '#991b1b' 
                        }}>
                          {inw.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(inw, true)}
                            title="Full View"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(inw, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(inw.id, inw.ref_no, e)}
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

        {/* RIGHT SIDE: QUICK VIEW DETAILS PANE */}
        {selectedViewInward && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                  <ClipboardList size={18} /> Inward ID: {selectedViewInward.ref_no}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewInward, false)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => setSelectedViewInward(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                <DetailRow label="Inward Type" value={selectedViewInward.received_type} />
                <DetailRow label="Inward ID / Ref No" value={selectedViewInward.ref_no} />
                <DetailRow label="Inward Date" value={selectedViewInward.inv_date} />
                <DetailRow label="Vendor Name" value={selectedViewInward.party_name} />
                <DetailRow label="Vendor DC No" value={selectedViewInward.dc_no} />
                <DetailRow label="DC Date" value={selectedViewInward.dc_date} />
                <DetailRow label="Design No" value={selectedViewInward.design_no} />
                <DetailRow label="IBPO" value={selectedViewInward.order_no} />
                <DetailRow label="Total Pieces" value={selectedViewInward.total_pieces} />
                <DetailRow label="Total Meters" value={`${Number(selectedViewInward.total_meters).toFixed(2)} Mtr`} />
                <DetailRow label="Status" value={selectedViewInward.status} />

                {(() => {
                  try {
                    const extra = JSON.parse(selectedViewInward.remarks || "{}");
                    return (
                      <>
                        <DetailRow label="Const / Fabric Type" value={extra.fabric_type} />
                        <DetailRow label="Reed / Pick" value={`${extra.reed || '-'} / ${extra.pick || '-'}`} />
                        <DetailRow label="Width" value={extra.width} />
                        <DetailRow label="Shed No" value={extra.shed_no} />
                        <DetailRow label="Lot / Atti No" value={`${extra.lot_no || '-'} / ${extra.atti_no || '-'}`} />
                        <DetailRow label="Balance Meters" value={`${extra.detail_balance_mtr || '-'} Mtr`} highlight={true} />
                      </>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pieces Grid</h4>
                <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', background: 'var(--bg-secondary)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: 4, textAlign: 'left' }}>Pc No</th>
                        <th style={{ padding: 4, textAlign: 'right' }}>Weight</th>
                        <th style={{ padding: 4, textAlign: 'left' }}>Loom</th>
                        <th style={{ padding: 4, textAlign: 'right' }}>Meters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedViewInward.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dashed var(--border)' }}>
                          <td style={{ padding: 4 }}>{item.piece_no}</td>
                          <td style={{ padding: 4, textAlign: 'right' }}>{item.weight} kg</td>
                          <td style={{ padding: 4 }}>{item.v_loom}</td>
                          <td style={{ padding: 4, textAlign: 'right' }}>{item.meters} Mtr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
