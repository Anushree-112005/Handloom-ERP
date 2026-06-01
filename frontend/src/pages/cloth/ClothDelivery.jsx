import { useState, useEffect } from 'react';
import { Truck, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { clothDeliveryAPI, dropdownAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function ClothDelivery() {
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
  const [typeFilter, setTypeFilter] = useState('All Types');
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

  // Initial Form State matching first image
  const initialForm = {
    dc_no: '',
    dc_date: new Date().toISOString().split('T')[0],
    delivery_type: 'Job Work',
    delivery_mode: 'Road',
    party_name: '',
    po_no: '',
    process_type: 'Weaving',
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

  // Left side Grid Table: Cloth Delivery Items
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
      setDeliveries(data);
    } catch (err) {
      console.error("Error fetching cloth deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const { data } = await dropdownAPI.getAll();
      setOptions(data);
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  // Automatically update calculated totals
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
        dc_no: delivery.dc_no || '',
        dc_date: delivery.dc_date || '',
        delivery_type: delivery.delivery_type || 'Job Work',
        delivery_mode: delivery.delivery_mode || 'Road',
        party_name: delivery.party_name || '',
        po_no: delivery.po_no || '',
        process_type: delivery.process_type || 'Weaving',
        design_no: delivery.design_no || '',
        ibpo: delivery.ibpo || '',
        fabric_detail: delivery.fabric_detail || '',
        pc_type: delivery.pc_type || 'Grey',
        ibpo_order_mtr: Number(delivery.ibpo_order_mtr) || 0,
        delivery_mtr: Number(delivery.delivery_mtr) || 0,
        balance: Number(delivery.balance) || 0,
        fresh_width: Number(delivery.fresh_width) || 0,
        finish_fold: delivery.finish_fold || 'Standard',
        process_comm: delivery.process_comm || '',
        bpo_no: delivery.bpo_no || '',
        design_no_bottom: delivery.design_no_bottom || '',
        buyer_name: delivery.buyer_name || '',
        lot_no: delivery.lot_no || '',
        griege_rate: Number(delivery.griege_rate) || 0,
        return_type: delivery.return_type || 'None',
        oba: delivery.oba || '',
        finish_pick: Number(delivery.finish_pick) || 0,
        glm: Number(delivery.glm) || 0,

        // Voucher Entry
        voucher_no: delivery.voucher_no || '',
        voucher_date: delivery.voucher_date || '',
        rate_mtr: Number(delivery.rate_mtr) || 0,
        debited_amount: Number(delivery.debited_amount) || 0,
        detailed_remarks: delivery.detailed_remarks || '',

        // Gate Pass
        transport_name: delivery.transport_name || '',
        vehicle_no: delivery.vehicle_no || '',
        driver_name: delivery.driver_name || '',
        mobile_no: delivery.mobile_no || '',

        status: delivery.status || 'Delivered',
        total_pieces: delivery.total_pieces || 0,
        total_meters: Number(delivery.total_meters) || 0,
        gross_amount: Number(delivery.gross_amount) || 0,
        sgst: Number(delivery.sgst) || 0,
        igst: Number(delivery.igst) || 0,
        net_amount: Number(delivery.net_amount) || 0
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
      setFormData(initialForm);
      setEditingId(null);
      setItems([{ piece_no: '', lot_no: '', ok_mtr: 0, fold_mtr: 0, design_no: '', color: '', rate: 0, amount: 0 }]);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, dcNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Cloth Delivery Challan ${dcNo}?`)) {
      try {
        await clothDeliveryAPI.delete(id);
        if (selectedViewDelivery?.id === id) setSelectedViewDelivery(null);
        fetchDeliveries();
      } catch (err) {
        console.error(err);
        alert("Error deleting cloth delivery challan.");
      }
    }
  };

  const handleInputChange = (e) => {
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

    const { name, value } = e.target;
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
      alert(err.response?.data?.detail || "Error saving Cloth Delivery challan");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Cloth Delivery Challans Report", 14, 15);
    const tableColumn = ["DC No", "DC Date", "Party Name", "Delivery Type", "Meters", "Status"];
    const tableRows = [];

    filteredDeliveries.forEach(del => {
      const rowData = [
        del.dc_no || '-',
        del.dc_date || '-',
        del.party_name || '-',
        del.delivery_type || '-',
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
    doc.save(`Cloth_Deliveries_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDeliveries.map(del => ({
      "DC No": del.dc_no,
      "DC Date": del.dc_date,
      "Party Name": del.party_name,
      "Delivery Type": del.delivery_type,
      "Process Type": del.process_type,
      "Design No": del.design_no,
      "Total Meters": del.total_meters,
      "Total Pieces": del.total_pieces,
      "Voucher No": del.voucher_no,
      "Vehicle No": del.vehicle_no,
      "Status": del.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cloth Deliveries");
    XLSX.writeFile(workbook, `Cloth_Deliveries_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredDeliveries = deliveries.filter(del => {
    const matchesSearch = searchTerm === '' ||
      del.dc_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.design_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || del.delivery_type === typeFilter;

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
    return matchesSearch && matchesType && matchesDate;
  });

  const totalDels = deliveries.length;
  const jobWorkDels = deliveries.filter(d => d.delivery_type === 'Job Work').length;
  const returnDels = deliveries.filter(d => d.delivery_type === 'Return').length;
  const totalDeliveredMtrs = deliveries.reduce((sum, d) => sum + (Number(d.total_meters) || 0), 0);

  const handleCardClick = (typeVal) => {
    if (typeVal === 'Total') {
      setTypeFilter('All Types');
    } else {
      setTypeFilter(typeVal);
    }
  };

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Cloth Delivery Details' : editingId ? 'Edit Cloth Delivery Challan' : 'Add New Cloth Delivery Entry'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button type="submit" form="clothDeliveryForm" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Challan' : 'Save Challan'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: 'General Info' }, { id: 'specs', label: 'Fabrication Specs' }, { id: 'items', label: 'Pieces Grid' }, { id: 'logistics', label: 'Vouchers & Logistics' }].map(tab => (
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
            <form id="clothDeliveryForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                {activeTab === 'general' && (
                  <div className="animate-fade">
                    {/* Section 1: Delivery & Party Information */}
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Delivery & Party Information</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
                      <div className="form-group">
                        <label>DC No *</label>
                        <input className="form-control" name="dc_no" value={formData.dc_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>DC Date *</label>
                        <input type="date" className="form-control" name="dc_date" value={formData.dc_date} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Delivery Type</label>
                        <select className="form-control" name="delivery_type" value={formData.delivery_type} onChange={handleInputChange}>
                          <option value="Job Work">Job Work</option>
                          <option value="Return">Return</option>
                          <option value="Processing">Processing</option>
                          <option value="Sales">Sales Dispatch</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery Mode</label>
                        <select className="form-control" name="delivery_mode" value={formData.delivery_mode} onChange={handleInputChange}>
                          <option value="Road">Road</option>
                          <option value="Rail">Rail</option>
                          <option value="Courier">Courier</option>
                          <option value="Air">Air</option>
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
                        <input className="form-control" name="po_no" value={formData.po_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Buyer Name</label>
                        <select className="form-control" name="buyer_name" value={formData.buyer_name} onChange={handleInputChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'specs', 'process_type')}>
                          <option value="">-- Same as Party --</option>
                          {options.all_parties.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Section 2: Fabrication & Technical Specification */}
                    <h4 style={{ color: 'var(--primary)', margin: "32px 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabrication & Technical Specification</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
                      <div className="form-group">
                        <label>Process Type</label>
                        <select className="form-control" name="process_type" value={formData.process_type} onChange={handleInputChange}>
                          <option value="Weaving">Weaving</option>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Finishing">Finishing</option>
                          <option value="Printing">Printing</option>
                        </select>
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
                          <option value="Finished">Finished Fabric</option>
                          <option value="Dyed">Dyed Fabric</option>
                          <option value="Sample">Sample Piece</option>
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
                      <div className="form-group">
                        <label>Balance Mtr</label>
                        <input type="number" className="form-control" value={formData.balance} readOnly style={{ background: '#f1f5f9' }} />
                      </div>
                      <div className="form-group">
                        <label>Fresh Finish Width</label>
                        <input type="number" className="form-control" name="fresh_width" value={formData.fresh_width} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Finish Fold Details</label>
                        <select className="form-control" name="finish_fold" value={formData.finish_fold} onChange={handleInputChange}>
                          <option value="Standard">Standard Roll</option>
                          <option value="Book Fold">Book Fold</option>
                          <option value="Lapping">Lapping</option>
                          <option value="Bale Fold">Bale Fold</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>LOT No</label>
                        <input className="form-control" name="lot_no" value={formData.lot_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Griege Rate</label>
                        <input type="number" className="form-control" name="griege_rate" value={formData.griege_rate} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Return Type</label>
                        <select className="form-control" name="return_type" value={formData.return_type} onChange={handleInputChange}>
                          <option value="None">None</option>
                          <option value="Defect Return">Defect Return</option>
                          <option value="Excess Grey Return">Excess Grey Return</option>
                          <option value="Rejected Return">Rejected Return</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Optical Brightening Agent (OBA)</label>
                        <input className="form-control" name="oba" value={formData.oba} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Finish Pick</label>
                        <input type="number" className="form-control" name="finish_pick" value={formData.finish_pick} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GLM</label>
                        <input type="number" className="form-control" name="glm" value={formData.glm} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 4' }}>
                        <label>Process Comments</label>
                        <input className="form-control" name="process_comm" value={formData.process_comm} onChange={handleInputChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'piece_no')} />
                      </div>
                    </div>

                    {/* Section 3: Piece-wise Dispatch Entry Grid */}
                    <h4 style={{ color: 'var(--primary)', margin: "32px 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Piece-wise Dispatch Entry Grid</h4>
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
                                <input
                                  className="form-control"
                                  value={item.piece_no}
                                  onChange={e => handleItemChange(index, 'piece_no', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  value={item.lot_no}
                                  onChange={e => handleItemChange(index, 'lot_no', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={item.ok_mtr}
                                  onChange={e => handleItemChange(index, 'ok_mtr', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={item.fold_mtr}
                                  onChange={e => handleItemChange(index, 'fold_mtr', e.target.value)}
                                />
                              </td>
                              {!isReadOnly && (
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => removeItemRow(index)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addItemRow}
                        className="btn btn-secondary"
                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginBottom: 32 }}
                      >
                        + Add Piece
                      </button>
                    )}

                    {/* Section 4: Voucher Entry (Accounting Reference) */}
                    <h4 style={{ color: 'var(--primary)', margin: "32px 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Voucher Entry (Accounting Reference)</h4>
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
                      <div className="form-group" style={{ gridColumn: 'span 4' }}>
                        <label>Detailed Remarks</label>
                        <input className="form-control" name="detailed_remarks" value={formData.detailed_remarks} onChange={handleInputChange} />
                      </div>
                    </div>

                    {/* Section 5: Gate Pass & Logistics */}
                    <h4 style={{ color: 'var(--primary)', margin: "32px 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Gate Pass & Logistics</h4>
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
                      <div className="form-group">
                        <label>Driver Name</label>
                        <input className="form-control" name="driver_name" value={formData.driver_name} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Driver Mobile No</label>
                        <input className="form-control" name="mobile_no" value={formData.mobile_no} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="animate-fade">
                    {/* Section 2: Fabrication & Technical Specification */}
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Fabrication & Technical Specification</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Process Type</label>
                        <select className="form-control" name="process_type" value={formData.process_type} onChange={handleInputChange}>
                          <option value="Weaving">Weaving</option>
                          <option value="Dyeing">Dyeing</option>
                          <option value="Sizing">Sizing</option>
                          <option value="Finishing">Finishing</option>
                          <option value="Printing">Printing</option>
                        </select>
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
                          <option value="Finished">Finished Fabric</option>
                          <option value="Dyed">Dyed Fabric</option>
                          <option value="Sample">Sample Piece</option>
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
                      <div className="form-group">
                        <label>Balance Mtr</label>
                        <input type="number" className="form-control" value={formData.balance} readOnly style={{ background: '#f1f5f9' }} />
                      </div>
                      <div className="form-group">
                        <label>Fresh Finish Width</label>
                        <input type="number" className="form-control" name="fresh_width" value={formData.fresh_width} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Finish Fold Details</label>
                        <select className="form-control" name="finish_fold" value={formData.finish_fold} onChange={handleInputChange}>
                          <option value="Standard">Standard Roll</option>
                          <option value="Book Fold">Book Fold</option>
                          <option value="Lapping">Lapping</option>
                          <option value="Bale Fold">Bale Fold</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>LOT No</label>
                        <input className="form-control" name="lot_no" value={formData.lot_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Griege Rate</label>
                        <input type="number" className="form-control" name="griege_rate" value={formData.griege_rate} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Return Type</label>
                        <select className="form-control" name="return_type" value={formData.return_type} onChange={handleInputChange}>
                          <option value="None">None</option>
                          <option value="Defect Return">Defect Return</option>
                          <option value="Excess Grey Return">Excess Grey Return</option>
                          <option value="Rejected Return">Rejected Return</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Optical Brightening Agent (OBA)</label>
                        <input className="form-control" name="oba" value={formData.oba} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Finish Pick</label>
                        <input type="number" className="form-control" name="finish_pick" value={formData.finish_pick} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>GLM</label>
                        <input type="number" className="form-control" name="glm" value={formData.glm} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 4' }}>
                        <label>Process Comments</label>
                        <input className="form-control" name="process_comm" value={formData.process_comm} onChange={handleInputChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'piece_no')} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'items' && (
                  <div className="animate-fade">
                    {/* Section 3: Piece-wise Dispatch Entry Grid */}
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Piece-wise Dispatch Entry Grid</h4>
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
                                <input
                                  className="form-control"
                                  value={item.piece_no}
                                  onChange={e => handleItemChange(index, 'piece_no', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  className="form-control"
                                  value={item.lot_no}
                                  onChange={e => handleItemChange(index, 'lot_no', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={item.ok_mtr}
                                  onChange={e => handleItemChange(index, 'ok_mtr', e.target.value)}
                                  required
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={item.fold_mtr}
                                  onChange={e => handleItemChange(index, 'fold_mtr', e.target.value)}
                                />
                              </td>
                              {!isReadOnly && (
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => removeItemRow(index)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  >
                                    <X size={16} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addItemRow}
                        className="btn btn-secondary"
                        style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}
                      >
                        + Add Piece
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'logistics' && (
                  <div className="animate-fade">
                    {/* Section 4: Voucher Entry (Accounting Reference) */}
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Voucher Entry (Accounting Reference)</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
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
                      <div className="form-group" style={{ gridColumn: 'span 4' }}>
                        <label>Detailed Remarks</label>
                        <input className="form-control" name="detailed_remarks" value={formData.detailed_remarks} onChange={handleInputChange} />
                      </div>
                    </div>

                    <br/>
                    {/* Section 5: Gate Pass & Logistics */}
                    <h4 style={{ color: 'var(--primary)', margin: "0 0 16px 0", borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Gate Pass & Logistics</h4>
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
                      <div className="form-group">
                        <label>Driver Name</label>
                        <input className="form-control" name="driver_name" value={formData.driver_name} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Driver Mobile No</label>
                        <input className="form-control" name="mobile_no" value={formData.mobile_no} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST / SPLIT VIEW ---
  return (
    <div className="animate-fade">
      
      {/* Upper header action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={24} color="var(--primary)" /> Cloth Delivery Entry
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage delivery challans, piece grids, accounting vouchers, and gate pass details.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          {/* Export Menu */}
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
                  <FileSpreadsheet size={16} color="#10b981" /> Excel Sheet
                </button>
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add New Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div
          className="card stat-card"
          onClick={() => handleCardClick('Total')}
          style={{ cursor: 'pointer', border: typeFilter === 'All Types' ? '2px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Challans</h3>
            <div className="value">{totalDels}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Job Work')}
          style={{ cursor: 'pointer', border: typeFilter === 'Job Work' ? '2px solid #10b981' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Job Work Deliveries</h3>
            <div className="value">{jobWorkDels}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Return')}
          style={{ cursor: 'pointer', border: typeFilter === 'Return' ? '2px solid #f59e0b' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Returns / Rejections</h3>
            <div className="value">{returnDels}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ border: '1px solid transparent' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Delivered (Mtr)</h3>
            <div className="value">{totalDeliveredMtrs.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Filter Action Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        
        {/* Left Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by DC No, Party or Design..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 160, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All Types">All Delivery Types</option>
            <option value="Job Work">Job Work</option>
            <option value="Return">Return</option>
            <option value="Processing">Processing</option>
            <option value="Sales">Sales Dispatch</option>
          </select>

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

      {/* Main Split View Section */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Table Section */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>DC No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Design & Lot</th>
                  <th>Meters</th>
                  <th>Pieces</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading deliveries...</td></tr>
                ) : filteredDeliveries.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No deliveries found matching search criteria.</td></tr>
                ) : (
                  filteredDeliveries.map(del => (
                    <tr
                      key={del.id}
                      onClick={() => setSelectedViewDelivery(del)}
                      style={{
                        cursor: 'pointer',
                        background: selectedViewDelivery?.id === del.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{del.dc_no}</td>
                      <td>{del.dc_date}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{del.party_name}</td>
                      <td>
                        <span className="badge badge-active" style={{ marginBottom: 4 }}>{del.design_no || 'N/A'}</span><br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lot: {del.lot_no || 'N/A'}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{Number(del.total_meters).toFixed(2)}</td>
                      <td>{del.total_pieces} pcs</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(del, true)}
                            title="Full Form View"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(del, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(del.id, del.dc_no, e)}
                            title="Delete"
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Split View Sidebar Details Pane */}
        {selectedViewDelivery && (
          <div style={{ flex: '0 0 360px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                  <Truck size={18} /> Challan {selectedViewDelivery.dc_no}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewDelivery, false)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => setSelectedViewDelivery(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                <DetailRow label="DC Date" value={selectedViewDelivery.dc_date} />
                <DetailRow label="Party Name" value={selectedViewDelivery.party_name} />
                <DetailRow label="Buyer Name" value={selectedViewDelivery.buyer_name} />
                <DetailRow label="Delivery Type" value={<span className="badge badge-active">{selectedViewDelivery.delivery_type}</span>} />
                <DetailRow label="PO Ref No" value={selectedViewDelivery.po_no} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quality Specs</h4>
                <DetailRow label="Process Type" value={selectedViewDelivery.process_type} />
                <DetailRow label="Design No" value={selectedViewDelivery.design_no} />
                <DetailRow label="IBPO No" value={selectedViewDelivery.ibpo} />
                <DetailRow label="PC Type" value={selectedViewDelivery.pc_type} />
                <DetailRow label="Fabric Details" value={selectedViewDelivery.fabric_detail} />
                <DetailRow label="Finish Fold" value={selectedViewDelivery.finish_fold} />
                <DetailRow label="OBA Agent" value={selectedViewDelivery.oba} />
                <DetailRow label="Finish Pick" value={selectedViewDelivery.finish_pick} />
                <DetailRow label="GLM Metric" value={selectedViewDelivery.glm} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantities</h4>
                <DetailRow label="IBPO Order Mtr" value={selectedViewDelivery.ibpo_order_mtr} />
                <DetailRow label="Delivered Mtr" value={selectedViewDelivery.delivery_mtr} />
                <DetailRow label="Balance Remaining" value={selectedViewDelivery.balance} />
                <DetailRow label="Total Pieces" value={`${selectedViewDelivery.total_pieces} Pcs`} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Voucher & Value</h4>
                <DetailRow label="Voucher No" value={selectedViewDelivery.voucher_no} />
                <DetailRow label="Voucher Date" value={selectedViewDelivery.voucher_date} />
                <DetailRow label="Rate per Meter" value={`Rs. ${selectedViewDelivery.rate_mtr}`} />
                <DetailRow label="Debited Amount" value={`Rs. ${Number(selectedViewDelivery.debited_amount).toFixed(2)}`} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logistics Pass</h4>
                <DetailRow label="Transport Name" value={selectedViewDelivery.transport_name} />
                <DetailRow label="Vehicle No" value={selectedViewDelivery.vehicle_no} />
                <DetailRow label="Driver Name" value={selectedViewDelivery.driver_name} />
                <DetailRow label="Driver Mobile" value={selectedViewDelivery.mobile_no} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
