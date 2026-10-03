import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ArrowLeft, ArrowLeftRight, Award, Box, Briefcase, Building, Calendar, Check, CheckCircle2, ChevronRight, ClipboardList, Clock, Download, Edit2, Eye, FileSpreadsheet, FileText, IndianRupee, Loader, MapPin, Phone, Plus, Printer, RefreshCw, Save, Search, Shield, ShieldAlert, Sparkles, Trash2, TrendingUp, User, Users, X, XCircle, Filter, Globe, Mail } from 'lucide-react';

import storesService from '../../services/storesService';

import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';
import { alertDialog } from '../../utils/dialogs';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function PurchaseRequisition() {
  // Navigation tabs: 'list', 'new', 'view', 'analytics'
  const [activeTab, setActiveTab] = useState('list');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [editingId, setEditingId] = useState(null);

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [prList, setPrList] = useState([]);
  const [selectedPr, setSelectedPr] = useState(null);
  const [stats, setStats] = useState({
    totalPRs: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    convertedToPO: 0,
    urgentRequests: 0,
    monthlyPurchaseValue: 0,
    averageApprovalTime: '4.2 Hours',
    deptDistribution: [],
    catDistribution: [],
    monthlyTrend: []
  });

  // Dropdowns lists dynamically populated from master DBs
  const [masters, setMasters] = useState({
    departments: [],
    categories: [],
    uoms: [],
    vendors: [],
    items: [],
    subcategories: [],
    warehouses: [],
    costCenters: [],
    budgets: [],
    employees: []
  });

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Notification Banner State (duplicate warnings, budget validation)
  const [notifications, setNotifications] = useState([]);

  // Approval Modal Actions
  const [approvalModal, setApprovalModal] = useState({
    open: false,
    prId: null,
    stage: 'Department Manager Approval',
    status: 'Approved',
    comments: ''
  });

  const [form, setForm] = useState({
    required_date: '',
    request_type: '',
    priority: '',
    description: '',
    requester_id: '',
    department_id: '',
    cost_center_id: '',
    branch_factory: '',
    delivery_warehouse_id: '',
    delivery_plant: '',
    delivery_department_id: '',
    delivery_address: '',
    expected_delivery_date: '',
    budget_id: '',
    items: [
      {
        item_id: '',
        category_id: '',
        subcategory_id: '',
        uom_id: '',
        vendor_id: '',
        warehouse_id: '',
        quantity: '',
        estimated_unit_price: '',
        gst: '',
        currency: '',
        rack_bin: '',
        brand: '',
        specification: '',
        remarks: '',
        // Smart indicators
        current_stock: '',
        reserved_stock: '',
        available_stock: '',
        reorder_level: '',
        suggested_qty: '',
        history: null,
        recs: []
      }
    ]
  });

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    if (type === 'error') alert(message);
  };

  // Initial Seed check and load master databases
  useEffect(() => {
    loadMasters();
    loadPRData();
  }, []);

  const loadPRData = async () => {
    setLoading(true);
    try {
      const listData = await storesService.getPRList(searchTerm);
      setPrList(listData);
      const statsData = await storesService.getPRStats();
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch requisitions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMasters = async () => {
    try {
      const [depts, cats, uoms, vendors, items, subcats, warehouses, costCenters, budgets, employees] = await Promise.all([
        storesService.getDepartments(),
        storesService.getCategories(),
        storesService.getUOMs(),
        storesService.getVendors(),
        storesService.getItems(),
        storesService.getSubcategories(),
        storesService.getWarehouses(),
        storesService.getCostCenters(),
        storesService.getBudgets(),
        storesService.getEmployees()
      ]);

      setMasters({
        departments: depts || [],
        categories: cats || [],
        uoms: uoms || [],
        vendors: vendors || [],
        items: items || [],
        subcategories: subcats || [],
        warehouses: warehouses || [],
        costCenters: costCenters || [],
        budgets: budgets || [],
        employees: employees || []
      });

      // Auto populate first employee if logged in requester
      if (employees && employees.length > 0) {
        const adminEmp = employees.find(e => e.employee_code === 'admin') || employees[0];
        const deptObj = depts.find(d => d.department_name === adminEmp.department);

        setForm(prev => ({
          ...prev,
          requester_id: adminEmp.id,
          department_id: deptObj ? deptObj.id : (depts[0]?.id || '')
        }));
      }
    } catch (err) {
      console.error(err);
      showToast('Error seeding master dropdown lists.', 'error');
    }
  };

  // Re-fetch on filter change
  useEffect(() => {
    loadPRData();
  }, [searchTerm]);

  // Handle requester employee selection -> auto fill department details
  const handleEmployeeChange = (empId) => {
    const emp = masters.employees.find(e => e.id === parseInt(empId) || e.id.toString() === empId.toString());
    if (emp) {
      const deptObj = masters.departments.find(d => d.department_name === emp.department);
      setForm(prev => ({
        ...prev,
        requester_id: empId,
        department_id: deptObj ? deptObj.id : prev.department_id
      }));
    } else {
      setForm(prev => ({
        ...prev,
        requester_id: empId
      }));
    }
  };

  // Handle single item field update
  const handleItemChange = async (index, field, value) => {
    const updatedItems = [...form.items];
    updatedItems[index][field] = value;

    // If item selection changes -> load live stock levels and historical suggestions
    if (field === 'item_id') {
      const selectedItem = masters.items.find(i => i.id === parseInt(value));
      if (selectedItem) {
        updatedItems[index].item_name = selectedItem.item_name;
        updatedItems[index].category_id = selectedItem.category_id;
        updatedItems[index].uom_id = selectedItem.uom_id;
        updatedItems[index].warehouse_id = masters.warehouses[0]?.id || '';
        updatedItems[index].rack_bin = selectedItem.bin || '';
        updatedItems[index].current_stock = selectedItem.current_stock || 0;
        updatedItems[index].reorder_level = selectedItem.reorder_level || 0;
        updatedItems[index].reserved_stock = Math.max(0, Math.floor(selectedItem.minimum_stock * 0.5));
        updatedItems[index].available_stock = selectedItem.current_stock - updatedItems[index].reserved_stock;

        // Auto Reorder Suggestion logic
        if (updatedItems[index].available_stock < selectedItem.reorder_level) {
          updatedItems[index].suggested_qty = Math.max(1, selectedItem.reorder_level - updatedItems[index].available_stock);
          updatedItems[index].quantity = updatedItems[index].suggested_qty;
        } else {
          updatedItems[index].suggested_qty = 0;
        }

        // Live Fetch historical prices & vendor recommendations
        try {
          const history = await storesService.getItemPurchaseHistory(value);
          const recs = await storesService.getItemVendorRecommendations(value);
          updatedItems[index].history = history;
          updatedItems[index].recs = recs;
          if (recs && recs.length > 0) {
            updatedItems[index].vendor_id = recs[0].vendor_id;
            updatedItems[index].estimated_unit_price = recs[0].price;
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    setForm(prev => ({ ...prev, items: updatedItems }));
    validateRequisitionBudget(updatedItems, form.budget_id);
    checkForDuplicateRequests(updatedItems);
  };

  // Add / Remove material row
  const addMaterialRow = () => {
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_id: '',
          category_id: '',
          subcategory_id: '',
          uom_id: '',
          vendor_id: '',
          warehouse_id: '',
          quantity: '',
          estimated_unit_price: '',
          gst: '',
          currency: '',
          rack_bin: '',
          brand: '',
          specification: '',
          remarks: '',
          current_stock: '',
          reserved_stock: '',
          available_stock: '',
          reorder_level: '',
          suggested_qty: '',
          history: null,
          recs: []
        }
      ]
    }));
  };

  const removeMaterialRow = (index) => {
    if (form.items.length === 1) return;
    const updated = form.items.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, items: updated }));
    validateRequisitionBudget(updated, form.budget_id);
  };

  // Estimated Requisition Grand Total
  const calculateGrandTotal = (itemsList = form.items) => {
    return itemsList.reduce((acc, item) => acc + (item.quantity * item.estimated_unit_price), 0);
  };

  // Smart feature: Budget validation
  const validateRequisitionBudget = (itemsList, budgetId) => {
    if (!budgetId) return;
    const budget = masters.budgets.find(b => b.id === parseInt(budgetId));
    if (budget) {
      const estimatedCost = calculateGrandTotal(itemsList);
      const budgetRemaining = budget.budget_available - budget.budget_used;
      if (estimatedCost > budgetRemaining) {
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== 'budget-warning');
          return [
            ...filtered,
            {
              id: 'budget-warning',
              type: 'warning',
              message: `Estimated cost (${estimatedCost.toLocaleString()} INR) exceeds remaining budget (${budgetRemaining.toLocaleString()} INR)!`
            }
          ];
        });
      } else {
        setNotifications(prev => prev.filter(n => n.id !== 'budget-warning'));
      }
    }
  };

  // Smart Feature: Duplicate request warnings
  const checkForDuplicateRequests = (itemsList) => {
    const duplicates = [];
    const itemIdsSeen = new Set();
    itemsList.forEach((item, index) => {
      if (item.item_id && itemIdsSeen.has(item.item_id)) {
        const itemObj = masters.items.find(i => i.id === parseInt(item.item_id));
        duplicates.push(`Duplicate warning: '${itemObj?.item_name || 'Item'}' is added multiple times in this form.`);
      }
      if (item.item_id) itemIdsSeen.add(item.item_id);
    });

    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== 'duplicate-warning');
      if (duplicates.length > 0) {
        return [
          ...filtered,
          { id: 'duplicate-warning', type: 'error', message: duplicates.join(' ') }
        ];
      }
      return filtered;
    });
  };

  // Submit Requisition form
  const handlePRSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.required_date ||
      !form.budget_id ||
      !form.requester_id ||
      !form.department_id ||
      !form.cost_center_id ||
      !form.branch_factory ||
      !form.delivery_warehouse_id
    ) {
      alertDialog({ title: 'Validation Error', message: 'Please fill in all required coordinates (Date, Budget, Requester, Department, Cost Center, Branch, Delivery Warehouse).', type: 'error' });
      return;
    }

    if (!form.items || form.items.length === 0) {
      alertDialog({ title: 'Validation Error', message: 'Please add at least one material item.', type: 'error' });
      return;
    }

    if (isNaN(parseInt(form.delivery_warehouse_id))) {
      alertDialog({ title: 'Validation Error', message: 'Please select a valid Delivery Warehouse from the dropdown.', type: 'error' });
      return;
    }
    if (isNaN(parseInt(form.budget_id))) {
      alertDialog({ title: 'Validation Error', message: 'Please select a valid Budget Code from the dropdown.', type: 'error' });
      return;
    }
    if (isNaN(parseInt(form.requester_id))) {
      alertDialog({ title: 'Validation Error', message: 'Please select a valid Requester from the dropdown.', type: 'error' });
      return;
    }
    if (isNaN(parseInt(form.department_id))) {
      alertDialog({ title: 'Validation Error', message: 'Please select a valid Department from the dropdown.', type: 'error' });
      return;
    }
    if (isNaN(parseInt(form.cost_center_id))) {
      alertDialog({ title: 'Validation Error', message: 'Please select a valid Cost Center from the dropdown.', type: 'error' });
      return;
    }

    const invalidItem = form.items.some(item =>
      (!item.item_id && !item.item_name) ||
      !item.category_id ||
      !item.uom_id ||
      item.quantity <= 0
    );
    if (invalidItem) {
      alertDialog({ title: 'Validation Error', message: 'Please specify valid items (Item, Category, UOM) and quantities greater than zero.', type: 'error' });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        required_date: form.required_date ? new Date(form.required_date).toISOString() : null,
        request_type: form.request_type || "Normal",
        priority: form.priority || "Medium",
        description: form.description || null,

        requester_id: form.requester_id ? parseInt(form.requester_id) : null,
        department_id: form.department_id ? parseInt(form.department_id) : null,
        cost_center_id: form.cost_center_id ? parseInt(form.cost_center_id) : null,
        branch_factory: form.branch_factory,

        delivery_warehouse_id: form.delivery_warehouse_id ? parseInt(form.delivery_warehouse_id) : null,
        delivery_plant: form.delivery_plant || null,
        delivery_department_id: form.delivery_department_id ? parseInt(form.delivery_department_id) : null,
        delivery_address: form.delivery_address || null,
        expected_delivery_date: form.expected_delivery_date ? new Date(form.expected_delivery_date).toISOString() : null,

        budget_id: form.budget_id ? parseInt(form.budget_id) : null,
        items: form.items.map(item => ({
          item_id: item.item_id ? parseInt(item.item_id) : null,
          item_name: item.item_name || null,
          category_id: item.category_id ? parseInt(item.category_id) : null,
          subcategory_id: item.subcategory_id ? parseInt(item.subcategory_id) : null,
          uom_id: item.uom_id ? parseInt(item.uom_id) : null,
          vendor_id: item.vendor_id ? parseInt(item.vendor_id) : null,
          warehouse_id: item.warehouse_id ? parseInt(item.warehouse_id) : null,
          quantity: parseFloat(item.quantity) || 0,
          estimated_unit_price: parseFloat(item.estimated_unit_price) || 0,
          gst: parseFloat(item.gst) || 0,
          currency: item.currency || "INR",
          rack_bin: item.rack_bin || null,
          brand: item.brand || null,
          specification: item.specification || null,
          remarks: item.remarks || null
        }))
      };

      if (editingId) {
        if (storesService.updatePR) {
          await storesService.updatePR(editingId, payload);
          showToast('Purchase Requisition updated successfully!');
        } else {
          showToast('Update endpoint not configured in storesService.', 'error');
        }
      } else {
        await storesService.createPR(payload);
        showToast('Purchase Requisition submitted successfully!');
      }
      setActiveTab('list');
      setEditingId(null);
      loadPRData();
      // Re-initialize form
      setForm(prev => ({
        ...prev,
        required_date: '',
        request_type: '',
        priority: '',
        description: '',
        requester_id: '',
        department_id: '',
        cost_center_id: '',
        branch_factory: '',
        delivery_warehouse_id: '',
        delivery_plant: '',
        delivery_department_id: '',
        delivery_address: '',
        expected_delivery_date: '',
        budget_id: '',
        items: [{
          item_id: '',
          category_id: '',
          subcategory_id: '',
          uom_id: '',
          vendor_id: '',
          warehouse_id: '',
          quantity: '',
          estimated_unit_price: '',
          gst: '',
          currency: '',
          rack_bin: '',
          brand: '',
          specification: '',
          remarks: '',
          current_stock: '',
          reserved_stock: '',
          available_stock: '',
          reorder_level: '',
          suggested_qty: '',
          history: null,
          recs: []
        }]
      }));
    } catch (err) {
      console.error(err);
      let errorMsg = 'Submission error. Verify budget codes.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => `${d.loc?.join('.') || 'Field'}: ${d.msg}`).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else {
          errorMsg = JSON.stringify(err.response.data.detail);
        }
      }

      console.error("422 BACKEND ERROR:", errorMsg);
      // Fallback native alert in case the custom UI ignores it
      window.alert("Backend rejected the form: " + errorMsg);

      alertDialog({
        title: 'Submission Error',
        message: errorMsg,
        type: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit Approval Comments
  const submitApproval = async () => {
    if (!approvalModal.comments) {
      showToast('Comments are required for approvals.', 'error');
      return;
    }
    try {
      await storesService.approvePR(approvalModal.prId, {
        approver_name: approvalModal.approver_name || 'Mr. R. Kumar',
        designation: approvalModal.designation || 'Weaving Dept Manager',
        stage: approvalModal.stage,
        status: approvalModal.status,
        comments: approvalModal.comments
      });
      showToast(`PR status updated to: ${approvalModal.status}`);
      setApprovalModal(prev => ({ ...prev, open: false }));
      loadPRData();
      if (selectedPr && selectedPr.id === approvalModal.prId) {
        const detail = await storesService.getPRDetail(selectedPr.id);
        setSelectedPr(detail);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to log approval action.', 'error');
    }
  };

  // Filter requisitions
  const filteredPRs = prList.filter(pr => {
    const matchesSearch = pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pr.requester_name && pr.requester_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority ? pr.priority === filterPriority : true;
    const matchesStatus = filterStatus ? pr.status.includes(filterStatus) : true;
    const matchesDept = filterDept ? pr.department_id === parseInt(filterDept) : true;
    return matchesSearch && matchesPriority && matchesStatus && matchesDept;
  });

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Toast Alert */}
      {toast.show && (
        <div className={`toast-notification p-3 rounded-lg shadow-xl text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ position: 'fixed', right: '20px', top: '20px', zIndex: 1100, transition: 'all 0.3s' }}>
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={24} color="var(--primary)" /> Purchase Requisition (PR)
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Manage, approve and analyze internal garment factory purchase requisitions.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ExportButton
              data={filteredPRs}
              filename="Purchase_Requisition_Report"
              pdfTitle="Purchase Requisition Report"
              columns={[
                { header: 'PR No', key: 'pr_number' },
                { header: 'Date', key: 'required_date' },
                { header: 'Requester', key: 'requester_name' },
                { header: 'Priority', key: 'priority' },
                { header: 'Status', key: 'status' }
              ]}
            />
            <button
              onClick={() => setActiveTab('new')}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={16} /> New Request
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Summary Cards */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <ClipboardList size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalPRs}</h3>
              <p>Total PRs</p>
            </div>
          </div>

          <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.pendingApproval}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.urgentRequests}</h3>
              <p>Urgent Flagged</p>
            </div>
          </div>

          <div className="card stat-card" style={{ border: 'none', boxShadow: 'none' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.monthlyPurchaseValue.toLocaleString()}</h3>
              <p>Monthly Value (INR)</p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────── TAB 1: LIST VIEW ────────────────────────────────── */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* LEFT SIDE: TABLE */}
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Search Card */}
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search PR No or Requester..."
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {loading && <Loader className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Filter size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
              </div>
              
              <select className="form-control" style={{ width: 150, margin: 0 }}>
                <option>All Types</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>
            </div>
          </div>

              {/* Table Container */}
              <div className="table-responsive" style={{ flex: 1 }}>
                {loading ? (
                  <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    <span className="text-xs">Loading requisitions…</span>
                  </div>
                ) : filteredPRs.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <ClipboardList size={48} className="text-slate-200" />
                    <span className="text-slate-500 font-semibold">No purchase requisitions found matching the filters.</span>
                  </div>
                ) : (
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>PR Number</th>
                        <th>Requester</th>
                        <th>Department</th>
                        <th>Required Date</th>
                        <th style={{ textAlign: "center" }}>Priority</th>
                        <th style={{ textAlign: "center" }}>Status</th>
                        <th style={{ textAlign: "right" }}>Grand Total</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPRs.map((pr) => {
                        const totalCost = pr.items.reduce((acc, item) => acc + (item.quantity * item.estimated_unit_price), 0);
                        return (
                          <tr
                            key={pr.id}
                            onClick={async () => {
                              const detail = await storesService.getPRDetail(pr.id);
                              setSelectedViewItem(detail);
                            }}
                            style={{
                              cursor: 'pointer',
                              background: selectedViewItem?.id === pr.id ? 'var(--bg-secondary)' : 'transparent',
                              transition: 'background 0.2s'
                            }}
                          >
                            <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{pr.pr_number}</td>
                            <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase' }}>
                                {pr.requester_name ? pr.requester_name.substring(0, 2) : 'EM'}
                              </div>
                              <span style={{ fontWeight: 600 }}>{pr.requester_name}</span>
                            </td>
                            <td>{pr.department_name}</td>
                            <td>{new Date(pr.required_date).toLocaleDateString()}</td>
                            <td style={{ textAlign: "center" }}>
                              <span className={`badge ${pr.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                pr.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                  pr.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {pr.priority}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span style={{
                                color: pr.status.includes('Approved') ? '#047857' : pr.status.includes('Rejected') ? '#ef4444' : '#d97706',
                                fontWeight: 700,
                                backgroundColor: pr.status.includes('Approved') ? '#d1fae5' : pr.status.includes('Rejected') ? '#fef2f2' : '#fef3c7',
                                padding: '4px 10px', borderRadius: 12, fontSize: 12
                              }}>
                                {pr.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{totalCost.toLocaleString()} INR</td>
                            <td onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                {pr.status === 'Requested' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={async () => {
                                      const detail = await storesService.getPRDetail(pr.id);
                                      setForm({
                                        required_date: detail.required_date ? new Date(detail.required_date).toISOString().slice(0, 10) : '',
                                        request_type: detail.request_type || 'Normal',
                                        priority: detail.priority || 'Medium',
                                        description: detail.description || '',
                                        requester_id: detail.requester_id || '',
                                        department_id: detail.department_id || '',
                                        cost_center_id: detail.cost_center_id || '',
                                        branch_factory: detail.branch_factory || '',
                                        delivery_warehouse_id: detail.delivery_warehouse_id || '',
                                        delivery_plant: detail.delivery_plant || '',
                                        delivery_department_id: detail.delivery_department_id || '',
                                        delivery_address: detail.delivery_address || '',
                                        expected_delivery_date: detail.expected_delivery_date ? new Date(detail.expected_delivery_date).toISOString().slice(0, 10) : '',
                                        budget_id: detail.budget_id || '',
                                        items: detail.items && detail.items.length > 0 ? detail.items : [
                                          {
                                            item_id: '', category_id: '', subcategory_id: '', uom_id: '', vendor_id: '', warehouse_id: '',
                                            quantity: '', estimated_unit_price: '', gst: '', currency: '', rack_bin: '', brand: '',
                                            specification: '', remarks: '', current_stock: '', reserved_stock: '', available_stock: '',
                                            reorder_level: '', suggested_qty: '', history: null, recs: []
                                          }
                                        ]
                                      });
                                      setEditingId(pr.id);
                                      setActiveTab('new');
                                    }}
                                    title="Edit"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                )}
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={async () => {
                                    const detail = await storesService.getPRDetail(pr.id);
                                    setSelectedViewItem(detail);
                                  }}
                                  title="Preview"
                                >
                                  <Eye size={16} color="var(--primary)" />
                                </button>
                                {pr.status === 'Requested' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirm({ show: true, id: pr.id, name: pr.pr_number });
                                    }}
                                    title="Cancel Requisition"
                                  >
                                    <Trash2 size={16} color="var(--danger, #ef4444)" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          </div>

      )}
      {/* ────────────────────────────────── TAB 2: MULTI-SECTION REQUEST FORM ────────────────────────────────── */}
      {activeTab === 'new' && (
        <div className="animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Raise New Purchase Requisition
            </h2>
          </div>

          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
              <button
                type="button"
                style={{
                  padding: '16px 24px', background: '#fff',
                  border: 'none', borderBottom: '3px solid var(--primary)',
                  fontWeight: 600, color: 'var(--primary)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Requisition Details
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handlePRSubmit}>
                {notifications.map((notif) => (
                  <div key={notif.id} style={{ padding: '12px 16px', borderRadius: '8px', background: notif.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: notif.type === 'error' ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <AlertTriangle size={18} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{notif.message}</span>
                  </div>
                ))}

                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Requisition Info
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Required Date *</label>
                        <input
                          type="date"
                          value={form.required_date}
                          onChange={(e) => setForm(prev => ({ ...prev, required_date: e.target.value }))}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Type"
                          name="request_type"
                          value={form.request_type}
                          options={['Normal', 'Urgent', 'Emergency']}
                          onChange={(name, val) => setForm(prev => ({ ...prev, [name]: val }))}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Priority"
                          name="priority"
                          value={form.priority}
                          options={['Low', 'Medium', 'High', 'Critical']}
                          onChange={(name, val) => setForm(prev => ({ ...prev, [name]: val }))}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>General Description</label>
                        <textarea
                          value={form.description}
                          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter requisition notes, purpose, machinery specifications..."
                          className="form-control"
                          rows="3"
                        />
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Requester Profile
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <MasterDropdown
                          label="Employee Requisitioner"
                          name="requester_id"
                          entityType="employee"
                          value={form.requester_id}
                          options={masters.employees.map(e => ({ ...e, name: `${e.employee_code} - ${e.name}` }))}
                          required={true}
                          allowCustom={true}
                          onChange={(name, val) => handleEmployeeChange(val)}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Department"
                          name="department_id"
                          entityType="department"
                          value={form.department_id}
                          options={masters.departments}
                          allowCustom={false}
                          onChange={(name, val) => setForm(prev => ({ ...prev, [name]: val }))}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Cost Center"
                          name="cost_center_id"
                          entityType="cost_center"
                          value={form.cost_center_id}
                          options={masters.costCenters.map(c => ({ ...c, name: `${c.code} - ${c.name}` }))}
                          required={true}
                          allowCustom={true}
                          onChange={(name, val) => setForm(prev => ({ ...prev, [name]: val }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Branch / Factory</label>
                        <input
                          type="text"
                          value={form.branch_factory}
                          onChange={(e) => setForm(prev => ({ ...prev, branch_factory: e.target.value }))}
                          placeholder="Enter Branch or Factory"
                          className="form-control"
                        />
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Material Line Items</span>
                      <button
                        type="button"
                        onClick={addMaterialRow}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, fontWeight: 'normal' }}
                      >
                        <Plus size={14} /> Add Row
                      </button>
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {form.items.map((row, index) => (
                        <div key={index} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, position: 'relative', background: 'var(--bg-secondary)' }}>
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMaterialRow(index)}
                              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              title="Remove Row"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                              <div className="flex justify-between items-center mb-2">
                                <label style={{ margin: 0 }}>Select Item *</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...form.items];
                                    updated[index].is_manual = !updated[index].is_manual;
                                    updated[index].item_id = "";
                                    updated[index].item_name = "";
                                    setForm(prev => ({ ...prev, items: updated }));
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                >
                                  {row.is_manual ? "Select Master" : "Type Manual"}
                                </button>
                              </div>
                              {row.is_manual ? (
                                <input
                                  type="text"
                                  placeholder="Type custom item name..."
                                  value={row.item_name || ""}
                                  onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                  required
                                  className="form-control"
                                />
                              ) : (
                                <MasterDropdown
                                  label=""
                                  name="item_id"
                                  entityType="item"
                                  value={row.item_id}
                                  options={masters.items.map(i => ({ ...i, name: `${i.item_code} - ${i.item_name}` }))}
                                  required={true}
                                  onChange={(name, val) => handleItemChange(index, name, val)}
                                />
                              )}
                            </div>
                            <div className="form-group">
                              <MasterDropdown
                                label="UOM"
                                name="uom_id"
                                entityType="uom"
                                value={row.uom_id}
                                options={masters.uoms}
                                onChange={(name, val) => handleItemChange(index, name, val)}
                              />
                            </div>
                            <div className="form-group">
                              <MasterDropdown
                                label="Category"
                                name="category_id"
                                entityType="category"
                                value={row.category_id}
                                options={masters.categories}
                                onChange={(name, val) => handleItemChange(index, name, val)}
                              />
                            </div>
                            <div className="form-group">
                              <label>Qty Requested *</label>
                              <input
                                type="number"
                                min="1" step="any"
                                value={row.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                required
                                className="form-control"
                              />
                            </div>
                            <div className="form-group">
                              <label>Est Unit Price</label>
                              <input
                                type="number"
                                min="0" step="any"
                                value={row.estimated_unit_price}
                                onChange={(e) => handleItemChange(index, 'estimated_unit_price', parseFloat(e.target.value) || 0)}
                                className="form-control"
                              />
                            </div>
                          </div>

                          {row.item_id && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '12px 16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 6, fontSize: 12, color: '#1e3a8a', marginTop: 16 }}>
                              <div>Current Stock: <span style={{ fontWeight: 800 }}>{row.current_stock}</span></div>
                              <div>Reserved Stock: <span style={{ fontWeight: 800 }}>{row.reserved_stock}</span></div>
                              <div>Available Stock: <span style={{ fontWeight: 800 }}>{row.available_stock}</span></div>
                              <div>Reorder Level: <span style={{ fontWeight: 800 }}>{row.reorder_level}</span></div>
                              <div>Suggested Qty: <span style={{ fontWeight: 800, color: '#4338ca' }}>{row.suggested_qty}</span></div>
                            </div>
                          )}

                          {row.item_id && row.recs && row.recs.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 6, fontSize: 12, color: '#064e3b', marginTop: 12 }}>
                              <Sparkles size={14} style={{ color: '#059669' }} />
                              <div>
                                <span style={{ fontWeight: 700 }}>AI Vendor recommendation:</span> {row.recs[0].vendor_name} offers this item at {row.recs[0].price} INR with {row.recs[0].delivery_time} lead time.
                              </div>
                            </div>
                          )}

                          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                            <div className="form-group">
                              <MasterDropdown
                                label="WAREHOUSE LOCATION"
                                name="warehouse_id"
                                value={row.warehouse_id}
                                options={masters.warehouses.map(w => ({ ...w, name: w.warehouse_name }))}
                                onChange={(name, val) => handleItemChange(index, name, val)}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>RACK / BIN LOCATION</label>
                              <input
                                type="text"
                                value={row.rack_bin}
                                onChange={(e) => handleItemChange(index, 'rack_bin', e.target.value)}
                                placeholder="e.g. Rack A / Shelf 2"
                                className="form-control"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>BRAND / MAKER</label>
                              <input
                                type="text"
                                value={row.brand}
                                onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                                placeholder="Servo, Tex, etc."
                                className="form-control"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>REMARKS / SPECS</label>
                              <input
                                type="text"
                                value={row.remarks}
                                onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                placeholder="URGENT rebuild spare ref"
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Budget & Delivery Controls
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="form-group">
                        <MasterDropdown
                          label="Allocated Budget Code"
                          name="budget_id"
                          entityType="budget"
                          value={form.budget_id}
                          options={masters.budgets.map(b => ({ ...b, name: `${b.budget_code} (Project: ${b.project_code})` }))}
                          required={true}
                          allowCustom={true}
                          onChange={(name, val) => {
                            setForm(prev => ({ ...prev, [name]: val }));
                            validateRequisitionBudget(form.items, val);
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Available Budget</label>
                        <input
                          type="text"
                          disabled
                          value={
                            form.budget_id
                              ? (masters.budgets.find(b => b.id === parseInt(form.budget_id))?.budget_available || 0).toLocaleString() + ' INR'
                              : '0 INR'
                          }
                          className="form-control"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Used Budget</label>
                        <input
                          type="text"
                          disabled
                          value={
                            form.budget_id
                              ? (masters.budgets.find(b => b.id === parseInt(form.budget_id))?.budget_used || 0).toLocaleString() + ' INR'
                              : '0 INR'
                          }
                          className="form-control"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Estimated Total</label>
                        <div style={{ padding: '10px 14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 8, color: '#1d4ed8', fontWeight: 800, fontSize: 14 }}>
                          {calculateGrandTotal().toLocaleString()} INR
                        </div>
                      </div>
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 2fr', marginTop: 20 }}>
                      <div className="form-group">
                        <MasterDropdown
                          label="Delivery Warehouse"
                          name="delivery_warehouse_id"
                          entityType="warehouse"
                          value={form.delivery_warehouse_id}
                          options={masters.warehouses.map(w => ({ ...w, name: w.warehouse_name }))}
                          required={true}
                          allowCustom={true}
                          onChange={(name, val) => setForm(prev => ({ ...prev, [name]: val }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Expected Delivery Date</label>
                        <input
                          type="date"
                          value={form.expected_delivery_date}
                          onChange={(e) => setForm(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Delivery Address</label>
                        <input
                          type="text"
                          value={form.delivery_address}
                          onChange={(e) => setForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                          placeholder="Enter Delivery Address"
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('list')}>
                    <X size={16} /> Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                    {submitLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────── TAB 4: ANALYTICS & CHARTS ────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, animation: 'fadeIn 0.3s ease' }}>

          {/* Dept wise purchase requisitions */}
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              Department Requisition Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stats.deptDistribution.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No data found.</p>
              ) : (
                stats.deptDistribution.map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <span>{d.name}</span>
                      <span>{d.value} Requests</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 4, width: `${Math.min(100, (d.value / Math.max(1, stats.totalPRs)) * 100)}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category purchase distribution */}
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              Category Materials Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stats.catDistribution.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No data found.</p>
              ) : (
                stats.catDistribution.map((c, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <span>{c.name}</span>
                      <span>{c.value} Items</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#10b981', borderRadius: 4, width: `${Math.min(100, (c.value / Math.max(1, stats.totalPRs * 2)) * 100)}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              Monthly Purchase Requisitions Trend
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, paddingTop: 24, borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
              {stats.monthlyTrend.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 60 }}>
                  <div
                    style={{
                      width: '100%',
                      background: 'var(--primary)',
                      borderRadius: '6px 6px 0 0',
                      height: `${(t.value / 450000) * 140 + 20}px`,
                      transition: 'height 0.3s ease'
                    }}
                  ></div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{t.month}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>{(t.value / 1000)}k</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Approval Modal Drawer */}
      {approvalModal.open && (
        <div className="modal-overlay fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 1050 }}>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full space-y-4 m-4">

            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Shield size={20} className="text-blue-600" />
                Submit Requisition Approval
              </h3>
              <button
                onClick={() => setApprovalModal(prev => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Approval Stage</label>
                <select
                  value={approvalModal.stage}
                  onChange={(e) => setApprovalModal(prev => ({ ...prev, stage: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                >
                  <option value="Department Manager Approval">Department Manager Approval</option>
                  <option value="Store Manager Approval">Store Manager Approval</option>
                  <option value="Purchase Manager Approval">Purchase Manager Approval</option>
                  <option value="Finance Approval">Finance Approval</option>
                  <option value="Final Approval">Final Approval</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Action</label>
                <select
                  value={approvalModal.status}
                  onChange={(e) => setApprovalModal(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                >
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Comments / Reason <span className="text-red-500">*</span></label>
                <textarea
                  value={approvalModal.comments}
                  onChange={(e) => setApprovalModal(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Enter specific comments or reason for approval/rejection..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovalModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
              <button
                onClick={submitApproval}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Log Decision
              </button>
            </div>

          </div>
        </div>
      )}

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
              Are you sure you want to cancel/delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
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
                    await storesService.deletePR(id);
                    showToast("PR deleted successfully.");
                    loadPRData();
                    if (typeof setSelectedViewItem === 'function' && selectedViewItem?.id === id) setSelectedViewItem(null);
                  } catch (err) {
                    showToast("Error deleting PR. It may be in use.", 'error');
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Purchase Requisition Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {selectedViewItem && !selectedViewItem.status?.includes('Approved') && !selectedViewItem.status?.includes('Rejected') && (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, background: '#10b981', color: 'white', border: 'none' }} onClick={() => setApprovalModal({ open: true, prId: selectedViewItem.id, stage: 'Department Manager Approval', status: 'Approved', comments: '' })}>
                    Approve
                  </button>
                )}
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>

                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>PURCHASE REQUISITION</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                <div style={{ padding: '10px 40px 40px 40px' }}>
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(10, 20).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Handloom ERP</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@handloomerp.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.handloomerp.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                      <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

