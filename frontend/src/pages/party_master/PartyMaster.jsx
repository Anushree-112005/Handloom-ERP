import { useState, useEffect } from 'react';
import { Users, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, ShoppingCart, Briefcase, CheckCircle, Download, FileText } from 'lucide-react';
import { partyAPI, dropdownAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function PartyMaster() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedViewParty, setSelectedViewParty] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dynamic Options
  const [options, setOptions] = useState({
    agents: [], transporters: [], all_parties: [], employees: [],
    masters: {}
  });

  const initialForm = {
    party_type: '', customer_grade: '', status: 'Active',
    company_name: '', party_group: '', address: '', state_code: '',
    pincode: '', city: '', phone: '', sales_region: '', country: '',
    currency: '', contact_person: '', email: '', tally_no: '',
    address_sno: '1', tcs_applicable: 'No', tin_no: '', cst_no: '',
    gstin: '', gst_type: '', pan_no: '', tds: '', tds_percent: 0,
    pc_id: '', merchandiser: '', manager: '', bill_credit_days: 30,
    credit_limit: 0, account_incharge: '', deliver_party_name: '',
    payment_terms: '', transport_name: '', delivery_address: '', agent_name: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchParties();
    fetchOptions();
  }, []);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const { data } = await partyAPI.list();
      setParties(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchOptions = async () => {
    try {
      const { data } = await dropdownAPI.getAll();
      setOptions(data);
    } catch (err) { console.error("Error fetching dropdowns:", err); }
  };

  const handleOpenForm = (party = null, readOnly = false) => {
    if (party) {
      setFormData(party);
      setEditingId(party.id);
    } else {
      setFormData(initialForm);
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await partyAPI.delete(id);
        if (selectedViewParty?.id === id) setSelectedViewParty(null);
        fetchParties();
      } catch (err) {
        alert("Error deleting party. It may be in use.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (editingId) {
        await partyAPI.update(editingId, formData);
      } else {
        await partyAPI.create(formData);
      }
      setView('list');
      fetchParties();
      fetchOptions();
    } catch (err) {
      alert("Error saving party");
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (['bill_credit_days', 'credit_limit', 'tds_percent'].includes(name)) {
      value = value === '' ? 0 : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderOptions = (category) => {
    return (options.masters[category] || []).map(val => (
      <option key={val} value={val}>{val}</option>
    ));
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = searchTerm === '' ||
      p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm);

    const matchesType = typeFilter === 'All Types' || p.party_type === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || p.status === statusFilter;

    let matchesDate = true;
    if (p.created_at) {
      const partyDate = new Date(p.created_at);
      if (fromDate) matchesDate = matchesDate && partyDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && partyDate <= tDate;
      }
    }
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Party Master Report", 14, 15);
    const tableColumn = ["Code", "Business Name", "Party Type", "City", "GSTIN", "Phone"];
    const tableRows = [];

    filteredParties.forEach(p => {
      const rowData = [
        p.customer_code || '-',
        p.company_name || '-',
        p.party_type || '-',
        p.city || '-',
        p.gstin || '-',
        p.phone || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Party_Master_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const wsData = filteredParties.map(p => ({
      "Customer Code": p.customer_code,
      "Business Name": p.company_name,
      "Party Type": p.party_type,
      "Party Group": p.party_group,
      "Status": p.status,
      "Contact Person": p.contact_person,
      "Phone": p.phone,
      "Email": p.email,
      "Address": p.address,
      "City": p.city,
      "State Code": p.state_code,
      "Pincode": p.pincode,
      "Country": p.country,
      "GSTIN": p.gstin,
      "GST Type": p.gst_type,
      "PAN No": p.pan_no,
      "Tally No": p.tally_no,
      "TDS": p.tds,
      "TDS Percent": p.tds_percent,
      "Bill Credit Days": p.bill_credit_days,
      "Credit Limit": p.credit_limit,
      "Merchandiser": p.merchandiser,
      "Manager": p.manager,
      "Account Incharge": p.account_incharge,
      "Agent Name": p.agent_name,
      "Payment Terms": p.payment_terms,
      "Transport Name": p.transport_name,
      "Deliver Party Name": p.deliver_party_name
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parties");
    XLSX.writeFile(wb, `Party_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalParties = parties.length;
  const totalSales = parties.filter(p => p.party_type === 'Sales Party').length;
  const totalPurchase = parties.filter(p => p.party_type === 'Purchase Party').length;
  const activeParties = parties.filter(p => p.status === 'Active').length;

  const handleCardClick = (type) => {
    if (type === 'Total') {
      setTypeFilter('All Types');
      setStatusFilter('All Status');
    } else if (type === 'Sales Party') {
      setTypeFilter('Sales Party');
      setStatusFilter('All Status');
    } else if (type === 'Purchase Party') {
      setTypeFilter('Purchase Party');
      setStatusFilter('All Status');
    } else if (type === 'Active') {
      setTypeFilter('All Types');
      setStatusFilter('Active');
    }
  };

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isReadOnly ? 'View Party Details' : editingId ? 'Edit Party Details' : 'Add New Party'}
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setView('list')}>
              <X size={16} /> Close
            </button>
            {!isReadOnly && (
              <button type="submit" form="partyForm" className="btn btn-primary">
                <Save size={16} /> Save Party
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form id="partyForm" onSubmit={handleSubmit}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              {/* Group 1: Basic Details */}
              <h4 style={{ color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>1. Basic Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Party Type *</label>
                  <select className="form-control" name="party_type" value={formData.party_type} onChange={handleChange} required>
                    <option value="">-- Select Party Type --</option>
                    <option>Sales Party</option>
                    <option>Logistics</option>
                    <option>Processor</option>
                    <option>Yarn Dyeing</option>
                    <option>Yarn Coverter</option>
                    <option>Exports party</option>
                    <option>Own Shed</option>
                    <option>Washing/Finishing</option>
                    <option>Purchase Party</option>
                    <option>Agent</option>
                    <option>Weaving vendor</option>
                    <option>Bit Loom Weaver</option>
                    <option>Doubling</option>
                    <option>Weaving Unit</option>
                    <option>Testing Lab</option>
                    <option>Spares Supplier</option>
                    <option>Delivery Party</option>
                    <option>Postage/Courier</option>
                    <option>Warping/Sizing</option>
                    <option>General</option>
                    <option>Chemical Supplier</option>
                    <option>Printing</option>
                    <option>Fabric Dyeing</option>
                    <option>JobWorker</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Business Name *</label>
                  <input className="form-control" name="company_name" value={formData.company_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Party Group</label>
                  <select className="form-control" name="party_group" value={formData.party_group} onChange={handleChange}>
                    <option value="">-- Select Party Group --</option>
                    {renderOptions('party_group')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Customer Grade</label>
                  <select className="form-control" name="customer_grade" value={formData.customer_grade} onChange={handleChange}>
                    <option value="">-- Select Customer Grade --</option>
                    {renderOptions('customer_grade')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Point of Contact</label>
                  <input className="form-control" name="contact_person" value={formData.contact_person} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phone No</label>
                  <input className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Mail ID</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                </div>
              </div>

              {/* Group 2: Location & Address */}
              <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>2. Location & Address</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Complete Address</label>
                  <input className="form-control" name="address" value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>State / Code</label>
                  <select className="form-control" name="state_code" value={formData.state_code} onChange={handleChange}>
                    <option value="">-- Select State --</option>
                    {renderOptions('state_code')}
                  </select>
                </div>
                <div className="form-group">
                  <label>City</label>
                  <select className="form-control" name="city" value={formData.city} onChange={handleChange}>
                    <option value="">-- Select City --</option>
                    {renderOptions('city')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input className="form-control" name="pincode" value={formData.pincode} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Sales Region</label>
                  <select className="form-control" name="sales_region" value={formData.sales_region} onChange={handleChange}>
                    <option value="">-- Select Zone --</option>
                    {renderOptions('sales_region')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <select className="form-control" name="country" value={formData.country} onChange={handleChange}>
                    <option value="">-- Select Country --</option>
                    {renderOptions('country')}
                  </select>
                </div>
              </div>

              {/* Group 3: Tax & Legal Info */}
              <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>3. Tax & Legal Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input className="form-control" name="gstin" value={formData.gstin} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>GST Type</label>
                  <select className="form-control" name="gst_type" value={formData.gst_type} onChange={handleChange}>
                    <option value="">-- Select GST Type --</option>
                    {renderOptions('gst_type')}
                  </select>
                </div>
                <div className="form-group">
                  <label>PAN No</label>
                  <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Tally No</label>
                  <input className="form-control" name="tally_no" value={formData.tally_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>TDS</label>
                  <select className="form-control" name="tds" value={formData.tds} onChange={handleChange}>
                    <option value="">-- Select TDS --</option>
                    {renderOptions('tds')}
                  </select>
                </div>
                <div className="form-group">
                  <label>TDS %</label>
                  <input type="number" step="0.1" className="form-control" name="tds_percent" value={formData.tds_percent} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>TCS Applicable</label>
                  <select className="form-control" name="tcs_applicable" value={formData.tcs_applicable} onChange={handleChange}>
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address SNo</label>
                  <select className="form-control" name="address_sno" value={formData.address_sno} onChange={handleChange}>
                    <option>1</option><option>2</option><option>3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>TIN No</label>
                  <input className="form-control" name="tin_no" value={formData.tin_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>CST No</label>
                  <input className="form-control" name="cst_no" value={formData.cst_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Pc ID</label>
                  <input className="form-control" name="pc_id" value={formData.pc_id} onChange={handleChange} />
                </div>
              </div>

              {/* Group 4: Account & Logistics */}
              <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>4. Financial & Logistics</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Currency</label>
                  <select className="form-control" name="currency" value={formData.currency} onChange={handleChange}>
                    <option value="">-- Select Currency --</option>
                    {renderOptions('currency')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bill Credit Days</label>
                  <input type="number" className="form-control" name="bill_credit_days" value={formData.bill_credit_days} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Credit Limit Rs.</label>
                  <input type="number" className="form-control" name="credit_limit" value={formData.credit_limit} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Merchandiser</label>
                  <select className="form-control" name="merchandiser" value={formData.merchandiser} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Manager</label>
                  <select className="form-control" name="manager" value={formData.manager} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>A/c Incharge</label>
                  <select className="form-control" name="account_incharge" value={formData.account_incharge} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Agent Name</label>
                  <select className="form-control" name="agent_name" value={formData.agent_name} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.agents.map(ag => <option key={ag.id} value={ag.name}>{ag.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <select className="form-control" name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
                    <option value="">-- Select Payment Terms --</option>
                    {renderOptions('payment_terms')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Transport Name</label>
                  <select className="form-control" name="transport_name" value={formData.transport_name} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.transporters.map(tr => <option key={tr.id} value={tr.name}>{tr.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Deliver Party Name</label>
                  <select className="form-control" name="deliver_party_name" value={formData.deliver_party_name} onChange={handleChange}>
                    <option value="">-- Same as Business Name --</option>
                    {options.all_parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Delivery Address</label>
                  <input className="form-control" name="delivery_address" value={formData.delivery_address} onChange={handleChange} />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="var(--primary)" /> Party Master
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage all customers, suppliers, agents and transporters.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          {/* Export Dropdown */}
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

          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add New Party
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div
          className="card stat-card"
          onClick={() => handleCardClick('Total')}
          style={{ cursor: 'pointer', border: typeFilter === 'All Types' && statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Parties</h3>
            <div className="value">{totalParties}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Sales Party')}
          style={{ cursor: 'pointer', border: typeFilter === 'Sales Party' ? '2px solid #10b981' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-details">
            <h3>Sales Parties</h3>
            <div className="value">{totalSales}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Purchase Party')}
          style={{ cursor: 'pointer', border: typeFilter === 'Purchase Party' ? '2px solid #f59e0b' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-details">
            <h3>Purchase Parties</h3>
            <div className="value">{totalPurchase}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Active')}
          style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #8b5cf6' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Parties</h3>
            <div className="value">{activeParties}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>

        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Code, Name or Phone..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option>All Types</option>
            <option>Sales Party</option>
            <option>Logistics</option>
            <option>Processor</option>
            <option>Yarn Dyeing</option>
            <option>Yarn Coverter</option>
            <option>Exports party</option>
            <option>Own Shed</option>
            <option>Washing/Finishing</option>
            <option>Purchase Party</option>
            <option>Agent</option>
            <option>Weaving vendor</option>
            <option>Bit Loom Weaver</option>
            <option>Doubling</option>
            <option>Weaving Unit</option>
            <option>Testing Lab</option>
            <option>Spares Supplier</option>
            <option>Delivery Party</option>
            <option>Postage/Courier</option>
            <option>Warping/Sizing</option>
            <option>General</option>
            <option>Chemical Supplier</option>
            <option>Printing</option>
            <option>Fabric Dyeing</option>
            <option>JobWorker</option>
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

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT SIDE: TABLE */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Business Name</th><th>Type & Group</th>
                  <th>Contact & Phone</th><th>City</th><th>GST / PAN</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredParties.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No parties found matching criteria.</td></tr>
                ) : (
                  filteredParties.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedViewParty(p)}
                      style={{
                        cursor: 'pointer',
                        background: selectedViewParty?.id === p.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{p.customer_code}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.company_name}</td>
                      <td>
                        <span className="badge badge-active" style={{ marginBottom: 4 }}>{p.party_type}</span><br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.party_group}</span>
                      </td>
                      <td>
                        {p.contact_person || 'N/A'}<br />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.phone}</span>
                      </td>
                      <td>{p.city}</td>
                      <td>
                        <span style={{ fontSize: 12 }}>{p.gstin || 'N/A'}</span><br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.pan_no}</span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(p, true)}
                            title="Full Form View"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(p, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(p.id, p.company_name, e)}
                            title="Delete"
                          >
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
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
        {selectedViewParty && (
          <div style={{ flex: '0 0 350px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                  <Users size={18} /> {selectedViewParty.company_name}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewParty, false)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => setSelectedViewParty(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                <DetailRow label="Customer Code" value={selectedViewParty.customer_code} />
                <DetailRow label="Party Type" value={<span className="badge badge-active">{selectedViewParty.party_type}</span>} />
                <DetailRow label="Party Group" value={selectedViewParty.party_group} />
                <DetailRow label="Grade" value={selectedViewParty.customer_grade} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</h4>
                <DetailRow label="Point of Contact" value={selectedViewParty.contact_person} />
                <DetailRow label="Phone" value={selectedViewParty.phone} />
                <DetailRow label="Email" value={selectedViewParty.email} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</h4>
                <DetailRow label="City" value={selectedViewParty.city} />
                <DetailRow label="State" value={selectedViewParty.state_code} />
                <DetailRow label="Region" value={selectedViewParty.sales_region} />
                <DetailRow label="Country" value={selectedViewParty.country} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax & Legal</h4>
                <DetailRow label="GSTIN" value={selectedViewParty.gstin} />
                <DetailRow label="GST Type" value={selectedViewParty.gst_type} />
                <DetailRow label="PAN No" value={selectedViewParty.pan_no} />
                <DetailRow label="TDS Type" value={selectedViewParty.tds} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financials & Team</h4>
                <DetailRow label="Payment Terms" value={selectedViewParty.payment_terms} />
                <DetailRow label="Credit Days" value={selectedViewParty.bill_credit_days} />
                <DetailRow label="Merchandiser" value={selectedViewParty.merchandiser} />
                <DetailRow label="Manager" value={selectedViewParty.manager} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
