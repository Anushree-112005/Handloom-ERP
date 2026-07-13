import { useState, useEffect } from 'react';
import { Box, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, Download, FileText, FileSpreadsheet, RefreshCw, CheckCircle } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { packingSlipAPI, dropdownAPI, partyAPI, subMasterAPI, buyerOrderAPI, workOrderTransactionAPI, designEntryAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function PackingSlip() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Split view state
  const [selectedViewSlip, setSelectedViewSlip] = useState(null);
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

  const [buyerOrders, setBuyerOrders] = useState([]);
  const [finalInspections, setFinalInspections] = useState([]);
  const [designs, setDesigns] = useState([]);

  // Initial Form State matching first image
  const initialForm = {
    slip_no: `PS-${Math.floor(100000 + Math.random() * 900000)}`, // Ref No
    slip_date: new Date().toISOString().split('T')[0], // Date
    pack_type: 'Regular',
    no_of_roll: '0',
    shed: '',
    pin: '100',
    bale_list: '',
    bale_no: '',
    design_no: '',
    warp_lot: '',
    weft_lot: '',
    ibpo: '',
    order_mtr_tole: '',
    recived_mtr: '',
    balance: '',
    stock_type: '',
    command: '',
    transport: '',
    pack_dimensions: '',

    // Footer columns
    total_pieces: 0,
    total_meters: 0,
    act_wgt: '',
    cal_wgt: '',
    packing_wgt: '',
    phy_wgt: '',
    gross_weight: '',
    net_weight: '',
    auto_weight: false,
    status: 'Packed',
    party_name: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // Left side Grid Table: Packing Slip Items (Despatch Detail)
  const [items, setItems] = useState([
    { piece_no: '', lot_no: '', loom_no: '', pass_mtr: '', bale_mtr: '', design_no: '', color: '', weight: '', grade: 'A' }
  ]);

  // Right side list: Bale list preview (derived from items / grouped by bale)
  const [baleSummaryList, setBaleSummaryList] = useState([]);

  // Custom dropdown states
  const [isCustomPackType, setIsCustomPackType] = useState(false);
  const [customPackTypeVal, setCustomPackTypeVal] = useState('');

  const [isCustomShed, setIsCustomShed] = useState(false);
  const [customShedVal, setCustomShedVal] = useState('');

  const [isCustomPin, setIsCustomPin] = useState(false);
  const [customPinVal, setCustomPinVal] = useState('');

  const [isCustomBaleList, setIsCustomBaleList] = useState(false);
  const [customBaleListVal, setCustomBaleListVal] = useState('');

  const [isCustomStockType, setIsCustomStockType] = useState(false);
  const [customStockTypeVal, setCustomStockTypeVal] = useState('');

  const [isCustomTransport, setIsCustomTransport] = useState(false);
  const [customTransportVal, setCustomTransportVal] = useState('');

  const [isCustomParty, setIsCustomParty] = useState(false);
  const [customPartyVal, setCustomPartyVal] = useState('');

  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [customStatusVal, setCustomStatusVal] = useState('');

  const handleSaveCustom = async (entity, valState, toggleState, fieldName) => {
    if (!valState.trim()) {
      toggleState(false);
      return;
    }
    try {
      if (entity === 'party_master') {
        await partyAPI.create({ party_type: "Sundry Debtors", company_name: valState.trim() });
      } else {
        await subMasterAPI.create(entity, { entity: entity, name: valState.trim(), is_active: true });
      }
      setFormData(prev => ({ ...prev, [fieldName]: valState.trim() }));
      toggleState(false);
      fetchOptions();
    } catch (err) {
      console.error("Error saving custom option:", err);
      alert("Failed to save custom option");
    }
  };


  useEffect(() => {
    fetchSlips();
    fetchOptions();
    fetchExtraData();
  }, []);

  const fetchExtraData = async () => {
    try {
      const boRes = await buyerOrderAPI.list();
      if (boRes.data) setBuyerOrders(boRes.data);
    } catch (err) {
      console.error("Error fetching buyer orders:", err);
    }

    try {
      const txnRes = await workOrderTransactionAPI.getAll();
      if (txnRes.data) {
        const inspections = txnRes.data
          .filter(t => t.module_type === 'final_inspection')
          .map(t => ({ ...t.details, id: t.transaction_no, db_id: t.id }));
        setFinalInspections(inspections);
      }
    } catch (err) {
      console.error("Error fetching final inspections:", err);
    }

    try {
      const deRes = await designEntryAPI.list();
      if (deRes.data) setDesigns(deRes.data);
    } catch (err) {
      console.error("Error fetching designs:", err);
    }
  };

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const { data } = await packingSlipAPI.list();
      setSlips(data);
    } catch (err) {
      console.error("Error fetching packing slips:", err);
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
    const validItems = items.filter(item => 
      (item.piece_no && String(item.piece_no).trim() !== '') || 
      (item.lot_no && String(item.lot_no).trim() !== '') || 
      (item.loom_no && String(item.loom_no).trim() !== '') || 
      (item.pass_mtr && String(item.pass_mtr).trim() !== '') || 
      (item.bale_mtr && String(item.bale_mtr).trim() !== '')
    );
    const totalPcs = validItems.length;
    const totalMtr = validItems.reduce((sum, item) => sum + (Number(item.bale_mtr) || Number(item.pass_mtr) || 0), 0);

    // Auto calculate weights if Auto Weight is checked
    let computedCalWgt = formData.cal_wgt;
    let computedGrossWgt = formData.gross_weight;
    let computedNetWgt = formData.net_weight;

    if (formData.auto_weight) {
      const computedItemsWgt = validItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
      computedCalWgt = computedItemsWgt || (totalMtr * 0.22).toFixed(2); // Mock multiplier if zero
      const packWgt = Number(formData.packing_wgt) || 0;
      computedGrossWgt = (Number(computedCalWgt) + packWgt).toFixed(2);
      computedNetWgt = Number(computedCalWgt).toFixed(2);
    }

    setFormData(prev => ({
      ...prev,
      total_pieces: totalPcs,
      total_meters: totalMtr,
      cal_wgt: computedCalWgt,
      gross_weight: computedGrossWgt,
      net_weight: computedNetWgt
    }));

    // Update the right side preview list
    // Let's create a row for each item showing: Bale No, SPNo (piece_no), Quality (color/design), Total Mtr
    const summary = validItems.map((item, idx) => ({
      bale_no: formData.bale_no || `B-${formData.slip_no || 'TEMP'}-${idx + 1}`,
      sp_no: item.piece_no || `P-${idx + 1}`,
      quality: item.color || formData.design_no || 'Cotton Plain',
      total_mtr: Number(item.bale_mtr) || Number(item.pass_mtr) || 0
    }));
    setBaleSummaryList(summary);

  }, [items, formData.auto_weight, formData.packing_wgt, formData.bale_no, formData.slip_no, formData.design_no]);

  const handleOpenForm = (slip = null, readOnly = false) => {
    if (slip) {
      setEditingId(slip.id);

      let remarksParsed = {};
      try {
        if (slip.remarks) {
          remarksParsed = JSON.parse(slip.remarks);
        }
      } catch (e) {
        console.error("Error parsing extra fields:", e);
      }

      setFormData({
        slip_no: slip.slip_no || '',
        slip_date: slip.slip_date || '',
        pack_type: remarksParsed.pack_type || 'Regular',
        no_of_roll: remarksParsed.no_of_roll || '0',
        shed: slip.godown || '',
        pin: remarksParsed.pin || '100',
        bale_list: remarksParsed.bale_list || '',
        bale_no: remarksParsed.bale_no || '',
        design_no: slip.design_no || '',
        warp_lot: remarksParsed.warp_lot || '',
        weft_lot: remarksParsed.weft_lot || '',
        ibpo: slip.ibpo || '',
        order_mtr_tole: remarksParsed.order_mtr_tole || '',
        recived_mtr: remarksParsed.recived_mtr || '',
        balance: remarksParsed.balance || '',
        stock_type: remarksParsed.stock_type || '',
        command: remarksParsed.command || '',
        transport: remarksParsed.transport || '',
        pack_dimensions: remarksParsed.pack_dimensions || '',

        total_pieces: slip.total_pieces || 0,
        total_meters: Number(slip.total_meters) || 0,
        act_wgt: remarksParsed.act_wgt || '',
        cal_wgt: remarksParsed.cal_wgt || '',
        packing_wgt: remarksParsed.packing_wgt || '',
        phy_wgt: remarksParsed.phy_wgt || '',
        gross_weight: slip.gross_weight || '',
        net_weight: slip.net_weight || '',
        auto_weight: remarksParsed.auto_weight || false,
        status: slip.status || 'Packed',
        party_name: slip.party_name || ''
      });

      if (slip.items && slip.items.length > 0) {
        setItems(slip.items.map(item => ({
          piece_no: item.piece_no || '',
          lot_no: item.lot_no || '',
          loom_no: item.loom_no || '',
          pass_mtr: item.pass_mtr || '',
          bale_mtr: item.meters || '',
          design_no: item.design_no || '',
          color: item.color || '',
          weight: item.weight || '',
          grade: item.grade || 'A'
        })));
      } else {
        setItems([{ piece_no: '', lot_no: '', loom_no: '', pass_mtr: '', bale_mtr: '', design_no: '', color: '', weight: '', grade: 'A' }]);
      }
    } else {
      setFormData(initialForm);
      setEditingId(null);
      setItems([{ piece_no: '', lot_no: '', loom_no: '', pass_mtr: '', bale_mtr: '', design_no: '', color: '', weight: '', grade: 'A' }]);
    }
    setIsReadOnly(readOnly);
    setView('form');
  };

  const handleDelete = async (id, slipNo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Packing Slip ${slipNo}?`)) {
      try {
        await packingSlipAPI.delete(id);
        if (selectedViewSlip?.id === id) setSelectedViewSlip(null);
        fetchSlips();
      } catch (err) {
        console.error(err);
        alert("Error deleting packing slip.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleIbpoChange = (e) => {
    const selectedIbpo = e.target.value;
    
    const order = buyerOrders.find(o => o.ibpo_number === selectedIbpo);
    const item = order?.items?.[0];
    const designNo = item?.design_no || order?.design_no || '';
    
    const inspection = finalInspections.find(i => i.buyerOrderNo === selectedIbpo || i.designNo === designNo);

    let updatedFields = {
      ibpo: selectedIbpo,
      slip_no: selectedIbpo ? `PS-${selectedIbpo}` : `PS-${Math.floor(100000 + Math.random() * 900000)}`,
      design_no: designNo,
      party_name: order ? order.party_name : '',
      warp_lot: order ? (order.warp_lot || '') : '',
      weft_lot: order ? (order.weft_lot || '') : '',
      order_mtr_tole: item ? `${item.order_mtrs || ''} (Tol: ${item.tolerance_pct || '0'}%)` : '',
      recived_mtr: inspection ? inspection.totalMetersInspected : '',
      balance: inspection ? inspection.rejectedQuantity : ''
    };

    if (inspection && inspection.rolls && inspection.rolls.length > 0) {
      const mappedItems = inspection.rolls.map(roll => ({
        piece_no: roll.pieceNo || '',
        lot_no: roll.lotNo || (order ? order.warp_lot || '' : ''),
        loom_no: roll.loomNo || '',
        pass_mtr: roll.meters || '',
        bale_mtr: roll.meters || '',
        design_no: designNo || roll.designNo || '',
        color: roll.colorCheck || 'OK',
        weight: roll.weight || '',
        grade: roll.grade || 'A'
      }));
      setItems(mappedItems);
    } else {
      setItems([{ piece_no: '', lot_no: '', loom_no: '', pass_mtr: '', bale_mtr: '', design_no: '', color: '', weight: '', grade: 'A' }]);
    }

    setFormData(prev => ({
      ...prev,
      ...updatedFields
    }));
  };

  const handleDesignChange = (e) => {
    const selectedDesignNo = e.target.value;
    
    const de = designs.find(d => d.design_no === selectedDesignNo);
    const selectedIbpo = de ? de.ibpo_no : '';
    
    let order = buyerOrders.find(o => o.ibpo_number === selectedIbpo);
    if (!order && selectedDesignNo) {
      order = buyerOrders.find(o => o.items?.some(item => item.design_no === selectedDesignNo) || o.design_no === selectedDesignNo);
    }
    
    const item = order?.items?.find(i => i.design_no === selectedDesignNo) || order?.items?.[0];
    
    const inspection = finalInspections.find(i => 
      (selectedIbpo && i.buyerOrderNo === selectedIbpo) || 
      i.designNo === selectedDesignNo
    );

    let updatedFields = {
      design_no: selectedDesignNo,
      ibpo: order ? order.ibpo_number : selectedIbpo,
      slip_no: (order?.ibpo_number || selectedIbpo) ? `PS-${order?.ibpo_number || selectedIbpo}` : `PS-${Math.floor(100000 + Math.random() * 900000)}`,
      party_name: order ? order.party_name : (de ? de.buyer_name : ''),
      warp_lot: order ? (order.warp_lot || '') : '',
      weft_lot: order ? (order.weft_lot || '') : '',
      order_mtr_tole: item ? `${item.order_mtrs || ''} (Tol: ${item.tolerance_pct || '0'}%)` : '',
      recived_mtr: inspection ? inspection.totalMetersInspected : '',
      balance: inspection ? inspection.rejectedQuantity : ''
    };

    if (inspection && inspection.rolls && inspection.rolls.length > 0) {
      const mappedItems = inspection.rolls.map(roll => ({
        piece_no: roll.pieceNo || '',
        lot_no: roll.lotNo || (order ? order.warp_lot || '' : ''),
        loom_no: roll.loomNo || '',
        pass_mtr: roll.meters || '',
        bale_mtr: roll.meters || '',
        design_no: selectedDesignNo || roll.designNo || '',
        color: roll.colorCheck || 'OK',
        weight: roll.weight || '',
        grade: roll.grade || 'A'
      }));
      setItems(mappedItems);
    } else {
      setItems([{ piece_no: '', lot_no: '', loom_no: '', pass_mtr: '', bale_mtr: '', design_no: '', color: '', weight: '', grade: 'A' }]);
    }

    setFormData(prev => ({
      ...prev,
      ...updatedFields
    }));
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setActiveTab(nextTab);
      document.getElementById(`${nextTab}-section`)?.scrollIntoView({ behavior: 'smooth' });
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

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { piece_no: '', lot_no: '', loom_no: '', pass_mtr: '', bale_mtr: '', design_no: '', color: '', weight: '', grade: 'A' }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formData.slip_no) {
      alert("Please enter Packing Slip No / Ref No");
      return;
    }

    const extra = {
      pack_type: formData.pack_type,
      no_of_roll: formData.no_of_roll,
      pin: formData.pin,
      bale_list: formData.bale_list,
      bale_no: formData.bale_no,
      warp_lot: formData.warp_lot,
      weft_lot: formData.weft_lot,
      order_mtr_tole: formData.order_mtr_tole,
      recived_mtr: formData.recived_mtr,
      balance: formData.balance,
      stock_type: formData.stock_type,
      command: formData.command,
      transport: formData.transport,
      pack_dimensions: formData.pack_dimensions,
      act_wgt: formData.act_wgt,
      cal_wgt: formData.cal_wgt,
      packing_wgt: formData.packing_wgt,
      phy_wgt: formData.phy_wgt,
      auto_weight: formData.auto_weight
    };

    const payload = {
      slip_no: formData.slip_no,
      slip_date: formData.slip_date,
      party_name: formData.party_name || null,
      design_no: formData.design_no || null,
      order_no: formData.ibpo || null,
      ibpo: formData.ibpo || null,
      godown: formData.shed || null,
      total_meters: Number(formData.total_meters) || 0,
      total_pieces: Number(formData.total_pieces) || 0,
      total_bales: 1, // Main slip represents 1 bale usually
      gross_weight: Number(formData.gross_weight) || 0,
      net_weight: Number(formData.net_weight) || 0,
      remarks: JSON.stringify(extra),
      status: formData.status || 'Packed',

      items: items.map((item, idx) => ({
        bale_no: formData.bale_no || `B-${formData.slip_no}-${idx + 1}`,
        piece_no: item.piece_no || null,
        design_no: item.design_no || formData.design_no || null,
        color: item.color || null,
        meters: Number(item.bale_mtr) || Number(item.pass_mtr) || 0,
        weight: Number(item.weight) || 0,
        grade: item.grade || 'A',
        lot_no: item.lot_no || null,
        loom_no: item.loom_no || null,
        pass_mtr: Number(item.pass_mtr) || 0
      }))
    };

    try {
      if (editingId) {
        await packingSlipAPI.update(editingId, payload);
      } else {
        await packingSlipAPI.create(payload);
      }
      setView('list');
      fetchSlips();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving Packing Slip");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Packing Slips Report", 14, 15);
    const tableColumn = ["Packing No", "Date", "Party Name", "Design No", "Total Meters", "Status"];
    const tableRows = [];

    filteredSlips.forEach(slip => {
      const rowData = [
        slip.slip_no || '-',
        slip.slip_date || '-',
        slip.party_name || '-',
        slip.design_no || '-',
        Number(slip.total_meters).toFixed(2),
        slip.status || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Packing_Slips_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredSlips.map(slip => ({
      "Packing No": slip.slip_no,
      "Date": slip.slip_date,
      "Party Name": slip.party_name,
      "Design No": slip.design_no,
      "Godown/Shed": slip.godown,
      "Total Meters": slip.total_meters,
      "Total Pieces": slip.total_pieces,
      "Gross Weight": slip.gross_weight,
      "Status": slip.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Packing Slips");
    XLSX.writeFile(workbook, `Packing_Slips_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredSlips = slips.filter(slip => {
    const matchesSearch = searchTerm === '' ||
      slip.slip_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slip.design_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || slip.status === statusFilter;

    let matchesDate = true;
    if (slip.slip_date) {
      const sDate = new Date(slip.slip_date);
      if (fromDate) matchesDate = matchesDate && sDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && sDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalSlips = slips.length;
  const packedSlips = slips.filter(s => s.status === 'Packed').length;
  const shippedSlips = slips.filter(s => s.status === 'Shipped').length;
  const totalMetersSum = slips.reduce((sum, s) => sum + (Number(s.total_meters) || 0), 0);

  const handleCardClick = (statusVal) => {
    if (statusVal === 'Total') {
      setStatusFilter('All Status');
    } else {
      setStatusFilter(statusVal);
    }
  };

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button
              type="button"
              onClick={() => setView('list')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-primary)', padding: 0 }}
              title="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Packing Slip Details' : editingId ? 'Edit Packing Slip' : 'Add New Packing Slip / Bale Entry'}</h2>
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
              <FileText size={18} /> Packing Details
            </button>
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="packingSlipForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>

                <div id="general-section" className="animate-fade" style={{ marginBottom: 32 }}>
                  {/* Group 1: Packing Advice Headers */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Packing Slip Reference Information</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>

                    <div className="form-group">
                      <label>Date *</label>
                      <input type="date" className="form-control" name="slip_date" value={formData.slip_date} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Pack Type</label>
                      {isCustomPackType ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customPackTypeVal}
                            onChange={e => setCustomPackTypeVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('packing_type_master', customPackTypeVal, setIsCustomPackType, 'pack_type')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomPackType(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="pack_type"
                          value={formData.pack_type}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomPackType(true);
                              setCustomPackTypeVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          {options.masters?.packing_type_master?.map(x => <option key={x} value={x}>{x}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>No of Roll</label>
                      <select className="form-control" name="no_of_roll" value={formData.no_of_roll} onChange={handleInputChange}>
                        {[...Array(51).keys()].map(x => (
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Shed (Godown)</label>
                      {isCustomShed ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customShedVal}
                            onChange={e => setCustomShedVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('godown_master', customShedVal, setIsCustomShed, 'shed')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomShed(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="shed"
                          value={formData.shed}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomShed(true);
                              setCustomShedVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          {options.masters?.godown_master?.map(x => <option key={x} value={x}>{x}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Pin</label>
                      {isCustomPin ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customPinVal}
                            onChange={e => setCustomPinVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('pin_master', customPinVal, setIsCustomPin, 'pin')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomPin(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="pin"
                          value={formData.pin}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomPin(true);
                              setCustomPinVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          {options.masters?.pin_master?.map(x => <option key={x} value={x}>{x}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Bale List</label>
                      {isCustomBaleList ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customBaleListVal}
                            onChange={e => setCustomBaleListVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('bale_list_master', customBaleListVal, setIsCustomBaleList, 'bale_list')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomBaleList(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="bale_list"
                          value={formData.bale_list}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomBaleList(true);
                              setCustomBaleListVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          {options.masters?.bale_list_master?.map(x => <option key={x} value={x}>{x}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Bale No</label>
                      <input className="form-control" name="bale_no" value={formData.bale_no} onChange={handleInputChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'specs', 'design_no')} />
                    </div>
                  </div>
                </div>

                <div id="specs-section" className="animate-fade" style={{ marginBottom: 32 }}>
                  {/* Group 2: Product & Lot Information */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Technical & Lot Info</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group">
                      <label>IBPO / Order No</label>
                      <select 
                        className="form-control" 
                        name="ibpo" 
                        value={formData.ibpo || ''} 
                        onChange={handleIbpoChange}
                      >
                        <option value="">-- Select --</option>
                        {Array.from(new Set(buyerOrders.map(o => o.ibpo_number).filter(Boolean))).map(ibpo => (
                          <option key={ibpo} value={ibpo}>{ibpo}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Design No</label>
                      <select 
                        className="form-control" 
                        name="design_no" 
                        value={formData.design_no || ''} 
                        onChange={handleDesignChange}
                      >
                        <option value="">-- Select --</option>
                        {Array.from(new Set([
                          ...designs.map(d => d.design_no).filter(Boolean),
                          formData.design_no
                        ].filter(Boolean))).map(dNo => (
                          <option key={dNo} value={dNo}>{dNo}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Warp Lot</label>
                      <input className="form-control" name="warp_lot" value={formData.warp_lot} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Weft Lot</label>
                      <input className="form-control" name="weft_lot" value={formData.weft_lot} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Order Mtr + Tole</label>
                      <input className="form-control" name="order_mtr_tole" value={formData.order_mtr_tole} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Received Mtr</label>
                      <input className="form-control" type="number" name="recived_mtr" value={formData.recived_mtr} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Balance</label>
                      <input className="form-control" type="number" name="balance" value={formData.balance} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Stock Type</label>
                      {isCustomStockType ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customStockTypeVal}
                            onChange={e => setCustomStockTypeVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('stock_type_master', customStockTypeVal, setIsCustomStockType, 'stock_type')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomStockType(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="stock_type"
                          value={formData.stock_type}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomStockType(true);
                              setCustomStockTypeVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          {options.masters?.stock_type_master?.map(x => <option key={x} value={x}>{x}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Command (Remarks/Instructions)</label>
                      <input className="form-control" name="command" value={formData.command} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Transport</label>
                      {isCustomTransport ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customTransportVal}
                            onChange={e => setCustomTransportVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('transport_name_master', customTransportVal, setIsCustomTransport, 'transport')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomTransport(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="transport"
                          value={formData.transport}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomTransport(true);
                              setCustomTransportVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          {options.transporters?.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          {options.masters?.transport_name_master?.map(x => <option key={'_m_' + x} value={x}>{x}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Pack Dimensions (L x W x H)</label>
                      <input className="form-control" name="pack_dimensions" value={formData.pack_dimensions} onChange={handleInputChange} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Party / Customer Name</label>
                      {isCustomParty ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customPartyVal}
                            onChange={e => setCustomPartyVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('party_master', customPartyVal, setIsCustomParty, 'party_name')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomParty(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="party_name"
                          value={formData.party_name}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomParty(true);
                              setCustomPartyVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          {options.all_parties?.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      {isCustomStatus ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            autoFocus
                            className="form-control"
                            style={{ margin: 0, flex: 1 }}
                            value={customStatusVal}
                            onChange={e => setCustomStatusVal(e.target.value)}
                            placeholder="Add custom..."
                          />
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => handleSaveCustom('status_master', customStatusVal, setIsCustomStatus, 'status')}>
                            <CheckCircle size={16} color="var(--primary)" />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomStatus(false)}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          name="status"
                          onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'piece_no')}
                          value={formData.status}
                          onChange={(e) => {
                            if (e.target.value === '__ADD_NEW__') {
                              setIsCustomStatus(true);
                              setCustomStatusVal('');
                            } else {
                              handleInputChange(e);
                            }
                          }}
                        >
                          <option value="">-- Select --</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Cancelled">Cancelled</option>
                          {options.masters?.status_master?.filter(x => !['Packed', 'Shipped', 'Cancelled'].includes(x)).map(x => <option key={x} value={x}>{x}</option>)}
                          <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                <div id="items-section" className="animate-fade" style={{ marginBottom: 32 }}>
                  {/* Group 3: Split view for Despatch Detail Table & Right preview list */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Despatch Details & Bale Summary</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Left side: Despatch detail editor */}
                    <div>
                      <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Despatch Grid Details</h5>
                      <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="data-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ width: 50, textAlign: 'center' }}>S.No</th>
                              <th>Pc No *</th>
                              <th>LotNo</th>
                              <th>Loom No</th>
                              <th>Pass Mtr</th>
                              <th>Bale Mtr</th>
                              {!isReadOnly && <th style={{ width: 80, textAlign: 'center' }}></th>}
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
                                    className="form-control"
                                    value={item.loom_no}
                                    onChange={e => handleItemChange(index, 'loom_no', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-control"
                                    type="number"
                                    value={item.pass_mtr}
                                    onChange={e => handleItemChange(index, 'pass_mtr', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-control"
                                    type="number"
                                    value={item.bale_mtr}
                                    onChange={e => handleItemChange(index, 'bale_mtr', e.target.value)}
                                  />
                                </td>
                                {!isReadOnly && (
                                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <button
                                      type="button"
                                      onClick={addItemRow}
                                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: 8 }}
                                      title="Add Row"
                                    >
                                      <Plus size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeItemRow(index)}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                      title="Remove Row"
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
                    </div>

                    {/* Right side: Bale summary preview */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                      <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Bale Summary List</h5>
                      <div style={{ overflowY: 'auto', maxHeight: '330px', border: '1px solid var(--border)', borderRadius: 6 }}>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                              <th style={{ padding: 8, textAlign: 'left' }}>Bale No</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>SPNo</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>Quality</th>
                              <th style={{ padding: 8, textAlign: 'right' }}>Total Mtr</th>
                            </tr>
                          </thead>
                          <tbody>
                            {baleSummaryList.map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px dashed var(--border)' }}>
                                <td style={{ padding: 8 }}>{row.bale_no}</td>
                                <td style={{ padding: 8 }}>{row.sp_no}</td>
                                <td style={{ padding: 8 }}>{row.quality}</td>
                                <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{row.total_mtr}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontWeight: 700, fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <span>Total Bale: {baleSummaryList.length}</span>
                        <span>Total Mtrs: {formData.total_meters.toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div id="weights-section" className="animate-fade" style={{ marginBottom: 32 }}>
                  {/* Group 4: Weights & Footer Summary */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Weights & Summary Details</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group">
                      <label>Total Pieces</label>
                      <input className="form-control" value={formData.total_pieces} readOnly style={{ background: '#f1f5f9' }} />
                    </div>
                    <div className="form-group">
                      <label>Total Mtr</label>
                      <input className="form-control" value={formData.total_meters} readOnly style={{ background: '#f1f5f9' }} />
                    </div>
                    <div className="form-group">
                      <label>Act Wgt (Actual Weight)</label>
                      <input className="form-control" name="act_wgt" value={formData.act_wgt} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Cal Wgt (Calculated)</label>
                      <input className="form-control" name="cal_wgt" value={formData.cal_wgt} onChange={handleInputChange} readOnly={formData.auto_weight} style={formData.auto_weight ? { background: '#f1f5f9' } : {}} />
                    </div>
                    <div className="form-group">
                      <label>Packing Wgt</label>
                      <input className="form-control" name="packing_wgt" value={formData.packing_wgt} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Phy Wgt (Physical)</label>
                      <input className="form-control" name="phy_wgt" value={formData.phy_wgt} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Gross Wgt</label>
                      <input className="form-control" name="gross_weight" value={formData.gross_weight} onChange={handleInputChange} readOnly={formData.auto_weight} style={formData.auto_weight ? { background: '#f1f5f9' } : {}} />
                    </div>
                    <div className="form-group">
                      <label>Net Wgt</label>
                      <input className="form-control" name="net_weight" value={formData.net_weight} onChange={handleInputChange} readOnly={formData.auto_weight} style={formData.auto_weight ? { background: '#f1f5f9' } : {}} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <input type="checkbox" id="auto_weight" name="auto_weight" checked={formData.auto_weight} onChange={handleInputChange} />
                      <label htmlFor="auto_weight" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>Enable Auto Weight Calculation (Calculated weight + packing weight)</label>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X size={16} /> Close
                  </button>
                  {!isReadOnly && (
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Save size={16} /> {editingId ? 'Update Slip' : 'Save Slip'}
                    </button>
                  )}
                </div>

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
            <Box size={24} color="var(--primary)" /> Packing Slip & Bale Entry
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Log textile bale dimensions, roll counts, design numbers, and weights.</p>
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
            <Plus size={18} /> Add New Slip
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div
          className="card stat-card"
          onClick={() => handleCardClick('Total')}
          style={{ cursor: 'pointer', border: statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Box size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Packing Slips</h3>
            <div className="value">{totalSlips}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Packed')}
          style={{ cursor: 'pointer', border: statusFilter === 'Packed' ? '2px solid #10b981' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Packed Slips</h3>
            <div className="value">{packedSlips}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Shipped')}
          style={{ cursor: 'pointer', border: statusFilter === 'Shipped' ? '2px solid #8b5cf6' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <RefreshCw size={24} />
          </div>
          <div className="stat-details">
            <h3>Shipped Slips</h3>
            <div className="value">{shippedSlips}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ border: '1px solid transparent' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Packed (Mtr)</h3>
            <div className="value" style={{ fontSize: 16, fontWeight: 700 }}>{totalMetersSum.toFixed(2)} Mtr</div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>

        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Packing No, Design or Party..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Cancelled">Cancelled</option>
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

      {/* Split Table & Details View layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT SIDE: PACKING SLIPS TABLE */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Packing No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Design No</th>
                  <th>Godown</th>
                  <th>Total Meters</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>Loading Packing Slips...</td></tr>
                ) : filteredSlips.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No records found.</td></tr>
                ) : (
                  filteredSlips.map(slip => (
                    <tr
                      key={slip.id}
                      onClick={() => setSelectedViewSlip(slip)}
                      style={{
                        cursor: 'pointer',
                        background: selectedViewSlip?.id === slip.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{slip.slip_no}</td>
                      <td>{slip.slip_date}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{slip.party_name || '-'}</td>
                      <td>{slip.design_no || '-'}</td>
                      <td>{slip.godown || '-'}</td>
                      <td>{Number(slip.total_meters).toFixed(2)} Mtr</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: slip.status === 'Packed' ? '#d1fae5' : slip.status === 'Shipped' ? '#e0f2fe' : '#fee2e2',
                          color: slip.status === 'Packed' ? '#065f46' : slip.status === 'Shipped' ? '#0369a1' : '#991b1b'
                        }}>
                          {slip.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setSelectedViewSlip(slip)}
                            title="Full View"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(slip, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(slip.id, slip.slip_no, e)}
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

      </div>

      {/* A4 Modal View Preview */}
      {selectedViewSlip && (
        <A4DocumentPreview
          isOpen={!!selectedViewSlip}
          onClose={() => setSelectedViewSlip(null)}
          title="Packing Slip & Bale Entry"
          documentNumber={selectedViewSlip.slip_no}
          status={selectedViewSlip.status}
          sections={[
            {
              title: 'Slip Information',
              type: 'grid',
              icon: 'FileText',
              data: [
                { label: 'Date', value: selectedViewSlip.slip_date },
                { label: 'Party Name', value: selectedViewSlip.party_name },
                { label: 'Design No', value: selectedViewSlip.design_no },
                { label: 'Godown / Shed', value: selectedViewSlip.godown },
                { label: 'IBPO / Order No', value: selectedViewSlip.ibpo }
              ]
            },
            {
              title: 'Quantity & Weights',
              type: 'grid',
              icon: 'Scale',
              data: [
                { label: 'Total Pieces', value: selectedViewSlip.total_pieces },
                { label: 'Total Meters', value: `${Number(selectedViewSlip.total_meters).toFixed(2)} Mtr` },
                { label: 'Gross Weight', value: `${selectedViewSlip.gross_weight} kg` },
                { label: 'Net Weight', value: `${selectedViewSlip.net_weight} kg` }
              ]
            },
            {
              title: 'Bales & Items Listing',
              type: 'table',
              icon: 'Box',
              headers: ['Bale No', 'Piece No', 'Meters', 'Weight'],
              rows: (selectedViewSlip.items || []).map(item => [
                item.bale_no,
                item.piece_no,
                item.meters,
                `${item.weight} kg`
              ])
            }
          ]}
        />
      )}

    </div>
  );
}
