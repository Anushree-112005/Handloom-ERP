import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Palette, Package, Download, ChevronDown, FileText } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { dyedYarnReceiptAPI, partyAPI, greyYarnDeliveryAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function DyedYarnReceived() {
  const [receipts, setReceipts] = useState([]);
  const [parties, setParties] = useState([]);
  const [greyDeliveries, setGreyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewModalReceipt, setViewModalReceipt] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    inv_no: '', inv_date: new Date().toISOString().split('T')[0],
    received_type: 'Direct', receive_mode: 'Direct', party_name: '',
    design_no: '', design_count: '', order_no: '',
    our_dc_no: '', party_dc_no: '', dc_date: new Date().toISOString().split('T')[0],
    remarks: '', status: 'Received',
    items: [{
      cone_type: 'Full Cone', delivery_count: 0, received_count: 0,
      our_lot_no: '', color: '', taken_kgs: 0, dyed_lot_no: '',
      bags: 0, cones: 0, rcvd_kgs: 0, short_kgs: 0, short_pct: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [recRes, partRes, greyRes] = await Promise.all([
        dyedYarnReceiptAPI.list(), partyAPI.list(), greyYarnDeliveryAPI.list()
      ]);
      setReceipts(recRes.data);
      setParties(partRes.data);
      setGreyDeliveries(greyRes.data);
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
      if (editingId) {
        await dyedYarnReceiptAPI.update(editingId, payload);
      } else {
        await dyedYarnReceiptAPI.create(payload);
      }
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving receipt');
    }
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await dyedYarnReceiptAPI.get(entry.id);
      if (data.inv_date) data.inv_date = data.inv_date.substring(0, 10);
      if (data.dc_date) data.dc_date = data.dc_date.substring(0, 10);
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
        await dyedYarnReceiptAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await dyedYarnReceiptAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
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
    setForm({ ...form, [name]: value });
  };

  const handleFetchFromGreyDelivery = (val) => {
    if (!val) {
      setForm(prev => ({ ...prev, our_dc_no: val }));
      return;
    }
    const delivery = greyDeliveries.find(d => d.dc_no === val);
    if (delivery) {
      setForm(prev => {
        const newForm = { ...prev };
        newForm.our_dc_no = val;
        newForm.party_name = delivery.party_name || prev.party_name;
        newForm.design_no = delivery.design_no || prev.design_no;
        newForm.order_no = delivery.order_no || prev.order_no;
        
        if (delivery.items && delivery.items.length > 0) {
          newForm.items = delivery.items.map(item => ({
            ...initialForm.items[0],
            cone_type: item.cone_type || 'Full Cone',
            delivery_count: item.count || 0,
            our_lot_no: item.our_lot_no || '',
            color: item.color || '',
            taken_kgs: item.total_kgs || 0,
            bags: item.bags || 0,
            cones: item.cones || 0,
          }));
        }
        return newForm;
      });
    } else {
      setForm(prev => ({ ...prev, our_dc_no: val }));
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['delivery_count', 'received_count', 'taken_kgs', 'bags', 'cones', 'rcvd_kgs', 'short_kgs', 'short_pct'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;

    // Auto-calculate shortages
    if (field === 'taken_kgs' || field === 'rcvd_kgs') {
      const taken = parseFloat(newItems[index].taken_kgs) || 0;
      const rcvd = parseFloat(newItems[index].rcvd_kgs) || 0;
      newItems[index].short_kgs = taken - rcvd;
      newItems[index].short_pct = taken > 0 ? parseFloat(((taken - rcvd) / taken * 100).toFixed(2)) : 0;
    }

    setForm({ ...form, items: newItems });
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.inv_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.party_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = typeFilter === 'All Types' || r.received_type === typeFilter;
    
    let matchesDate = true;
    if (r.inv_date) {
      const entryDate = new Date(r.inv_date);
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
    doc.text("Dinesh Textile - Dyed Yarn Receipts", 14, 15);
    const headers = [["Inv No", "Inv Date", "Party Name", "Received Type", "Status"]];
    const rows = filteredReceipts.map(r => [
      r.inv_no || '-',
      r.inv_date || '-',
      r.party_name || '-',
      r.received_type || '-',
      r.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Dyed_Yarn_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredReceipts.map(r => ({
      "Inv No": r.inv_no,
      "Inv Date": r.inv_date,
      "Received Type": r.received_type,
      "Party Name": r.party_name,
      "Our DC No": r.our_dc_no,
      "Party DC No": r.party_dc_no,
      "Design No": r.design_no,
      "Status": r.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dyed Yarn Receipts");
    XLSX.writeFile(wb, `Dyed_Yarn_Receipts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={24} color="var(--primary)" /> Dyed Yarn Received
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage receipts and shortage tracking for dyed yarn.</p>
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
                <Plus size={18} /> New Receipt
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setTypeFilter('All Types')} style={{ cursor: 'pointer', border: typeFilter === 'All Types' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon purple"><Package size={24} /></div>
              <div className="stat-details"><h3>Total Receipts</h3><div className="value">{receipts.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Direct')} style={{ cursor: 'pointer', border: typeFilter === 'Direct' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon emerald"><Package size={24} /></div>
              <div className="stat-details"><h3>Direct</h3><div className="value">{receipts.filter(r => r.received_type === 'Direct').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Against Order')} style={{ cursor: 'pointer', border: typeFilter === 'Against Order' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon amber"><Package size={24} /></div>
              <div className="stat-details"><h3>Against Order</h3><div className="value">{receipts.filter(r => r.received_type === 'Against Order').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search Invoice or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                      <th>Inv No</th><th>Date</th><th>Party</th><th>Type</th><th>Items</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredReceipts.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No receipts found.</td></tr>
                    ) : filteredReceipts.map(r => (
                      <tr key={r.id} onClick={() => handleRowClick(r)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === r.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.inv_no}</td>
                        <td>{r.inv_date}</td>
                        <td style={{ fontWeight: 500 }}>{r.party_name || '-'}</td>
                        <td><span className={`badge ${r.received_type === 'Direct' ? 'badge-completed' : 'badge-active'}`}>{r.received_type}</span></td>
                        <td>{r.items?.length || 0}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={(evt) => { evt.stopPropagation(); setViewModalReceipt(r); }}
                              title="Preview Receipt"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(r, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(r.id, r.inv_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedViewEntry && (
              <div style={{ flex: '0 0 350px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 700 }}>
                      <Palette size={18} /> {selectedViewEntry.inv_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setViewModalReceipt(selectedViewEntry)}
                        title="Preview Receipt"
                      >
                        <Eye size={16} color="var(--primary)" />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Date" value={selectedViewEntry.inv_date} />
                    <DetailRow label="Type" value={selectedViewEntry.received_type} />
                    <DetailRow label="Party" value={selectedViewEntry.party_name} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items ({selectedViewEntry.items?.length || 0})</h4>
                    {selectedViewEntry.items?.map((c, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Color: {c.color || 'N/A'}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Rcvd Kgs: {c.rcvd_kgs}</span>
                          <span>Short: {c.short_kgs} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Receipt Details' : editingId ? 'Edit Receipt' : 'New Dyed Yarn Receipt'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update Receipt' : 'Save Receipt'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: 'Top Section Fields' }, { id: 'items', label: 'Table Section Fields' }].map(tab => (
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
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              {activeTab === 'general' && (
                <div className="animate-fade">
                  {/* Section 1: Top Section Fields */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Top Section Fields</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>Inv No</label><input className="form-control" name="inv_no" value={form.inv_no} onChange={handleChange} disabled={editingId != null} /></div>
                    <div className="form-group"><label>Inv Date</label><input type="date" className="form-control" name="inv_date" value={form.inv_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Received Type</label>
                      <select className="form-control" name="received_type" value={form.received_type} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Receive Mode</label>
                      <select className="form-control" name="receive_mode" value={form.receive_mode} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="">Select Party...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Design Count</label><input className="form-control" name="design_count" value={form.design_count} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Order No</label><input className="form-control" name="order_no" value={form.order_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Our DC No.</label>
                      <select className="form-control" name="our_dc_no" value={form.our_dc_no} onChange={(e) => handleFetchFromGreyDelivery(e.target.value)}>
                        <option value="">Select DC...</option>
                        {greyDeliveries.map(d => <option key={d.id} value={d.dc_no}>{d.dc_no} - {d.party_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Party DC No.</label><input className="form-control" name="party_dc_no" value={form.party_dc_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>DC Date</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'item_no')} /></div>
                  </div>

                  {/* Section 2: Table Section Fields */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Table Section Fields</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Row</button>
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>S.No</th><th>Cone Type</th><th>Dely Count</th><th>Rcvd Count</th><th>Our Lot No.</th><th>Color</th>
                          <th>Taken Kgs</th><th>Dyed Lot No.</th><th>Bags</th><th>Cones</th><th>Rcvd Kgs</th><th>Short Kgs</th><th>Short %</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <select className="form-control" style={{ width: 100, padding: '6px' }} value={item.cone_type} onChange={e => updateItem(idx, 'cone_type', e.target.value)}>
                                <option>Full Cone</option><option>Half Cone</option>
                              </select>
                            </td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.delivery_count} onChange={e => updateItem(idx, 'delivery_count', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.received_count} onChange={e => updateItem(idx, 'received_count', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.our_lot_no} onChange={e => updateItem(idx, 'our_lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.taken_kgs} onChange={e => updateItem(idx, 'taken_kgs', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.dyed_lot_no} onChange={e => updateItem(idx, 'dyed_lot_no', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.cones} onChange={e => updateItem(idx, 'cones', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rcvd_kgs} onChange={e => updateItem(idx, 'rcvd_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.short_kgs} onChange={e => updateItem(idx, 'short_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.short_pct} onChange={e => updateItem(idx, 'short_pct', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
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
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Row</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>S.No</th><th>Cone Type</th><th>Dely Count</th><th>Rcvd Count</th><th>Our Lot No.</th><th>Color</th>
                          <th>Taken Kgs</th><th>Dyed Lot No.</th><th>Bags</th><th>Cones</th><th>Rcvd Kgs</th><th>Short Kgs</th><th>Short %</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <select className="form-control" style={{ width: 100, padding: '6px' }} value={item.cone_type} onChange={e => updateItem(idx, 'cone_type', e.target.value)}>
                                <option>Full Cone</option><option>Half Cone</option>
                              </select>
                            </td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.delivery_count} onChange={e => updateItem(idx, 'delivery_count', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.received_count} onChange={e => updateItem(idx, 'received_count', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.our_lot_no} onChange={e => updateItem(idx, 'our_lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.taken_kgs} onChange={e => updateItem(idx, 'taken_kgs', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.dyed_lot_no} onChange={e => updateItem(idx, 'dyed_lot_no', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.cones} onChange={e => updateItem(idx, 'cones', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rcvd_kgs} onChange={e => updateItem(idx, 'rcvd_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.short_kgs} onChange={e => updateItem(idx, 'short_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.short_pct} onChange={e => updateItem(idx, 'short_pct', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
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

      <A4DocumentPreview
        isOpen={!!viewModalReceipt}
        onClose={() => setViewModalReceipt(null)}
        title="DYED YARN RECEIPT"
        documentNumber={viewModalReceipt?.inv_no}
        status="RECEIVED"
        onDownloadPdf={() => alert('PDF Download for Dyed Yarn Receipt triggered')}
        sections={viewModalReceipt ? [
          {
            title: "RECEIPT DETAILS",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "Invoice No", value: viewModalReceipt.inv_no },
              { label: "Invoice Date", value: viewModalReceipt.inv_date },
              { label: "Party Name", value: viewModalReceipt.party_name || '-' },
              { label: "Received Type", value: viewModalReceipt.received_type },
              { label: "Our DC No", value: viewModalReceipt.our_dc_no || '-' },
              { label: "Party DC No", value: viewModalReceipt.party_dc_no || '-' }
            ]
          },
          {
            title: "YARN & DESIGN",
            icon: "Palette",
            type: "grid",
            data: [
              { label: "Design No", value: viewModalReceipt.design_no || '-' },
              { label: "Design Count", value: viewModalReceipt.design_count || '-' },
              { label: "Order No", value: viewModalReceipt.order_no || '-' },
              { label: "Total Items", value: viewModalReceipt.items?.length || 0 }
            ]
          },
          {
            title: "RECEIVED CONSIGNMENT",
            icon: "Box",
            type: "table",
            headers: ["S.No", "Color", "Lot No", "Taken (Kg)", "Rcvd (Kg)", "Short (Kg)", "Short %"],
            rows: (viewModalReceipt.items || []).map((item, idx) => [
              idx + 1,
              item.color || '-',
              item.our_lot_no || '-',
              item.taken_kgs || 0,
              item.rcvd_kgs || 0,
              item.short_kgs || 0,
              `${item.short_pct || 0}%`
            ])
          }
        ] : []}
      />

    </div>
  );
}
