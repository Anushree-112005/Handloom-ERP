import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Palette, Package, Download, ChevronDown, FileText } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { dyedYarnReceiptAPI, partyAPI, greyYarnDeliveryAPI, yarnDyeingPOAPI, dyedYarnDeliveryAPI } from '../../services/api';
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
  const [yarnDyeingPOs, setYarnDyeingPOs] = useState([]);
  const [dyedYarnDeliveries, setDyedYarnDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewModalReceipt, setViewModalReceipt] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    receipt_no: '', receipt_date: new Date().toISOString().split('T')[0],
    inv_no: '', inv_date: new Date().toISOString().split('T')[0],
    received_type: 'Direct', receive_mode: 'Direct', party_name: '',
    yarn_dyeing_po_no: '', yarn_dyeing_delivery_no: '', processor_name: '', buyer_name: '', party_invoice_no: '',
    design_no: '', design_count: '', order_no: '',
    our_dc_no: '', party_dc_no: '', dc_date: new Date().toISOString().split('T')[0],
    vehicle_no: '', transport: '', driver_name: '', driver_mobile: '', lr_no: '', 
    received_by: '', checked_by: '', received_time: '', godown: '',
    remarks: '', status: 'Received', qc_status: 'Pending', receipt_status: 'Pending',
    total_taken_qty: 0, total_received_qty: 0, total_short_qty: 0, total_excess_qty: 0,
    total_bags: 0, total_cones: 0, total_gross_weight: 0, total_net_weight: 0,
    items: [{
      cone_type: 'Full Cone', yarn_type: '', yarn_count: '', ply: '',
      color: '', shade_no: '', our_lot_no: '', dyed_lot_no: '', batch_no: '', 
      taken_kgs: 0, rcvd_kgs: 0, short_kgs: 0, short_pct: 0, excess_qty: 0,
      bags: 0, cones: 0, gross_weight: 0, tare_weight: 0, net_weight: 0,
      accepted_qty: 0, rejected_qty: 0, qc_remarks: '', remarks: ''
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [recRes, partRes, greyRes, ydPORes, ydDelRes] = await Promise.all([
        dyedYarnReceiptAPI.list(), partyAPI.list(), greyYarnDeliveryAPI.list(), yarnDyeingPOAPI.list(), dyedYarnDeliveryAPI.list()
      ]);
      setReceipts(recRes.data);
      setParties(partRes.data);
      setGreyDeliveries(greyRes.data);
      setYarnDyeingPOs(ydPORes.data);
      setDyedYarnDeliveries(ydDelRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!showForm) return;

    let tTaken = 0, tRcvd = 0, tShort = 0, tExcess = 0;
    let tBags = 0, tCones = 0, tGross = 0, tNet = 0;

    const newItems = form.items.map(item => {
      const taken = parseFloat(item.taken_kgs) || 0;
      const rcvd = parseFloat(item.rcvd_kgs) || 0;
      let short = 0;
      let excess = 0;
      
      if (rcvd < taken) {
        short = taken - rcvd;
      } else if (rcvd > taken) {
        excess = rcvd - taken;
      }
      
      const shortPct = taken > 0 ? parseFloat(((short / taken) * 100).toFixed(2)) : 0;

      tTaken += taken;
      tRcvd += rcvd;
      tShort += short;
      tExcess += excess;
      tBags += parseInt(item.bags) || 0;
      tCones += parseInt(item.cones) || 0;
      tGross += parseFloat(item.gross_weight) || 0;
      tNet += parseFloat(item.net_weight) || 0;

      return { ...item, short_kgs: short, short_pct: shortPct, excess_qty: excess };
    });

    setForm(prev => {
      if (
        prev.total_taken_qty === tTaken && prev.total_received_qty === tRcvd &&
        prev.total_bags === tBags && prev.total_net_weight === tNet &&
        JSON.stringify(prev.items) === JSON.stringify(newItems)
      ) {
        return prev;
      }
      return {
        ...prev,
        items: newItems,
        total_taken_qty: tTaken, total_received_qty: tRcvd,
        total_short_qty: tShort, total_excess_qty: tExcess,
        total_bags: tBags, total_cones: tCones,
        total_gross_weight: tGross, total_net_weight: tNet
      };
    });

  }, [form.items, showForm]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      
      // Clean up empty strings for date fields to prevent FastAPI 422 errors
      const dateFields = ['receipt_date', 'inv_date', 'dc_date'];
      dateFields.forEach(field => {
        if (!payload[field] || payload[field] === '') {
          payload[field] = null;
        }
      });

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

  const handleOpenForm = async (entry = null, readOnly = false) => {
    try {
      if (entry) {
        const { data } = await dyedYarnReceiptAPI.get(entry.id);
        
        // Sanitize data to prevent uncontrolled input React warnings
        const sanitizedData = {};
        for (const key in data) {
          sanitizedData[key] = data[key] === null || data[key] === undefined ? '' : data[key];
        }
        
        if (sanitizedData.inv_date) sanitizedData.inv_date = sanitizedData.inv_date.substring(0, 10);
        if (sanitizedData.dc_date) sanitizedData.dc_date = sanitizedData.dc_date.substring(0, 10);
        if (sanitizedData.receipt_date) sanitizedData.receipt_date = sanitizedData.receipt_date.substring(0, 10);

        if (Array.isArray(sanitizedData.items)) {
          sanitizedData.items = sanitizedData.items.map(item => {
            const cleanItem = {};
            for (const key in item) {
              cleanItem[key] = item[key] === null || item[key] === undefined ? '' : item[key];
            }
            return cleanItem;
          });
        }
        
        setForm({ ...initialForm, ...sanitizedData });
        setEditingId(sanitizedData.id);
      } else {
        setForm(initialForm);
        setEditingId(null);
      }
      setIsReadOnly(readOnly);
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

  const handleFetchFromYarnDyeingDelivery = (delivery_no) => {
    if (!delivery_no) {
      setForm(prev => ({ ...prev, yarn_dyeing_delivery_no: delivery_no }));
      return;
    }
    const delivery = dyedYarnDeliveries.find(p => p.delivery_no === delivery_no);
    if (delivery) {
      setForm(prev => {
        const newForm = { ...prev, yarn_dyeing_delivery_no: delivery_no };
        newForm.processor_name = delivery.processor_name || prev.processor_name;
        newForm.party_name = delivery.party_name || prev.party_name;
        newForm.order_no = delivery.order_no || prev.order_no;
        newForm.design_no = delivery.design_no || prev.design_no;
        newForm.buyer_name = delivery.merchandiser || prev.buyer_name;
        newForm.yarn_dyeing_po_no = delivery.yarn_dyeing_po_no || prev.yarn_dyeing_po_no;
        
        // Additional Autofill fields from Logistics
        newForm.our_dc_no = delivery.dc_no || prev.our_dc_no;
        newForm.dc_date = delivery.dc_date || prev.dc_date;
        newForm.vehicle_no = delivery.vehicle_no || prev.vehicle_no;
        newForm.transport = delivery.transport_name || prev.transport;
        newForm.driver_name = delivery.driver_name || prev.driver_name;
        newForm.driver_mobile = delivery.driver_mobile || prev.driver_mobile;
        newForm.lr_no = delivery.lr_no || prev.lr_no;
        
        if (delivery.items && delivery.items.length > 0) {
          newForm.items = delivery.items.map(item => ({
            ...initialForm.items[0],
            yarn_type: item.yarn_type || '',
            yarn_count: item.yarn_count || '',
            ply: item.ply || '',
            color: item.colour || '',
            shade_no: item.shade_no || '',
            dyed_lot_no: item.lot_no || '',
            batch_no: item.batch_no || '',
            taken_kgs: parseFloat(item.current_delivery_qty) || 0,
            rcvd_kgs: parseFloat(item.current_delivery_qty) || 0,
            bags: parseInt(item.no_of_bags) || 0,
            cones: parseInt(item.no_of_cones) || 0,
            gross_weight: parseFloat(item.gross_weight) || 0,
            tare_weight: parseFloat(item.tare_weight) || 0,
            net_weight: parseFloat(item.net_weight) || 0
          }));
        }
        return newForm;
      });
    } else {
      setForm(prev => ({ ...prev, yarn_dyeing_delivery_no: delivery_no }));
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    if (name === 'yarn_dyeing_delivery_no') {
      handleFetchFromYarnDyeingDelivery(value);
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    let val = value;
    if (['taken_kgs', 'rcvd_kgs', 'bags', 'cones', 'gross_weight', 'tare_weight', 'net_weight', 'excess_qty', 'accepted_qty', 'rejected_qty'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;
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

  return (
    <div style={{ padding: 24 }}>
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Palette size={32} color="var(--primary)" /> Dyed Yarn Received
              </h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>Manage receipts and shortage tracking for dyed yarn.</p>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenForm(null, false)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> New Receipt
            </button>
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
                      <tr key={r.id} onClick={() => setSelectedViewEntry(r)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === r.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.inv_no}</td>
                        <td>{r.inv_date}</td>
                        <td style={{ fontWeight: 500 }}>{r.party_name || '-'}</td>
                        <td><span className={`badge ${r.received_type === 'Direct' ? 'badge-completed' : 'badge-active'}`}>{r.received_type}</span></td>
                        <td>{r.items?.length || 0}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(evt) => { evt.stopPropagation(); setViewModalReceipt(r); }}><Eye size={16} color="var(--primary)" /></button>
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
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Date" value={selectedViewEntry.inv_date} />
                    <DetailRow label="Type" value={selectedViewEntry.received_type} />
                    <DetailRow label="Party" value={selectedViewEntry.party_name} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0, background: '#f8fafc', border: 'none' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border)', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={20} color="var(--primary)" /> {isReadOnly ? 'View Receipt Details' : editingId ? 'Edit Receipt' : 'New Dyed Yarn Receipt'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button type="submit" form="receipt-form" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Receipt' : 'Save Receipt'}</button>
              )}
            </div>
          </div>

          <form id="receipt-form" onSubmit={handleCreate} style={{ display: 'flex', gap: 24, padding: 24, alignItems: 'flex-start' }}>
            {/* MAIN CONTENT COLUMN */}
            <fieldset disabled={isReadOnly} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0, border: 'none', padding: 0, margin: 0 }}>
              
              {/* Receipt & Party Info */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>RECEIPT INFO</span>
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    <div className="form-group"><label>Receipt No</label><input className="form-control" name="receipt_no" value={form.receipt_no} onChange={handleChange} placeholder="Auto Generated" disabled /></div>
                    <div className="form-group"><label>Receipt Date</label><input type="date" className="form-control" name="receipt_date" value={form.receipt_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Inv No</label><input className="form-control" name="inv_no" value={form.inv_no} onChange={handleChange} /></div>
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
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Yarn Dyeing Delivery No</label>
                      <select className="form-control" name="yarn_dyeing_delivery_no" value={form.yarn_dyeing_delivery_no} onChange={handleChange}>
                        <option value="" disabled hidden>Select Delivery...</option>
                        {dyedYarnDeliveries.filter(del => del.delivery_no).map(del => <option key={del.id} value={del.delivery_no}>{del.delivery_no}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Yarn Dyeing PO No</label>
                      <input className="form-control" name="yarn_dyeing_po_no" value={form.yarn_dyeing_po_no} readOnly style={{ background: '#f1f5f9' }} placeholder="Auto-filled from Delivery" />
                    </div>
                    
                    <div className="form-group"><label>Processor Name</label><input className="form-control" name="processor_name" value={form.processor_name} onChange={handleChange} /></div>
                    <div className="form-group"><label>Buyer Name</label><input className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="" disabled hidden>Select Party...</option>
                        {parties.filter(p => p.company_name).map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Design Count</label><input className="form-control" name="design_count" value={form.design_count} onChange={handleChange} /></div>
                    <div className="form-group"><label>Order No</label><input className="form-control" name="order_no" value={form.order_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Party Invoice No</label><input className="form-control" name="party_invoice_no" value={form.party_invoice_no} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Our DC No.</label><input className="form-control" name="our_dc_no" value={form.our_dc_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Party DC No.</label><input className="form-control" name="party_dc_no" value={form.party_dc_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>DC Date</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Godown / Store Location</label><input className="form-control" name="godown" value={form.godown} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>QC Status</label>
                      <select className="form-control" name="qc_status" value={form.qc_status} onChange={handleChange}>
                        <option>Pending</option><option>Accepted</option><option>Rejected</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Receipt Status</label>
                      <select className="form-control" name="receipt_status" value={form.receipt_status} onChange={handleChange}>
                        <option>Pending</option><option>Partial</option><option>Completed</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Remarks</label><textarea className="form-control" name="remarks" value={form.remarks} onChange={handleChange} rows={1} /></div>
                  </div>
                </div>
              </div>

              {/* Logistics */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>LOGISTICS</span>
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    <div className="form-group"><label>Vehicle No</label><input className="form-control" name="vehicle_no" value={form.vehicle_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Transport Name</label><input className="form-control" name="transport" value={form.transport} onChange={handleChange} /></div>
                    <div className="form-group"><label>Driver Name</label><input className="form-control" name="driver_name" value={form.driver_name} onChange={handleChange} /></div>
                    <div className="form-group"><label>Driver Mobile</label><input className="form-control" name="driver_mobile" value={form.driver_mobile} onChange={handleChange} /></div>
                    <div className="form-group"><label>LR No</label><input className="form-control" name="lr_no" value={form.lr_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Received By</label><input className="form-control" name="received_by" value={form.received_by} onChange={handleChange} /></div>
                    <div className="form-group"><label>Checked By</label><input className="form-control" name="checked_by" value={form.checked_by} onChange={handleChange} /></div>
                    <div className="form-group"><label>Received Time</label><input type="time" className="form-control" name="received_time" value={form.received_time} onChange={handleChange} /></div>
                  </div>
                </div>
              </div>

              {/* Items Block */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>YARN DETAILS</span>
                  {!isReadOnly && <button type="button" className="btn btn-secondary" onClick={addItem} style={{ padding: '4px 12px', fontSize: 12 }}><Plus size={14} /> Add Row</button>}
                </div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>S.No</th><th>Cone Type</th><th>Yarn Type</th><th>Yarn Count</th><th>Ply</th><th>Color</th>
                          <th>Shade No</th><th>Our Lot No</th><th>Dyed Lot No</th><th>Batch No</th>
                          <th>Taken Kgs</th><th>Received Kgs</th><th>Short Kgs</th><th>Short %</th><th>Excess Qty</th>
                          <th>Bags</th><th>Cones</th><th>Gross Wt</th><th>Tare Wt</th><th>Net Wt</th>
                          <th>Accepted Qty</th><th>Rejected Qty</th><th>QC Remarks</th><th>Remarks</th><th>X</th>
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
                            <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.yarn_type} onChange={e => updateItem(idx, 'yarn_type', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 60, padding: '6px' }} value={item.ply} onChange={e => updateItem(idx, 'ply', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.shade_no} onChange={e => updateItem(idx, 'shade_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 90, padding: '6px' }} value={item.our_lot_no} onChange={e => updateItem(idx, 'our_lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.dyed_lot_no} onChange={e => updateItem(idx, 'dyed_lot_no', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.batch_no} onChange={e => updateItem(idx, 'batch_no', e.target.value)} /></td>
                            
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.taken_kgs} onChange={e => updateItem(idx, 'taken_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rcvd_kgs} onChange={e => updateItem(idx, 'rcvd_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.short_kgs} readOnly /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.short_pct} readOnly /></td>
                            <td><input type="number" className="form-control" style={{ width: 70, padding: '6px' }} value={item.excess_qty} readOnly /></td>
                            
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.cones} onChange={e => updateItem(idx, 'cones', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.gross_weight} onChange={e => updateItem(idx, 'gross_weight', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.tare_weight} onChange={e => updateItem(idx, 'tare_weight', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.net_weight} onChange={e => updateItem(idx, 'net_weight', e.target.value)} /></td>
                            
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.accepted_qty} onChange={e => updateItem(idx, 'accepted_qty', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rejected_qty} onChange={e => updateItem(idx, 'rejected_qty', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.qc_remarks} onChange={e => updateItem(idx, 'qc_remarks', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>

            </fieldset>

            {/* STICKY SUMMARY COLUMN */}
            <div style={{ flex: '0 0 320px', position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>QUANTITY SUMMARY</span>
                </div>
                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <DetailRow label="Total Taken Qty" value={`${form.total_taken_qty} Kg`} />
                  <DetailRow label="Total Received Qty" value={`${form.total_received_qty} Kg`} />
                  <DetailRow label="Total Short Qty" value={`${form.total_short_qty} Kg`} />
                  <DetailRow label="Total Excess Qty" value={`${form.total_excess_qty} Kg`} />
                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px dashed var(--border)' }} />
                  <DetailRow label="Total Bags" value={form.total_bags} />
                  <DetailRow label="Total Cones" value={form.total_cones} />
                  <DetailRow label="Total Gross Weight" value={`${form.total_gross_weight} Kg`} />
                  <DetailRow label="Total Net Weight" value={`${form.total_net_weight} Kg`} />
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
