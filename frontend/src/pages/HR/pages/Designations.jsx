import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, X, Save, Edit2, Trash2, Users, TrendingUp, ChevronUp, ChevronDown, Eye, Building2, Award, DollarSign, FileText, Filter, LayoutList, LayoutGrid, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, RefreshCw, Calendar, Download, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import { fetchDesignations, createDesignation, updateDesignation, deleteDesignation, fetchDepartments } from '../../../services/hrService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDesignation, setViewingDesignation] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [dateFilter, setDateFilter] = useState('All');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);

  const initialForm = {
    title: '',
    code: '',
    level: '',
    department: '',
    min_salary: '',
    max_salary: '',
    experience: '',
    skill_category: '',
    status: 'Active',
    description: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadDesignations();
    loadDepartments();
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true') {
      setShowForm(true);
    }
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await fetchDepartments();
      setDeptList(data || []);
    } catch (e) {
      console.error('Failed to load departments:', e);
    }
  };

  const loadDesignations = async () => {
    setLoading(true);
    try {
      const data = await fetchDesignations();
      setDesignations(data || []);
    } catch (e) {
      console.error('Failed to load designations:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.title) {
      alert('Please fill required fields');
      return;
    }

    const payload = { ...form };
    
    // Clean up empty strings for numbers and optionals
    if (payload.min_salary === '') payload.min_salary = null;
    if (payload.max_salary === '') payload.max_salary = null;
    if (payload.department === '') payload.department = null;
    if (payload.description === '') payload.description = null;

    try {
      if (editingId) {
        await updateDesignation(editingId, payload);
      } else {
        await createDesignation(payload);
      }
      loadDesignations();
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (e) {
      console.error('Failed to save designation:', e);
      alert('Failed to save designation');
    }
  };

  const handleEdit = (des) => {
    setForm({
      title: des.title || '',
      code: des.code || '',
      level: des.grade || '',
      department: des.department || '',
      min_salary: des.min_salary || '',
      max_salary: des.max_salary || '',
      experience: des.experience || '',
      skill_category: des.skill_category || '',
      status: des.status || 'Active',
      description: des.description || ''
    });
    setEditingId(des.id);
    setShowForm(true);
  };

  const handleView = (des) => {
    setViewingDesignation(des);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this designation?')) return;
    try {
      await deleteDesignation(id);
      loadDesignations();
    } catch (e) {
      console.error('Failed to delete designation:', e);
      alert('Failed to delete designation');
    }
  };

  const departments = [...new Set(designations.map(d => d.department).filter(Boolean))];
  const levels = [...new Set(designations.map(d => d.grade).filter(Boolean))];

  const filteredDesignations = designations.filter(des => {
    const matchesSearch = !searchTerm || 
      des.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      des.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      des.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDepartment || des.department === filterDepartment;
    const matchesLevel = !filterLevel || des.grade === filterLevel;
    const matchesStatus = filterStatus === 'All Status' || des.status === filterStatus || (!des.status && filterStatus === 'Active');
    const matchesDate = dateFilter === 'All' || (dateFilter === 'ThisMonth' && des.created_at && new Date(des.created_at).getMonth() === new Date().getMonth() && new Date(des.created_at).getFullYear() === new Date().getFullYear());
    return matchesSearch && matchesDept && matchesLevel && matchesStatus && matchesDate;
  }).sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const totalPages = Math.ceil(filteredDesignations.length / itemsPerPage);
  const paginatedDesignations = filteredDesignations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: designations.length,
    active: designations.filter(d => d.status === 'Active' || !d.status).length,
    inactive: designations.filter(d => d.status === 'Inactive').length,
    depts: new Set(designations.map(d => d.department).filter(Boolean)).size,
    newThisMonth: designations.filter(d => d.created_at && new Date(d.created_at).getMonth() === new Date().getMonth() && new Date(d.created_at).getFullYear() === new Date().getFullYear()).length
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Designations Report", 14, 15);
    const tableColumn = ["#", "Code", "Name", "Department", "Level", "Status"];
    const tableRows = [];

    filteredDesignations.forEach((des, index) => {
      tableRows.push([
        index + 1,
        des.code || '-',
        des.title,
        des.department || '-',
        des.grade || '-',
        des.status || 'Active'
      ]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Designations_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredDesignations.map((des, index) => ({
      "#": index + 1,
      "Code": des.code || '-',
      "Name": des.title,
      "Department": des.department || '-',
      "Level": des.grade || '-',
      "Status": des.status || 'Active'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Designations");
    XLSX.writeFile(workbook, `Designations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatSalary = (amount) => {
    if (!amount) return '—';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
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
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={24} color="var(--primary)" /> Designations
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage job titles, grades, and salary bands.</p>
            </div>

            {/* RIGHT: Search + Add button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                placeholder="Search designations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ width: 200, margin: 0 }}
              />
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add Designation
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div 
              className="card stat-card" 
              onClick={() => { setFilterStatus('All Status'); setDateFilter('All'); setCurrentPage(1); }}
              style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: filterStatus === 'All Status' && dateFilter === 'All' ? '2px solid #6366f1' : '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={24} />
              </div>
              <div className="stat-details">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>Total Designations</h3>
                <div className="value" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{stats.total}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>All Designations</div>
              </div>
            </div>
            
            <div 
              className="card stat-card" 
              onClick={() => { setFilterStatus('Active'); setDateFilter('All'); setCurrentPage(1); }}
              style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: filterStatus === 'Active' && dateFilter === 'All' ? '2px solid #10B981' : '1px solid rgba(16,185,129,0.2)', boxShadow: '0 4px 12px rgba(16,185,129,0.05)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                <ShieldCheck size={24} />
              </div>
              <div className="stat-details">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>Active Designations</h3>
                <div className="value" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{stats.active}</div>
                <div style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: 500 }}>Currently Active</div>
              </div>
            </div>

            <div 
              className="card stat-card" 
              onClick={() => { setFilterStatus('Inactive'); setDateFilter('All'); setCurrentPage(1); }}
              style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: filterStatus === 'Inactive' && dateFilter === 'All' ? '2px solid #ef4444' : '1px solid rgba(239,68,68,0.2)', boxShadow: '0 4px 12px rgba(239,68,68,0.05)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                <ShieldAlert size={24} />
              </div>
              <div className="stat-details">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>Inactive Designations</h3>
                <div className="value" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{stats.inactive}</div>
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 500 }}>Currently Inactive</div>
              </div>
            </div>

            <div 
              className="card stat-card" 
              onClick={() => { setDateFilter('ThisMonth'); setFilterStatus('All Status'); setCurrentPage(1); }}
              style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: dateFilter === 'ThisMonth' ? '2px solid #8b5cf6' : '1px solid rgba(139,92,246,0.2)', boxShadow: '0 4px 12px rgba(139,92,246,0.05)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Calendar size={24} />
              </div>
              <div className="stat-details">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>New This Month</h3>
                <div className="value" style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{stats.newThisMonth}</div>
                <div style={{ fontSize: 12, color: '#8b5cf6', marginTop: 4 }}>Added This Month</div>
              </div>
            </div>
          </div>

          {/* Filters Area */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search designation..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="form-control"
                style={{ margin: 0, paddingLeft: 44, width: '100%', height: 44, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              />
            </div>
            
            <select
              value={filterDepartment}
              onChange={(e) => { setFilterDepartment(e.target.value); setCurrentPage(1); }}
              className="form-control"
              style={{ width: 180, margin: 0, height: 44, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setCurrentPage(1); }}
              className="form-control"
              style={{ width: 150, margin: 0, height: 44, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <option value="">All Levels</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="form-control"
              style={{ width: 150, margin: 0, height: 44, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <option value="All Status">All Status</option>
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
            <div className="card" style={{ padding: 0, overflowX: 'auto', borderRadius: 12 }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(99, 102, 241, 0.04)', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left' }}>CODE <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left' }}>DESIGNATION NAME <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left' }}>DEPARTMENT <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left' }}>LEVEL <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'left' }}>STATUS <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} /></th>
                    <th style={{ padding: '16px 20px', color: '#6366f1', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>ACTIONS</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDesignations.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No designations found</td></tr>
                  ) : paginatedDesignations.map((des, idx) => (
                    <tr key={des.id} style={{ transition: 'background-color 0.2s', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#475569', fontWeight: 500 }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{des.code || '—'}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{des.title}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                          {des.department || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                          {des.grade || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: des.status === 'Active' || !des.status ? '#10B981' : '#ef4444' }}></span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: des.status === 'Active' || !des.status ? '#10B981' : '#ef4444' }}>
                            {des.status || 'Active'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleView(des)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                            <Eye size={14} color="#6366f1" />
                          </button>
                          <button onClick={() => handleEdit(des)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                            <Edit2 size={14} color="#3b82f6" />
                          </button>
                          <button onClick={() => handleDelete(des.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Showing {filteredDesignations.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDesignations.length)} of {filteredDesignations.length} entries</span>
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
                         className={currentPage === page ? 'btn btn-primary' : 'btn btn-secondary'}
                         style={{ padding: '6px 12px', borderRadius: 8, border: currentPage === page ? 'none' : '1px solid #e2e8f0', backgroundColor: currentPage === page ? '#6366f1' : '#fff', color: currentPage === page ? '#fff' : '#64748b', cursor: 'pointer' }}
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
              {filteredDesignations.map(des => (
                <div key={des.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>{des.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleView(des)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Eye size={14} color="var(--primary)" />
                      </button>
                      <button onClick={() => handleEdit(des)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(des.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    {des.department && (
                      <span className="badge badge-inactive">
                        <Building2 size={12} style={{ marginRight: 4 }} /> {des.department}
                      </span>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Salary Range</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                      {formatSalary(des.min_salary)} - {formatSalary(des.max_salary)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Form Inline */}
      {showForm && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit' : 'Add'} Designation</h2>
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
                  Designation Information
                </legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Designation Code <span style={{color: 'red'}}>*</span></label>
                    <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="form-control" placeholder="DSG-001" />
                  </div>
                  <div className="form-group">
                    <label>Designation Name <span style={{color: 'red'}}>*</span></label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-control" placeholder="Senior Software Engineer" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department <span style={{color: 'red'}}>*</span></label>
                    <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="form-control">
                      <option value="">Select Department</option>
                      {deptList.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Grade / Level <span style={{color: 'red'}}>*</span></label>
                    <input type="text" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="form-control" placeholder="L4" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Min Salary</label>
                    <input type="number" value={form.min_salary} onChange={(e) => setForm({ ...form, min_salary: parseInt(e.target.value) || '' })} className="form-control" placeholder="800000" />
                  </div>
                  <div className="form-group">
                    <label>Max Salary</label>
                    <input type="number" value={form.max_salary} onChange={(e) => setForm({ ...form, max_salary: parseInt(e.target.value) || '' })} className="form-control" placeholder="1500000" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Experience Required</label>
                    <input type="text" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="form-control" placeholder="5+ Years" />
                  </div>
                  <div className="form-group">
                    <label>Skill Category</label>
                    <input type="text" value={form.skill_category} onChange={(e) => setForm({ ...form, skill_category: e.target.value })} className="form-control" placeholder="Technical" />
                  </div>
                </div>

                <div className="form-row">
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
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="form-control" placeholder="Job description and responsibilities..." />
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}

      {/* View Inline */}
      {showViewModal && viewingDesignation && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>View Designation</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  <X size={16} /> Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingDesignation);
                  }}
                  className="btn btn-primary"
                >
                  <Edit2 size={16} /> Edit
                </button>
              </div>
            </div>
            
            <form style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Designation Information
                </legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Designation Code</label>
                    <input type="text" value={viewingDesignation.code || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Designation Name</label>
                    <input type="text" value={viewingDesignation.title || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input type="text" value={viewingDesignation.department || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Grade / Level</label>
                    <input type="text" value={viewingDesignation.grade || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Min Salary</label>
                    <input type="number" value={viewingDesignation.min_salary || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Max Salary</label>
                    <input type="number" value={viewingDesignation.max_salary || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Experience Required</label>
                    <input type="text" value={viewingDesignation.experience || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Skill Category</label>
                    <input type="text" value={viewingDesignation.skill_category || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <input type="text" value={viewingDesignation.status || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea value={viewingDesignation.description || ''} disabled rows={2} className="form-control" />
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
