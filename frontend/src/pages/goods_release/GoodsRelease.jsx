import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, ShoppingCart, CheckCircle, Download, FileText, Briefcase, FileSpreadsheet } from 'lucide-react';
import { goodsReleaseAPI, dropdownAPI, partyAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function GoodsRelease() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedViewRelease, setSelectedViewRelease] = useState(null);

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
    gra_no: '',
    gra_date: new Date().toISOString().split('T')[0],
    inv_mode: 'Regular',
    bale_type: 'Regular',
    status: 'Draft',
    prepar_time: '',
    
    party_name: '',
    dis_no: '',
    date: new Date().toISOString().split('T')[0],
    delivery_at: '',
    
    invoice_at: '',
    agent: '',
    comm_pct: '',
    rate_mtr: '',
    delivery_at_address: '',
    
    delivery_st: '',
    due_days: '90',
    due_date: new Date().toISOString().split('T')[0],
    delivery_ins: '',

    // Footer columns
    total_bales: 0,
    total_meters: 0,
    tcs_value: '',
    tcs_pct: '0.01',
    tcs_amt: 0,
    gross_weight: '',
    net_weight: '',
    gross_amount: 0,
    transport: '',
    transport_mode: '',
    freight_mode: '',
    vehicle_no: '',
    lr_team: '',
    lr_no: '',
    lr_date: new Date().toISOString().split('T')[0],
    narration: '',
    discount_pct: '',
    tax_value: '',
    others: '',
    
    approval_status: 'Pending',
    approved_by: ''
  };

  const [formData, setFormData] = useState(initialForm);
  
  // Grid Table Items: Despatch Detail
  const [items, setItems] = useState([
    { design_no: '', color: '', bale_no: '', packing_slip_no: '', meters: '', rate: '', amount: 0 }
  ]);

  useEffect(() => {
    fetchReleases();
    fetchOptions();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const { data } = await goodsReleaseAPI.list();
      setReleases(data);
    } catch (err) {
      console.error("Error fetching releases:", err);
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

  // Auto-fill party addresses
  const handlePartyChange = async (partyName) => {
    if (!partyName) {
      setFormData(prev => ({
        ...prev,
        party_name: '',
        invoice_at: '',
        delivery_at_address: '',
        delivery_st: '',
        agent: '',
        due_days: '90'
      }));
      return;
    }

    try {
      const { data: partyList } = await partyAPI.list();
      const party = partyList.find(p => p.business_name === partyName);
      if (party) {
        setFormData(prev => {
          const updated = {
            ...prev,
            party_name: partyName,
            invoice_at: party.address || '',
            delivery_at_address: party.delivery_address || party.address || '',
            delivery_st: party.state_code || '',
            agent: party.agent_name || '',
            due_days: party.bill_credit_days ? String(party.bill_credit_days) : '90'
          };
          // Recalculate due date
          const days = Number(updated.due_days) || 0;
          const d = new Date(updated.gra_date);
          d.setDate(d.getDate() + days);
          updated.due_date = d.toISOString().split('T')[0];
          return updated;
        });
      } else {
        setFormData(prev => ({ ...prev, party_name: partyName }));
      }
    } catch (err) {
      console.error("Error setting party fields:", err);
      setFormData(prev => ({ ...prev, party_name: partyName }));
    }
  };

  // Automatically update totals and taxes
  useEffect(() => {
    const totalMtr = items.reduce((sum, item) => sum + (Number(item.meters) || 0), 0);
    
    // Total Bales count: sum up total bale count typed, or unique count
    const totalBales = items.reduce((sum, item) => {
      const val = item.bale_no ? item.bale_no.split(',').length : 0;
      return sum + val;
    }, 0);

    const grossAmt = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // TCS computation
    const tcsVal = Number(formData.tcs_value) || 0;
    const tcsPercent = Number(formData.tcs_pct) || 0;
    const tcsAmt = Number((tcsVal * tcsPercent).toFixed(2));

    setFormData(prev => ({
      ...prev,
      total_meters: totalMtr,
      total_bales: totalBales || items.length,
      gross_amount: grossAmt,
      tcs_amt: tcsAmt
    }));
  }, [items, formData.tcs_value, formData.tcs_pct]);

  const handleOpenForm = (rel = null, readOnly = false) => {
    if (rel) {
      setEditingId(rel.id);
      
      let remarksParsed = {};
      try {
        if (rel.remarks) {
          remarksParsed = JSON.parse(rel.remarks);
        }
      } catch (e) {
        console.error("Error parsing extra fields:", e);
      }

      setFormData({
        gra_no: rel.gra_no || '',
        gra_date: rel.gra_date || '',
        inv_mode: remarksParsed.inv_mode || 'Regular',
        bale_type: remarksParsed.bale_type || 'Regular',
        status: rel.status || 'Draft',
        prepar_time: remarksParsed.prepar_time || '',
        
        party_name: rel.party_name || '',
        dis_no: remarksParsed.dis_no || '',
        date: remarksParsed.date || '',
        delivery_at: remarksParsed.delivery_at || '',
        
        invoice_at: remarksParsed.invoice_at || '',
        agent: remarksParsed.agent || '',
        comm_pct: remarksParsed.comm_pct || '',
        rate_mtr: remarksParsed.rate_mtr || '',
        delivery_at_address: rel.delivery_address || '',
        
        delivery_st: remarksParsed.delivery_st || '',
        due_days: remarksParsed.due_days || '90',
        due_date: remarksParsed.due_date || '',
        delivery_ins: remarksParsed.delivery_ins || '',

        total_bales: rel.total_bales || 0,
        total_meters: Number(rel.total_meters) || 0,
        tcs_value: remarksParsed.tcs_value || '',
        tcs_pct: remarksParsed.tcs_pct || '0.01',
        tcs_amt: remarksParsed.tcs_amt || 0,
        gross_weight: rel.gross_weight || '',
        net_weight: rel.net_weight || '',
        gross_amount: remarksParsed.gross_amount || 0,
        transport: rel.transport_name || '',
        transport_mode: rel.transport_mode || '',
        freight_mode: remarksParsed.freight_mode || '',
        vehicle_no: rel.vehicle_no || '',
        lr_team: remarksParsed.lr_team || '',
        lr_no: rel.lr_no || '',
        lr_date: rel.lr_date || '',
        narration: remarksParsed.narration || '',
        discount_pct: remarksParsed.discount_pct || '',
        tax_value: remarksParsed.tax_value || '',
        others: remarksParsed.others || '',
        
        approval_status: rel.approval_status || 'Pending',
        approved_by: rel.approved_by || ''
      });

      if (rel.items && rel.items.length > 0) {
        setItems(rel.items.map(item => ({
          design_no: item.design_no || '',
          color: item.color || '',
          bale_no: item.bale_no || '',
          packing_slip_no: item.packing_slip_no || '',
          meters: item.meters || '',
          rate: item.rate || '',
          amount: Number(item.amount) || 0
        })));
      } else {
        setItems([{ design_no: '', color: '', bale_no: '', packing_slip_no: '', meters: '', rate: '', amount: 0 }]);
      }
    } else {
      setFormData(initialForm);
      setEditingId(null);
      setItems([{ design_no: '', color: '', bale_no: '', packing_slip_no: '', meters: '', rate: '', amount: 0 }]);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, graNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete GRA ${graNo}?`)) {
      try {
        await goodsReleaseAPI.delete(id);
        if (selectedViewRelease?.id === id) setSelectedViewRelease(null);
        fetchReleases();
      } catch (err) {
        console.error(err);
        alert("Error deleting GRA.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'due_days' || name === 'gra_date') {
        const graDateStr = name === 'gra_date' ? value : prev.gra_date;
        const days = name === 'due_days' ? Number(value) : Number(prev.due_days);
        if (graDateStr && days) {
          const d = new Date(graDateStr);
          d.setDate(d.getDate() + days);
          updated.due_date = d.toISOString().split('T')[0];
        }
      }
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      if (field === 'meters' || field === 'rate') {
        const meters = Number(copy[index].meters) || 0;
        const rate = Number(copy[index].rate) || 0;
        copy[index].amount = Number((meters * rate).toFixed(2));
      }
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { design_no: '', color: '', bale_no: '', packing_slip_no: '', meters: '', rate: '', amount: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formData.gra_no) {
      alert("Please enter GRA No");
      return;
    }

    const extra = {
      inv_mode: formData.inv_mode,
      bale_type: formData.bale_type,
      prepar_time: formData.prepar_time,
      dis_no: formData.dis_no,
      date: formData.date,
      delivery_at: formData.delivery_at,
      invoice_at: formData.invoice_at,
      agent: formData.agent,
      comm_pct: formData.comm_pct,
      rate_mtr: formData.rate_mtr,
      delivery_st: formData.delivery_st,
      due_days: formData.due_days,
      due_date: formData.due_date,
      delivery_ins: formData.delivery_ins,
      tcs_value: formData.tcs_value,
      tcs_pct: formData.tcs_pct,
      tcs_amt: formData.tcs_amt,
      gross_amount: formData.gross_amount,
      freight_mode: formData.freight_mode,
      lr_team: formData.lr_team,
      narration: formData.narration,
      discount_pct: formData.discount_pct,
      tax_value: formData.tax_value,
      others: formData.others
    };

    const payload = {
      gra_no: formData.gra_no,
      gra_date: formData.gra_date,
      party_name: formData.party_name || null,
      transport_mode: formData.transport_mode || null,
      transport_name: formData.transport || null,
      vehicle_no: formData.vehicle_no || null,
      lr_no: formData.lr_no || null,
      lr_date: formData.lr_date || null,
      delivery_address: formData.delivery_at_address || null,
      total_meters: Number(formData.total_meters) || 0,
      total_bales: Number(formData.total_bales) || 0,
      gross_weight: Number(formData.gross_weight) || 0,
      net_weight: Number(formData.net_weight) || 0,
      approval_status: formData.approval_status || 'Pending',
      approved_by: formData.approved_by || null,
      remarks: JSON.stringify(extra),
      status: formData.status || 'Draft',
      
      items: items.map(item => ({
        packing_slip_no: item.packing_slip_no || null,
        bale_no: item.bale_no || null,
        design_no: item.design_no || null,
        color: item.color || null,
        meters: Number(item.meters) || 0,
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
        pieces: 0,
        weight: 0
      }))
    };

    try {
      if (editingId) {
        await goodsReleaseAPI.update(editingId, payload);
      } else {
        await goodsReleaseAPI.create(payload);
      }
      setView('list');
      fetchReleases();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving Goods Release Advice");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Goods Release Advice (GRA) Report", 14, 15);
    const tableColumn = ["GRA No", "GRA Date", "Party Name", "Total Bales", "Total Mtr", "Status"];
    const tableRows = [];

    filteredReleases.forEach(rel => {
      const rowData = [
        rel.gra_no || '-',
        rel.gra_date || '-',
        rel.party_name || '-',
        rel.total_bales || '0',
        Number(rel.total_meters).toFixed(2),
        rel.status || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`GRA_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredReleases.map(rel => ({
      "GRA No": rel.gra_no,
      "GRA Date": rel.gra_date,
      "Party Name": rel.party_name,
      "Total Bales": rel.total_bales,
      "Total Meters": rel.total_meters,
      "Gross Weight": rel.gross_weight,
      "Vehicle No": rel.vehicle_no,
      "LR No": rel.lr_no,
      "Status": rel.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GRAs");
    XLSX.writeFile(workbook, `Goods_Releases_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredReleases = releases.filter(rel => {
    const matchesSearch = searchTerm === '' ||
      rel.gra_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.party_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || rel.status === statusFilter;
    
    let matchesDate = true;
    if (rel.gra_date) {
      const grDate = new Date(rel.gra_date);
      if (fromDate) matchesDate = matchesDate && grDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && grDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalGRA = releases.length;
  const draftGRA = releases.filter(r => r.status === 'Draft').length;
  const approvedGRA = releases.filter(r => r.approval_status === 'Approved').length;
  const totalMetersSum = releases.reduce((sum, r) => sum + (Number(r.total_meters) || 0), 0);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setView('list')}
                className="btn btn-secondary"
                style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={20} />
              </button>
              {isReadOnly ? 'View GRA Details' : editingId ? 'Edit Goods Release Advice' : 'Add New Goods Release Advice'}
            </h2>
          </div>
          {!isReadOnly && (
            <button type="submit" form="goodsReleaseForm" className="btn btn-primary">
              <Save size={18} /> Save Advice
            </button>
          )}
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form id="goodsReleaseForm" onSubmit={handleSubmit}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              {/* Group 1: Goods Release Advice Headers */}
              <h4 style={{ color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>1. Goods Release Advice Basic Info</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label>GRA No *</label>
                  <input className="form-control" name="gra_no" value={formData.gra_no} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>GRA Date *</label>
                  <input type="date" className="form-control" name="gra_date" value={formData.gra_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Inv Mode</label>
                  <select className="form-control" name="inv_mode" value={formData.inv_mode} onChange={handleInputChange}>
                    <option value="Regular">Regular</option>
                    <option value="Sample">Sample</option>
                    <option value="FOC">Free of Cost</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Bale Type</label>
                  <select className="form-control" name="bale_type" value={formData.bale_type} onChange={handleInputChange}>
                    <option value="Regular">Regular</option>
                    <option value="Box Packing">Box Packing</option>
                    <option value="Loose Pack">Loose Pack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Draft">Draft</option>
                    <option value="Released">Released</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prepar Time</label>
                  <input className="form-control" name="prepar_time" value={formData.prepar_time} onChange={handleInputChange} placeholder="e.g. 12:30 PM" />
                </div>
                <div className="form-group">
                  <label>Approval Status</label>
                  <select className="form-control" name="approval_status" value={formData.approval_status} onChange={handleInputChange}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Approved By</label>
                  <input className="form-control" name="approved_by" value={formData.approved_by} onChange={handleInputChange} />
                </div>
              </div>

              {/* Group 2: Party & Delivery Destinations */}
              <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>2. Party & Location Destinations</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Party Name *</label>
                  <select 
                    className="form-control" 
                    name="party_name" 
                    value={formData.party_name} 
                    onChange={e => handlePartyChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select Party --</option>
                    {options.all_parties.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>DIS No</label>
                  <select className="form-control" name="dis_no" value={formData.dis_no} onChange={handleInputChange}>
                    <option value="">-- Select DIS --</option>
                    <option value="DIS-901">DIS-901</option>
                    <option value="DIS-902">DIS-902</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-control" name="date" value={formData.date} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Delivery At (Destination)</label>
                  <select className="form-control" name="delivery_at" value={formData.delivery_at} onChange={handleInputChange}>
                    <option value="">-- Select Destination --</option>
                    <option value="Warehouse A">Warehouse A</option>
                    <option value="Erode Mill">Erode Mill</option>
                    <option value="Direct to Client">Direct to Client</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Invoice At (Billing Address)</label>
                  <input className="form-control" name="invoice_at" value={formData.invoice_at} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Agent</label>
                  <select className="form-control" name="agent" value={formData.agent} onChange={handleInputChange}>
                    <option value="">-- Select Agent --</option>
                    {options.agents.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Comm %</label>
                  <input className="form-control" type="number" step="0.01" name="comm_pct" value={formData.comm_pct} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Rate / Mtr</label>
                  <input className="form-control" type="number" step="0.01" name="rate_mtr" value={formData.rate_mtr} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Delivery At Address</label>
                  <input className="form-control" name="delivery_at_address" value={formData.delivery_at_address} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Delivery St</label>
                  <input className="form-control" name="delivery_st" value={formData.delivery_st} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Due Days</label>
                  <input className="form-control" type="number" name="due_days" value={formData.due_days} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" className="form-control" name="due_date" value={formData.due_date} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Delivery Instructions</label>
                  <input className="form-control" name="delivery_ins" value={formData.delivery_ins} onChange={handleInputChange} style={{ background: '#fef08a' }} />
                </div>
              </div>

              {/* Group 3: Despatch Detail (Grid Table) */}
              <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>3. Despatch Details</h4>
              <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60, textAlign: 'center' }}>S.No</th>
                      <th>Design No *</th>
                      <th>Design Color</th>
                      <th>Bale Nos</th>
                      <th>Pin (Slip No)</th>
                      <th style={{ width: 120 }}>Mtr *</th>
                      <th style={{ width: 120 }}>Rate *</th>
                      <th style={{ width: 140, textAlign: 'right' }}>Amount</th>
                      {!isReadOnly && <th style={{ width: 80, textAlign: 'center' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={item.design_no} 
                            onChange={e => handleItemChange(index, 'design_no', e.target.value)} 
                            placeholder="Design No"
                            required
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={item.color} 
                            onChange={e => handleItemChange(index, 'color', e.target.value)} 
                            placeholder="Color"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={item.bale_no} 
                            onChange={e => handleItemChange(index, 'bale_no', e.target.value)} 
                            placeholder="Bale Nos"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={item.packing_slip_no} 
                            onChange={e => handleItemChange(index, 'packing_slip_no', e.target.value)} 
                            placeholder="Packing Slip No"
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control" 
                            value={item.meters} 
                            onChange={e => handleItemChange(index, 'meters', e.target.value)} 
                            placeholder="Meters"
                            required
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control" 
                            value={item.rate} 
                            onChange={e => handleItemChange(index, 'rate', e.target.value)} 
                            placeholder="Rate"
                            required
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        {!isReadOnly && (
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              type="button" 
                              onClick={() => removeItemRow(index)} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                              disabled={items.length === 1}
                            >
                              Remove
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
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}
                >
                  + Add Item Row
                </button>
              )}

              {/* Group 4: Charges & Logistics Summary */}
              <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>4. Grand Summary & Logistics Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Total Bales</label>
                  <input className="form-control" type="number" value={formData.total_bales} readOnly style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label>Total Mtr</label>
                  <input className="form-control" type="number" value={formData.total_meters} readOnly style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label>Gross Amount</label>
                  <input className="form-control" value={`₹${Number(formData.gross_amount).toFixed(2)}`} readOnly style={{ background: '#f1f5f9' }} />
                </div>
                
                <div className="form-group">
                  <label>TCS Value</label>
                  <input className="form-control" type="number" name="tcs_value" value={formData.tcs_value} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>TCS%</label>
                  <input className="form-control" name="tcs_pct" value={formData.tcs_pct} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>TCS Amt</label>
                  <input className="form-control" value={`₹${formData.tcs_amt.toFixed(2)}`} readOnly style={{ background: '#f1f5f9' }} />
                </div>

                <div className="form-group">
                  <label>Gross Wt</label>
                  <input className="form-control" type="number" name="gross_weight" value={formData.gross_weight} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Net Wt</label>
                  <input className="form-control" type="number" name="net_weight" value={formData.net_weight} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Discount%</label>
                  <input className="form-control" type="number" name="discount_pct" value={formData.discount_pct} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Transport Name</label>
                  <select className="form-control" name="transport" value={formData.transport} onChange={handleInputChange}>
                    <option value="">-- Select Transport --</option>
                    {options.transporters.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Transport Mode</label>
                  <select className="form-control" name="transport_mode" value={formData.transport_mode} onChange={handleInputChange}>
                    <option value="">-- Select Mode --</option>
                    <option value="Road">Road</option><option value="Rail">Rail</option><option value="Air">Air</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Freight Mode</label>
                  <select className="form-control" name="freight_mode" value={formData.freight_mode} onChange={handleInputChange}>
                    <option value="">-- Select Freight --</option>
                    <option value="To Pay">To Pay</option><option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Vehicle No</label>
                  <input className="form-control" name="vehicle_no" value={formData.vehicle_no} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>LR Team</label>
                  <select className="form-control" name="lr_team" value={formData.lr_team} onChange={handleInputChange}>
                    <option value="">-- Select Team --</option>
                    <option value="Primary Logistics">Primary Logistics</option>
                    <option value="Secondary Delivery">Secondary Delivery</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>LR No</label>
                  <input className="form-control" name="lr_no" value={formData.lr_no} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>LR Date</label>
                  <input type="date" className="form-control" name="lr_date" value={formData.lr_date} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Tax Value</label>
                  <input className="form-control" type="number" name="tax_value" value={formData.tax_value} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Others</label>
                  <input className="form-control" name="others" value={formData.others} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Narration</label>
                  <input className="form-control" name="narration" value={formData.narration} onChange={handleInputChange} />
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    );
  }

  // --- LIST / SPLIT VIEW ---
  return (
    <div className="animate-fade">
      
      {/* Upper header action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={24} color="var(--primary)" /> Goods Release Advice (GRA)
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage goods release advice forms and coordinate despatching.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>

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
            <Plus size={18} /> Add New GRA
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
            <h3>Total GRAs</h3>
            <div className="value">{totalGRA}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Draft')}
          style={{ cursor: 'pointer', border: statusFilter === 'Draft' ? '2px solid #f59e0b' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <FileText size={24} />
          </div>
          <div className="stat-details">
            <h3>Draft GRAs</h3>
            <div className="value">{draftGRA}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ border: '1px solid transparent' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Approved GRAs</h3>
            <div className="value">{approvedGRA}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ border: '1px solid transparent' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Meters</h3>
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
            placeholder="Search by GRA No or Party Name..."
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
            <option value="Draft">Draft</option>
            <option value="Released">Released</option>
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

        {/* LEFT SIDE: GRA TABLE */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>GRA No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Bales</th>
                  <th>Meters</th>
                  <th>Appr Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading GRA records...</td></tr>
                ) : filteredReleases.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No records found.</td></tr>
                ) : (
                  filteredReleases.map(rel => (
                    <tr
                      key={rel.id}
                      onClick={() => setSelectedViewRelease(rel)}
                      style={{
                        cursor: 'pointer',
                        background: selectedViewRelease?.id === rel.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{rel.gra_no}</td>
                      <td>{rel.gra_date}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{rel.party_name || '-'}</td>
                      <td>{rel.total_bales}</td>
                      <td>{Number(rel.total_meters).toFixed(2)} Mtr</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: 20, 
                          fontSize: 11, 
                          fontWeight: 700, 
                          background: rel.approval_status === 'Approved' ? '#d1fae5' : rel.approval_status === 'Pending' ? '#fffbeb' : '#fee2e2', 
                          color: rel.approval_status === 'Approved' ? '#065f46' : rel.approval_status === 'Pending' ? '#b45309' : '#991b1b' 
                        }}>
                          {rel.approval_status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(rel, true)}
                            title="Full View"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(rel, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(rel.id, rel.gra_no, e)}
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

        {/* RIGHT SIDE: DETAILS PANE */}
        {selectedViewRelease && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                  <ClipboardList size={18} /> GRA {selectedViewRelease.gra_no}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewRelease, false)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => setSelectedViewRelease(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                <DetailRow label="GRA No" value={selectedViewRelease.gra_no} />
                <DetailRow label="GRA Date" value={selectedViewRelease.gra_date} />
                <DetailRow label="Party Name" value={selectedViewRelease.party_name} />
                <DetailRow label="Delivery Address" value={selectedViewRelease.delivery_address} />
                <DetailRow label="Transport Mode" value={selectedViewRelease.transport_mode} />
                <DetailRow label="Transport Name" value={selectedViewRelease.transport_name} />
                <DetailRow label="Vehicle No" value={selectedViewRelease.vehicle_no} />
                <DetailRow label="LR No" value={selectedViewRelease.lr_no} />
                <DetailRow label="LR Date" value={selectedViewRelease.lr_date} />
                <DetailRow label="Total Bales" value={selectedViewRelease.total_bales} />
                <DetailRow label="Total Meters" value={`${Number(selectedViewRelease.total_meters).toFixed(2)} Mtr`} />
                <DetailRow label="Gross Weight" value={selectedViewRelease.gross_weight} />
                <DetailRow label="Net Weight" value={selectedViewRelease.net_weight} />
                <DetailRow label="Approval Status" value={selectedViewRelease.approval_status} />
                <DetailRow label="Approved By" value={selectedViewRelease.approved_by} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Despatch Details</h4>
                <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', background: 'var(--bg-secondary)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: 4, textAlign: 'left' }}>Design</th>
                        <th style={{ padding: 4, textAlign: 'left' }}>Color</th>
                        <th style={{ padding: 4, textAlign: 'right' }}>Mtr</th>
                        <th style={{ padding: 4, textAlign: 'right' }}>Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedViewRelease.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px dashed var(--border)' }}>
                          <td style={{ padding: 4 }}>{item.design_no}</td>
                          <td style={{ padding: 4 }}>{item.color}</td>
                          <td style={{ padding: 4, textAlign: 'right' }}>{item.meters}</td>
                          <td style={{ padding: 4, textAlign: 'right' }}>₹{Number(item.amount).toFixed(0)}</td>
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
