import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Package, CheckCircle, Clock, Truck, FileText, IndianRupee, Layers, Download, ChevronDown } from 'lucide-react';
import { yarnPurchaseOrderAPI, partyAPI, dropdownAPI, subMasterAPI, buyerOrderAPI, designEntryAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function YarnPurchaseOrder() {
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [options, setOptions] = useState({});
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [designEntries, setDesignEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [editingId, setEditingId] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isCustomOrg, setIsCustomOrg] = useState(false);
  const [customOrgVal, setCustomOrgVal] = useState('');
  const [isCustomAgainstRef, setIsCustomAgainstRef] = useState(false);
  const [customAgainstRefVal, setCustomAgainstRefVal] = useState('');
  const [isCustomPackingType, setIsCustomPackingType] = useState(false);
  const [customPackingTypeVal, setCustomPackingTypeVal] = useState('');
  const [isCustomTransport, setIsCustomTransport] = useState(false);
  const [customTransportVal, setCustomTransportVal] = useState('');
  const [isCustomColour, setIsCustomColour] = useState(false);
  const [customColourVal, setCustomColourVal] = useState('');
  const [isCustomFreightType, setIsCustomFreightType] = useState(false);
  const [customFreightTypeVal, setCustomFreightTypeVal] = useState('');
  const [customMillNameIdx, setCustomMillNameIdx] = useState(null);
  const [customMillNameVal, setCustomMillNameVal] = useState('');
  const [customFabricNameIdx, setCustomFabricNameIdx] = useState(null);
  const [customFabricNameVal, setCustomFabricNameVal] = useState('');
  const [customYarnCountIdx, setCustomYarnCountIdx] = useState(null);
  const [customYarnCountVal, setCustomYarnCountVal] = useState('');
  const [customTableColourIdx, setCustomTableColourIdx] = useState(null);
  const [customTableColourVal, setCustomTableColourVal] = useState('');

  // Custom Inline Fields for Supplier
  const [isCustomMainSupplier, setIsCustomMainSupplier] = useState(false);
  const [customMainSupplierVal, setCustomMainSupplierVal] = useState('');
  const [customCountSupplierIdx, setCustomCountSupplierIdx] = useState(null);
  const [customCountSupplierVal, setCustomCountSupplierVal] = useState('');

  const handleSaveCustomMainSupplier = async () => {
    if (!customMainSupplierVal.trim()) return;
    try {
      const { data } = await partyAPI.create({ company_name: customMainSupplierVal.trim(), party_type: 'Purchase Party' });
      setParties(prev => [...prev, data]);
      setForm(prev => ({ ...prev, supplier_name: data.company_name }));
      setIsCustomMainSupplier(false);
      setCustomMainSupplierVal('');
    } catch (err) {
      console.error("Failed to add custom Supplier", err);
      alert("Failed to add new Supplier. Please try again.");
    }
  };

  const handleSaveCustomCountSupplier = async (idx) => {
    if (!customCountSupplierVal.trim()) return;
    try {
      const { data } = await partyAPI.create({ company_name: customCountSupplierVal.trim(), party_type: 'Purchase Party' });
      setParties(prev => [...prev, data]);
      updateCountDetail(idx, 'supplier_name', data.company_name);
      setCustomCountSupplierIdx(null);
      setCustomCountSupplierVal('');
    } catch (err) {
      console.error("Failed to add custom Supplier", err);
      alert("Failed to add new Supplier. Please try again.");
    }
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    po_date: new Date().toISOString().split('T')[0],
    org_name: '', internal_po_no: '', used_for: '', against_ref: '', agent_name: '',
    supplier_name: '', delivery_at: '',
    
    freight_type: '', freight_chg: 0, insurance_chg: 0, total_order_kgs: 0,
    transport: '', tax_type: '', taxable_amount: 0, dispatch_date: '',
    packing_type: '', sgst_pct: 0, cgst_pct: 0, igst_pct: 0, labeling: '',
    colour: '', net_amount: 0, due_days: 0, remarks: '', status: 'Active',
    
    count_details: [],
    indent_details: [{
      yarn_count: '', colour: '', order_qty: 0, delivery_date: '', rate: 0, amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const recalculate = (updatedForm) => {
    const updatedIndentDetails = (updatedForm.indent_details || []).map(item => {
      const orderQty = parseFloat(item.order_qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = orderQty * rate;
      return {
        ...item,
        amount: parseFloat(amount.toFixed(2))
      };
    });

    const taxableAmount = updatedIndentDetails.reduce((sum, item) => sum + (item.amount || 0), 0);

    const cgstPct = parseFloat(updatedForm.cgst_pct) || 0;
    const sgstPct = parseFloat(updatedForm.sgst_pct) || 0;
    const igstPct = parseFloat(updatedForm.igst_pct) || 0;
    const taxType = updatedForm.tax_type || 'GST';
    const freightChg = parseFloat(updatedForm.freight_chg) || 0;
    const insuranceChg = parseFloat(updatedForm.insurance_chg) || 0;

    let taxAmount = 0;
    if (taxType === 'GST') {
      taxAmount = ((cgstPct + sgstPct) / 100) * taxableAmount;
    } else if (taxType === 'IGST') {
      taxAmount = (igstPct / 100) * taxableAmount;
    }

    const netAmount = taxableAmount + freightChg + insuranceChg + taxAmount;

    return {
      ...updatedForm,
      indent_details: updatedIndentDetails,
      taxable_amount: parseFloat(taxableAmount.toFixed(2)),
      net_amount: parseFloat(netAmount.toFixed(2))
    };
  };

  const loadData = async () => {
    try {
      const [ordRes, partRes, dropRes, buyerOrdRes, designRes] = await Promise.all([
        yarnPurchaseOrderAPI.list(), 
        partyAPI.list(), 
        dropdownAPI.getAll(),
        buyerOrderAPI.list(),
        designEntryAPI.list()
      ]);
      setOrders(ordRes.data);
      setParties(partRes.data);
      setOptions(dropRes.data);
      setBuyerOrders(buyerOrdRes.data || []);
      setDesignEntries(designRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveCustomOrg = async () => {
    if (!customOrgVal.trim()) return;
    try {
      await subMasterAPI.create('organization_name_master', { entity: 'organization_name_master', name: customOrgVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, org_name: customOrgVal.trim() });
      setIsCustomOrg(false);
      setCustomOrgVal('');
    } catch (err) {
      alert('Error saving custom organization name');
    }
  };

  const handleSaveCustomAgainstRef = async () => {
    if (!customAgainstRefVal.trim()) return;
    try {
      await subMasterAPI.create('against_reference_master', { entity: 'against_reference_master', name: customAgainstRefVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, against_ref: customAgainstRefVal.trim() });
      setIsCustomAgainstRef(false);
      setCustomAgainstRefVal('');
    } catch (err) {
      alert('Error saving custom against reference');
    }
  };

  const handleSaveCustomPackingType = async () => {
    if (!customPackingTypeVal.trim()) return;
    try {
      await subMasterAPI.create('packing_type_master', { entity: 'packing_type_master', name: customPackingTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, packing_type: customPackingTypeVal.trim() });
      setIsCustomPackingType(false);
      setCustomPackingTypeVal('');
    } catch (err) {
      alert('Error saving custom packing type');
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

  const handleSaveCustomColour = async () => {
    if (!customColourVal.trim()) return;
    try {
      await subMasterAPI.create('color_master', { entity: 'color_master', name: customColourVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, colour: customColourVal.trim() });
      setIsCustomColour(false);
      setCustomColourVal('');
    } catch (err) {
      alert('Error saving custom colour');
    }
  };

  const handleSaveCustomFreightType = async () => {
    if (!customFreightTypeVal.trim()) return;
    try {
      await subMasterAPI.create('freight_type_master', { entity: 'freight_type_master', name: customFreightTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, freight_type: customFreightTypeVal.trim() });
      setIsCustomFreightType(false);
      setCustomFreightTypeVal('');
    } catch (err) {
      alert('Error saving custom freight type');
    }
  };

  const handleSaveCustomMillName = async () => {
    if (!customMillNameVal.trim() || customMillNameIdx === null) return;
    try {
      await subMasterAPI.create('mill_name_master', { entity: 'mill_name_master', name: customMillNameVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateCountDetail(customMillNameIdx, 'mill_name', customMillNameVal.trim());
      setCustomMillNameIdx(null);
      setCustomMillNameVal('');
    } catch (err) {
      alert('Error saving custom mill name');
    }
  };

  const handleSaveCustomFabricName = async () => {
    if (!customFabricNameVal.trim() || customFabricNameIdx === null) return;
    try {
      await subMasterAPI.create('fabric_type_master', { entity: 'fabric_type_master', name: customFabricNameVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateIndentDetail(customFabricNameIdx, 'fabric_name', customFabricNameVal.trim());
      setCustomFabricNameIdx(null);
      setCustomFabricNameVal('');
    } catch (err) {
      alert('Error saving custom fabric name');
    }
  };

  const handleSaveCustomYarnCount = async () => {
    if (!customYarnCountVal.trim() || customYarnCountIdx === null) return;
    try {
      await subMasterAPI.create('yarn_count_master', { entity: 'yarn_count_master', name: customYarnCountVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateIndentDetail(customYarnCountIdx, 'yarn_count', customYarnCountVal.trim());
      setCustomYarnCountIdx(null);
      setCustomYarnCountVal('');
    } catch (err) {
      alert('Error saving custom yarn count');
    }
  };

  const handleSaveCustomTableColour = async () => {
    if (!customTableColourVal.trim() || customTableColourIdx === null) return;
    try {
      await subMasterAPI.create('color_master', { entity: 'color_master', name: customTableColourVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      updateIndentDetail(customTableColourIdx, 'colour', customTableColourVal.trim());
      setCustomTableColourIdx(null);
      setCustomTableColourVal('');
    } catch (err) {
      alert('Error saving custom color');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.dispatch_date) payload.dispatch_date = null;

      if (editingId) {
        await yarnPurchaseOrderAPI.update(editingId, payload);
      } else {
        await yarnPurchaseOrderAPI.create(payload);
      }
      
      setShowForm(false); setEditingId(null); setForm(initialForm); loadData();
      setIsCustomMainSupplier(false);
      setCustomMainSupplierVal('');
      setCustomCountSupplierIdx(null);
      setCustomCountSupplierVal('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving order');
      console.error(err);
    }
  };

  const handleOpenForm = async (order, readOnly = false) => {
    try {
      const { data } = await yarnPurchaseOrderAPI.get(order.id);
      if (data.po_date) data.po_date = data.po_date.substring(0, 10);
      if (data.dispatch_date) data.dispatch_date = data.dispatch_date.substring(0, 10);
      
      setForm({ ...initialForm, ...data });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('main');
      setShowForm(true);
      setSelectedViewOrder(null);
      setIsCustomMainSupplier(false);
      setCustomMainSupplierVal('');
      setCustomCountSupplierIdx(null);
      setCustomCountSupplierVal('');
    } catch (err) {
      alert("Error loading order details.");
    }
  };

  const handleDelete = async (id, po, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${po}?`)) {
      try {
        await yarnPurchaseOrderAPI.delete(id);
        if (selectedViewOrder?.id === id) setSelectedViewOrder(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleRowClick = async (order) => {
    try {
      const { data } = await yarnPurchaseOrderAPI.get(order.id);
      setSelectedViewOrder(data);
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
    
    if (name === 'against_ref') {
      if (value === 'custom') {
        setIsCustomAgainstRef(true);
        setCustomAgainstRefVal('');
        return;
      }
      
      if (value && value !== 'No Reference') {
        const selectedOrder = buyerOrders.find(bo => bo.ibpo_number === value);
        const matchingDesigns = designEntries.filter(de => de.ibpo_no === value);
        
        if (matchingDesigns.length > 0) {
          const newIndentDetails = matchingDesigns.map(de => {
            let yCount = de.count_rxpxw || '';
            try {
              if (de.yarn_details) {
                const parsed = JSON.parse(de.yarn_details);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  yCount = parsed[0].yarn_count || yCount;
                }
              }
            } catch (e) {
              console.error("Failed to parse design entry yarn details", e);
            }
            return {
              yarn_count: yCount,
              colour: de.color || '',
              order_qty: parseFloat(de.order_mtr) || 0,
              delivery_date: de.ds_date ? de.ds_date.substring(0, 10) : '',
              rate: 0,
              amount: 0
            };
          });

          setForm(recalculate({
            ...form,
            against_ref: value,
            agent_name: selectedOrder?.agent_name || form.agent_name || '',
            supplier_name: selectedOrder?.party_name || form.supplier_name || '',
            delivery_at: selectedOrder?.delivery_at || form.delivery_at || '',
            indent_details: newIndentDetails
          }));
          return;
        } else if (selectedOrder) {
          const newIndentDetails = (selectedOrder.items || []).map(item => {
            return {
              yarn_count: item.yarn_count || '',
              colour: item.color || '',
              order_qty: parseFloat(item.order_mtrs) || 0,
              delivery_date: item.po_date ? item.po_date.substring(0, 10) : '',
              rate: parseFloat(item.rate) || 0,
              amount: parseFloat(item.amount) || 0
            };
          });

          setForm(recalculate({
            ...form,
            against_ref: value,
            agent_name: selectedOrder.agent_name || form.agent_name || '',
            supplier_name: selectedOrder.party_name || form.supplier_name || '',
            delivery_at: selectedOrder.delivery_at || form.delivery_at || '',
            indent_details: newIndentDetails.length > 0 ? newIndentDetails : form.indent_details
          }));
          return;
        }
      }
    }

    if (name === 'supplier_name' && value === 'custom_add_new') {
      setIsCustomMainSupplier(true);
      setCustomMainSupplierVal('');
      return;
    }
    if (name === 'org_name' && value === 'custom') {
      setIsCustomOrg(true);
      setCustomOrgVal('');
      return;
    }
    if (name === 'against_ref' && value === 'custom') {
      setIsCustomAgainstRef(true);
      setCustomAgainstRefVal('');
      return;
    }
    if (name === 'freight_type' && value === 'custom') {
      setIsCustomFreightType(true);
      setCustomFreightTypeVal('');
      return;
    }
    if (name === 'transport' && value === 'custom') {
      setIsCustomTransport(true);
      setCustomTransportVal('');
      return;
    }
    if (name === 'packing_type' && value === 'custom') {
      setIsCustomPackingType(true);
      setCustomPackingTypeVal('');
      return;
    }
    if (name === 'colour' && value === 'custom') {
      setIsCustomColour(true);
      setCustomColourVal('');
      return;
    }

    setForm(recalculate({ ...form, [name]: value }));
  };

  // Dynamic Item Handlers
  const addCountDetail = () => setForm({ ...form, count_details: [...form.count_details, initialForm.count_details[0]] });
  const removeCountDetail = (index) => setForm({ ...form, count_details: form.count_details.filter((_, i) => i !== index) });
  const updateCountDetail = (index, field, value) => {
    const newItems = [...form.count_details];
    let val = value;
    if (['yarn_csp', 'min_cone_wgt', 'order_kgs', 'tolerance_pct'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    setForm({ ...form, count_details: newItems });
  };

  const addIndentDetail = () => {
    const newRow = {
      yarn_count: '', colour: '', order_qty: 0, delivery_date: '', rate: 0, amount: 0
    };
    setForm(recalculate({ ...form, indent_details: [...form.indent_details, newRow] }));
  };
  const removeIndentDetail = (index) => {
    const nextForm = { ...form, indent_details: form.indent_details.filter((_, i) => i !== index) };
    setForm(recalculate(nextForm));
  };
  const updateIndentDetail = (index, field, value) => {
    const newItems = [...form.indent_details];
    let val = value;
    if (['order_qty', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;
    
    if (field === 'order_qty' || field === 'rate') {
      newItems[index].amount = parseFloat(((newItems[index].order_qty || 0) * (newItems[index].rate || 0)).toFixed(2));
    }
    
    const nextForm = { ...form, indent_details: newItems };
    setForm(recalculate(nextForm));
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchTerm === '' ||
      o.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All Status' || o.status === statusFilter;
    
    let matchesDate = true;
    if (o.po_date) {
      const entryDate = new Date(o.po_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPOs = orders.length;
  const activePOs = orders.filter(o => o.status === 'Active').length;
  const closedPOs = orders.filter(o => o.status === 'Closed').length;

  const handleCardClick = (type) => {
    if (type === 'Total') setStatusFilter('All Status');
    if (type === 'Active') setStatusFilter('Active');
    if (type === 'Closed') setStatusFilter('Closed');
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Yarn Purchase Orders", 14, 15);
    const headers = [["PO No", "Date", "Supplier", "Amount", "Status"]];
    const rows = filteredOrders.map(o => [
      o.po_number || '-',
      o.po_date || '-',
      o.supplier_name || o.org_name || '-',
      `Rs. ${o.net_amount?.toFixed(2) || '0.00'}`,
      o.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Yarn_POs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(o => ({
      "PO No": o.po_number,
      "Date": o.po_date,
      "Internal PO No": o.internal_po_no,
      "Org Name": o.org_name,
      "Supplier": o.supplier_name,
      "Agent Name": o.agent_name,
      "Amount": o.net_amount,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yarn POs");
    XLSX.writeFile(wb, `Yarn_POs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tabs = [
    { id: 'main', label: 'Order Info', icon: FileText },
    { id: 'indent', label: 'Indent / Design', icon: Layers },
    { id: 'tax', label: 'Tax & Logistics', icon: IndianRupee }
  ];

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={24} color="var(--primary)" /> Yarn Purchase Orders
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage yarn procurement and indents.</p>
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
              <button className="btn btn-primary" onClick={() => { 
                setEditingId(null); 
                setForm(initialForm); 
                setIsReadOnly(false); 
                setShowForm(true); 
                setIsCustomMainSupplier(false);
                setCustomMainSupplierVal('');
                setCustomCountSupplierIdx(null);
                setCustomCountSupplierVal('');
              }}>
                <Plus size={18} /> New Order
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', border: statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Package size={24} /></div>
              <div className="stat-details"><h3>Total POs</h3><div className="value">{totalPOs}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active POs</h3><div className="value">{activePOs}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Closed')} style={{ cursor: 'pointer', border: statusFilter === 'Closed' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={24} /></div>
              <div className="stat-details"><h3>Closed POs</h3><div className="value">{closedPOs}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search PO or Supplier..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option><option>Active</option><option>Closed</option>
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
                      <th>PO No</th><th>Date</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No POs found.</td></tr>
                    ) : filteredOrders.map(o => (
                      <tr key={o.id} onClick={() => handleRowClick(o)} style={{ cursor: 'pointer', background: selectedViewOrder?.id === o.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{o.po_number}</td>
                        <td>{o.po_date}</td>
                        <td style={{ fontWeight: 500 }}>{o.supplier_name || o.org_name || '-'}</td>
                        <td style={{ fontWeight: 600 }}>₹{o.net_amount?.toFixed(2) || '0.00'}</td>
                        <td><span className={`badge ${o.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{o.status}</span></td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(evt) => handleDelete(o.id, o.po_number, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedViewOrder && (
              <div style={{ flex: '0 0 350px' }}>
                <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                      <Package size={18} /> {selectedViewOrder.po_number}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewOrder, true)} title="Full View"><Eye size={14} color="var(--primary)" /></button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewOrder, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Date" value={selectedViewOrder.po_date} />
                    <DetailRow label="Internal PO No" value={selectedViewOrder.internal_po_no} />
                    <DetailRow label="Org Name" value={selectedViewOrder.org_name} />
                    <DetailRow label="Supplier" value={selectedViewOrder.supplier_name} />
                    <DetailRow label="Status" value={selectedViewOrder.status} />
                    
                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financials</h4>
                    <DetailRow label="Taxable Amt" value={`₹${selectedViewOrder.taxable_amount}`} />
                    <DetailRow label="IGST" value={`${selectedViewOrder.igst_pct}%`} />
                    <DetailRow label="Net Amount" value={<span style={{ color: 'var(--primary)', fontSize: 14 }}>₹{selectedViewOrder.net_amount}</span>} />
                    

                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View PO Details' : editingId ? 'Edit PO' : 'New Purchase Order'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => {
                setShowForm(false);
                setIsCustomMainSupplier(false);
                setCustomMainSupplierVal('');
                setCustomCountSupplierIdx(null);
                setCustomCountSupplierVal('');
              }}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update PO' : 'Save PO'}</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
                }}
              >
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
              
              {activeTab === 'main' && (
                <div className="animate-fade">
                  {/* Section 1: Order Info */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Info</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>Order Date *</label><input type="date" className="form-control" name="po_date" value={form.po_date} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Org. Name</label>
                      {isCustomOrg ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" autoFocus placeholder="Enter Org Name..." value={customOrgVal} onChange={e => setCustomOrgVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomOrg}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomOrg(false); setCustomOrgVal(''); }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="org_name" value={form.org_name || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomOrg(true);
                          else handleChange(e);
                        }}>
                          <option value="">Select Org...</option>
                          {options.masters?.organization_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Org...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Internal PO No</label><input className="form-control" name="internal_po_no" value={form.internal_po_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Used For</label><input className="form-control" name="used_for" value={form.used_for} onChange={handleChange} /></div>
                    <div className="form-group"><label>Against Reference</label>
                      {isCustomAgainstRef ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" autoFocus placeholder="Enter Against Ref..." value={customAgainstRefVal} onChange={e => setCustomAgainstRefVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomAgainstRef}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomAgainstRef(false); setCustomAgainstRefVal(''); }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="against_ref" value={form.against_ref || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomAgainstRef(true);
                          else handleChange(e);
                        }}>
                          <option value="">Select...</option>
                          <option value="No Reference">No Reference (Dummy PO)</option>
                          {buyerOrders.map(bo => (
                            <option key={bo.id} value={bo.ibpo_number}>
                              {bo.ibpo_number} ({bo.party_name || bo.buyer_name || 'No Party'})
                            </option>
                          ))}
                          {options.masters?.against_reference_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Against Ref...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Agent Name</label><input className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Supplier Name</label>
                      {isCustomMainSupplier ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type new supplier..."
                            value={customMainSupplierVal}
                            onChange={(e) => setCustomMainSupplierVal(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                await handleSaveCustomMainSupplier();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomMainSupplier} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomMainSupplier(false); setForm(prev => ({ ...prev, supplier_name: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="supplier_name" value={form.supplier_name} onChange={handleChange}>
                          <option value="">Select Supplier...</option>
                          {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Delivery At</label><input className="form-control" name="delivery_at" value={form.delivery_at} onChange={handleChange} /></div>
                    <div className="form-group"><label>Status</label>
                      <select className="form-control" name="status" value={form.status} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'indent', 'req_ind_no')}>
                        <option>Active</option><option>Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Section 3: Indent / Design */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Indent / Design</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addIndentDetail}><Plus size={16} /> Add Indent Row</button>
                  </div>
                  <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 16, width: '100%' }}>
                    <table className="data-table" style={{ minWidth: '1000px' }}>
                      <thead>
                        <tr>
                          <th>SNo</th><th>Count</th><th>Color</th><th>Qty</th><th>Date</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.indent_details.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              {customYarnCountIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 80 }} autoFocus value={customYarnCountVal} onChange={e => setCustomYarnCountVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={handleSaveCustomYarnCount}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setCustomYarnCountIdx(null); setCustomYarnCountVal(''); }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 120 }} value={item.yarn_count || ''} onChange={e => {
                                  if (e.target.value === 'custom') setCustomYarnCountIdx(idx);
                                  else updateIndentDetail(idx, 'yarn_count', e.target.value);
                                }}>
                                  <option value="">Select Count...</option>
                                  {options.masters?.yarn_count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                </select>
                              )}
                            </td>
                            <td>
                              {customTableColourIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 100 }} autoFocus value={customTableColourVal} onChange={e => setCustomTableColourVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={handleSaveCustomTableColour}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setCustomTableColourIdx(null); setCustomTableColourVal(''); }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 130 }} value={item.colour || ''} onChange={e => {
                                  if (e.target.value === 'custom') {
                                    setCustomTableColourIdx(idx);
                                    setCustomTableColourVal('');
                                  } else {
                                    updateIndentDetail(idx, 'colour', e.target.value);
                                  }
                                }}>
                                  <option value="">Select Color...</option>
                                  {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                </select>
                              )}
                            </td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} value={item.order_qty} onChange={e => updateIndentDetail(idx, 'order_qty', e.target.value)} /></td>
                            <td><input type="date" className="form-control" style={{ width: 130 }} value={item.delivery_date || ''} onChange={e => updateIndentDetail(idx, 'delivery_date', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} placeholder="Rate" value={item.rate || 0} onChange={e => updateIndentDetail(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 120, fontWeight: 'bold', background: '#f1f5f9' }} value={item.amount || 0} readOnly /></td>
                            <td><button type="button" onClick={() => removeIndentDetail(idx)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 4: Tax & Logistics */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Tax & Logistics</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>Freight Type</label>
                      {isCustomFreightType ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" autoFocus placeholder="Enter Freight Type..." value={customFreightTypeVal} onChange={e => setCustomFreightTypeVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomFreightType}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomFreightType(false); setCustomFreightTypeVal(''); }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="freight_type" value={form.freight_type || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomFreightType(true);
                          else handleChange(e);
                        }}>
                          <option value="">Select...</option>
                          {options.masters?.freight_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Freight Type...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Freight Chg</label><input type="number" className="form-control" name="freight_chg" value={form.freight_chg} onChange={handleChange} /></div>
                    <div className="form-group"><label>Insurance Chg</label><input type="number" className="form-control" name="insurance_chg" value={form.insurance_chg} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total Order Kgs</label><input type="number" className="form-control" name="total_order_kgs" value={form.total_order_kgs} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Transport</label>
                      {isCustomTransport ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" autoFocus placeholder="Enter Transport..." value={customTransportVal} onChange={e => setCustomTransportVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomTransport}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomTransport(false); setCustomTransportVal(''); }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="transport" value={form.transport || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomTransport(true);
                          else handleChange(e);
                        }}>
                          <option value="">Select...</option>
                          {options.masters?.transport_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Transport...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>TAX Type</label>
                      <select className="form-control" name="tax_type" value={form.tax_type} onChange={handleChange}>
                        <option>GST</option><option>IGST</option><option>Exempt</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Taxable Amount</label><input type="number" className="form-control" name="taxable_amount" value={form.taxable_amount} onChange={handleChange} /></div>
                    <div className="form-group"><label>Dispatch Date</label><input type="date" className="form-control" name="dispatch_date" value={form.dispatch_date} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Packing Type</label>
                      {isCustomPackingType ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" autoFocus placeholder="Enter Packing Type..." value={customPackingTypeVal} onChange={e => setCustomPackingTypeVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomPackingType}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomPackingType(false); setCustomPackingTypeVal(''); }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="packing_type" value={form.packing_type || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomPackingType(true);
                          else handleChange(e);
                        }}>
                          <option value="">Select...</option>
                          {options.masters?.packing_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Packing...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>SGST %</label><input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} /></div>
                    <div className="form-group"><label>CGST %</label><input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} /></div>
                    <div className="form-group"><label>IGST %</label><input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} /></div>
                    
                    <div className="form-group"><label>Labeling</label><input className="form-control" name="labeling" value={form.labeling} onChange={handleChange} /></div>
                    <div className="form-group"><label>Colour</label>
                      {isCustomColour ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" autoFocus placeholder="Enter Colour..." value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomColour}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomColour(false); setCustomColourVal(''); }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="colour" value={form.colour || ''} onChange={e => {
                          if (e.target.value === 'custom') setIsCustomColour(true);
                          else handleChange(e);
                        }}>
                          <option value="">Select...</option>
                          {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Colour...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Due Days</label><input type="number" className="form-control" name="due_days" value={form.due_days} onChange={handleChange} /></div>
                    <div className="form-group"><label>Nett Amount</label><input type="number" className="form-control" style={{ fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1' }} name="net_amount" value={form.net_amount} onChange={handleChange} /></div>
                    
                    <div className="form-group" style={{ gridColumn: 'span 4' }}><label>Remarks</label><input className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                  </div>
                </div>
              )}



              {activeTab === 'indent' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addIndentDetail}><Plus size={16} /> Add Indent Row</button>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SNo</th><th>Count</th><th>Color</th><th>Qty</th><th>Date</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.indent_details.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              {customYarnCountIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 80 }} autoFocus value={customYarnCountVal} onChange={e => setCustomYarnCountVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={handleSaveCustomYarnCount}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setCustomYarnCountIdx(null); setCustomYarnCountVal(''); }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 120 }} value={item.yarn_count || ''} onChange={e => {
                                  if (e.target.value === 'custom') setCustomYarnCountIdx(idx);
                                  else updateIndentDetail(idx, 'yarn_count', e.target.value);
                                }}>
                                  <option value="">Select Count...</option>
                                  {options.masters?.yarn_count_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                </select>
                              )}
                            </td>
                            <td>
                              {customTableColourIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 100 }} autoFocus value={customTableColourVal} onChange={e => setCustomTableColourVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" style={{ padding: '4px 8px' }} onClick={handleSaveCustomTableColour}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => { setCustomTableColourIdx(null); setCustomTableColourVal(''); }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 130 }} value={item.colour || ''} onChange={e => {
                                  if (e.target.value === 'custom') {
                                    setCustomTableColourIdx(idx);
                                    setCustomTableColourVal('');
                                  } else {
                                    updateIndentDetail(idx, 'colour', e.target.value);
                                  }
                                }}>
                                  <option value="">Select Color...</option>
                                  {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                </select>
                              )}
                            </td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} value={item.order_qty} onChange={e => updateIndentDetail(idx, 'order_qty', e.target.value)} /></td>
                            <td><input type="date" className="form-control" style={{ width: 130 }} value={item.delivery_date || ''} onChange={e => updateIndentDetail(idx, 'delivery_date', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} placeholder="Rate" value={item.rate || 0} onChange={e => updateIndentDetail(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 120, fontWeight: 'bold', background: '#f1f5f9' }} value={item.amount || 0} readOnly /></td>
                            <td><button type="button" onClick={() => removeIndentDetail(idx)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'tax' && (
                <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="form-group"><label>Freight Type</label>
                    {isCustomFreightType ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" className="form-control" autoFocus placeholder="Enter Freight Type..." value={customFreightTypeVal} onChange={e => setCustomFreightTypeVal(e.target.value)} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomFreightType}><CheckCircle size={16} /></button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomFreightType(false); setCustomFreightTypeVal(''); }}><X size={16} /></button>
                      </div>
                    ) : (
                      <select className="form-control" name="freight_type" value={form.freight_type || ''} onChange={e => {
                        if (e.target.value === 'custom') setIsCustomFreightType(true);
                        else handleChange(e);
                      }}>
                        <option value="">Select...</option>
                        {options.masters?.freight_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Freight Type...</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group"><label>Freight Chg</label><input type="number" className="form-control" name="freight_chg" value={form.freight_chg} onChange={handleChange} /></div>
                  <div className="form-group"><label>Insurance Chg</label><input type="number" className="form-control" name="insurance_chg" value={form.insurance_chg} onChange={handleChange} /></div>
                  <div className="form-group"><label>Total Order Kgs</label><input type="number" className="form-control" name="total_order_kgs" value={form.total_order_kgs} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Transport</label>
                    {isCustomTransport ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" className="form-control" autoFocus placeholder="Enter Transport..." value={customTransportVal} onChange={e => setCustomTransportVal(e.target.value)} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomTransport}><CheckCircle size={16} /></button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomTransport(false); setCustomTransportVal(''); }}><X size={16} /></button>
                      </div>
                    ) : (
                      <select className="form-control" name="transport" value={form.transport || ''} onChange={e => {
                        if (e.target.value === 'custom') setIsCustomTransport(true);
                        else handleChange(e);
                      }}>
                        <option value="">Select...</option>
                        {options.masters?.transport_name_master?.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Transport...</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group"><label>TAX Type</label>
                    <select className="form-control" name="tax_type" value={form.tax_type} onChange={handleChange}>
                      <option>GST</option><option>IGST</option><option>Exempt</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Taxable Amount</label><input type="number" className="form-control" name="taxable_amount" value={form.taxable_amount} onChange={handleChange} /></div>
                  <div className="form-group"><label>Dispatch Date</label><input type="date" className="form-control" name="dispatch_date" value={form.dispatch_date} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Packing Type</label>
                    {isCustomPackingType ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" className="form-control" autoFocus placeholder="Enter Packing Type..." value={customPackingTypeVal} onChange={e => setCustomPackingTypeVal(e.target.value)} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomPackingType}><CheckCircle size={16} /></button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomPackingType(false); setCustomPackingTypeVal(''); }}><X size={16} /></button>
                      </div>
                    ) : (
                      <select className="form-control" name="packing_type" value={form.packing_type || ''} onChange={e => {
                        if (e.target.value === 'custom') setIsCustomPackingType(true);
                        else handleChange(e);
                      }}>
                        <option value="">Select...</option>
                        {options.masters?.packing_type_master?.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Packing...</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group"><label>SGST %</label><input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>CGST %</label><input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} /></div>
                  <div className="form-group"><label>IGST %</label><input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} /></div>
                  
                  <div className="form-group"><label>Labeling</label><input className="form-control" name="labeling" value={form.labeling} onChange={handleChange} /></div>
                  <div className="form-group"><label>Colour</label>
                    {isCustomColour ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" className="form-control" autoFocus placeholder="Enter Colour..." value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                        <button type="button" className="btn btn-primary" style={{ padding: '8px' }} onClick={handleSaveCustomColour}><CheckCircle size={16} /></button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => { setIsCustomColour(false); setCustomColourVal(''); }}><X size={16} /></button>
                      </div>
                    ) : (
                      <select className="form-control" name="colour" value={form.colour || ''} onChange={e => {
                        if (e.target.value === 'custom') setIsCustomColour(true);
                        else handleChange(e);
                      }}>
                        <option value="">Select...</option>
                        {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom Colour...</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group"><label>Due Days</label><input type="number" className="form-control" name="due_days" value={form.due_days} onChange={handleChange} /></div>
                  <div className="form-group"><label>Nett Amount</label><input type="number" className="form-control" style={{ fontWeight: 'bold', background: '#e0f2fe', color: '#0369a1' }} name="net_amount" value={form.net_amount} onChange={handleChange} /></div>
                  
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
