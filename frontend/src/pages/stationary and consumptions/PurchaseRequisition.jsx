import React, { useState, useEffect } from 'react';
import storesService from '../../services/storesService';
import {
  ClipboardList, Plus, Trash2, Calendar, AlertTriangle, FileText, CheckCircle2, XCircle,
  Clock, TrendingUp, Search, Eye, Edit2, ShieldAlert, Award, FileSpreadsheet, ArrowLeftRight,
  MapPin, Printer, Download, Sparkles, Building, Box, Users, ChevronRight, Check, X, Shield, RefreshCw,
  Save, Loader, ArrowLeft
} from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

export default function PurchaseRequisition() {
  // Navigation tabs: 'list', 'new', 'view', 'analytics'
  const [activeTab, setActiveTab] = useState('list');
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
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
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
    if (!form.required_date || !form.budget_id || !form.requester_id || !form.delivery_warehouse_id) {
      showToast('Please fill in all required coordinates.', 'error');
      return;
    }

    const invalidItem = form.items.some(item => (!item.item_id && !item.item_name) || item.quantity <= 0);
    if (invalidItem) {
      showToast('Please specify valid items and quantities greater than zero.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        required_date: form.required_date ? new Date(form.required_date).toISOString() : null,
        request_type: form.request_type || "Normal",
        priority: form.priority || "Medium",
        description: form.description || null,

        requester_id: parseInt(form.requester_id),
        department_id: parseInt(form.department_id),
        cost_center_id: parseInt(form.cost_center_id),
        branch_factory: form.branch_factory,

        delivery_warehouse_id: parseInt(form.delivery_warehouse_id),
        delivery_plant: form.delivery_plant || null,
        delivery_department_id: form.delivery_department_id ? parseInt(form.delivery_department_id) : null,
        delivery_address: form.delivery_address || null,
        expected_delivery_date: form.expected_delivery_date ? new Date(form.expected_delivery_date).toISOString() : null,

        budget_id: parseInt(form.budget_id),
        items: form.items.map(item => ({
          item_id: parseInt(item.item_id),
          category_id: parseInt(item.category_id),
          subcategory_id: item.subcategory_id ? parseInt(item.subcategory_id) : null,
          uom_id: parseInt(item.uom_id),
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

      await storesService.createPR(payload);
      showToast('Purchase Requisition submitted successfully!');
      setActiveTab('list');
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
      showToast('Submission error. Verify budget codes.', 'error');
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

      {/* Requisition Title Header */}
      {activeTab === 'list' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: "24px",
          background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          marginBottom: "24px"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'rgb(99, 102, 241)',
              padding: '12px',
              borderRadius: '12px'
            }}>
              <ClipboardList size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Purchase Requisition (PR)</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Manage, approve and analyze internal garment factory purchase requisitions.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveTab('list'); loadPRData(); }}
              className={activeTab === 'list' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
            >
              All Requisitions
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={activeTab === 'new' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
            >
              <Plus size={16} />
              New Request
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
            >
              <TrendingUp size={16} />
              Analytics
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Summary Cards */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          <div className="card stat-card" style={{ '--stat-color': '#3b82f6' }}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <ClipboardList size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.totalPRs}</h3>
              <p>Total PRs</p>
            </div>
          </div>

          <div className="card stat-card" style={{ '--stat-color': '#f59e0b' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.pendingApproval}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="card stat-card" style={{ '--stat-color': '#ef4444' }}>
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <h3>{stats.urgentRequests}</h3>
              <p>Urgent Flagged</p>
            </div>
          </div>

          <div className="card stat-card" style={{ '--stat-color': '#10b981' }}>
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
        <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Filters Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '16px 20px', alignItems: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Requisitions ({filteredPRs.length})</h3>
              <div className="search-bar" style={{ position: 'relative', width: 280 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                <input
                  type="text"
                  placeholder="Search PR No or Requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="form-control"
                style={{ width: 'auto', minWidth: 130 }}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-control"
                style={{ width: 'auto', minWidth: 130 }}
              >
                <option value="">All Statuses</option>
                <option value="Requested">Requested</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="form-control"
                style={{ width: 'auto', minWidth: 160 }}
              >
                <option value="">All Departments</option>
                {masters.departments.map(d => (
                  <option key={d.id} value={d.id}>{d.department_name}</option>
                ))}
              </select>

              <button
                onClick={loadPRData}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Refresh Table"
              >
                <RefreshCw size={16} />
              </button>
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
                      <tr key={pr.id}>
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
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={async () => {
                              const detail = await storesService.getPRDetail(pr.id);
                              setSelectedPr(detail);
                              setActiveTab('view');
                            }}
                            style={{ padding: 6, borderRadius: 8, color: '#3b82f6', background: '#eff6ff', cursor: "pointer", border: "none", marginRight: pr.status === 'Requested' ? 8 : 0 }}
                            title="View details"
                          >
                            <Eye size={13} />
                          </button>
                          {pr.status === 'Requested' && (
                            <button
                              onClick={async () => {
                                if (confirm("Are you sure you want to cancel/delete this requisition?")) {
                                  await storesService.deletePR(pr.id);
                                  showToast("PR deleted successfully.");
                                  loadPRData();
                                }
                              }}
                              style={{ padding: 6, borderRadius: 8, color: '#ef4444', background: '#fef2f2', cursor: "pointer", border: "none" }}
                              title="Cancel Requisition"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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

          <div className="card" style={{ padding: 0 }}>
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
                          value={form.requester_id}
                          options={masters.employees.map(e => ({...e, name: `${e.employee_code} - ${e.name}`}))}
                          required={true}
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
                          onChange={(name, val) => setForm(prev => ({ ...prev, [name]: val }))}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Cost Center"
                          name="cost_center_id"
                          value={form.cost_center_id}
                          options={masters.costCenters.map(c => ({...c, name: `${c.code} - ${c.name}`}))}
                          required={true}
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
                            options={masters.items.map(i => ({...i, name: `${i.item_code} - ${i.item_name}`}))}
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
                          options={masters.warehouses.map(w => ({...w, name: w.warehouse_name}))}
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
                          value={form.budget_id}
                          options={masters.budgets.map(b => ({...b, name: `${b.budget_code} (Project: ${b.project_code})`}))}
                          required={true}
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
                          value={form.delivery_warehouse_id}
                          options={masters.warehouses.map(w => ({...w, name: w.warehouse_name}))}
                          required={true}
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

      {/* ────────────────────────────────── TAB 3: DETAILS & TIMELINE WORKFLOW ────────────────────────────────── */}
      {activeTab === 'view' && selectedPr && (
        <div className="space-y-6">

          {/* Main PR view Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">

            {/* Action headers */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('list')}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                >
                  <ArrowLeft size={16} className="text-slate-600" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedPr.pr_number}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Created on: {new Date(selectedPr.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary px-4 py-2"
                >
                  <Printer size={16} /> Print Requisition
                </button>

                {/* If still requested stage -> authorize approval comments submission */}
                {!selectedPr.status.includes('Approved') && !selectedPr.status.includes('Rejected') && (
                  <button
                    onClick={() => setApprovalModal({
                      open: true,
                      prId: selectedPr.id,
                      stage: 'Department Manager Approval',
                      status: 'Approved',
                      comments: ''
                    })}
                    className="btn btn-primary px-4 py-2"
                  >
                    <Check size={16} /> Submit Approval
                  </button>
                )}
              </div>
            </div>

            {/* Layout grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Header profile cards */}
              <div className="space-y-1">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Requester Details</p>
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="font-bold text-slate-800">{selectedPr.requester_name}</div>
                  <div className="text-xs text-slate-500">{selectedPr.department_name}</div>
                  <div className="text-xs text-slate-400">Branch: {selectedPr.branch_factory}</div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Delivery Coordinates</p>
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="font-bold text-slate-800">{selectedPr.delivery_warehouse_name}</div>
                  <div className="text-xs text-slate-500">Address: {selectedPr.delivery_address}</div>
                  <div className="text-xs text-slate-400">Required: {new Date(selectedPr.required_date).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Budget Settings</p>
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="font-bold text-slate-800">Budget: {selectedPr.budget_code}</div>
                  <div className="text-xs text-slate-500">Priority: <span className="font-bold text-blue-600">{selectedPr.priority}</span></div>
                  <div className="text-xs text-slate-400">Request Type: {selectedPr.request_type}</div>
                </div>
              </div>

            </div>

            {/* Description note */}
            {selectedPr.description && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                <div className="font-bold text-slate-800 text-xs uppercase mb-1">Requisition Notes</div>
                {selectedPr.description}
              </div>
            )}

            {/* Line items table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Line Items list</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                      <th className="p-3">Material Code</th>
                      <th className="p-3">Material Name</th>
                      <th className="p-3">UOM</th>
                      <th className="p-3">Warehouse</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Est. Unit Price</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {selectedPr.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-800">{item.item_code}</td>
                        <td className="p-3">{item.item_name}</td>
                        <td className="p-3">{item.uom_name}</td>
                        <td className="p-3">{item.warehouse_name} (Rack: {item.rack_bin})</td>
                        <td className="p-3 text-right font-semibold">{item.quantity}</td>
                        <td className="p-3 text-right">{item.estimated_unit_price} INR</td>
                        <td className="p-3 text-right font-bold text-slate-800">{(item.quantity * item.estimated_unit_price).toLocaleString()} INR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval Workflow timeline logs */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Shield className="text-blue-600" size={18} />
                Approval Stages Timeline
              </h4>

              <div className="relative border-l-2 border-blue-100 ml-4 pl-6 space-y-6">

                {/* Seed Step */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white"></div>
                  <div className="text-xs font-bold text-slate-700">Requisition Submitted</div>
                  <div className="text-[11px] text-slate-400">Logged in by Requester</div>
                </div>

                {/* Database Approvals loop */}
                {selectedPr.approvals.map((app, index) => (
                  <div key={index} className="relative">
                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white ${app.status === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}></div>
                    <div className="text-xs font-bold text-slate-700">{app.stage} - <span className={
                      app.status === 'Approved' ? 'text-emerald-600' : 'text-rose-600'
                    }>{app.status}</span></div>
                    <div className="text-[11px] text-slate-500 font-semibold">{app.approver_name} ({app.designation})</div>
                    <div className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-lg">
                      "{app.comments}"
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(app.action_date).toLocaleString()}</div>
                  </div>
                ))}

                {/* Final status display */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white ${selectedPr.status === 'Approved' ? 'bg-emerald-500' :
                      selectedPr.status === 'Rejected' ? 'bg-rose-500' : 'bg-slate-200'
                    }`}></div>
                  <div className="text-xs font-bold text-slate-500">Current Status: <span className="font-extrabold text-blue-600">{selectedPr.status}</span></div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* ────────────────────────────────── TAB 4: ANALYTICS & CHARTS ────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, animation: 'fadeIn 0.3s ease' }}>

          {/* Dept wise purchase requisitions */}
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, gridColumn: '1 / -1' }}>
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

    </div>
  );
}
