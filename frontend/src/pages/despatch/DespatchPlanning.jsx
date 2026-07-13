import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Plus, Download, FileText, Calendar, ShieldCheck, Layers, Eye, Edit2, Trash2, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { despatchAPI } from '../../services/api';
import A4DocumentPreview from '../../components/A4DocumentPreview';

// Dynamic Date Formatter Utility
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
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  useEffect(() => {
    loadRecords();
  }, []);

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

  // Filter list
  const filteredRecords = records.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.billing_party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.design_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buyer_po_no?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
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

          <button className="btn btn-primary" onClick={() => navigate('/despatch/new')}>
            <Plus size={18} /> New Entry
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading plans...</p>
        </div>
      ) : (
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
                            onClick={() => setSelectedViewRecord(r)}
                            title="View Detail"
                          >
                            <Eye size={15} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px' }}
                            onClick={() => navigate(`/despatch/edit/${r.id}`)}
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

          {selectedViewRecord && (
            <A4DocumentPreview
              isOpen={!!selectedViewRecord}
              onClose={() => setSelectedViewRecord(null)}
              title="Despatch Plan Preview"
              data={selectedViewRecord}
              sections={[
                {
                  title: 'Basic Details',
                  fields: [
                    { label: 'Ref No', value: selectedViewRecord.ref_no },
                    { label: 'Date', value: selectedViewRecord.date },
                    { label: 'IBPO', value: selectedViewRecord.ibpo },
                    { label: 'PO Date', value: selectedViewRecord.po_date },
                    { label: 'Billing Party', value: selectedViewRecord.billing_party },
                    { label: 'Design No', value: selectedViewRecord.design_no },
                    { label: 'Order No', value: selectedViewRecord.order_no },
                    { label: 'Fabric Type', value: selectedViewRecord.fabric_type }
                  ]
                },
                {
                  title: 'Quantities & Stock',
                  fields: [
                    { label: 'Total Planning', value: selectedViewRecord.total_planning },
                    { label: 'Planned Mtrs', value: selectedViewRecord.planned_mtrs },
                    { label: 'Tolerance %', value: selectedViewRecord.tolerance_percent },
                    { label: 'Max Despatch Qty', value: selectedViewRecord.max_despatch_qty },
                    { label: 'Stock Available', value: selectedViewRecord.stock },
                    { label: 'Balance Mtrs', value: selectedViewRecord.balance_mtrs }
                  ]
                },
                {
                  title: 'Delivery & Logistics',
                  fields: [
                    { label: 'Delivery Party', value: selectedViewRecord.delivery_party },
                    { label: 'Delivery Address', value: selectedViewRecord.delivery_address },
                    { label: 'Delivery Starting', value: selectedViewRecord.delivery_starting },
                    { label: 'Last Desp Date', value: selectedViewRecord.last_desp_date },
                    { label: 'Merchandiser', value: selectedViewRecord.merchand }
                  ]
                }
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
