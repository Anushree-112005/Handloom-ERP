import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, ArrowRightLeft, FileText, IndianRupee, MapPin, Activity, CheckCircle, Package, Download, ChevronDown, ArrowLeft } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { yarnInwardAPI, partyAPI, yarnPurchaseOrderAPI, subMasterAPI, dropdownAPI } from '../../services/api';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { rackAPI } from '../../services/api';
import { confirmDialog } from '../../utils/dialogs';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function YarnInward() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [inwards, setInwards] = useState([]);
  const [parties, setParties] = useState([]);
  const [pos, setPos] = useState([]);
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewModalInward, setViewModalInward] = useState(null);

  const [options, setOptions] = useState({});
  const [colorMasters, setColorMasters] = useState([]);
  const [isCustomRecvdType, setIsCustomRecvdType] = useState(false);
  const [customRecvdTypeVal, setCustomRecvdTypeVal] = useState('');
  const [isCustomConeType, setIsCustomConeType] = useState(false);
  const [customConeTypeVal, setCustomConeTypeVal] = useState('');
  const [isCustomTransport, setIsCustomTransport] = useState(false);
  const [customTransportVal, setCustomTransportVal] = useState('');
  const [isCustomPacking, setIsCustomPacking] = useState(false);
  const [customPackingVal, setCustomPackingVal] = useState('');

  const [customYarnCountIdx, setCustomYarnCountIdx] = useState(null);
  const [customYarnCountVal, setCustomYarnCountVal] = useState('');
  const [customMillNameIdx, setCustomMillNameIdx] = useState(null);
  const [customMillNameVal, setCustomMillNameVal] = useState('');
  const [customColourIdx, setCustomColourIdx] = useState(null);
  const [customColourVal, setCustomColourVal] = useState('');

  const [newTermVal, setNewTermVal] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');

  const defaultInwardTerms = [
    'Material not meeting our specification and standards will be returned',
    'Demanded Qty to be supplied in whole and excess/short supply will not be accepted.',
    'Send Invoice along with Material.',
    'Defective and damage pieces will not be accepted.',
    'Start bulk production only after getting the sample Approval.',
    'Subject to Namakkal Jurisdiction.'
  ];

  const handleSaveCustomRecvdType = async () => {
    if (!customRecvdTypeVal.trim()) return;
    try {
      await subMasterAPI.create('received_type_master', { entity: 'received_type_master', name: customRecvdTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, received_type: customRecvdTypeVal.trim() });
      setIsCustomRecvdType(false);
      setCustomRecvdTypeVal('');
    } catch (err) {
      alert('Error saving custom received type');
    }
  };

  const handleSaveCustomConeType = async () => {
    if (!customConeTypeVal.trim()) return;
    try {
      await subMasterAPI.create('cone_type_master', { entity: 'cone_type_master', name: customConeTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, cone_type: customConeTypeVal.trim() });
      setIsCustomConeType(false);
      setCustomConeTypeVal('');
    } catch (err) {
      alert('Error saving custom cone type');
    }
  };

  const handleSaveCustomTransport = async () => {
    if (!customTransportVal.trim()) return;
    try {
      await subMasterAPI.create('transport_name_master', { entity: 'transport_name_master', name: customTransportVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, transport: customTransportVal.trim() });
      setIsCustomTransport(false);
      setCustomTransportVal('');
    } catch (err) {
      alert('Error saving custom transport');
    }
  };

  const handleSaveCustomPacking = async () => {
    if (!customPackingVal.trim()) return;
    try {
      await subMasterAPI.create('packing_type_master', { entity: 'packing_type_master', name: customPackingVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, packing: customPackingVal.trim() });
      setIsCustomPacking(false);
      setCustomPackingVal('');
    } catch (err) {
      alert('Error saving custom packing type');
    }
  };

  const handleSaveCustomYarnCount = async () => {
    if (!customYarnCountVal.trim() || customYarnCountIdx === null) return;
    try {
      await subMasterAPI.create('yarn_count_master', { entity: 'yarn_count_master', name: customYarnCountVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateItem(customYarnCountIdx, 'yarn_count', customYarnCountVal.trim());
      setCustomYarnCountIdx(null);
      setCustomYarnCountVal('');
    } catch (err) {
      alert('Error saving custom yarn count');
    }
  };

  const handleSaveCustomMillName = async () => {
    if (!customMillNameVal.trim() || customMillNameIdx === null) return;
    try {
      await subMasterAPI.create('mill_name_master', { entity: 'mill_name_master', name: customMillNameVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateItem(customMillNameIdx, 'mill_name', customMillNameVal.trim());
      setCustomMillNameIdx(null);
      setCustomMillNameVal('');
    } catch (err) {
      alert('Error saving custom mill name');
    }
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
    } catch (err) {
      alert('Error saving custom colour');
    }
  };

  // Terms & Conditions
  const defaultTerms = [
    'Material not meeting our specification and standards will be returned',
    'Demanded Qty to be supplied in whole and excess/short supply will not be accepted.',
    'Send Invoice along with Material.',
    'Defective and damage pieces will not be accepted.',
    'Start bulk production only after getting the sample Approval.',
    'Subject to Namakkal Jurisdiction.'
  ];

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    entry_date: new Date().toISOString().split('T')[0],
    inward_date: new Date().toISOString().split('T')[0],
    status: 'Received', received_type: 'Direct', received_from: '', po_no_dt: '',
    agent_name: '', stock_godown: '', godown_id: 0, cone_type: '',
    
    order_kgs: 0, received_kgs: 0, balance_kgs: 0, pc_id: '', tolerance_pct: 0,
    bill_no: '', bill_amount: 0, gross_kgs: 0, net_kgs: 0, chipnam: '', due_days: 0,
    
    transport: '', veh_no: '', total_bags: 0, eway_bill: '', org_grn_no: '',
    gate_no: '', wbridge_no: '', w_weight: 0,
    
    other_remarks: '', packing: '', freight: 0, gross_amount: 0, tax_type: 'GST',
    cgst_pct: 0, sgst_pct: 0, igst_pct: 0, tax_value: 0, tcs_value: 0, tds_pct: 0,
    total_tax: 0, round_off: 0, net_amount: 0, remarks: '',
    terms_conditions: [...defaultTerms],
    
    items: [{
      yarn_count: '', mill_name: '', colour: '', color_code: '', lot_no: '',
      our_id: '', rack_id: '', bags: 0, kgs: 0, rate: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [inwRes, partRes, poRes, dropRes, colorRes, racksRes] = await Promise.all([
        yarnInwardAPI.list(), partyAPI.list(), yarnPurchaseOrderAPI.list({ limit: 10000 }), dropdownAPI.getAll(), subMasterAPI.list('color_master'), rackAPI.list()
      ]);
      setInwards(inwRes.data);
      setParties(partRes.data);
      setPos(poRes.data);
      setOptions(dropRes.data);
      setColorMasters(colorRes.data);
      setRacks(racksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (queryId && inwards.length > 0) {
      const matched = inwards.find(i => String(i.id) === String(queryId));
      if (matched) {
        handleOpenForm(matched, true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [queryId, inwards]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.inward_date) payload.inward_date = null;
      if (!payload.entry_date) payload.entry_date = null;
      if (payload.godown_id === '') payload.godown_id = null;
      
      payload.items = payload.items.map(item => ({
        ...item,
        rack_id: item.rack_id === '' ? null : item.rack_id
      }));


      if (editingId) {
        await yarnInwardAPI.update(editingId, payload);
      } else {
        await yarnInwardAPI.create(payload);
      }
      
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving inward');
      console.error(err);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    const confirmed = await confirmDialog({
      title: 'Confirm GRN',
      message: 'Are you sure you want to confirm this GRN? This will update stock and send pending bill to Finance.',
      confirmText: 'Confirm',
      type: 'info'
    });
    if (!confirmed) return;
    try {
      await yarnInwardAPI.confirm(editingId);
      alert('GRN Confirmed Successfully!');
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error confirming GRN');
      console.error(err);
    }
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await yarnInwardAPI.get(entry.id);
      if (data.entry_date) data.entry_date = data.entry_date.substring(0, 10);
      if (data.inward_date) data.inward_date = data.inward_date.substring(0, 10);
      
      const safeData = { ...data };
      for (const key in safeData) {
        if (safeData[key] === null) safeData[key] = '';
      }
      if (safeData.items) {
        safeData.items = safeData.items.map(item => {
          const safeItem = { ...item };
          for (const k in safeItem) {
            if (safeItem[k] === null) safeItem[k] = '';
          }
          safeItem.amount = (parseFloat(safeItem.kgs) || 0) * (parseFloat(safeItem.rate) || 0);
          return safeItem;
        });
      }

      setForm({
        ...initialForm,
        ...safeData,
        terms_conditions: (safeData.terms_conditions && safeData.terms_conditions.length > 0)
          ? safeData.terms_conditions
          : [...defaultInwardTerms]
      });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('general');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading inward details.");
    }
  };

  const handleDelete = async (id, ref, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Delete Yarn Inward',
      message: `Are you sure you want to delete ${ref}?`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (confirmed) {
      try {
        await yarnInwardAPI.delete(id);
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await yarnInwardAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateFinancials = (updatedForm) => {
    let gross = parseFloat(updatedForm.gross_amount) || 0;
    let freight = parseFloat(updatedForm.freight) || 0;
    let net = gross + freight;
    return {
      ...updatedForm,
      tax_value: 0,
      total_tax: 0,
      net_amount: parseFloat(net.toFixed(2))
    };
  };

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

  const getAlreadyInwardedQty = (poNumber, yarnCount, colour, excludeInwardId = null) => {
    let totalInwarded = 0;
    inwards.forEach(inw => {
      if (excludeInwardId && inw.id === excludeInwardId) return;
      if (inw.po_no_dt) {
        const inwPoNum = inw.po_no_dt.split(' / ')[0].trim();
        if (inwPoNum === poNumber) {
          (inw.items || []).forEach(item => {
            if (
              (item.yarn_count || '').trim().toLowerCase() === (yarnCount || '').trim().toLowerCase() &&
              (item.colour || '').trim().toLowerCase() === (colour || '').trim().toLowerCase()
            ) {
              totalInwarded += parseFloat(item.kgs) || 0;
            }
          });
        }
      }
    });
    return totalInwarded;
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;
    
    if (name === 'received_type' && value === 'custom') {
      setIsCustomRecvdType(true);
      setCustomRecvdTypeVal('');
      return;
    }
    if (name === 'cone_type' && value === 'custom') {
      setIsCustomConeType(true);
      setCustomConeTypeVal('');
      return;
    }
    if (name === 'transport' && value === 'custom') {
      setIsCustomTransport(true);
      setCustomTransportVal('');
      return;
    }
    if (name === 'packing' && value === 'custom') {
      setIsCustomPacking(true);
      setCustomPackingVal('');
      return;
    }

    let newForm = { ...form, [name]: value };

    if (name === 'gate_no' && value) {
      try {
        const gateData = JSON.parse(localStorage.getItem('gate_inward_data') || '[]');
        const matchedGate = gateData.find(g => g.id === value || g.inwardNo === value);
        if (matchedGate && matchedGate.vehicleNo) {
          newForm.veh_no = matchedGate.vehicleNo;
        }
      } catch (err) {
        console.error('Error fetching gate data', err);
      }
    }

    if (name === 'received_type' && value === 'Direct') {
      newForm.po_no_dt = '';
    }

    if (name === 'po_no_dt') {
      if (!value) {
        newForm = {
          ...newForm,
          received_type: 'Direct',
          received_from: '',
          agent_name: '',
          transport: '',
          due_days: 0,
          order_kgs: 0,
          received_kgs: 0,
          balance_kgs: 0,
          tax_type: 'GST',
          cgst_pct: 0,
          sgst_pct: 0,
          igst_pct: 0,
          packing: '',
          freight: 0,
          remarks: '',
          items: [{
            yarn_count: '', mill_name: '', colour: '', color_code: '', lot_no: '',
            our_id: '', rack_id: '', bags: 0, kgs: 0, rate: 0, amount: 0
          }]
        };
      } else {
        const selectedPo = pos.find(po => {
          const poDateStr = po.po_date ? po.po_date.substring(0, 10) : '';
          const matchStr = `${po.po_number} / ${poDateStr}`;
          return matchStr === value || po.po_number === value || po.po_number === value.split(' / ')[0];
        });
        if (selectedPo) {
          const sourceDetails = (selectedPo.indent_details && selectedPo.indent_details.length > 0)
            ? selectedPo.indent_details
            : (selectedPo.count_details || []);

          const mappedItems = sourceDetails.map((item, idx) => {
            const itemColour = item.colour || selectedPo.colour || '';
            const selectedColor = colorMasters.find(c => c.name === itemColour);
            const countDetail = (selectedPo.indent_details && selectedPo.indent_details.length > 0)
              ? (selectedPo.count_details?.[idx] || {})
              : {};
            const millName = item.mill_name || countDetail.mill_name || '';

            const originalQty = item.order_qty || item.order_kgs || 0;
            const alreadyInwarded = getAlreadyInwardedQty(selectedPo.po_number, item.yarn_count, itemColour, editingId);
            const remainingQty = Math.max(0, originalQty - alreadyInwarded);

            return {
              yarn_count: item.yarn_count || '',
              mill_name: millName,
              colour: itemColour,
              color_code: selectedColor ? (selectedColor.code || '') : '',
              lot_no: '',
              our_id: '',
              rack_id: '',
              bags: 0,
              kgs: remainingQty,
              rate: item.rate || 0,
              amount: remainingQty * (item.rate || 0)
            };
          });

          const finalItems = mappedItems.length > 0 ? mappedItems : [{
            yarn_count: '', mill_name: '', colour: '', color_code: '', lot_no: '',
            our_id: '', rack_id: '', bags: 0, kgs: 0, rate: 0, amount: 0
          }];

          const totalKgs = finalItems.reduce((sum, item) => sum + (parseFloat(item.kgs) || 0), 0);
          const totalGross = finalItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

          newForm = {
            ...newForm,
            received_type: 'Against PO',
            received_from: selectedPo.supplier_name || '',
            agent_name: selectedPo.agent_name || '',
            transport: selectedPo.transport || '',
            due_days: selectedPo.due_days || 0,
            order_kgs: totalKgs,
            received_kgs: totalKgs,
            balance_kgs: 0,
            gross_kgs: totalKgs,
            net_kgs: totalKgs,
            tax_type: selectedPo.tax_type || 'GST',
            cgst_pct: selectedPo.cgst_pct || 0,
            sgst_pct: selectedPo.sgst_pct || 0,
            igst_pct: selectedPo.igst_pct || 0,
            packing: selectedPo.packing_type || '',
            freight: selectedPo.freight_chg || 0,
            gross_amount: totalGross,
            items: finalItems
          };
        }
      }
    }

    if (name === 'received_kgs') {
      newForm.balance_kgs = (parseFloat(newForm.order_kgs) || 0) - (parseFloat(value) || 0);
    }
    if (name === 'order_kgs') {
      newForm.balance_kgs = (parseFloat(value) || 0) - (parseFloat(newForm.received_kgs) || 0);
    }

    if (name === 'received_from') {
      const selectedParty = parties.find(p => p.company_name === value);
      if (selectedParty) {
        const stateLower = (selectedParty.state || '').toLowerCase().trim();
        const gstCode = (selectedParty.gst_no || '').trim().substring(0, 2);
        const isTN = stateLower.includes('tamil') || gstCode === '33';
        if (!isTN && (stateLower !== '' || gstCode !== '')) {
          newForm = {
            ...newForm,
            tax_type: 'IGST',
            sgst_pct: 0,
            cgst_pct: 0,
            igst_pct: 5.0
          };
        } else {
          newForm = {
            ...newForm,
            tax_type: 'GST',
            sgst_pct: 2.5,
            cgst_pct: 2.5,
            igst_pct: 0
          };
        }
      }
    }

    if (name === 'tax_type') {
      if (value === 'GST') {
        newForm.cgst_pct = 2.5;
        newForm.sgst_pct = 2.5;
        newForm.igst_pct = 0;
      } else if (value === 'IGST') {
        newForm.cgst_pct = 0;
        newForm.sgst_pct = 0;
        newForm.igst_pct = 5.0;
      } else if (value === 'Exempt') {
        newForm.cgst_pct = 0;
        newForm.sgst_pct = 0;
        newForm.igst_pct = 0;
      }
    }

    const financialFields = ['gross_amount', 'freight', 'cgst_pct', 'sgst_pct', 'igst_pct', 'tax_type', 'tcs_value', 'tds_pct', 'round_off', 'received_from'];
    if (financialFields.includes(name) || name === 'po_no_dt') {
      setForm(calculateFinancials(newForm));
    } else {
      setForm(newForm);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    const newGross = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalKgs = newItems.reduce((sum, item) => sum + (parseFloat(item.kgs) || 0), 0);
    const totalBags = newItems.reduce((sum, item) => sum + (parseInt(item.bags) || 0), 0);
    
    let updatedForm = {
      ...form,
      items: newItems,
      gross_amount: newGross,
      received_kgs: totalKgs,
      net_kgs: totalKgs,
      total_bags: totalBags,
      balance_kgs: (parseFloat(form.order_kgs) || 0) - totalKgs
    };
    setForm(calculateFinancials(updatedForm));
  };

  const updateItem = (index, field, value) => {
    if (field === 'yarn_count' && value === 'custom') {
      setCustomYarnCountIdx(index);
      setCustomYarnCountVal('');
      return;
    }
    if (field === 'mill_name' && value === 'custom') {
      setCustomMillNameIdx(index);
      setCustomMillNameVal('');
      return;
    }
    if (field === 'colour' && value === 'custom') {
      setCustomColourIdx(index);
      setCustomColourVal('');
      return;
    }
    const newItems = [...form.items];
    let val = value;
    if (['bags', 'kgs', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
    if (field === 'rack_id') val = value ? parseInt(value) : null;
    newItems[index][field] = val;
    
    if (field === 'colour' && val) {
      const selectedColor = colorMasters.find(c => c.name === val);
      if (selectedColor && selectedColor.code) {
        newItems[index]['color_code'] = selectedColor.code;
      } else {
        newItems[index]['color_code'] = '';
      }
    }
    
    let newGross = parseFloat(form.gross_amount) || 0;
    if (field === 'kgs' || field === 'rate') {
      const newAmt = (parseFloat(newItems[index].kgs) || 0) * (parseFloat(newItems[index].rate) || 0);
      newItems[index].amount = newAmt;
      
      // Also update total gross amount
      newGross = newItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    }
    
    let updatedForm = { ...form, items: newItems, gross_amount: newGross };

    if (field === 'kgs' || field === 'bags') {
      const totalKgs = newItems.reduce((sum, item) => sum + (parseFloat(item.kgs) || 0), 0);
      const totalBags = newItems.reduce((sum, item) => sum + (parseInt(item.bags) || 0), 0);
      updatedForm.received_kgs = totalKgs;
      updatedForm.net_kgs = totalKgs;
      updatedForm.total_bags = totalBags;
      updatedForm.balance_kgs = (parseFloat(updatedForm.order_kgs) || 0) - totalKgs;
    }
    
    if (field === 'kgs' || field === 'rate' || field === 'amount') {
      setForm(calculateFinancials(updatedForm));
    } else {
      setForm(updatedForm);
    }
  };

  const filteredInwards = inwards.filter(i => {
    const matchesSearch = searchTerm === '' ||
      i.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.received_from?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All Status' || i.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || i.received_type === typeFilter;
    
    let matchesDate = true;
    if (i.inward_date) {
      const entryDate = new Date(i.inward_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const totalInwards = inwards.length;
  const directInwards = inwards.filter(i => i.received_type === 'Direct').length;
  const poInwards = inwards.filter(i => i.received_type === 'Against PO').length;

  const handleCardClick = (type) => {
    if (type === 'Total') { setStatusFilter('All Status'); setTypeFilter('All Types'); }
    if (type === 'Direct') { setTypeFilter('Direct'); }
    if (type === 'AgainstPO') { setTypeFilter('Against PO'); }
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Yarn Inwards Report", 14, 15);
    const headers = [["Ref No", "Date", "Received From", "Type", "Status"]];
    const rows = filteredInwards.map(i => [
      i.ref_no || '-',
      i.inward_date || '-',
      i.received_from || '-',
      i.received_type || '-',
      i.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Yarn_Inwards_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredInwards.map(i => ({
      "Ref No": i.ref_no,
      "Date": i.inward_date,
      "Received From": i.received_from,
      "Type": i.received_type,
      "Status": i.status,
      "Net Amount": i.net_amount,
      "Total Kgs": i.gross_kgs,
      "Agent Name": i.agent_name
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yarn Inwards");
    XLSX.writeFile(wb, `Yarn_Inwards_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: FileText },
    { id: 'yarn', label: 'Yarn Details', icon: Package },
    { id: 'tax', label: 'Tax & Logistics', icon: IndianRupee }
  ];

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowRightLeft size={24} color="var(--primary)" /> Yarn Purchase Inward
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Record and manage yarn receipts.</p>
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
                <Plus size={18} /> New Inward
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Activity size={24} /></div>
              <div className="stat-details"><h3>Total Receipts</h3><div className="value">{totalInwards}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Direct')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Direct Receipts</h3><div className="value">{directInwards}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('AgainstPO')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Against PO Receipts</h3><div className="value">{poInwards}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search Ref No or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option>
                <option>Direct</option>
                <option>Against PO</option>
                {options?.masters?.received_type_master?.filter(o => o !== 'Direct' && o !== 'Against PO').map(o => <option key={o}>{o}</option>)}
              </select>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option><option>Received</option><option>Processed</option><option>Cancelled</option>
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
                      <th>Ref No</th><th>Inward Date</th><th>Supplier</th><th>Type</th><th>Net Amount</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredInwards.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No inwards found.</td></tr>
                    ) : filteredInwards.map(i => (
                      <tr key={i.id} onClick={() => handleRowClick(i)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === i.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.ref_no}</td>
                        <td>{i.inward_date}</td>
                        <td style={{ fontWeight: 500 }}>{i.received_from || '-'}</td>
                        <td><span className={`badge ${i.received_type === 'Direct' ? 'badge-draft' : 'badge-active'}`}>{i.received_type}</span></td>
                        <td style={{ fontWeight: 600 }}>₹{i.net_amount?.toFixed(2) || '0.00'}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={(evt) => { evt.stopPropagation(); setViewModalInward(i); }}
                              title="Preview Inward"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(i, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(i.id, i.ref_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
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
                      <ArrowRightLeft size={18} /> {selectedViewEntry.ref_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setViewModalInward(selectedViewEntry)}
                        title="Preview Inward"
                      >
                        <Eye size={16} color="var(--primary)" />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Inward Date" value={selectedViewEntry.inward_date} />
                    <DetailRow label="Type" value={selectedViewEntry.received_type} />
                    <DetailRow label="Supplier" value={selectedViewEntry.received_from} />
                    <DetailRow label="Status" value={selectedViewEntry.status} />
                    <DetailRow label="Bill No" value={selectedViewEntry.bill_no} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financials</h4>
                    <DetailRow label="Bill Amount" value={`₹${selectedViewEntry.bill_amount}`} />
                    <DetailRow label="Total Tax" value={`₹${selectedViewEntry.total_tax}`} />
                    <DetailRow label="Net Amount" value={<span style={{ color: 'var(--primary)', fontSize: 14 }}>₹{selectedViewEntry.net_amount}</span>} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items ({selectedViewEntry.items?.length || 0})</h4>
                    {selectedViewEntry.items?.map((c, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Count: {c.yarn_count}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Bags: {c.bags}</span>
                          <span>Kgs: {c.kgs}</span>
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
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-secondary)' }}>
            <button 
              type="button"
              onClick={() => setShowForm(false)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Inward Details' : editingId ? 'Edit Inward' : 'New Yarn Inward'}</h2>
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
              <FileText size={18}/> Inward Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              <div className="animate-fade">
                  {/* Section 1: General Info */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>General Info</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>Entry Date *</label><input type="date" className="form-control" name="entry_date" value={form.entry_date} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Inward Date *</label><input type="date" className="form-control" name="inward_date" value={form.inward_date} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Status</label><input className="form-control" name="status" value={form.status} onChange={handleChange} /></div>
                    <div className="form-group"><label>Received From</label>
                      <select className="form-control" name="received_from" value={form.received_from} onChange={handleChange}>
                        <option value="">Select Supplier...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                        {form.received_from && !parties.some(p => p.company_name === form.received_from) && (
                          <option value={form.received_from}>{form.received_from}</option>
                        )}
                      </select>
                    </div>
                    
                    <div className="form-group"><label>Recvd Type</label>
                      {isCustomRecvdType ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" placeholder="New Recvd Type" value={customRecvdTypeVal} onChange={e => setCustomRecvdTypeVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomRecvdType} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomRecvdType(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="received_type" value={form.received_type || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          <option value="Direct">Direct</option>
                          <option value="Against PO">Against PO</option>
                          {options.masters?.received_type_master?.filter(o => o !== 'Direct' && o !== 'Against PO').map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>PO No / Dt</label>
                      <select className="form-control" name="po_no_dt" value={form.po_no_dt} onChange={handleChange}>
                        <option value="">Select PO...</option>
                        {pos.map(po => <option key={po.id} value={`${po.po_number} / ${po.po_date}`}>{po.po_number} / {po.po_date}</option>)}
                        {form.po_no_dt && !pos.some(po => `${po.po_number} / ${po.po_date}` === form.po_no_dt) && (
                          <option value={form.po_no_dt}>{form.po_no_dt}</option>
                        )}
                      </select>
                    </div>
                    <div className="form-group"><label>Agent Name</label><input className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange} /></div>
                    <div className="form-group"><label>Stock Godown</label><input className="form-control" name="stock_godown" value={form.stock_godown} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Godown ID</label><input type="number" className="form-control" name="godown_id" value={form.godown_id} onChange={handleChange} /></div>
                    <div className="form-group"><label>Cone Type</label>
                      {isCustomConeType ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" placeholder="New Cone Type" value={customConeTypeVal} onChange={e => setCustomConeTypeVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomConeType} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomConeType(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="cone_type" value={form.cone_type || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          {options.masters?.cone_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Order Kgs</label><input type="number" className="form-control" name="order_kgs" value={form.order_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Received Kgs</label><input type="number" className="form-control" name="received_kgs" value={form.received_kgs} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Balance Kgs</label><input type="number" className="form-control" name="balance_kgs" value={form.balance_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Pc ID</label><input className="form-control" name="pc_id" value={form.pc_id} onChange={handleChange} /></div>
                    <div className="form-group"><label>Tolerance %</label><input type="number" className="form-control" name="tolerance_pct" value={form.tolerance_pct} onChange={handleChange} /></div>
                    <div className="form-group"><label>Bill No</label><input className="form-control" name="bill_no" value={form.bill_no} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Bill Amount</label><input type="number" className="form-control" name="bill_amount" value={form.bill_amount} onChange={handleChange} /></div>
                    <div className="form-group"><label>Gross Kgs</label><input type="number" className="form-control" name="gross_kgs" value={form.gross_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Net Kgs</label><input type="number" className="form-control" name="net_kgs" value={form.net_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Chipnam</label><input className="form-control" name="chipnam" value={form.chipnam} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Due Days</label><input type="number" className="form-control" name="due_days" value={form.due_days} onChange={handleChange} /></div>
                    <div className="form-group"><label>Transport</label>
                      {isCustomTransport ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" placeholder="New Transport" value={customTransportVal} onChange={e => setCustomTransportVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomTransport} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomTransport(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="transport" value={form.transport || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          {options.masters?.transport_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          {form.transport && !options.masters?.transport_name_master?.includes(form.transport) && (
                            <option value={form.transport}>{form.transport}</option>
                          )}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Veh No</label><input className="form-control" name="veh_no" value={form.veh_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total Bags</label><input type="number" className="form-control" name="total_bags" value={form.total_bags} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>E-Way Bill</label><input className="form-control" name="eway_bill" value={form.eway_bill} onChange={handleChange} /></div>
                    <div className="form-group"><label>Org GRN No</label><input className="form-control" name="org_grn_no" value={form.org_grn_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Gate No</label><input className="form-control" name="gate_no" value={form.gate_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Weighbridge No</label><input className="form-control" name="wbridge_no" value={form.wbridge_no} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>W Weight</label><input type="number" className="form-control" name="w_weight" value={form.w_weight} onChange={handleChange} /></div>
                  </div>

                  {/* Section 2: Yarn Details */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn Details</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Row</button>
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SNo</th><th>Count</th><th>Color</th><th>Color Code</th><th>Lot No</th><th>Our ID</th><th>Rack</th>
                          <th>Bags</th><th>Kgs</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              {customYarnCountIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 100 }} placeholder="New Count" value={customYarnCountVal} onChange={e => setCustomYarnCountVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomYarnCount} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setCustomYarnCountIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" name="yarn_count" style={{ width: 130 }} value={item.yarn_count || ''} onChange={e => {
                                  if (e.target.value === 'custom') setCustomYarnCountIdx(idx);
                                  else updateItem(idx, 'yarn_count', e.target.value);
                                }}>
                                  <option value="">Select Count...</option>
                                  {options.masters?.yarn_count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  {item.yarn_count && !options.masters?.yarn_count_master?.includes(item.yarn_count) && (
                                    <option value={item.yarn_count}>{item.yarn_count}</option>
                                  )}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add...</option>
                                </select>
                              )}
                            </td>
                            <td>
                              {customColourIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 100 }} placeholder="New Colour" value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomColour} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setCustomColourIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 130 }} value={item.colour || ''} onChange={e => {
                                  if (e.target.value === 'custom') {
                                    setCustomColourIdx(idx);
                                    setCustomColourVal('');
                                  } else {
                                    updateItem(idx, 'colour', e.target.value);
                                  }
                                }}>
                                  <option value="">Select Color...</option>
                                  {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  {item.colour && !options.masters?.color_master?.includes(item.colour) && (
                                    <option value={item.colour}>{item.colour}</option>
                                  )}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add...</option>
                                </select>
                              )}
                            </td>
                            <td><input type="text" className="form-control" style={{ width: 120 }} placeholder="Color Code" value={item.color_code || ''} onChange={e => updateItem(idx, 'color_code', e.target.value)} /></td>
                            <td><input type="text" className="form-control" style={{ width: 120 }} placeholder="Lot No" value={item.lot_no || ''} onChange={e => updateItem(idx, 'lot_no', e.target.value)} /></td>
                            <td><input type="text" className="form-control" style={{ width: 120 }} placeholder="Our ID" value={item.our_id || ''} onChange={e => updateItem(idx, 'our_id', e.target.value)} /></td>
                            <td>
                              <select className="form-control" style={{ width: 120 }} value={item.rack_id || ''} onChange={e => updateItem(idx, 'rack_id', e.target.value)}>
                                <option value="">Select Rack...</option>
                                {racks.filter(r => r.is_active).map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </td>
                            <td><input type="number" className="form-control" style={{ width: 90 }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} value={item.kgs} onChange={e => updateItem(idx, 'kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 110 }} value={item.amount} disabled /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 3: Terms & Conditions */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Terms & Conditions</h4>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                      
                      {/* ── Terms & Conditions ── */}
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Terms & Conditions</span>
                        </div>
                        <div style={{ padding: '16px 18px' }}>
                          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(form.terms_conditions || defaultTerms).map((term, idx) => (
                              <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {editingTermIdx === idx ? (
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13 }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { const updated = [...(form.terms_conditions || defaultTerms)]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}} />
                                    <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={() => { const updated = [...(form.terms_conditions || defaultTerms)]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}><CheckCircle size={14} /></button>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setEditingTermIdx(null)}><X size={14} /></button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <span>{term}</span>
                                    {!isReadOnly && (
                                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 2 }} onClick={() => { setEditingTermIdx(idx); setEditingTermVal(term); }} title="Edit"><Edit2 size={13} /></button>
                                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }} onClick={() => setForm({ ...form, terms_conditions: (form.terms_conditions || defaultTerms).filter((_, i) => i !== idx) })} title="Delete"><Trash2 size={13} /></button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                          {!isReadOnly && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                              <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13 }} placeholder="Add new term or condition..." value={newTermVal} onChange={e => setNewTermVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTermVal.trim()) { setForm({ ...form, terms_conditions: [...(form.terms_conditions || defaultTerms), newTermVal.trim()] }); setNewTermVal(''); }}} />
                              <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { if (newTermVal.trim()) { setForm({ ...form, terms_conditions: [...(form.terms_conditions || defaultTerms), newTermVal.trim()] }); setNewTermVal(''); }}}><Plus size={14} /> Add</button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT SIDE — Order Summary */}
                    <div style={{ flex: '0 0 300px', position: 'sticky', top: 24 }}>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>Order Summary</span>
                        </div>
                        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Total Bags</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.total_bags || 0}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Received Kgs</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{(form.received_kgs || 0).toLocaleString('en-IN')}</span>
                          </div>

                          <div style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Grand Total</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.3px' }}>INR {(form.net_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Close
              </button>
              {!isReadOnly && (
                <button type="button" className="btn btn-primary" onClick={handleCreate}>
                  <Save size={16} /> {editingId ? 'Update Inward' : 'Save Inward'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <A4DocumentPreview
        isOpen={!!viewModalInward}
        onClose={() => setViewModalInward(null)}
        title="YARN INWARD RECEIPT"
        documentNumber={viewModalInward?.ref_no}
        status={viewModalInward?.status}
        sections={viewModalInward ? [
          {
            title: "LOGISTICS & SUPPLIER",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "Supplier", value: viewModalInward.received_from || '-' },
              { label: "Inward Date", value: viewModalInward.inward_date },
              { label: "Type", value: viewModalInward.received_type },
              { label: "Vehicle No", value: viewModalInward.veh_no || '-' },
              { label: "Transport", value: viewModalInward.transport || '-' },
              { label: "Gate No", value: viewModalInward.gate_no || '-' }
            ]
          },
          {
            title: "YARN ITEMS",
            icon: "Box",
            type: "table",
            headers: ["S.No", "Yarn Count", "Colour", "Lot No", "Bags", "Kgs", "Rate", "Amount"],
            rows: (viewModalInward.items || []).map((item, idx) => [
              idx + 1,
              item.yarn_count || '-',
              item.colour || '-',
              item.lot_no || '-',
              item.bags || 0,
              item.kgs || 0,
              `₹ ${item.rate || 0}`,
              `₹ ${Number(item.amount || 0).toFixed(2)}`
            ])
          },
          {
            title: "TERMS & ORDER SUMMARY",
            icon: "FileText",
            type: "split_terms_summary",
            terms: viewModalInward.terms_conditions && viewModalInward.terms_conditions.length > 0 ? viewModalInward.terms_conditions : defaultTerms,
            summary: [
              { label: "Gross Amount", value: `₹ ${(viewModalInward.gross_amount || 0).toFixed(2)}` },
              { label: "Freight Charges", value: `₹ ${(viewModalInward.freight || 0).toFixed(2)}` },
              ...(viewModalInward.tax_type === 'GST' ? [
                { label: `SGST (${viewModalInward.sgst_pct || 0}%)`, value: `₹ ${(((parseFloat(viewModalInward.gross_amount) || 0) + (parseFloat(viewModalInward.freight) || 0)) * (viewModalInward.sgst_pct || 0) / 100).toFixed(2)}` },
                { label: `CGST (${viewModalInward.cgst_pct || 0}%)`, value: `₹ ${(((parseFloat(viewModalInward.gross_amount) || 0) + (parseFloat(viewModalInward.freight) || 0)) * (viewModalInward.cgst_pct || 0) / 100).toFixed(2)}` }
              ] : viewModalInward.tax_type === 'IGST' ? [
                { label: `IGST (${viewModalInward.igst_pct || 0}%)`, value: `₹ ${(((parseFloat(viewModalInward.gross_amount) || 0) + (parseFloat(viewModalInward.freight) || 0)) * (viewModalInward.igst_pct || 0) / 100).toFixed(2)}` }
              ] : []),
              { label: "TCS Value", value: `₹ ${(viewModalInward.tcs_value || 0).toFixed(2)}` },
              { label: "Round Off", value: `₹ ${(viewModalInward.round_off || 0).toFixed(2)}` },
              { label: "Total Bags", value: `${viewModalInward.total_bags || 0}` },
              { label: "Received Kgs", value: `${(viewModalInward.received_kgs || 0).toLocaleString('en-IN')}` },
              { label: "Net Amount", value: `₹ ${(viewModalInward.net_amount || 0).toFixed(2)}`, isTotal: true }
            ]
          }
        ] : []}
      />

    </div>
  );
}
