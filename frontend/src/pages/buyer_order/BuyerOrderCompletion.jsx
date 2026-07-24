import React, { useState, useEffect } from 'react';
import { Search, Save, Edit2, Download, Printer, Filter, Eye, Trash2, X, Plus, CheckSquare, FileText, ArrowLeft, CheckCircle, Package, Ship, BarChart2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { buyerOrderCompletionAPI, buyerOrderAPI, partyAPI, dropdownAPI } from '../../services/api';
import SubMasterDropdown from '../../components/SubMasterDropdown';

// Mock Data
// const MOCK_PARTIES = ['TexCorp International', 'Global Fabrics Ltd', 'Apex Textiles'];
// const MOCK_MERCHANDISERS = [];

const MOCK_ORDERS = [
  { id: 1, ibpo_no: 'IBPO-2023-001', ibpo_date: '2023-10-01', po_no: 'PO-1001', party_name: 'TexCorp International', design_no: 'SP-101', quality: '100% Cotton 40s', weave: 'Plain', order_mtr: 5000, dispatch_mtr: 4500, return_mtr: 0, remarks: '', merchandiser: 'Rahul M', status: 'Pending' },
  { id: 2, ibpo_no: 'IBPO-2023-002', ibpo_date: '2023-10-05', po_no: 'PO-1002', party_name: 'Global Fabrics Ltd', design_no: 'SP-205', quality: 'Poly Viscose Blend', weave: 'Twill', order_mtr: 3000, dispatch_mtr: 3000, return_mtr: 0, remarks: '', merchandiser: 'Priya S', status: 'Pending' },
  { id: 3, ibpo_no: 'IBPO-2023-003', ibpo_date: '2023-10-10', po_no: 'PO-1003', party_name: 'TexCorp International', design_no: 'SP-105', quality: '100% Cotton 40s', weave: 'Plain', order_mtr: 2000, dispatch_mtr: 1000, return_mtr: 100, remarks: 'Defective returns', merchandiser: 'Rahul M', status: 'Completed' }
];

export default function BuyerOrderCompletion() {
  // Main View State
  const [showForm, setShowForm] = useState(false);
  const [completionsHistory, setCompletionsHistory] = useState([]);
  const [mainSearch, setMainSearch] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [buyerOrders, setBuyerOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});

  useEffect(() => {
    fetchCompletions();
    fetchBuyerOrders();
    fetchParties();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const res = await dropdownAPI.getAll();
      setOptions(res.data || {});
    } catch (e) {
      console.error('Failed to fetch options', e);
    }
  };

  const refreshDropdownOptions = async () => {
    try {
      const res = await dropdownAPI.getAll();
      setOptions(res.data || {});
    } catch (e) {
      console.error('Failed to refresh options', e);
    }
  };

  const fetchParties = async () => {
    try {
      const res = await partyAPI.list();
      setParties(res.data || []);
    } catch (e) {
      console.error('Failed to fetch parties', e);
    }
  };

  const fetchBuyerOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrders(res.data || []);
    } catch (e) {
      console.error('Failed to fetch buyer orders', e);
    }
  };

  const fetchCompletions = async () => {
    try {
      const res = await buyerOrderCompletionAPI.list();
      // map backend structure to frontend completionsHistory structure
      const mapped = (res.data || []).map(c => ({
        id: c.id,
        date: c.completion_date,
        party: c.party_name,
        updated_to: c.updated_to,
        records_updated: c.records_updated
      }));
      setCompletionsHistory(mapped);
    } catch (e) {
      console.error('Failed to fetch completions', e);
    }
  };

  // Form State (Section 1)
  const [form, setForm] = useState({
    select_status: 'Pending',
    party_name: '',
    update_to: '',
    ibpo_number: '',
    from_date: '',
    remarks: ''
  });

  // Section 2 & 3 State
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [merchandiserFilter, setMerchandiserFilter] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [hasLoaded, setHasLoaded] = useState(false);

  // Edit Remarks Modal State
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [tempRemark, setTempRemark] = useState('');

  const handleOpenForm = (readOnly = false) => {
    setForm({
      select_status: 'Pending',
      party_name: '',
      update_to: '',
      ibpo_number: '',
      from_date: '',
      remarks: ''
    });
    setOrders([]);
    setHasLoaded(false);
    setSelectedRowIds(new Set());
    setIsReadOnly(readOnly);
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLoad = () => {
    if (!form.select_status || !form.party_name) {
      alert("Select and Party Name are mandatory fields for loading.");
      return;
    }

    let flattenedOrders = [];
    buyerOrders.forEach(bo => {
      if (bo.items && bo.items.length > 0) {
        bo.items.forEach(item => {
          flattenedOrders.push({
            id: `${bo.id}-${item.id || Math.random()}`,
            ibpo_no: bo.ibpo_number || '',
            ibpo_date: bo.order_date || '',
            po_no: item.party_po_no || '',
            party_name: bo.party_name || '',
            design_no: item.design_no || '',
            quality: item.fabric_type || '',
            weave: item.weaving_type || '',
            order_mtr: parseFloat(item.order_mtrs) || 0,
            dispatch_mtr: 0,
            return_mtr: 0,
            remarks: item.remarks || '',
            merchandiser: bo.merchandiser || '',
            status: bo.status || 'Pending'
          });
        });
      } else {
        // Fallback if no items
        flattenedOrders.push({
          id: `${bo.id}-0`,
          ibpo_no: bo.ibpo_number || '',
          ibpo_date: bo.order_date || '',
          po_no: '',
          party_name: bo.party_name || '',
          design_no: '',
          quality: '',
          weave: '',
          order_mtr: 0,
          dispatch_mtr: 0,
          return_mtr: 0,
          remarks: bo.remarks || '',
          merchandiser: bo.merchandiser || '',
          status: bo.status || 'Pending'
        });
      }
    });

    let filtered = flattenedOrders.filter(o =>
      o.party_name === form.party_name &&
      (!form.from_date || o.ibpo_date >= form.from_date) &&
      (form.select_status === 'All' || o.status === form.select_status)
    );

    if (form.ibpo_number) {
      filtered = filtered.filter(o => o.ibpo_no.includes(form.ibpo_number));
    }

    const mapped = filtered.map(o => ({
      ...o,
      balance_mtr: o.order_mtr - o.dispatch_mtr - o.return_mtr
    }));

    setOrders(mapped);
    setSelectedRowIds(new Set());
    setHasLoaded(true);
  };

  const toggleRowSelection = (id) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRowIds(newSet);
  };

  const toggleAllRows = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(filteredOrders.map(o => o.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSave = () => {
    if (!form.update_to) {
      alert("Please select 'Update To' status before saving.");
      return;
    }
    if (selectedRowIds.size === 0) {
      alert("Please select at least one order from the table to update.");
      return;
    }

    // Save to backend
    const selectedOrders = orders.filter(o => selectedRowIds.has(o.id));

    const payload = {
      completion_date: new Date().toISOString().split('T')[0],
      party_name: form.party_name,
      updated_to: form.update_to,
      records_updated: selectedRowIds.size,
      remarks: form.remarks,
      details: selectedOrders.map(o => ({
        ibpo_no: o.ibpo_no,
        po_no: o.po_no,
        design_no: o.design_no,
        quality: o.quality,
        order_mtr: o.order_mtr || 0,
        dispatch_mtr: o.dispatch_mtr || 0,
        return_mtr: o.return_mtr || 0,
        balance_mtr: o.balance_mtr || 0,
        row_remarks: o.remarks || ''
      }))
    };

    buyerOrderCompletionAPI.create(payload)
      .then(() => {
        fetchCompletions();
        alert(`Successfully updated ${selectedRowIds.size} orders to ${form.update_to}`);
        setShowForm(false);
      })
      .catch(e => {
        console.error('Failed to save completion', e);
        alert('Failed to save completion updates.');
      });
  };

  const openRemarkEdit = (id, currentRemark) => {
    setEditingRemarkId(id);
    setTempRemark(currentRemark || '');
  };

  const saveRemark = () => {
    setOrders(orders.map(o => o.id === editingRemarkId ? { ...o, remarks: tempRemark } : o));
    setEditingRemarkId(null);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Completion Updates History", 14, 15);
    autoTable(doc, {
      head: [["Date", "Party", "Updated To", "Records Updated"]],
      body: completionsHistory.map(c => [c.date, c.party, c.updated_to, c.records_updated]),
      startY: 20
    });
    doc.save(`Completion_History_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(completionsHistory);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, `Completion_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.ibpo_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.po_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.design_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMerch = merchandiserFilter ? o.merchandiser === merchandiserFilter : true;
    return matchesSearch && matchesMerch;
  });

  return (
    <div className="animate-fade">
      {!showForm ? (
        // --- MAIN LIST VIEW ---
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={24} color="var(--primary)" /> Buyer Order Completion
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage IBPO completion status and updates.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} /> Export
                </button>
                {showExportMenu && (
                  <>
                    <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
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
              <button className="btn btn-primary" onClick={() => handleOpenForm(false)}>
                <Plus size={16} /> New Completion Record
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Total Completed</h3><div className="value">
                {completionsHistory.reduce((acc, curr) => acc + (curr.updated_to === 'Completed' ? curr.records_updated : 0), 0)}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Package size={24} /></div>
              <div className="stat-details"><h3>Ready to Dispatch</h3><div className="value">
                {completionsHistory.reduce((acc, curr) => acc + (curr.updated_to === 'Ready' ? curr.records_updated : 0), 0)}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Ship size={24} /></div>
              <div className="stat-details"><h3>Pending Shipments</h3><div className="value">
                {completionsHistory.reduce((acc, curr) => acc + (curr.updated_to === 'Pending' ? curr.records_updated : 0), 0)}
              </div></div>
            </div>
            <div className="card stat-card" style={{ border: '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><BarChart2 size={24} /></div>
              <div className="stat-details"><h3>Update Actions</h3><div className="value">{completionsHistory.length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search history..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={mainSearch} onChange={e => setMainSearch(e.target.value)} />
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Party Name</th>
                    <th>Updated To Status</th>
                    <th>Records Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {completionsHistory.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No completion history found. Click "New Completion Record" to update orders.</td></tr>
                  ) : completionsHistory.map(h => (
                    <tr key={h.id}>
                      <td>{h.date}</td>
                      <td style={{ fontWeight: 600 }}>{h.party}</td>
                      <td>
                        <span className="badge" style={{ background: h.updated_to === 'Completed' ? '#dcfce7' : '#fef3c7', color: h.updated_to === 'Completed' ? '#166534' : '#92400e' }}>
                          {h.updated_to}
                        </span>
                      </td>
                      <td>{h.records_updated} Orders</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // --- FORM VIEW ---
        <div className="card" style={{ padding: 0 }}>
          {/* Form Header */}
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
                Buyer Order Completion Form
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 13 }}>
                Bulk update completion statuses.
              </p>
            </div>
          </div>

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
                whiteSpace: 'nowrap'
              }}
            >
              <CheckSquare size={18} /> Update Orders
            </button>
          </div>

          {/* Form Content */}
          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="animate-fade">

                {/* SECTION 1: Completion Information */}
                <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Completion Information</h4>

                <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group">
                    <label>Select *</label>
                    <SubMasterDropdown
                      name="select_status"
                      value={form.select_status}
                      entity="completion_status_master"
                      category="Status"
                      options={options}
                      onChange={(name, val) => handleFormChange({ target: { name, value: val } })}
                      onOptionsRefresh={refreshDropdownOptions}
                      allowCustom={true}
                      disabled={isReadOnly}
                      placeholder="Select Status..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Party Name *</label>
                    <select className="form-control" name="party_name" value={form.party_name} onChange={handleFormChange} required>
                      <option value="">Select Party...</option>
                      {parties.map(p => <option key={p.id || p.company_name} value={p.company_name}>{p.company_name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Update To *</label>
                    <SubMasterDropdown
                      name="update_to"
                      value={form.update_to}
                      entity="completion_status_master"
                      category="Status"
                      options={options}
                      onChange={(name, val) => handleFormChange({ target: { name, value: val } })}
                      onOptionsRefresh={refreshDropdownOptions}
                      allowCustom={true}
                      disabled={isReadOnly}
                      placeholder="Select Update To..."
                    />
                  </div>

                  <div className="form-group">
                    <label>IBPO Number</label>
                    <select className="form-control" name="ibpo_number" value={form.ibpo_number} onChange={handleFormChange}>
                      <option value="">Select IBPO...</option>
                      {buyerOrders.map(bo => (
                        <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>From Date</label>
                    <input type="date" className="form-control" name="from_date" value={form.from_date} onChange={handleFormChange} />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Remarks</label>
                    <textarea
                      className="form-control"
                      name="remarks"
                      value={form.remarks}
                      onChange={handleFormChange}
                      rows={1}
                      placeholder="Bulk remarks for selected orders..."
                      style={{ height: '38px', minHeight: '38px' }}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 1' }}>
                    <button type="button" className="btn btn-primary" onClick={handleLoad} style={{ width: '100%' }}>
                      Load
                    </button>
                  </div>
                </div>

                {/* SECTION 2: Search & Filters */}
                <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Orders List</h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 300 }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by IBPO, PO, Design..."
                        style={{ paddingLeft: 36, margin: 0 }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Merchandiser:</span>
                      <select className="form-control" style={{ margin: 0, width: 150 }} value={merchandiserFilter} onChange={e => setMerchandiserFilter(e.target.value)}>
                        <option value="">All</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Buyer Order Completion Table */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflowX: 'auto' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            onChange={toggleAllRows}
                            checked={filteredOrders.length > 0 && selectedRowIds.size === filteredOrders.length}
                          />
                        </th>
                        <th style={{ width: 50, textAlign: 'center' }}>Remarks</th>
                        <th>IBPO No</th>
                        <th>IBPO Date</th>
                        <th>PO No</th>
                        <th>Party Name</th>
                        <th>Design No</th>
                        <th>Quality</th>
                        <th>Weave</th>
                        <th style={{ textAlign: 'right' }}>Order MTR</th>
                        <th style={{ textAlign: 'right' }}>Dispatch MTR</th>
                        <th style={{ textAlign: 'right' }}>Return MTR</th>
                        <th style={{ textAlign: 'right' }}>Balance MTR</th>
                        <th>Remarks (View)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!hasLoaded ? (
                        <tr><td colSpan={14} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Click Load to fetch orders.</td></tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr><td colSpan={14} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No orders found for the selected criteria.</td></tr>
                      ) : (
                        filteredOrders.map(o => (
                          <tr key={o.id} className={selectedRowIds.has(o.id) ? 'selected-row' : ''} style={{ background: selectedRowIds.has(o.id) ? 'var(--bg-hover)' : 'transparent' }}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedRowIds.has(o.id)}
                                onChange={() => toggleRowSelection(o.id)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '4px', background: 'transparent', border: 'none' }}
                                onClick={() => openRemarkEdit(o.id, o.remarks)}
                                title="Edit Row Remarks"
                              >
                                <Edit2 size={14} color="var(--primary)" />
                              </button>
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{o.ibpo_no}</td>
                            <td>{o.ibpo_date}</td>
                            <td>{o.po_no}</td>
                            <td>{o.party_name}</td>
                            <td>{o.design_no}</td>
                            <td>{o.quality}</td>
                            <td>{o.weave}</td>
                            <td style={{ textAlign: 'right' }}>{o.order_mtr}</td>
                            <td style={{ textAlign: 'right' }}>{o.dispatch_mtr}</td>
                            <td style={{ textAlign: 'right' }}>{o.return_mtr}</td>
                            <td style={{
                              textAlign: 'right',
                              fontWeight: o.balance_mtr > 0 ? 700 : 400,
                              color: o.balance_mtr > 0 ? '#ef4444' : 'var(--text-primary)'
                            }}>
                              {o.balance_mtr}
                            </td>
                            <td style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.remarks}>
                              {o.remarks}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </fieldset>

            {/* Bottom Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              {!isReadOnly && (
                <>
                  <button type="button" className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={16} /> Save
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remark Edit Modal */}
      {editingRemarkId && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} onClick={() => setEditingRemarkId(null)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: 24, borderRadius: 8, zIndex: 101, width: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Edit Remark</h3>
            <textarea
              className="form-control"
              rows={4}
              value={tempRemark}
              onChange={e => setTempRemark(e.target.value)}
              placeholder="Enter remarks for this order..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingRemarkId(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveRemark}>Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
