import { useState, useEffect } from 'react';
import { Users, Plus, Save, ArrowLeft, Edit2, Search, Filter, Eye, Trash2, X, ShoppingCart, Briefcase, CheckCircle, Download, FileText } from 'lucide-react';
import { partyAPI, dropdownAPI, subMasterAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function PartyMaster() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  
  // Custom Inline Fields
  const [isCustomPartyGroup, setIsCustomPartyGroup] = useState(false);
  const [customPartyGroupVal, setCustomPartyGroupVal] = useState('');
  
  const [isCustomPartyType, setIsCustomPartyType] = useState(false);
  const [customPartyTypeVal, setCustomPartyTypeVal] = useState('');
  
  const [isCustomCustomerGrade, setIsCustomCustomerGrade] = useState(false);
  const [customCustomerGradeVal, setCustomCustomerGradeVal] = useState('');
  
  const [isCustomSalesRegion, setIsCustomSalesRegion] = useState(false);
  const [customSalesRegionVal, setCustomSalesRegionVal] = useState('');
  
  const [isCustomState, setIsCustomState] = useState(false);
  const [customStateVal, setCustomStateVal] = useState('');
  
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [customDistrictVal, setCustomDistrictVal] = useState('');
  
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [customCountryVal, setCustomCountryVal] = useState('');
  
  const [isCustomGstType, setIsCustomGstType] = useState(false);
  const [customGstTypeVal, setCustomGstTypeVal] = useState('');
  
  const [isCustomTds, setIsCustomTds] = useState(false);
  const [customTdsVal, setCustomTdsVal] = useState('');
  
  const [isCustomTcs, setIsCustomTcs] = useState(false);
  const [customTcsVal, setCustomTcsVal] = useState('');
  
  const [isCustomAddressSno, setIsCustomAddressSno] = useState(false);
  const [customAddressSnoVal, setCustomAddressSnoVal] = useState('');

  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  const [customCurrencyVal, setCustomCurrencyVal] = useState('');

  const [isCustomPaymentTerms, setIsCustomPaymentTerms] = useState(false);
  const [customPaymentTermsVal, setCustomPaymentTermsVal] = useState('');

  const [isCustomAgent, setIsCustomAgent] = useState(false);
  const [customAgentVal, setCustomAgentVal] = useState('');

  const [isCustomTransport, setIsCustomTransport] = useState(false);
  const [customTransportVal, setCustomTransportVal] = useState('');

  const [isCustomDeliverParty, setIsCustomDeliverParty] = useState(false);
  const [customDeliverPartyVal, setCustomDeliverPartyVal] = useState('');

  // Split view state
  const [selectedViewParty, setSelectedViewParty] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  // Dynamic Options
  const [options, setOptions] = useState({
    agents: [], transporters: [], all_parties: [], employees: [],
    masters: {}
  });

  const initialForm = {
    party_type: '', customer_grade: '', status: 'Active',
    company_name: '', party_group: '', address: '', state: '',
    pin_code: '', city: '', district: '', phone: '', sales_region: '', country: '',
    currency: '', contact_person: '', email: '', tally_no: '',
    address_sno: '1', tcs_applicable: 'No', tin_no: '', cst_no: '',
    gst_no: '', gst_type: '', pan_no: '', tds: '', tds_percent: 0,
    pc_id: '', merchandiser: '', manager: '', credit_days: 30,
    credit_limit: 0, account_incharge: '', deliver_party_name: '',
    payment_terms: '', transport_name: '', delivery_address: '', agent_name: '', buyer_name: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchParties();
    fetchOptions();
  }, []);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const { data } = await partyAPI.list();
      setParties(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchOptions = async () => {
    try {
      const { data } = await dropdownAPI.getAll();
      setOptions(data);
    } catch (err) { console.error("Error fetching dropdowns:", err); }
  };

  const handleOpenForm = (party = null, readOnly = false) => {
    if (party) {
      // Replace null values with empty strings to prevent React uncontrolled input warnings
      const sanitizedParty = Object.fromEntries(
        Object.entries(party).map(([k, v]) => [k, v === null ? '' : v])
      );
      setFormData(sanitizedParty);
      setEditingId(party.id);
    } else {
      setFormData(initialForm);
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setActiveTab('basic');
    setView('form');
  };

  const handleDelete = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (formData.buyer_name) {
        const trimmedBuyer = formData.buyer_name.trim();
        const existingBuyers = options.masters?.buyer || [];
        if (trimmedBuyer && !existingBuyers.includes(trimmedBuyer)) {
          try {
            await subMasterAPI.create('buyer', { entity: 'buyer', name: trimmedBuyer, is_active: true });
          } catch (smErr) {
            console.error("Error auto-adding buyer to submaster", smErr);
          }
        }
      }

      if (editingId) {
        await partyAPI.update(editingId, formData);
      } else {
        await partyAPI.create(formData);
      }
      setView('list');
      fetchParties();
      fetchOptions();
    } catch (err) {
      alert("Error saving party");
    }
  };

  const handleChange = async (e) => {
    let { name, value } = e.target;
    if (['credit_days', 'credit_limit', 'tds_percent'].includes(name)) {
      value = value === '' ? 0 : Number(value);
    }

    if (name === 'party_group' && value === 'custom_add_new') {
      setIsCustomPartyGroup(true);
      setCustomPartyGroupVal('');
      return;
    }
    
    if (name === 'party_type' && value === 'custom_add_new') {
      setIsCustomPartyType(true);
      setCustomPartyTypeVal('');
      return;
    }
    
    if (name === 'customer_grade' && value === 'custom_add_new') {
      setIsCustomCustomerGrade(true);
      setCustomCustomerGradeVal('');
      return;
    }
    
    if (name === 'sales_region' && value === 'custom_add_new') {
      setIsCustomSalesRegion(true);
      setCustomSalesRegionVal('');
      return;
    }
    
    if (name === 'state' && value === 'custom_add_new') {
      setIsCustomState(true);
      setCustomStateVal('');
      return;
    }
    
    if (name === 'district' && value === 'custom_add_new') {
      setIsCustomDistrict(true);
      setCustomDistrictVal('');
      return;
    }
    
    if (name === 'country' && value === 'custom_add_new') {
      setIsCustomCountry(true);
      setCustomCountryVal('');
      return;
    }
    
    if (name === 'gst_type' && value === 'custom_add_new') {
      setIsCustomGstType(true);
      setCustomGstTypeVal('');
      return;
    }
    
    if (name === 'tds' && value === 'custom_add_new') {
      setIsCustomTds(true);
      setCustomTdsVal('');
      return;
    }
    
    if (name === 'tcs_applicable' && value === 'custom_add_new') {
      setIsCustomTcs(true);
      setCustomTcsVal('');
      return;
    }
    
    if (name === 'address_sno' && value === 'custom_add_new') {
      setIsCustomAddressSno(true);
      setCustomAddressSnoVal('');
      return;
    }

    if (name === 'currency' && value === 'custom_add_new') {
      setIsCustomCurrency(true);
      setCustomCurrencyVal('');
      return;
    }

    if (name === 'payment_terms' && value === 'custom_add_new') {
      setIsCustomPaymentTerms(true);
      setCustomPaymentTermsVal('');
      return;
    }

    if (name === 'agent_name' && value === 'custom_add_new') {
      setIsCustomAgent(true);
      setCustomAgentVal('');
      return;
    }

    if (name === 'buyer_name' && value === 'custom_add_new') {
      setIsCustomBuyerName(true);
      setCustomBuyerNameVal('');
      return;
    }

    if (name === 'transport_name' && value === 'custom_add_new') {
      setIsCustomTransport(true);
      setCustomTransportVal('');
      return;
    }

    if (name === 'deliver_party_name' && value === 'custom_add_new') {
      setIsCustomDeliverParty(true);
      setCustomDeliverPartyVal('');
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomPartyGroup = async () => {
    if (!customPartyGroupVal.trim()) return;
    try {
      await subMasterAPI.create('party_type_group', { 
        entity: 'party_type_group', 
        name: customPartyGroupVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          party_group: [...(prev.masters.party_group || []), customPartyGroupVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, party_group: customPartyGroupVal.trim() }));
      setIsCustomPartyGroup(false);
      setCustomPartyGroupVal('');
    } catch (err) {
      console.error("Failed to add custom party group", err);
      alert("Failed to add new Party Group. Please try again.");
    }
  };

  const handleSaveCustomPartyType = async () => {
    if (!customPartyTypeVal.trim()) return;
    try {
      await subMasterAPI.create('party_type', { 
        entity: 'party_type', 
        name: customPartyTypeVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          party_type: [...(prev.masters.party_type || []), customPartyTypeVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, party_type: customPartyTypeVal.trim() }));
      setIsCustomPartyType(false);
      setCustomPartyTypeVal('');
    } catch (err) {
      console.error("Failed to add custom party type", err);
      alert("Failed to add new Party Type. Please try again.");
    }
  };

  const handleSaveCustomCustomerGrade = async () => {
    if (!customCustomerGradeVal.trim()) return;
    try {
      await subMasterAPI.create('customer_grade', { 
        entity: 'customer_grade', 
        name: customCustomerGradeVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          customer_grade: [...(prev.masters.customer_grade || []), customCustomerGradeVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, customer_grade: customCustomerGradeVal.trim() }));
      setIsCustomCustomerGrade(false);
      setCustomCustomerGradeVal('');
    } catch (err) {
      console.error("Failed to add custom customer grade", err);
      alert("Failed to add new Customer Grade. Please try again.");
    }
  };

  const handleSaveCustomSalesRegion = async () => {
    if (!customSalesRegionVal.trim()) return;
    try {
      await subMasterAPI.create('sales_region_master', { 
        entity: 'sales_region_master', 
        name: customSalesRegionVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          sales_region: [...(prev.masters.sales_region || []), customSalesRegionVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, sales_region: customSalesRegionVal.trim() }));
      setIsCustomSalesRegion(false);
      setCustomSalesRegionVal('');
    } catch (err) {
      console.error("Failed to add custom sales region", err);
      alert("Failed to add new Sales Region. Please try again.");
    }
  };

  const handleSaveCustomState = async () => {
    if (!customStateVal.trim()) return;
    try {
      await subMasterAPI.create('state_master', { 
        entity: 'state_master', 
        name: customStateVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          state: [...(prev.masters.state || []), customStateVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, state: customStateVal.trim() }));
      setIsCustomState(false);
      setCustomStateVal('');
    } catch (err) {
      console.error("Failed to add custom state", err);
      alert("Failed to add new State. Please try again.");
    }
  };

  const handleSaveCustomDistrict = async () => {
    if (!customDistrictVal.trim()) return;
    try {
      await subMasterAPI.create('district_city_master', { 
        entity: 'district_city_master', 
        name: customDistrictVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          district: [...(prev.masters.district || []), customDistrictVal.trim()],
          city: [...(prev.masters.city || []), customDistrictVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, district: customDistrictVal.trim(), city: customDistrictVal.trim() }));
      setIsCustomDistrict(false);
      setCustomDistrictVal('');
    } catch (err) {
      console.error("Failed to add custom district", err);
      alert("Failed to add new District. Please try again.");
    }
  };

  const handleSaveCustomCountry = async () => {
    if (!customCountryVal.trim()) return;
    try {
      await subMasterAPI.create('country_master', { 
        entity: 'country_master', 
        name: customCountryVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          country: [...(prev.masters.country || []), customCountryVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, country: customCountryVal.trim() }));
      setIsCustomCountry(false);
      setCustomCountryVal('');
    } catch (err) {
      console.error("Failed to add custom country", err);
      alert("Failed to add new Country. Please try again.");
    }
  };

  const handleSaveCustomGstType = async () => {
    if (!customGstTypeVal.trim()) return;
    try {
      await subMasterAPI.create('gst_type_master', { 
        entity: 'gst_type_master', 
        name: customGstTypeVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          gst_type: [...(prev.masters.gst_type || []), customGstTypeVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, gst_type: customGstTypeVal.trim() }));
      setIsCustomGstType(false);
      setCustomGstTypeVal('');
    } catch (err) {
      console.error("Failed to add custom GST type", err);
    }
  };

  const handleSaveCustomTds = async () => {
    if (!customTdsVal.trim()) return;
    try {
      await subMasterAPI.create('tds_master', { 
        entity: 'tds_master', 
        name: customTdsVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          tds: [...(prev.masters.tds || []), customTdsVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, tds: customTdsVal.trim() }));
      setIsCustomTds(false);
      setCustomTdsVal('');
    } catch (err) {
      console.error("Failed to add custom TDS", err);
    }
  };

  const handleSaveCustomTcs = async () => {
    if (!customTcsVal.trim()) return;
    try {
      await subMasterAPI.create('tcs_master', { 
        entity: 'tcs_master', 
        name: customTcsVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          tcs_applicable: [...(prev.masters.tcs_applicable || []), customTcsVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, tcs_applicable: customTcsVal.trim() }));
      setIsCustomTcs(false);
      setCustomTcsVal('');
    } catch (err) {
      console.error("Failed to add custom TCS", err);
    }
  };

  const handleSaveCustomAddressSno = async () => {
    if (!customAddressSnoVal.trim()) return;
    try {
      await subMasterAPI.create('address_sno_master', { 
        entity: 'address_sno_master', 
        name: customAddressSnoVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          address_sno: [...(prev.masters.address_sno || []), customAddressSnoVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, address_sno: customAddressSnoVal.trim() }));
      setIsCustomAddressSno(false);
      setCustomAddressSnoVal('');
    } catch (err) {
      console.error("Failed to add custom Address S.No", err);
    }
  };

  const handleSaveCustomCurrency = async () => {
    if (!customCurrencyVal.trim()) return;
    try {
      await subMasterAPI.create('currency_master', { 
        entity: 'currency_master', 
        name: customCurrencyVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          currency: [...(prev.masters.currency || []), customCurrencyVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, currency: customCurrencyVal.trim() }));
      setIsCustomCurrency(false);
      setCustomCurrencyVal('');
    } catch (err) {
      console.error("Failed to add custom Currency", err);
    }
  };

  const handleSaveCustomPaymentTerms = async () => {
    if (!customPaymentTermsVal.trim()) return;
    try {
      await subMasterAPI.create('payment_terms_master', { 
        entity: 'payment_terms_master', 
        name: customPaymentTermsVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          payment_terms: [...(prev.masters.payment_terms || []), customPaymentTermsVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, payment_terms: customPaymentTermsVal.trim() }));
      setIsCustomPaymentTerms(false);
      setCustomPaymentTermsVal('');
    } catch (err) {
      console.error("Failed to add custom Payment Terms", err);
    }
  };

  const handleSaveCustomAgent = async () => {
    if (!customAgentVal.trim()) return;
    try {
      const { data } = await partyAPI.create({ company_name: customAgentVal.trim(), party_type: 'Agent' });
      setOptions(prev => ({ ...prev, agents: [...prev.agents, { id: data.id, name: data.company_name }] }));
      setFormData(prev => ({ ...prev, agent_name: data.company_name }));
      setIsCustomAgent(false);
      setCustomAgentVal('');
    } catch (err) { console.error("Failed to add custom Agent", err); }
  };



  const handleSaveCustomTransport = async () => {
    if (!customTransportVal.trim()) return;
    try {
      await subMasterAPI.create('transport_name_master', { 
        entity: 'transport_name_master', 
        name: customTransportVal.trim(), 
        is_active: true 
      });
      setOptions(prev => ({
        ...prev,
        masters: {
          ...prev.masters,
          transport_name_master: [...(prev.masters.transport_name_master || []), customTransportVal.trim()]
        }
      }));
      setFormData(prev => ({ ...prev, transport_name: customTransportVal.trim() }));
      setIsCustomTransport(false);
      setCustomTransportVal('');
    } catch (err) {
      console.error("Failed to add custom Transport Name", err);
    }
  };

  const handleSaveCustomDeliverParty = async () => {
    if (!customDeliverPartyVal.trim()) return;
    try {
      const { data } = await partyAPI.create({ company_name: customDeliverPartyVal.trim(), party_type: 'Delivery Party' });
      setOptions(prev => ({ ...prev, all_parties: [...prev.all_parties, { id: data.id, name: data.company_name }] }));
      setFormData(prev => ({ ...prev, deliver_party_name: data.company_name }));
      setIsCustomDeliverParty(false);
      setCustomDeliverPartyVal('');
    } catch (err) { console.error("Failed to add custom Delivery Party", err); }
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setActiveTab(nextTab);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 100);
    }
  };

  const renderOptions = (category) => {
    return (options.masters[category] || []).map(val => (
      <option key={val} value={val}>{val}</option>
    ));
  };

  const filteredParties = parties.filter(p => {
    const matchesSearch = searchTerm === '' ||
      p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm);

    const matchesType = typeFilter === 'All Types' || p.party_type === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || p.status === statusFilter;

    let matchesDate = true;
    if (p.created_at) {
      const partyDate = new Date(p.created_at);
      if (fromDate) matchesDate = matchesDate && partyDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && partyDate <= tDate;
      }
    }
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Party Master Report", 14, 15);
    const tableColumn = ["Code", "Business Name", "Party Type", "City", "GSTIN", "Phone"];
    const tableRows = [];

    filteredParties.forEach(p => {
      const rowData = [
        p.customer_code || '-',
        p.company_name || '-',
        p.party_type || '-',
        p.city || '-',
        p.gst_no || '-',
        p.phone || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Party_Master_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const wsData = filteredParties.map(p => ({
      "Customer Code": p.customer_code,
      "Business Name": p.company_name,
      "Party Type": p.party_type,
      "Party Group": p.party_group,
      "Status": p.status,
      "Contact Person": p.contact_person,
      "Phone": p.phone,
      "Email": p.email,
      "Address": p.address,
      "City": p.city,
      "District": p.district,
      "State": p.state,
      "Pincode": p.pin_code,
      "Country": p.country,
      "GSTIN": p.gst_no,
      "GST Type": p.gst_type,
      "PAN No": p.pan_no,
      "Tally No": p.tally_no,
      "TDS": p.tds,
      "TDS Percent": p.tds_percent,
      "Bill Credit Days": p.credit_days,
      "Credit Limit": p.credit_limit,
      "Merchandiser": p.merchandiser,
      "Manager": p.manager,
      "Account Incharge": p.account_incharge,
      "Agent Name": p.agent_name,
      "Payment Terms": p.payment_terms,
      "Transport Name": p.transport_name,
      "Deliver Party Name": p.deliver_party_name
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parties");
    XLSX.writeFile(wb, `Party_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalParties = parties.length;
  const totalSales = parties.filter(p => p.party_type === 'Sales Party').length;
  const totalPurchase = parties.filter(p => p.party_type === 'Purchase Party').length;
  const activeParties = parties.filter(p => p.status === 'Active').length;

  const handleCardClick = (type) => {
    if (type === 'Total') {
      setTypeFilter('All Types');
      setStatusFilter('All Status');
    } else if (type === 'Sales Party') {
      setTypeFilter('Sales Party');
      setStatusFilter('All Status');
    } else if (type === 'Purchase Party') {
      setTypeFilter('Purchase Party');
      setStatusFilter('All Status');
    } else if (type === 'Active') {
      setTypeFilter('All Types');
      setStatusFilter('Active');
    }
  };

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isReadOnly ? 'View Party Details' : editingId ? 'Edit Party Details' : 'Add New Party'}
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setView('list')}>
              <X size={16} /> Close
            </button>
            {!isReadOnly && (
              <button type="submit" form="partyForm" className="btn btn-primary">
                <Save size={16} /> Save Party
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {[{ id: 'basic', label: 'Basic Information' }, 
              { id: 'location', label: 'Location & Address' },
              { id: 'tax', label: 'Tax & Legal Info' },
              { id: 'financial', label: 'Financial & Logistics' }
             ].map(tab => (
              <button 
                key={tab.id} onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                type="button"
                style={{
                  padding: '16px 24px', background: activeTab === tab.id ? '#fff' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: 600, color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <form id="partyForm" onSubmit={handleSubmit}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                {/* Group 1: Basic Details */}
                {activeTab === 'basic' && (
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Party Type *</label>
                        {isCustomPartyType ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new type..."
                              value={customPartyTypeVal}
                              onChange={(e) => setCustomPartyTypeVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomPartyType();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPartyType} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPartyType(false); setFormData(prev => ({ ...prev, party_type: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="party_type" value={formData.party_type} onChange={handleChange} required>
                            <option value="">-- Select Party Type --</option>
                            {renderOptions('party_type')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Business Name *</label>
                        <input className="form-control" name="company_name" value={formData.company_name} onChange={handleChange} required />
                      </div>
                      <div className="form-group">
                        <label>Party Group</label>
                        {isCustomPartyGroup ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new group..."
                              value={customPartyGroupVal}
                              onChange={(e) => setCustomPartyGroupVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomPartyGroup();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPartyGroup} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPartyGroup(false); setFormData(prev => ({ ...prev, party_group: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="party_group" value={formData.party_group} onChange={handleChange}>
                            <option value="">-- Select Group --</option>
                            {renderOptions('party_group')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Buyer Name</label>
                        <input className="form-control" name="buyer_name" value={formData.buyer_name} onChange={handleChange} placeholder="Enter Buyer Name" />
                      </div>
                      <div className="form-group">
                        <label>Customer Grade</label>
                        {isCustomCustomerGrade ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new grade..."
                              value={customCustomerGradeVal}
                              onChange={(e) => setCustomCustomerGradeVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomCustomerGrade();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomCustomerGrade} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomCustomerGrade(false); setFormData(prev => ({ ...prev, customer_grade: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="customer_grade" value={formData.customer_grade} onChange={handleChange}>
                            <option value="">-- Select Customer Grade --</option>
                            {renderOptions('customer_grade')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                          <option>Active</option><option>Inactive</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Point of Contact</label>
                        <input className="form-control" name="contact_person" value={formData.contact_person} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Phone No</label>
                        <input className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Mail ID</label>
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'location', 'address')} />
                      </div>
                    </div>

                    {/* Section 2: Location & Address */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Location & Address
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Complete Address</label>
                        <input className="form-control" name="address" value={formData.address} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        {isCustomState ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new state..."
                              value={customStateVal}
                              onChange={(e) => setCustomStateVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomState();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomState} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomState(false); setFormData(prev => ({ ...prev, state: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="state" value={formData.state} onChange={handleChange}>
                            <option value="">-- Select State --</option>
                            {renderOptions('state')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input 
                          className="form-control" 
                          name="city" 
                          value={formData.city} 
                          onChange={handleChange} 
                          placeholder="Enter City" 
                        />
                      </div>
                      <div className="form-group">
                        <label>District</label>
                        {isCustomDistrict ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new district..."
                              value={customDistrictVal}
                              onChange={(e) => setCustomDistrictVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomDistrict();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomDistrict} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomDistrict(false); setFormData(prev => ({ ...prev, district: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="district" value={formData.district} onChange={handleChange}>
                            <option value="">-- Select District --</option>
                            {renderOptions('district')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Pincode</label>
                        <input className="form-control" name="pin_code" value={formData.pin_code} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Sales Region</label>
                        {isCustomSalesRegion ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new region..."
                              value={customSalesRegionVal}
                              onChange={(e) => setCustomSalesRegionVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomSalesRegion();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomSalesRegion} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomSalesRegion(false); setFormData(prev => ({ ...prev, sales_region: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="sales_region" value={formData.sales_region} onChange={handleChange}>
                            <option value="">-- Select Sales Region --</option>
                            {renderOptions('sales_region')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        {isCustomCountry ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new country..."
                              value={customCountryVal}
                              onChange={(e) => setCustomCountryVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomCountry();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomCountry} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomCountry(false); setFormData(prev => ({ ...prev, country: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="country" value={formData.country} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'tax', 'gst_no')}>
                            <option value="">-- Select Country --</option>
                            {renderOptions('country')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Tax & Legal Info */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Tax & Legal Info
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <label>GSTIN</label>
                        <input className="form-control" name="gst_no" value={formData.gst_no} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>GST Type</label>
                        {isCustomGstType ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new GST type..."
                              value={customGstTypeVal}
                              onChange={(e) => setCustomGstTypeVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomGstType();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomGstType} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomGstType(false); setFormData(prev => ({ ...prev, gst_type: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="gst_type" value={formData.gst_type} onChange={handleChange}>
                            <option value="">-- Select GST Type --</option>
                            {renderOptions('gst_type')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>PAN No</label>
                        <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Tally No</label>
                        <input className="form-control" name="tally_no" value={formData.tally_no} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>TDS</label>
                        {isCustomTds ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new TDS..."
                              value={customTdsVal}
                              onChange={(e) => setCustomTdsVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomTds();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomTds} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomTds(false); setFormData(prev => ({ ...prev, tds: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="tds" value={formData.tds} onChange={handleChange}>
                            <option value="">-- Select TDS --</option>
                            {renderOptions('tds')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>TDS %</label>
                        <input type="number" step="0.1" className="form-control" name="tds_percent" value={formData.tds_percent} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>TCS Applicable</label>
                        {isCustomTcs ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new TCS..."
                              value={customTcsVal}
                              onChange={(e) => setCustomTcsVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomTcs();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomTcs} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomTcs(false); setFormData(prev => ({ ...prev, tcs_applicable: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="tcs_applicable" value={formData.tcs_applicable} onChange={handleChange}>
                            <option value="">-- Select --</option>
                            {renderOptions('tcs_applicable')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Address SNo</label>
                        {isCustomAddressSno ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type Address S.No..."
                              value={customAddressSnoVal}
                              onChange={(e) => setCustomAddressSnoVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomAddressSno();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomAddressSno} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomAddressSno(false); setFormData(prev => ({ ...prev, address_sno: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="address_sno" value={formData.address_sno} onChange={handleChange}>
                            <option value="">-- Select S.No --</option>
                            {renderOptions('address_sno')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>TIN No</label>
                        <input className="form-control" name="tin_no" value={formData.tin_no} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>CST No</label>
                        <input className="form-control" name="cst_no" value={formData.cst_no} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Pc ID</label>
                        <input className="form-control" name="pc_id" value={formData.pc_id} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'financial', 'currency')} />
                      </div>
                    </div>

                    {/* Section 4: Financial & Logistics */}
                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Financial & Logistics
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Currency</label>
                        {isCustomCurrency ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new Currency..."
                              value={customCurrencyVal}
                              onChange={(e) => setCustomCurrencyVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomCurrency();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomCurrency} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomCurrency(false); setFormData(prev => ({ ...prev, currency: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="currency" value={formData.currency} onChange={handleChange}>
                            <option value="">-- Select Currency --</option>
                            {renderOptions('currency')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Bill Credit Days</label>
                        <input type="number" className="form-control" name="credit_days" value={formData.credit_days} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Credit Limit Rs.</label>
                        <input type="number" className="form-control" name="credit_limit" value={formData.credit_limit} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Merchandiser</label>
                        <select className="form-control" name="merchandiser" value={formData.merchandiser} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {options.employees.filter(emp => emp.department?.toLowerCase().includes('merchandis')).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Manager</label>
                        <select className="form-control" name="manager" value={formData.manager} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {options.employees.filter(emp => emp.department?.toLowerCase().includes('manag')).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>A/c Incharge</label>
                        <select className="form-control" name="account_incharge" value={formData.account_incharge} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {options.employees.filter(emp => emp.department?.toLowerCase().includes('account')).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Agent Name</label>
                        {isCustomAgent ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new Agent..."
                              value={customAgentVal}
                              onChange={(e) => setCustomAgentVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomAgent();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomAgent} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomAgent(false); setFormData(prev => ({ ...prev, agent_name: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="agent_name" value={formData.agent_name} onChange={handleChange}>
                            <option value="">-- Select --</option>
                            {formData.agent_name && !options.agents.some(ag => ag.name === formData.agent_name) && (
                              <option value={formData.agent_name}>{formData.agent_name}</option>
                            )}
                            {options.agents.map(ag => <option key={ag.id} value={ag.name}>{ag.name}</option>)}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Payment Terms</label>
                        {isCustomPaymentTerms ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new terms..."
                              value={customPaymentTermsVal}
                              onChange={(e) => setCustomPaymentTermsVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomPaymentTerms();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPaymentTerms} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPaymentTerms(false); setFormData(prev => ({ ...prev, payment_terms: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
                            <option value="">-- Select Terms --</option>
                            {renderOptions('payment_terms')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Transport Name</label>
                        {isCustomTransport ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type new Transport..."
                              value={customTransportVal}
                              onChange={(e) => setCustomTransportVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomTransport();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomTransport} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomTransport(false); setFormData(prev => ({ ...prev, transport_name: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="transport_name" value={formData.transport_name} onChange={handleChange}>
                            <option value="">-- Select --</option>
                            {formData.transport_name && !(options.masters['transport_name_master'] || []).includes(formData.transport_name) && (
                              <option value={formData.transport_name}>{formData.transport_name}</option>
                            )}
                            {renderOptions('transport_name_master')}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Deliver Party Name</label>
                        {isCustomDeliverParty ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type Delivery Party..."
                              value={customDeliverPartyVal}
                              onChange={(e) => setCustomDeliverPartyVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomDeliverParty();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomDeliverParty} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomDeliverParty(false); setFormData(prev => ({ ...prev, deliver_party_name: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="deliver_party_name" value={formData.deliver_party_name} onChange={handleChange}>
                            <option value="">-- Same as Business Name --</option>
                            {formData.deliver_party_name && !options.all_parties.some(p => p.name === formData.deliver_party_name) && (
                              <option value={formData.deliver_party_name}>{formData.deliver_party_name}</option>
                            )}
                            {options.all_parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Delivery Address</label>
                        <input className="form-control" name="delivery_address" value={formData.delivery_address} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Group 2: Location & Address */}
                {activeTab === 'location' && (
                  <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Complete Address</label>
                  <input className="form-control" name="address" value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <select className="form-control" name="state" value={formData.state} onChange={handleChange}>
                    <option value="">-- Select State --</option>
                    {renderOptions('state')}
                  </select>
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    className="form-control" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                    placeholder="Enter City" 
                  />
                </div>
                <div className="form-group">
                  <label>District</label>
                  <select className="form-control" name="district" value={formData.district} onChange={handleChange}>
                    <option value="">-- Select District --</option>
                    {renderOptions('district')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input className="form-control" name="pin_code" value={formData.pin_code} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Sales Region</label>
                  <select className="form-control" name="sales_region" value={formData.sales_region} onChange={handleChange}>
                    <option value="">-- Select Zone --</option>
                    {renderOptions('sales_region')}
                  </select>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <select className="form-control" name="country" value={formData.country} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'tax', 'gst_no')}>
                    <option value="">-- Select Country --</option>
                    {renderOptions('country')}
                  </select>
                </div>
              </div>
            )}

            {/* Group 3: Tax & Legal Info */}
                {activeTab === 'tax' && (
                  <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input className="form-control" name="gst_no" value={formData.gst_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>GST Type</label>
                  <select className="form-control" name="gst_type" value={formData.gst_type} onChange={handleChange}>
                    <option value="">-- Select GST Type --</option>
                    {renderOptions('gst_type')}
                  </select>
                </div>
                <div className="form-group">
                  <label>PAN No</label>
                  <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Tally No</label>
                  <input className="form-control" name="tally_no" value={formData.tally_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>TDS</label>
                  <select className="form-control" name="tds" value={formData.tds} onChange={handleChange}>
                    <option value="">-- Select TDS --</option>
                    {renderOptions('tds')}
                  </select>
                </div>
                <div className="form-group">
                  <label>TDS %</label>
                  <input type="number" step="0.1" className="form-control" name="tds_percent" value={formData.tds_percent} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>TCS Applicable</label>
                  <select className="form-control" name="tcs_applicable" value={formData.tcs_applicable} onChange={handleChange}>
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address SNo</label>
                  <select className="form-control" name="address_sno" value={formData.address_sno} onChange={handleChange}>
                    <option>1</option><option>2</option><option>3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>TIN No</label>
                  <input className="form-control" name="tin_no" value={formData.tin_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>CST No</label>
                  <input className="form-control" name="cst_no" value={formData.cst_no} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Pc ID</label>
                  <input className="form-control" name="pc_id" value={formData.pc_id} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'financial', 'currency')} />
                </div>
              </div>
            )}

            {/* Group 4: Account & Logistics */}
                {activeTab === 'financial' && (
                  <div className="animate-fade form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Currency</label>
                  {isCustomCurrency ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        autoFocus
                        className="form-control" 
                        placeholder="Type new Currency..."
                        value={customCurrencyVal}
                        onChange={(e) => setCustomCurrencyVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomCurrency();
                          }
                        }}
                      />
                      <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomCurrency} title="Save">
                        <CheckCircle size={16} />
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomCurrency(false); setFormData(prev => ({ ...prev, currency: '' })); }} title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select className="form-control" name="currency" value={formData.currency} onChange={handleChange}>
                      <option value="">-- Select Currency --</option>
                      {renderOptions('currency')}
                      <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Bill Credit Days</label>
                  <input type="number" className="form-control" name="credit_days" value={formData.credit_days} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Credit Limit Rs.</label>
                  <input type="number" className="form-control" name="credit_limit" value={formData.credit_limit} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Merchandiser</label>
                  <select className="form-control" name="merchandiser" value={formData.merchandiser} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.employees.filter(emp => emp.department?.toLowerCase().includes('merchandis')).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Manager</label>
                  <select className="form-control" name="manager" value={formData.manager} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.employees.filter(emp => emp.department?.toLowerCase().includes('manag')).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>A/c Incharge</label>
                  <select className="form-control" name="account_incharge" value={formData.account_incharge} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    {options.employees.filter(emp => emp.department?.toLowerCase().includes('account')).map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Agent Name</label>
                  {isCustomAgent ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        autoFocus
                        className="form-control" 
                        placeholder="Type new Agent..."
                        value={customAgentVal}
                        onChange={(e) => setCustomAgentVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomAgent();
                          }
                        }}
                      />
                      <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomAgent} title="Save">
                        <CheckCircle size={16} />
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomAgent(false); setFormData(prev => ({ ...prev, agent_name: '' })); }} title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select className="form-control" name="agent_name" value={formData.agent_name} onChange={handleChange}>
                      <option value="">-- Select --</option>
                      {formData.agent_name && !options.agents.some(ag => ag.name === formData.agent_name) && (
                        <option value={formData.agent_name}>{formData.agent_name}</option>
                      )}
                      {options.agents.map(ag => <option key={ag.id} value={ag.name}>{ag.name}</option>)}
                      <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Payment Terms</label>
                  {isCustomPaymentTerms ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        autoFocus
                        className="form-control" 
                        placeholder="Type new terms..."
                        value={customPaymentTermsVal}
                        onChange={(e) => setCustomPaymentTermsVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomPaymentTerms();
                          }
                        }}
                      />
                      <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPaymentTerms} title="Save">
                        <CheckCircle size={16} />
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPaymentTerms(false); setFormData(prev => ({ ...prev, payment_terms: '' })); }} title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select className="form-control" name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
                      <option value="">-- Select Terms --</option>
                      {renderOptions('payment_terms')}
                      <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Transport Name</label>
                  {isCustomTransport ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        autoFocus
                        className="form-control" 
                        placeholder="Type new Transport..."
                        value={customTransportVal}
                        onChange={(e) => setCustomTransportVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomTransport();
                          }
                        }}
                      />
                      <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomTransport} title="Save">
                        <CheckCircle size={16} />
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomTransport(false); setFormData(prev => ({ ...prev, transport_name: '' })); }} title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select className="form-control" name="transport_name" value={formData.transport_name} onChange={handleChange}>
                      <option value="">-- Select --</option>
                      {formData.transport_name && !(options.masters['transport_name_master'] || []).includes(formData.transport_name) && (
                        <option value={formData.transport_name}>{formData.transport_name}</option>
                      )}
                      {renderOptions('transport_name_master')}
                      <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Deliver Party Name</label>
                  {isCustomDeliverParty ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        autoFocus
                        className="form-control" 
                        placeholder="Type Delivery Party..."
                        value={customDeliverPartyVal}
                        onChange={(e) => setCustomDeliverPartyVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveCustomDeliverParty();
                          }
                        }}
                      />
                      <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomDeliverParty} title="Save">
                        <CheckCircle size={16} />
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomDeliverParty(false); setFormData(prev => ({ ...prev, deliver_party_name: '' })); }} title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select className="form-control" name="deliver_party_name" value={formData.deliver_party_name} onChange={handleChange}>
                      <option value="">-- Same as Business Name --</option>
                      {formData.deliver_party_name && !options.all_parties.some(p => p.name === formData.deliver_party_name) && (
                        <option value={formData.deliver_party_name}>{formData.deliver_party_name}</option>
                      )}
                      {options.all_parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                    </select>
                  )}
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Delivery Address</label>
                  <input className="form-control" name="delivery_address" value={formData.delivery_address} onChange={handleChange} />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="var(--primary)" /> Party Master
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage all customers, suppliers, agents and transporters.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          {/* Export Dropdown */}
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
                  <Download size={16} color="#10b981" /> Excel Sheet
                </button>
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add New Party
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div
          className="card stat-card"
          onClick={() => handleCardClick('Total')}
          style={{ cursor: 'pointer', border: typeFilter === 'All Types' && statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Parties</h3>
            <div className="value">{totalParties}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Sales Party')}
          style={{ cursor: 'pointer', border: typeFilter === 'Sales Party' ? '2px solid #10b981' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-details">
            <h3>Sales Parties</h3>
            <div className="value">{totalSales}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Purchase Party')}
          style={{ cursor: 'pointer', border: typeFilter === 'Purchase Party' ? '2px solid #f59e0b' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-details">
            <h3>Purchase Parties</h3>
            <div className="value">{totalPurchase}</div>
          </div>
        </div>

        <div
          className="card stat-card"
          onClick={() => handleCardClick('Active')}
          style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #8b5cf6' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Parties</h3>
            <div className="value">{activeParties}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>

        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Code, Name or Phone..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option>All Types</option>
            {options?.masters?.party_type?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* LEFT SIDE: TABLE */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Business Name</th><th>Type & Group</th>
                  <th>Buyer & Agent</th>
                  <th>Contact & Phone</th><th>City</th><th>GST / PAN</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredParties.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No parties found matching criteria.</td></tr>
                ) : (
                  filteredParties.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedViewParty(p)}
                      style={{
                        cursor: 'pointer',
                        background: selectedViewParty?.id === p.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{p.customer_code}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.company_name}</td>
                      <td>
                        <span className="badge badge-active" style={{ marginBottom: 4 }}>{p.party_type}</span><br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.party_group}</span>
                      </td>
                      <td>
                        {p.buyer_name ? <span style={{ fontWeight: 600, color: 'var(--primary)' }}>B: {p.buyer_name}</span> : <span style={{ color: 'var(--text-muted)' }}>B: N/A</span>}<br/>
                        {p.agent_name ? <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>A: {p.agent_name}</span> : <span style={{ color: 'var(--text-muted)' }}>A: N/A</span>}
                      </td>
                      <td>
                        {p.contact_person || 'N/A'}<br />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.phone}</span>
                      </td>
                      <td>{p.city}</td>
                      <td>
                        <span style={{ fontSize: 12 }}>{p.gst_no || 'N/A'}</span><br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.pan_no}</span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(p, true)}
                            title="Full Form View"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleOpenForm(p, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => handleDelete(p.id, p.company_name, e)}
                            title="Delete"
                          >
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
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

        {/* RIGHT SIDE: DETAILS PANE */}
        {selectedViewParty && (
          <div style={{ flex: '0 0 350px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                  <Users size={18} /> {selectedViewParty.company_name}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewParty, false)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => setSelectedViewParty(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                <DetailRow label="Customer Code" value={selectedViewParty.customer_code} />
                <DetailRow label="Party Type" value={<span className="badge badge-active">{selectedViewParty.party_type}</span>} />
                <DetailRow label="Party Group" value={selectedViewParty.party_group} />
                <DetailRow label="Grade" value={selectedViewParty.customer_grade} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</h4>
                <DetailRow label="Point of Contact" value={selectedViewParty.contact_person} />
                <DetailRow label="Phone" value={selectedViewParty.phone} />
                <DetailRow label="Email" value={selectedViewParty.email} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</h4>
                <DetailRow label="City" value={selectedViewParty.city} />
                <DetailRow label="District" value={selectedViewParty.district} />
                <DetailRow label="State" value={selectedViewParty.state} />
                <DetailRow label="Region" value={selectedViewParty.sales_region} />
                <DetailRow label="Country" value={selectedViewParty.country} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax & Legal</h4>
                <DetailRow label="GSTIN" value={selectedViewParty.gst_no} />
                <DetailRow label="GST Type" value={selectedViewParty.gst_type} />
                <DetailRow label="PAN No" value={selectedViewParty.pan_no} />
                <DetailRow label="TDS Type" value={selectedViewParty.tds} />

                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financials & Team</h4>
                <DetailRow label="Payment Terms" value={selectedViewParty.payment_terms} />
                <DetailRow label="Credit Days" value={selectedViewParty.credit_days} />
                <DetailRow label="Merchandiser" value={selectedViewParty.merchandiser} />
                <DetailRow label="Manager" value={selectedViewParty.manager} />
                <DetailRow label="Buyer Name" value={selectedViewParty.buyer_name} />
                <DetailRow label="Agent Name" value={selectedViewParty.agent_name} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420,
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    await partyAPI.delete(id);
                    if (selectedViewParty?.id === id) setSelectedViewParty(null);
                    fetchParties();
                  } catch (err) {
                    alert("Error deleting party. It may be in use.");
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
