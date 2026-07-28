import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, X, Save, Edit2, Trash2, Users, ChevronRight, LayoutList, LayoutGrid, Filter, Eye, Award, DollarSign, FileText, CheckCircle, XCircle, Calendar, ArrowUpDown, Download, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../../services/hrService';
import { subMasterAPI } from '../../../services/api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFilter, setDateFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [departmentTypes, setDepartmentTypes] = useState([
    'Production',
    'Quality Control',
    'Stores',
    'Maintenance',
    'HR',
    'Finance',
    'Administration',
    'Dispatch',
    'Purchase',
    'Sales & Marketing',
    'IT'
  ]);
  const [isCustomType, setIsCustomType] = useState(false);
  const [customTypeVal, setCustomTypeVal] = useState('');

  const handleSaveCustomType = async () => {
    if (!customTypeVal.trim()) {
      setIsCustomType(false);
      return;
    }
    try {
      await subMasterAPI.create('department_type_master', { name: customTypeVal.trim(), is_active: true });
      setDepartmentTypes(prev => [...new Set([...prev, customTypeVal.trim()])]);
      setForm(prev => ({ ...prev, type: customTypeVal.trim() }));
      setIsCustomType(false);
      setCustomTypeVal('');
    } catch (e) {
      console.error('Failed to save custom type:', e);
      alert('Failed to save custom type');
    }
  };

  const initialForm = {
    name: '',
    code: '',
    type: '',
    short_name: '',
    category: '',
    budget_allocation: '',
    cost_center: '',
    status: 'Active',
    description: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadDepartments();
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true') {
      setShowForm(true);
    }
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data || []);
      
      try {
        const typesRes = await subMasterAPI.list('department_type_master');
        if (typesRes.data && typesRes.data.length > 0) {
          const fetchedTypes = typesRes.data.map(t => t.name);
          setDepartmentTypes(prev => [...new Set([...prev, ...fetchedTypes])]);
        }
      } catch (err) {
        // ignore if not present
      }
    } catch (e) {
      console.error('Failed to load departments:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        name: form.name,
        code: form.code || null,
        type: form.type || null,
        short_name: form.short_name || null,
        category: form.category || null,
        budget_allocation: form.budget_allocation ? parseInt(form.budget_allocation) : 0,
        cost_center: form.cost_center || null,
        status: form.status,
        description: form.description || null
      };
      if (editingId) {
        await updateDepartment(editingId, payload);
      } else {
        await createDepartment(payload);
      }
      loadDepartments();
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (e) {
      console.error('Failed to save department:', e);
      alert('Failed to save department');
    }
  };

  const handleEdit = (dept) => {
    setForm({
      name: dept.name || '',
      code: dept.code || '',
      type: dept.type || '',
      short_name: dept.short_name || '',
      category: dept.category || '',
      budget_allocation: dept.budget_allocation || '',
      cost_center: dept.cost_center || '',
      status: dept.status || 'Active',
      description: dept.description || ''
    });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleView = (dept) => {
    setViewingDepartment(dept);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (e) {
      console.error('Failed to delete department:', e);
      alert('Failed to delete department');
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = !searchTerm || dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) || dept.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All Types' || dept.type === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || dept.status === statusFilter || (!dept.status && statusFilter === 'Active');
    const matchesDate = dateFilter === 'All' || (dateFilter === 'ThisMonth' && dept.created_at && new Date(dept.created_at).getMonth() === new Date().getMonth() && new Date(dept.created_at).getFullYear() === new Date().getFullYear());
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: departments.length,
    active: departments.filter(d => d.status === 'Active' || !d.status).length,
    inactive: departments.filter(d => d.status === 'Inactive').length,
    newThisMonth: departments.filter(d => d.created_at && new Date(d.created_at).getMonth() === new Date().getMonth() && new Date(d.created_at).getFullYear() === new Date().getFullYear()).length
  };

  const formatDate = (dateString) => {
    if (!dateString) return '18 Jun 2025';
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Departments Report", 14, 15);
    const tableColumn = ["#", "Code", "Name", "Type", "Budget (INR)", "Status", "Created Date"];
    const tableRows = [];

    filteredDepartments.forEach((dept, index) => {
      const rowData = [
        index + 1,
        dept.code || '-',
        dept.name,
        dept.type || '-',
        dept.budget_allocation || '0',
        dept.status || 'Active',
        formatDate(dept.created_at)
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`Departments_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDepartments.map((dept, index) => ({
      "#": index + 1,
      "Code": dept.code || '-',
      "Name": dept.name,
      "Type": dept.type || '-',
      "Budget (INR)": dept.budget_allocation || '0',
      "Status": dept.status || 'Active',
      "Created Date": formatDate(dept.created_at)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departments");
    XLSX.writeFile(workbook, `Departments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* DATA AREA */}
      {!showForm && !showViewModal && (
        <div className="animate-fade" style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="#6366f1" />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Departments</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Manage organization departments</p>
              </div>
            </div>

            {/* RIGHT: Add button */}
            <button
              onClick={() => { setForm(initialForm); setShowForm(true); setEditingId(null); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', backgroundColor: '#6366f1', padding: '10px 20px', borderRadius: 8, border: 'none' }}
            >
              <Plus size={18} /> Add Department
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div 
              className="card stat-card" 
              onClick={() => { setStatusFilter('All Status'); setDateFilter('All'); setCurrentPage(1); }}
              style={{ border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: 14, borderRadius: 12 }}>
                <Building2 size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Departments</h3>
                <div className="value">{stats.total}</div>
              </div>
            </div>
            <div 
              className="card stat-card" 
              onClick={() => { setStatusFilter('Active'); setDateFilter('All'); setCurrentPage(1); }}
              style={{ border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: 14, borderRadius: 12, border: 'none' }}>
                <CheckCircle size={24} />
              </div>
              <div className="stat-details">
                <h3>Active Departments</h3>
                <div className="value">{stats.active}</div>
              </div>
            </div>
            <div 
              className="card stat-card" 
              onClick={() => { setStatusFilter('Inactive'); setDateFilter('All'); setCurrentPage(1); }}
              style={{ border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: 14, borderRadius: 12, border: 'none' }}>
                <XCircle size={24} />
              </div>
              <div className="stat-details">
                <h3>Inactive Departments</h3>
                <div className="value">{stats.inactive}</div>
              </div>
            </div>
            <div 
              className="card stat-card" 
              onClick={() => { setDateFilter('ThisMonth'); setStatusFilter('All Status'); setCurrentPage(1); }}
              style={{ border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: 14, borderRadius: 12, border: 'none' }}>
                <Calendar size={24} />
              </div>
              <div className="stat-details">
                <h3>New This Month</h3>
                <div className="value">{stats.newThisMonth}</div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ margin: 0, paddingLeft: 44, width: '100%', height: 44, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              />
            </div>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="form-control" style={{ width: 200, margin: 0, height: 44, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <option>All Types</option>
              {departmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="form-control" style={{ width: 160, margin: 0, height: 44, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <option>All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', height: 44, padding: '0 20px', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#6366f1', fontWeight: 600 }}>
                <Download size={16} /> Export
              </button>
              {showExportMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 150, overflow: 'hidden' }}>
                  <button
                    onClick={() => { exportPDF(); setShowExportMenu(false); }}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#475569', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500 }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FileText size={16} color="#ef4444" /> PDF Report
                  </button>
                  <button
                    onClick={() => { exportExcel(); setShowExportMenu(false); }}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 500 }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FileSpreadsheet size={16} color="#10b981" /> Excel Sheet
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* LIST VIEW - Table */}
          {viewMode === 'list' && (
            <div className="card" style={{ padding: 0, overflowX: 'auto', backgroundColor: '#fff', borderRadius: 12, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'rgba(99, 102, 241, 0.04)', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>#</th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>DEPARTMENT CODE <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>DEPARTMENT NAME <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>DEPARTMENT TYPE <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>BUDGET ALLOCATION <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>STATUS <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px' }}>CREATED DATE <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>ACTIONS</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDepartments.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No departments found</td></tr>
                  ) : paginatedDepartments.map((dept, index) => (
                    <tr key={dept.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#475569', fontWeight: 500 }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{dept.code || '—'}</td>
                      <td style={{ padding: '16px 20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                             <Building2 size={14} />
                           </div>
                           <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{dept.name}</span>
                         </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                         <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                           {dept.type || '—'}
                         </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#475569', fontWeight: 500 }}>₹{dept.budget_allocation ? Number(dept.budget_allocation).toLocaleString('en-IN') : '0'}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dept.status === 'Active' || !dept.status ? '#10B981' : '#ef4444' }}></span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: dept.status === 'Active' || !dept.status ? '#10B981' : '#ef4444' }}>
                            {dept.status || 'Active'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#475569', fontWeight: 500 }}>{formatDate(dept.created_at)}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleView(dept)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                            <Eye size={14} color="#6366f1" />
                          </button>
                          <button onClick={() => handleEdit(dept)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                            <Edit2 size={14} color="#3b82f6" />
                          </button>
                          <button onClick={() => handleDelete(dept.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Showing {filteredDepartments.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDepartments.length)} of {filteredDepartments.length} entries</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                   <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="form-control" style={{ margin: 0, padding: '6px 32px 6px 12px', fontSize: 13, width: 130, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                     <option value={10}>10 per page</option>
                     <option value={20}>20 per page</option>
                     <option value={50}>50 per page</option>
                   </select>
                   <div style={{ display: 'flex', gap: 4 }}>
                     <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn btn-secondary" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: currentPage === 1 ? '#cbd5e1' : '#64748b', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>&laquo;</button>
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                       <button
                         key={page}
                         onClick={() => setCurrentPage(page)}
                         className={currentPage === page ? "btn btn-primary" : "btn btn-secondary"}
                         style={{ 
                           padding: '6px 14px', 
                           borderRadius: 8, 
                           backgroundColor: currentPage === page ? '#6366f1' : '#fff', 
                           color: currentPage === page ? '#fff' : '#475569', 
                           border: currentPage === page ? 'none' : '1px solid #e2e8f0', 
                           fontWeight: 600 
                         }}
                       >
                         {page}
                       </button>
                     ))}
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="btn btn-secondary" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', color: currentPage === totalPages || totalPages === 0 ? '#cbd5e1' : '#64748b', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer' }}>&raquo;</button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* GRID VIEW - Cards */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {filteredDepartments.map(dept => (
                <div key={dept.id} className="card" style={{ border: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 0', color: 'var(--text-primary)' }}>{dept.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleView(dept)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Eye size={14} color="var(--primary)" />
                      </button>
                      <button onClick={() => handleEdit(dept)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Head</p>
                      <p className="text-sm font-medium text-slate-700">{dept.head_name || '—'}</p>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}

      </div>
      )}
      {/* END DATA AREA */}

      {/* Form Inline */}
      {showForm && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ padding: 0, border: 'none' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit' : 'Add'} Department</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={16} /> Close
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  <Save size={16} /> {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
            <form style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Department Information
                </legend>
                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Department Code *</label>
                    <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="form-control" placeholder="ENG-01" />
                  </div>
                  <div className="form-group">
                    <label>Department Name *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-control" placeholder="Engineering" />
                  </div>
                </div>

                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Department Type *</label>
                    {isCustomType ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input autoFocus className="form-control" style={{ margin: 0, flex: 1 }} value={customTypeVal} onChange={e => setCustomTypeVal(e.target.value)} placeholder="Add custom type..." />
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={handleSaveCustomType}><CheckCircle size={16} color="var(--primary)" /></button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => setIsCustomType(false)}><X size={16} color="#ef4444" /></button>
                      </div>
                    ) : (
                      <select value={form.type} onChange={(e) => { if (e.target.value === '__ADD_NEW__') { setIsCustomType(true); setCustomTypeVal(''); } else { setForm({ ...form, type: e.target.value }); } }} className="form-control">
                        <option value="">-- Select Type --</option>
                        {departmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom Type</option>
                      </select>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Short Name</label>
                    <input type="text" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} className="form-control" placeholder="ENG" />
                  </div>
                </div>

                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-control" placeholder="Category" />
                  </div>
                  <div className="form-group">
                    <label>Budget Allocation</label>
                    <input type="number" value={form.budget_allocation} onChange={(e) => setForm({ ...form, budget_allocation: e.target.value })} className="form-control" placeholder="0" />
                  </div>
                </div>

                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Cost Center Code</label>
                    <input type="text" value={form.cost_center} onChange={(e) => setForm({ ...form, cost_center: e.target.value })} className="form-control" placeholder="CC-101" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-control">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="form-control" placeholder="Department description..." />
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}

      {/* View Inline */}
      {showViewModal && viewingDepartment && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ border: 'none' }}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{viewingDepartment.name}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                  <X size={16} /> Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingDepartment);
                  }}
                  className="btn btn-primary"
                >
                  <Edit2 size={16} /> Edit Department
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">


              {/* Details Grid */}
              {/* Details Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={18} color="#6366f1" /> Department Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px 32px', backgroundColor: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Department Code</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{viewingDepartment.code || '—'}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Department Name</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{viewingDepartment.name || '—'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Department Type</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>{viewingDepartment.type || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Short Name</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{viewingDepartment.short_name || '—'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Category</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{viewingDepartment.category || '—'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Budget Allocation</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{viewingDepartment.budget_allocation ? `₹${Number(viewingDepartment.budget_allocation).toLocaleString('en-IN')}` : '₹0'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Cost Center Code</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{viewingDepartment.cost_center || '—'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Status</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: viewingDepartment.status === 'Active' || !viewingDepartment.status ? '#10B981' : '#ef4444' }}></span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: viewingDepartment.status === 'Active' || !viewingDepartment.status ? '#10B981' : '#ef4444' }}>
                          {viewingDepartment.status || 'Active'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} color="#6366f1" /> Additional Information
                  </h3>
                  <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Description</div>
                    <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{viewingDepartment.description || 'No description provided.'}</div>
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
