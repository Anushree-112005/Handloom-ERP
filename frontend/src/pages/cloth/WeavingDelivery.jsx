import { useState, useEffect, useMemo } from 'react';
import { Truck, Plus, Search, Eye, Trash2, Save, X, Edit2, FileText, Database, Settings, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { weavingPOAPI, partyAPI, designEntryAPI, yarnInwardAPI } from '../../services/api';

export default function WeavingDelivery() {
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('dt_weaving_delivery_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [weavingPOs, setWeavingPOs] = useState([]);
  const [parties, setParties] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);
  const [yarnInwards, setYarnInwards] = useState([]);

  useEffect(() => {
    localStorage.setItem('dt_weaving_delivery_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poRes, partRes, deRes, yiRes] = await Promise.all([
          weavingPOAPI.list(),
          partyAPI.list(),
          designEntryAPI.list(),
          yarnInwardAPI.list()
        ]);
        setWeavingPOs(poRes.data || []);
        setParties(partRes.data || []);
        setDesignEntries(deRes.data || []);
        setYarnInwards(yiRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewModalDelivery, setViewModalDelivery] = useState(null);

  // Terms state
  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');

  const initialForm = {
    id: '',
    weaving_po_no: '',
    date: new Date().toISOString().substring(0, 10),
    delivery_type: 'Against PO',
    party_name: '',
    design_no: '',
    delivery_mode: '',
    vehicle_no: '',
    driver_name: '',
    loomNo: '',
    operator: '',
    status: 'Pending',
    remarks: '',
    terms_conditions: [],
    gross_amt: 0,
    tax_type: '',
    cgst_pct: 0,
    cgst_amount: 0,
    sgst_pct: 0,
    sgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    net_amount: 0,
    total_beam_weight: 0,
    total_weft_weight: 0,
    grand_total_issued: 0,
    items: [{
      beamNo: '',
      setNo: '',
      ends: '',
      length: '',
      weight: '',
      type: 'Sized Beam',
      status: 'Pending',
      remarks: ''
    }],
    weft_items: [{
      yarn_count: '',
      lot_no: '',
      color: '',
      bags: '',
      kgs: '',
      cone_type: 'Full Cone'
    }]
  };

  const generateNextWDNo = (existingRecords) => {
    let maxNum = 0;
    const prefix = 'WD-';
    (existingRecords || []).forEach(r => {
      const idStr = r.id || '';
      if (idStr.toUpperCase().startsWith(prefix)) {
        const numPart = idStr.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(4, '0');
    return `${prefix}${padded}`;
  };

  const [form, setForm] = useState(initialForm);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = 
        (r.loomNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.operator || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.weaving_po_no || '').toLowerCase().includes(searchTerm.toLowerCase());

      const isAgainstOrder = !!r.weaving_po_no;
      const matchesType = typeFilter === 'All Types' ||
        (typeFilter === 'Direct' && !isAgainstOrder) ||
        (typeFilter === 'Against Order' && isAgainstOrder);

      let matchesDate = true;
      if (r.date) {
        const entryDate = new Date(r.date);
        if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
        if (toDate) {
          const tDate = new Date(toDate);
          tDate.setHours(23, 59, 59);
          matchesDate = matchesDate && entryDate <= tDate;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [records, searchTerm, typeFilter, fromDate, toDate]);

  const recalculate = (updatedForm) => {
    const grossAmt = parseFloat(updatedForm.gross_amt) || 0;
    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;
    const cgstAmount = parseFloat(((cgstPct / 100) * grossAmt).toFixed(2));
    const sgstAmount = parseFloat(((sgstPct / 100) * grossAmt).toFixed(2));
    const igstAmount = parseFloat(((igstPct / 100) * grossAmt).toFixed(2));
    const netAmount = grossAmt + cgstAmount + sgstAmount + igstAmount;

    // Calculate weight totals
    const totalBeamWeight = (updatedForm.items || []).reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalWeftWeight = (updatedForm.weft_items || []).reduce((sum, item) => sum + (parseFloat(item.kgs) || 0), 0);
    const grandTotalIssued = totalBeamWeight + totalWeftWeight;

    return { 
      ...updatedForm, 
      cgst_amount: cgstAmount, 
      sgst_amount: sgstAmount, 
      igst_amount: igstAmount, 
      net_amount: netAmount,
      total_beam_weight: totalBeamWeight,
      total_weft_weight: totalWeftWeight,
      grand_total_issued: grandTotalIssued
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      return recalculate(updated);
    });
  };

  const handleFetchFromWeavingPO = (poNo) => {
    if (!poNo) {
      setForm(prev => ({ ...prev, weaving_po_no: '' }));
      return;
    }
    const po = weavingPOs.find(p => p.po_no === poNo);
    if (po) {
      setForm(prev => {
        const newItems = (po.items || []).map((poItem, index) => ({
          beamNo: `${po.po_no}-B${index + 1}`,
          setNo: po.indent_no || '',
          ends: po.warp_ends || '',
          length: po.warp_meters || poItem.qty_mtrs || '',
          weight: '',
          type: 'Sized Beam',
          status: 'Pending',
          remarks: poItem.design_no ? `Design: ${poItem.design_no}` : ''
        }));

        let taxType = 'Exempt';
        if (parseFloat(po.cgst_pct) > 0) {
          taxType = 'GST';
        } else if (parseFloat(po.igst_pct) > 0) {
          taxType = 'IGST';
        }

        // Build yarn stock list from yarnInwards
        const lotMap = {};
        (yarnInwards || []).forEach(inward => {
          if (inward.items && Array.isArray(inward.items)) {
            inward.items.forEach(item => {
              if (!item.yarn_count || !item.lot_no) return;
              const key = `${item.lot_no}-${item.yarn_count}-${item.colour || ''}`;
              if (!lotMap[key]) {
                lotMap[key] = {
                  count: item.yarn_count,
                  lotNo: item.lot_no,
                  colour: item.colour || '',
                  bags: 0,
                  netWeight: 0
                };
              }
              lotMap[key].bags += item.bags || 0;
              lotMap[key].netWeight += item.kgs || 0;
            });
          }
        });
        const stockList = Object.values(lotMap);

        // Find design-based yarns
        const designYarns = [];
        const designNo = po.design_no || (po.items && po.items[0] && po.items[0].design_no);
        const de = designEntries.find(d => d.ds_ref_no === designNo || d.design_no === designNo);
        if (de) {
          let weftSum = [];
          try {
            weftSum = typeof de.weft_summary === 'string' ? JSON.parse(de.weft_summary) : (de.weft_summary || []);
          } catch(e){}
          if (Array.isArray(weftSum)) {
            weftSum.forEach(item => {
              const cnt = item.count || item.yarn_count;
              const col = item.color || item.shade || item.colour;
              if (cnt) designYarns.push({ count: cnt, color: col || '' });
            });
          }

          let warpSum = [];
          try {
            warpSum = typeof de.warp_summary === 'string' ? JSON.parse(de.warp_summary) : (de.warp_summary || []);
          } catch(e){}
          if (Array.isArray(warpSum)) {
            warpSum.forEach(item => {
              const cnt = item.count || item.yarn_count;
              const col = item.color || item.shade || item.colour;
              if (cnt) designYarns.push({ count: cnt, color: col || '' });
            });
          }

          let yarnDet = [];
          try {
            yarnDet = typeof de.yarn_details === 'string' ? JSON.parse(de.yarn_details) : (de.yarn_details || []);
          } catch(e){}
          if (Array.isArray(yarnDet)) {
            yarnDet.forEach(item => {
              const cnt = item.yarn_count || item.count;
              const col = item.color || item.shade || item.colour;
              if (cnt) designYarns.push({ count: cnt, color: col || '' });
            });
          }
        }
        if (po.selected_count) {
          designYarns.push({ count: po.selected_count, color: po.design_color || '' });
        }

        // Deduplicate designYarns
        const uniqueKeys = new Set();
        const uniqueDesignYarns = [];
        designYarns.forEach(dy => {
          const k = `${dy.count.toLowerCase()}||${dy.color.toLowerCase()}`;
          if (!uniqueKeys.has(k)) {
            uniqueKeys.add(k);
            uniqueDesignYarns.push(dy);
          }
        });

        // Find matching stock items from the stockList
        const matchedWeftItems = [];
        const matchedKeys = new Set();
        uniqueDesignYarns.forEach(dy => {
          stockList.forEach(stockItem => {
            if (stockItem.count.toLowerCase() === dy.count.toLowerCase() && 
                (stockItem.colour.toLowerCase() === dy.color.toLowerCase() || !dy.color)) {
              const itemKey = `${stockItem.lotNo}||${stockItem.count}||${stockItem.colour}`;
              if (!matchedKeys.has(itemKey)) {
                matchedKeys.add(itemKey);
                matchedWeftItems.push({
                  yarn_count: stockItem.count,
                  lot_no: stockItem.lotNo,
                  color: stockItem.colour,
                  bags: stockItem.bags,
                  kgs: stockItem.netWeight,
                  cone_type: 'Full Cone'
                });
              }
            }
          });
        });

        const finalWeftItems = matchedWeftItems.length > 0 
          ? matchedWeftItems 
          : [{ yarn_count: po.selected_count || '', lot_no: '', color: po.design_color || '', bags: '', kgs: '', cone_type: 'Full Cone' }];

        const updatedForm = {
          ...prev,
          weaving_po_no: poNo,
          delivery_type: 'Against PO',
          party_name: po.supplier_weaver || '',
          design_no: designNo || '',
          remarks: po.remarks || '',
          terms_conditions: po.terms_conditions || [],
          gross_amt: parseFloat(po.taxable_value) || parseFloat(po.weaving_charge) || 0,
          tax_type: taxType,
          cgst_pct: parseFloat(po.cgst_pct) || 0,
          sgst_pct: parseFloat(po.sgst_pct) || 0,
          igst_pct: parseFloat(po.igst_pct) || 0,
          items: newItems.length > 0 ? newItems : [{ beamNo: `${po.po_no}-B1`, setNo: '', ends: '', length: '', weight: '', type: 'Sized Beam', status: 'Pending', remarks: '' }],
          weft_items: finalWeftItems
        };

        return recalculate(updatedForm);
      });
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (editingId) {
      setRecords(prev => prev.map(r => r.id === editingId ? { ...form, id: editingId } : r));
    } else {
      const newId = form.id || generateNextWDNo(records);
      setRecords(prev => [...prev, { ...form, id: newId }]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleEdit = (r) => {
    setForm(r);
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm(`Remove weaving delivery voucher ${id}?`)) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const addItem = () => {
    setForm(prev => recalculate({
      ...prev,
      items: [...(prev.items || []), { beamNo: '', setNo: '', ends: '', length: '', weight: '', type: 'Sized Beam', status: 'Pending', remarks: '' }]
    }));
  };

  const removeItem = (idx) => {
    setForm(prev => recalculate({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== idx)
    }));
  };

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const newItems = [...(prev.items || [])];
      newItems[idx] = { ...newItems[idx], [field]: value };
      return recalculate({ ...prev, items: newItems });
    });
  };

  const addWeftItem = () => {
    setForm(prev => recalculate({
      ...prev,
      weft_items: [...(prev.weft_items || []), { yarn_count: '', lot_no: '', color: '', bags: '', kgs: '', cone_type: 'Full Cone' }]
    }));
  };

  const removeWeftItem = (idx) => {
    setForm(prev => recalculate({
      ...prev,
      weft_items: (prev.weft_items || []).filter((_, i) => i !== idx)
    }));
  };

  const updateWeftItem = (idx, field, value) => {
    setForm(prev => {
      const newWeftItems = [...(prev.weft_items || [])];
      newWeftItems[idx] = { ...newWeftItems[idx], [field]: value };
      return recalculate({ ...prev, weft_items: newWeftItems });
    });
  };

  const addTerm = () => {
    if (newTerm.trim()) {
      setForm(prev => ({ ...prev, terms_conditions: [...(prev.terms_conditions || []), newTerm.trim()] }));
      setNewTerm('');
    }
  };

  const removeTerm = (index) => {
    setForm(prev => ({ ...prev, terms_conditions: (prev.terms_conditions || []).filter((_, i) => i !== index) }));
  };

  const exportExcel = () => {
    const flatRecords = records.flatMap(r => 
      (r.items || []).map(item => ({
        VoucherID: r.id,
        WeavingPONo: r.weaving_po_no,
        Date: r.date,
        DeliveryType: r.delivery_type || 'Against PO',
        PartyName: r.party_name || '',
        DesignNo: r.design_no || '',
        DeliveryMode: r.delivery_mode || '',
        VehicleNo: r.vehicle_no || '',
        DriverName: r.driver_name || '',
        LoomNo: r.loomNo,
        Operator: r.operator,
        VoucherStatus: r.status,
        Remarks: r.remarks,
        BeamNo: item.beamNo,
        SetNo: item.setNo || '',
        Ends: item.ends || '',
        LengthMtr: item.length,
        WeightKg: item.weight,
        BeamType: item.type || 'Sized Beam',
        TotalBeamWeight: r.total_beam_weight || 0,
        TotalWeftWeight: r.total_weft_weight || 0,
        GrandTotalIssued: r.grand_total_issued || 0,
        GrossAmount: r.gross_amt,
        TaxType: r.tax_type,
        NetAmount: r.net_amount
      }))
    );
    const ws = XLSX.utils.json_to_sheet(flatRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weaving Delivery');
    XLSX.writeFile(wb, `Weaving_Delivery_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={24} color="var(--primary)" /> Weaving Delivery 
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage sized beam deliveries and issues to specific loom configurations.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} /> Excel
              </button>
              <button className="btn btn-primary" onClick={() => { const nextWD = generateNextWDNo(records); setForm({ ...initialForm, id: nextWD }); setEditingId(null); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> New Delivery
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setTypeFilter('All Types')} style={{ cursor: 'pointer', border: typeFilter === 'All Types' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon purple" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}><Truck size={24} /></div>
              <div className="stat-details">
                <h3>Total Deliveries</h3>
                <div className="value">{records.length}</div>
              </div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Direct')} style={{ cursor: 'pointer', border: typeFilter === 'Direct' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon emerald" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Truck size={24} /></div>
              <div className="stat-details">
                <h3>Direct Delivery</h3>
                <div className="value">{records.filter(r => !r.weaving_po_no).length}</div>
              </div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Against Order')} style={{ cursor: 'pointer', border: typeFilter === 'Against Order' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon amber" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Truck size={24} /></div>
              <div className="stat-details">
                <h3>Against Order</h3>
                <div className="value">{records.filter(r => !!r.weaving_po_no).length}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search Loom, Operator, PO or Voucher..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option>
                <option>Direct</option>
                <option>Against Order</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
                <input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
                <input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Weaving Delivery No</th>
                  <th>Weaving PO No</th>
                  <th>Date</th>
                  <th>Loom Allocation</th>
                  <th>Loom Operator</th>
                  <th style={{ textAlign: 'center' }}>Total Beams</th>
                  <th style={{ textAlign: 'right' }}>Total Length</th>
                  <th style={{ textAlign: 'right' }}>Total Weight</th>
                  <th style={{ textAlign: 'right' }}>Net Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => {
                  const totalBeams = r.items?.length || 0;
                  const totalLength = r.items?.reduce((sum, item) => sum + (parseFloat(item.length) || 0), 0) || 0;
                  const totalWeight = parseFloat(r.grand_total_issued) || (r.items?.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0) || 0);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{r.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.weaving_po_no || '-'}</td>
                      <td>{r.date}</td>
                      <td style={{ fontWeight: 600 }}>{r.loomNo}</td>
                      <td>{r.operator}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{totalBeams}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{totalLength.toFixed(2)} Mtr</td>
                      <td style={{ textAlign: 'right' }}>{totalWeight.toFixed(2)} Kg</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₹{(r.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setViewModalDelivery(r)}
                            title="Preview Delivery"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEdit(r)} title="Edit"><Edit2 size={12} /></button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(r.id)} title="Delete"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Weaving Delivery' : 'New Weaving Delivery'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              <button type="submit" form="weaving-delivery-form" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}</button>
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
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FileText size={18} /> Weaving Delivery Details
            </button>
          </div>

          <form id="weaving-delivery-form" onSubmit={handleCreate} style={{ padding: 24, background: '#fff' }}>

          <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Voucher Information</h4>
          <div className="form-row" style={{ gridTemplateColumns: editingId ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 16 }}>
            {editingId && (
              <div className="form-group">
                <label>Weaving Delivery No</label>
                <input type="text" className="form-control" value={form.id} disabled required />
              </div>
            )}
            <div className="form-group">
              <label>DC Date</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Delivery Type</label>
              <select className="form-control" value={form.delivery_type} onChange={e => setForm({ ...form, delivery_type: e.target.value })}>
                <option value="Against PO">Against PO</option>
                <option value="Direct">Direct</option>
              </select>
            </div>
            <div className="form-group">
              <label>Party (Weaving Unit)</label>
              <select className="form-control" value={form.party_name || ''} onChange={e => setForm({ ...form, party_name: e.target.value })}>
                <option value="">Select Weaving Unit...</option>
                {parties.map(p => (
                  <option key={p.id} value={p.company_name}>
                    {p.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 12 }}>
            <div className="form-group">
              <label>Weaving PO No</label>
              <select 
                className="form-control" 
                value={form.weaving_po_no || ''} 
                onChange={e => handleFetchFromWeavingPO(e.target.value)}
                disabled={form.delivery_type === 'Direct'}
              >
                <option value="">Select Weaving PO...</option>
                {weavingPOs.map(po => (
                  <option key={po.id} value={po.po_no}>
                    {po.po_no} ({po.supplier_weaver || 'No Weaver'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Design No</label>
              <input type="text" className="form-control" placeholder="Design No" value={form.design_no} onChange={e => setForm({ ...form, design_no: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Delivery Mode</label>
              <input type="text" className="form-control" placeholder="e.g. By Road" value={form.delivery_mode} onChange={e => setForm({ ...form, delivery_mode: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Vehicle No</label>
              <input type="text" className="form-control" placeholder="e.g. TN-36-CX-7200" value={form.vehicle_no} onChange={e => setForm({ ...form, vehicle_no: e.target.value })} />
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12 }}>
            <div className="form-group">
              <label>Driver Name</label>
              <input type="text" className="form-control" placeholder="Driver Name" value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Loom Selection / Godown</label>
              <input type="text" className="form-control" placeholder="e.g. Loom-08" value={form.loomNo} onChange={e => setForm({ ...form, loomNo: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Loom Operator</label>
              <input type="text" className="form-control" placeholder="Operator Name" value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} required />
            </div>
          </div>

          {/* Section 2: Table Section (Beams) */}
          <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>WARP BEAM DETAILS DELIVERED</h4>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Beam</button>
          </div>
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beam No</th>
                  <th>Set No</th>
                  <th>Ends</th>
                  <th>Length (Mtr)</th>
                  <th>Weight (Kgs)</th>
                  <th>Type</th>
                  <th style={{ width: 50, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(form.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td><input className="form-control" style={{ width: 130, padding: '6px', margin: 0 }} placeholder="e.g. BM-00301" value={item.beamNo} onChange={e => updateItem(idx, 'beamNo', e.target.value)} required /></td>
                    <td><input className="form-control" style={{ width: 110, padding: '6px', margin: 0 }} placeholder="e.g. SET-00301" value={item.setNo} onChange={e => updateItem(idx, 'setNo', e.target.value)} /></td>
                    <td><input className="form-control" style={{ width: 90, padding: '6px', margin: 0 }} placeholder="4536" value={item.ends} onChange={e => updateItem(idx, 'ends', e.target.value)} /></td>
                    <td><input type="number" className="form-control" style={{ width: 110, padding: '6px', margin: 0 }} placeholder="2300" value={item.length} onChange={e => updateItem(idx, 'length', e.target.value)} required /></td>
                    <td><input type="number" className="form-control" style={{ width: 110, padding: '6px', margin: 0 }} placeholder="352.00" value={item.weight} onChange={e => updateItem(idx, 'weight', e.target.value)} required /></td>
                    <td><input className="form-control" style={{ width: 120, padding: '6px', margin: 0 }} placeholder="Sized Beam" value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)} /></td>
                    <td style={{ textAlign: 'center' }}><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2.5: Table Section (Weft Yarn) */}
          <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>WEFT YARN DETAILS DELIVERED</h4>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={addWeftItem}><Plus size={16} /> Add Weft Yarn</button>
          </div>
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Yarn Count</th>
                  <th>Lot No</th>
                  <th>Color</th>
                  <th>Bags</th>
                  <th>Kgs</th>
                  <th>Cone Type</th>
                  <th style={{ width: 50, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(form.weft_items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td><input className="form-control" style={{ width: 140, padding: '6px', margin: 0 }} placeholder="e.g. 20S CTN" value={item.yarn_count} onChange={e => updateWeftItem(idx, 'yarn_count', e.target.value)} required /></td>
                    <td><input className="form-control" style={{ width: 140, padding: '6px', margin: 0 }} placeholder="e.g. 020726-1" value={item.lot_no} onChange={e => updateWeftItem(idx, 'lot_no', e.target.value)} /></td>
                    <td><input className="form-control" style={{ width: 140, padding: '6px', margin: 0 }} placeholder="e.g. H.White" value={item.color} onChange={e => updateWeftItem(idx, 'color', e.target.value)} /></td>
                    <td><input type="number" className="form-control" style={{ width: 110, padding: '6px', margin: 0 }} placeholder="2" value={item.bags} onChange={e => updateWeftItem(idx, 'bags', e.target.value)} /></td>
                    <td><input type="number" className="form-control" style={{ width: 110, padding: '6px', margin: 0 }} placeholder="92.00" value={item.kgs} onChange={e => updateWeftItem(idx, 'kgs', e.target.value)} required /></td>
                    <td>
                      <select className="form-control" style={{ width: 140, padding: '6px', margin: 0 }} value={item.cone_type} onChange={e => updateWeftItem(idx, 'cone_type', e.target.value)}>
                        <option value="Full Cone">Full Cone</option>
                        <option value="Half Cone">Half Cone</option>
                        <option value="Cheese Package">Cheese Package</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}><button type="button" onClick={() => removeWeftItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Terms & Conditions & Order Summary */}
          <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Terms & Summary</h4>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TERMS & CONDITIONS</span>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(form.terms_conditions || []).map((term, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {editingTermIdx === idx ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input 
                              type="text" 
                              className="form-control" 
                              style={{ flex: 1, margin: 0, fontSize: 13, border: '1px solid var(--primary)' }} 
                              value={editingTermVal} 
                              onChange={e => setEditingTermVal(e.target.value)} 
                              autoFocus 
                              onKeyDown={e => { 
                                if (e.key === 'Enter') { 
                                  e.preventDefault(); 
                                  const updated = [...form.terms_conditions]; 
                                  updated[idx] = editingTermVal; 
                                  setForm({ ...form, terms_conditions: updated }); 
                                  setEditingTermIdx(null); 
                                } 
                              }} 
                            />
                            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'green' }} onClick={() => { const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={16} /></button>
                            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }} onClick={() => setEditingTermIdx(null)}><X size={16} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <span>{term}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--primary)' }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }}><Edit2 size={14} /></button>
                              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#ef4444' }} onClick={() => removeTerm(idx)}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input type="text" className="form-control" placeholder="Add new term or condition..." style={{ margin: 0 }} value={newTerm} onChange={e => setNewTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTerm())} />
                    <button type="button" className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={addTerm}>
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div style={{ width: 350, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>DELIVERY WEIGHT SUMMARY</span>
                </div>
                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Beam Weight</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.total_beam_weight || 0).toFixed(2)} Kgs</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Weft Weight</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.total_weft_weight || 0).toFixed(2)} Kgs</span>
                  </div>
                  <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>Grand Total Issued</span>
                    <span style={{ fontSize: 15, color: 'var(--primary)', fontWeight: 800 }}>{(form.grand_total_issued || 0).toFixed(2)} Kgs</span>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>ORDER SUMMARY</span>
                </div>
                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Gross Amount</span>
                    <input 
                      type="number" 
                      name="gross_amt" 
                      value={form.gross_amt} 
                      onChange={handleChange} 
                      style={{
                        width: '120px',
                        textAlign: 'right',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        background: 'transparent'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Tax Type</span>
                    <select 
                      name="tax_type" 
                      value={form.tax_type || ''} 
                      onChange={handleChange}
                      style={{
                        width: '120px',
                        textAlign: 'right',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        background: 'transparent'
                      }}
                    >
                      <option value="">Select...</option>
                      <option value="GST">GST</option>
                      <option value="IGST">IGST</option>
                      <option value="Exempt">Exempt</option>
                    </select>
                  </div>

                  {(form.tax_type === 'GST') && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                          <input type="number" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                          <input type="number" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}

                  {form.tax_type === 'IGST' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                          <input type="number" name="igst_pct" value={form.igst_pct} onChange={handleChange} className="form-control" style={{ width: 50, padding: '2px 6px', margin: 0, height: 26, fontSize: 13 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 700 }}>Net Amount</span>
                    <span style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 800 }}>₹{(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </form>
        </div>
      )}

      <A4DocumentPreview
        isOpen={!!viewModalDelivery}
        onClose={() => setViewModalDelivery(null)}
        title="WEAVING DELIVERY (BEAM ISSUE)"
        documentNumber={viewModalDelivery?.id}
        status={viewModalDelivery?.status}
        onDownloadPdf={() => alert('PDF Export functionality')}
        sections={viewModalDelivery ? [
          {
            title: "VOUCHER DETAILS",
            icon: "FileText",
            type: "grid",
            data: [
              { label: "Weaving Delivery No", value: viewModalDelivery.id },
              { label: "DC Date", value: viewModalDelivery.date },
              { label: "Delivery Type", value: viewModalDelivery.delivery_type || 'Against PO' },
              { label: "Party (Weaving Unit)", value: viewModalDelivery.party_name || '-' },
              { label: "Weaving PO No", value: viewModalDelivery.weaving_po_no || '-' },
              { label: "Design No", value: viewModalDelivery.design_no || '-' },
              { label: "Delivery Mode", value: viewModalDelivery.delivery_mode || '-' },
              { label: "Vehicle No", value: viewModalDelivery.vehicle_no || '-' },
              { label: "Driver Name", value: viewModalDelivery.driver_name || '-' },
              { label: "Loom Allocation", value: viewModalDelivery.loomNo },
              { label: "Loom Operator", value: viewModalDelivery.operator }
            ]
          },
          {
            title: "WARP BEAM DETAILS DELIVERED",
            icon: "Package",
            type: "table",
            headers: ["Beam No", "Set No", "Ends", "Length (Mtr)", "Weight (Kg)", "Type"],
            rows: (viewModalDelivery.items || []).map(b => [
              b.beamNo || '-',
              b.setNo || '-',
              b.ends || '-',
              `${parseFloat(b.length || 0).toFixed(2)} Mtr`,
              `${parseFloat(b.weight || 0).toFixed(2)} Kg`,
              b.type || '-'
            ])
          },
          {
            title: "WEFT YARN DETAILS DELIVERED",
            icon: "Package",
            type: "table",
            headers: ["Yarn Count", "Lot No", "Color", "Bags", "Kgs", "Cone Type"],
            rows: (viewModalDelivery.weft_items || []).map(w => [
              w.yarn_count || '-',
              w.lot_no || '-',
              w.color || '-',
              w.bags || '0',
              `${parseFloat(w.kgs || 0).toFixed(2)} Kg`,
              w.cone_type || '-'
            ])
          },
          {
            title: "SUMMARY",
            icon: "Database",
            type: "grid",
            data: [
              { label: "Total Beam Weight", value: `${parseFloat(viewModalDelivery.total_beam_weight || 0).toFixed(2)} Kg` },
              { label: "Total Weft Weight", value: `${parseFloat(viewModalDelivery.total_weft_weight || 0).toFixed(2)} Kg` },
              { label: "Grand Total Issued", value: `${parseFloat(viewModalDelivery.grand_total_issued || 0).toFixed(2)} Kg` }
            ]
          },
          {
            title: "FINANCIAL SUMMARY",
            icon: "Database",
            type: "grid",
            data: [
              { label: "Gross Amount", value: `₹${(viewModalDelivery.gross_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              { label: "Tax Type", value: viewModalDelivery.tax_type || 'Exempt' },
              { label: "CGST Amount", value: `₹${(viewModalDelivery.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              { label: "SGST Amount", value: `₹${(viewModalDelivery.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              { label: "IGST Amount", value: `₹${(viewModalDelivery.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              { label: "Net Amount", value: `₹${(viewModalDelivery.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
            ]
          },
          {
            title: "TERMS & CONDITIONS",
            icon: "Settings",
            type: "list",
            data: viewModalDelivery.terms_conditions || []
          }
        ] : []}
      />
    </div>
  );
}
