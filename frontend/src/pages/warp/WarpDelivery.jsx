import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Truck, Package, Factory, Download, ChevronDown, FileText } from 'lucide-react';
import { warpDeliveryAPI, partyAPI, dyedYarnReceiptAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import A4DocumentPreview from '../../components/A4DocumentPreview';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function WarpDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [parties, setParties] = useState([]);
  const [dyedYarnReceipts, setDyedYarnReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    dyed_yarn_receipt_no: '',
    dc_no: '', ref_no: '', dc_date: new Date().toISOString().split('T')[0], delivery_type: 'Direct',
    sizing_name: '', party_name: '', entry_type: '', bpo_no: '', design_no: '', order_no: '',
    address: '', set_id: '', warp_ends: 0, yarn_count: '', vendor_po_no: '', po_date: new Date().toISOString().split('T')[0],
    order_mtrs: 0, with_crimp: '', delivered_mtrs: 0, transport: '', vehicle_no: '',
    
    party_po_no: '', delivery_time: '', driver_name: '', mobile_no: '', lr_no: '',
    
    total_beams: 0, total_meters: 0, total_exptd_mtrs: 0, balance_meters: 0,
    remarks: '', status: 'Delivered',
    items: [{
      beam_no: '', beam_type: '', yarn_count: '', warp_ends: 0, reed_width: 0,
      warp_mtrs: 0, weight_kgs: 0, loom_no: '', remarks: '', beam_status: ''
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [delvRes, partRes, dyedRes] = await Promise.all([
        warpDeliveryAPI.list(), partyAPI.list(), dyedYarnReceiptAPI.list()
      ]);
      setDeliveries(delvRes.data);
      setParties(partRes.data);
      setDyedYarnReceipts(dyedRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      delete payload.dyed_yarn_receipt_no;
      
      const dateFields = ['dc_date', 'po_date'];
      dateFields.forEach(field => {
        if (!payload[field] || payload[field] === '') {
          payload[field] = null;
        }
      });
      
      if (editingId) {
        await warpDeliveryAPI.update(editingId, payload);
      } else {
        await warpDeliveryAPI.create(payload);
      }
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving delivery');
    }
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await warpDeliveryAPI.get(entry.id);
      if (data.dc_date) data.dc_date = data.dc_date.substring(0, 10);
      if (data.po_date) data.po_date = data.po_date.substring(0, 10);

      setForm({ ...initialForm, ...data });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('general');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading details.");
    }
  };

  const handleDelete = async (id, inv, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${inv}?`)) {
      try {
        await warpDeliveryAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await warpDeliveryAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchFromDyedYarnReceipt = (inv_no) => {
    if (!inv_no) {
      setForm(prev => ({ ...prev, dyed_yarn_receipt_no: inv_no }));
      return;
    }
    const receipt = dyedYarnReceipts.find(r => r.inv_no === inv_no);
    if (receipt) {
      setForm(prev => {
        const newForm = { ...prev, dyed_yarn_receipt_no: inv_no, ref_no: inv_no };
        newForm.party_name = receipt.party_name || prev.party_name;
        newForm.sizing_name = receipt.processor_name || prev.sizing_name;
        newForm.order_no = receipt.order_no || prev.order_no;
        newForm.design_no = receipt.design_no || prev.design_no;
        newForm.vendor_po_no = receipt.yarn_dyeing_po_no || prev.vendor_po_no;
        
        // Additional general mappings
        newForm.party_po_no = receipt.party_invoice_no || prev.party_po_no;
        newForm.dc_date = receipt.dc_date || prev.dc_date;
        newForm.address = receipt.godown || prev.address;
        newForm.remarks = receipt.remarks || prev.remarks;
        
        // Logistics
        newForm.vehicle_no = receipt.vehicle_no || prev.vehicle_no;
        newForm.transport = receipt.transport || prev.transport;
        newForm.driver_name = receipt.driver_name || prev.driver_name;
        newForm.mobile_no = receipt.driver_mobile || prev.mobile_no;
        newForm.lr_no = receipt.lr_no || prev.lr_no;
        newForm.delivery_time = receipt.received_time || prev.delivery_time;
        
        if (receipt.items && receipt.items.length > 0) {
          const firstItem = receipt.items[0];
          const yarnCount = firstItem.yarn_count || receipt.design_count || prev.yarn_count;
          newForm.yarn_count = yarnCount;
          
          newForm.items = newForm.items.map(item => ({
            ...item,
            yarn_count: yarnCount,
            weight_kgs: firstItem.rcvd_kgs || item.weight_kgs,
            remarks: firstItem.remarks || item.remarks
          }));
        } else if (receipt.design_count) {
          newForm.yarn_count = receipt.design_count;
        }
        return newForm;
      });
    } else {
      setForm(prev => ({ ...prev, dyed_yarn_receipt_no: inv_no }));
    }
  };

  const handleChange = (e) => {
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

    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    
    if (name === 'dyed_yarn_receipt_no') {
      handleFetchFromDyedYarnReceipt(value);
      return;
    }
    
    setForm({ ...form, [name]: value });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['warp_mtrs', 'warp_ends', 'reed_width', 'weight_kgs'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;
    setForm({ ...form, items: newItems });
  };

  const filteredDeliveries = deliveries.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.dc_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.party_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All Types' || r.delivery_type === typeFilter;

    let matchesDate = true;
    if (r.dc_date) {
      const entryDate = new Date(r.dc_date);
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
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Warp Deliveries", 14, 15);
    const headers = [["DC No", "DC Date", "Vendor Name", "Delivery Type", "Total Mtrs", "Status"]];
    const rows = filteredDeliveries.map(r => [
      r.dc_no || '-',
      r.dc_date || '-',
      r.party_name || '-',
      r.delivery_type || '-',
      parseFloat(r.total_meters || 0).toFixed(2),
      r.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Warp_Deliveries_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDeliveries.map(r => ({
      "DC No": r.dc_no,
      "DC Date": r.dc_date,
      "Vendor Name": r.party_name,
      "Delivery Type": r.delivery_type,
      "Sizing Name": r.sizing_name,
      "Order No": r.order_no,
      "Total Mtrs": r.total_meters,
      "Total Beams": r.total_beams,
      "Status": r.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warp Deliveries");
    XLSX.writeFile(wb, `Warp_Deliveries_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={24} color="var(--primary)" /> Warp Delivery Entry
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage and dispatch warp beams to weavers.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={16} /> Export <ChevronDown size={14} />
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
              <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setIsReadOnly(false); setShowForm(true); }}>
                <Plus size={18} /> New Delivery
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setTypeFilter('All Types')} style={{ cursor: 'pointer', border: typeFilter === 'All Types' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon purple"><Truck size={24} /></div>
              <div className="stat-details"><h3>Total Deliveries</h3><div className="value">{deliveries.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Direct')} style={{ cursor: 'pointer', border: typeFilter === 'Direct' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon emerald"><Truck size={24} /></div>
              <div className="stat-details"><h3>Direct Delivery</h3><div className="value">{deliveries.filter(r => r.delivery_type === 'Direct').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Against Order')} style={{ cursor: 'pointer', border: typeFilter === 'Against Order' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon amber"><Truck size={24} /></div>
              <div className="stat-details"><h3>Against Order</h3><div className="value">{deliveries.filter(r => r.delivery_type === 'Against Order').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search DC No or Vendor..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Direct</option><option>Against Order</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DC No</th><th>Date</th><th>Vendor Name</th><th>Type</th><th>Total Mtrs</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredDeliveries.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No deliveries found.</td></tr>
                    ) : filteredDeliveries.map(r => (
                      <tr key={r.id} onClick={() => handleRowClick(r)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === r.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.dc_no}</td>
                        <td>{r.dc_date}</td>
                        <td style={{ fontWeight: 500 }}>{r.party_name || '-'}</td>
                        <td><span className={`badge ${r.delivery_type === 'Direct' ? 'badge-completed' : 'badge-active'}`}>{r.delivery_type}</span></td>
                        <td>{parseFloat(r.total_meters || 0).toFixed(2)}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setSelectedViewEntry(r)}
                              title="Full View"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(r, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(r.id, r.dc_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <A4DocumentPreview
            isOpen={!!selectedViewEntry}
            onClose={() => setSelectedViewEntry(null)}
            title="WARP DELIVERY"
            documentNumber={selectedViewEntry?.dc_no}
            status={selectedViewEntry?.status || 'Delivered'}
            onDownloadPdf={() => alert('PDF Export functionality to be implemented')}
            sections={selectedViewEntry ? [
              {
                title: "GENERAL INFO",
                icon: "FileText",
                type: "grid",
                data: [
                  { label: "DC No", value: selectedViewEntry.dc_no },
                  { label: "DC Date", value: selectedViewEntry.dc_date },
                  { label: "Vendor", value: selectedViewEntry.party_name || '-' },
                  { label: "Delivery Type", value: selectedViewEntry.delivery_type }
                ]
              },
              {
                title: "DELIVERY DETAILS",
                icon: "Truck",
                type: "grid",
                data: [
                  { label: "Total Mtrs", value: selectedViewEntry.total_meters },
                  { label: "Order No", value: selectedViewEntry.order_no || '-' },
                  { label: "Vehicle No", value: selectedViewEntry.vehicle_no || '-' }
                ]
              },
              {
                title: "BEAMS INFO",
                icon: "Package",
                type: "table",
                headers: ["Beam No", "Type", "Yarn", "Ends", "Reed", "Mtrs", "Wt (Kg)", "Loom", "Status"],
                rows: (selectedViewEntry.items || []).map(b => [
                  b.beam_no || '-',
                  b.beam_type || '-',
                  b.yarn_count || '-',
                  b.warp_ends || 0,
                  b.reed_width || 0,
                  b.warp_mtrs || 0,
                  b.weight_kgs || 0,
                  b.loom_no || '-',
                  b.beam_status || '-'
                ])
              }
            ] : []}
          />
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Delivery Details' : editingId ? 'Edit Delivery' : 'New Warp Delivery'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: 'Top Section Fields' }, { id: 'items', label: 'Table Section (Beams)' }].map(tab => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
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
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>

              {activeTab === 'general' && (
                <div className="animate-fade">
                  {/* Section 1: Top Section Fields */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Top Section Fields</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Dyed Yarn Receipt No (Auto-fill Base)</label>
                      <select className="form-control" name="dyed_yarn_receipt_no" value={form.dyed_yarn_receipt_no || ''} onChange={handleChange}>
                        <option value="" disabled hidden>Select Receipt...</option>
                        {dyedYarnReceipts.filter(r => r.inv_no).map(r => <option key={r.id} value={r.inv_no}>{r.inv_no}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Ref No / DC SNo</label><input className="form-control" name="ref_no" value={form.ref_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Dely Type</label>
                      <select className="form-control" name="delivery_type" value={form.delivery_type} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>
                    <div className="form-group"><label>DC No</label><input className="form-control" name="dc_no" value={form.dc_no} onChange={handleChange} disabled={editingId != null} /></div>
                    <div className="form-group"><label>DC Date</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} /></div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Sizing Name</label><input className="form-control" name="sizing_name" value={form.sizing_name} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="">Select Party...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>

                    <div className="form-group"><label>Entry Type</label><input className="form-control" name="entry_type" value={form.entry_type} onChange={handleChange} /></div>
                    <div className="form-group"><label>BPO No</label><input className="form-control" name="bpo_no" value={form.bpo_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Order No</label><input className="form-control" name="order_no" value={form.order_no} onChange={handleChange} /></div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Address</label><input className="form-control" name="address" value={form.address} onChange={handleChange} /></div>
                    <div className="form-group"><label>SET ID (No.)</label><input className="form-control" name="set_id" value={form.set_id} onChange={handleChange} /></div>
                    <div className="form-group"><label>Warp Ends</label><input type="number" className="form-control" name="warp_ends" value={form.warp_ends} onChange={handleChange} /></div>

                    <div className="form-group"><label>Yarn Count</label><input className="form-control" name="yarn_count" value={form.yarn_count} onChange={handleChange} /></div>
                    <div className="form-group"><label>Vendor PO No</label><input className="form-control" name="vendor_po_no" value={form.vendor_po_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>PO Date</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Party PO No</label><input className="form-control" name="party_po_no" value={form.party_po_no} onChange={handleChange} /></div>

                    <div className="form-group"><label>Order Mtrs</label><input type="number" className="form-control" name="order_mtrs" value={form.order_mtrs} onChange={handleChange} /></div>
                    <div className="form-group"><label>With Crimp</label><input className="form-control" name="with_crimp" value={form.with_crimp} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivered Mtrs</label><input type="number" className="form-control" name="delivered_mtrs" value={form.delivered_mtrs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Balance Mtrs</label><input type="number" className="form-control" name="balance_meters" value={form.balance_meters} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Total Beams</label><input type="number" className="form-control" name="total_beams" value={form.total_beams} onChange={handleChange} /></div>
                    <div className="form-group"><label>Transport</label><input className="form-control" name="transport" value={form.transport} onChange={handleChange} /></div>
                    <div className="form-group"><label>Vehicle No</label><input className="form-control" name="vehicle_no" value={form.vehicle_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Driver Name</label><input className="form-control" name="driver_name" value={form.driver_name} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Mobile No</label><input className="form-control" name="mobile_no" value={form.mobile_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>LR No / Challan No</label><input className="form-control" name="lr_no" value={form.lr_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Time</label><input type="time" className="form-control" name="delivery_time" value={form.delivery_time} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total Warp Mtrs</label><input type="number" className="form-control" name="total_meters" value={form.total_meters} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Total Exptd Mtrs</label><input type="number" className="form-control" name="total_exptd_mtrs" value={form.total_exptd_mtrs} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'beam_no')} /></div>
                  </div>

                  {/* Section 2: Table Section (Beams) */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Table Section (Beams)</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Beam</button>
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Beam No</th><th>Beam Type</th><th>Yarn Count</th><th>Warp Ends</th><th>Reed Width</th>
                          <th>Warp Mtrs</th><th>Weight (Kgs)</th><th>Loom No</th><th>Beam Status</th><th>Remarks</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.beam_no} onChange={e => updateItem(idx, 'beam_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.beam_type} onChange={e => updateItem(idx, 'beam_type', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.warp_ends} onChange={e => updateItem(idx, 'warp_ends', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.reed_width} onChange={e => updateItem(idx, 'reed_width', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.warp_mtrs} onChange={e => updateItem(idx, 'warp_mtrs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.weight_kgs} onChange={e => updateItem(idx, 'weight_kgs', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.loom_no} onChange={e => updateItem(idx, 'loom_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.beam_status} onChange={e => updateItem(idx, 'beam_status', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 140, padding: '6px' }} value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Beam</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Beam No</th><th>Beam Type</th><th>Yarn Count</th><th>Warp Ends</th><th>Reed Width</th>
                          <th>Warp Mtrs</th><th>Weight (Kgs)</th><th>Loom No</th><th>Beam Status</th><th>Remarks</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.beam_no} onChange={e => updateItem(idx, 'beam_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.beam_type} onChange={e => updateItem(idx, 'beam_type', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.warp_ends} onChange={e => updateItem(idx, 'warp_ends', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.reed_width} onChange={e => updateItem(idx, 'reed_width', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.warp_mtrs} onChange={e => updateItem(idx, 'warp_mtrs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.weight_kgs} onChange={e => updateItem(idx, 'weight_kgs', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.loom_no} onChange={e => updateItem(idx, 'loom_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.beam_status} onChange={e => updateItem(idx, 'beam_status', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 140, padding: '6px' }} value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
