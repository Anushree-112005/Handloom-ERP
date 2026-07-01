import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Send, CheckCircle, FileText, Package, IndianRupee } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { dyedYarnDeliveryAPI, partyAPI, dropdownAPI, yarnDyeingPOAPI, subMasterAPI } from '../../services/api';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function DyedYarnDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [parties, setParties] = useState([]);
  const [yarnDyeingPOs, setYarnDyeingPOs] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [viewModalDelivery, setViewModalDelivery] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isCustomDeliveryMode, setIsCustomDeliveryMode] = useState(false);
  const [customDeliveryModeVal, setCustomDeliveryModeVal] = useState('');
  const [customYarnTypeIdx, setCustomYarnTypeIdx] = useState(null);
  const [customYarnTypeVal, setCustomYarnTypeVal] = useState('');
  const [customColourIdx, setCustomColourIdx] = useState(null);
  const [customColourVal, setCustomColourVal] = useState('');

  const initialForm = {
    delivery_no: '', dc_no: '', dc_date: new Date().toISOString().split('T')[0], delivery_date: new Date().toISOString().split('T')[0],
    delivery_type: 'Direct', delivery_mode: '', yarn_dyeing_po_no: '', processor_name: '', party_name: '',
    order_no: '', ref_no: '', design_no: '', merchandiser: '', vehicle_no: '', driver_name: '',
    driver_mobile: '', transport_name: '', lr_no: '', gate_pass_no: '', eway_bill_no: '', dispatch_from_godown: '',
    remarks: '', delivery_status: 'Pending',
    total_ordered_qty: 0, total_prev_delivered_qty: 0, total_current_delivery_qty: 0, total_balance_qty: 0,
    total_bags: 0, total_cones: 0, total_gross_weight: 0, total_net_weight: 0,
    freight_charges: 0, loading_charges: 0, unloading_charges: 0, insurance_charges: 0, other_charges: 0, transport_remarks: '',
    taxable_amount: 0, sgst_pct: 0, sgst_amount: 0, cgst_pct: 0, cgst_amount: 0, igst_pct: 0, igst_amount: 0, total_gst: 0,
    gross_amount: 0, discount: 0, round_off: 0, grand_total: 0, advance: 0, balance: 0,
    items: [{
      sp_no: '', design_no: '', yarn_type: '', yarn_count: '', ply: '', colour: '', shade_no: '', lot_no: '', batch_no: '', unit: 'KGS',
      ordered_qty: 0, prev_delivered_qty: 0, balance_qty: 0, current_delivery_qty: 0,
      no_of_bags: 0, no_of_cones: 0, gross_weight: 0, tare_weight: 0, net_weight: 0,
      rate: 0, amount: 0, remarks: ''
    }]
  };

  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'Delivery & Logistics', icon: FileText },
    { id: 'items', label: 'Yarn Details', icon: Package },
    { id: 'financials', label: 'Financial Summary', icon: IndianRupee }
  ];

  const loadData = async () => {
    try {
      const [delvRes, partRes, dropRes, ydPORes] = await Promise.all([
        dyedYarnDeliveryAPI.list(),
        partyAPI.list(),
        dropdownAPI.getAll(),
        yarnDyeingPOAPI.list()
      ]);
      setDeliveries(delvRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setYarnDyeingPOs(ydPORes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Auto Calculations Hook
  useEffect(() => {
    if (!showForm) return;
    
    let totalOrdered = 0;
    let totalPrev = 0;
    let totalCurr = 0;
    let totalBal = 0;
    let tBags = 0;
    let tCones = 0;
    let tGrossW = 0;
    let tNetW = 0;
    let tAmount = 0;

    const newItems = form.items.map(item => {
      const curr = parseFloat(item.current_delivery_qty) || 0;
      const prev = parseFloat(item.prev_delivered_qty) || 0;
      const ordered = parseFloat(item.ordered_qty) || 0;
      const bal = ordered - prev - curr;
      
      const rate = parseFloat(item.rate) || 0;
      const amount = curr * rate;

      totalOrdered += ordered;
      totalPrev += prev;
      totalCurr += curr;
      totalBal += bal;
      tBags += parseInt(item.no_of_bags) || 0;
      tCones += parseInt(item.no_of_cones) || 0;
      tGrossW += parseFloat(item.gross_weight) || 0;
      tNetW += parseFloat(item.net_weight) || 0;
      tAmount += amount;

      return { ...item, balance_qty: bal, amount };
    });

    const fr = parseFloat(form.freight_charges) || 0;
    const ld = parseFloat(form.loading_charges) || 0;
    const un = parseFloat(form.unloading_charges) || 0;
    const ins = parseFloat(form.insurance_charges) || 0;
    const oth = parseFloat(form.other_charges) || 0;
    const disc = parseFloat(form.discount) || 0;

    const gross = tAmount + fr + ld + un + ins + oth;
    const taxable = gross - disc;

    const sgstAmt = (taxable * (parseFloat(form.sgst_pct) || 0)) / 100;
    const cgstAmt = (taxable * (parseFloat(form.cgst_pct) || 0)) / 100;
    const igstAmt = (taxable * (parseFloat(form.igst_pct) || 0)) / 100;
    const totGst = sgstAmt + cgstAmt + igstAmt;

    const grand = taxable + totGst;
    const rounded = Math.round(grand);
    const roundOff = rounded - grand;
    
    const adv = parseFloat(form.advance) || 0;
    const balFin = rounded - adv;

    setForm(prev => {
      if (
        prev.total_ordered_qty === totalOrdered && prev.total_current_delivery_qty === totalCurr &&
        prev.gross_amount === gross && prev.grand_total === rounded &&
        JSON.stringify(prev.items) === JSON.stringify(newItems)
      ) {
        return prev; // Prevent infinite loop
      }
      return {
        ...prev,
        items: newItems,
        total_ordered_qty: totalOrdered, total_prev_delivered_qty: totalPrev,
        total_current_delivery_qty: totalCurr, total_balance_qty: totalBal,
        total_bags: tBags, total_cones: tCones, total_gross_weight: tGrossW, total_net_weight: tNetW,
        gross_amount: gross, taxable_amount: taxable,
        sgst_amount: sgstAmt, cgst_amount: cgstAmt, igst_amount: igstAmt, total_gst: totGst,
        round_off: roundOff, grand_total: rounded, balance: balFin
      };
    });

  }, [
    form.items, form.freight_charges, form.loading_charges, form.unloading_charges,
    form.insurance_charges, form.other_charges, form.discount, form.sgst_pct,
    form.cgst_pct, form.igst_pct, form.advance, showForm
  ]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editingId) {
        await dyedYarnDeliveryAPI.update(editingId, payload);
      } else {
        await dyedYarnDeliveryAPI.create(payload);
      }
      setShowForm(false); setEditingId(null); setForm(initialForm); setActiveTab('general'); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving delivery');
    }
  };

  const handleFetchFromYarnDyeingPO = (po_no) => {
    if (!po_no) {
      setForm(prev => ({ ...prev, yarn_dyeing_po_no: po_no }));
      return;
    }
    const po = yarnDyeingPOs.find(p => p.po_no === po_no);
    if (po) {
      setForm(prev => {
        const newForm = { ...prev, yarn_dyeing_po_no: po_no };
        newForm.processor_name = po.supplier_dyeing_unit || prev.processor_name;
        newForm.party_name = po.supplier_dyeing_unit || prev.party_name;
        newForm.order_no = po.po_no || prev.order_no;
        newForm.ref_no = po.ref_no_1 || prev.ref_no;
        newForm.design_no = po.design_no || prev.design_no;
        newForm.merchandiser = po.buyer_name || prev.merchandiser;
        
        let prevDeliveredItemsMap = {}; // Ideally fetch previous deliveries to compute this

        if (po.items && po.items.length > 0) {
          newForm.items = po.items.map(item => {
            const ordQty = parseFloat(item.tot_qty) || 0;
            const prevQty = prevDeliveredItemsMap[item.id] || 0;
            const bal = ordQty - prevQty;
            
            return {
              ...initialForm.items[0],
              sp_no: item.sp_no || '',
              design_no: item.design_no || po.design_no || '',
              yarn_type: item.yarn_type || '',
              yarn_count: item.yarn_count || item.dsn_count || '',
              colour: item.color || item.colour || '',
              unit: item.uom || 'KGS',
              ordered_qty: ordQty,
              prev_delivered_qty: prevQty,
              balance_qty: bal,
              current_delivery_qty: bal > 0 ? bal : 0,
              rate: parseFloat(item.rate) || 0,
            };
          });
        }
        return newForm;
      });
    } else {
      setForm(prev => ({ ...prev, yarn_dyeing_po_no: po_no }));
    }
  };

  const handleSaveCustomDeliveryMode = async () => {
    if (!customDeliveryModeVal.trim()) return;
    try {
      await subMasterAPI.create('transport_mode_master', { entity: 'transport_mode_master', name: customDeliveryModeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, delivery_mode: customDeliveryModeVal.trim() });
      setIsCustomDeliveryMode(false);
      setCustomDeliveryModeVal('');
    } catch (err) { alert('Error saving custom delivery mode'); }
  };

  const handleSaveCustomYarnType = async () => {
    if (!customYarnTypeVal.trim() || customYarnTypeIdx === null) return;
    try {
      await subMasterAPI.create('yarn_type_master', { entity: 'yarn_type_master', name: customYarnTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateItem(customYarnTypeIdx, 'yarn_type', customYarnTypeVal.trim());
      setCustomYarnTypeIdx(null);
      setCustomYarnTypeVal('');
    } catch (err) { alert('Error saving yarn type'); }
  };

  const handleSaveCustomColour = async () => {
    if (!customColourVal.trim() || customColourIdx === null) return;
    try {
      await subMasterAPI.create('color_master', { entity: 'color_master', name: customColourVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateItem(customColourIdx, 'colour', customColourVal.trim());
      setCustomColourIdx(null);
      setCustomColourVal('');
    } catch (err) { alert('Error saving custom color'); }
  };

  const handleDelete = async (id, dc_no, evt) => {
    evt.stopPropagation();
    if (!window.confirm(`Delete Delivery ${dc_no}?`)) return;
    try {
      await dyedYarnDeliveryAPI.delete(id);
      loadData();
      if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
    } catch (err) {
      alert('Error deleting delivery');
    }
  };

  const handleRowClick = (entry) => {
    setSelectedViewEntry(entry);
  };

  const handleOpenForm = (entry = null, readOnly = false) => {
    setIsReadOnly(readOnly);
    setActiveTab('general');
    if (entry) {
      setEditingId(entry.id);
      dyedYarnDeliveryAPI.get(entry.id).then(res => {
        setForm(res.data);
        setShowForm(true);
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
      setShowForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm(initialForm);
    setActiveTab('general');
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    if (name === 'delivery_mode' && value === 'custom') {
      setIsCustomDeliveryMode(true); setCustomDeliveryModeVal(''); return;
    }
    setForm({ ...form, [name]: value });
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, initialForm.items[0]] }));
  const removeItem = (index) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  const updateItem = (index, field, value) => {
    if (field === 'yarn_type' && value === 'custom') {
      setCustomYarnTypeIdx(index); setCustomYarnTypeVal(''); return;
    }
    if (field === 'colour' && value === 'custom') {
      setCustomColourIdx(index); setCustomColourVal(''); return;
    }
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      return { ...prev, items: newItems };
    });
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
      if (toDate) matchesDate = matchesDate && entryDate <= new Date(toDate);
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
                <Send size={32} color="var(--primary)" /> Dyed Yarn Delivery
              </h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>Manage outgoing dyed yarn dispatches and challans</p>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenForm(null, false)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> New Delivery
            </button>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search DC or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.dc_no}</td>
                        <td>{r.dc_date}</td>
                        <td style={{ fontWeight: 500 }}>{r.party_name || '-'}</td>
                        <td><span className={`badge ${r.delivery_type === 'Direct' ? 'badge-completed' : 'badge-active'}`}>{r.delivery_type}</span></td>
                        <td>₹{parseFloat(r.grand_total || 0).toFixed(2)}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(evt) => { evt.stopPropagation(); setViewModalDelivery(r); }}><Eye size={16} color="var(--primary)" /></button>
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
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 700 }}>
                      <Send size={18} /> {selectedViewEntry.dc_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setViewModalDelivery(selectedViewEntry)}><Eye size={16} color="var(--primary)" /></button>
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
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Yarn: {c.yarn_type || 'N/A'} - {c.colour}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Total Kgs: {c.current_delivery_qty}</span>
                          <span>₹{parseFloat(c.amount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Summary</h4>
                    <DetailRow label="Gross Amount" value={`₹${selectedViewEntry.gross_amount}`} />
                    <DetailRow label="Total GST" value={`₹${selectedViewEntry.total_gst}`} />
                    <DetailRow label="Grand Total" value={`₹${selectedViewEntry.grand_total}`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0, background: '#f8fafc', border: 'none' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px 24px', borderBottom: '1px solid var(--border)', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Send size={20} color="var(--primary)" /> {isReadOnly ? 'View Delivery Details' : editingId ? 'Edit Delivery' : 'New Dyed Yarn Delivery'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={handleCloseForm}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button type="submit" form="delivery-form" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>

          <form id="delivery-form" onSubmit={handleCreate} style={{ padding: 24 }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
              
              {activeTab === 'general' && (
                <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Delivery Info */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>DELIVERY INFO</span>
                    </div>
                    <div style={{ padding: '20px 18px' }}>
                      <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                        <div className="form-group"><label>Delivery No</label><input className="form-control" name="delivery_no" value={form.delivery_no} onChange={handleChange} placeholder="Auto Generated" disabled /></div>
                        <div className="form-group"><label>DC No</label><input className="form-control" name="dc_no" value={form.dc_no} onChange={handleChange} /></div>
                        <div className="form-group"><label>DC Date</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} /></div>
                        <div className="form-group"><label>Delivery Date</label><input type="date" className="form-control" name="delivery_date" value={form.delivery_date} onChange={handleChange} /></div>
                        
                        <div className="form-group"><label>Delivery Type</label>
                          <select className="form-control" name="delivery_type" value={form.delivery_type} onChange={handleChange}>
                            <option>Direct</option><option>Against PO</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Delivery Mode</label>
                          {isCustomDeliveryMode ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="text" className="form-control" placeholder="New Mode" value={customDeliveryModeVal} onChange={e => setCustomDeliveryModeVal(e.target.value)} />
                              <button type="button" className="btn btn-primary" onClick={handleSaveCustomDeliveryMode} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                              <button type="button" className="btn btn-secondary" onClick={() => setIsCustomDeliveryMode(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                            </div>
                          ) : (
                            <select className="form-control" name="delivery_mode" value={form.delivery_mode || ''} onChange={handleChange}>
                              <option value="">Select...</option>
                              {options.masters?.transport_mode_master?.map(o => <option key={o} value={o}>{o}</option>)}
                              <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                            </select>
                          )}
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Yarn Dyeing PO No</label>
                          <select className="form-control" name="yarn_dyeing_po_no" value={form.yarn_dyeing_po_no || ''} onChange={(e) => handleFetchFromYarnDyeingPO(e.target.value)}>
                            <option value="">Select PO...</option>
                            {yarnDyeingPOs.map(po => <option key={po.id} value={po.po_no}>{po.po_no} - {po.supplier_dyeing_unit}</option>)}
                          </select>
                        </div>
                        
                        <div className="form-group"><label>Processor Name</label><input className="form-control" name="processor_name" value={form.processor_name} onChange={handleChange} /></div>
                        <div className="form-group"><label>Party Name</label>
                          <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                            <option value="">Select Party...</option>
                            {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                          </select>
                        </div>
                        <div className="form-group"><label>Order No</label><input className="form-control" name="order_no" value={form.order_no} onChange={handleChange} /></div>
                        <div className="form-group"><label>Ref No</label><input className="form-control" name="ref_no" value={form.ref_no} onChange={handleChange} /></div>
                        
                        <div className="form-group"><label>Design No</label><input className="form-control" name="design_no" value={form.design_no} onChange={handleChange} /></div>
                        <div className="form-group"><label>Merchandiser</label><input className="form-control" name="merchandiser" value={form.merchandiser} onChange={handleChange} /></div>
                        <div className="form-group"><label>Delivery Status</label>
                          <select className="form-control" name="delivery_status" value={form.delivery_status} onChange={handleChange}>
                            <option>Pending</option><option>Partially Delivered</option><option>Fully Delivered</option><option>Closed</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Dispatch Godown</label><input className="form-control" name="dispatch_from_godown" value={form.dispatch_from_godown} onChange={handleChange} /></div>
                        
                        <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><textarea className="form-control" name="remarks" value={form.remarks} onChange={handleChange} rows={2} /></div>
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
                        <div className="form-group"><label>Driver Name</label><input className="form-control" name="driver_name" value={form.driver_name} onChange={handleChange} /></div>
                        <div className="form-group"><label>Driver Mobile</label><input className="form-control" name="driver_mobile" value={form.driver_mobile} onChange={handleChange} /></div>
                        <div className="form-group"><label>Transport Name</label><input className="form-control" name="transport_name" value={form.transport_name} onChange={handleChange} /></div>
                        <div className="form-group"><label>LR No</label><input className="form-control" name="lr_no" value={form.lr_no} onChange={handleChange} /></div>
                        <div className="form-group"><label>Gate Pass No</label><input className="form-control" name="gate_pass_no" value={form.gate_pass_no} onChange={handleChange} /></div>
                        <div className="form-group"><label>E-Way Bill No</label><input className="form-control" name="eway_bill_no" value={form.eway_bill_no} onChange={handleChange} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Yarn Details (First page summary) */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>YARN DETAILS</span>
                      {!isReadOnly && <button type="button" className="btn btn-secondary" onClick={addItem} style={{ padding: '4px 12px', fontSize: 12 }}><Plus size={14} /> Add Row</button>}
                    </div>
                    <div style={{ padding: '20px 18px' }}>
                      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                        <table className="data-table" style={{ minWidth: '2200px' }}>
                          <thead>
                            <tr>
                              <th>S.No</th><th>SP No</th><th>Design No</th><th>Yarn Type</th><th>Yarn Count</th><th>Ply</th><th>Colour</th>
                              <th>Shade No</th><th>Lot No</th><th>Batch No</th><th>Unit</th><th>Ord Qty</th><th>Prev Delv Qty</th>
                              <th>Bal Qty</th><th>Curr Delv Qty</th><th>Bags</th><th>Cones</th><th>Gross Wt</th><th>Tare Wt</th>
                              <th>Net Wt</th><th>Rate</th><th>Amount</th><th>Remarks</th><th>X</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.sp_no} onChange={e => updateItem(idx, 'sp_no', e.target.value)} /></td>
                                <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.design_no} onChange={e => updateItem(idx, 'design_no', e.target.value)} /></td>
                                <td>
                                  {customYarnTypeIdx === idx ? (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <input type="text" className="form-control" style={{ width: 120 }} placeholder="New Yarn" value={customYarnTypeVal} onChange={e => setCustomYarnTypeVal(e.target.value)} />
                                      <button type="button" className="btn btn-primary" onClick={handleSaveCustomYarnType} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                      <button type="button" className="btn btn-secondary" onClick={() => setCustomYarnTypeIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <select className="form-control" style={{ width: 120 }} value={item.yarn_type || ''} onChange={e => updateItem(idx, 'yarn_type', e.target.value)}>
                                      <option value="">Select...</option>
                                      {options.masters?.yarn_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                      <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                    </select>
                                  )}
                                </td>
                                <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                                <td><input className="form-control" style={{ width: 60, padding: '6px' }} value={item.ply} onChange={e => updateItem(idx, 'ply', e.target.value)} /></td>
                                <td>
                                  {customColourIdx === idx ? (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <input type="text" className="form-control" style={{ width: 90 }} placeholder="New Colour" value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                                      <button type="button" className="btn btn-primary" onClick={handleSaveCustomColour} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                      <button type="button" className="btn btn-secondary" onClick={() => setCustomColourIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <select className="form-control" style={{ width: 90 }} value={item.colour || ''} onChange={e => updateItem(idx, 'colour', e.target.value)}>
                                      <option value="">Select...</option>
                                      {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                      <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                    </select>
                                  )}
                                </td>
                                <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.shade_no} onChange={e => updateItem(idx, 'shade_no', e.target.value)} /></td>
                                <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.lot_no} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                                <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.batch_no} onChange={e => updateItem(idx, 'batch_no', e.target.value)} /></td>
                                <td><input className="form-control" style={{ width: 60, padding: '6px' }} value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} /></td>
                                
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.ordered_qty} onChange={e => updateItem(idx, 'ordered_qty', e.target.value)} /></td>
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.prev_delivered_qty} onChange={e => updateItem(idx, 'prev_delivered_qty', e.target.value)} /></td>
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.balance_qty} readOnly /></td>
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.current_delivery_qty} onChange={e => updateItem(idx, 'current_delivery_qty', e.target.value)} /></td>
                                
                                <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.no_of_bags} onChange={e => updateItem(idx, 'no_of_bags', e.target.value)} /></td>
                                <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.no_of_cones} onChange={e => updateItem(idx, 'no_of_cones', e.target.value)} /></td>
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.gross_weight} onChange={e => updateItem(idx, 'gross_weight', e.target.value)} /></td>
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.tare_weight} onChange={e => updateItem(idx, 'tare_weight', e.target.value)} /></td>
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.net_weight} onChange={e => updateItem(idx, 'net_weight', e.target.value)} /></td>
                                
                                <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                                <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.amount} readOnly /></td>
                                <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} /></td>
                                <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Financials Summaries */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
                    {/* QUANTITY SUMMARY */}
                    <div style={{ flex: 1, minWidth: 300 }}>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>QUANTITY SUMMARY</span>
                        </div>
                        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <DetailRow label="Ordered Qty" value={`${form.total_ordered_qty} Kg`} />
                          <DetailRow label="Prev Delv Qty" value={`${form.total_prev_delivered_qty} Kg`} />
                          <DetailRow label="Curr Delv Qty" value={`${form.total_current_delivery_qty} Kg`} />
                          <DetailRow label="Balance Qty" value={`${form.total_balance_qty} Kg`} />
                          <DetailRow label="Total Bags" value={form.total_bags} />
                          <DetailRow label="Total Cones" value={form.total_cones} />
                          <DetailRow label="Gross Weight" value={`${form.total_gross_weight} Kg`} />
                          <DetailRow label="Net Weight" value={`${form.total_net_weight} Kg`} />
                        </div>
                      </div>
                    </div>

                    {/* FINANCIAL SUMMARY */}
                    <div style={{ flex: '0 0 350px', minWidth: 320 }}>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>FINANCIAL SUMMARY</span>
                        </div>
                        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Chg</span>
                            <input type="number" className="form-control" name="freight_charges" value={form.freight_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading Chg</span>
                            <input type="number" className="form-control" name="loading_charges" value={form.loading_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Unloading Chg</span>
                            <input type="number" className="form-control" name="unloading_charges" value={form.unloading_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance</span>
                            <input type="number" className="form-control" name="insurance_charges" value={form.insurance_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Other Chg</span>
                            <input type="number" className="form-control" name="other_charges" value={form.other_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>

                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px dashed var(--border)' }} />

                          <DetailRow label="Gross Amount" value={`₹${parseFloat(form.gross_amount).toFixed(2)}`} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Discount</span>
                            <input type="number" className="form-control" name="discount" value={form.discount} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>

                          <DetailRow label="Taxable Amount" value={`₹${parseFloat(form.taxable_amount).toFixed(2)}`} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                            <input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                            <input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                            <input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>

                          <DetailRow label="Total GST" value={`₹${parseFloat(form.total_gst).toFixed(2)}`} />
                          <DetailRow label="Round Off" value={`₹${parseFloat(form.round_off).toFixed(2)}`} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>GRAND TOTAL</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                              INR {parseFloat(form.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Advance</span>
                            <input type="number" className="form-control" name="advance" value={form.advance} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>BALANCE</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)' }}>
                              INR {parseFloat(form.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div className="animate-fade" style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>YARN DETAILS</span>
                    {!isReadOnly && <button type="button" className="btn btn-secondary" onClick={addItem} style={{ padding: '4px 12px', fontSize: 12 }}><Plus size={14} /> Add Row</button>}
                  </div>
                  <div style={{ padding: '20px 18px' }}>
                    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                      <table className="data-table" style={{ minWidth: '2200px' }}>
                        <thead>
                          <tr>
                            <th>S.No</th><th>SP No</th><th>Design No</th><th>Yarn Type</th><th>Yarn Count</th><th>Ply</th><th>Colour</th>
                            <th>Shade No</th><th>Lot No</th><th>Batch No</th><th>Unit</th><th>Ord Qty</th><th>Prev Delv Qty</th>
                            <th>Bal Qty</th><th>Curr Delv Qty</th><th>Bags</th><th>Cones</th><th>Gross Wt</th><th>Tare Wt</th>
                            <th>Net Wt</th><th>Rate</th><th>Amount</th><th>Remarks</th><th>X</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.sp_no} onChange={e => updateItem(idx, 'sp_no', e.target.value)} /></td>
                              <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.design_no} onChange={e => updateItem(idx, 'design_no', e.target.value)} /></td>
                              <td>
                                {customYarnTypeIdx === idx ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <input type="text" className="form-control" style={{ width: 120 }} placeholder="New Yarn" value={customYarnTypeVal} onChange={e => setCustomYarnTypeVal(e.target.value)} />
                                    <button type="button" className="btn btn-primary" onClick={handleSaveCustomYarnType} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setCustomYarnTypeIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                  </div>
                                ) : (
                                  <select className="form-control" style={{ width: 120 }} value={item.yarn_type || ''} onChange={e => updateItem(idx, 'yarn_type', e.target.value)}>
                                    <option value="">Select...</option>
                                    {options.masters?.yarn_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                    <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                  </select>
                                )}
                              </td>
                              <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.yarn_count} onChange={e => updateItem(idx, 'yarn_count', e.target.value)} /></td>
                              <td><input className="form-control" style={{ width: 60, padding: '6px' }} value={item.ply} onChange={e => updateItem(idx, 'ply', e.target.value)} /></td>
                              <td>
                                {customColourIdx === idx ? (
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <input type="text" className="form-control" style={{ width: 90 }} placeholder="New Colour" value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                                    <button type="button" className="btn btn-primary" onClick={handleSaveCustomColour} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setCustomColourIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                  </div>
                                ) : (
                                  <select className="form-control" style={{ width: 90 }} value={item.colour || ''} onChange={e => updateItem(idx, 'colour', e.target.value)}>
                                    <option value="">Select...</option>
                                    {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                    <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                  </select>
                                )}
                              </td>
                              <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.shade_no} onChange={e => updateItem(idx, 'shade_no', e.target.value)} /></td>
                              <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.lot_no} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                              <td><input className="form-control" style={{ width: 80, padding: '6px' }} value={item.batch_no} onChange={e => updateItem(idx, 'batch_no', e.target.value)} /></td>
                              <td><input className="form-control" style={{ width: 60, padding: '6px' }} value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} /></td>
                              
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.ordered_qty} onChange={e => updateItem(idx, 'ordered_qty', e.target.value)} /></td>
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.prev_delivered_qty} onChange={e => updateItem(idx, 'prev_delivered_qty', e.target.value)} /></td>
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.balance_qty} readOnly /></td>
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.current_delivery_qty} onChange={e => updateItem(idx, 'current_delivery_qty', e.target.value)} /></td>
                              
                              <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.no_of_bags} onChange={e => updateItem(idx, 'no_of_bags', e.target.value)} /></td>
                              <td><input type="number" className="form-control" style={{ width: 60, padding: '6px' }} value={item.no_of_cones} onChange={e => updateItem(idx, 'no_of_cones', e.target.value)} /></td>
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.gross_weight} onChange={e => updateItem(idx, 'gross_weight', e.target.value)} /></td>
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.tare_weight} onChange={e => updateItem(idx, 'tare_weight', e.target.value)} /></td>
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.net_weight} onChange={e => updateItem(idx, 'net_weight', e.target.value)} /></td>
                              
                              <td><input type="number" className="form-control" style={{ width: 80, padding: '6px' }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                              <td><input type="number" className="form-control" style={{ width: 100, padding: '6px' }} value={item.amount} readOnly /></td>
                              <td><input className="form-control" style={{ width: 100, padding: '6px' }} value={item.remarks} onChange={e => updateItem(idx, 'remarks', e.target.value)} /></td>
                              <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'financials' && (
                <div className="animate-fade" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
                  {/* QUANTITY SUMMARY */}
                  <div style={{ flex: 1, minWidth: 300 }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>QUANTITY SUMMARY</span>
                      </div>
                      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <DetailRow label="Ordered Qty" value={`${form.total_ordered_qty} Kg`} />
                        <DetailRow label="Prev Delv Qty" value={`${form.total_prev_delivered_qty} Kg`} />
                        <DetailRow label="Curr Delv Qty" value={`${form.total_current_delivery_qty} Kg`} />
                        <DetailRow label="Balance Qty" value={`${form.total_balance_qty} Kg`} />
                        <DetailRow label="Total Bags" value={form.total_bags} />
                        <DetailRow label="Total Cones" value={form.total_cones} />
                        <DetailRow label="Gross Weight" value={`${form.total_gross_weight} Kg`} />
                        <DetailRow label="Net Weight" value={`${form.total_net_weight} Kg`} />
                      </div>
                    </div>
                  </div>

                  {/* FINANCIAL SUMMARY */}
                  <div style={{ flex: '0 0 350px', minWidth: 320 }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>FINANCIAL SUMMARY</span>
                      </div>
                      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Chg</span>
                          <input type="number" className="form-control" name="freight_charges" value={form.freight_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading Chg</span>
                          <input type="number" className="form-control" name="loading_charges" value={form.loading_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Unloading Chg</span>
                          <input type="number" className="form-control" name="unloading_charges" value={form.unloading_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance</span>
                          <input type="number" className="form-control" name="insurance_charges" value={form.insurance_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Other Chg</span>
                          <input type="number" className="form-control" name="other_charges" value={form.other_charges} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>

                        <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px dashed var(--border)' }} />

                        <DetailRow label="Gross Amount" value={`₹${parseFloat(form.gross_amount).toFixed(2)}`} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Discount</span>
                          <input type="number" className="form-control" name="discount" value={form.discount} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>

                        <DetailRow label="Taxable Amount" value={`₹${parseFloat(form.taxable_amount).toFixed(2)}`} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                          <input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                          <input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                          <input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>

                        <DetailRow label="Total GST" value={`₹${parseFloat(form.total_gst).toFixed(2)}`} />
                        <DetailRow label="Round Off" value={`₹${parseFloat(form.round_off).toFixed(2)}`} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>GRAND TOTAL</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                            INR {parseFloat(form.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Advance</span>
                          <input type="number" className="form-control" name="advance" value={form.advance} onChange={handleChange} style={{ width: 100, padding: '4px 8px', margin: 0, textAlign: 'right' }} disabled={isReadOnly} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>BALANCE</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)' }}>
                            INR {parseFloat(form.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </fieldset>
          </form>
        </div>
      )}

      <A4DocumentPreview
        isOpen={!!viewModalDelivery}
        onClose={() => setViewModalDelivery(null)}
        title="YARN DYEING DELIVERY"
        documentNumber={viewModalDelivery?.delivery_no}
        status={viewModalDelivery?.delivery_status}
        onDownloadPdf={() => alert('PDF Download for Yarn Dyeing Delivery triggered')}
        sections={viewModalDelivery ? [
          {
            title: "DISPATCH LOGISTICS",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "Delivery Number", value: viewModalDelivery.delivery_no },
              { label: "Delivery Date", value: viewModalDelivery.delivery_date },
              { label: "Party Name", value: viewModalDelivery.party_name },
              { label: "Vehicle Number", value: viewModalDelivery.vehicle_no || '-' },
              { label: "Driver Name", value: viewModalDelivery.driver_name || '-' }
            ]
          },
          {
            title: "YARN CONSIGNMENT",
            icon: "Box",
            type: "grid",
            data: [
              { label: "Total Bags", value: viewModalDelivery.total_bags || 0 },
              { label: "Total Kgs", value: `${viewModalDelivery.total_net_weight || 0} Kg` }
            ]
          }
        ] : []}
      />

    </div>
  );
}
