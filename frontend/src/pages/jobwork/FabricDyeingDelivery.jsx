import { useState, useEffect } from 'react';
import { Truck, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { clothDeliveryAPI, dropdownAPI, fabricDyeingPOAPI } from '../../services/api';
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

export default function FabricDyeingDelivery() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedViewDelivery, setSelectedViewDelivery] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown options
  const [options, setOptions] = useState({
    agents: [],
    transporters: [],
    all_parties: [],
    employees: [],
    masters: {}
  });
  const [dyeingPOs, setDyeingPOs] = useState([]);

  const initialForm = {
    dc_no: '',
    dc_date: new Date().toISOString().split('T')[0],
    delivery_type: 'Job Work',
    delivery_mode: 'Road',
    party_name: '',
    po_no: '',
    process_type: 'Dyeing', // Hardcoded for this screen
    design_no: '',
    ibpo: '',
    fabric_detail: '',
    pc_type: 'Grey',
    ibpo_order_mtr: 0,
    delivery_mtr: 0,
    balance: 0,
    fresh_width: 0,
    finish_fold: 'Standard',
    process_comm: '',
    bpo_no: '',
    design_no_bottom: '',
    buyer_name: '',
    lot_no: '',
    griege_rate: 0,
    return_type: 'None',
    oba: '',
    finish_pick: 0,
    glm: 0,

    // Voucher Entry
    voucher_no: '',
    voucher_date: new Date().toISOString().split('T')[0],
    rate_mtr: 0,
    debited_amount: 0,
    detailed_remarks: '',

    // Gate Pass / Logistics
    transport_name: '',
    vehicle_no: '',
    driver_name: '',
    mobile_no: '',

    status: 'Delivered',
    total_pieces: 0,
    total_meters: 0,
    gross_amount: 0,
    sgst: 0,
    igst: 0,
    net_amount: 0
  };

  const [formData, setFormData] = useState(initialForm);

  // Pieces Grid
  const [items, setItems] = useState([
    { piece_no: '', lot_no: '', ok_mtr: 0, fold_mtr: 0, design_no: '', color: '', rate: 0, amount: 0 }
  ]);

  useEffect(() => {
    fetchDeliveries();
    fetchOptions();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const { data } = await clothDeliveryAPI.list();
      // Filter only "Dyeing" deliveries
      const dyeingOnly = data.filter(d => d.process_type === 'Dyeing');
      setDeliveries(dyeingOnly);
    } catch (err) {
      console.error("Error fetching dyeing deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [optRes, poRes] = await Promise.all([
        dropdownAPI.getAll(),
        fabricDyeingPOAPI.list()
      ]);
      setOptions(optRes.data);
      setDyeingPOs(poRes.data || []);
    } catch (err) {
      console.error("Error fetching dropdowns/POs:", err);
    }
  };

  // Auto Calculations
  useEffect(() => {
    const totalPcs = items.length;
    const totalMtr = items.reduce((sum, item) => sum + (Number(item.ok_mtr) || 0), 0);
    const balanceMtr = Math.max(0, (Number(formData.ibpo_order_mtr) || 0) - totalMtr);
    const debitedAmt = totalMtr * (Number(formData.rate_mtr) || 0);

    setFormData(prev => ({
      ...prev,
      total_pieces: totalPcs,
      total_meters: totalMtr,
      delivery_mtr: totalMtr,
      balance: balanceMtr,
      debited_amount: debitedAmt,
      gross_amount: debitedAmt,
      net_amount: debitedAmt
    }));
  }, [items, formData.ibpo_order_mtr, formData.rate_mtr]);

  const handleOpenForm = (delivery = null, readOnly = false) => {
    if (delivery) {
      setEditingId(delivery.id);
      setFormData({
        ...delivery,
        process_type: 'Dyeing'
      });

      if (delivery.items && delivery.items.length > 0) {
        setItems(delivery.items.map(item => ({
          piece_no: item.piece_no || '',
          lot_no: item.lot_no || '',
          ok_mtr: Number(item.ok_mtr) || 0,
          fold_mtr: Number(item.fold_mtr) || 0,
          design_no: item.design_no || '',
          color: item.color || '',
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0
        })));
      } else {
        setItems([{ piece_no: '', lot_no: '', ok_mtr: 0, fold_mtr: 0, design_no: '', color: '', rate: 0, amount: 0 }]);
      }
    } else {
      let maxNum = 0;
      deliveries.forEach(d => {
        if (d.dc_no && d.dc_no.toUpperCase().startsWith("CD-")) {
          const parts = d.dc_no.split("-");
          if (parts.length > 1) {
            const num = parseInt(parts[1]);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });
      const nextNum = maxNum > 0 ? maxNum + 1 : 5001;
      const nextDcNo = `CD-${nextNum}`;

      setFormData({
        ...initialForm,
        dc_no: nextDcNo,
        dc_date: new Date().toISOString().split('T')[0]
      });
      setEditingId(null);
      setItems([{ piece_no: '', lot_no: '', ok_mtr: 0, fold_mtr: 0, design_no: '', color: '', rate: 0, amount: 0 }]);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, dcNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Dyeing Delivery Challan ${dcNo}?`)) {
      try {
        await clothDeliveryAPI.delete(id);
        if (selectedViewDelivery?.id === id) setSelectedViewDelivery(null);
        fetchDeliveries();
      } catch (err) {
        console.error(err);
        alert("Error deleting dyeing delivery challan.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'po_no') {
      const selectedPO = dyeingPOs.find(p => p.po_no === value);
      if (selectedPO) {
        const firstItem = selectedPO.items && selectedPO.items[0] ? selectedPO.items[0] : {};
        setFormData(prev => ({
          ...prev,
          po_no: value,
          party_name: selectedPO.supplier_dyeing_unit || prev.party_name,
          buyer_name: selectedPO.buyer_name || prev.buyer_name,
          design_no: firstItem.design_no || selectedPO.design_no || prev.design_no,
          ibpo: selectedPO.buyer_order_no || prev.ibpo,
          fabric_detail: firstItem.fabric_name || prev.fabric_detail,
          ibpo_order_mtr: Number(firstItem.qty) || prev.ibpo_order_mtr,
          rate_mtr: Number(firstItem.rate) || prev.rate_mtr
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: ['ibpo_order_mtr', 'fresh_width', 'griege_rate', 'finish_pick', 'glm', 'rate_mtr'].includes(name)
        ? (value === '' ? 0 : Number(value))
        : value
    }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: ['ok_mtr', 'fold_mtr', 'rate', 'amount'].includes(field)
          ? (value === '' ? 0 : Number(value))
          : value
      };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { piece_no: '', lot_no: '', ok_mtr: 0, fold_mtr: 0, design_no: '', color: '', rate: 0, amount: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    const payload = {
      ...formData,
      process_type: 'Dyeing',
      items: items.map(item => ({
        ...item,
        design_no: item.design_no || formData.design_no || null,
        meters: Number(item.ok_mtr) || 0,
        amount: (Number(item.ok_mtr) || 0) * (Number(item.rate) || 0)
      }))
    };

    try {
      if (editingId) {
        await clothDeliveryAPI.update(editingId, payload);
      } else {
        await clothDeliveryAPI.create(payload);
      }
      setView('list');
      fetchDeliveries();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving Dyeing Delivery challan");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Fabric Dyeing Delivery Challans Report", 14, 15);
    const tableColumn = ["DC No", "DC Date", "Party Name", "Meters", "Status"];
    const tableRows = [];

    filteredDeliveries.forEach(del => {
      const rowData = [
        del.dc_no || '-',
        del.dc_date || '-',
        del.party_name || '-',
        Number(del.total_meters).toFixed(2),
        del.status || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Dyeing_Deliveries_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDeliveries.map(del => ({
      "DC No": del.dc_no,
      "DC Date": del.dc_date,
      "Party Name": del.party_name,
      "Design No": del.design_no,
      "Total Meters": del.total_meters,
      "Status": del.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dyeing Deliveries");
    XLSX.writeFile(workbook, `Dyeing_Deliveries_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredDeliveries = deliveries.filter(del => {
    const matchesSearch = searchTerm === '' ||
      del.dc_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.design_no?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (del.dc_date) {
      const dDate = new Date(del.dc_date);
      if (fromDate) matchesDate = matchesDate && dDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && dDate <= tDate;
      }
    }
    return matchesSearch && matchesDate;
  });

  const totalDels = deliveries.length;
  const totalMetersSum = deliveries.reduce((sum, d) => sum + (Number(d.total_meters) || 0), 0);

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => setView('list')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Dyeing Delivery Details' : editingId ? 'Edit Dyeing Delivery Challan' : 'Add New Dyeing Delivery Entry'}</h2>
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
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={18} /> Challan Details
            </button>
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="dyeingDeliveryForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                <div className="animate-fade">
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Dyeing Delivery & Party Information</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>DC Date *</label>
                        <input type="date" className="form-control" name="dc_date" value={formData.dc_date} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Delivery Type</label>
                        <select className="form-control" name="delivery_type" value={formData.delivery_type} onChange={handleInputChange}>
                          <option value="Job Work">Job Work</option>
                          <option value="Return">Return</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery Mode</label>
                        <select className="form-control" name="delivery_mode" value={formData.delivery_mode} onChange={handleInputChange}>
                          <option value="Road">Road</option>
                          <option value="Rail">Rail</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Party Name *</label>
                        <select className="form-control" name="party_name" value={formData.party_name} onChange={handleInputChange} required>
                          <option value="">-- Select Party --</option>
                          {options.all_parties.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>PO No</label>
                        <select className="form-control" name="po_no" value={formData.po_no || ''} onChange={handleInputChange}>
                          <option value="">-- Select PO --</option>
                          {dyeingPOs.map(po => (
                            <option key={po.id} value={po.po_no}>{po.po_no} ({po.supplier_dyeing_unit || 'No Supplier'})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Buyer Name</label>
                        <select className="form-control" name="buyer_name" value={formData.buyer_name} onChange={handleInputChange}>
                          <option value="">-- Same as Party --</option>
                          {options.all_parties.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="animate-fade" style={{ marginTop: 32 }}>
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Dyeing Specifications</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Process Type</label>
                        <input className="form-control" value="Dyeing" readOnly style={{ background: '#f1f5f9' }} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input className="form-control" name="design_no" value={formData.design_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>IBPO</label>
                        <input className="form-control" name="ibpo" value={formData.ibpo} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>PC Type</label>
                        <select className="form-control" name="pc_type" value={formData.pc_type} onChange={handleInputChange}>
                          <option value="Grey">Grey Fabric</option>
                          <option value="Dyed">Dyed Fabric</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Fabric Quality Detail</label>
                        <input className="form-control" name="fabric_detail" value={formData.fabric_detail} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>IBPO Order Mtr</label>
                        <input type="number" className="form-control" name="ibpo_order_mtr" value={formData.ibpo_order_mtr} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Delivery Mtr (Sum)</label>
                        <input type="number" className="form-control" value={formData.delivery_mtr} readOnly style={{ background: '#f1f5f9' }} />
                      </div>
                    </div>
                  </div>

                  <div className="animate-fade" style={{ marginTop: 32 }}>
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Dyeing Pieces Grid</h4>
                    <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                      <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ width: 60, textAlign: 'center' }}>S.No</th>
                            <th>PC No / Piece No *</th>
                            <th>Lot No</th>
                            <th>OK Meters *</th>
                            <th>Fold Meters</th>
                            {!isReadOnly && <th style={{ width: 50, textAlign: 'center' }}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                              <td>
                                <input className="form-control" value={item.piece_no} onChange={e => handleItemChange(index, 'piece_no', e.target.value)} required />
                              </td>
                              <td>
                                <input className="form-control" value={item.lot_no} onChange={e => handleItemChange(index, 'lot_no', e.target.value)} />
                              </td>
                              <td>
                                <input type="number" className="form-control" value={item.ok_mtr} onChange={e => handleItemChange(index, 'ok_mtr', e.target.value)} required />
                              </td>
                              <td>
                                <input type="number" className="form-control" value={item.fold_mtr} onChange={e => handleItemChange(index, 'fold_mtr', e.target.value)} />
                              </td>
                              {!isReadOnly && (
                                <td style={{ textAlign: 'center' }}>
                                  <button type="button" onClick={() => removeItemRow(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={addItemRow} className="btn btn-secondary" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>+ Add Piece</button>
                    )}
                  </div>

                  <div className="animate-fade" style={{ marginTop: 32 }}>
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Voucher & Logistics Info</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
                      <div className="form-group">
                        <label>Voucher No</label>
                        <input className="form-control" name="voucher_no" value={formData.voucher_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Voucher Date</label>
                        <input type="date" className="form-control" name="voucher_date" value={formData.voucher_date} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Rate / Meter Rs.</label>
                        <input type="number" className="form-control" name="rate_mtr" value={formData.rate_mtr} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Debited Amount Rs.</label>
                        <input type="number" className="form-control" value={formData.debited_amount} readOnly style={{ background: '#f1f5f9' }} />
                      </div>
                    </div>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Transport Name</label>
                        <select className="form-control" name="transport_name" value={formData.transport_name} onChange={handleInputChange}>
                          <option value="">-- Select Transport --</option>
                          {options.transporters.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Vehicle No</label>
                        <input className="form-control" name="vehicle_no" value={formData.vehicle_no} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
              </fieldset>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                  <X size={16} /> Close
                </button>
                {!isReadOnly && (
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={24} color="var(--primary)" /> Fabric Dyeing Delivery
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Log fabric deliveries sent to external Dyehouses.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Download size={16} /> Export</button>
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, zIndex: 10, width: 140 }}>
                <button onClick={() => { exportPDF(); setShowExportMenu(false); }} style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>PDF Report</button>
                <button onClick={() => { exportExcel(); setShowExportMenu(false); }} style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>Excel Sheet</button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}><Plus size={18} /> Add New Delivery</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Truck size={24} /></div>
          <div className="stat-details">
            <h3>Total Deliveries</h3>
            <div className="value">{totalDels}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Save size={24} /></div>
          <div className="stat-details">
            <h3>Total Meters Sent</h3>
            <div className="value">{totalMetersSum.toLocaleString()} Mtr</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by DC No, Party or Design..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>DC No</th>
              <th>DC Date</th>
              <th>Processor Name</th>
              <th>Design No</th>
              <th style={{ textAlign: 'right' }}>Total Pieces</th>
              <th style={{ textAlign: 'right' }}>Total Meters</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.map(del => (
              <tr key={del.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedViewDelivery(del)}>
                <td style={{ fontWeight: 700 }}>{del.dc_no}</td>
                <td>{del.dc_date}</td>
                <td style={{ fontWeight: 600 }}>{del.party_name}</td>
                <td>{del.design_no}</td>
                <td style={{ textAlign: 'right' }}>{del.total_pieces}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(del.total_meters).toFixed(2)} Mtr</td>
                <td><span className="badge badge-active">{del.status}</span></td>
                <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => setSelectedViewDelivery(del)}
                      title="Preview Delivery"
                    >
                      <Eye size={16} color="var(--primary)" />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(del)} title="Edit"><Edit2 size={12} /></button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(del.id, del.dc_no)} title="Delete"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <A4DocumentPreview
        isOpen={!!selectedViewDelivery}
        onClose={() => setSelectedViewDelivery(null)}
        title="FABRIC DYEING DELIVERY CHALLAN"
        documentNumber={selectedViewDelivery?.dc_no}
        status={selectedViewDelivery?.status}
        onDownloadPdf={() => alert('PDF Export functionality to be implemented')}
        sections={selectedViewDelivery ? [
          {
            title: "CHALLAN DETAILS",
            icon: "FileText",
            type: "grid",
            data: [
              { label: "DC Number", value: selectedViewDelivery.dc_no },
              { label: "DC Date", value: selectedViewDelivery.dc_date },
              { label: "Processor Name", value: selectedViewDelivery.party_name },
              { label: "Design No", value: selectedViewDelivery.design_no },
              { label: "PO No", value: selectedViewDelivery.po_no || '-' },
              { label: "Vessel/Vehicle No", value: selectedViewDelivery.vehicle_no || '-' }
            ]
          },
          {
            title: "FINANCIALS & QUANTITY",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "Total Pieces", value: selectedViewDelivery.total_pieces },
              { label: "Total Meters", value: `${Number(selectedViewDelivery.total_meters).toFixed(2)} Mtr` },
              { label: "Voucher No", value: selectedViewDelivery.voucher_no || '-' },
              { label: "Rate per Meter", value: `₹${selectedViewDelivery.rate_mtr || '0.00'}` },
              { label: "Amount Debited", value: `₹${selectedViewDelivery.debited_amount || '0.00'}` }
            ]
          }
        ] : []}
      />
    </div>
  );
}
