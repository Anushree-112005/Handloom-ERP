import { useState, useEffect } from 'react';
import { Box, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, FileSpreadsheet, ClipboardList, CheckCircle, RefreshCw } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { finishedFabricAPI, dropdownAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value, highlight = false }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    borderBottom: '1px dashed var(--border)', 
    paddingBottom: 4,
    background: highlight ? '#22c55e1a' : 'transparent',
    padding: highlight ? '4px 8px' : '0 0 4px 0',
    borderRadius: highlight ? 4 : 0
  }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: highlight ? '#22c55e' : 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function DyedFabricReceipt() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [inwards, setInwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedViewInward, setSelectedViewInward] = useState(null);
  const [viewModalReceipt, setViewModalReceipt] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
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

  const initialForm = {
    received_type: 'Job Inward',
    ref_no: '',
    inv_date: new Date().toISOString().split('T')[0],
    party_name: '',
    dc_no: '',
    dc_date: new Date().toISOString().split('T')[0],
    design_no: '',
    order_no: '',
    vendor_order: '',
    gry_dc_no: '',
    vendor_order_mtr: '',
    gry_delivery_mtr: '',
    received_mtr: '',
    balance_mtr: '',

    fabric_type: '',
    reed: '',
    pick: '',
    width: '',
    order_mtr: '',
    warp_mtr: '',
    inward_mtr: '',
    shed_no: '',
    detail_balance_mtr: '',
    lot_no: '',
    atti_no: '',
    total_pieces: 0,
    total_meters: 0,
    inspection_type: '',
    inw_pin: '100',
    remarks: '',
    status: 'Received'
  };

  const [formData, setFormData] = useState(initialForm);
  const [items, setItems] = useState([{ piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }]);

  useEffect(() => {
    fetchInwards();
    fetchOptions();
  }, []);

  const fetchInwards = async () => {
    try {
      setLoading(true);
      const { data } = await finishedFabricAPI.list();
      // Filter inwards for Dyeing / Dyed process types
      const filtered = data.filter(inw => {
        if (inw.process_type === 'Dyeing' || inw.process_type === 'Dyed') {
          return true;
        }
        try {
          if (inw.remarks) {
            const parsed = JSON.parse(inw.remarks);
            return parsed.receipt_process === 'Dyeing';
          }
        } catch (e) {
          // Skip
        }
        return false;
      });
      setInwards(filtered);
    } catch (err) {
      console.error("Error fetching dyed fabric receipts:", err);
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

  // Automatically update totals
  useEffect(() => {
    const totalPcs = items.length;
    const totalMtr = items.reduce((sum, item) => sum + (Number(item.meters) || 0), 0);
    const gryDel = Number(formData.gry_delivery_mtr) || 0;
    const recMtr = totalMtr || Number(formData.received_mtr) || 0;
    const computedBal = (gryDel - recMtr).toFixed(2);
    const ordMtr = Number(formData.order_mtr) || 0;
    const computedDetBal = (ordMtr - recMtr).toFixed(2);

    setFormData(prev => ({
      ...prev,
      total_pieces: totalPcs,
      total_meters: totalMtr,
      received_mtr: recMtr.toFixed(2),
      balance_mtr: computedBal,
      inward_mtr: recMtr.toFixed(2),
      detail_balance_mtr: computedDetBal
    }));
  }, [items, formData.gry_delivery_mtr, formData.received_mtr, formData.order_mtr]);

  const handleOpenForm = (inward = null, readOnly = false) => {
    if (inward) {
      setEditingId(inward.id);
      let remarksParsed = {};
      try {
        if (inward.remarks) remarksParsed = JSON.parse(inward.remarks);
      } catch (e) {
        console.error(e);
      }

      setFormData({
        received_type: inward.received_type || 'Job Inward',
        ref_no: inward.ref_no || '',
        inv_date: inward.inv_date || '',
        party_name: inward.party_name || '',
        dc_no: inward.dc_no || '',
        dc_date: inward.dc_date || '',
        design_no: inward.design_no || '',
        order_no: inward.order_no || '',
        vendor_order: remarksParsed.vendor_order || '',
        gry_dc_no: remarksParsed.gry_dc_no || '',
        vendor_order_mtr: remarksParsed.vendor_order_mtr || '',
        gry_delivery_mtr: remarksParsed.gry_delivery_mtr || '',
        received_mtr: remarksParsed.received_mtr || '',
        balance_mtr: remarksParsed.balance_mtr || '',
        fabric_type: remarksParsed.fabric_type || '',
        reed: remarksParsed.reed || '',
        pick: remarksParsed.pick || '',
        width: remarksParsed.width || '',
        order_mtr: remarksParsed.order_mtr || '',
        warp_mtr: remarksParsed.warp_mtr || '',
        inward_mtr: remarksParsed.inward_mtr || '',
        shed_no: remarksParsed.shed_no || '',
        detail_balance_mtr: remarksParsed.detail_balance_mtr || '',
        lot_no: remarksParsed.lot_no || '',
        atti_no: remarksParsed.atti_no || '',
        total_pieces: inward.total_pieces || 0,
        total_meters: Number(inward.total_meters) || 0,
        inspection_type: remarksParsed.inspection_type || '',
        inw_pin: remarksParsed.inw_pin || '100',
        remarks: remarksParsed.remarks_text || '',
        status: inward.status || 'Received'
      });

      if (inward.items && inward.items.length > 0) {
        setItems(inward.items.map(item => ({
          piece_no: item.piece_no || '',
          weight: item.weight || '',
          v_loom: item.v_loom || '',
          v_pc_no: item.v_pc_no || '',
          meters: item.meters || ''
        })));
      } else {
        setItems([{ piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }]);
      }
    } else {
      setFormData(initialForm);
      setEditingId(null);
      setItems([{ piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }]);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, refNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Dyed Fabric Receipt Entry ${refNo}?`)) {
      try {
        await finishedFabricAPI.delete(id);
        if (selectedViewInward?.id === id) setSelectedViewInward(null);
        fetchInwards();
      } catch (err) {
        console.error(err);
        alert("Error deleting receipt entry.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { piece_no: '', weight: '', v_loom: '', v_pc_no: '', meters: '' }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formData.ref_no) {
      alert("Please enter Fabric Receipt ID");
      return;
    }

    const extra = {
      receipt_process: 'Dyeing', // Identifies this as a Dyed Fabric receipt
      vendor_order: formData.vendor_order,
      gry_dc_no: formData.gry_dc_no,
      vendor_order_mtr: formData.vendor_order_mtr,
      gry_delivery_mtr: formData.gry_delivery_mtr,
      received_mtr: formData.received_mtr,
      balance_mtr: formData.balance_mtr,
      fabric_type: formData.fabric_type,
      reed: formData.reed,
      pick: formData.pick,
      width: formData.width,
      order_mtr: formData.order_mtr,
      warp_mtr: formData.warp_mtr,
      inward_mtr: formData.inward_mtr,
      shed_no: formData.shed_no,
      detail_balance_mtr: formData.detail_balance_mtr,
      lot_no: formData.lot_no,
      atti_no: formData.atti_no,
      inspection_type: formData.inspection_type,
      inw_pin: formData.inw_pin,
      remarks_text: formData.remarks
    };

    const payload = {
      ref_no: formData.ref_no,
      inv_no: formData.dc_no,
      inv_date: formData.inv_date,
      received_type: formData.received_type,
      party_name: formData.party_name || null,
      design_no: formData.design_no || null,
      order_no: formData.order_no || null,
      dc_no: formData.dc_no || null,
      dc_date: formData.dc_date,
      process_type: 'Dyeing',
      total_meters: Number(formData.total_meters) || 0,
      total_pieces: Number(formData.total_pieces) || 0,
      remarks: JSON.stringify(extra),
      status: formData.status || 'Received',
      items: items.map(item => ({
        design_no: formData.design_no || null,
        lot_no: formData.lot_no || null,
        meters: Number(item.meters) || 0,
        pieces: 1,
        width: Number(formData.width) || 0,
        weight: Number(item.weight) || 0,
        grade: 'A',
        v_loom: item.v_loom || null,
        v_pc_no: item.v_pc_no || null,
        piece_no: item.piece_no || null
      }))
    };

    try {
      if (editingId) {
        await finishedFabricAPI.update(editingId, payload);
      } else {
        await finishedFabricAPI.create(payload);
      }
      setView('list');
      fetchInwards();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving Dyed Fabric Receipt");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Dyed Fabric Receipts Report", 14, 15);
    const tableColumn = ["Receipt ID", "Date", "Party Name", "Design No", "Total Mtr", "Status"];
    const tableRows = inwards.map(inw => [
      inw.ref_no || '-',
      inw.inv_date || '-',
      inw.party_name || '-',
      inw.design_no || '-',
      Number(inw.total_meters).toFixed(2),
      inw.status || '-'
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Dyed_Fabric_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = inwards.map(inw => ({
      "Receipt ID": inw.ref_no,
      "Date": inw.inv_date,
      "Party Name": inw.party_name,
      "Design No": inw.design_no,
      "Total Pieces": inw.total_pieces,
      "Total Meters": inw.total_meters,
      "Status": inw.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dyed Fabric Receipts");
    XLSX.writeFile(workbook, `Dyed_Fabric_Receipts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredInwards = inwards.filter(inw => {
    const matchesSearch = searchTerm === '' ||
      inw.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inw.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inw.design_no?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Dyed Fabric Receipt' : editingId ? 'Edit Dyed Fabric Receipt' : 'Add Dyed Fabric Receipt'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              {!isReadOnly && <button type="submit" form="dyedReceiptForm" className="btn btn-primary"><Save size={16} /> Save Receipt</button>}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'general', label: 'Receipt Reference Info' }, { id: 'specs', label: 'Fabric Specs' }, { id: 'items', label: 'Pieces Grid' }].map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{ padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, cursor: 'pointer' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="dyedReceiptForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0 }}>
                {activeTab === 'general' && (
                  <div className="animate-fade">
                    <h4 style={{ color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Receipt Reference</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Receipt ID *</label>
                        <input className="form-control" name="ref_no" value={formData.ref_no} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Receipt Date *</label>
                        <input type="date" className="form-control" name="inv_date" value={formData.inv_date} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label>Dyeing Vendor</label>
                        <select className="form-control" name="party_name" value={formData.party_name} onChange={handleInputChange} required>
                          <option value="">-- Select Vendor --</option>
                          {options.all_parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Dyehouse DC No</label>
                        <input className="form-control" name="dc_no" value={formData.dc_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>DC Date</label>
                        <input type="date" className="form-control" name="dc_date" value={formData.dc_date} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Design No</label>
                        <input className="form-control" name="design_no" value={formData.design_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>IBPO No</label>
                        <input className="form-control" name="order_no" value={formData.order_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Gry DC No</label>
                        <input className="form-control" name="gry_dc_no" value={formData.gry_dc_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Gry Delivery Mtr</label>
                        <input className="form-control" type="number" name="gry_delivery_mtr" value={formData.gry_delivery_mtr} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Received Mtr</label>
                        <input className="form-control" type="number" name="received_mtr" value={formData.received_mtr} readOnly style={{ background: '#f1f5f9' }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="animate-fade">
                    <h4 style={{ color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fabric Specifications</h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>Const / Fabric Type</label>
                        <input className="form-control" name="fabric_type" value={formData.fabric_type} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Width</label>
                        <input className="form-control" name="width" value={formData.width} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Lot No</label>
                        <input className="form-control" name="lot_no" value={formData.lot_no} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Atti No</label>
                        <input className="form-control" name="atti_no" value={formData.atti_no} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'items' && (
                  <div className="animate-fade">
                    <h4 style={{ color: 'var(--primary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Dyed Pieces Grid</h4>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Pcno *</th>
                          <th>Weight (Kg)</th>
                          <th>VLoom</th>
                          <th>Mtr *</th>
                          {!isReadOnly && <th style={{ width: 50 }}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td><input className="form-control" value={item.piece_no} onChange={e => handleItemChange(index, 'piece_no', e.target.value)} required /></td>
                            <td><input className="form-control" type="number" value={item.weight} onChange={e => handleItemChange(index, 'weight', e.target.value)} /></td>
                            <td><input className="form-control" value={item.v_loom} onChange={e => handleItemChange(index, 'v_loom', e.target.value)} /></td>
                            <td><input className="form-control" type="number" value={item.meters} onChange={e => handleItemChange(index, 'meters', e.target.value)} required /></td>
                            {!isReadOnly && <td><button type="button" onClick={() => removeItemRow(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!isReadOnly && <button type="button" onClick={addItemRow} className="btn btn-secondary" style={{ background: 'var(--primary)', color: '#fff', marginTop: 12 }}>+ Add Piece</button>}
                  </div>
                )}
              </fieldset>
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
            <ClipboardList size={24} color="var(--primary)" /> Dyed Fabric Receipt
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Log receipt of dyed fabric rolls from external Dyehouses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}><Plus size={18} /> Add Dyed Receipt</button>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by Receipt ID, Vendor or Design..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: 38, width: '100%', margin: 0 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Date</th>
              <th>Processor Name</th>
              <th>Design No</th>
              <th style={{ textAlign: 'right' }}>Total Pieces</th>
              <th style={{ textAlign: 'right' }}>Total Meters</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInwards.map(inw => (
              <tr key={inw.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedViewInward(inw)}>
                <td style={{ fontWeight: 700 }}>{inw.ref_no}</td>
                <td>{inw.inv_date}</td>
                <td style={{ fontWeight: 600 }}>{inw.party_name}</td>
                <td>{inw.design_no}</td>
                <td style={{ textAlign: 'right' }}>{inw.total_pieces}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(inw.total_meters).toFixed(2)} Mtr</td>
                <td><span className="badge badge-active">{inw.status}</span></td>
                <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setViewModalReceipt(inw)}
                              title="Preview"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(inw)} title="Edit"><Edit2 size={12} /></button>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(inw.id, inw.ref_no)} title="Delete"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <A4DocumentPreview
        isOpen={!!viewModalReceipt}
        onClose={() => setViewModalReceipt(null)}
        title="DYED FABRIC RECEIPT"
        documentNumber={viewModalReceipt?.ref_no}
        status="RECEIVED"
        onDownloadPdf={() => alert('PDF Download for Dyed Fabric Receipt triggered')}
        sections={viewModalReceipt ? [
          {
            title: "RECEIPT INFO",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "Receipt ID", value: viewModalReceipt.ref_no },
              { label: "Date", value: viewModalReceipt.inv_date },
              { label: "Vendor", value: viewModalReceipt.party_name },
              { label: "DC Number", value: viewModalReceipt.dc_no || '-' },
              { label: "Order Number", value: viewModalReceipt.order_no || '-' }
            ]
          },
          {
            title: "FABRIC SPECIFICATIONS",
            icon: "Layers",
            type: "grid",
            data: [
              { label: "Design No", value: viewModalReceipt.design_no || '-' },
              { label: "Total Pieces", value: viewModalReceipt.total_pieces || 0 },
              { label: "Total Meters", value: `${Number(viewModalReceipt.total_meters || 0).toFixed(2)} Mtr` }
            ]
          },
          {
            title: "FABRIC PIECES",
            icon: "Columns",
            type: "table",
            headers: ["Piece No", "VLoom", "Weight (Kg)", "Meters"],
            rows: (viewModalReceipt.items || []).map((b) => [
              b.piece_no || '-',
              b.v_loom || '-',
              b.weight || 0,
              b.meters || 0
            ])
          }
        ] : []}
      />

    </div>
  );
}
