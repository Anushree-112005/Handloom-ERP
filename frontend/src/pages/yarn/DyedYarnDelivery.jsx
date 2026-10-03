import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Trash2, Save, X, Edit2, Truck, FileText, Package, IndianRupee, Download, ChevronDown, CheckCircle, ArrowLeft } from 'lucide-react';
import A4DocumentPreview from '../../components/A4DocumentPreview';
import { dyedYarnDeliveryAPI, partyAPI, dropdownAPI, subMasterAPI, designEntryAPI, yarnDyeingPOAPI, yarnInwardAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function DyedYarnDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [parties, setParties] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [yarnDyeingPOs, setYarnDyeingPOs] = useState([]);
  const [options, setOptions] = useState({});
  const [yarnInwards, setYarnInwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewModalDelivery, setViewModalDelivery] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Custom Options triggers
  const [isCustomTransport, setIsCustomTransport] = useState(false);
  const [customTransportVal, setCustomTransportVal] = useState('');
  const [isCustomCertificateType, setIsCustomCertificateType] = useState(false);
  const [customCertificateTypeVal, setCustomCertificateTypeVal] = useState('');
  const [isCustomDeliveryMode, setIsCustomDeliveryMode] = useState(false);
  const [customDeliveryModeVal, setCustomDeliveryModeVal] = useState('');

  const [customColourIdx, setCustomColourIdx] = useState(null);
  const [customColourVal, setCustomColourVal] = useState('');

  const initialForm = {
    delivery_no: '',
    dc_no: '',
    dc_date: new Date().toISOString().split('T')[0],
    ref_date: new Date().toISOString().split('T')[0],
    stock_godown: '',
    delivery_type: 'Direct',
    party_name: '',
    delivery_mode: '',
    delivery_address: '',
    design_no: '',
    order_no: '',
    yarn_dyeing_po_no: '',
    transport: '',
    vehicle_no: '',
    delivery_name: '',
    delivery_time: '',
    certificate_type: '',
    design_count: '',
    order_kgs: 0,
    total_dely_kgs: 0,
    total_rtn_kgs: 0,
    balance_kgs: 0,
    status: 'Delivered',
    remarks: '',

    // Financial / Logistics Details
    freight_charges: 0,
    loading_charges: 0,
    unloading_charges: 0,
    insurance_charges: 0,
    other_charges: 0,
    transport_remarks: '',
    taxable_amount: 0,
    sgst_pct: 0,
    sgst_amount: 0,
    cgst_pct: 0,
    cgst_amount: 0,
    igst_pct: 0,
    igst_amount: 0,
    total_gst: 0,
    gross_amount: 0,
    discount: 0,
    round_off: 0,
    grand_total: 0,
    advance: 0,
    balance: 0,

    terms_conditions: [
      "Material not meeting our specification and standards will be returned",
      "Demanded Qty to be supplied in whole and excess/short supply will not be accepted.",
      "Send Invoice along with Material.",
      "Defective and damage pieces will not be accepted.",
      "Start bulk production only after getting the sample Approval.",
      "Subject to Namakkal Jurisdiction."
    ],

    items: [{
      cone_type: 'Full Cone',
      count: '',
      our_lot_no: '',
      color: '',
      stock: 0,
      bags: 0,
      cones: 0,
      total_kgs: 0,
      rate: 0,
      amount: 0
    }]
  };

  const [form, setForm] = useState(initialForm);

  const [newTerm, setNewTerm] = useState('');
  const [editingTermIdx, setEditingTermIdx] = useState(null);
  const [editingTermVal, setEditingTermVal] = useState('');

  const addTerm = () => {
    if (!newTerm.trim()) return;
    setForm(prev => ({ ...prev, terms_conditions: [...(prev.terms_conditions || []), newTerm.trim()] }));
    setNewTerm('');
  };

  const removeTerm = (idx) => {
    setForm(prev => {
      const updated = [...(prev.terms_conditions || [])];
      updated.splice(idx, 1);
      return { ...prev, terms_conditions: updated };
    });
  };

  const isJobWorkParty = (p) => {
    if (!p) return false;
    const type = (p.party_type || '').toLowerCase();
    const group = (p.party_group || '').toLowerCase();
    const jobTerms = [
      'job', 'worker', 'processor', 'dyeing', 'weaving', 'weaver', 'warping', 
      'sizing', 'printing', 'finishing', 'doubling', 'twisting', 'converter', 
      'coverter', 'loom', 'service'
    ];
    return jobTerms.some(term => type.includes(term) || group.includes(term));
  };

  const getDeliveryOptions = () => {
    const list = [
      {
        company_name: 'Handloom ERP Private Limited',
        address: '1/6-A, AIYNDHUPANAL KADACHANALLUR POST, OPP. TO SPK SCHOOL, KOMARAPALAYAM TALUK, Namakkal, Tamil Nadu, 638183',
        phone: '',
        gst_no: '33AAACD0905A1ZG'
      }
    ];

    (parties || []).filter(isJobWorkParty).forEach(p => {
      list.push({
        company_name: p.company_name,
        address: p.address || '',
        phone: p.phone || p.mobile || '',
        gst_no: p.gst_no || ''
      });
    });

    return list;
  };

  const getFormattedAddress = (opt) => {
    if (!opt) return '';
    return `${opt.company_name} - ${opt.address}${opt.phone ? `, Phone: ${opt.phone}` : ''}${opt.gst_no ? `, GST: ${opt.gst_no}` : ''}`;
  };

  const loadData = async () => {
    try {
      const [delRes, partRes, dropRes, ydPORes, dsnRes, inwardRes] = await Promise.all([
        dyedYarnDeliveryAPI.list(),
        partyAPI.list(),
        dropdownAPI.getAll(),
        yarnDyeingPOAPI.list(),
        designEntryAPI.list(),
        yarnInwardAPI.list()
      ]);
      setDeliveries(delRes.data || []);
      setParties(partRes.data || []);
      setOptions(dropRes.data || {});
      setYarnDyeingPOs(ydPORes.data || []);
      setDesigns(dsnRes.data || []);
      setYarnInwards(inwardRes.data || []);
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

    let totalKgs = 0;
    let tBags = 0;
    let tCones = 0;
    let tAmount = 0;

    const newItems = form.items.map(item => {
      const kgs = parseFloat(item.total_kgs) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = kgs * rate;

      totalKgs += kgs;
      tBags += parseInt(item.bags) || 0;
      tCones += parseInt(item.cones) || 0;
      tAmount += amount;

      return { ...item, amount };
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
        prev.total_dely_kgs === totalKgs &&
        prev.gross_amount === gross && prev.grand_total === rounded &&
        JSON.stringify(prev.items) === JSON.stringify(newItems)
      ) {
        return prev; // Prevent infinite loop
      }
      return {
        ...prev,
        items: newItems,
        total_dely_kgs: totalKgs,
        gross_amount: gross,
        taxable_amount: taxable,
        sgst_amount: sgstAmt,
        cgst_amount: cgstAmt,
        igst_amount: igstAmt,
        total_gst: totGst,
        round_off: roundOff,
        grand_total: rounded,
        balance: balFin
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
      if (!payload.ref_date) payload.ref_date = null;
      if (!payload.dc_date) payload.dc_date = null;

      if (editingId) {
        await dyedYarnDeliveryAPI.update(editingId, payload);
      } else {
        await dyedYarnDeliveryAPI.create(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving delivery');
      console.error(err);
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
    } catch (err) { alert('Error saving custom transport'); }
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

  const handleSaveCustomCertificateType = async () => {
    if (!customCertificateTypeVal.trim()) return;
    try {
      await subMasterAPI.create('certified_type', { entity: 'certified_type', name: customCertificateTypeVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      setForm({ ...form, certificate_type: customCertificateTypeVal.trim() });
      setIsCustomCertificateType(false);
      setCustomCertificateTypeVal('');
    } catch (err) { alert('Error saving custom certificate type'); }
  };

  const handleSaveCustomColour = async () => {
    if (!customColourVal.trim() || customColourIdx === null) return;
    try {
      await subMasterAPI.create('color_master', { entity: 'color_master', name: customColourVal.trim(), is_active: true });
      const dropRes = await dropdownAPI.getAll();
      setOptions(dropRes.data);
      const newItems = [...form.items];
      const col = customColourVal.trim();
      newItems[customColourIdx].color = col;
      
      const c = newItems[customColourIdx].count;
      const l = newItems[customColourIdx].our_lot_no;
      let itemStock = 0;
      let itemBags = 0;
      (yarnInwards || []).forEach(inward => {
        if (inward.items && Array.isArray(inward.items)) {
          inward.items.forEach(inwItem => {
            const matchCount = String(inwItem.yarn_count || '').trim().toLowerCase() === String(c).trim().toLowerCase();
            const matchLot = String(inwItem.lot_no || '').trim().toLowerCase() === String(l).trim().toLowerCase();
            const matchColor = !col || !inwItem.colour || String(inwItem.colour || '').trim().toLowerCase() === String(col || '').trim().toLowerCase();
            if (matchCount && matchLot && matchColor) {
              itemStock += parseFloat(inwItem.kgs) || 0;
              itemBags += parseInt(inwItem.bags) || 0;
            }
          });
        }
      });
      newItems[customColourIdx].stock = itemStock;
      newItems[customColourIdx].bags = itemBags;

      setForm({ ...form, items: newItems });
      setCustomColourIdx(null);
      setCustomColourVal('');
    } catch (err) { alert('Error saving custom color'); }
  };

  const handleFetchFromYarnDyeingPO = (po_no) => {
    if (!po_no) {
      setForm(prev => ({ ...prev, order_no: '', yarn_dyeing_po_no: '' }));
      return;
    }
    const po = yarnDyeingPOs.find(p => p.po_no === po_no);
    if (po) {
      setForm(prev => {
        const newForm = {
          ...prev,
          order_no: po_no,
          yarn_dyeing_po_no: po_no,
          delivery_type: 'Against Order'
        };
        newForm.party_name = po.supplier_dyeing_unit || prev.party_name;
        newForm.design_no = po.design_no || prev.design_no;
        newForm.sgst_pct = po.sgst_pct !== undefined ? po.sgst_pct : prev.sgst_pct;
        newForm.cgst_pct = po.cgst_pct !== undefined ? po.cgst_pct : prev.cgst_pct;
        newForm.igst_pct = po.igst_pct !== undefined ? po.igst_pct : prev.igst_pct;
        
        const firstItem = po.items?.[0];
        newForm.design_count = firstItem?.yarn_count || firstItem?.dsn_count || po.dsn_count || prev.design_count;

        let prevDeliveredItemsMap = {};

        if (po.items && po.items.length > 0) {
          let sumOrderKgs = 0;
          newForm.items = po.items.map(item => {
            const ordQty = parseFloat(item.tot_qty) || 0;
            sumOrderKgs += ordQty;
            const prevQty = prevDeliveredItemsMap[item.id] || 0;
            const bal = ordQty - prevQty;

            const c = item.yarn_count || item.dsn_count || '';
            const l = item.lot_no || '';
            const col = item.color || item.colour || '';

            let itemStock = 0;
            let itemBags = 0;
            (yarnInwards || []).forEach(inward => {
              if (inward.items && Array.isArray(inward.items)) {
                inward.items.forEach(inwItem => {
                  const matchCount = String(inwItem.yarn_count || '').trim().toLowerCase() === String(c).trim().toLowerCase();
                  const matchLot = String(inwItem.lot_no || '').trim().toLowerCase() === String(l).trim().toLowerCase();
                  const matchColor = !col || !inwItem.colour || String(inwItem.colour || '').trim().toLowerCase() === String(col || '').trim().toLowerCase();
                  if (matchCount && matchLot && matchColor) {
                    itemStock += parseFloat(inwItem.kgs) || 0;
                    itemBags += parseInt(inwItem.bags) || 0;
                  }
                });
              }
            });

            return {
              cone_type: 'Full Cone',
              count: c,
              our_lot_no: l,
              color: col,
              stock: itemStock,
              bags: itemBags,
              cones: parseInt(item.no_of_cones) || 0,
              total_kgs: bal > 0 ? bal : 0,
              rate: parseFloat(item.rate) || 0,
              amount: (bal > 0 ? bal : 0) * (parseFloat(item.rate) || 0)
            };
          });
          newForm.order_kgs = sumOrderKgs;
        }
        return newForm;
      });
    } else {
      setForm(prev => ({ ...prev, order_no: po_no, yarn_dyeing_po_no: po_no }));
    }
  };

  const handleOpenNewForm = () => {
    setEditingId(null);
    setIsReadOnly(false);
    let maxNum = 0;
    deliveries.forEach(d => {
      if (d.dc_no && d.dc_no.toUpperCase().startsWith("YDD-")) {
        const parts = d.dc_no.split("-");
        if (parts.length > 1) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    const nextDcNo = `YDD-${String(maxNum + 1).padStart(5, '0')}`;
    setForm({
      ...initialForm,
      dc_no: nextDcNo,
      dc_date: new Date().toISOString().split('T')[0],
      ref_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleOpenForm = async (entry, readOnly = false) => {
    try {
      const { data } = await dyedYarnDeliveryAPI.get(entry.id);
      if (data.dc_date) data.dc_date = data.dc_date.substring(0, 10);
      if (data.ref_date) data.ref_date = data.ref_date.substring(0, 10);

      const dataWithCalculatedAmounts = {
        ...data,
        terms_conditions: (data.terms_conditions && data.terms_conditions.length > 0) ? data.terms_conditions : initialForm.terms_conditions,
        items: (data.items || []).map(item => ({
          ...item,
          amount: (parseFloat(item.total_kgs) || 0) * (parseFloat(item.rate) || 0)
        }))
      };

      setForm({ ...initialForm, ...dataWithCalculatedAmounts });
      setEditingId(data.id);
      setIsReadOnly(readOnly);
      setActiveTab('general');
      setShowForm(true);
      setSelectedViewEntry(null);
    } catch (err) {
      alert("Error loading delivery details.");
    }
  };

  const toggleSelectAll = (filteredData = []) => {
    if (selectedIds.length === filteredData.length && filteredData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(o => o.id));
    }
  };

  const toggleSelectRow = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id, dc, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${dc}?`)) {
      try {
        await dyedYarnDeliveryAPI.delete(id);
        setSelectedIds(prev => prev.filter(item => item !== id));
        if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected dyed yarn delivery(s)?`)) {
      try {
        await Promise.all(selectedIds.map(id => dyedYarnDeliveryAPI.delete(id)));
        setSelectedIds([]);
        if (selectedViewEntry && selectedIds.includes(selectedViewEntry.id)) setSelectedViewEntry(null);
        loadData();
      } catch (err) {
        alert('Error deleting selected deliveries');
        console.error(err);
        loadData();
      }
    }
  };

  const handleRowClick = async (entry) => {
    try {
      const { data } = await dyedYarnDeliveryAPI.get(entry.id);
      setSelectedViewEntry(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === 'number') value = parseFloat(value) || 0;

    if (name === 'transport' && value === 'custom') {
      setIsCustomTransport(true); setCustomTransportVal(''); return;
    }
    if (name === 'delivery_mode' && value === 'custom') {
      setIsCustomDeliveryMode(true); setCustomDeliveryModeVal(''); return;
    }
    if (name === 'certificate_type' && value === 'custom') {
      setIsCustomCertificateType(true); setCustomCertificateTypeVal(''); return;
    }

    if (name === 'order_no') {
      handleFetchFromYarnDyeingPO(value);
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => setForm({ ...form, items: [...form.items, initialForm.items[0]] });
  const removeItem = (index) => setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    if (field === 'color' && value === 'custom') {
      setCustomColourIdx(index);
      setCustomColourVal('');
      return;
    }
    const newItems = [...form.items];
    let val = value;
    if (['stock', 'bags', 'cones', 'total_kgs', 'rate', 'amount'].includes(field)) val = parseFloat(value) || 0;
    newItems[index][field] = val;

    if (field === 'total_kgs' || field === 'rate') {
      newItems[index].amount = (parseFloat(newItems[index].total_kgs) || 0) * (parseFloat(newItems[index].rate) || 0);
    }

    if (field === 'count' || field === 'our_lot_no' || field === 'color') {
      const c = newItems[index].count;
      const l = newItems[index].our_lot_no;
      const col = newItems[index].color;
      let itemStock = 0;
      let itemBags = 0;
      (yarnInwards || []).forEach(inward => {
        if (inward.items && Array.isArray(inward.items)) {
          inward.items.forEach(inwItem => {
            const matchCount = String(inwItem.yarn_count || '').trim().toLowerCase() === String(c).trim().toLowerCase();
            const matchLot = String(inwItem.lot_no || '').trim().toLowerCase() === String(l).trim().toLowerCase();
            const matchColor = !col || !inwItem.colour || String(inwItem.colour || '').trim().toLowerCase() === String(col || '').trim().toLowerCase();
            if (matchCount && matchLot && matchColor) {
              itemStock += parseFloat(inwItem.kgs) || 0;
              itemBags += parseInt(inwItem.bags) || 0;
            }
          });
        }
      });
      newItems[index].stock = itemStock;
      newItems[index].bags = itemBags;
    }

    setForm({ ...form, items: newItems });
  };

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = searchTerm === '' ||
      d.dc_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.party_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || d.delivery_type === typeFilter;

    let matchesDate = true;
    if (d.dc_date) {
      const entryDate = new Date(d.dc_date);
      if (fromDate) matchesDate = matchesDate && entryDate >= new Date(fromDate);
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59);
        matchesDate = matchesDate && entryDate <= tDate;
      }
    }
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Handloom ERP - Dyed Yarn Deliveries", 14, 15);
    const headers = [["DC No", "DC Date", "Party Name", "Delivery Type", "Status"]];
    const rows = filteredDeliveries.map(d => [
      d.dc_no || '-',
      d.dc_date || '-',
      d.party_name || '-',
      d.delivery_type || '-',
      d.status || '-'
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 20 });
    doc.save(`Dyed_Yarn_Delivery_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDeliveries.map(d => ({
      "DC No": d.dc_no,
      "DC Date": d.dc_date,
      "Party Name": d.party_name,
      "Delivery Type": d.delivery_type,
      "Mode": d.delivery_mode,
      "Vehicle No": d.vehicle_no,
      "Total Dely Kgs": d.total_dely_kgs,
      "Status": d.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dyed Yarn Deliveries");
    XLSX.writeFile(wb, `Dyed_Yarn_Delivery_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tabs = [
    { id: 'general', label: 'Delivery Information', icon: FileText },
    { id: 'yarn', label: 'Yarn Delivery Table', icon: Package }
  ];

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

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={24} color="var(--primary)" /> Dyed Yarn Delivery
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage dispatch of dyed yarn.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={16} /> Export <ChevronDown size={14} />
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
              <button className="btn btn-primary" onClick={handleOpenNewForm}>
                <Plus size={18} /> New Delivery
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" onClick={() => setTypeFilter('All Types')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><Truck size={24} /></div>
              <div className="stat-details"><h3>Total Deliveries</h3><div className="value">{deliveries.length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Direct')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Truck size={24} /></div>
              <div className="stat-details"><h3>Direct</h3><div className="value">{deliveries.filter(d => d.delivery_type === 'Direct').length}</div></div>
            </div>
            <div className="card stat-card" onClick={() => setTypeFilter('Against Order')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><FileText size={24} /></div>
              <div className="stat-details"><h3>Against PO</h3><div className="value">{deliveries.filter(d => d.delivery_type === 'Against Order').length}</div></div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search DC or Party..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ width: 130, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option>All Types</option><option>Direct</option><option>Against Order</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span><input type="date" className="form-control" style={{ width: 130, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="card animate-fade" style={{ padding: '12px 20px', marginBottom: 16, background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#991b1b', fontWeight: 700, fontSize: 14 }}>
                  {selectedIds.length} dyed yarn delivery{selectedIds.length > 1 ? 'ies' : ''} selected
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </button>
              </div>
              <button
                className="btn"
                style={{ background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}
                onClick={handleBulkDelete}
              >
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={filteredDeliveries.length > 0 && selectedIds.length === filteredDeliveries.length}
                          onChange={() => toggleSelectAll(filteredDeliveries)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                      </th>
                      <th>DC No</th><th>DC Date</th><th>Party</th><th>Type</th><th>Items</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : filteredDeliveries.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No deliveries found.</td></tr>
                    ) : filteredDeliveries.map(d => (
                      <tr key={d.id} onClick={() => handleRowClick(d)} style={{ cursor: 'pointer', background: selectedIds.includes(d.id) ? 'rgba(239, 68, 68, 0.05)' : selectedViewEntry?.id === d.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ textAlign: 'center' }} onClick={evt => evt.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(d.id)}
                            onChange={(evt) => toggleSelectRow(d.id, evt)}
                            style={{ cursor: 'pointer', width: 16, height: 16 }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.dc_no}</td>
                        <td>{d.dc_date}</td>
                        <td style={{ fontWeight: 500 }}>{d.party_name || '-'}</td>
                        <td><span className={`badge ${d.delivery_type === 'Direct' ? 'badge-draft' : 'badge-active'}`}>{d.delivery_type}</span></td>
                        <td>{d.items?.length || 0}</td>
                        <td onClick={evt => evt.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => { setViewModalDelivery(d); }}
                              title="Invoice PDF Preview"
                            >
                              <FileText size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(d, false)} title="Edit"><Edit2 size={14} /></button>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(evt) => handleDelete(d.id, d.dc_no, evt)} title="Delete"><Trash2 size={14} color="#ef4444" /></button>
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
                      <Truck size={18} /> {selectedViewEntry.dc_no}
                    </h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => { setViewModalDelivery(selectedViewEntry); }}
                        title="Invoice PDF Preview"
                      >
                        <FileText size={16} color="var(--primary)" />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(selectedViewEntry, false)} title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                    <DetailRow label="DC Date" value={selectedViewEntry.dc_date} />
                    <DetailRow label="Type" value={selectedViewEntry.delivery_type} />
                    <DetailRow label="Party Name" value={selectedViewEntry.party_name} />
                    <DetailRow label="Mode" value={selectedViewEntry.delivery_mode} />
                    <DetailRow label="Vehicle No" value={selectedViewEntry.vehicle_no} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Metrics</h4>
                    <DetailRow label="Total Kgs Dely" value={`${selectedViewEntry.total_dely_kgs} kg`} />
                    <DetailRow label="Balance Kgs" value={`${selectedViewEntry.balance_kgs} kg`} />

                    <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items ({selectedViewEntry.items?.length || 0})</h4>
                    {selectedViewEntry.items?.map((c, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Count: {c.count}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>Bags: {c.bags}</span>
                          <span>Total Kgs: {c.total_kgs}</span>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isReadOnly ? 'View Delivery Details' : editingId ? 'Edit Delivery' : 'New Dyed Yarn Delivery'}</h2>
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
              <FileText size={18} /> Delivery Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>

              <div className="animate-fade">
                  {/* Section 1: Delivery Information */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Delivery Information</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group"><label>DC Date *</label><input type="date" className="form-control" name="dc_date" value={form.dc_date} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Acl Date</label><input type="date" className="form-control" name="ref_date" value={form.ref_date} onChange={handleChange} /></div>
                    <div className="form-group">
                      <label>Order No (Yarn Dyeing PO)</label>
                      <select className="form-control" name="order_no" value={form.order_no} onChange={handleChange}>
                        <option value="">Select PO...</option>
                        {yarnDyeingPOs.map(po => <option key={po.id} value={po.po_no}>{po.po_no} - {po.supplier_dyeing_unit}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Stock Godown</label>
                      <input className="form-control" name="stock_godown" value={form.stock_godown} onChange={handleChange} />
                    </div>
                    <div className="form-group"><label>Delivery Type</label>
                      <select className="form-control" name="delivery_type" value={form.delivery_type} onChange={handleChange}>
                        <option>Direct</option><option>Against Order</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Party Name</label>
                      <select className="form-control" name="party_name" value={form.party_name} onChange={handleChange}>
                        <option value="">Select Party...</option>
                        {parties.map(p => <option key={p.id} value={p.company_name}>{p.company_name}</option>)}
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
                    <div className="form-group">
                      <label>Design No</label>
                      <select className="form-control" name="design_no" value={form.design_no} onChange={handleChange}>
                        <option value="">Select Design No...</option>
                        {designs.map(d => (
                          <option key={d.id} value={d.ds_ref_no || d.design_no}>
                            {d.ds_ref_no || d.design_no} {d.design_no ? `(${d.design_no})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 4' }}>
                      <label>Delivery Address</label>
                      <select 
                        className="form-control" 
                        name="delivery_address" 
                        value={form.delivery_address || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm(prev => ({ ...prev, delivery_address: val }));
                        }}
                      >
                        <option value="">Select Delivery Location...</option>
                        {form.delivery_address && !getDeliveryOptions().some(opt => getFormattedAddress(opt) === form.delivery_address) && (
                          <option value={form.delivery_address}>{form.delivery_address}</option>
                        )}
                        {getDeliveryOptions().map((opt, idx) => {
                          const formatted = getFormattedAddress(opt);
                          const displayLabel = `${opt.company_name} - ${opt.address}${opt.phone ? `, Phone: ${opt.phone}` : ''}${opt.gst_no ? `, GST: ${opt.gst_no}` : ''}`;
                          return (
                            <option key={idx} value={formatted}>
                              {displayLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 4' }}>
                      <label>Transport</label>
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
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Vechile No</label><input className="form-control" name="vehicle_no" value={form.vehicle_no} onChange={handleChange} /></div>
                    <div className="form-group"><label>Driver Name</label><input className="form-control" name="delivery_name" value={form.delivery_name} onChange={handleChange} /></div>
                    <div className="form-group"><label>Delivery Time</label><input className="form-control" name="delivery_time" value={form.delivery_time} onChange={handleChange} /></div>

                    <div className="form-group"><label>Certificate Type</label>
                      {isCustomCertificateType ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" className="form-control" placeholder="New Certificate" value={customCertificateTypeVal} onChange={e => setCustomCertificateTypeVal(e.target.value)} />
                          <button type="button" className="btn btn-primary" onClick={handleSaveCustomCertificateType} style={{ padding: '0 12px' }}><CheckCircle size={16} /></button>
                          <button type="button" className="btn btn-secondary" onClick={() => setIsCustomCertificateType(false)} style={{ padding: '0 12px' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <select className="form-control" name="certificate_type" value={form.certificate_type || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          {options.masters?.certified_type?.map(o => <option key={o} value={o}>{o}</option>)}
                          <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group"><label>Design Count</label><input className="form-control" name="design_count" value={form.design_count} onChange={handleChange} /></div>
                    <div className="form-group"><label>Order Kgs / Total Kgs</label><input type="number" className="form-control" name="order_kgs" value={form.order_kgs} onChange={handleChange} /></div>

                    <div className="form-group"><label>Total Dely Kgs</label><input type="number" className="form-control" name="total_dely_kgs" value={form.total_dely_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Total Rtn Kgs</label><input type="number" className="form-control" name="total_rtn_kgs" value={form.total_rtn_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Balance Kgs</label><input type="number" className="form-control" name="balance_kgs" value={form.balance_kgs} onChange={handleChange} /></div>
                    <div className="form-group"><label>Status</label><input className="form-control" name="status" value={form.status} onChange={handleChange} /></div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Remarks</label>
                      <textarea className="form-control" name="remarks" value={form.remarks || ''} onChange={handleChange} rows={2} style={{ resize: 'vertical', margin: 0 }} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Transport Remarks</label>
                      <textarea className="form-control" name="transport_remarks" value={form.transport_remarks || ''} onChange={handleChange} rows={2} style={{ resize: 'vertical', margin: 0 }} />
                    </div>
                  </div>
                </div>

                <div className="animate-fade" style={{ marginTop: 32 }}>
                  {/* Section 2: Yarn Delivery Table */}
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Yarn Delivery Table</h4>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={16} /> Add Row</button>
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>SNo</th><th>Cone Type</th><th>Count</th><th>Our Lot No</th><th>Color</th>
                          <th>Stock</th><th>Bag</th><th>Cones</th><th>Tot Kgs</th><th>Rate</th><th>Amount</th><th>X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <select className="form-control" style={{ width: 110 }} value={item.cone_type} onChange={e => updateItem(idx, 'cone_type', e.target.value)}>
                                <option>Full Cone</option><option>Half Cone</option>
                              </select>
                            </td>
                            <td><input className="form-control" style={{ width: 110 }} value={item.count} onChange={e => updateItem(idx, 'count', e.target.value)} /></td>
                            <td><input className="form-control" style={{ width: 110 }} value={item.our_lot_no} onChange={e => updateItem(idx, 'our_lot_no', e.target.value)} /></td>
                            <td>
                              {customColourIdx === idx ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <input type="text" className="form-control" style={{ width: 100 }} placeholder="New Color" value={customColourVal} onChange={e => setCustomColourVal(e.target.value)} />
                                  <button type="button" className="btn btn-primary" onClick={handleSaveCustomColour} style={{ padding: '0 8px' }}><CheckCircle size={14} /></button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setCustomColourIdx(null)} style={{ padding: '0 8px' }}><X size={14} /></button>
                                </div>
                              ) : (
                                <select className="form-control" style={{ width: 110 }} value={item.color || ''} onChange={e => updateItem(idx, 'color', e.target.value)}>
                                  <option value="">Select...</option>
                                  {item.color && !options.masters?.color_master?.includes(item.color) && (
                                    <option value={item.color}>{item.color}</option>
                                  )}
                                  {options.masters?.color_master?.map(o => <option key={o} value={o}>{o}</option>)}
                                  <option value="custom" style={{ color: '#3b82f6', fontWeight: 600 }}>+ Add Custom...</option>
                                </select>
                              )}
                            </td>
                            <td><input type="number" className="form-control" style={{ width: 80 }} value={item.stock} onChange={e => updateItem(idx, 'stock', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80 }} value={item.bags} onChange={e => updateItem(idx, 'bags', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 80 }} value={item.cones} onChange={e => updateItem(idx, 'cones', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 90 }} value={item.total_kgs} onChange={e => updateItem(idx, 'total_kgs', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 90 }} value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                            <td><input type="number" className="form-control" style={{ width: 100 }} value={item.amount} disabled /></td>
                            <td><button type="button" onClick={() => removeItem(idx)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial & Logistics Summary below table */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start', marginTop: 24 }}>
                    {/* Left side: Terms & Conditions */}
                    <div style={{ flex: 1, minWidth: 300 }}>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>TERMS & CONDITIONS</span>
                        </div>
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(form.terms_conditions || []).map((term, idx) => (
                              <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {editingTermIdx === idx ? (
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <input type="text" className="form-control" style={{ flex: 1, margin: 0, fontSize: 13, border: '1px solid var(--primary)' }} value={editingTermVal} onChange={e => setEditingTermVal(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const updated = [...form.terms_conditions]; updated[idx] = editingTermVal; setForm({ ...form, terms_conditions: updated }); setEditingTermIdx(null); }}} />
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

                    {/* Right side: Financial Summary Card */}
                    <div style={{ flex: '0 0 380px', minWidth: 320 }}>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>FINANCIAL SUMMARY</span>
                        </div>
                        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Freight Charges</span>
                            <input type="number" className="form-control" name="freight_charges" value={form.freight_charges} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Loading Charges</span>
                            <input type="number" className="form-control" name="loading_charges" value={form.loading_charges} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Unloading Charges</span>
                            <input type="number" className="form-control" name="unloading_charges" value={form.unloading_charges} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Insurance</span>
                            <input type="number" className="form-control" name="insurance_charges" value={form.insurance_charges} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Others</span>
                            <input type="number" className="form-control" name="other_charges" value={form.other_charges} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>

                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px dashed var(--border)' }} />

                          <DetailRow label="Gross Amount" value={`₹${parseFloat(form.gross_amount || 0).toFixed(2)}`} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Discount</span>
                            <input type="number" className="form-control" name="discount" value={form.discount} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>

                          <DetailRow label="Taxable Amount" value={`₹${parseFloat(form.taxable_amount || 0).toFixed(2)}`} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>SGST (%)</span>
                            <input type="number" className="form-control" name="sgst_pct" value={form.sgst_pct} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>CGST (%)</span>
                            <input type="number" className="form-control" name="cgst_pct" value={form.cgst_pct} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>IGST (%)</span>
                            <input type="number" className="form-control" name="igst_pct" value={form.igst_pct} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
                          </div>

                          <DetailRow label="Total GST" value={`₹${parseFloat(form.total_gst || 0).toFixed(2)}`} />
                          <DetailRow label="Round Off" value={`₹${parseFloat(form.round_off || 0).toFixed(2)}`} />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>GRAND TOTAL</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                              INR {parseFloat(form.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Advance</span>
                            <input type="number" className="form-control" name="advance" value={form.advance} onChange={handleChange} style={{ width: 120, padding: '4px 8px', margin: 0, textAlign: 'right' }} />
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
            </fieldset>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Close
              </button>
              {!isReadOnly && (
                <button type="button" className="btn btn-primary" onClick={handleCreate}>
                  <Save size={16} /> {editingId ? 'Update Delivery' : 'Save Delivery'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <A4DocumentPreview
        isOpen={!!viewModalDelivery}
        onClose={() => setViewModalDelivery(null)}
        title="YARN DYEING DELIVERY"
        documentNumber={viewModalDelivery?.dc_no}
        status={viewModalDelivery?.status}
        sections={viewModalDelivery ? [
          {
            title: "DELIVERY INFORMATION",
            icon: "Briefcase",
            type: "grid",
            data: [
              { label: "DC Number", value: viewModalDelivery.dc_no },
              { label: "DC Date", value: viewModalDelivery.dc_date },
              { label: "Party Name", value: viewModalDelivery.party_name },
              { label: "Vehicle Number", value: viewModalDelivery.vehicle_no || '-' },
              { label: "Driver Name", value: viewModalDelivery.delivery_name || '-' },
              { label: "Remarks", value: viewModalDelivery.remarks || '-' },
              { label: "Transport Remarks", value: viewModalDelivery.transport_remarks || '-' }
            ]
          },
          {
            title: "YARN CONSIGNMENT",
            icon: "Box",
            type: "grid",
            data: [
              { label: "Total Kgs", value: `${viewModalDelivery.total_dely_kgs || 0} Kg` }
            ]
          },
          {
            title: "TERMS & CONDITIONS",
            icon: "FileText",
            type: "list",
            data: (viewModalDelivery.terms_conditions || []).map((term, i) => ({
              label: `${i + 1}`,
              value: term
            }))
          }
        ] : []}
      />
    </div>
  );
}
