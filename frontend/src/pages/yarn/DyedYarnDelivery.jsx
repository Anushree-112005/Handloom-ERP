import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Truck, PackageCheck, Send, Download, ChevronDown, FileText } from 'lucide-react';
import { dyedYarnDeliveryAPI, partyAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function DyedYarnDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [parties, setParties] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    dc_no: '', dc_no_alt: '', dc_date: new Date().toISOString().split('T')[0], add_date: new Date().toISOString().split('T')[0],
    delivery_type: 'Direct', delivery_mode: 'Road', party_name: '', delivery_address: '',
    design_no: '', order_no: '', design_type: '', transport: '', certificate_type: '', driver_name: '', delivery_time: '',
    total_delv_kgs: 0, total_rin_kgs: 0, balance_kgs: 0,
    cost: 0, insurance: 0, other_charges: 0, gross_amount: 0, tax_value: 0, sgst: 0, igst: 0, total_gst: 0, round_off: 0, net_amount: 0,
    remarks: '', status: 'Delivered',
    items: [{
      yarn_type: '', count: '', color: '', lot_no: '', stock: '', bags: 0, cones: 0, total_kgs: 0, rate: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [delvRes, partRes] = await Promise.all([
        dyedYarnDeliveryAPI.list(), partyAPI.list()
      ]);
      setDeliveries(delvRes.data);
      setParties(partRes.data);
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
        await dyedYarnDeliveryAPI.update(editingId, payload);
      } else {
        await dyedYarnDeliveryAPI.create(payload);
      }
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving delivery');
    }
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await dyedYarnDeliveryAPI.get(entry.id);
      if (data.dc_date) data.dc_date = data.dc_date.substring(0, 10);
      if (data.add_date) data.add_date = data.add_date.substring(0, 10);
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
        await dyedYarnDeliveryAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await dyedYarnDeliveryAPI.get(entry.id);
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

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['bags', 'cones', 'total_kgs', 'rate', 'amount'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;
    if (field === 'total_kgs' || field === 'rate') {
      newItems[index].amount = (newItems[index].total_kgs || 0) * (newItems[index].rate || 0);
    }
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
    doc.text("Dinesh Textile - Dyed Yarn Deliveries", 14, 15);
    const headers = [["DC No", "Date", "Party Name", "Delivery Type", "Net Amount", "Status"]];
    const rows = filteredDeliveries.map(r => [
      r.dc_no || '-',
      r.dc_date || '-',
      r.party_name || '-',
      r.delivery_type || '-',
      `Rs. ${parseFloat(r.net_amount || 0).toFixed(2)}`,
      r.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Dyed_Yarn_Deliveries_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDeliveries.map(r => ({
      "DC No": r.dc_no,
      "Date": r.dc_date,
      "Party Name": r.party_name,
      "Delivery Type": r.delivery_type,
      "Mode": r.delivery_mode,
      "Net Amount": r.net_amount,
      "Total Delv Kgs": r.total_delv_kgs,
      "Status": r.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dyed Yarn Deliveries");
    XLSX.writeFile(wb, `Dyed_Yarn_Deliveries_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={24} color="var(--primary)" /> Dyed Yarn Delivery
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage dispatch of dyed yarn with challans.</p>
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
              <input type="text" className="form-control" placeholder="Search Challan or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                      <th>DC No</th><th>Date</th><th>Party</th><th>Type</th><th>Total Rs.</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredDeliveries.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No deliveries found.</td></tr>
                    ) : filteredDeliveries.map(r => (
                      <tr key={r.id} onClick={() => handleRowClick(r)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === r.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{r.dc_no}</td>
                        <td>{r.dc_date}</td>
                        <td style={{ fontWeight: 500 }}>{r.party_name || '-'}</td>
                        <td><span className={`badge ${r.delivery_type === 'Direct' ? 'badge-completed' : 'badge-active'}`}>{r.delivery_type}</span></td>
                        <td>₹{parseFloat(r.net_amount || 0).toFixed(2)}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(r, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
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

            {selectedViewEntry && (
              <div style={{ flex: '0 0 350px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                      <Send size={18} /> {selectedViewEntry.dc_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Date" value={selectedViewEntry.dc_date} />
                    <DetailRow label="Type" value={selectedViewEntry.delivery_type} />
                    <DetailRow label="Party" value={selectedViewEntry.party_name} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items ({selectedViewEntry.items?.length || 0})</h4>
                    {selectedViewEntry.items?.map((c, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Yarn: {c.yarn_type || 'N/A'} - {c.color}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Total Kgs: {c.total_kgs}</span>
                          <span>₹{parseFloat(c.amount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Summary</h4>
                    <DetailRow label="Gross Amount" value={`₹${selectedViewEntry.gross_amount}`} />
                    <DetailRow label="Total GST" value={`₹${selectedViewEntry.total_gst}`} />
                    <DetailRow label="Net Amount" value={`₹${selectedViewEntry.net_amount}`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Delivery Details' : editingId ? 'Edit Delivery' : 'New Dyed Yarn Delivery'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: 'Top Section Fields' }, { id: 'items', label: 'Table Section Fields' }, { id: 'financials', label: 'Bottom Section (Financials)' }].map(tab => (
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
                    <div className="form-group"><label>DC No</label><input className="form-control" name="dc_no" value={form.dc_no} onChange={handleChange} disabled={editingId != null} /></div>
                    <div className="form-group"><label>DC No (second field)</label><input className="form-control" name="dc_no_alt" value={form.dc_no_alt} onChange={handleChange} /></div>
                    <div className="form-group"><label>DC Date</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Add Date</label><input type="date" className="form-control" name="add_date" value={form.add_date} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Delivery Type</label>
                      <select className="form-control" name="delivery_type" value={form.delivery_type} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Delivery Mode</label>
                      <select className="form-control" name="delivery_mode" value={form.delivery_mode} onChange={handleChange}>
                        <option>Road</option><option>Rail</option><option>Courier</option><option>Against Order</option>
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="">Select Party...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Delivery Address</label><input className="form-control" name="delivery_address" value={form.delivery_address} onChange={handleChange} /></div>
                    <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Order No</label><input className="form-control" name="order_no" value={form.order_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Design Type</label><input className="form-control" name="design_type" value={form.design_type} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Transport</label><input className="form-control" name="transport" value={form.transport} onChange={handleChange} /></div>
                    <div className="form-group"><label>Certificate Type</label><input className="form-control" name="certificate_type" value={form.certificate_type} onChange={handleChange} /></div>
                    <div className="form-group"><label>Driver Name</label><input className="form-control" name="driver_name" value={form.driver_name} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Time</label><input type="time" className="form-control" name="delivery_time" value={form.delivery_time} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Total Delv Kgs</label><input type="number" className="form-control" name="total_delv_kgs" value={form.total_delv_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total Rin Kgs</label><input type="number" className="form-control" name="total_rin_kgs" value={form.total_rin_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Balance Kgs</label><input type="number" className="form-control" name="balance_kgs" value={form.balance_kgs} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'shade_no')} /></div>
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
                          <th>S.No</th><th>Yarn Type</th><th>Count</th><th>Colour</th><th>Lot No.</th><th>Stock</th>
                          <th>Bag</th><th>Cones</th><th>Tot Kgs</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.yarn_type} onChange={e => updateItem(idx, 'yarn_type', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.count} onChange={e => updateItem(idx, 'count', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.lot_no} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.stock} onChange={e => updateItem(idx, 'stock', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.cones} onChange={e => updateItem(idx, 'cones', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.total_kgs} onChange={e => updateItem(idx, 'total_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.amount} readOnly /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 3: Bottom Section (Financials) */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Bottom Section (Financials)</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>COST</label><input type="number" className="form-control" name="cost" value={form.cost} onChange={handleChange} /></div>
                    <div className="form-group"><label>Insurance</label><input type="number" className="form-control" name="insurance" value={form.insurance} onChange={handleChange} /></div>
                    <div className="form-group"><label>Others</label><input type="number" className="form-control" name="other_charges" value={form.other_charges} onChange={handleChange} /></div>
                    <div className="form-group"><label>Gr.Amount</label><input type="number" className="form-control" name="gross_amount" value={form.gross_amount} onChange={handleChange} /></div>
                    <div className="form-group"><label>Tax Value</label><input type="number" className="form-control" name="tax_value" value={form.tax_value} onChange={handleChange} /></div>
                    <div className="form-group"><label>SGST</label><input type="number" className="form-control" name="sgst" value={form.sgst} onChange={handleChange} /></div>
                    <div className="form-group"><label>IGST</label><input type="number" className="form-control" name="igst" value={form.igst} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total GST</label><input type="number" className="form-control" name="total_gst" value={form.total_gst} onChange={handleChange} /></div>
                    <div className="form-group"><label>Round off</label><input type="number" className="form-control" name="round_off" value={form.round_off} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Net Amount</label><input type="number" className="form-control" name="net_amount" value={form.net_amount} onChange={handleChange} style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--primary-dark)' }} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
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
                          <th>S.No</th><th>Yarn Type</th><th>Count</th><th>Colour</th><th>Lot No.</th><th>Stock</th>
                          <th>Bag</th><th>Cones</th><th>Tot Kgs</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td><input className="form-control" style={{ width: 120, padding: '6px' }} value={item.yarn_type} onChange={e => updateItem(idx, 'yarn_type', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.count} onChange={e => updateItem(idx, 'count', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.lot_no} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.stock} onChange={e => updateItem(idx, 'stock', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.cones} onChange={e => updateItem(idx, 'cones', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.total_kgs} onChange={e => updateItem(idx, 'total_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.amount} readOnly /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>COST</label><input type="number" className="form-control" name="cost" value={form.cost} onChange={handleChange} /></div>
                  <div className="form-group"><label>Insurance</label><input type="number" className="form-control" name="insurance" value={form.insurance} onChange={handleChange} /></div>
                  <div className="form-group"><label>Others</label><input type="number" className="form-control" name="other_charges" value={form.other_charges} onChange={handleChange} /></div>
                  <div className="form-group"><label>Gr.Amount</label><input type="number" className="form-control" name="gross_amount" value={form.gross_amount} onChange={handleChange} /></div>
                  <div className="form-group"><label>Tax Value</label><input type="number" className="form-control" name="tax_value" value={form.tax_value} onChange={handleChange} /></div>
                  <div className="form-group"><label>SGST</label><input type="number" className="form-control" name="sgst" value={form.sgst} onChange={handleChange} /></div>
                  <div className="form-group"><label>IGST</label><input type="number" className="form-control" name="igst" value={form.igst} onChange={handleChange} /></div>
                  <div className="form-group"><label>Total GST</label><input type="number" className="form-control" name="total_gst" value={form.total_gst} onChange={handleChange} /></div>
                  <div className="form-group"><label>Round off</label><input type="number" className="form-control" name="round_off" value={form.round_off} onChange={handleChange} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Net Amount</label><input type="number" className="form-control" name="net_amount" value={form.net_amount} onChange={handleChange} style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--primary-dark)' }} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
