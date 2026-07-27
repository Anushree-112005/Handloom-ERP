import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, ShoppingCart, Briefcase, CheckCircle, Download, FileText, User, Phone, MapPin, IndianRupee, Mail, Globe, Box } from 'lucide-react';
import { partyAPI, dropdownAPI, subMasterAPI } from '../../services/api';
import SubMasterDropdown from '../../components/SubMasterDropdown';
import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoImg from '../../assets/logo.png';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

const isSalesParty = (p) => {
  if (!p) return false;
  const type = (p.party_type || '').toLowerCase();
  const group = (p.party_group || '').toLowerCase();

  const excludeTerms = [
    'job', 'worker', 'processor', 'dyeing', 'weaving', 'weaver', 'warping', 
    'sizing', 'printing', 'finishing', 'doubling', 'twisting', 'converter', 
    'coverter', 'loom', 'logistics', 'agent', 'courier', 'postage', 'testing', 
    'lab', 'washing', 'service'
  ];

  if (excludeTerms.some(term => type.includes(term) || group.includes(term))) {
    return false;
  }

  return (
    type.includes('sales') ||
    type.includes('customer') ||
    type.includes('buyer') ||
    group.includes('customer') ||
    group.includes('buyer')
  );
};

const isPurchaseParty = (p) => {
  if (!p) return false;
  const type = (p.party_type || '').toLowerCase();
  const group = (p.party_group || '').toLowerCase();

  const excludeTerms = [
    'job', 'worker', 'processor', 'dyeing', 'weaving', 'weaver', 'warping', 
    'sizing', 'printing', 'finishing', 'doubling', 'twisting', 'converter', 
    'coverter', 'loom', 'logistics', 'agent', 'courier', 'postage', 'testing', 
    'lab', 'washing', 'service'
  ];

  if (excludeTerms.some(term => type.includes(term) || group.includes(term))) {
    return false;
  }

  return (
    type.includes('purchase') ||
    type.includes('supplier') ||
    type.includes('vendor') ||
    group.includes('supplier') ||
    group.includes('vendor')
  );
};

export default function PartyMaster() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [view, setView] = useState('list'); // 'list' | 'form'
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  // Custom inline state removed — now handled by SubMasterDropdown component


  // Split view state
  const [selectedViewParty, setSelectedViewParty] = useState(null);
  const partyPreviewRef = useRef(null);

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
    company_name: '', party_group: '', address: '', state: '',
    pin_code: '', city: '', district: '', phone: '', sales_region: '', country: '',
    currency: '', contact_person: '', email: '', tally_no: '',
    address_sno: '1', tcs_applicable: 'No', tin_no: '', cst_no: '',
    gst_no: '', gst_type: '', pan_no: '', tds: '', tds_percent: 0,
    pc_id: '', merchandiser: '', manager: '', credit_days: 30,
    credit_limit: 0, account_incharge: '', deliver_party_name: '',
    payment_terms: '', transport_name: '', delivery_address: '', agent_name: '', buyer_name: '',
    address_type: 'Bill',
    addresses: []
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchParties();
    fetchOptions();
  }, []);

  useEffect(() => {
    if (queryId && parties.length > 0) {
      const matched = parties.find(p => String(p.id) === String(queryId));
      if (matched) {
        handleOpenForm(matched, true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [queryId, parties]);

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
      // Replace null values with empty strings to prevent React uncontrolled input warnings
      const sanitizedParty = Object.fromEntries(
        Object.entries(party).map(([k, v]) => [k, v === null ? '' : v])
      );
      setFormData({
        ...sanitizedParty,
        address_type: party.address_type || 'Bill',
        addresses: party.addresses || []
      });
      setEditingId(party.id);
    } else {
      setFormData(initialForm);
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setActiveTab('basic');
    setView('form');
  };

  const handleDelete = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      const payload = { ...formData };
      payload.credit_days = Number(payload.credit_days) || 0;
      payload.credit_limit = Number(payload.credit_limit) || 0;
      payload.tds_percent = Number(payload.tds_percent) || 0;
      
      if (editingId) {
        await partyAPI.update(editingId, payload);
      } else {
        await partyAPI.create(payload);
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
    if (['credit_days', 'credit_limit', 'tds_percent'].includes(name)) {
      value = value === '' ? '' : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // SubMasterDropdown helpers
  const handleFieldChange = (fieldName, newValue) => {
    setFormData(prev => ({ ...prev, [fieldName]: newValue }));
  };

  const handleRefreshOptions = async () => {
    try {
      const { data } = await dropdownAPI.getAll();
      setOptions(data);
    } catch (err) { console.error('Error refreshing dropdowns:', err); }
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

  const renderOptions = (category) => {
    return (options.masters[category] || []).map(val => (
      <option key={val} value={val}>{val}</option>
    ));
  };

  const renderMultipleAddressesSection = () => {
    return (formData.addresses || []).map((addr, idx) => (
      <div key={idx} style={{ marginTop: 24, borderTop: '1px dashed var(--border)', paddingTop: 24 }} className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h5 style={{ color: 'var(--primary)', margin: 0, fontSize: 14, fontWeight: 700 }}>
            Additional Address #{idx + 1}
          </h5>
          {!isReadOnly && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: 12, color: 'var(--danger, #ef4444)', borderColor: 'var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                const updated = formData.addresses.filter((_, i) => i !== idx);
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
            >
              <X size={12} /> Remove Address
            </button>
          )}
        </div>
        <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="form-group">
            <label>Address Type</label>
            <select
              className="form-control"
              value={addr.address_type || 'Bill'}
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].address_type = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            >
              <option value="Bill">Bill</option>
              <option value="Ship">Ship</option>
              <option value="Branch">Branch</option>
              <option value="Head Office">Head Office</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Complete Address</label>
            <input
              type="text"
              className="form-control"
              value={addr.address || ''}
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].address = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            />
          </div>
          <div className="form-group">
            <label>State</label>
            <select
              className="form-control"
              value={addr.state || ''}
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].state = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            >
              <option value="">-- Select State --</option>
              {renderOptions('state')}
            </select>
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              className="form-control"
              value={addr.city || ''}
              placeholder="Enter City"
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].city = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            />
          </div>
          <div className="form-group">
            <label>District</label>
            <select
              className="form-control"
              value={addr.district || ''}
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].district = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            >
              <option value="">-- Select District --</option>
              {renderOptions('district')}
            </select>
          </div>
          <div className="form-group">
            <label>Pincode</label>
            <input
              type="text"
              className="form-control"
              value={addr.pin_code || ''}
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].pin_code = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            />
          </div>
          <div className="form-group">
            <label>Sales Region</label>
            <select
              className="form-control"
              value={addr.sales_region || ''}
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].sales_region = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            >
              <option value="">-- Select Sales Region --</option>
              {renderOptions('sales_region')}
            </select>
          </div>
          <div className="form-group">
            <label>Country</label>
            <select
              className="form-control"
              value={addr.country || 'India'}
              onChange={(e) => {
                const updated = [...formData.addresses];
                updated[idx].country = e.target.value;
                setFormData(prev => ({ ...prev, addresses: updated }));
              }}
              disabled={isReadOnly}
            >
              <option value="">-- Select Country --</option>
              {renderOptions('country')}
            </select>
          </div>
        </div>
      </div>
    ));
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = searchTerm === '' ||
      p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm);

    const matchesType = typeFilter === 'All Types' ||
      (typeFilter === 'Sales Party' && isSalesParty(p)) ||
      (typeFilter === 'Sales' && isSalesParty(p)) ||
      (typeFilter === 'Purchase Party' && isPurchaseParty(p)) ||
      (typeFilter === 'Purchase' && isPurchaseParty(p)) ||
      p.party_type?.split(', ').includes(typeFilter);
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
        p.gst_no || '-',
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
      "District": p.district,
      "State": p.state,
      "Pincode": p.pin_code,
      "Country": p.country,
      "GSTIN": p.gst_no,
      "GST Type": p.gst_type,
      "PAN No": p.pan_no,
      "Tally No": p.tally_no,
      "TDS": p.tds,
      "TDS Percent": p.tds_percent,
      "Bill Credit Days": p.credit_days,
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

  const generatePartyPDF = async (party) => {
    if (partyPreviewRef.current) {
      const safeName = (party?.company_name || 'Party').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(partyPreviewRef.current, `Party_Profile_${safeName}.pdf`);
      return;
    }
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    // Load Logo for PDF
    try {
      const response = await fetch(logoImg);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64data = await new Promise((resolve) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
      // Draw image (x, y, width, height)
      doc.addImage(base64data, 'PNG', 40, y - 8, 45, 45);
    } catch (e) {
      console.error("Failed to load logo", e);
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(2);
      doc.rect(40, y, 30, 30);
    }
    
    // Header Left
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // #0f172a
    doc.setFont("helvetica", "bold");
    doc.text("DINESH EXPORTS", 80, y + 16);
    
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // #94a3b8
    doc.setFont("helvetica", "bold");
    doc.text("THE HOUSE OF FABRICS", 80, y + 28);
    
    // Header Right
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("PARTY MASTER PROFILE", pageWidth - 40, y + 10, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const rightX = pageWidth - 180;
    doc.text("Party Code", rightX, y + 30);
    doc.text(":", rightX + 60, y + 30);
    doc.setFont("helvetica", "bold");
    doc.text(party.customer_code || '-', rightX + 70, y + 30);

    doc.setFont("helvetica", "normal");
    doc.text("Status", rightX, y + 45);
    doc.text(":", rightX + 60, y + 45);
    doc.setFillColor(34, 197, 94);
    doc.rect(rightX + 70, y + 36, 40, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text((party.status || 'ACTIVE').toUpperCase(), rightX + 75, y + 45);

    // Thick Line
    y += 60;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(2);
    doc.line(40, y, pageWidth - 40, y);
    
    // Function to draw section
    const drawSection = (title, startX, startY, width, height) => {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.roundedRect(startX, startY, width, height, 4, 4);
      
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(startX - 1, startY - 10, 140, 18, 2, 2, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title, startX + 10, startY + 2);
    };

    y += 30;

    // Section 1: Party Details
    drawSection("1. PARTY DETAILS", 40, y, pageWidth - 80, 100);
    autoTable(doc, {
      startY: y + 15,
      margin: { left: 45, right: 45 },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', textColor: [15, 23, 42] },
        1: { cellWidth: 10, fontStyle: 'bold' },
        2: { cellWidth: 140, textColor: [15, 23, 42] },
        3: { cellWidth: 80, fontStyle: 'bold', textColor: [15, 23, 42] },
        4: { cellWidth: 10, fontStyle: 'bold' },
        5: { cellWidth: 140, textColor: [15, 23, 42] },
      },
      body: [
        ['Party Name', ':', party.company_name || '-', 'GST Number', ':', party.gst_no || '-'],
        ['Party Group', ':', party.party_group || '-', 'PAN Number', ':', party.pan_no || '-'],
        ['Party Type', ':', party.party_type || '-', 'Business Type', ':', 'Service'],
        ['Customer Code', ':', party.customer_code || '-', 'Status', ':', party.status || 'Active'],
      ],
      didDrawCell: (data) => {
        if (data.row.index < 3) {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.setLineDash([2, 2], 0);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          doc.setLineDash([], 0);
        }
      }
    });

    y += 120;
    const halfWidth = (pageWidth - 90) / 2;

    // Section 2 & 3
    drawSection("2. CONTACT DETAILS", 40, y, halfWidth, 100);
    autoTable(doc, {
      startY: y + 15,
      margin: { left: 45 },
      tableWidth: halfWidth - 10,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 10 }, 2: { cellWidth: halfWidth - 90 } },
      body: [
        ['Contact Person', ':', party.contact_person || '-'],
        ['Phone / Mobile', ':', party.phone || '-'],
        ['Email Address', ':', party.email || '-'],
        ['Website', ':', party.website || '-'],
      ],
      didDrawCell: (data) => {
        if (data.row.index < 3) {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.setLineDash([2, 2], 0);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          doc.setLineDash([], 0);
        }
      }
    });

    drawSection("3. ADDRESS DETAILS", 40 + halfWidth + 10, y, halfWidth, 100);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(party.address || '-', 55 + halfWidth + 10, y + 30);
    doc.text(`${party.city || '-'}, ${party.district || '-'}`, 55 + halfWidth + 10, y + 45);
    doc.text(`${party.state || '-'} - ${party.pin_code || '-'}`, 55 + halfWidth + 10, y + 60);
    doc.text(party.country || '-', 55 + halfWidth + 10, y + 75);

    y += 120;

    // Section 4 & 5
    drawSection("4. FINANCIAL DETAILS", 40, y, halfWidth, 110);
    autoTable(doc, {
      startY: y + 15,
      margin: { left: 45 },
      tableWidth: halfWidth - 10,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 90, fontStyle: 'bold' }, 1: { cellWidth: 10 }, 2: { cellWidth: halfWidth - 110 } },
      body: [
        ['Credit Limit', ':', `Rs. ${party.credit_limit || '0.00'}`],
        ['Credit Days', ':', `${party.credit_days || 0} Days`],
        ['Payment Terms', ':', party.payment_terms || 'Immediate'],
        ['Outstanding Amount', ':', 'Rs. 0.00'],
        ['Currency', ':', party.currency || 'INR'],
      ],
      didDrawCell: (data) => {
        if (data.row.index < 4) {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.setLineDash([2, 2], 0);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          doc.setLineDash([], 0);
        }
      }
    });

    drawSection("5. BUSINESS INFO", 40 + halfWidth + 10, y, halfWidth, 110);
    autoTable(doc, {
      startY: y + 15,
      margin: { left: 40 + halfWidth + 15 },
      tableWidth: halfWidth - 10,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 90, fontStyle: 'bold' }, 1: { cellWidth: 10 }, 2: { cellWidth: halfWidth - 110 } },
      body: [
        ['Pricing Type', ':', party.gst_type || 'Exclusive'],
        ['Tax Preference', ':', 'Taxable'],
        ['TDS Applicable', ':', party.tds ? 'Yes' : 'No'],
        ['E-Way Bill', ':', 'Yes'],
        ['Place of Supply', ':', `${party.state || 'Tamil Nadu'}`],
      ],
      didDrawCell: (data) => {
        if (data.row.index < 4) {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.setLineDash([2, 2], 0);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          doc.setLineDash([], 0);
        }
      }
    });

    y += 130;

    // Footer
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(2);
    doc.line(40, doc.internal.pageSize.getHeight() - 60, pageWidth - 40, doc.internal.pageSize.getHeight() - 60);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Dinesh Exports", 40, doc.internal.pageSize.getHeight() - 40);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("No. 123, Textile Street, Erode, Tamil Nadu - 638001", 40, doc.internal.pageSize.getHeight() - 30);
    
    doc.text("0424-1234567 | info@dineshexports.com", pageWidth / 2, doc.internal.pageSize.getHeight() - 40, { align: 'center' });
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("GSTIN: 33ABCDE1234F1Z5", pageWidth - 40, doc.internal.pageSize.getHeight() - 40, { align: 'right' });

    doc.save(`Party_Profile_${party.company_name || 'Party'}.pdf`);
  };
  const totalParties = parties.length;
  const totalSales = parties.filter(isSalesParty).length;
  const totalPurchase = parties.filter(isPurchaseParty).length;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            type="button"
            onClick={() => setView('list')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {isReadOnly ? 'View Party Details' : editingId ? 'Edit Party Details' : 'Add New Party'}
          </h2>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'basic', label: 'Basic Information' }
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
            <form id="partyForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                {/* Group 1: Basic Details */}
                {activeTab === 'basic' && (
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <SubMasterDropdown
                        label="Party Type"
                        name="party_type"
                        value={formData.party_type}
                        entity="party_type"
                        category="party_type"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        required
                        disabled={isReadOnly}
                        placeholder="-- Select Party Type --"
                        multiple={true}
                      />
                      <div className="form-group">
                        <label>Business Name *</label>
                        <input className="form-control" name="company_name" value={formData.company_name} onChange={handleChange} required />
                      </div>
                      <SubMasterDropdown
                        label="Party Group"
                        name="party_group"
                        value={formData.party_group}
                        entity="party_type_group"
                        category="party_group"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select Group --"
                      />

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

                    {/* Section 2: Location & Address */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                      <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
                        Location & Address
                      </h4>
                      {!isReadOnly && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => {
                            const newAddress = {
                              address: '', city: '', district: '', state: '', state_code: '', pin_code: '', country: 'India', sales_region: '', address_type: 'Delivery'
                            };
                            setFormData(prev => ({
                              ...prev,
                              addresses: [...(prev.addresses || []), newAddress]
                            }));
                          }}
                        >
                          <Plus size={14} /> Add Address
                        </button>
                      )}
                    </div>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Address Type</label>
                        <select className="form-control" name="address_type" value={formData.address_type || 'Bill'} onChange={handleChange}>
                          <option value="Bill">Bill</option>
                          <option value="Ship">Ship</option>
                          <option value="Branch">Branch</option>
                          <option value="Head Office">Head Office</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Complete Address</label>
                        <input className="form-control" name="address" value={formData.address} onChange={handleChange} />
                      </div>
                      <SubMasterDropdown
                        label="State"
                        name="state"
                        value={formData.state}
                        entity="state_master"
                        category="state"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select State --"
                      />
                      <div className="form-group">
                        <label>City</label>
                        <input
                          className="form-control"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter City"
                        />
                      </div>
                      <SubMasterDropdown
                        label="District"
                        name="district"
                        value={formData.district}
                        entity="district_city_master"
                        category="district"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select District --"
                        filterFn={(item) => {
                          if (!formData.state) return true;
                          return item.extra_field_1 === formData.state;
                        }}
                      />
                      <div className="form-group">
                        <label>Pincode</label>
                        <input className="form-control" name="pin_code" value={formData.pin_code} onChange={handleChange} />
                      </div>
                      <SubMasterDropdown
                        label="Sales Region"
                        name="sales_region"
                        value={formData.sales_region}
                        entity="sales_region_master"
                        category="sales_region"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select Sales Region --"
                      />
                      <SubMasterDropdown
                        label="Country"
                        name="country"
                        value={formData.country}
                        entity="country_master"
                        category="country"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select Country --"
                      />
                    </div>

                    {renderMultipleAddressesSection()}

                    {/* Section 3: Tax & Legal Info */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Tax & Legal Info
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>GSTIN</label>
                        <input className="form-control" name="gst_no" value={formData.gst_no} onChange={handleChange} />
                      </div>
                      <SubMasterDropdown
                        label="GST Type"
                        name="gst_type"
                        value={formData.gst_type}
                        entity="gst_type_master"
                        category="gst_type"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select GST Type --"
                      />
                      <div className="form-group">
                        <label>PAN No</label>
                        <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Tally No</label>
                        <input className="form-control" name="tally_no" value={formData.tally_no} onChange={handleChange} />
                      </div>
                      <SubMasterDropdown
                        label="TDS"
                        name="tds"
                        value={formData.tds}
                        entity="tds_master"
                        category="tds"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select TDS --"
                      />
                      <div className="form-group">
                        <label>TDS %</label>
                        <input type="number" step="0.1" className="form-control" name="tds_percent" value={formData.tds_percent} onChange={handleChange} />
                      </div>
                      <SubMasterDropdown
                        label="TCS Applicable"
                        name="tcs_applicable"
                        value={formData.tcs_applicable}
                        entity="tcs_master"
                        category="tcs_applicable"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select --"
                      />

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

                    {/* Section 4: Financial & Logistics */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Financial & Logistics
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <SubMasterDropdown
                        label="Currency"
                        name="currency"
                        value={formData.currency}
                        entity="currency_master"
                        category="currency"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select Currency --"
                      />
                      <div className="form-group">
                        <label>Bill Credit Days</label>
                        <input type="number" className="form-control" name="credit_days" value={formData.credit_days === '' ? '' : formData.credit_days} onChange={handleChange} disabled={isReadOnly} />
                      </div>
                      <div className="form-group">
                        <label>Credit Limit Rs.</label>
                        <input type="number" className="form-control" name="credit_limit" value={formData.credit_limit === '' ? '' : formData.credit_limit} onChange={handleChange} disabled={isReadOnly} />
                      </div>
                      <div className="form-group">
                        <label>Merchandiser</label>
                        <input className="form-control" name="merchandiser" value={formData.merchandiser || ''} onChange={handleChange} disabled={isReadOnly} placeholder="Select or type new..." />
                      </div>
                      <div className="form-group">
                        <label>Manager</label>
                        <input className="form-control" name="manager" value={formData.manager || ''} onChange={handleChange} disabled={isReadOnly} placeholder="Select or type new..." />
                      </div>
                      <div className="form-group">
                        <label>A/c Incharge</label>
                        <input className="form-control" name="account_incharge" value={formData.account_incharge || ''} onChange={handleChange} disabled={isReadOnly} placeholder="Select or type new..." />
                      </div>
                      <SubMasterDropdown
                        label="Agent Name"
                        name="agent_name"
                        value={formData.agent_name}
                        entity="agent_master"
                        category="agent_master"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select --"
                      />

                      <SubMasterDropdown
                        label="Payment Terms"
                        name="payment_terms"
                        value={formData.payment_terms}
                        entity="payment_terms_master"
                        category="payment_terms"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select Terms --"
                      />
                      <SubMasterDropdown
                        label="Transport Name"
                        name="transport_name"
                        value={formData.transport_name}
                        entity="transport_name_master"
                        category="transport_name_master"
                        options={options}
                        onChange={handleFieldChange}
                        onOptionsRefresh={handleRefreshOptions}
                        disabled={isReadOnly}
                        placeholder="-- Select --"
                      />
                      <div className="form-group">
                        <label>Deliver Party Name</label>
                        <select className="form-control" name="deliver_party_name" value={formData.deliver_party_name} onChange={handleChange} disabled={isReadOnly}>
                          <option value="">-- Same as Business Name --</option>
                          {formData.deliver_party_name && !options.all_parties.some(p => p.name === formData.deliver_party_name) && (
                            <option value={formData.deliver_party_name}>{formData.deliver_party_name}</option>
                          )}
                          {options.all_parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Delivery Address</label>
                        <input className="form-control" name="delivery_address" value={formData.delivery_address || ''} onChange={handleChange} disabled={isReadOnly} />
                      </div>
                    </div>
                  </div>
                )}


              </fieldset>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                  <X size={16} /> Close
                </button>
                {!isReadOnly && (
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Party
                  </button>
                )}
              </div>
            </form>
          </div>
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
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
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
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
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
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
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
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
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
            {options?.masters?.party_type?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
                  <th>Party no</th><th>Business Name</th><th>Type & Group</th>
                  <th>Contact & Phone</th><th>City</th><th>Merchandiser</th><th>Actions</th>
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
                        <span style={{ fontWeight: 600 }}>{p.merchandiser || 'N/A'}</span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setSelectedViewParty(p)}
                            title="Preview Party"
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

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</h4>
                <DetailRow label="Point of Contact" value={selectedViewParty.contact_person} />
                <DetailRow label="Phone" value={selectedViewParty.phone} />
                <DetailRow label="Email" value={selectedViewParty.email} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</h4>
                <DetailRow label="Address Type" value={selectedViewParty.address_type || 'Bill'} />
                <DetailRow label="Address" value={selectedViewParty.address} />
                <DetailRow label="City" value={selectedViewParty.city} />
                <DetailRow label="District" value={selectedViewParty.district} />
                <DetailRow label="State" value={selectedViewParty.state} />
                <DetailRow label="Region" value={selectedViewParty.sales_region} />
                <DetailRow label="Country" value={selectedViewParty.country} />

                {selectedViewParty.addresses && selectedViewParty.addresses.length > 0 && (
                  <>
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Other Addresses</h4>
                    {selectedViewParty.addresses.map((addr, idx) => (
                      <div key={idx} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8, fontSize: 12, background: 'var(--bg-primary)' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: 2 }}>{addr.address_type} Address</div>
                        <div style={{ color: 'var(--text-primary)' }}>{addr.address}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {addr.city}, {addr.district}, {addr.state} {addr.sales_region ? `(${addr.sales_region})` : ''} - {addr.pin_code}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax & Legal</h4>
                <DetailRow label="GSTIN" value={selectedViewParty.gst_no} />
                <DetailRow label="GST Type" value={selectedViewParty.gst_type} />
                <DetailRow label="PAN No" value={selectedViewParty.pan_no} />
                <DetailRow label="TDS Type" value={selectedViewParty.tds} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financials & Team</h4>
                <DetailRow label="Payment Terms" value={selectedViewParty.payment_terms} />
                <DetailRow label="Credit Days" value={selectedViewParty.credit_days} />
                <DetailRow label="Merchandiser" value={selectedViewParty.merchandiser} />
                <DetailRow label="Manager" value={selectedViewParty.manager} />
                <DetailRow label="Agent Name" value={selectedViewParty.agent_name} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420,
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    await partyAPI.delete(id);
                    if (selectedViewParty?.id === id) setSelectedViewParty(null);
                    fetchParties();
                  } catch (err) {
                    alert("Error deleting party. It may be in use.");
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Party Preview Modal */}
      {selectedViewParty && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} /> 
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Party Profile Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => generatePartyPDF(selectedViewParty)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewParty(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            {/* Scrollable Modal Body (Greyish background) */}
            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              
              {/* A4 Paper */}
              <div ref={partyPreviewRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>
                
                {/* Top Header Section */}
                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Dinesh Exports" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                         <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                         <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>PARTY MASTER PROFILE</h2>
                      
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Party Code</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedViewParty.customer_code}</div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewParty.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11 }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Generated By</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>Administrator</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thick Line */}
                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                {/* Body Content */}
                <div style={{ padding: '10px 40px 40px 40px' }}>
                  {/* Section 1 */}
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <User size={14} /> 1. PARTY DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        <InfoRow2 label="Party Name" value={selectedViewParty.company_name} />
                        <InfoRow2 label="Party Group" value={selectedViewParty.party_group || '-'} />
                        <InfoRow2 label="Party Type" value={selectedViewParty.party_type || '-'} />
                        <InfoRow2 label="Customer Code" value={selectedViewParty.customer_code} />
                      </div>
                      <div>
                        <InfoRow2 label="GST Number" value={selectedViewParty.gst_no || '-'} />
                        <InfoRow2 label="PAN Number" value={selectedViewParty.pan_no || '-'} />
                        <InfoRow2 label="Business Type" value={selectedViewParty.party_type || 'Service'} />
                        <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
                          <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>Status</div>
                          <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
                          <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>
                            <span style={{ border: '1px solid #22c55e', color: '#22c55e', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{selectedViewParty.status || 'Active'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 & 3 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                    {/* Section 2 */}
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px' }}>
                        <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                          <Phone size={14} /> 2. CONTACT DETAILS
                        </div>
                        <InfoRow2 label="Contact Person" value={selectedViewParty.contact_person || '-'} />
                        <InfoRow2 label="Phone / Mobile" value={selectedViewParty.phone || '-'} />
                        <InfoRow2 label="Email Address" value={selectedViewParty.email || '-'} />
                        <InfoRow2 label="Website" value={selectedViewParty.website || '-'} />
                    </div>
                    {/* Section 3 */}
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px' }}>
                        <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                          <MapPin size={14} /> 3. ADDRESS DETAILS
                        </div>
                        <div style={{ color: '#0f172a', fontSize: 12, lineHeight: '24px', fontWeight: 600, marginTop: 8 }}>
                          <div>{selectedViewParty.address || '-'}</div>
                          <div>{selectedViewParty.city || '-'}</div>
                          <div>{selectedViewParty.state || '-'} - {selectedViewParty.pin_code || '-'}</div>
                          <div>{selectedViewParty.country || '-'}</div>
                        </div>
                    </div>
                  </div>

                  {/* Section 4 & 5 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                    {/* Section 4 */}
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px' }}>
                        <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                          <IndianRupee size={14} /> 4. FINANCIAL DETAILS
                        </div>
                        <InfoRow2 label="Credit Limit" value={`₹ ${selectedViewParty.credit_limit || '0.00'}`} />
                        <InfoRow2 label="Credit Days" value={`${selectedViewParty.credit_days || 0} Days`} />
                        <InfoRow2 label="Payment Terms" value={selectedViewParty.payment_terms || 'Immediate'} />
                        <InfoRow2 label="Outstanding Amount" value="₹ 0.00" />
                        <InfoRow2 label="Currency" value={selectedViewParty.currency || 'INR'} />
                    </div>
                    {/* Section 5 */}
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px' }}>
                        <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                          <Briefcase size={14} /> 5. BUSINESS INFORMATION
                        </div>
                        <InfoRow2 label="Pricing Type" value={selectedViewParty.gst_type || 'Exclusive'} />
                        <InfoRow2 label="Tax Preference" value="Taxable" />
                        <InfoRow2 label="TDS Applicable" value={selectedViewParty.tds ? 'Yes' : 'No'} />
                        <InfoRow2 label="E-Way Bill Applicable" value="Yes" />
                        <InfoRow2 label="Place of Supply" value={`${selectedViewParty.state || 'Tamil Nadu'} (33)`} />
                    </div>
                  </div>

                  {/* Section 6 */}
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 6. ADDITIONAL INFORMATION
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                          <InfoRow2 label="Remarks" value="-" />
                          <InfoRow2 label="Created Date" value={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
                          <InfoRow2 label="Last Modified Date" value={new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
                      </div>
                      <div>
                          <InfoRow2 label="Created By" value="Administrator" />
                          <InfoRow2 label="Last Modified By" value="Administrator" />
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '32px 40px 16px 40px', marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, textAlign: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#0f172a', fontWeight: 800, fontSize: 11, marginBottom: 40 }}>
                            <User size={14} /> PREPARED BY
                        </div>
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12, color: '#0f172a', fontSize: 11, fontWeight: 700 }}>
                          Administrator
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#0f172a', fontWeight: 800, fontSize: 11, marginBottom: 40 }}>
                            <User size={14} /> AUTHORIZED BY
                        </div>
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12, color: '#0f172a', fontSize: 11, fontWeight: 700 }}>
                          Authorised Signatory
                        </div>
                      </div>
                  </div>

                </div>

                {/* Footer */}
                <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Dinesh Exports</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@dineshexports.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.dineshexports.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                      <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
