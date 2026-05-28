import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, 
  Download, FileText, Calendar, ShieldCheck, DollarSign, Layers, PlusCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { despatchAPI } from '../../services/api';

// Dynamic Date Formatter Utility
const getFormattedDate = (d = new Date()) => {
  return d.toISOString().split('T')[0];
};

const formatForAPI = (dateStr) => {
  return dateStr || null;
};

const formatFromAPI = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

const mapRecordToForm = (r) => {
  let extra = {};
  try {
    if (r.remarks) {
      extra = JSON.parse(r.remarks);
    }
  } catch (e) {
    // ignore
  }

  return {
    id: r.id,
    ibpo: r.ibpo || '',
    po_date: formatFromAPI(r.po_date),
    ref_no: r.ref_no || '',
    date: formatFromAPI(r.planning_date),
    planning_date: formatFromAPI(r.planning_date),
    billing_party: r.billing_party || '',
    billing_address: r.billing_address || '',
    state_code: r.state_code || '',
    design_no: r.design_no || '',
    order_no: extra.order_no || '',
    delivery_starting: formatFromAPI(r.delivery_start),
    ibpo_rate: String(r.ibpo_rate || '0'),
    certificate_type: r.certificate_type || '',
    total_planning: String(r.total_qty || '0'),
    pino: r.pino || '',
    amd_foc_mtr: String(r.amd_foc_mtr || '0'),
    party_comp_date: formatFromAPI(r.party_comp_date),
    currency: r.currency || 'INR',
    last_desp_date: formatFromAPI(r.last_desp_date),
    delivery_party: r.delivery_party || '',
    delivery_address: r.delivery_address || '',
    del_state_code: extra.del_state_code || '',
    lc_no_tt_no: r.lc_no || '',
    lc_tt_date: formatFromAPI(r.lc_date),
    total: extra.total || '',
    uom: r.uom || 'Meters',
    comp_date: formatFromAPI(r.comp_date),
    fabric_type: r.fabric_type || '',
    tot_desp_mtrs: String(r.tot_desp_mtrs || '0'),
    balance_mtrs: String(r.balance_mtrs || '0'),
    poc_no: r.point_of_contact || '',
    buyer_po_no: extra.buyer_po_no || '',
    qty: String(r.order_qty || '0'),
    patten: extra.patten || '',
    party_style: extra.party_style || '',
    po_upload: '',
    print_name: extra.print_name || '',
    merchand: r.merchant || '',
    planned_mtrs: String(r.planned_mtrs || '0'),
    tolerance_percent: String(r.tolerance_pct || '0'),
    max_despatch_qty: String(r.max_dispatch_qty || '0'),
    stock: String(r.stock || '0'),
    rate: extra.rate || '',
    other_charge: extra.other_charge || '',
    other_charges_value: extra.other_charges_value || '',
    status: r.status || 'Planned'
  };
};

export default function DespatchPlanning() {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [merchandFilter, setMerchandFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown standard mock lists
  const buyersList = ['SK Textiles', 'Mani Spinners', 'Global Exim', 'A1 Garments', 'Raju Traders'];
  const designsList = ['D-9012', 'D-5678', 'D-1122', 'D-4455', 'D-8899'];
  const merchandList = ['ABDUL', 'SUDHAKAR', 'MANOJ', 'RAMESH'];

  const initialForm = {
    // Green header fields
    ibpo: '',
    po_date: '',
    ref_no: '',
    date: getFormattedDate(),

    // Left Column
    billing_party: '',
    billing_address: '',
    state_code: '',
    design_no: '',
    order_no: '',
    delivery_starting: '',
    ibpo_rate: '',
    certificate_type: '',
    total_planning: '',

    // Middle Column
    pino: '',
    amd_foc_mtr: '',
    party_comp_date: '',
    currency: 'INR',
    last_desp_date: '',

    // Right Column
    delivery_party: '',
    delivery_address: '',
    del_state_code: '',
    lc_no_tt_no: '',
    lc_tt_date: '',
    total: '',
    uom: 'Meters',
    comp_date: '',
    fabric_type: '',
    tot_desp_mtrs: '',
    balance_mtrs: '',

    // Yellow Row fields
    poc_no: '',
    buyer_po_no: '',
    qty: '',
    patten: '',
    party_style: '',
    po_upload: '',
    print_name: '',
    merchand: '',

    // Blue Row fields
    planned_mtrs: '',
    tolerance_percent: '0',
    max_despatch_qty: '',
    stock: '',
    planning_date: getFormattedDate(),
    rate: '',
    other_charge: '-',
    other_charges_value: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await despatchAPI.list();
      const mapped = res.data.map(mapRecordToForm);
      setRecords(mapped);
    } catch (err) {
      console.error("Error loading despatch plans:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load from database on mount
  useEffect(() => {
    loadRecords();
  }, []);

  const handleOpenForm = (record = null, readOnly = false) => {
    if (record) {
      setFormData(record);
      setEditingId(record.id);
    } else {
      // Auto increment ref_no
      const nextRef = records.length > 0 
        ? String(Math.max(...records.map(r => Number(r.ref_no) || 0)) + 1)
        : '16763';
      setFormData({
        ...initialForm,
        ref_no: nextRef,
        date: getFormattedDate()
      });
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, refNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Despatch Plan Ref No: ${refNo}?`)) {
      try {
        await despatchAPI.delete(id);
        await loadRecords();
      } catch (err) {
        console.error("Error deleting despatch plan:", err);
        alert(err.response?.data?.detail || "Error deleting despatch plan");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    const extra = {
      order_no: formData.order_no,
      del_state_code: formData.del_state_code,
      total: formData.total,
      buyer_po_no: formData.buyer_po_no,
      patten: formData.patten,
      party_style: formData.party_style,
      print_name: formData.print_name,
      rate: formData.rate,
      other_charge: formData.other_charge,
      other_charges_value: formData.other_charges_value,
    };
    const payload = {
      ibpo: formData.ibpo || null,
      po_date: formatForAPI(formData.po_date),
      ref_no: formData.ref_no || null,
      planning_date: formatForAPI(formData.planning_date || formData.date),
      billing_party: formData.billing_party || null,
      delivery_party: formData.delivery_party || null,
      billing_address: formData.billing_address || null,
      delivery_address: formData.delivery_address || null,
      state_code: formData.state_code || null,
      design_no: formData.design_no || null,
      pino: formData.pino || null,
      order_qty: Number(formData.qty) || 0,
      amd_foc_mtr: Number(formData.amd_foc_mtr) || 0,
      total_qty: Number(formData.total_planning) || 0,
      uom: formData.uom || "MTR",
      delivery_start: formatForAPI(formData.delivery_starting),
      party_comp_date: formatForAPI(formData.party_comp_date),
      comp_date: formatForAPI(formData.comp_date),
      lc_no: formData.lc_no_tt_no || null,
      lc_date: formatForAPI(formData.lc_tt_date),
      ibpo_rate: Number(formData.ibpo_rate) || 0,
      currency: formData.currency || "INR",
      certificate_type: formData.certificate_type || null,
      fabric_type: formData.fabric_type || null,
      planned_mtrs: Number(formData.planned_mtrs) || 0,
      tolerance_pct: Number(formData.tolerance_percent) || 0,
      max_dispatch_qty: Number(formData.max_despatch_qty) || 0,
      stock: Number(formData.stock) || 0,
      tot_desp_mtrs: Number(formData.tot_desp_mtrs) || 0,
      balance_mtrs: Number(formData.balance_mtrs) || 0,
      last_desp_date: formatForAPI(formData.last_desp_date),
      merchant: formData.merchand || null,
      point_of_contact: formData.poc_no || null,
      remarks: JSON.stringify(extra),
      status: formData.status || "Planned"
    };

    try {
      if (editingId) {
        await despatchAPI.update(editingId, payload);
      } else {
        await despatchAPI.create(payload);
      }
      await loadRecords();
      setView('list');
    } catch (err) {
      console.error("Error saving despatch plan:", err);
      alert(err.response?.data?.detail || "Error saving despatch plan");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto calculation helper: Max Despatch Qty = Planned Mtrs * (1 + Tolerance%/100)
      if (name === 'planned_mtrs' || name === 'tolerance_percent') {
        const planned = Number(updated.planned_mtrs) || 0;
        const tolerance = Number(updated.tolerance_percent) || 0;
        updated.max_despatch_qty = String(Math.round(planned * (1 + tolerance / 100)));
      }

      // Auto calculation: Balance Mtrs = Total Planning - Tot Desp Mtrs
      if (name === 'total_planning' || name === 'tot_desp_mtrs') {
        const totalPlan = Number(updated.total_planning) || 0;
        const totDesp = Number(updated.tot_desp_mtrs) || 0;
        updated.balance_mtrs = String(totalPlan - totDesp);
      }

      return updated;
    });
  };

  // Filter list
  const filteredRecords = records.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.billing_party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.design_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buyer_po_no?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    // Basic date checking
    if (r.date) {
      const recordDate = new Date(r.date);
      if (fromDate) matchesDate = matchesDate && recordDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && recordDate <= tDate;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Export actions
  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Despatch Planning Report", 14, 15);
    const headers = [["Ref No", "Date", "Billing Party", "Design No", "Order No", "Planned Qty", "UOM", "Stock", "Merchand"]];
    const rows = filteredRecords.map(r => [
      r.ref_no,
      r.date,
      r.billing_party,
      r.design_no,
      r.order_no,
      r.planned_mtrs,
      r.uom,
      r.stock,
      r.merchand
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
    });
    doc.save(`Despatch_Planning_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const wsData = filteredRecords.map(r => ({
      "Ref No": r.ref_no,
      "Date": r.date,
      "IBPO": r.ibpo,
      "PO Date": r.po_date,
      "Billing Party": r.billing_party,
      "Billing Address": r.billing_address,
      "State Code": r.state_code,
      "Design No": r.design_no,
      "Order No": r.order_no,
      "Delivery Starting": r.delivery_starting,
      "IBPO Rate": r.ibpo_rate,
      "Certificate Type": r.certificate_type,
      "PINO": r.pino,
      "AMD/FOC Mtr": r.amd_foc_mtr,
      "Party Comp Date": r.party_comp_date,
      "Currency": r.currency,
      "Last Desp Date": r.last_desp_date,
      "Delivery Party": r.delivery_party,
      "Delivery Address": r.delivery_address,
      "Del State Code": r.del_state_code,
      "LC No / TT No": r.lc_no_tt_no,
      "LC / TT Date": r.lc_tt_date,
      "UOM": r.uom,
      "Comp Date": r.comp_date,
      "Fabric Type": r.fabric_type,
      "Total Planning": r.total_planning,
      "Tot Desp Mtrs": r.tot_desp_mtrs,
      "Balance Mtrs": r.balance_mtrs,
      "POC No": r.poc_no,
      "Buyer PO No": r.buyer_po_no,
      "Qty": r.qty,
      "Patten": r.patten,
      "Party Style": r.party_style,
      "Print Name": r.print_name,
      "Merchandiser": r.merchand,
      "Planned Mtrs": r.planned_mtrs,
      "Tolerance %": r.tolerance_percent,
      "Max Despatch Qty": r.max_despatch_qty,
      "Stock": r.stock,
      "Planning Date": r.planning_date,
      "Rate": r.rate,
      "Other Charge": r.other_charge,
      "Other Charges Value": r.other_charges_value
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Despatch Plans");
    XLSX.writeFile(wb, `Despatch_Planning_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {/* Header Dashboard Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={26} color="var(--primary)" /> Despatch Planning
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Create, manage, and track buyer order despatch planning specifications</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {view === 'list' ? (
            <>
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
                <Plus size={18} /> New Entry
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setView('list')}>
              <ArrowLeft size={18} /> Back to List
            </button>
          )}
        </div>
      </div>

      {view === 'list' ? (
        <>
          {/* STATS HIGHLIGHT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <MapPin size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Plans</h3>
                <div className="value">{records.length}</div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Layers size={24} />
              </div>
              <div className="stat-details">
                <h3>Planned Qty</h3>
                <div className="value">
                  {records.reduce((acc, curr) => acc + (Number(curr.planned_mtrs) || 0), 0).toLocaleString()} Mtr
                </div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308' }}>
                <Calendar size={24} />
              </div>
              <div className="stat-details">
                <h3>Pending Balance</h3>
                <div className="value">
                  {records.reduce((acc, curr) => acc + (Number(curr.balance_mtrs) || 0), 0).toLocaleString()} Mtr
                </div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                <ShieldCheck size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Amount</h3>
                <div className="value">
                  ₹{records.reduce((acc, curr) => acc + ((Number(curr.planned_mtrs) || 0) * (Number(curr.rate) || 0)), 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS PANEL */}
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search by Ref No, Buyer, or Design..."
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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

          {/* TABLE DISPLAY */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref No</th>
                  <th>Plan Date</th>
                  <th>Billing Party</th>
                  <th>Design / Order</th>
                  <th>Fabric Type</th>
                  <th>Planned Mtrs</th>
                  <th>Stock Available</th>
                  <th>Merchandiser</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No despatch planning records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.ref_no}</td>
                      <td>{r.date}</td>
                      <td style={{ fontWeight: 600 }}>{r.billing_party}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.design_no}</span>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.order_no}</span>
                      </td>
                      <td style={{ fontSize: 12 }}>{r.fabric_type}</td>
                      <td style={{ fontWeight: 600 }}>{(Number(r.planned_mtrs) || 0).toLocaleString()} {r.uom}</td>
                      <td>
                        <span className={`badge ${Number(r.stock) >= Number(r.planned_mtrs) ? 'badge-active' : 'badge-inactive'}`}>
                          {(Number(r.stock) || 0).toLocaleString()} Mtr
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.merchand}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px' }}
                            onClick={() => handleOpenForm(r, true)}
                            title="View Detail"
                          >
                            <Eye size={15} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px' }}
                            onClick={() => handleOpenForm(r, false)}
                            title="Edit Plan"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px' }}
                            onClick={(e) => handleDelete(r.id, r.ref_no, e)}
                            title="Delete"
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* INPUT FORM COMPONENT - ACCORDING TO CLIENT PICTURE */
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Despatch Plan' : editingId ? 'Edit Despatch Plan' : 'New Despatch Plan'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button type="submit" form="despatchForm" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Plan' : 'Save Plan'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: '1. Basic Details' }, { id: 'planning', label: '2. Planning & Delivery' }, { id: 'order', label: '3. Order Info' }, { id: 'logistics', label: '4. Logistics & Stock' }].map(tab => (
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
            <form id="despatchForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                
                {activeTab === 'general' && (
                  <div className="animate-fade">
{/* SECTION 1: GREEN TOP BAR SECTION */}
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.08)', 
                borderLeft: '4px solid #10b981', 
                borderRadius: '8px', 
                padding: '16px 20px', 
                margin: '0 0 16px 0',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>IBPO</label>
                  <select className="form-control" name="ibpo" value={formData.ibpo} onChange={handleChange} style={{ borderColor: '#a7f3d0' }}>
                    <option value="">Select IBPO</option>
                    <option value="IBPO-1678">IBPO-1678</option>
                    <option value="IBPO-984">IBPO-984</option>
                    <option value="IBPO-1202">IBPO-1202</option>
                    <option value="IBPO-2241">IBPO-2241</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>PO Date</label>
                  <input type="date" className="form-control" name="po_date" value={formData.po_date} onChange={handleChange} style={{ borderColor: '#a7f3d0' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>Ref No</label>
                  <input type="text" className="form-control" name="ref_no" value={formData.ref_no} onChange={handleChange} required style={{ borderColor: '#a7f3d0' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, color: '#065f46', fontSize: 12 }}>Date</label>
                  <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} style={{ borderColor: '#a7f3d0' }} />
                </div>
              </div>
                  </div>
                )}

                {activeTab === 'planning' && (
                  <div className="animate-fade">
{/* SECTION 2: THREE COLUMN GRID SECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, margin: '0 0 16px 0' }}>
                
                {/* COLUMN 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Billing Party</label>
                    <select className="form-control" name="billing_party" value={formData.billing_party} onChange={handleChange}>
                      <option value="">Select Billing Party</option>
                      {buyersList.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Billing Address</label>
                    <textarea className="form-control" name="billing_address" value={formData.billing_address} onChange={handleChange} rows={2} style={{ resize: 'none' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>State/Code</label>
                    <input className="form-control" name="state_code" value={formData.state_code} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Design No</label>
                    <select className="form-control" name="design_no" value={formData.design_no} onChange={handleChange}>
                      <option value="">Select Design No</option>
                      {designsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Order</label>
                    <input className="form-control" name="order_no" value={formData.order_no} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Delivery Starting</label>
                    <input type="date" className="form-control" name="delivery_starting" value={formData.delivery_starting} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>IBPO Rate</label>
                    <input className="form-control" name="ibpo_rate" value={formData.ibpo_rate} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Certificate Type</label>
                    <input className="form-control" name="certificate_type" value={formData.certificate_type} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Total Planning</label>
                    <input className="form-control" name="total_planning" value={formData.total_planning} onChange={handleChange} />
                  </div>
                </div>

                {/* COLUMN 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>PINO</label>
                    <input className="form-control" name="pino" value={formData.pino} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>AMD/FOC Mtr</label>
                    <input className="form-control" name="amd_foc_mtr" value={formData.amd_foc_mtr} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Party Comp Date</label>
                    <input type="date" className="form-control" name="party_comp_date" value={formData.party_comp_date} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Currency</label>
                    <select className="form-control" name="currency" value={formData.currency} onChange={handleChange}>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Last Desp Date</label>
                    <input type="date" className="form-control" name="last_desp_date" value={formData.last_desp_date} onChange={handleChange} />
                  </div>
                </div>

                {/* COLUMN 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Delivery Party</label>
                    <select className="form-control" name="delivery_party" value={formData.delivery_party} onChange={handleChange}>
                      <option value="">Select Delivery Party</option>
                      {buyersList.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Delivery Address</label>
                    <textarea className="form-control" name="delivery_address" value={formData.delivery_address} onChange={handleChange} rows={2} style={{ resize: 'none' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>State/Code</label>
                    <input className="form-control" name="del_state_code" value={formData.del_state_code} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>LC No / TT No</label>
                    <input className="form-control" name="lc_no_tt_no" value={formData.lc_no_tt_no} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>LC / TT Date</label>
                    <input className="form-control" name="ibpo_rate" value={formData.ibpo_rate} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Total</label>
                    <input className="form-control" name="total" value={formData.total} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>UOM</label>
                    <select className="form-control" name="uom" value={formData.uom} onChange={handleChange}>
                      <option value="Meters">Meters</option>
                      <option value="Yards">Yards</option>
                      <option value="Kgs">Kgs</option>
                      <option value="Rolls">Rolls</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Comp Date</label>
                    <input type="date" className="form-control" name="comp_date" value={formData.comp_date} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Fabric Type</label>
                    <input className="form-control" name="fabric_type" value={formData.fabric_type} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Tot Desp Mtrs</label>
                    <input className="form-control" name="tot_desp_mtrs" value={formData.tot_desp_mtrs} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Balance Mtrs</label>
                    <input className="form-control" name="balance_mtrs" value={formData.balance_mtrs} onChange={handleChange} readOnly style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                </div>

              </div>
                  </div>
                )}

                {activeTab === 'order' && (
                  <div className="animate-fade">
{/* SECTION 3: YELLOW ACCENT BAR */}
              <div style={{ 
                background: 'rgba(234, 179, 8, 0.08)', 
                borderLeft: '4px solid #eab308', 
                borderRadius: '8px', 
                padding: '20px 24px', 
                margin: '0 0 16px 0'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Point of Contact/No</label>
                    <input className="form-control" name="poc_no" value={formData.poc_no} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Buyer PO No</label>
                    <input className="form-control" name="buyer_po_no" value={formData.buyer_po_no} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Qty</label>
                    <input className="form-control" name="qty" value={formData.qty} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Patten</label>
                    <input className="form-control" name="patten" value={formData.patten} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Party Style</label>
                    <input className="form-control" name="party_style" value={formData.party_style} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>PO Upload</label>
                    <input type="file" className="form-control" style={{ borderColor: '#fef08a', padding: '4px 12px' }} disabled={isReadOnly} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Print Name</label>
                    <input className="form-control" name="print_name" value={formData.print_name} onChange={handleChange} style={{ borderColor: '#fef08a' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#854d0e', fontSize: 12 }}>Merchand</label>
                    <select className="form-control" name="merchand" value={formData.merchand} onChange={handleChange} style={{ borderColor: '#fef08a' }}>
                      <option value="">Select Merchandiser</option>
                      {merchandList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
                  </div>
                )}

                {activeTab === 'logistics' && (
                  <div className="animate-fade">
{/* SECTION 4: BLUE ACCENT BAR */}
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.08)', 
                borderLeft: '4px solid #3b82f6', 
                borderRadius: '8px', 
                padding: '20px 24px', 
                margin: '0 0 16px 0'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Planned Mtrs</label>
                    <input className="form-control" name="planned_mtrs" value={formData.planned_mtrs} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Tolerance %</label>
                    <select className="form-control" name="tolerance_percent" value={formData.tolerance_percent} onChange={handleChange} style={{ borderColor: '#bfdbfe' }}>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                      <option value="15">15%</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Max Despatch Qty</label>
                    <input className="form-control" name="max_despatch_qty" value={formData.max_despatch_qty} onChange={handleChange} readOnly style={{ borderColor: '#bfdbfe', background: 'var(--bg-secondary)' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Stock</label>
                    <input className="form-control" name="stock" value={formData.stock} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Planning Date</label>
                    <input type="date" className="form-control" name="planning_date" value={formData.planning_date} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Rate</label>
                    <input className="form-control" name="rate" value={formData.rate} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Other Charge</label>
                    <select className="form-control" name="other_charge" value={formData.other_charge} onChange={handleChange} style={{ borderColor: '#bfdbfe' }}>
                      <option value="-">-</option>
                      <option value="Freight">Freight</option>
                      <option value="Loading">Loading charges</option>
                      <option value="Insurance">Transit Insurance</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>Other Charges Value</label>
                    <input className="form-control" name="other_charges_value" value={formData.other_charges_value} onChange={handleChange} style={{ borderColor: '#bfdbfe' }} />
                  </div>
                </div>
              </div>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        </div>

      )}
    </div>
  );
}
