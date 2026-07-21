import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, FileText, Download, Filter, ArrowLeft, Printer, RefreshCw, AlertCircle, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { buyerOrderAmendmentAPI } from '../../services/api';

// Mock Data for Auto Fetch
const MOCK_IBPOS = [
  { ibpo: 'IBPO-2023-001', party: 'TexCorp International', po_date: '2023-10-01', design_no: 'SP-101', quality: '100% Cotton 40s', order_mtr: 5000, tolerance: 5, start_date: '2023-10-15', delivery_start: '2023-11-01', party_comp: '2023-11-15', company_comp: '2023-11-10', last_dispatch_date: '2023-11-05', total_dispatch_mtr: 1000, party_rate: 150 },
  { ibpo: 'IBPO-2023-002', party: 'Global Fabrics Ltd', po_date: '2023-10-05', design_no: 'SP-205', quality: 'Poly Viscose Blend', order_mtr: 3000, tolerance: 2, start_date: '2023-10-20', delivery_start: '2023-11-05', party_comp: '2023-11-20', company_comp: '2023-11-15', last_dispatch_date: '', total_dispatch_mtr: 0, party_rate: 180 },
];

export default function BuyerOrderAmendment() {
  const [amendments, setAmendments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    amendment_no: '',
    amendment_date: new Date().toISOString().split('T')[0],
    last_amendment_date: '',
    ibpo_ref_no: '',
    po_date: '',
    party_name: '',
    design_no: '',
    quality_print_name: '',
    order_mtr: 0,
    tolerance_pct: 0,
    delivery_starting: '',
    party_completion_date: '',
    company_completion_date: '',
    last_dispatch_date: '',
    total_dispatch_mtr: 0,
    party_rate: 0,
    amendment_mtr: 0,
    total_mtr: 0,
    status: 'Pending',
    amendment_details: [] // table rows
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchAmendments();
  }, []);

  const fetchAmendments = async () => {
    try {
      const res = await buyerOrderAmendmentAPI.list();
      setAmendments(res.data || []);
    } catch (e) {
      console.error('Failed to fetch amendments', e);
    }
  };

  const getNextAmdNumber = () => {
    return `AMD-${String(amendments.length + 1).padStart(4, '0')}`;
  };

  // Auto Calculations
  useEffect(() => {
    const totalAmdMtr = form.amendment_details.reduce((sum, item) => sum + (parseFloat(item.amendment_order_mtr) || 0), 0);
    const orderMtr = parseFloat(form.order_mtr) || 0;
    const totalMtr = orderMtr + totalAmdMtr;

    setForm(prev => ({
      ...prev,
      amendment_mtr: totalAmdMtr,
      total_mtr: totalMtr
    }));
  }, [form.amendment_details, form.order_mtr]);

  const handleOpenForm = (amd = null, readOnly = false) => {
    if (amd) {
      setForm(amd);
      setEditingId(amd.id);
    } else {
      setForm({ ...initialForm, amendment_no: getNextAmdNumber(), amendment_date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-fetch logic
    if (name === 'ibpo_ref_no') {
      const selected = MOCK_IBPOS.find(o => o.ibpo === value);
      if (selected) {
        setForm(prev => ({
          ...prev,
          ibpo_ref_no: value,
          po_date: selected.po_date,
          party_name: selected.party,
          design_no: selected.design_no,
          quality_print_name: selected.quality,
          order_mtr: selected.order_mtr,
          tolerance_pct: selected.tolerance,
          delivery_starting: selected.delivery_start,
          party_completion_date: selected.party_comp,
          company_completion_date: selected.company_comp,
          last_dispatch_date: selected.last_dispatch_date,
          total_dispatch_mtr: selected.total_dispatch_mtr,
          party_rate: selected.party_rate,
        }));
      } else {
        setForm(prev => ({ ...prev, ibpo_ref_no: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Amendment Detail Handlers
  const addAmendmentDetail = () => {
    const newDetail = {
      id: Date.now(),
      order_date: new Date().toISOString().split('T')[0],
      completion_date: '',
      amendment_order_mtr: 0,
      amendment_type: 'Quantity',
      reason: ''
    };
    setForm(prev => ({ ...prev, amendment_details: [...prev.amendment_details, newDetail] }));
  };

  const updateAmendmentDetail = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      amendment_details: prev.amendment_details.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeAmendmentDetail = (id) => {
    setForm(prev => ({
      ...prev,
      amendment_details: prev.amendment_details.filter(item => item.id !== id)
    }));
  };

  const handleSave = () => {
    // Basic validation
    if (!form.ibpo_ref_no) {
      alert("Please select a Posting Reference / IBPO No.");
      return;
    }
    if (form.amendment_details.length === 0) {
      alert("Please add at least one amendment detail row.");
      return;
    }

    const payload = {
      ...form,
      details: form.amendment_details.map(d => ({
        order_date: d.order_date || null,
        completion_date: d.completion_date || null,
        amendment_order_mtr: d.amendment_order_mtr || 0,
        amendment_type: d.amendment_type,
        reason: d.reason
      }))
    };

    if (editingId) {
      buyerOrderAmendmentAPI.update(editingId, payload)
        .then(() => {
          fetchAmendments();
          setShowForm(false);
        })
        .catch(e => {
          console.error('Failed to update amendment', e);
          alert('Failed to save amendment.');
        });
    } else {
      buyerOrderAmendmentAPI.create(payload)
        .then(() => {
          fetchAmendments();
          setShowForm(false);
        })
        .catch(e => {
          console.error('Failed to create amendment', e);
          alert('Failed to save amendment.');
        });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this amendment?')) {
      try {
        await buyerOrderAmendmentAPI.delete(id);
        await fetchAmendments();
      } catch (e) {
        console.error('Failed to delete amendment', e);
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Buyer Order Amendment History`, 14, 15);
    const headers = [["Amd No", "Order No", "Requested By", "Date", "Status"]];
    const rows = amendments.map(a => [
      a.amendment_no, a.ibpo_ref_no, a.requested_by, a.amendment_date, a.status
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Amendments_History_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = amendments.map(a => ({
      "Amendment No": a.amendment_no,
      "Order No": a.ibpo_ref_no,
      "Requested By": a.requested_by,
      "Date": a.amendment_date,
      "Status": a.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Amendments");
    XLSX.writeFile(wb, `Amendments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredAmendments = amendments.filter(a => 
    (a.amendment_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.ibpo_ref_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit2 size={24} color="var(--primary)" /> Buyer Order Amendment
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage buyer order changes and amendments.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Export
                </button>
                {showExportMenu && (
                  <>
                    <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                      <button onClick={() => { setShowExportMenu(false); exportPDF(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FileText size={16} color="#ef4444" /> PDF Report
                      </button>
                      <button onClick={() => { setShowExportMenu(false); exportExcel(); }} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Download size={16} color="#10b981" /> Excel Sheet
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => handleOpenForm(null)}>
                <Plus size={16} /> New Amendment
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Total Amendments</h3><div className="value">
                {amendments.length}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Pending</h3><div className="value">
                {amendments.filter(a => a.status === 'Pending').length}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Approved</h3><div className="value">
                {amendments.filter(a => a.status === 'Approved').length}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><AlertCircle size={24} /></div>
              <div className="stat-details"><h3>Rejected</h3><div className="value">
                {amendments.filter(a => a.status === 'Rejected').length}
              </div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search by Amendment No, IBPO..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><Filter size={16} /><span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span></div>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option>
              </select>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Amendment No</th>
                    <th>IBPO No</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAmendments.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No amendments found.</td></tr>
                  ) : filteredAmendments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{a.amendment_no}</td>
                      <td>{a.ibpo_ref_no}</td>
                      <td>{a.amendment_date}</td>
                      <td>
                        <span className="badge" style={{ 
                          background: a.status === 'Approved' ? '#dcfce7' : a.status === 'Rejected' ? '#fee2e2' : '#fef3c7', 
                          color: a.status === 'Approved' ? '#166534' : a.status === 'Rejected' ? '#991b1b' : '#92400e' 
                        }}>
                          {a.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(a, true)} title="View"><Eye size={14} /></button>
                          {a.status === 'Pending' && (
                            <>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(a, false)} title="Edit"><Edit2 size={14} /></button>
                              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleDelete(a.id)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {/* Header */}
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {isReadOnly ? 'View Amendment' : editingId ? 'Edit Amendment' : 'New Amendment Entry'}
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 13 }}>
                {form.amendment_no || 'AMD-NEW'}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
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
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={18} /> Amendment Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="animate-fade">
                {/* SECTION 1: AMENDMENT INFORMATION */}
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Amendment Information</h4>
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  
                  {/* Basic Details */}
                  <div className="form-group">
                    <label>Amendment No</label>
                    <input type="text" className="form-control" name="amendment_no" value={form.amendment_no} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                  </div>
                  <div className="form-group">
                    <label>Amendment Date</label>
                    <input type="date" className="form-control" name="amendment_date" value={form.amendment_date} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Last Amendment Date</label>
                    <input type="date" className="form-control" name="last_amendment_date" value={form.last_amendment_date} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Posting Reference No / IBPO *</label>
                    <select className="form-control" name="ibpo_ref_no" value={form.ibpo_ref_no} onChange={handleChange} required>
                      <option value="">Select IBPO...</option>
                      {MOCK_IBPOS.map(o => <option key={o.ibpo} value={o.ibpo}>{o.ibpo} - {o.party}</option>)}
                    </select>
                  </div>
                  
                  {/* Buyer Order Details */}
                  <div className="form-group">
                    <label>PO Date</label>
                    <input type="date" className="form-control" name="po_date" value={form.po_date} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Party Name</label>
                    <input type="text" className="form-control" name="party_name" value={form.party_name} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Design No (SP No)</label>
                    <input type="text" className="form-control" name="design_no" value={form.design_no} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Quality / Print Name</label>
                    <input type="text" className="form-control" name="quality_print_name" value={form.quality_print_name} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  
                  {/* Order Information */}
                  <div className="form-group">
                    <label>Order MTR</label>
                    <input type="number" className="form-control" name="order_mtr" value={form.order_mtr} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Tolerance %</label>
                    <input type="number" className="form-control" name="tolerance_pct" value={form.tolerance_pct} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Amendment MTR</label>
                    <input type="number" className="form-control" name="amendment_mtr" value={form.amendment_mtr} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 600, color: 'var(--primary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Total MTR</label>
                    <input type="number" className="form-control" name="total_mtr" value={form.total_mtr} disabled style={{ background: 'var(--bg-secondary)', fontWeight: 600 }} />
                  </div>
                  
                  {/* Delivery Information */}
                  <div className="form-group">
                    <label>Delivery Starting</label>
                    <input type="date" className="form-control" name="delivery_starting" value={form.delivery_starting} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Party Completion Date</label>
                    <input type="date" className="form-control" name="party_completion_date" value={form.party_completion_date} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Company Completion Date</label>
                    <input type="date" className="form-control" name="company_completion_date" value={form.company_completion_date} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Last Dispatch Date</label>
                    <input type="date" className="form-control" name="last_dispatch_date" value={form.last_dispatch_date} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Total Dispatch MTRs</label>
                    <input type="number" className="form-control" name="total_dispatch_mtr" value={form.total_dispatch_mtr} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group">
                    <label>Party Rate</label>
                    <input type="number" className="form-control" name="party_rate" value={form.party_rate} disabled style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                </div>

                {/* SECTION 2: ORDER DETAIL TABLE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Order Detail</h4>
                  {!isReadOnly && (
                    <button type="button" className="btn btn-secondary" onClick={addAmendmentDetail} style={{ padding: '4px 8px', fontSize: 12 }}>
                      <Plus size={14} style={{ marginRight: 4 }} /> Add Row
                    </button>
                  )}
                </div>
                
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 50, textAlign: 'center' }}>S.No</th>
                        <th>Order Date</th>
                        <th>Completion Date</th>
                        <th style={{ textAlign: 'right' }}>Order MTR</th>
                        <th>Order Mode</th>
                        <th>Reason</th>
                        {!isReadOnly && <th style={{ width: 60, textAlign: 'center' }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {form.amendment_details.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No amendment entries added.</td></tr>
                      ) : (
                        form.amendment_details.map((entry, index) => (
                          <tr key={entry.id}>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                            <td>
                              <input type="date" className="form-control" value={entry.order_date} onChange={(e) => updateAmendmentDetail(entry.id, 'order_date', e.target.value)} style={{ margin: 0 }} />
                            </td>
                            <td>
                              <input type="date" className="form-control" value={entry.completion_date} onChange={(e) => updateAmendmentDetail(entry.id, 'completion_date', e.target.value)} style={{ margin: 0 }} />
                            </td>
                            <td>
                              <input type="number" className="form-control" value={entry.amendment_order_mtr} onChange={(e) => updateAmendmentDetail(entry.id, 'amendment_order_mtr', e.target.value)} style={{ margin: 0, textAlign: 'right' }} />
                            </td>
                            <td>
                              <select className="form-control" value={entry.amendment_type} onChange={(e) => updateAmendmentDetail(entry.id, 'amendment_type', e.target.value)} style={{ margin: 0 }}>
                                <option>Quantity Change</option>
                                <option>Delivery Date Change</option>
                                <option>Price Revision</option>
                                <option>Design/Style Change</option>
                                <option>Other</option>
                              </select>
                            </td>
                            <td>
                              <select className="form-control" value={entry.reason} onChange={(e) => updateAmendmentDetail(entry.id, 'reason', e.target.value)} style={{ margin: 0 }}>
                                <option value="">Select Reason...</option>
                                <option>Buyer Request</option>
                                <option>Production Issue</option>
                                <option>Material Shortage</option>
                                <option>Quality Issue</option>
                                <option>Logistics Delay</option>
                              </select>
                            </td>
                            {!isReadOnly && (
                              <td style={{ textAlign: 'center' }}>
                                <button type="button" onClick={() => removeAmendmentDetail(entry.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {/* Total field below table */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600 }}>Total:</div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {form.amendment_details.reduce((sum, item) => sum + (parseFloat(item.amendment_order_mtr) || 0), 0)} MTR
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Bottom action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              {!isReadOnly && (
                <>
                  <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={16} /> Save
                  </button>
                  {editingId && (
                    <button className="btn btn-secondary" onClick={() => handleDelete(editingId)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444' }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Close
                  </button>
                </>
              )}
              {isReadOnly && (
                <>
                  <button className="btn btn-primary" onClick={() => setShowForm(false)}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
