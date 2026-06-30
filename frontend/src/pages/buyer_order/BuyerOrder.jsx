import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, ShoppingCart, Activity, CheckCircle, Package, Clock, Download, FileText, ChevronDown, MessageSquare, CreditCard, ClipboardList, Settings, Truck, Star, Filter } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { buyerOrderAPI, partyAPI, employeeAPI, dropdownAPI, subMasterAPI } from '../../services/api';
import SubMasterDropdown from '../../components/SubMasterDropdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function BuyerOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [editingId, setEditingId] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewModalOrder, setViewModalOrder] = useState(null);
  
  const [options, setOptions] = useState({ masters: {} });
  
  // Custom Inline Add States
  const [isCustomOrderType, setIsCustomOrderType] = useState(false);
  const [customOrderTypeVal, setCustomOrderTypeVal] = useState('');

  const getNextIbpoNumber = () => {
    let maxNum = 0;
    orders.forEach(o => {
      const val = o.ibpo_number;
      if (val && val.startsWith("IBPO-")) {
        try {
          const num = parseInt(val.split("-")[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        } catch (e) {}
      }
    });
    const nextNumStr = String(maxNum + 1).padStart(5, '0');
    return `IBPO-${nextNumStr}`;
  };
  
  const [isCustomCertifiedType, setIsCustomCertifiedType] = useState(false);
  const [customCertifiedTypeVal, setCustomCertifiedTypeVal] = useState('');
  
  const [isCustomCommissionType, setIsCustomCommissionType] = useState(false);
  const [customCommissionTypeVal, setCustomCommissionTypeVal] = useState('');
  
  const [isCustomRegularSpecial, setIsCustomRegularSpecial] = useState(false);
  const [customRegularSpecialVal, setCustomRegularSpecialVal] = useState('');

  const [isCustomPaymentTerms, setIsCustomPaymentTerms] = useState(false);
  const [customPaymentTermsVal, setCustomPaymentTermsVal] = useState('');
  const [isCustomPartyTerms, setIsCustomPartyTerms] = useState(false);
  const [customPartyTermsVal, setCustomPartyTermsVal] = useState('');

  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [customStatusVal, setCustomStatusVal] = useState('');

  const [isCustomTransportMode, setIsCustomTransportMode] = useState(false);
  const [customTransportModeVal, setCustomTransportModeVal] = useState('');

  const [isCustomTransportName, setIsCustomTransportName] = useState(false);
  const [customTransportNameVal, setCustomTransportNameVal] = useState('');

  const [isCustomLRType, setIsCustomLRType] = useState(false);
  const [customLRTypeVal, setCustomLRTypeVal] = useState('');

  const [isCustomLRTerms, setIsCustomLRTerms] = useState(false);
  const [customLRTermsVal, setCustomLRTermsVal] = useState('');

  const [isCustomBuyer, setIsCustomBuyer] = useState(false);
  const [customBuyerVal, setCustomBuyerVal] = useState('');

  const [isCustomAgent, setIsCustomAgent] = useState(false);
  const [customAgentVal, setCustomAgentVal] = useState('');

  const [isCustomProcessSequence, setIsCustomProcessSequence] = useState(false);
  const [customProcessSequenceVal, setCustomProcessSequenceVal] = useState('');

  const [customAddItem, setCustomAddItem] = useState({ field: null, index: null, val: '' });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    ibpo_number: '',
    order_date: new Date().toISOString().split('T')[0],
    party_id: '', party_name: '', billing_address: '', agent_name: '',
    order_type: '', certified_type: '', buyer_name: '',
    state: '', state_code: '', gst_no: '', pan_no: '',
    commission_type: '', commission_pct: 0, order_taken_by: '', merchandiser: '',
    nomination_type: '', regular_special: '',

    outstanding: 0, overdue: 0, due_30_days: 0, status: '',
    status_remark: '', max_crd_days: 0, po_credit: 0, po_max_crd: 0, bill_credit: 0,
    payment_detail: '', payment_terms: '', payment_file_path: '',

    transport_mode: '', transport_name: '', party_terms: '',
    lr_type: '', lr_terms: '', party_comp_date: '', exfactory_date: '',
    delivery_starting: '', delivery_at: '', desp_mtr_min: 0, desp_mtr_max: 0,
    delivery_place: '', delivery_address: '',

    process_sequence: '',
    process_instruction: '', email_to: '', email_cc: '',
    yarn_instruction: '', prod_instruction: '', delivery_instruction: '', remarks: '',

    items: [{
      party_po_no: '', po_date: '', point_of_contact: '', order_mtrs: 0, uom: 'MTR',
      tolerance_pct: 0, total_mtr_yard: 0, hsn_code: '', sample_mtr: 0, buyer_style: '',
      design_no: '', gry_construction: '', fabric_type: 'Cotton', color: '',
      construction: '', weaving_type: 'Plain', pick_on_table: 0, print_name: '',
      finish_reed: 0, finish_pick: 0, finish_width: 0, cuttable_width: 0, pattern: '',
      packing_type: '', loom_type: '', insurance: 'No', packing_charge: 0, end_use: '',
      season: 'All Season', party_comment: '', fabric_content: '', development_id: '',
      country: 'India', combo: '', currency: 'INR', pc_type: '', gsm: 0, price: 0,
      gst_pct: 0, gst_rate: 0, rate: 0, amount: 0, image_design_path: '', party_terms: ''
    }]
  };

  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      const [ordersRes, partiesRes, empRes, dropdownsRes] = await Promise.all([
        buyerOrderAPI.list(),
        partyAPI.list(),
        employeeAPI.list(),
        dropdownAPI.getAll()
      ]);
      setOrders(ordersRes.data);
      setParties(partiesRes.data);
      setEmployees(empRes.data);
      setOptions(dropdownsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshDropdownOptions = async () => {
    try {
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropdownChange = (name, val) => {
    setForm(prev => ({ ...prev, [name]: val }));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (queryId && orders.length > 0) {
      const matched = orders.find(o => String(o.id) === String(queryId));
      if (matched) {
        handleOpenForm(matched, true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [queryId, orders]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.party_id) payload.party_id = null;

      ['party_comp_date', 'exfactory_date', 'delivery_starting'].forEach(field => {
        if (!payload[field]) payload[field] = null;
      });
      payload.items = payload.items.map(item => {
        const itemCopy = { ...item };
        if (!itemCopy.po_date) itemCopy.po_date = null;
        return itemCopy;
      });

      if (editingId) {
        await buyerOrderAPI.update(editingId, payload);
      } else {
        await buyerOrderAPI.create(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving buyer order');
      console.error(err);
    }
  };

  const handleOpenForm = async (order, readOnly = false) => {
    try {
      const { data } = await buyerOrderAPI.get(order.id);

      const sanitize = (obj) => {
        const res = { ...obj };
        for (const k in res) {
          if (res[k] === null) res[k] = '';
        }
        return res;
      };

      const editForm = { ...initialForm, ...sanitize(data) };

      if (editForm.order_date) editForm.order_date = editForm.order_date.substring(0, 10);
      if (editForm.party_comp_date) editForm.party_comp_date = editForm.party_comp_date.substring(0, 10);
      if (editForm.exfactory_date) editForm.exfactory_date = editForm.exfactory_date.substring(0, 10);
      if (editForm.delivery_starting) editForm.delivery_starting = editForm.delivery_starting.substring(0, 10);

      if (editForm.items) {
        editForm.items = editForm.items.map(i => {
          const s = sanitize(i);
          if (s.po_date) s.po_date = s.po_date.substring(0, 10);
          return s;
        });
      }

      setForm(editForm);
      setEditingId(data.id);
      setActiveTab('main');
      setIsReadOnly(readOnly);
      setShowForm(true);
      setSelectedViewOrder(null);
    } catch (err) {
      alert("Error loading order details.");
    }
  };

  const handleDelete = async (id, ibpo, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete order ${ibpo}?`)) {
      try {
        await buyerOrderAPI.delete(id);
        if (selectedViewOrder?.id === id) setSelectedViewOrder(null);
        loadData();
      } catch (err) {
        alert('Error deleting order');
        console.error(err);
      }
    }
  };

  const handleRowClick = async (order) => {
    try {
      const { data } = await buyerOrderAPI.get(order.id);
      setSelectedViewOrder(data);
    } catch (err) {
      console.error("Error fetching order details", err);
    }
  };

  const handlePartyChange = (e) => {
    const partyId = e.target.value;
    const party = parties.find(p => p.id.toString() === partyId);
    
    let fullAddress = '';
    if (party) {
      fullAddress = [party.address, party.city, party.district, party.state, party.country]
        .filter(Boolean)
        .join(', ');
      if (party.pin_code) {
        fullAddress += ` - ${party.pin_code}`;
      }
    }

    setForm({
      ...form,
      party_id: partyId,
      party_name: party?.company_name || '',
      buyer_name: party?.buyer_name || party?.company_name || '',
      billing_address: fullAddress || '',
      state: party?.state || '',
      agent_name: party?.agent_name || '',
      order_taken_by: party?.manager || '',
      merchandiser: party?.merchandiser || '',
      gst_no: party?.gst_no || '',
      pan_no: party?.pan_no || '',
    });
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
          const fallback = document.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
          if (fallback) fallback.focus();
        }
      }, 100);
    }
  };

  const handleSupportingDocChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await buyerOrderAPI.uploadFile(file);
      setForm(prev => ({ ...prev, payment_file_path: res.data.file_path }));
    } catch (err) {
      alert("Error uploading file: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDesignFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await buyerOrderAPI.uploadFile(file);
      updateItem(index, 'image_design_path', res.data.file_path);
    } catch (err) {
      alert("Error uploading design file: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    
    if (name === 'order_type' && value === 'custom_add_new') {
      setIsCustomOrderType(true);
      return;
    }
    
    if (name === 'certified_type' && value === 'custom_add_new') {
      setIsCustomCertifiedType(true);
      return;
    }
    
    if (name === 'commission_type' && value === 'custom_add_new') {
      setIsCustomCommissionType(true);
      return;
    }
    
    if (name === 'regular_special' && value === 'custom_add_new') {
      setIsCustomRegularSpecial(true);
      return;
    }
    
    if (name === 'payment_terms' && value === 'custom_add_new') {
      setIsCustomPaymentTerms(true);
      return;
    }
    
    if (name === 'party_terms' && value === 'custom_add_new') {
      setIsCustomPartyTerms(true);
      return;
    }
    
    if (name === 'status' && value === 'custom_add_new') {
      setIsCustomStatus(true);
      return;
    }
    
    if (name === 'transport_mode' && value === 'custom_add_new') {
      setIsCustomTransportMode(true);
      return;
    }
    
    if (name === 'transport_name' && value === 'custom_add_new') {
      setIsCustomTransportName(true);
      return;
    }
    
    if (name === 'lr_type' && value === 'custom_add_new') {
      setIsCustomLRType(true);
      return;
    }
    
    if (name === 'lr_terms' && value === 'custom_add_new') {
      setIsCustomLRTerms(true);
      return;
    }
    
    if (name === 'buyer_name') {
      if (value === 'custom_add_new') {
        setIsCustomBuyer(true);
        return;
      }
      const party = parties.find(p => p.company_name === value);
      if (party) {
        let fullAddress = [party.address, party.city, party.district, party.state, party.country]
          .filter(Boolean)
          .join(', ');
        if (party.pin_code) {
          fullAddress += ` - ${party.pin_code}`;
        }
        setForm(prev => ({
          ...prev,
          buyer_name: value,
          billing_address: fullAddress || '',
          state: party.state || '',
          gst_no: party.gst_no || '',
          pan_no: party.pan_no || ''
        }));
      } else {
        setForm(prev => ({ ...prev, buyer_name: value }));
      }
      return;
    }
    
    if (name === 'agent_name' && value === 'custom_add_new') {
      setIsCustomAgent(true);
      return;
    }
    
    if (name === 'process_sequence' && value === 'custom_add_new') {
      setIsCustomProcessSequence(true);
      return;
    }
    
    if (type === 'number') value = parseFloat(value) || 0;
    setForm({ ...form, [name]: value });
  };

  const handleSaveCustomOrderType = async () => {
    if (!customOrderTypeVal.trim()) {
      setIsCustomOrderType(false);
      return;
    }
    try {
      await subMasterAPI.create('order_type_master', { entity: 'order_type_master', name: customOrderTypeVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, order_type: customOrderTypeVal.trim() });
      setIsCustomOrderType(false);
      setCustomOrderTypeVal('');
    } catch (err) {
      alert("Error saving custom order type");
      console.error(err);
    }
  };

  const handleSaveCustomCertifiedType = async () => {
    if (!customCertifiedTypeVal.trim()) {
      setIsCustomCertifiedType(false);
      return;
    }
    try {
      await subMasterAPI.create('certified_type', { entity: 'certified_type', name: customCertifiedTypeVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, certified_type: customCertifiedTypeVal.trim() });
      setIsCustomCertifiedType(false);
      setCustomCertifiedTypeVal('');
    } catch (err) {
      alert("Error saving custom certified type");
      console.error(err);
    }
  };

  const handleSaveCustomCommissionType = async () => {
    if (!customCommissionTypeVal.trim()) {
      setIsCustomCommissionType(false);
      return;
    }
    try {
      await subMasterAPI.create('commission_type_master', { entity: 'commission_type_master', name: customCommissionTypeVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, commission_type: customCommissionTypeVal.trim() });
      setIsCustomCommissionType(false);
      setCustomCommissionTypeVal('');
    } catch (err) {
      alert("Error saving custom commission type");
      console.error(err);
    }
  };

  const handleSaveCustomRegularSpecial = async () => {
    if (!customRegularSpecialVal.trim()) {
      setIsCustomRegularSpecial(false);
      return;
    }
    try {
      await subMasterAPI.create('regular_special_master', { entity: 'regular_special_master', name: customRegularSpecialVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, regular_special: customRegularSpecialVal.trim() });
      setIsCustomRegularSpecial(false);
      setCustomRegularSpecialVal('');
    } catch (err) {
      alert("Error saving custom regular/special");
      console.error(err);
    }
  };

  const handleSaveCustomPaymentTerms = async () => {
    if (!customPaymentTermsVal.trim()) {
      setIsCustomPaymentTerms(false);
      return;
    }
    try {
      await subMasterAPI.create('payment_terms_master', { entity: 'payment_terms_master', name: customPaymentTermsVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, payment_terms: customPaymentTermsVal.trim() });
      setIsCustomPaymentTerms(false);
      setCustomPaymentTermsVal('');
    } catch (err) {
      alert("Error saving custom payment terms");
      console.error(err);
    }
  };

  const handleSaveCustomPartyTerms = async () => {
    if (!customPartyTermsVal.trim()) {
      setIsCustomPartyTerms(false);
      return;
    }
    try {
      await subMasterAPI.create('party_terms_master', { entity: 'party_terms_master', name: customPartyTermsVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, party_terms: customPartyTermsVal.trim() });
      setIsCustomPartyTerms(false);
      setCustomPartyTermsVal('');
    } catch (err) {
      alert("Error saving custom party terms");
      console.error(err);
    }
  };


  const handleSaveCustomStatus = async () => {
    if (!customStatusVal.trim()) {
      setIsCustomStatus(false);
      return;
    }
    try {
      await subMasterAPI.create('status_master', { entity: 'status_master', name: customStatusVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, status: customStatusVal.trim() });
      setIsCustomStatus(false);
      setCustomStatusVal('');
    } catch (err) {
      alert("Error saving custom status");
      console.error(err);
    }
  };

  const handleSaveCustomTransportMode = async () => {
    if (!customTransportModeVal.trim()) {
      setIsCustomTransportMode(false);
      return;
    }
    try {
      await subMasterAPI.create('transport_mode_master', { entity: 'transport_mode_master', name: customTransportModeVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, transport_mode: customTransportModeVal.trim() });
      setIsCustomTransportMode(false);
      setCustomTransportModeVal('');
    } catch (err) {
      alert("Error saving custom transport mode");
      console.error(err);
    }
  };

  const handleSaveCustomTransportName = async () => {
    if (!customTransportNameVal.trim()) {
      setIsCustomTransportName(false);
      return;
    }
    try {
      await subMasterAPI.create('transport_name_master', { entity: 'transport_name_master', name: customTransportNameVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, transport_name: customTransportNameVal.trim() });
      setIsCustomTransportName(false);
      setCustomTransportNameVal('');
    } catch (err) {
      alert("Error saving custom transport name");
      console.error(err);
    }
  };

  const handleSaveCustomLRType = async () => {
    if (!customLRTypeVal.trim()) {
      setIsCustomLRType(false);
      return;
    }
    try {
      await subMasterAPI.create('lr_type_master', { entity: 'lr_type_master', name: customLRTypeVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, lr_type: customLRTypeVal.trim() });
      setIsCustomLRType(false);
      setCustomLRTypeVal('');
    } catch (err) {
      alert("Error saving custom LR type");
      console.error(err);
    }
  };

  const handleSaveCustomLRTerms = async () => {
    if (!customLRTermsVal.trim()) {
      setIsCustomLRTerms(false);
      return;
    }
    try {
      await subMasterAPI.create('lr_terms', { entity: 'lr_terms', name: customLRTermsVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, lr_terms: customLRTermsVal.trim() });
      setIsCustomLRTerms(false);
      setCustomLRTermsVal('');
    } catch (err) {
      alert("Error saving custom LR terms");
      console.error(err);
    }
  };

  const handleSaveCustomBuyer = async () => {
    if (!customBuyerVal.trim()) {
      setIsCustomBuyer(false);
      return;
    }
    try {
      await subMasterAPI.create('buyer', { entity: 'buyer', name: customBuyerVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, buyer_name: customBuyerVal.trim() });
      setIsCustomBuyer(false);
      setCustomBuyerVal('');
    } catch (err) {
      alert("Error saving custom buyer");
      console.error(err);
    }
  };

  const handleSaveCustomAgent = async () => {
    if (!customAgentVal.trim()) {
      setIsCustomAgent(false);
      return;
    }
    try {
      await partyAPI.create({ company_name: customAgentVal.trim(), party_type: 'Agent' });
      const partiesRes = await partyAPI.list();
      setParties(partiesRes.data);
      setForm({ ...form, agent_name: customAgentVal.trim() });
      setIsCustomAgent(false);
      setCustomAgentVal('');
    } catch (err) {
      alert("Error saving custom agent");
      console.error(err);
    }
  };

  const handleSaveCustomProcessSequence = async () => {
    if (!customProcessSequenceVal.trim()) {
      setIsCustomProcessSequence(false);
      return;
    }
    try {
      await subMasterAPI.create('process_sequence_master', { entity: 'process_sequence_master', name: customProcessSequenceVal.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      setForm({ ...form, process_sequence: customProcessSequenceVal.trim() });
      setIsCustomProcessSequence(false);
      setCustomProcessSequenceVal('');
    } catch (err) {
      alert("Error saving custom process sequence");
      console.error(err);
    }
  };

  const handleSaveCustomItem = async (entity) => {
    if (!customAddItem.val.trim()) {
      setCustomAddItem({ field: null, index: null, val: '' });
      return;
    }
    try {
      await subMasterAPI.create(entity, { entity: entity, name: customAddItem.val.trim(), is_active: true });
      const dropdownsRes = await dropdownAPI.getAll();
      setOptions(dropdownsRes.data);
      
      const newItems = [...form.items];
      if (customAddItem.field === 'packing_type') {
        const currentVal = newItems[customAddItem.index]['packing_type'] || '';
        const selected = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!selected.includes(customAddItem.val.trim())) {
          selected.push(customAddItem.val.trim());
        }
        newItems[customAddItem.index]['packing_type'] = selected.join(', ');
      } else {
        newItems[customAddItem.index][customAddItem.field] = customAddItem.val.trim();
      }
      setForm({ ...form, items: newItems });
      
      setCustomAddItem({ field: null, index: null, val: '' });
    } catch (err) {
      alert("Error saving custom option");
      console.error(err);
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });

  const updateItem = (index, field, value) => {
    if (value === 'custom_add_new') {
      setCustomAddItem({ field, index, val: '' });
      return;
    }
    const newItems = [...form.items];
    let val = value;
    if (['order_mtrs', 'rate', 'tolerance_pct', 'sample_mtr', 'pick_on_table', 'finish_reed', 'finish_pick', 'finish_width', 'cuttable_width', 'packing_charge', 'gsm', 'price', 'gst_pct', 'gst_rate'].includes(field)) {
      val = parseFloat(value) || 0;
    }
    newItems[index][field] = val;

    if (field === 'order_mtrs' || field === 'rate') {
      const mtrs = field === 'order_mtrs' ? val : (newItems[index].order_mtrs || 0);
      const rate = field === 'rate' ? val : (newItems[index].rate || 0);
      newItems[index].amount = mtrs * rate;
    }
    setForm({ ...form, items: newItems });
  };

  const renderItemDropdown = (label, field, entity, index, item) => (
    <SubMasterDropdown
      label={label}
      name={field}
      value={item[field] || ''}
      entity={entity}
      options={options}
      onChange={(fieldName, val) => updateItem(index, fieldName, val)}
      onOptionsRefresh={refreshDropdownOptions}
    />
  );

  const renderPackingTypeCheckboxes = (index, item) => {
    const field = 'packing_type';
    const entity = 'packing_type_master';
    const currentVal = item.packing_type || '';
    const selected = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];
    const availableOptions = options?.masters?.[entity] || [];

    const handleCheckboxChange = (opt, isChecked) => {
      let newSelected = [...selected];
      if (isChecked) {
        if (!newSelected.includes(opt)) newSelected.push(opt);
      } else {
        newSelected = newSelected.filter(s => s !== opt);
      }
      updateItem(index, field, newSelected.join(', '));
    };

    return (
      <div className="form-group" style={{ gridColumn: 'span 5' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>Packing Type</label>
        {customAddItem.field === field && customAddItem.index === index ? (
          <div style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
            <input 
              autoFocus 
              type="text" 
              className="form-control" 
              placeholder="New Packing Type..." 
              value={customAddItem.val} 
              onChange={(e) => setCustomAddItem({ ...customAddItem, val: e.target.value })} 
            />
            <button type="button" className="btn btn-primary" onClick={() => handleSaveCustomItem(entity)} style={{ padding: '6px' }}>Save</button>
            <button type="button" className="btn btn-secondary" onClick={() => setCustomAddItem({ field: null, index: null, val: '' })} style={{ padding: '6px' }}>X</button>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', minHeight: '38px', background: '#fff' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', alignItems: 'center' }}>
              {availableOptions.map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500, margin: 0, userSelect: 'none', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={(e) => handleCheckboxChange(opt, e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '11px', height: '24px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => setCustomAddItem({ field, index, val: '' })}
              >
                + Add Custom
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'main', label: 'Main Details', icon: FileText },
    { id: 'payment', label: 'Payment Details', icon: CreditCard },
    { id: 'items', label: 'Party PO Details', icon: ClipboardList },
    { id: 'transport', label: 'Transport & Delivery', icon: Truck },
    { id: 'process', label: 'Process Follow', icon: Settings },
    { id: 'instructions', label: 'Instructions', icon: MessageSquare }
  ];

  const filteredOrders = orders.filter(o => {
    const matchesSearch = searchTerm === '' ||
      o.ibpo_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.party_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All Types' || (o.order_type || 'Regular') === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || o.status === statusFilter;

    let matchesDate = true;
    if (o.order_date) {
      const orderDate = new Date(o.order_date);
      if (fromDate) matchesDate = matchesDate && orderDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && orderDate <= tDate;
      }
    }
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const totalOrders = orders.length;
  const regularOrders = orders.filter(o => (o.order_type || 'Regular') === 'Regular').length;
  const specialOrders = orders.filter(o => o.order_type === 'Special').length;
  const activeOrders = orders.filter(o => o.status === 'Active').length;

  const handleCardClick = (type) => {
    if (type === 'Total') {
      setTypeFilter('All Types');
      setStatusFilter('All Status');
    } else if (type === 'Regular') {
      setTypeFilter('Regular');
      setStatusFilter('All Status');
    } else if (type === 'Special') {
      setTypeFilter('Special');
      setStatusFilter('All Status');
    } else if (type === 'Active') {
      setTypeFilter('All Types');
      setStatusFilter('Active');
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Dinesh Textile - Buyer Orders Report", 14, 15);
    const headers = [["IBPO No", "Date", "Party Name", "Order Type", "Agent", "Status"]];
    const rows = filteredOrders.map(o => [
      o.ibpo_number || '-',
      o.order_date ? new Date(o.order_date).toLocaleDateString() : '-',
      o.party_name || '-',
      o.order_type || '-',
      o.agent_name || '-',
      o.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Buyer_Orders_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredOrders.map(o => ({
      "IBPO No": o.ibpo_number,
      "Order Date": o.order_date ? new Date(o.order_date).toLocaleDateString() : '-',
      "Party Name": o.party_name,
      "Order Type": o.order_type,
      "Certified Type": o.certified_type,
      "Buyer Name": o.buyer_name,
      "Agent Name": o.agent_name,
      "Payment Terms": o.payment_terms,
      "Delivery Place": o.delivery_place,
      "Status": o.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buyer Orders");
    XLSX.writeFile(wb, `Buyer_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isSalesParty = (p) => {
    if (!p) return false;
    const type = (p.party_type || '').toLowerCase();
    const group = (p.party_group || '').toLowerCase();

    // Exclude service providers (job workers, processors, logistics, agents, etc.)
    const excludeTerms = [
      'job', 'worker', 'processor', 'dyeing', 'weaving', 'weaver', 'warping', 
      'sizing', 'printing', 'finishing', 'doubling', 'twisting', 'converter', 
      'coverter', 'loom', 'logistics', 'agent', 'courier', 'postage', 'testing', 
      'lab', 'washing', 'service'
    ];

    if (excludeTerms.some(term => type.includes(term) || group.includes(term))) {
      return false;
    }

    return (
      type.includes('sales') ||
      type.includes('customer') ||
      type.includes('buyer') ||
      group.includes('customer') ||
      group.includes('buyer')
    );
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={24} color="var(--primary)" /> Buyer Orders
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage all buyer orders, payments, and logistics.</p>
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
                <Plus size={16} /> New Order
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', border: typeFilter === 'All Types' && statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><ShoppingCart size={24} /></div>
              <div className="stat-details"><h3>Total Orders</h3><div className="value">{totalOrders}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Regular')} style={{ cursor: 'pointer', border: typeFilter === 'Regular' ? '2px solid #10b981' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Regular Orders</h3><div className="value">{regularOrders}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Special')} style={{ cursor: 'pointer', border: typeFilter === 'Special' ? '2px solid #f59e0b' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Star size={24} /></div>
              <div className="stat-details"><h3>Special Orders</h3><div className="value">{specialOrders}</div></div>
            </div>
            <div className="card stat-card" onClick={() => handleCardClick('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #8b5cf6' : '1px solid transparent' }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><CheckCircle size={24} /></div>
              <div className="stat-details"><h3>Active Orders</h3><div className="value">{activeOrders}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search by IBPO or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}><Filter size={16} /><span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span></div>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option>
                {options?.masters?.['order_type_master']?.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                {options?.masters?.['status_master']?.map(opt => <option key={opt}>{opt}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>IBPO No</th><th>Order Date</th><th>Party Name</th>
                      <th>Type</th><th>Items</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No buyer orders found.</td></tr>
                    ) : filteredOrders.map(o => (
                      <tr
                        key={o.id}
                        onClick={() => handleRowClick(o)}
                        style={{ cursor: 'pointer', background: selectedViewOrder?.id === o.id ? 'var(--bg-secondary)' : 'transparent' }}
                      >
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.ibpo_number}</td>
                        <td>{o.order_date}</td>
                        <td style={{ fontWeight: 500 }}>{o.party_name}</td>
                        <td><span className="badge badge-active">{o.order_type || 'Regular'}</span></td>
                        <td>{o.items?.length || 0} items</td>
                        <td><span className={`badge ${o.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{o.status}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={(evt) => { evt.stopPropagation(); setViewModalOrder(o); }}
                              title="Preview Order"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(o, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={(e) => handleDelete(o.id, o.ibpo_number, e)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
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
                    <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 700 }}>
                      <ShoppingCart size={18} /> {selectedViewOrder.ibpo_number}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setViewModalOrder(selectedViewOrder)}
                        title="Preview Order"
                      >
                        <Eye size={16} color="var(--primary)" />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewOrder, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="Party Name" value={selectedViewOrder.party_name} />
                    <DetailRow label="Order Date" value={selectedViewOrder.order_date} />
                    <DetailRow label="Order Type" value={<span className="badge badge-active">{selectedViewOrder.order_type || 'Regular'}</span>} />
                    <DetailRow label="Status" value={selectedViewOrder.status} />
                    <DetailRow label="Order Taken By" value={selectedViewOrder.order_taken_by} />
                    <DetailRow label="Merchandiser" value={selectedViewOrder.merchandiser} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial</h4>
                    <DetailRow label="Outstanding" value={selectedViewOrder.outstanding} />
                    <DetailRow label="Payment Terms" value={selectedViewOrder.payment_terms} />
                    <DetailRow label="Commission Type" value={selectedViewOrder.commission_type} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transport</h4>
                    <DetailRow label="Transport Mode" value={selectedViewOrder.transport_mode} />
                    <DetailRow label="Delivery Place" value={selectedViewOrder.delivery_place} />
                    <DetailRow label="Party Comp Date" value={selectedViewOrder.party_comp_date} />
                    <DetailRow label="Ex-Factory Date" value={selectedViewOrder.exfactory_date} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Line Items ({selectedViewOrder.items?.length || 0})</h4>
                    {selectedViewOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>PO: {item.party_po_no || 'N/A'} - {item.fabric_type}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Mtrs: {item.order_mtrs}</span>
                          <span>Rate: {item.rate}</span>
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
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Buyer Order Details' : editingId ? 'Edit Buyer Order' : 'New Buyer Order Entry'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}><X size={16} /> Close</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={handleCreate}><Save size={16} /> {editingId ? 'Update Order' : 'Save Order'}</button>
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
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              {/* MAIN DETAILS */}
              {activeTab === 'main' && (
                <div className="animate-fade">
                  {/* Section 1: Main Details */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Main Details</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group">
                      <label>IBPO Number</label>
                      <input type="text" className="form-control" value={form.ibpo_number || (editingId ? 'AUTO-GENERATED' : getNextIbpoNumber())} disabled style={{ background: 'rgba(0,0,0,0.05)', fontWeight: 600, color: 'var(--primary)' }} />
                    </div>
                    <div className="form-group">
                      <label>Order Date *</label>
                      <input type="date" className="form-control" name="order_date" value={form.order_date} onChange={handleChange} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Party Name *</label>
                      <select className="form-control" required value={form.party_id} onChange={handlePartyChange}>
                        <option value="">Select Party...</option>
                        {parties.filter(isSalesParty).map(p => (
                          <option key={p.id} value={p.id}>{p.company_name} ({p.customer_code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Buyer Name</label>
                      {isCustomBuyer ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input autoFocus type="text" className="form-control" placeholder="New Buyer Name..." value={customBuyerVal} onChange={(e) => setCustomBuyerVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomBuyer} style={{ padding: '6px' }}>Save</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomBuyer(false)} style={{ padding: '6px' }}>X</button>
                        </div>
                      ) : (
                        <select className="form-control" name="buyer_name" value={form.buyer_name} onChange={handleChange}>
                          <option value="">-- Select Buyer Name --</option>
                          {form.buyer_name && !parties.filter(isSalesParty).some(p => p.company_name === form.buyer_name) && (
                            <option value={form.buyer_name}>{form.buyer_name}</option>
                          )}
                          {parties.filter(isSalesParty).map(p => (
                            <option key={p.id} value={p.company_name}>{p.company_name} ({p.customer_code})</option>
                          ))}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 600 }}>+ Add Custom Option...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Address</label>
                      <input className="form-control" name="billing_address" value={form.billing_address} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input className="form-control" name="state" value={form.state} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Agent Name</label>
                      {isCustomAgent ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input autoFocus type="text" className="form-control" placeholder="New Agent Name..." value={customAgentVal} onChange={(e) => setCustomAgentVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomAgent} style={{ padding: '6px' }}>Save</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomAgent(false)} style={{ padding: '6px' }}>X</button>
                        </div>
                      ) : (
                        <select className="form-control" name="agent_name" value={form.agent_name} onChange={handleChange}>
                          <option value="">-- Select Agent Name --</option>
                          {form.agent_name && !parties.some(p => p.party_type === 'Agent' && p.company_name === form.agent_name) && (
                            <option value={form.agent_name}>{form.agent_name}</option>
                          )}
                          {parties.filter(p => p.party_type === 'Agent').map(ag => <option key={ag.id} value={ag.company_name}>{ag.company_name}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 600 }}>+ Add Custom Option...</option>
                        </select>
                      )}
                    </div>
                    <SubMasterDropdown
                      label="Order Type"
                      name="order_type"
                      value={form.order_type || ''}
                      entity="order_type_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="Certified Type"
                      name="certified_type"
                      value={form.certified_type || ''}
                      entity="certified_type"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group">
                      <label>GST No</label>
                      <input className="form-control" name="gst_no" value={form.gst_no} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PAN No</label>
                      <input className="form-control" name="pan_no" value={form.pan_no} onChange={handleChange} />
                    </div>
                    <SubMasterDropdown
                      label="Commission Type"
                      name="commission_type"
                      value={form.commission_type || ''}
                      entity="commission_type_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group">
                      <label>Commission Value</label>
                      <input type="number" className="form-control" name="commission_pct" value={form.commission_pct} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Order Taken By</label>
                      <select className="form-control" name="order_taken_by" value={form.order_taken_by} onChange={handleChange}>
                        <option value="">Select Employee...</option>
                        {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Merchandiser</label>
                      <select className="form-control" name="merchandiser" value={form.merchandiser} onChange={handleChange}>
                        <option value="">Select Merchandiser...</option>
                        {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nomination</label>
                      <input className="form-control" name="nomination_type" value={form.nomination_type} onChange={handleChange} />
                    </div>
                    <SubMasterDropdown
                      label="Regular / Special"
                      name="regular_special"
                      value={form.regular_special || ''}
                      entity="regular_special_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                      onKeyDown={(e) => handleKeyDownTabTransition(e, 'payment', 'outstanding')}
                    />
                  </div>

                  {/* Section 2: Payment Details */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Payment Details</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>Outstanding</label><input type="number" className="form-control" name="outstanding" value={form.outstanding} onChange={handleChange} /></div>
                    <div className="form-group"><label>Over Due</label><input type="number" className="form-control" name="overdue" value={form.overdue} onChange={handleChange} /></div>
                    <div className="form-group"><label>30 Days+ Due</label><input type="number" className="form-control" name="due_30_days" value={form.due_30_days} onChange={handleChange} /></div>
                    <SubMasterDropdown
                      label="Status"
                      name="status"
                      value={form.status || ''}
                      entity="status_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group"><label>Max Crd Days</label><input type="number" className="form-control" name="max_crd_days" value={form.max_crd_days} onChange={handleChange} /></div>
                    <div className="form-group"><label>PO Credit Days</label><input type="number" className="form-control" name="po_credit" value={form.po_credit} onChange={handleChange} /></div>
                    <div className="form-group"><label>PO Max Crd</label><input type="number" className="form-control" name="po_max_crd" value={form.po_max_crd} onChange={handleChange} /></div>
                    <div className="form-group"><label>Bill Credit</label><input type="number" className="form-control" name="bill_credit" value={form.bill_credit} onChange={handleChange} /></div>
                    <SubMasterDropdown
                      label="Payment Terms"
                      name="payment_terms"
                      value={form.payment_terms || ''}
                      entity="payment_terms_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Status Remark</label><input className="form-control" name="status_remark" value={form.status_remark} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Payment Detail Notes</label><input className="form-control" name="payment_detail" value={form.payment_detail} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'design_no')} /></div>
                    <div className="form-group">
                      <label>Upload Supporting Doc</label>
                      <input 
                        type="file" 
                        className="form-control" 
                        style={{ padding: '6px' }} 
                        onChange={handleSupportingDocChange}
                      />
                      {form.payment_file_path && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--primary)' }}>
                          Uploaded: <a href={`http://localhost:8000${form.payment_file_path}`} target="_blank" rel="noopener noreferrer">{form.payment_file_path.split('/').pop()}</a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Party PO Details */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Party PO Details</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-primary" onClick={addItem}><Plus size={16} /> Add Another PO Item</button>
                  </div>
                  {form.items.map((item, index) => (
                    <div key={index} style={{ border: '1px solid var(--border)', padding: 20, marginBottom: 20, borderRadius: 8, background: '#fafafa', position: 'relative' }}>
                      <button type="button" onClick={() => removeItem(index)} style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
                      <h5 style={{ marginTop: 0, marginBottom: 16, color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>Item #{index + 1} Details</h5>
                      <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        <div className="form-group"><label>Party PO No</label><input className="form-control" value={item.party_po_no} onChange={e => updateItem(index, 'party_po_no', e.target.value)} /></div>
                        <div className="form-group"><label>PO Date</label><input type="date" className="form-control" value={item.po_date} onChange={e => updateItem(index, 'po_date', e.target.value)} /></div>
                        <div className="form-group"><label>Design No</label><input className="form-control" value={item.design_no} onChange={e => updateItem(index, 'design_no', e.target.value)} /></div>
                        {renderItemDropdown('Fabric Type', 'fabric_type', 'fabric_type_master', index, item)}
                        {renderItemDropdown('Color', 'color', 'color_master', index, item)}

                        <div className="form-group"><label>Order Qty</label><input type="number" className="form-control" value={item.order_mtrs} onChange={e => updateItem(index, 'order_mtrs', e.target.value)} /></div>
                        {renderItemDropdown('UOM', 'uom', 'uom_master', index, item)}
                        <div className="form-group"><label>Rate</label><input type="number" className="form-control" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} /></div>
                        <div className="form-group"><label>Amount</label><input type="number" className="form-control" value={item.amount} disabled style={{ background: '#e5e7eb' }} /></div>
                        {renderItemDropdown('HSN Code', 'hsn_code', 'hsn_code_master', index, item)}

                        <div className="form-group"><label>Point of Contact</label><input className="form-control" value={item.point_of_contact} onChange={e => updateItem(index, 'point_of_contact', e.target.value)} /></div>
                        <div className="form-group"><label>Tolerance %</label><input type="number" className="form-control" value={item.tolerance_pct} onChange={e => updateItem(index, 'tolerance_pct', e.target.value)} /></div>
                        <div className="form-group"><label>Sample Qty</label><input type="number" className="form-control" value={item.sample_mtr} onChange={e => updateItem(index, 'sample_mtr', e.target.value)} /></div>
                        <div className="form-group"><label>Party Style</label><input className="form-control" value={item.buyer_style} onChange={e => updateItem(index, 'buyer_style', e.target.value)} /></div>
                        <div className="form-group"><label>Country</label><input className="form-control" value={item.country} onChange={e => updateItem(index, 'country', e.target.value)} /></div>

                        <div className="form-group"><label>Finished Construction</label><input className="form-control" value={item.construction} onChange={e => updateItem(index, 'construction', e.target.value)} /></div>
                        <div className="form-group"><label>Gry Construction</label><input className="form-control" value={item.gry_construction} onChange={e => updateItem(index, 'gry_construction', e.target.value)} /></div>
                        {renderItemDropdown('Weaving Type', 'weaving_type', 'weaving_type_master', index, item)}
                        <div className="form-group"><label>Pick on Table</label><input type="number" className="form-control" value={item.pick_on_table} onChange={e => updateItem(index, 'pick_on_table', e.target.value)} /></div>
                        <div className="form-group"><label>Finish Width</label><input type="number" className="form-control" value={item.finish_width} onChange={e => updateItem(index, 'finish_width', e.target.value)} /></div>

                        <div className="form-group"><label>Pattern</label><input className="form-control" value={item.pattern} onChange={e => updateItem(index, 'pattern', e.target.value)} /></div>
                        {renderItemDropdown('End Use', 'end_use', 'end_use_master', index, item)}
                        {renderItemDropdown('Season', 'season', 'season_master', index, item)}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label>Upload Design File</label>
                          <input 
                            type="file" 
                            className="form-control" 
                            style={{ padding: '6px' }} 
                            onChange={(e) => handleDesignFileChange(index, e)}
                          />
                          {item.image_design_path && (
                            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--primary)' }}>
                              Uploaded: <a href={`http://localhost:8000${item.image_design_path}`} target="_blank" rel="noopener noreferrer">{item.image_design_path.split('/').pop()}</a>
                            </div>
                          )}
                        </div>

                        {renderPackingTypeCheckboxes(index, item)}
                      </div>
                    </div>
                  ))}

                  {/* Section 4: Transport & Delivery */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Transport & Delivery</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <SubMasterDropdown
                      label="Transport Mode"
                      name="transport_mode"
                      value={form.transport_mode || ''}
                      entity="transport_mode_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="Transport Name"
                      name="transport_name"
                      value={form.transport_name || ''}
                      entity="transport_name_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="Party Terms"
                      name="party_terms"
                      value={form.party_terms || ''}
                      entity="party_terms_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="LR Type"
                      name="lr_type"
                      value={form.lr_type || ''}
                      entity="lr_type_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="LR Terms"
                      name="lr_terms"
                      value={form.lr_terms || ''}
                      entity="lr_terms"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group"><label>Party Comp Date</label><input type="date" className="form-control" name="party_comp_date" value={form.party_comp_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Exfactory Date</label><input type="date" className="form-control" name="exfactory_date" value={form.exfactory_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Starting</label><input type="date" className="form-control" name="delivery_starting" value={form.delivery_starting} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery At</label><input className="form-control" name="delivery_at" value={form.delivery_at} onChange={handleChange} /></div>
                    <div className="form-group"><label>Desp Mtr Min</label><input type="number" className="form-control" name="desp_mtr_min" value={form.desp_mtr_min} onChange={handleChange} /></div>
                    <div className="form-group"><label>Desp Mtr Max</label><input type="number" className="form-control" name="desp_mtr_max" value={form.desp_mtr_max} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Place</label><input className="form-control" name="delivery_place" value={form.delivery_place} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Delivery Address</label><input className="form-control" name="delivery_address" value={form.delivery_address} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'process', 'process_sequence')} /></div>
                  </div>

                  {/* Section 5: Process Follow */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Process Follow</h4>
                    <SubMasterDropdown
                      label="Process Follow Sequence"
                      name="process_sequence"
                      value={form.process_sequence || ''}
                      entity="process_sequence_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                      onKeyDown={(e) => handleKeyDownTabTransition(e, 'instructions', 'email_to')}
                    />

                  {/* Section 6: Instructions */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Instructions</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group"><label>Email TO</label><input className="form-control" name="email_to" value={form.email_to} onChange={handleChange} /></div>
                    <div className="form-group"><label>Email CC</label><input className="form-control" name="email_cc" value={form.email_cc} onChange={handleChange} /></div>
                    <div className="form-group"><label>Process Instruction</label><textarea className="form-control" name="process_instruction" value={form.process_instruction} onChange={handleChange} /></div>
                    <div className="form-group"><label>Yarn Instruction</label><textarea className="form-control" name="yarn_instruction" value={form.yarn_instruction} onChange={handleChange} /></div>
                    <div className="form-group"><label>Production Instruction</label><textarea className="form-control" name="prod_instruction" value={form.prod_instruction} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Instruction</label><textarea className="form-control" name="delivery_instruction" value={form.delivery_instruction} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>General Remarks</label><textarea className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                  </div>
                </div>
              )}

              {/* PAYMENT DETAILS */}
              {activeTab === 'payment' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>Outstanding</label><input type="number" className="form-control" name="outstanding" value={form.outstanding} onChange={handleChange} /></div>
                    <div className="form-group"><label>Over Due</label><input type="number" className="form-control" name="overdue" value={form.overdue} onChange={handleChange} /></div>
                    <div className="form-group"><label>30 Days+ Due</label><input type="number" className="form-control" name="due_30_days" value={form.due_30_days} onChange={handleChange} /></div>
                    <SubMasterDropdown
                      label="Status"
                      name="status"
                      value={form.status || ''}
                      entity="status_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group"><label>Max Crd Days</label><input type="number" className="form-control" name="max_crd_days" value={form.max_crd_days} onChange={handleChange} /></div>
                    <div className="form-group"><label>PO Credit Days</label><input type="number" className="form-control" name="po_credit" value={form.po_credit} onChange={handleChange} /></div>
                    <div className="form-group"><label>PO Max Crd</label><input type="number" className="form-control" name="po_max_crd" value={form.po_max_crd} onChange={handleChange} /></div>
                    <div className="form-group"><label>Bill Credit</label><input type="number" className="form-control" name="bill_credit" value={form.bill_credit} onChange={handleChange} /></div>
                    <SubMasterDropdown
                      label="Payment Terms"
                      name="payment_terms"
                      value={form.payment_terms || ''}
                      entity="payment_terms_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Status Remark</label><input className="form-control" name="status_remark" value={form.status_remark} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Payment Detail Notes</label><input className="form-control" name="payment_detail" value={form.payment_detail} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'items', 'design_no')} /></div>
                    <div className="form-group">
                      <label>Upload Supporting Doc</label>
                      <input 
                        type="file" 
                        className="form-control" 
                        style={{ padding: '6px' }} 
                        onChange={handleSupportingDocChange}
                      />
                      {form.payment_file_path && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--primary)' }}>
                          Uploaded: <a href={`http://localhost:8000${form.payment_file_path}`} target="_blank" rel="noopener noreferrer">{form.payment_file_path.split('/').pop()}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSPORT & DELIVERY */}
              {activeTab === 'transport' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <SubMasterDropdown
                      label="Transport Mode"
                      name="transport_mode"
                      value={form.transport_mode || ''}
                      entity="transport_mode_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="Transport Name"
                      name="transport_name"
                      value={form.transport_name || ''}
                      entity="transport_name_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="Party Terms"
                      name="party_terms"
                      value={form.party_terms || ''}
                      entity="party_terms_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="LR Type"
                      name="lr_type"
                      value={form.lr_type || ''}
                      entity="lr_type_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <SubMasterDropdown
                      label="LR Terms"
                      name="lr_terms"
                      value={form.lr_terms || ''}
                      entity="lr_terms"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                    />
                    <div className="form-group"><label>Party Comp Date</label><input type="date" className="form-control" name="party_comp_date" value={form.party_comp_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Exfactory Date</label><input type="date" className="form-control" name="exfactory_date" value={form.exfactory_date} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Starting</label><input type="date" className="form-control" name="delivery_starting" value={form.delivery_starting} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery At</label><input className="form-control" name="delivery_at" value={form.delivery_at} onChange={handleChange} /></div>
                    <div className="form-group"><label>Desp Mtr Min</label><input type="number" className="form-control" name="desp_mtr_min" value={form.desp_mtr_min} onChange={handleChange} /></div>
                    <div className="form-group"><label>Desp Mtr Max</label><input type="number" className="form-control" name="desp_mtr_max" value={form.desp_mtr_max} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Place</label><input className="form-control" name="delivery_place" value={form.delivery_place} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 3' }}><label>Delivery Address</label><input className="form-control" name="delivery_address" value={form.delivery_address} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'process', 'process_sequence')} /></div>
                  </div>
                </div>
              )}

              {/* PROCESS FOLLOW & INSTRUCTIONS */}
              {activeTab === 'process' && (
                <div className="animate-fade">
                  <div className="form-group">
                    <SubMasterDropdown
                      label="Process Follow Sequence"
                      name="process_sequence"
                      value={form.process_sequence || ''}
                      entity="process_sequence_master"
                      options={options}
                      onChange={handleDropdownChange}
                      onOptionsRefresh={refreshDropdownOptions}
                      onKeyDown={(e) => handleKeyDownTabTransition(e, 'instructions', 'email_to')}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'instructions' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group"><label>Email TO</label><input className="form-control" name="email_to" value={form.email_to} onChange={handleChange} /></div>
                    <div className="form-group"><label>Email CC</label><input className="form-control" name="email_cc" value={form.email_cc} onChange={handleChange} /></div>
                    <div className="form-group"><label>Process Instruction</label><textarea className="form-control" name="process_instruction" value={form.process_instruction} onChange={handleChange} /></div>
                    <div className="form-group"><label>Yarn Instruction</label><textarea className="form-control" name="yarn_instruction" value={form.yarn_instruction} onChange={handleChange} /></div>
                    <div className="form-group"><label>Production Instruction</label><textarea className="form-control" name="prod_instruction" value={form.prod_instruction} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Instruction</label><textarea className="form-control" name="delivery_instruction" value={form.delivery_instruction} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>General Remarks</label><textarea className="form-control" name="remarks" value={form.remarks} onChange={handleChange} /></div>
                  </div>
                </div>
              )}

              {/* PARTY PO DETAILS (LINE ITEMS) */}
              {activeTab === 'items' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-primary" onClick={addItem}><Plus size={16} /> Add Another PO Item</button>
                  </div>

                  {form.items.map((item, index) => (
                    <div key={index} style={{ border: '1px solid var(--border)', padding: 20, marginBottom: 20, borderRadius: 8, background: '#fafafa', position: 'relative' }}>
                      <button type="button" onClick={() => removeItem(index)} style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
                      <h4 style={{ marginTop: 0, marginBottom: 16, color: 'var(--primary)' }}>Item #{index + 1} Details</h4>
                      <div className="form-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        <div className="form-group"><label>Party PO No</label><input className="form-control" value={item.party_po_no} onChange={e => updateItem(index, 'party_po_no', e.target.value)} /></div>
                        <div className="form-group"><label>PO Date</label><input type="date" className="form-control" value={item.po_date} onChange={e => updateItem(index, 'po_date', e.target.value)} /></div>
                        <div className="form-group"><label>Design No</label><input className="form-control" value={item.design_no} onChange={e => updateItem(index, 'design_no', e.target.value)} /></div>
                        <div className="form-group"><label>Fabric Type</label>
                          <select className="form-control" value={item.fabric_type} onChange={e => updateItem(index, 'fabric_type', e.target.value)}>
                            <option>Cotton</option><option>Polyester</option><option>Blended</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Color</label><input className="form-control" value={item.color} onChange={e => updateItem(index, 'color', e.target.value)} /></div>

                        <div className="form-group"><label>Order Qty</label><input type="number" className="form-control" value={item.order_mtrs} onChange={e => updateItem(index, 'order_mtrs', e.target.value)} /></div>
                        <div className="form-group"><label>UOM</label>
                          <select className="form-control" value={item.uom} onChange={e => updateItem(index, 'uom', e.target.value)}>
                            <option>MTR</option><option>YARD</option><option>PCS</option>
                          </select>
                        </div>
                        <div className="form-group"><label>Rate</label><input type="number" className="form-control" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} /></div>
                        <div className="form-group"><label>Amount</label><input type="number" className="form-control" value={item.amount} disabled style={{ background: '#e5e7eb' }} /></div>
                        <div className="form-group"><label>HSN Code</label><input className="form-control" value={item.hsn_code} onChange={e => updateItem(index, 'hsn_code', e.target.value)} /></div>

                        <div className="form-group"><label>Point of Contact</label><input className="form-control" value={item.point_of_contact} onChange={e => updateItem(index, 'point_of_contact', e.target.value)} /></div>
                        <div className="form-group"><label>Tolerance %</label><input type="number" className="form-control" value={item.tolerance_pct} onChange={e => updateItem(index, 'tolerance_pct', e.target.value)} /></div>
                        <div className="form-group"><label>Sample Qty</label><input type="number" className="form-control" value={item.sample_mtr} onChange={e => updateItem(index, 'sample_mtr', e.target.value)} /></div>
                        <div className="form-group"><label>Party Style</label><input className="form-control" value={item.buyer_style} onChange={e => updateItem(index, 'buyer_style', e.target.value)} /></div>
                        <div className="form-group"><label>Country</label><input className="form-control" value={item.country} onChange={e => updateItem(index, 'country', e.target.value)} /></div>

                        <div className="form-group"><label>Finished Construction</label><input className="form-control" value={item.construction} onChange={e => updateItem(index, 'construction', e.target.value)} /></div>
                        <div className="form-group"><label>Gry Construction</label><input className="form-control" value={item.gry_construction} onChange={e => updateItem(index, 'gry_construction', e.target.value)} /></div>
                        {renderItemDropdown('Weaving Type', 'weaving_type', 'weaving_type_master', index, item)}
                        <div className="form-group"><label>Pick on Table</label><input type="number" className="form-control" value={item.pick_on_table} onChange={e => updateItem(index, 'pick_on_table', e.target.value)} /></div>
                        <div className="form-group"><label>Finish Width</label><input type="number" className="form-control" value={item.finish_width} onChange={e => updateItem(index, 'finish_width', e.target.value)} /></div>

                        <div className="form-group"><label>Pattern</label><input className="form-control" value={item.pattern} onChange={e => updateItem(index, 'pattern', e.target.value)} /></div>
                        {renderItemDropdown('End Use', 'end_use', 'end_use_master', index, item)}
                        {renderItemDropdown('Season', 'season', 'season_master', index, item)}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label>Upload Design File</label>
                          <input 
                            type="file" 
                            className="form-control" 
                            style={{ padding: '6px' }} 
                            onChange={(e) => handleDesignFileChange(index, e)}
                          />
                          {item.image_design_path && (
                            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--primary)' }}>
                              Uploaded: <a href={`http://localhost:8000${item.image_design_path}`} target="_blank" rel="noopener noreferrer">{item.image_design_path.split('/').pop()}</a>
                            </div>
                          )}
                        </div>

                        {renderPackingTypeCheckboxes(index, item)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}

      <A4DocumentPreview
        isOpen={!!viewModalOrder}
        onClose={() => setViewModalOrder(null)}
        title="BUYER ORDER"
        documentNumber={viewModalOrder?.ibpo_number}
        status={viewModalOrder?.status}
        onDownloadPdf={() => alert('PDF Download for Buyer Order triggered')}
        sections={viewModalOrder ? [
          {
            title: "ORDER & BUYER",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "IBPO Number", value: viewModalOrder.ibpo_number },
              { label: "Order Date", value: viewModalOrder.order_date },
              { label: "Buyer Name", value: viewModalOrder.party_name },
              { label: "Expected Delivery", value: viewModalOrder.expected_del_date || '-' },
              { label: "Total Target Mtr", value: `${viewModalOrder.total_target_mtr || 0} Mtr` }
            ]
          },
          {
            title: "AGENCY & BROKER",
            icon: "User",
            type: "grid",
            data: [
              { label: "Agent Name", value: viewModalOrder.agent_name || '-' },
              { label: "Broker Name", value: viewModalOrder.broker_name || '-' },
              { label: "Commission %", value: `${viewModalOrder.commission_pct || 0}%` },
              { label: "Dispatch Date", value: viewModalOrder.dispatch_date || '-' }
            ]
          },
          {
            title: "ORDER ITEMS",
            icon: "Box",
            type: "table",
            headers: ["S.No", "Image", "Design No", "Color", "Fabric", "Order Mtrs", "Rate", "Amount"],
            rows: (viewModalOrder.items || []).map((item, idx) => [
              idx + 1,
              item.image_design_path ? (
                <img 
                  src={item.image_design_path.startsWith('http') ? item.image_design_path : `http://localhost:8000${item.image_design_path}`} 
                  alt="Design" 
                  style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, border: '1px solid #cbd5e1', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.image_design_path.startsWith('http') ? item.image_design_path : `http://localhost:8000${item.image_design_path}`, '_blank');
                  }}
                />
              ) : '-',
              item.design_no || '-',
              item.color || '-',
              item.fabric_type || '-',
              item.order_mtrs || 0,
              `₹ ${item.rate || 0}`,
              `₹ ${Number(item.amount || 0).toFixed(2)}`
            ])
          },
          ...(viewModalOrder.payment_file_path ? [{
            title: "SUPPORTING DOCUMENT",
            icon: "FileText",
            type: "image",
            imageUrl: viewModalOrder.payment_file_path
          }] : []),
          ...((viewModalOrder.items || []).some(item => item.image_design_path) ? [{
            title: "DESIGN ATTACHMENTS",
            icon: "FileText",
            type: "design_images",
            images: (viewModalOrder.items || [])
              .filter(item => item.image_design_path)
              .map((item, idx) => ({
                label: `Item #${idx + 1} (Design: ${item.design_no || 'N/A'})`,
                url: item.image_design_path
              }))
          }] : [])
        ] : []}
      />

    </div>
  );
}
